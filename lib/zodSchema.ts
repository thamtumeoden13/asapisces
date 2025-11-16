import { subjects } from "@/constants";
import { z } from "zod";

export const feedbackSchema = z.object({
  totalScore: z.number(),
  categoryScores: z.tuple([
    z.object({
      name: z.literal("Communication Skills"),
      score: z.number(),
      comment: z.string(),
    }),
    z.object({
      name: z.literal("Technical Knowledge"),
      score: z.number(),
      comment: z.string(),
    }),
    z.object({
      name: z.literal("Problem Solving"),
      score: z.number(),
      comment: z.string(),
    }),
    z.object({
      name: z.literal("Cultural Fit"),
      score: z.number(),
      comment: z.string(),
    }),
    z.object({
      name: z.literal("Confidence and Clarity"),
      score: z.number(),
      comment: z.string(),
    }),
  ]),
  strengths: z.array(z.string()),
  areasForImprovement: z.array(z.string()),
  finalAssessment: z.string(),
});

export const conversationFeedbackSchema = z.object({
  userId: z.string().uuid(),
  topicId: z.string(),
  companionId: z.string().uuid(), // <-- THÊM DÒNG NÀY
  totalScore: z.number().min(0).max(100),
  categoryScores: z.any(),
  strengths: z.array(z.string()),
  areasForImprovement: z.array(z.string()),
  finalAssessment: z.string(),
});

// --- ZOD SCHEMAS (giữ nguyên như bạn đã định nghĩa) ---
const transcriptDataSchema = z.object({
  rawTranscript: z.string(),
  topicConfig: z.array(z.any()),
  podcastTopics: z.record(z.array(z.any())),
  topicTitles: z.record(z.string()),
  metadata: z.any(),
});

export const upsertCompanionSchema = z.object({
  id: z.string().uuid().optional().nullable(),
  name: z.string().min(1, { message: "Name is required." }),
  subject: z.string().min(1, { message: "Subject is required." }),
  topic: z.string().min(1, { message: "Topic is required." }),
  voice: z.string().min(1, { message: "Voice is required." }),
  style: z.string().min(1, { message: "Style is required." }),
  duration: z.coerce.number().min(1, { message: "Duration is required." }),
  description: z.string().optional(),
  coverImage: z
    .string()
    .optional(),
  isPublic: z.boolean().default(false),
  transcriptData: transcriptDataSchema,
});

export const languageFeedbackSchema = z.object({
  totalScore: z
    .number()
    .describe(
      "Overall score from 0 to 100, calculated as the average of category scores."
    ),
  categoryScores: z.object({
    pronunciation: z
      .number()
      .describe("Pronunciation and clarity score from 0 to 100."),
    fluency: z
      .number()
      .describe(
        "Fluency and rhythm score from 0 to 100. How natural the speech sounds."
      ),
    grammar: z.number().describe("Grammar accuracy score from 0 to 100."),
    vocabulary: z
      .number()
      .describe(
        "Vocabulary usage score, including the use of appropriate words, from 0 to 100."
      ),
    completion: z
      .number()
      .describe(
        "Task completion score, how well the user followed the script, from 0 to 100."
      ),
  }),
  strengths: z
    .array(z.string())
    .describe("List of 2-3 key strengths observed during the conversation."),
  areasForImprovement: z
    .array(z.string())
    .describe(
      "List of 2-3 specific areas for improvement with examples from the transcript."
    ),
  finalAssessment: z
    .string()
    .describe("A concise, encouraging final summary for the learner."),
});

export const formSchema = z.object({
  name: z.string().min(1, { message: "Companion is required." }),
  subject: z.string().min(1, { message: "Companion is required." }),
  topic: z.string().min(1, { message: "Topic is required." }),
  voice: z.string().min(1, { message: "Voice is required." }),
  style: z.string().min(1, { message: "Style is required." }),
  duration: z.coerce.number().min(1, { message: "Duration is required." }),
});

// Schema for transcript companion
export const transcriptCompanionSchema = z.object({
  name: z.string().min(1, { message: "Name is required." }),
  subject: z.string().min(1, { message: "Subject is required." }),
  topic: z.string().min(1, { message: "Topic is required." }),
  voice: z.string().min(1, { message: "Voice is required." }),
  style: z.string().min(1, { message: "Style is required." }),
  description: z
    .string()
    .min(10, "Description should be at least 10 characters.")
    .optional(),
  coverImage: z.string().url("Must be a valid URL.").optional(),
  isPublic: z.boolean().default(false),
  duration: z.coerce.number().min(1, { message: "Duration is required." }),
  // Transcript specific fields
  transcript_data: z.object({
    rawTranscript: z.string(),
    topicConfig: z.array(
      z.object({
        key: z.string(),
        keyword: z.string(),
        title: z.string().optional(),
      })
    ),
    podcastTopics: z.record(
      z.array(
        z.object({
          speaker: z.string(),
          text: z.string(),
        })
      )
    ),
    topicTitles: z.record(z.string()),
    metadata: z.object({
      totalEntries: z.number(),
      totalTopics: z.number(),
      speakers: z.array(z.string()),
      processingTime: z.number(),
    }),
  }),
});

export const aiTutorResponseSchema = z.object({
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
export const askSchema = z.object({
  question: z.string().min(5, "Question is too short."),
  userRole: z.enum(["Leo", "Gwen"]),
  fullTranscript: z.array(z.object({ role: z.string(), content: z.string() })),
  originalScript: z.array(z.object({ speaker: z.string(), text: z.string() })),
});

// --- SCHEMA MỚI CHO SMART RETRY ---
export const smartRetrySchema = z.object({
  expectedSentence: z.string(),
  userSentence: z.string(),
});

export const smartRetryResponseSchema = z.object({
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

// Form schema for the save form
export const transcriptSaveFormSchema = z.object({
  id: z.string().uuid().optional().nullable(),
  name: z.string().min(1, { message: "Name is required." }),
  subject: z.string().min(1, { message: "Subject is required." }),
  topic: z.string().min(1, { message: "Topic is required." }),
  voice: z.string().min(1, { message: "Voice is required." }),
  style: z.string().min(1, { message: "Style is required." }),
  duration: z.coerce.number().min(1, { message: "Duration is required." }),
  description: z
    .string()
    .min(10, "Description should be at least 10 characters.")
    .optional(),
  coverImage: z.string(),
  isPublic: z.boolean().default(false),
});

export const topicConfigGenerationSchema = z.array(
  z.object({
    key: z
      .string()
      .describe(
        "A short, lowercase, snake_case identifier for the topic (e.g., 'introduction', 'core_problem')."
      ),
    title: z
      .string()
      .describe(
        "A short, user-friendly title for the topic in English (e.g., 'Introduction and Pressure')."
      ),
    keyword: z
      .string()
      .describe(
        "The exact first line of dialogue for this topic, BUT WITHOUT the speaker's prefix (e.g., remove 'Leo: ' or 'Gwen: '). This is a critical field."
      ),
  })
);

export const companionDetailsGenerationSchema = z.object({
  name: z
    .string()
    .describe(
      "A short, catchy, and descriptive title for the conversation. Max 50 characters."
    ),
  subject: z
    .string()
    .describe(
      `Categorize the content into ONE of the following subjects: ${subjects.toString()}. Choose the best fit.`
    ),
  topic: z
    .string()
    .describe(
      "A short sentence (max 100 characters) describing what a user can learn or practice from this conversation. E.g., 'Practice English conversation about setting goals and building systems.'"
    ),
  description: z
    .string()
    .describe(
      "A concise 2-3 sentence summary of the entire conversation, highlighting the key takeaways."
    ),
  duration: z
    .number()
    .describe(
      "Estimate the time in MINUTES a learner would need to complete this conversation practice session. Base this on the transcript's length and complexity. A typical range is 30-60 minutes. Return only a number."
    ),
});
