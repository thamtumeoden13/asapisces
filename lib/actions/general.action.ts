"use server";

import { feedbackSchema, languageFeedbackSchema } from "@/constants";
import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { supabase } from "../supabase/server";
import {
  CreateFeedbackParams,
  Feedback,
  GetFeedbackByInterviewIdParams,
  GetLatestInterviewsParams,
  Interview,
} from "@/types";
import z from "zod";

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
  userRole: "Leo" | "Gwen"; // Vai trò của người dùng trong kịch bản
}

// 2. SỬA ĐỔI HÀM createFeedback
export async function createLanguageFeedback(
  params: CreateLanguageFeedbackParams
) {
  const { sessionId, userId, transcript, script, userRole } = params;

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

    // Lọc ra chỉ những câu thoại mà người dùng phải nói
    const userScriptLines = script
      .filter((line) => line.speaker === userRole)
      .map((line) => `- ${line.text}`)
      .join("\n");

    // Lấy tên của AI Companion
    const aiCompanionRole = userRole === "Leo" ? "Gwen" : "Leo";

    const { object: feedbackData } = await generateObject({
      model: google("gemini-2.5-pro"), // Sử dụng model mới hơn nếu có thể
      schema: languageFeedbackSchema,
      prompt: `
        You are an expert AI English tutor. Your task is to provide constructive and encouraging feedback to a student who has just completed a conversation practice session.

        **Crucial Context:**
        - The learner was playing the role of: **${userRole}**.
        - The AI companion was playing the role of: **${aiCompanionRole}**.
        - You should ONLY evaluate the learner's performance based on their assigned role's lines.

        Here are the lines the learner was **supposed to say** (their script for the role of ${userRole}):
        --- LEARNER'S SCRIPT (${userRole}) ---
        ${userScriptLines}
        --- END LEARNER'S SCRIPT ---

        Here is the actual conversation transcript, which includes both the learner's speech and the AI's responses:
        --- FULL TRANSCRIPT ---
        ${formattedTranscript}
        --- END FULL TRANSCRIPT ---

        Please evaluate the **learner's (${userRole})** performance based on the provided scripts and transcript.
        Analyze their speech (labeled as "Learner" in the full transcript) for the following categories and provide a score from 0 to 100 for each.
        - **Pronunciation**: How clear and accurate was their pronunciation? (Infer from the text if needed).
        - **Fluency**: Did their speech flow naturally? (Infer from how close they were to the script).
        - **Grammar & Vocabulary**: Did they follow the script's grammar and vocabulary?
        - **Role Adherence**: How well did they stick to their assigned lines as ${userRole}? A low score here is acceptable if they were creative, but you should note any major deviations.

        For 'strengths' and 'areasForImprovement', be specific. Use examples from the "Learner" parts of the full transcript and compare them to the "Learner's Script". Keep the tone positive and motivational.
      `,
      system: `You are an AI English language tutor. The user you are evaluating was playing the role of ${userRole}.`,
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

const aiTutorResponseSchema = z.object({
  directAnswer: z
    .string()
    .describe("A direct and concise answer to the student's question."),
  examples: z
    .array(
      z.object({
        fromTranscript: z
          .string()
          .describe(
            "A specific phrase or sentence the student said (as 'Learner')."
          ),
        suggestion: z
          .string()
          .describe("A corrected or improved version of the phrase."),
      })
    )
    .optional()
    .describe(
      "Specific examples from the conversation to illustrate the point, if applicable."
    ),
  furtherExplanation: z
    .string()
    .optional()
    .describe(
      "A brief, additional explanation or tip related to the question."
    ),
});

// Schema để xác thực dữ liệu đầu vào (giữ nguyên)
const askSchema = z.object({
  question: z.string().min(5, "Question is too short."),
  userRole: z.enum(["Leo", "Gwen"]),
  fullTranscript: z.array(z.object({ role: z.string(), content: z.string() })),
  originalScript: z.array(z.object({ speaker: z.string(), text: z.string() })),
});

type AskData = z.infer<typeof askSchema>;

// Kiểu dữ liệu trả về cho client
export type AITutorResponse = z.infer<typeof aiTutorResponseSchema>;

// --- SERVER ACTION ĐÃ NÂNG CẤP VỚI generateObject ---
export async function askAboutConversationAction(data: AskData): Promise<{
  success: boolean;
  answer?: AITutorResponse; // <-- Trả về object thay vì string
  error?: string;
}> {
  const validation = askSchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: "Invalid data provided." };
  }

  const { question, userRole, fullTranscript, originalScript } =
    validation.data;

  // ... (phần xây dựng ngữ cảnh và prompt giữ nguyên như trước)
  // --- XÂY DỰNG NGỮ CẢNH ---
  const formattedTranscript = fullTranscript
    .map(
      (msg) =>
        `- ${msg.role === "user" ? "Learner" : "AI Companion"}: ${msg.content}`
    )
    .join("\n");

  const userScriptLines = originalScript
    .filter((line) => line.speaker === userRole)
    .map((line) => `- ${line.text}`)
    .join("\n");

  const prompt = `
    You are an expert, friendly, and encouraging AI English language tutor. 
    A student has just finished a practice conversation and has a specific question. 
    Your task is to answer their question clearly and concisely, using the provided context.

    **CONTEXT:**
    1.  **The Learner's Role:** The student was playing the role of "${userRole}".
    2.  **The Learner's Script:** These are the lines the student was supposed to say:
        ---
        ${userScriptLines}
        ---
    3.  **Full Conversation Transcript:** This is what actually happened during the practice session. "Learner" is the student, and "AI Companion" is the other role.
        ---
        ${formattedTranscript}
        ---

    **STUDENT'S QUESTION:**
    "${question}"

    **YOUR TASK:**
    1.  Analyze the student's question in relation to the conversation context.
    2.  Provide a direct, helpful, and easy-to-understand answer in English.
    3.  If the question is about grammar, vocabulary, or pronunciation, use specific examples from their speech ("Learner" lines in the transcript) to illustrate your points.
    4.  Keep the tone positive and supportive. Start your answer directly, without introductory phrases like "As an AI tutor...".
    5.  Format your answer using simple markdown (bold for emphasis, bullet points for lists).
  `;

  try {
    // --- SỬ DỤNG generateObject ---
    const { object: answerObject } = await generateObject({
      model: google("gemini-1.5-flash-latest"),
      schema: aiTutorResponseSchema, // Cung cấp schema cho AI
      prompt: prompt,
      system: `You are an AI English language tutor. The user you are evaluating was playing the role of ${userRole}. You must respond in a structured JSON format.`,
    });

    return { success: true, answer: answerObject };
  } catch (error) {
    console.error("AI SDK Error in askAboutConversationAction:", error);
    return {
      success: false,
      error: "The AI tutor is currently unavailable. Please try again later.",
    };
  }
}

// --- SCHEMA MỚI CHO SMART RETRY ---
const smartRetrySchema = z.object({
  expectedSentence: z.string(),
  userSentence: z.string(),
});

const smartRetryResponseSchema = z.object({
  focusPoint: z
    .string()
    .describe(
      "The single most important word or short phrase the user struggled with (e.g., 'pronunciation of track', 'the phrase fall flat')."
    ),
  encouragingPhrase: z
    .string()
    .describe(
      "A short, positive opening phrase (e.g., 'Almost there!', 'Great effort!', 'You're close!')."
    ),
});

type SmartRetryData = z.infer<typeof smartRetrySchema>;

// --- SERVER ACTION MỚI ---
export async function getSmartRetryFeedbackAction(
  data: SmartRetryData
): Promise<{ success: boolean; feedbackMessage?: string; error?: string }> {
  const validation = smartRetrySchema.safeParse(data);
  if (!validation.success) {
    return { success: false, error: "Invalid data for smart retry." };
  }

  const { expectedSentence, userSentence } = validation.data;

  // Nếu câu người dùng nói quá ngắn, trả về feedback mặc định, không cần gọi AI
  if (userSentence.split(/\s+/).length < 2) {
    return {
      success: true,
      feedbackMessage: `Let's try the full sentence: "${expectedSentence}"`,
    };
  }

  const prompt = `
    As an AI English coach, analyze the difference between what a student was supposed to say and what they actually said. Your goal is to identify one key area for improvement and provide a positive opening phrase.

    **Context:**
    - Expected Sentence: "${expectedSentence}"
    - Student's Sentence: "${userSentence}"

    **Your Task:**
    Based on the comparison, provide a structured JSON object with two fields:
    1.  'focusPoint': Identify the single most important word or short phrase the user needs to work on. Be specific (e.g., 'the word example', 'pronunciation of 'track'', 'the phrase 'fall flat'').
    2.  'encouragingPhrase': Provide a short, positive opening phrase (e.g., 'Almost there!', 'Great effort!', 'You're close!').
  `;

  try {
    // --- SỬ DỤNG generateObject ---
    const { object: aiFeedback } = await generateObject({
      model: google("gemini-1.5-flash-latest"),
      schema: smartRetryResponseSchema,
      prompt: prompt,
      system: "You are an AI English coach that responds in structured JSON.",
    });

    // --- XÂY DỰNG CÂU PHẢN HỒI CUỐI CÙNG TỪ OBJECT ---
    const feedbackMessage = `${aiFeedback.encouragingPhrase} Let's focus on ${aiFeedback.focusPoint}. Try saying the full sentence: "${expectedSentence}"`;

    return { success: true, feedbackMessage };
  } catch (error) {
    console.error("AI SDK error in getSmartRetryFeedbackAction:", error);
    // Fallback nếu AI gặp lỗi
    return {
      success: false,
      error: "AI feedback is unavailable, using default message.",
      feedbackMessage: `Let's practice that again: "${expectedSentence}"`,
    };
  }
}
