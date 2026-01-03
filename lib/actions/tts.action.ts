// File: lib/actions/tts.action.ts
"use server";

import { auth } from "@/auth";
import { getUserCredits, deductCredits } from "./credits.action";
import { ElevenLabsClient } from "elevenlabs";
import { CREDIT_COSTS, TIER_MODELS } from "@/constants";
import { hasUnlimitedCredits } from "../permissions";

import { put } from "@vercel/blob";
import crypto from "crypto";
import { supabase } from "../supabase/server";
import { GenerateSpeechParams, QualityTier } from "@/types";

/**
 * Tạo audio từ ElevenLabs và trả về dưới dạng ArrayBuffer.
 * Đã tích hợp kiểm tra và trừ credit.
 */

export async function generateSpeechAction({
  text,
  voiceId,
  qualityTier = "standard",
}: GenerateSpeechParams): Promise<{
  success: boolean;
  audioUrl?: string;
  error?: string;
}> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };
  if (!text) return { success: false, error: "No text provided" };

  // 1. Tạo một key duy nhất cho cặp (text, voiceId)
  const textHash = crypto.createHash("sha256").update(text).digest("hex");
  const cacheKey = `${voiceId}_${textHash}`;

  try {
    // 1. Luôn kiểm tra cache cho cả hai tier nếu có thể
    const { data: cachedAudios, error: cacheError } = await supabase
      .from("cached_audios")
      .select("audio_url, quality_tier")
      .eq("cache_key", cacheKey);

    if (cacheError) throw cacheError;

    // Tìm trong kết quả trả về
    const premiumAudio = cachedAudios?.find(
      (a) => a.quality_tier === "premium"
    );
    const standardAudio = cachedAudios?.find(
      (a) => a.quality_tier === "standard"
    );

    // 2. Logic trả về dựa trên tier yêu cầu
    if (qualityTier === "premium") {
      if (premiumAudio) {
        console.log(`[CACHE] HIT for tier 'premium'`);
        return { success: true, audioUrl: premiumAudio.audio_url };
      }
      if (standardAudio) {
        console.log(`[CACHE] FALLBACK for 'premium', using 'standard'.`);
        // Kích hoạt cache premium ở hậu trường
        // Bọc tác vụ nền trong một hàm async để bắt lỗi tiềm ẩn
        (async () => {
          try {
            console.log(
              `[BACKGROUND] Starting to generate 'premium' audio for: ${cacheKey}`
            );
            await createAndCacheAudio(text, voiceId, "premium", cacheKey);
            console.log(
              `[BACKGROUND] Successfully generated 'premium' audio for: ${cacheKey}`
            );
          } catch (e) {
            console.error(
              `[BACKGROUND] Failed to generate 'premium' audio for ${cacheKey}:`,
              e
            );
          }
        })();
        
        return { success: true, audioUrl: standardAudio.audio_url };
      }
    } else {
      // Yêu cầu là 'standard'
      if (standardAudio) {
        console.log(`[CACHE] HIT for tier 'standard'`);
        return { success: true, audioUrl: standardAudio.audio_url };
      }
    }

    // 3. Nếu không tìm thấy bất kỳ cache nào, tạo mới
    console.log(
      `[CACHE] MISS for all tiers. Generating new for '${qualityTier}'`
    );
    return await createAndCacheAudio(text, voiceId, qualityTier, cacheKey);
  } catch (error) {
    console.error("ElevenLabs Action error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, error: errorMessage };
  }
}

/**
 * Hàm helper nội bộ để thực hiện việc tạo và cache audio.
 * Có thể được gọi ở chế độ "fire-and-forget".
 */
async function createAndCacheAudio(
  text: string,
  voiceId: string,
  qualityTier: QualityTier,
  cacheKey: string
) {
  try {
    console.log(`[AUDIO CACHE] MISS for: "${text.substring(0, 20)}..."`);

    const [isUnlimited, currentCredits] = await Promise.all([
      hasUnlimitedCredits(),
      getUserCredits(),
    ]);

    // 3. Tính toán chi phí và kiểm tra credit
    const cost =
      Math.ceil(text.length / 1000) *
      CREDIT_COSTS.ELEVENLABS_TTS_PER_1000_CHARS;

    if (!isUnlimited && currentCredits < cost) {
      return {
        success: false,
        error: "Insufficient credits for high-quality voice.",
      };
    }

    const modelId = TIER_MODELS[qualityTier];

    // 4. Gọi API ElevenLabs trực tiếp từ Server Action
    const client = new ElevenLabsClient({
      apiKey: process.env.ELEVENLABS_API_KEY,
    });
    const audioStream = await client.generate({
      voice: voiceId,
      text: text,
      model_id: modelId, // Chọn model dựa trên tier
    });

    // Chuyển stream thành Buffer -> ArrayBuffer
    const chunks: Buffer[] = [];
    for await (const chunk of audioStream) {
      chunks.push(chunk);
    }
    const audioBuffer = Buffer.concat(chunks);
    if (audioBuffer.length === 0) {
      throw new Error("ElevenLabs returned an empty audio buffer.");
    }

    // 5. Upload audio lên dịch vụ lưu trữ (Vercel Blob)
    const filePath = `audio/${cacheKey}_${qualityTier}.mp3`;
    const blob = await put(filePath, audioBuffer, {
      access: "public",
      contentType: "audio/mpeg",
      allowOverwrite: true,
    });

    const { url: audioUrl } = blob; // Lấy URL công khai

    // 6. Lưu thông tin vào database để cache cho lần sau
    const { error: insertError } = await supabase.from("cached_audios").insert({
      cache_key: cacheKey,
      voice_id: voiceId,
      audio_url: audioUrl,
      quality_tier: qualityTier,
    });
    if (insertError) {
      // Log lỗi nhưng vẫn tiếp tục trả về audio cho người dùng
      console.error("Failed to save audio to cache DB:", insertError);
    }

    if (!isUnlimited) {
      // 7. Trừ credit SAU KHI thành công
      await deductCredits(cost);
    }

    // 8. Trả về URL của file audio vừa tạo và upload
    return { success: true, audioUrl };
  } catch (error) {
    console.error(
      `Failed to create/cache audio for ${cacheKey} (Tier: ${qualityTier}):`,
      error
    );
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, error: errorMessage };
  }
}
