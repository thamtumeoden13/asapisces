// File: lib/actions/precache.action.ts
"use server";

import { generateSpeechAction } from "./tts.action";
import type { ProcessorResult, QualityTier } from "@/types";
import { processInBatches } from "@/lib/batchProcessor";
import { supabase } from "../supabase/server";
import crypto from "crypto";

interface PrecacheParams {
  processedData: ProcessorResult;
  voiceId: string; // Cần voiceId để biết giọng nào cần cache
  companionId: string;
}

interface CacheJob {
  line: string;
  qualityTier: QualityTier;
}

/**
 * Lặp qua tất cả các câu thoại của AI trong một transcript đã xử lý
 * và gọi generateSpeechAction để tạo và cache chúng.
 */

export async function precacheAudioForCompanionAction({
  processedData,
  voiceId,
  companionId,
}: PrecacheParams): Promise<{
  success: boolean;
  message?: string;
}> {
  if (!processedData?.podcastTopics || !voiceId) {
    return { success: false, message: "Invalid input data." };
  }

  const uniqueLines = Array.from(
    new Set(
      Object.values(processedData.podcastTopics)
        .flat()
        .map((entry) => entry.text)
    )
  );

  if (uniqueLines.length === 0) {
    return { success: true, message: "No unique lines to cache." };
  }

  console.log(
    `[PRECACHE] Found ${uniqueLines.length} unique lines to process for companion ${companionId}.`
  );

  const baseCacheKeys = uniqueLines.map((line) => {
    const textHash = crypto.createHash("sha256").update(line).digest("hex");
    return `${voiceId}_${textHash}`;
  });

  const { data: existingCache, error: checkError } = await supabase
    .from("cached_audios")
    .select("cache_key, quality_tier")
    .in("cache_key", baseCacheKeys); // Sử dụng mảng key đã tạo

  if (checkError) {
    console.error("[PRECACHE] Failed to check existing cache:", checkError);
    // Có thể quyết định dừng lại hoặc tiếp tục mà không kiểm tra cache
  }

  const existingCacheSet = new Set(
    existingCache?.map((item) => `${item.cache_key}:${item.quality_tier}`)
  );

  console.log(`[PRECACHE] Starting STAGE 1: Caching all 'standard' audio...`);

  // Tạo jobs còn thiếu cho cả 2 tier
  const standardJobsToDo: CacheJob[] = []; // Bắt đầu với mảng rỗng
  const premiumJobsToDo: CacheJob[] = []; // Bắt đầu với mảng rỗng

  uniqueLines.forEach((line, index) => {
    const baseKey = baseCacheKeys[index];
    if (!existingCacheSet.has(`${baseKey}:standard`)) {
      standardJobsToDo.push({ line, qualityTier: "standard" }); // Chỉ push những gì còn thiếu
    }
    if (!existingCacheSet.has(`${baseKey}:premium`)) {
      premiumJobsToDo.push({ line, qualityTier: "premium" }); // Chỉ push những gì còn thiếu
    }
  });

  const totalPossibleJobs = uniqueLines.length * 2;
  const skippedCount =
    totalPossibleJobs - (standardJobsToDo.length + premiumJobsToDo.length);
  console.log(
    `[PRECACHE] Jobs to do: ${standardJobsToDo.length} standard, ${premiumJobsToDo.length} premium. Skipped: ${skippedCount}.`
  );

  if (standardJobsToDo.length === 0 && premiumJobsToDo.length === 0) {
    await supabase
      .from("companions")
      .update({ status: "ready" })
      .eq("id", companionId);
    return { success: true, message: "All audio is already cached and ready." };
  }

  try {
    // --- GIAI ĐOẠN 1: CACHE 'STANDARD' ---
    if (standardJobsToDo.length > 0) {
      console.log(
        `[PRECACHE] STAGE 1: Caching ${standardJobsToDo.length} 'standard' audio files...`
      );
      const BATCH_SIZE = 10;
      const DELAY_MS = 2000;

      const standardResults = await processInBatches(
        standardJobsToDo,
        (job) =>
          generateSpeechAction({
            text: job.line,
            voiceId,
            qualityTier: job.qualityTier,
          }),
        BATCH_SIZE,
        DELAY_MS
      );

      const standardErrorCount = standardResults.filter(
        (r) => !r.success
      ).length;
      if (standardErrorCount > 0) {
        await supabase
          .from("companions")
          .update({ status: "failed" })
          .eq("id", companionId);
        throw new Error(
          `${standardErrorCount} standard audio files failed to cache.`
        );
      }
    }

    // --- CẬP NHẬT STATUS THÀNH 'READY' ---
    await supabase
      .from("companions")
      .update({ status: "ready" })
      .eq("id", companionId);
    console.log(
      `[PRECACHE] STAGE 1 COMPLETE. Companion ${companionId} is now 'ready'.`
    );

    // --- GIAI ĐOẠN 2: CACHE 'PREMIUM' Ở HẬU TRƯỜNG ---
    if (premiumJobsToDo.length > 0) {
      (async () => {
        console.log(
          `[PRECACHE] STAGE 2: Caching ${premiumJobsToDo.length} 'premium' audio files in the background...`
        );
        await processInBatches(
          premiumJobsToDo, // Chỉ xử lý những job premium còn thiếu
          (job) =>
            generateSpeechAction({
              text: job.line,
              voiceId,
              qualityTier: job.qualityTier,
            }),
          5,
          2000
        );
        console.log(
          `[PRECACHE] STAGE 2 (Premium) COMPLETE for companion ${companionId}.`
        );
      })();
    }

    return {
      success: true,
      message:
        "Companion is ready. Premium audio is being cached in the background.",
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred.";
    // Đảm bảo status được set là 'failed' nếu có lỗi nghiêm trọng ở Giai đoạn 1
    await supabase
      .from("companions")
      .update({ status: "failed" })
      .eq("id", companionId);
    return { success: false, message: errorMessage };
  }
}
