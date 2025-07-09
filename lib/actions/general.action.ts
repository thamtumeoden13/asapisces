"use server";

import { feedbackSchema, languageFeedbackSchema } from "@/constants";
import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { supabase } from "../supabase/server";

export async function getInterviewByUserId(
  userId: string
): Promise<Interview[] | null> {
  if (!userId) return null;

  const { data, error } = await supabase
    .from("interviews")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return null;
  }

  const _data = data.map((interview) => ({
    id: interview.id,
    role: interview.role,
    level: interview.level,
    questions: interview.questions,
    techstack: interview.techstack,
    createdAt: interview.created_at,
    userId: interview.user_id,
    type: interview.type,
    finalized: interview.finalized,
  }));

  return _data as Interview[];
}

export async function getLatestInterviewByUserId(
  params: GetLatestInterviewsParams
): Promise<Interview[] | null> {
  const { userId, limit = 20 } = params;

  if (!userId) return null;

  const { data, error } = await supabase
    .from("interviews")
    .select("*")
    .eq("finalized", true)
    .neq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error(error);
    return null;
  }

  const _data = data.map((interview) => ({
    id: interview.id,
    role: interview.role,
    level: interview.level,
    questions: interview.questions,
    techstack: interview.techstack,
    createdAt: interview.created_at,
    userId: interview.user_id,
    type: interview.type,
    finalized: interview.finalized,
  }));

  return _data as Interview[];
}

export async function getInterviewById(id: string): Promise<Interview | null> {
  const { data, error } = await supabase
    .from("interviews")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error(error);
    return null;
  }

  return data as Interview;
}

export async function createFeedback(params: CreateFeedbackParams) {
  const { interviewId, userId, transcript } = params;

  try {
    const formattedTranscript = transcript
      .map(
        (sentence: { role: string; content: string }) =>
          `- ${sentence.role}: ${sentence.content} \n`
      )
      .join("");

    const {
      object: {
        totalScore,
        categoryScores,
        strengths,
        areasForImprovement,
        finalAssessment,
      },
    } = await generateObject({
      model: google("gemini-2.0-flash-001", {
        structuredOutputs: false,
      }),
      schema: feedbackSchema,
      prompt: `
        You are an AI interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories. Be thorough and detailed in your analysis. Don't be lenient with the candidate. If there are mistakes or areas for improvement, point them out.
        Transcript:
        ${formattedTranscript}

        Please score the candidate from 0 to 100 in the following areas. Do not add categories other than the ones provided:
        - **Communication Skills**: Clarity, articulation, structured responses.
        - **Technical Knowledge**: Understanding of key concepts for the role.
        - **Problem-Solving**: Ability to analyze problems and propose solutions.
        - **Cultural & Role Fit**: Alignment with company values and job role.
        - **Confidence & Clarity**: Confidence in responses, engagement, and clarity.
        `,
      system:
        "You are a professional interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories",
    });

    const { data, error } = await supabase
      .from("feedbacks")
      .insert([
        {
          interview_id: interviewId,
          user_id: userId,
          total_score: totalScore,
          category_scores: categoryScores,
          strengths: strengths,
          areas_for_improvement: areasForImprovement,
          final_assessment: finalAssessment,
          created_at: new Date().toISOString(),
        },
      ])
      .select("id");

    if (error) {
      console.error(error);
      return { success: false };
    }

    return {
      success: true,
      feedbackId: data?.[0]?.id,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
    };
  }
}

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

// Định nghĩa kiểu cho params
interface CreateLanguageFeedbackParams {
  sessionId: string; // Có thể là companionId + topic
  userId: string; // ID của người dùng
  transcript: Array<{ role: "user" | "assistant"; content: string }>; // Lịch sử tin nhắn
  script: Array<{ speaker: string; text: string }>; // Kịch bản gốc để so sánh
}

// 2. SỬA ĐỔI HÀM createFeedback
export async function createLanguageFeedback(
  params: CreateLanguageFeedbackParams
) {
  const { sessionId, userId, transcript, script } = params;

  try {
    // Định dạng transcript và kịch bản để gửi cho AI
    const formattedTranscript = transcript
      .map(
        (msg: { role: string; content: string }) =>
          `- ${msg.role === "user" ? "Learner" : "AI Companion"}: ${msg.content}`
      )
      .join("\n");

    const formattedScript = script
      .map(
        (line: { speaker: string; text: string }) =>
          `- ${line.speaker === "Gwen" ? "Learner (Expected)" : "AI Companion"}: ${line.text}`
      )
      .join("\n");

    const { object: feedbackData } = await generateObject({
      model: google("gemini-2.5-pro"), // Sử dụng model mới hơn nếu có thể
      schema: languageFeedbackSchema,
      prompt: `
        You are an expert AI English tutor. Your task is to provide constructive and encouraging feedback to a student who has just completed a conversation practice session.

        Here is the original script they were supposed to follow:
        --- SCRIPT ---
        ${formattedScript}
        --- END SCRIPT ---

        Here is the actual conversation transcript:
        --- TRANSCRIPT ---
        ${formattedTranscript}
        --- END TRANSCRIPT ---

        Please evaluate the learner's performance based on the provided script and transcript.
        Analyze their speech for the following categories and provide a score from 0 to 100 for each.
        - **Pronunciation**: How clear and accurate was their pronunciation?
        - **Fluency**: Did their speech flow naturally, or was it hesitant and choppy?
        - **Grammar**: Were there any grammatical mistakes? (e.g., subject-verb agreement, tenses).
        - **Vocabulary**: Did they use appropriate words?
        - **Completion**: How well did they stick to the provided script? (A low score here isn't necessarily bad if they were creative, but note it).

        For 'strengths' and 'areasForImprovement', be specific and use examples from their speech. Keep the tone positive and motivational.
      `,
      system:
        "You are an AI English language tutor providing feedback on a practice conversation.",
    });

    console.log("✅ AI Feedback Generated:", feedbackData);

    // Lưu vào Supabase (logic này bạn có thể giữ nguyên hoặc điều chỉnh)
    /*
    const { data, error } = await supabase
      .from("language_feedbacks") // Có thể là một bảng mới
      .insert([
        {
          session_id: sessionId,
          user_id: userId,
          total_score: feedbackData.totalScore,
          category_scores: feedbackData.categoryScores,
          strengths: feedbackData.strengths,
          areas_for_improvement: feedbackData.areasForImprovement,
          final_assessment: feedbackData.finalAssessment,
        },
      ])
      .select("id");

    if (error) {
      console.error("Supabase error:", error);
      return { success: false, feedback: null };
    }

    return {
      success: true,
      feedback: feedbackData, // Trả về cả dữ liệu feedback
      feedbackId: data?.[0]?.id,
    };
    */

    // Tạm thời trả về dữ liệu mà không lưu DB để test
    return {
      success: true,
      feedback: feedbackData,
    };
  } catch (error) {
    console.error("Error generating feedback:", error);
    return { success: false, feedback: null };
  }
}
