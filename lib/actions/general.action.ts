"use server";

import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { supabase } from "../supabase/server";
import {
  CreateFeedbackParams,
  Feedback,
  GetFeedbackByInterviewIdParams,
  GetLatestInterviewsParams,
  Interview,
  TopicConfig,
} from "@/types";
import z from "zod";
import {
  aiTutorResponseSchema,
  askSchema,
  companionDetailsGenerationSchema,
  feedbackSchema,
  languageFeedbackSchema,
  smartRetryResponseSchema,
  smartRetrySchema,
  topicConfigGenerationSchema,
} from "../zodSchema";
import { subjects } from "@/constants";

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
  const { transcript, script, userRole } = params;

  try {
    // Định dạng transcript và kịch bản để gửi cho AI
    const formattedTranscript = transcript
      .map(
        (msg: { role: string; content: string }) =>
          `- ${msg.role === "user" ? "Learner" : "AI Companion"}: ${msg.content}`
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
      model: google("gemini-2.5-pro"),
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
      feedbackMessage: ''
    };
  }
}

interface GenerateTopicsParams {
  rawTranscript: string;
}

export async function generateTopicConfigAction(
  params: GenerateTopicsParams
): Promise<{
  success: boolean;
  data?: TopicConfig[];
  error?: string;
}> {
  const { rawTranscript } = params;

  if (!rawTranscript || rawTranscript.trim().length < 100) {
    return { success: false, error: "Transcript is too short to process." };
  }

  // --- PROMPT ĐÃ ĐƯỢC CẢI TIẾN HOÀN TOÀN ---
  const prompt = `
    You are an expert AI assistant that processes podcast transcripts for educational use. Your primary goal is to divide a long transcript into smaller, logical, and well-sized topics.

    **Transcript to Analyze:**
    ---
    ${rawTranscript}
    ---

    **Core Rules (Follow these strictly):**
    1.  **Topic Splitting Logic:** Your main task is to split the transcript into multiple continuous topics. The number of topics is FLEXIBLE. You should decide the optimal number of topics based on the content flow.
    2.  **Strict Length Constraints:** Each topic you create MUST have a minimum of **15 lines** and a maximum of **30 lines** of dialogue. This rule is more important than the total number of topics.
    3.  **Find Natural Breaks:** When deciding where to split topics, prioritize natural conversational breaks. A good split point is often where a new question is asked or the subject shifts. Avoid splitting in the middle of a continuous explanation.
    4.  **Critical 'keyword' Rule:** The 'keyword' field for each topic MUST be the exact first line of dialogue for that topic block, BUT with the speaker's name and colon (e.g., "Leo: " or "Gwen: ") REMOVED. For example, if the line is "Leo: Hey everyone!", the keyword must be "Hey everyone!".
    5.  **Content Integrity:** Do not invent, paraphrase, or modify any of the original dialogue.

    Generate a JSON array of topic objects based on all the rules above. The final output must be only the JSON array.
  `;

  try {
    const { object: generatedConfig } = await generateObject({
      model: google("gemini-2.5-pro"),
      schema: topicConfigGenerationSchema,
      prompt,
      system:
        "You are an AI that structures raw text into a specific JSON format based on user instructions. You only output valid JSON.",
    });

    const validatedData: TopicConfig[] = generatedConfig.map((item) => ({
      key: item.key,
      title: item.title,
      keyword: item.keyword,
    }));

    return { success: true, data: validatedData };
  } catch (error) {
    console.error("AI SDK Error in generateTopicConfigAction:", error);
    return {
      success: false,
      error: "Failed to generate topics using AI. Please try again.",
    };
  }
}

interface GenerateDetailsParams {
  rawTranscript: string;
}

export async function generateCompanionDetailsAction(
  params: GenerateDetailsParams
): Promise<{
  success: boolean;
  data?: z.infer<typeof companionDetailsGenerationSchema>;
  error?: string;
}> {
  const { rawTranscript } = params;

  if (!rawTranscript || rawTranscript.trim().length < 100) {
    return { success: false, error: "Transcript is too short to analyze." };
  }

  const prompt = `
    You are a helpful AI assistant skilled at analyzing and summarizing content. Your task is to read the following podcast transcript and generate key metadata for it.

    **Transcript to Analyze:**
    ---
    ${rawTranscript}
    ---

    **Your Instructions:**
    Based on the transcript, generate a JSON object with the following fields:
    1.  **name**: A short, catchy title for this conversation.
    2.  **subject**: The primary subject category. Choose only ONE from this list: ${subjects.toString()}.
    3.  **topic**: A concise sentence describing what this conversation helps a user learn or practice.
    4.  **description**: A brief summary (2-3 sentences) of the conversation's main points.
    5.  **duration**: An estimated session duration in minutes (as a number) for a learner to practice this transcript. Consider its length and complexity.

    Please provide the output in a structured JSON format.
  `;

  try {
    const { object: generatedDetails } = await generateObject({
      model: google("gemini-2.5-pro"),
      schema: companionDetailsGenerationSchema,
      prompt,
      system:
        "You are an AI assistant that provides structured JSON output based on a transcript.",
    });

    return { success: true, data: generatedDetails };
  } catch (error) {
    console.error("AI SDK Error in generateCompanionDetailsAction:", error);
    return {
      success: false,
      error: "Failed to generate details using AI. Please try again.",
    };
  }
}
