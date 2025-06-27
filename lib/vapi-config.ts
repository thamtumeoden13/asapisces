import { voices } from "@/constants";
import type { CreateAssistantDTO } from "@vapi-ai/web/dist/api";
import type { TranscriptLine } from "@/types/podcast";

export interface VapiConfig {
  apiKey: string;
  assistant: {
    model: {
      provider: string;
      model: string;
      temperature: number;
    };
    voice: {
      provider: string;
      voiceId: string;
    };
    firstMessage: string;
    systemMessage: string;
  };
}

export const createVapiConfig = (
  voice: string,
  style: string,
  subject: string,
  topic: string
): VapiConfig => ({
  apiKey: process.env.NEXT_PUBLIC_VAPI_API_KEY || "",
  assistant: {
    model: {
      provider: "openai",
      model: "gpt-4o-mini", // Updated to more cost-effective model
      temperature: 0.3, // Lower temperature for more consistent responses
    },
    voice: {
      provider: "11labs",
      voiceId:
        voice === "leo" ? "pNInz6obpgDQGcFmaJgB" : "Xb7hH8MSUJpSbSDYk0k2",
    },
    firstMessage: `Hello! I'm ready to practice ${subject} with you on the topic of ${topic}. Let's have a conversation!`,
    systemMessage: `You are a helpful ${style} English learning assistant. Focus on the topic: ${topic}. Encourage the user and provide gentle corrections when needed.`,
  },
});

export const configureAssistant = (voice: string, style: string) => {
  console.log("voice",voice)
  const voiceId =
    voices[voice as keyof typeof voices][
      style as keyof (typeof voices)[keyof typeof voices]
    ] || "sarah";

  const vapiAssistant: CreateAssistantDTO = {
    name: "Companion",
    firstMessage:
      "Hello, let's start the session. Today we'll be talking about {{topic}}.",
    transcriber: {
      provider: "deepgram",
      model: "nova-3",
      language: "en",
    },
    voice: {
      provider: "11labs",
      voiceId: voiceId,
      stability: 0.4,
      similarityBoost: 0.8,
      speed: 1,
      style: 0.5,
      useSpeakerBoost: true,
    },
    model: {
      provider: "openai",
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are a highly knowledgeable tutor teaching a real-time voice session with a student. 
                    Your goal is to teach the student about the topic and subject.

                    Tutor Guidelines:
                    Stick to the given topic - {{ topic }} and subject - {{ subject }} and teach the student about it.
                    Keep the conversation flowing smoothly while maintaining control.
                    From time to time make sure that the student is following you and understands you.
                    Break down the topic into smaller parts and teach the student one part at a time.
                    Keep your style of conversation {{ style }}.
                    Keep your responses short, like in a real voice conversation.
                    Do not include any special characters in your responses - this is a voice conversation.
              `,
        },
      ],
    },
    clientMessages: [],
    serverMessages: [],
  };
  return vapiAssistant;
};

// Enhanced configuration for podcast conversation
export const configurePodcastAssistant = (
  voice: string,
  style: string,
  topic: string,
  steps: TranscriptLine[]
): CreateAssistantDTO => {
  const voiceId =
    voices[voice as keyof typeof voices]?.[
      style as keyof (typeof voices)[keyof typeof voices]
    ] || "sarah";

  // Create a structured script for the assistant
  const scriptContent = steps
    .map((step, index) => `${index + 1}. ${step.speaker}: "${step.text}"`)
    .join("\n");

  return {
    name: "Podcast Conversation Partner",
    firstMessage:
      "Hi! I'm Leo from the Positive Thinking podcast. Ready to practice our conversation? I'll guide you through it step by step.",
    transcriber: {
      provider: "deepgram",
      model: "nova-2",
      language: "en",
      smartFormat: true,
      punctuate: true,
    },
    voice: {
      provider: "11labs",
      voiceId: voiceId,
      stability: 0.5,
      similarityBoost: 0.8,
      speed: 0.9,
      style: 0.6,
      useSpeakerBoost: true,
    },
    model: {
      provider: "openai",
      model: "gpt-4o-mini",
      temperature: 0.2,
      maxTokens: 150,
      messages: [
        {
          role: "system",
          content: `You are Leo, a friendly podcast host from "Positive Thinking Podcast". You're helping a student practice English conversation by roleplaying the podcast script.

CONVERSATION SCRIPT:
${scriptContent}

INSTRUCTIONS:
1. Follow the script exactly - say only Leo's lines when it's your turn
2. Wait for the student to say Gwen's lines before continuing
3. If the student says something wrong or gets confused, gently guide them back to the script
4. Keep responses short and natural - this is spoken conversation
5. Use encouraging language and be patient
6. If the student asks for help, repeat the line they should say
7. At the end of the script, congratulate them and ask if they want to practice again

CONVERSATION FLOW:
- Start with Leo's first line from the script
- Wait for student response (Gwen's line)
- Continue with next Leo line
- Repeat until script is complete

Remember: You are Leo, speak naturally as if this is a real podcast recording. Keep it conversational and encouraging!`,
        },
      ],
    },
    clientMessages: ["transcript"],
    serverMessages: [],
    silenceTimeoutSeconds: 10,
    maxDurationSeconds: 1800, // 30 minutes max
    backgroundSound: "office",
  };
};

// Configuration for free-form conversation practice
export const configureConversationAssistant = (
  voice: string,
  style: string,
  topic: string,
  level = "intermediate"
): CreateAssistantDTO => {
  const voiceId =
    voices[voice as keyof typeof voices]?.[
      style as keyof (typeof voices)[keyof typeof voices]
    ] || "sarah";

  return {
    name: "English Conversation Partner",
    firstMessage: `Hi there! I'm excited to practice English conversation with you about ${topic}. Let's start with something simple - tell me what you already know about this topic!`,
    transcriber: {
      provider: "deepgram",
      model: "nova-2",
      language: "en",
      smartFormat: true,
      punctuate: true,
    },
    voice: {
      provider: "11labs",
      voiceId: voiceId,
      stability: 0.4,
      similarityBoost: 0.8,
      speed: 0.95,
      style: 0.7,
      useSpeakerBoost: true,
    },
    model: {
      provider: "openai",
      model: "gpt-4o-mini",
      temperature: 0.4,
      maxTokens: 100,
      messages: [
        {
          role: "system",
          content: `You are a friendly and supportive English conversation partner helping a ${level} level student practice speaking about ${topic}.

TEACHING APPROACH:
- Keep conversations natural and engaging
- Ask follow-up questions to encourage more speaking
- Gently correct mistakes by repeating the correct form
- Introduce new vocabulary in context
- Speak clearly and at an appropriate pace
- Use encouraging language and positive reinforcement

CONVERSATION GUIDELINES:
- Stay focused on the topic: ${topic}
- Adapt your language to ${level} level
- Keep responses short (1-2 sentences max)
- Ask open-ended questions
- If student struggles, offer simpler alternatives
- Celebrate progress and effort

CORRECTION STYLE:
- Don't interrupt - let them finish speaking
- Correct by example: "Oh, you mean 'I went to the store'?"
- Focus on one correction at a time
- Always acknowledge their effort first

Remember: This is spoken conversation - avoid complex formatting or special characters. Keep it natural and supportive!`,
        },
      ],
    },
    clientMessages: ["transcript"],
    serverMessages: [],
    silenceTimeoutSeconds: 8,
    maxDurationSeconds: 1200, // 20 minutes max
  };
};

// Utility function to get voice configuration
export const getVoiceConfig = (voice: string, style: string) => {
  const voiceMap: Record<string, Record<string, string>> = {
    leo: {
      friendly: "pNInz6obpgDQGcFmaJgB",
      professional: "21m00Tcm4TlvDq8ikWAM",
      casual: "D38z5RcWu1voky8WS1ja",
    },
    gwen: {
      friendly: "Xb7hH8MSUJpSbSDYk0k2",
      professional: "pFGYVMWn2Va5ChVmKkgH",
      casual: "oWAxZDx7w5VEj9dCyTzz",
    },
  };

  return voiceMap[voice]?.[style] || voiceMap.leo.friendly;
};

// Configuration validator
export const validateVapiConfig = (config: any): boolean => {
  const required = ["name", "voice", "model", "transcriber"];
  return required.every((field) => config[field] !== undefined);
};

// Export all configurations
export {
  configurePodcastAssistant as configureAssistant2,
  configureConversationAssistant as configureAssistantConversation,
};
