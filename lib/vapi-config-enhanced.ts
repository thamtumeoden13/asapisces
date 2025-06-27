import type { TopicKey, TranscriptLine } from "@/types/podcast"

export interface EnhancedAssistantConfig {
  name: string
  model: {
    provider: string
    model: string
    temperature: number
    maxTokens: number
    messages?: Array<{
      role: string
      content: string
    }>
  }
  voice: {
    provider: string
    voiceId: string
    speed: number
    stability: number
    similarityBoost: number
  }
  firstMessage: string
  // systemMessage?: string
  recordingEnabled: boolean
  endCallMessage: string
  endCallPhrases: string[]
  clientMessages: string[]
  serverMessages?: string[]
  silenceTimeoutSeconds?: number
  maxDurationSeconds?: number
  backgroundSound?: string
  metadata: {
    subject: string
    topic: string
    style: string
    level: string
  }
}

export function configureEnhancedPodcastAssistant(
  voice: string,
  style: string,
  topic: TopicKey,
  steps: TranscriptLine[],
  level = "intermediate",
): EnhancedAssistantConfig {
  const voiceConfig = getVoiceConfiguration(voice)
  const systemMessage = generateSystemMessage(style, topic, steps, level)
  const firstMessage = generateFirstMessage(topic, style)

  return {
    name: `Enhanced ${voice} - ${topic} Conversation`,
    model: {
      provider: "openai",
      model: "gpt-4o-mini",
      temperature: 0.3,
      maxTokens: 150,
      // messages: [
      //   {
      //     role: "system",
      //     content: systemMessage,
      //   },
      // ],
    },
    voice: voiceConfig,
    firstMessage,
    // systemMessage,
    recordingEnabled: false,
    endCallMessage: "Thank you for practicing with me today! You did great work.",
    endCallPhrases: ["goodbye", "end call", "stop session", "finish conversation", "that's all for today"],
    clientMessages: ["transcript", "hang", "function-call"],
    serverMessages: ["conversation-update", "function-call", "hang"],
    silenceTimeoutSeconds: 10,
    maxDurationSeconds: 1800,
    backgroundSound: "office",
    metadata: {
      subject: "english",
      topic,
      style,
      level,
    },
  }
}

function getVoiceConfiguration(voice: string) {
  const voiceConfigs: Record<string, any> = {
    leo: {
      provider: "11labs",
      voiceId: "pNInz6obpgDQGcFmaJgB", // Adam voice
      speed: 1.0,
      stability: 0.8,
      similarityBoost: 0.8,
    },
    gwen: {
      provider: "11labs",
      voiceId: "EXAVITQu4vr4xnSDxMaL", // Bella voice
      speed: 1.0,
      stability: 0.8,
      similarityBoost: 0.8,
    },
    friendly: {
      provider: "11labs",
      voiceId: "21m00Tcm4TlvDq8ikWAM", // Rachel voice
      speed: 1.0,
      stability: 0.8,
      similarityBoost: 0.8,
    },
    professional: {
      provider: "11labs",
      voiceId: "AZnzlk1XvdvUeBnXmlld", // Domi voice
      speed: 0.9,
      stability: 0.9,
      similarityBoost: 0.7,
    },
  }

  return voiceConfigs[voice] || voiceConfigs.friendly
}

function generateSystemMessage(style: string, topic: TopicKey, steps: TranscriptLine[], level: string): string {
  const conversationScript = steps.map((step, index) => `${index + 1}. ${step.speaker}: "${step.text}"`).join("\n")

  return `You are Leo from the "Positive Thinking Podcast." You're helping a ${level}-level English student practice conversation by following this exact script:

CONVERSATION SCRIPT:
${conversationScript}

ENHANCED INSTRUCTIONS:
1. SCRIPT ADHERENCE: Follow the script exactly - say only Leo's lines when it's your turn
2. PACING: Speak naturally but allow pauses for the student to process
3. STUDENT SUPPORT: If they struggle, gently guide them back to Gwen's line
4. ENCOURAGEMENT: Use positive reinforcement throughout
5. CLARITY: Speak clearly and at an appropriate pace for ${level} level
6. PATIENCE: Wait for complete responses before continuing

CONVERSATION FLOW:
- Start with Leo's first line from the script
- Wait for student to say Gwen's line
- Provide gentle guidance if they're off-script
- Continue with next Leo line only after student responds
- Complete the entire script before ending

ERROR HANDLING:
- If student says wrong line: "That's close! Gwen would say: [correct line]"
- If student is confused: "Let's try Gwen's line: [correct line]"
- If student asks for help: "Gwen's next line is: [correct line]"

COMPLETION:
When script is finished, congratulate them and offer to practice again.

Remember: You are Leo - speak as if this is a real podcast recording. Keep it natural and encouraging!

STYLE: ${style}
TOPIC: ${topic}
LEVEL: ${level}`
}

function generateFirstMessage(topic: TopicKey, style: string): string {
  const greetings: Record<string, string> = {
    intro:
      "Hello! I'm Leo from the Positive Thinking Podcast. Today we're going to practice introductions together. I'll play my part, and you'll be Gwen. Ready to start our conversation?",
    definition:
      "Hi there! I'm Leo, and welcome to our Positive Thinking Podcast practice session. Today we're exploring what positive thinking really means. You'll be playing Gwen's role. Let's begin!",
    health:
      "Hello! Leo here from the Positive Thinking Podcast. Today we're discussing how positive thinking affects our health and wellbeing. You'll respond as Gwen. Are you ready to start?",
    mindset:
      "Hi! I'm Leo, and this is our Positive Thinking Podcast practice. Today's topic is developing a positive mindset. You'll be Gwen in our conversation. Let's dive in!",
    vocabulary:
      "Hello! Leo from the Positive Thinking Podcast here. We're going to work on vocabulary related to positive thinking today. You'll play Gwen's part. Ready to begin?",
    selftalk:
      "Hi there! I'm Leo, and welcome to our practice session on positive self-talk. You'll be responding as Gwen throughout our conversation. Let's get started!",
    toxic:
      "Hello! Leo here. Today we're learning about avoiding toxic negativity. You'll be playing Gwen's role in our podcast conversation. Are you ready?",
    visualization:
      "Hi! I'm Leo from the Positive Thinking Podcast. Today's topic is the power of visualization. You'll respond as Gwen. Let's begin our practice session!",
    environment:
      "Hello! Leo here. We're discussing creating a positive environment today. You'll be Gwen in our conversation. Ready to start practicing?",
    resilience:
      "Hi there! I'm Leo, and today we're talking about building resilience through positive thinking. You'll play Gwen's part. Let's begin!",
  }

  return (
    greetings[topic] ||
    "Hello! I'm Leo from the Positive Thinking Podcast. I'm excited to practice this conversation with you today. You'll be playing Gwen's role. Ready to start?"
  )
}

export function getAssistantOverrides(subject: string, topic: string, style: string) {
  return {
    variableValues: {
      subject,
      topic,
      style,
    },
    clientMessages: ["transcript", "hang", "function-call"] as const,
  }
}
