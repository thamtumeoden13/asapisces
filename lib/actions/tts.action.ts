// File: lib/actions/tts.action.ts
"use server";

import { auth } from "@/auth";
import { getUserCredits, deductCredits } from "./credits.action";
import { ElevenLabsClient } from "elevenlabs";
import { CREDIT_COSTS } from "@/constants";
import { hasUnlimitedCredits } from "../permissions";

import { put } from "@vercel/blob";
import crypto from "crypto";
import { supabase } from "../supabase/server";

/**
 * Tạo audio từ ElevenLabs và trả về dưới dạng ArrayBuffer.
 * Đã tích hợp kiểm tra và trừ credit.
 */
export async function generateSpeechAction(
  text: string,
  voiceId: string
): Promise<{ success: boolean; audioUrl?: string; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Unauthorized" };
  if (!text) return { success: false, error: "No text provided" };

  // 1. Tạo một key duy nhất cho cặp (text, voiceId)
  const textHash = crypto.createHash("sha256").update(text).digest("hex");
  const cacheKey = `${voiceId}_${textHash}`;

  try {
    // 2. Kiểm tra cache trong bảng `cached_audios`
    const { data: cached, error: cacheError } = await supabase
      .from("cached_audios")
      .select("audio_url")
      .eq("text_hash", cacheKey)
      .single();

    if (cacheError && cacheError.code !== "PGRST116") {
      // Bỏ qua lỗi 'không tìm thấy'
      throw cacheError;
    }

    if (cached) {
      console.log(`[AUDIO CACHE] HIT for: "${text.substring(0, 20)}..."`);
      return { success: true, audioUrl: cached.audio_url };
    }

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

    // 4. Gọi API ElevenLabs trực tiếp từ Server Action
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

    // 5. Upload audio lên dịch vụ lưu trữ (Vercel Blob)
    const blob = await put(`audio/${cacheKey}.mp3`, audioBuffer, {
      access: "public",
      contentType: "audio/mpeg",
    });

    const { url: audioUrl } = blob; // Lấy URL công khai

    // 6. Lưu thông tin vào database để cache cho lần sau
    const { error: insertError } = await supabase.from("cached_audios").insert({
      text_hash: cacheKey,
      voice_id: voiceId,
      audio_url: audioUrl,
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
    console.error("ElevenLabs Action error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, error: errorMessage };
  }
}
