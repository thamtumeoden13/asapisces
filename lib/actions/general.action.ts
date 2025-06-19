"use server";

import { feedbackSchema } from "@/constants";
import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role key for RLS bypass in server actions
);

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
