// File: lib/actions/translate.action.ts (Sử dụng thư viện miễn phí)
"use server";

// Import thư viện miễn phí
import { translate } from "google-translate-api-browser";

// Cache để tránh gọi API cho cùng một văn bản nhiều lần
const translationCache = new Map<string, string>();

export async function translateTextAction(
  textToTranslate: string,
  targetLanguage: string = "vi" // Mặc định là Tiếng Việt
): Promise<{ success: boolean; translatedText?: string; error?: string }> {
  if (!textToTranslate) {
    return { success: false, error: "No text provided to translate." };
  }

  const cacheKey = `${targetLanguage}:${textToTranslate}`;
  if (translationCache.has(cacheKey)) {
    console.log("Translation found in cache.");
    return { success: true, translatedText: translationCache.get(cacheKey) };
  }

  console.log(`Translating: "${textToTranslate}"`);

  try {
    // Gọi hàm dịch từ thư viện mới
    // KHÔNG CẦN API KEY
    const translationResult = await translate(textToTranslate, {
      to: targetLanguage,
    });

    // Thư viện này trả về một object, chúng ta cần lấy ra phần text
    const translatedText = translationResult.text;

    // Lưu kết quả vào cache
    translationCache.set(cacheKey, translatedText);

    return { success: true, translatedText: translatedText };
  } catch (error) {
    console.error("Translation Error:", error);
    // Xử lý lỗi một cách chung chung hơn vì lỗi có thể đa dạng
    if (error instanceof Error) {
      // Lỗi thường gặp là do rate limiting (ví dụ: mã lỗi 429)
      if (error.message.includes("429")) {
        return {
          success: false,
          error: "Too many requests. Please try again in a moment.",
        };
      }
      return {
        success: false,
        error: "Translation service is currently unavailable.",
      };
    }
    return { success: false, error: "An unknown translation error occurred." };
  }
}
