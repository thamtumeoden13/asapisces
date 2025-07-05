"use client"

export interface VapiMessageContext {
  messageType: string
  transcriptType?: string
  role?: string
  content?: string
  timestamp: number
  callStatus: string
  isWaitingForUser: boolean
  currentSpeaker: string
  shouldProcess: boolean
  reason: string
  category: "transcript" | "system" | "assistant" | "user" | "unknown"
}

export class VapiMessageAnalyzer {
  private messageHistory: Array<{
    message: any
    context: VapiMessageContext
    processed: boolean
  }> = []

  analyzeMessage(
    message: any,
    callStatus: string,
    isWaitingForUser: boolean,
    currentSpeaker: string,
  ): VapiMessageContext {
    const context: VapiMessageContext = {
      messageType: message.type,
      transcriptType: message.transcriptType,
      role: message.role,
      content: message.transcript || message.content || "",
      timestamp: Date.now(),
      callStatus,
      isWaitingForUser,
      currentSpeaker,
      shouldProcess: false,
      reason: "",
      category: this.categorizeMessage(message),
    }

    // Analyze different message types
    this.analyzeByType(message, context)

    // Store in history
    this.messageHistory.push({
      message,
      context,
      processed: context.shouldProcess,
    })

    // Keep only last 100 messages
    if (this.messageHistory.length > 100) {
      this.messageHistory = this.messageHistory.slice(-100)
    }

    return context
  }

  private categorizeMessage(message: any): VapiMessageContext["category"] {
    if (message.type === "transcript") return "transcript"
    if (message.role === "assistant") return "assistant"
    if (message.role === "user") return "user"
    if (message.type === "function-call" || message.type === "hang" || message.type === "speech-update") return "system"
    return "unknown"
  }

  private analyzeByType(message: any, context: VapiMessageContext) {
    switch (message.type) {
      case "transcript":
        this.analyzeTranscript(message, context)
        break
      case "function-call":
        this.analyzeFunctionCall(message, context)
        break
      case "hang":
        this.analyzeHang(message, context)
        break
      case "speech-update":
        this.analyzeSpeechUpdate(message, context)
        break
      case "conversation-update":
        this.analyzeConversationUpdate(message, context)
        break
      case "model-output":
        this.analyzeModelOutput(message, context)
        break
      default:
        context.reason = `❓ Unknown message type: ${message.type}`
        context.shouldProcess = false
    }
  }

  private analyzeTranscript(message: any, context: VapiMessageContext) {
    const isPartial = message.transcriptType === "partial"
    const isFinal = message.transcriptType === "final"
    const isEmpty = !message.transcript?.trim()

    if (isEmpty) {
      context.reason = "🚫 Empty transcript content"
      context.shouldProcess = false
      return
    }

    if (context.callStatus !== "ACTIVE") {
      context.reason = "🚫 Call not active"
      context.shouldProcess = false
      return
    }

    if (isPartial) {
      context.reason = "⏸️ Partial transcript - monitoring only"
      context.shouldProcess = false
      return
    }

    if (isFinal) {
      if (message.role === "user") {
        if (!context.isWaitingForUser) {
          context.reason = "🚫 User transcript but not waiting for user"
          context.shouldProcess = false
        } else if (context.currentSpeaker !== "Gwen") {
          context.reason = "🚫 User transcript but current step is not Gwen's"
          context.shouldProcess = false
        } else {
          context.reason = "✅ Valid user final transcript"
          context.shouldProcess = true
        }
      } else if (message.role === "assistant") {
        if (context.isWaitingForUser) {
          context.reason = "🚫 Assistant transcript while waiting for user"
          context.shouldProcess = false
        } else {
          context.reason = "⚠️ Assistant transcript - check if duplicate"
          context.shouldProcess = false // Will be checked for duplicates
        }
      }
    }
  }

  private analyzeFunctionCall(message: any, context: VapiMessageContext) {
    context.reason = "🔧 Function call message"
    context.shouldProcess = true // Usually should be processed
  }

  private analyzeHang(message: any, context: VapiMessageContext) {
    context.reason = "📞 Call hang/end message"
    context.shouldProcess = true
  }

  private analyzeSpeechUpdate(message: any, context: VapiMessageContext) {
    context.reason = "🎤 Speech status update"
    context.shouldProcess = false // Usually just informational
  }

  private analyzeConversationUpdate(message: any, context: VapiMessageContext) {
    context.reason = "💬 Conversation state update"
    context.shouldProcess = true
  }

  private analyzeModelOutput(message: any, context: VapiMessageContext) {
    context.reason = "🤖 AI model output"
    context.shouldProcess = false // Usually handled elsewhere
  }

  getMessageHistory() {
    return this.messageHistory
  }

  getUnexpectedMessages() {
    return this.messageHistory.filter((m) => !m.processed && m.context.category !== "unknown")
  }

  getMessageStats() {
    const total = this.messageHistory.length
    const processed = this.messageHistory.filter((m) => m.processed).length
    const byType = this.messageHistory.reduce(
      (acc, m) => {
        acc[m.context.messageType] = (acc[m.context.messageType] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    return { total, processed, ignored: total - processed, byType }
  }

  clearHistory() {
    this.messageHistory = []
  }
}
