// File: lib/actions/analytics.action.ts
"use server";

import { auth } from "@/auth";
import { supabase } from "@/lib/supabase/server";

// Cập nhật kiểu dữ liệu đầu vào
interface RecordErrorsParams {
  incorrectWords: string[];
  companionId: string;
  topicId: string;
}

/**
 * Ghi nhận các từ người dùng phát âm sai vào database.
 * @param {string[]} incorrectWords - Mảng các từ bị phát âm sai.
 */
export async function recordPronunciationErrorsAction({
  incorrectWords,
  companionId,
  topicId,
}: RecordErrorsParams) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId || incorrectWords.length === 0 || !companionId || !topicId) {
    return { success: false, error: "Invalid parameters." };
  }

  const sanitizedWords = incorrectWords
    .map((word) => word.toLowerCase().replace(/[^a-z'-]/g, ""))
    .filter(Boolean);

  if (sanitizedWords.length === 0) {
    return { success: true };
  }

  // Thêm companion_id và topic_id vào mỗi object
  const upsertData = sanitizedWords.map((word) => ({
    user_id: userId,
    word: word,
    companion_id: companionId,
    topic_id: topicId,
  }));

  try {
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

interface GetErrorsParams {
  limit?: number;
  companionId?: string;
  topicId?: string;
}

/**
 * Lấy danh sách các từ hay phát âm sai nhất của người dùng hiện tại.
 * @param {number} limit - Số lượng từ tối đa cần lấy.
 * @returns {Promise<PronunciationError[]>} Mảng các từ và số lần sai.
 */
export async function getTopPronunciationErrorsAction({
  limit = 5,
  companionId,
  topicId,
}: GetErrorsParams = {}): Promise<PronunciationError[]> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return [];

  try {
    let query = supabase
      .from("user_pronunciation_errors")
      .select("word, error_count")
      .eq("user_id", userId);

    // Thêm bộ lọc động
    if (companionId) {
      query = query.eq("companion_id", companionId);
    }
    if (topicId) {
      query = query.eq("topic_id", topicId);
    }

    const { data, error } = await query
      .order("error_count", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Failed to get top pronunciation errors:", error);
    return [];
  }
}
