// File: app/actions/feedbackActions.ts
"use server"; // Đánh dấu đây là file Server Action

import { z } from "zod";
import { supabase } from "../supabase/server";
import { auth } from "@/auth";
import { conversationFeedbackSchema } from "../zodSchema";
import { Feedback, GetFeedbackByInterviewIdParams } from "@/types";

type FeedbackData = z.infer<typeof conversationFeedbackSchema>;

export async function saveConversationFeedbackAction(data: FeedbackData) {
  console.log("Saving feedback data:", data);
  // Xác thực dữ liệu đầu vào
  const validation = conversationFeedbackSchema.safeParse(data);
  console.log("Validation result:", validation);
  if (!validation.success) {
    console.error("Invalid feedback data:", validation.error);
    return { success: false, error: "Invalid data provided." };
  }

  console.log("Validated feedback data:", validation.data);

  try {
    const { error } = await supabase.from("conversation_feedbacks").insert({
      user_id: data.userId,
      topic_id: data.topicId,
      companion_id: data.companionId,
      total_score: data.totalScore,
      category_scores: data.categoryScores,
      strengths: data.strengths,
      areas_for_improvement: data.areasForImprovement,
      final_assessment: data.finalAssessment,
    });

    console.log("Insert operation result:", { error });

    if (error) {
      console.error("Supabase insert error:", error);
      throw error; // Ném lỗi để catch block xử lý
    }

    console.log("✅ Feedback saved successfully for user:", data.userId);
    return { success: true };
  } catch (error) {
    console.log("Error saving feedback:", error);
    return {
      success: false,
      error: "Failed to save feedback to the database.",
    };
  }
}

// Kiểu dữ liệu cho một điểm dữ liệu trên biểu đồ
export type FeedbackHistoryPoint = {
  date: string;
  score: number;
};

export async function getFeedbackHistoryForTopic(
  topicId: string
): Promise<FeedbackHistoryPoint[]> {
  const session = await auth();
  console.log("Current session:", session);
  const userId = session?.user?.id;
  if (!userId) {
    // Luôn trả về mảng rỗng nếu không có người dùng
    return [];
  }

  try {
    // 3. Xây dựng và thực thi truy vấn bằng Supabase client
    const { data: history, error } = await supabase
      .from("conversation_feedbacks")
      // Chỉ chọn các cột cần thiết để tối ưu hóa
      .select("total_score, created_at")
      // Lọc theo người dùng hiện tại VÀ topic được chỉ định
      .eq("user_id", userId)
      .eq("topic_id", topicId)
      // Sắp xếp theo ngày tạo để biểu đồ hiển thị đúng thứ tự
      .order("created_at", { ascending: true })
      // Giới hạn số lượng kết quả trả về
      .limit(20);
    console.log("Fetched feedback history:", { history, error });
    // 4. Kiểm tra lỗi từ Supabase
    if (error) {
      console.error("Supabase error fetching feedback history:", error);
      // Ném lỗi để báo cho nơi gọi hàm biết có vấn đề
      throw error;
    }

    // 5. Định dạng lại dữ liệu để Recharts có thể sử dụng
    if (!history) {
      return [];
    }

    return history.map((item) => ({
      score: item.total_score,
      // Định dạng ngày thành dạng ngắn gọn, ví dụ: "Jul 20"
      date: new Date(item.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
    }));
  } catch (error) {
    // Bắt các lỗi khác (ví dụ: lỗi mạng) và trả về mảng rỗng
    console.error("Error in getFeedbackHistoryForTopic:", error);
    return [];
  }
}

export type FeedbackHistoryCompletedTopic = {
  topicId: string;
};

export const getCompletedTopicForCompanion = async (
  companionId: string
): Promise<FeedbackHistoryCompletedTopic[] | []> => {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from("conversation_feedbacks")
      .select("topic_id", { count: "exact" })
      .eq("user_id", userId)
      .eq("companion_id", companionId)
      .neq("total_score", 0); // Chỉ lấy các topic đã có điểm số khác 0

    if (error) {
      console.error("Supabase error fetching completed topics:", error);
      throw error;
    }

    return data.map((item) => ({
      topicId: item.topic_id,
    }));
  } catch (error) {
    console.error("Error in getCompletedTopicForCompanion:", error);
    return [];
  }
};

export async function getFeedbackByInterviewId(
  params: GetFeedbackByInterviewIdParams
): Promise<Feedback | null> {
  const { interviewId, userId } = params;

  const { data, error } = await supabase
    .from("feedbacks")
    .select("*")
    .eq("interview_id", interviewId)
    .eq("user_id", userId)
    .limit(1)
    .single();

  if (error || !data) {
    console.error(error);
    return null;
  }

  return {
    id: data?.id,
    interviewId: data?.interview_id,
    totalScore: data?.total_score,
    categoryScores: data?.category_scores,
    strengths: data?.strengths,
    areasForImprovement: data?.areas_for_improvement,
    finalAssessment: data?.final_assessment,
    createdAt: data?.created_at,
  } as Feedback;
}
