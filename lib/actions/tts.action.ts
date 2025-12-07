// File: lib/actions/tts.action.ts
"use server";

import { auth } from "@/auth";
import { getUserCredits, deductCredits } from "./credits.action";
import { ElevenLabsClient } from "elevenlabs";
import { CREDIT_COSTS } from "@/constants";
import { hasUnlimitedCredits } from "../permissions";

/**
 * Tạo audio từ ElevenLabs và trả về dưới dạng ArrayBuffer.
 * Đã tích hợp kiểm tra và trừ credit.
 */
export async function generateSpeechAction(
  text: string,
  voiceId: string
): Promise<{ success: boolean; audioBuffer?: ArrayBuffer; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };
  if (!text) return { success: false, error: "No text provided" };

  // 1. Tính toán chi phí
  const cost =
    Math.ceil(text.length / 1000) * CREDIT_COSTS.ELEVENLABS_TTS_PER_1000_CHARS;

  try {
    const [isUnlimited, currentCredits] = await Promise.all([
      hasUnlimitedCredits(),
      getUserCredits(),
    ]);

    // 2. Kiểm tra credit
    if (!isUnlimited && currentCredits < cost) {
      return {
        success: false,
        error: "Insufficient credits for high-quality voice.",
      };
    }

    // 3. Gọi API ElevenLabs trực tiếp từ Server Action
    const client = new ElevenLabsClient({
      apiKey: process.env.ELEVENLABS_API_KEY,
    });
    const audioStream = await client.generate({
      voice: voiceId,
      text: text,
      model_id: "eleven_turbo_v2", // Nên dùng model nhanh cho hội thoại
    });

    // Chuyển stream thành Buffer -> ArrayBuffer
    const chunks: Buffer[] = [];
    for await (const chunk of audioStream) {
      chunks.push(chunk);
    }
    const audioBuffer = Buffer.concat(chunks).buffer;

    if (!isUnlimited) {
      // 4. Trừ credit SAU KHI thành công
      await deductCredits(cost);
    }

    // 5. Trả về ArrayBuffer cho client
    return { success: true, audioBuffer };
  } catch (error) {
    console.error("ElevenLabs Action error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, error: errorMessage };
  }
}
