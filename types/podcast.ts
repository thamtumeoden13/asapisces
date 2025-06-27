export interface TranscriptLine {
  speaker: string;
  text: string;
}

export interface PodcastTopics {
  intro: TranscriptLine[];
  definition: TranscriptLine[];
  health: TranscriptLine[];
  mindset: TranscriptLine[];
  vocabulary: TranscriptLine[];
  selftalk: TranscriptLine[];
  toxic: TranscriptLine[];
  visualization: TranscriptLine[];
  environment: TranscriptLine[];
  resilience: TranscriptLine[];
}

export type TopicKey = keyof PodcastTopics;

export interface CompanionComponentProps {
  companionId: string;
  subject: string;
  topic: string;
  name: string;
  userName: string;
  userImage: string;
  style: string;
  voice: string;
}

export interface SavedMessage {
  role: "user" | "assistant";
  content: string;
}

export interface Message {
  type: string;
  transcriptType?: string;
  role: "user" | "assistant";
  transcript: string;
}

// Add VAPI-related types
export interface VapiMessage {
  type: string;
  transcriptType?: string;
  role?: "user" | "assistant";
  transcript?: string;
  timestamp?: number;
  error?: string;
}

export interface VapiCallState {
  status: CallStatus;
  duration?: number;
  error?: string;
}

export enum CallStatus {
  INACTIVE = "INACTIVE",
  CONNECTING = "CONNECTING",
  ACTIVE = "ACTIVE",
  FINISHED = "FINISHED",
  ERROR = "ERROR",
}

// Add conversation state types
export interface ConversationState {
  currentStep: number;
  totalSteps: number;
  isWaitingForUser: boolean;
  lastUserInput?: string;
  feedback?: string;
}

// Add PodcastStep type for backward compatibility
export interface PodcastStep extends TranscriptLine {
  id?: string;
  stepNumber?: number;
}
