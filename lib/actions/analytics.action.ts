// File: lib/actions/analytics.action.ts
"use server";

import { auth } from "@/auth";
import { supabase } from "@/lib/supabase/server";

/**
 * Ghi nhận các từ người dùng phát âm sai vào database.
 * @param {string[]} incorrectWords - Mảng các từ bị phát âm sai.
 */
export async function recordPronunciationErrorsAction(
  incorrectWords: string[]
) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId || incorrectWords.length === 0) {
    return { success: false, error: "Unauthorized or no words to record." };
  }

  // Chuẩn hóa các từ: viết thường, loại bỏ ký tự đặc biệt
  const sanitizedWords = incorrectWords
    .map((word) => word.toLowerCase().replace(/[^a-z'-]/g, ""))
    .filter(Boolean); // Lọc ra các chuỗi rỗng

  if (sanitizedWords.length === 0) {
    return { success: true };
  }

  // Tạo một mảng các object để upsert
  const upsertData = sanitizedWords.map((word) => ({
    user_id: userId,
    word: word,
    // Chúng ta sẽ dùng logic trong hàm PostgreSQL để tăng `error_count`
  }));

  try {
    // Gọi hàm RPC để thực hiện upsert và tăng `error_count`
    const { error } = await supabase.rpc("record_errors", {
      p_errors: upsertData,
    });

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error("Error recording pronunciation errors:", error);
    return { success: false, error: "Database error." };
  }
}

export type PronunciationError = {
  word: string;
  error_count: number;
};

/**
 * Lấy danh sách các từ hay phát âm sai nhất của người dùng hiện tại.
 * @param {number} limit - Số lượng từ tối đa cần lấy.
 * @returns {Promise<PronunciationError[]>} Mảng các từ và số lần sai.
 */
export async function getTopPronunciationErrorsAction(
  limit: number = 5
): Promise<PronunciationError[]> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return []; // Trả về mảng rỗng nếu không có người dùng
  }

  try {
    const { data, error } = await supabase
      .from("user_pronunciation_errors")
      .select("word, error_count")
      .eq("user_id", userId)
      .order("error_count", { ascending: false }) // Sắp xếp theo số lần sai giảm dần
      .limit(limit);

    if (error) {
      console.error("Error fetching top pronunciation errors:", error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Failed to get top pronunciation errors:", error);
    return []; // Trả về mảng rỗng khi có lỗi
  }
}
