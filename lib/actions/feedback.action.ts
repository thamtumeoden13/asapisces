// File: app/actions/feedbackActions.ts
"use server"; // Đánh dấu đây là file Server Action

import { z } from "zod";
import { supabase } from "../supabase/server";
import { conversationFeedbackSchema } from "@/constants";

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
