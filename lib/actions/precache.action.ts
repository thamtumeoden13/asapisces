// File: lib/actions/precache.action.ts
"use server";

import { generateSpeechAction } from "./tts.action";
import type { ProcessorResult } from "@/types";
import { processInBatches } from "@/lib/batchProcessor";

interface PrecacheParams {
  processedData: ProcessorResult;
  voiceId: string; // Cần voiceId để biết giọng nào cần cache
}

/**
 * Lặp qua tất cả các câu thoại của AI trong một transcript đã xử lý
 * và gọi generateSpeechAction để tạo và cache chúng.
 */

export async function precacheAudioForCompanionAction({
  processedData,
  voiceId,
}: PrecacheParams): Promise<{
  success: boolean;
  cachedCount: number;
  errorCount: number;
}> {
  if (!processedData?.podcastTopics || !voiceId) {
    return { success: false, cachedCount: 0, errorCount: 0 };
  }

  const aiLines = new Set<string>();
  Object.values(processedData.podcastTopics)
    .flat()
    .forEach((entry) => {
      aiLines.add(entry.text);
    });
  const linesToCache = Array.from(aiLines);

  console.log(
    `[PRECACHE] Starting to cache ${linesToCache.length} unique AI lines...`
  );

  // --- THAY THẾ Promise.all BẰNG processInBatches ---

  // Gói miễn phí của ElevenLabs rất hạn chế, hãy bắt đầu với một batch size nhỏ
  const BATCH_SIZE = 5;
  const DELAY_MS = 2000; // Chờ 2 giây giữa các đợt

  const results = await processInBatches(
    linesToCache,
    (line) => generateSpeechAction(line, voiceId), // Hàm xử lý cho mỗi dòng
    BATCH_SIZE,
    DELAY_MS
  );

  // Đếm kết quả
  const cachedCount = results.filter((r) => r.success).length;
  const errorCount = results.length - cachedCount;

  // Log các lỗi (nếu có)
  results.forEach((result, index) => {
    if (!result.success) {
      console.error(
        `[PRECACHE] Failed to cache line: "${linesToCache[index].substring(0, 30)}...". Error: ${result.error}`
      );
    }
  });

  console.log(
    `[PRECACHE] Finished. Success: ${cachedCount}, Failed: ${errorCount}`
  );

  return { success: errorCount === 0, cachedCount, errorCount };
}
