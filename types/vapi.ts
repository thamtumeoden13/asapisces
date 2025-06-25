enum MessageTypeEnum {
  TRANSCRIPT = "transcript",
  FUNCTION_CALL = "function-call",
  FUNCTION_CALL_RESULT = "function-call-result",
  ADD_MESSAGE = "add-message",
  CONVERSATION_UPDATE = "conversation-update",
  SPEECH_UPDATE = "speech-update",
}

enum MessageRoleEnum {
  USER = "user",
  SYSTEM = "system",
  ASSISTANT = "assistant",
}

enum TranscriptMessageTypeEnum {
  PARTIAL = "partial",
  FINAL = "final",
}

enum CallStatusEnum {
  INACTIVE = "inactive",
  CONNECTING = "connecting",
  ACTIVE = "active",
  ENDED = "ended",
  ERROR = "error",
}

interface BaseMessage {
  type: MessageTypeEnum
  timestamp?: number
}

interface TranscriptMessage extends BaseMessage {
  type: MessageTypeEnum.TRANSCRIPT
  role: MessageRoleEnum
  transcriptType: TranscriptMessageTypeEnum
  transcript: string
}

interface FunctionCallMessage extends BaseMessage {
  type: MessageTypeEnum.FUNCTION_CALL
  functionCall: {
    name: string
    parameters: unknown
  }
}

interface FunctionCallResultMessage extends BaseMessage {
  type: MessageTypeEnum.FUNCTION_CALL_RESULT
  functionCallResult: {
    forwardToClientEnabled?: boolean
    result: unknown
    [a: string]: unknown
  }
}

interface ConversationUpdateMessage extends BaseMessage {
  type: MessageTypeEnum.CONVERSATION_UPDATE
  conversationState: {
    currentStep: number
    totalSteps: number
    currentSpeaker: string
    isWaitingForUser: boolean
  }
}

interface SpeechUpdateMessage extends BaseMessage {
  type: MessageTypeEnum.SPEECH_UPDATE
  isSpeaking: boolean
  speaker: MessageRoleEnum
}

type Message =
  | TranscriptMessage
  | FunctionCallMessage
  | FunctionCallResultMessage
  | ConversationUpdateMessage
  | SpeechUpdateMessage

// Enhanced interfaces for better type safety
interface VapiCallState {
  status: CallStatusEnum
  duration?: number
  error?: string
  startTime?: number
  endTime?: number
}

interface VapiEventHandlers {
  onCallStart?: () => void
  onCallEnd?: () => void
  onMessage?: (message: Message) => void
  onError?: (error: Error) => void
  onSpeechStart?: () => void
  onSpeechEnd?: () => void
  onTranscript?: (transcript: TranscriptMessage) => void
}

export {
  MessageTypeEnum,
  MessageRoleEnum,
  TranscriptMessageTypeEnum,
  CallStatusEnum,
  type Message,
  type TranscriptMessage,
  type FunctionCallMessage,
  type FunctionCallResultMessage,
  type ConversationUpdateMessage,
  type SpeechUpdateMessage,
  type VapiCallState,
  type VapiEventHandlers,
}
