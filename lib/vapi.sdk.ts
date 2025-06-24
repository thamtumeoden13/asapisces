import Vapi from "@vapi-ai/web"

// Enhanced VAPI SDK with better error handling and logging
class EnhancedVapi {
  private vapi: Vapi
  private isInitialized = false

  constructor() {
    const token = process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN

    if (!token) {
      console.error("VAPI_WEB_TOKEN is not configured")
      throw new Error("VAPI_WEB_TOKEN is required")
    }

    this.vapi = new Vapi(token)
    this.setupEventListeners()
    this.isInitialized = true
  }

  private setupEventListeners() {
    // Global error handling
    this.vapi.on("error", (error) => {
      console.error("VAPI Global Error:", error)
    })

    // Connection status logging
    this.vapi.on("call-start", () => {
      console.log("📞 VAPI Call Started")
    })

    this.vapi.on("call-end", () => {
      console.log("📞 VAPI Call Ended")
    })
  }

  // Wrapper methods with error handling
  async start(assistant: any, assistantOverrides?: any) {
    if (!this.isInitialized) {
      throw new Error("VAPI not initialized")
    }

    try {
      console.log("🚀 Starting VAPI call with config:", { assistant, assistantOverrides })
      return await this.vapi.start(assistant, assistantOverrides)
    } catch (error) {
      console.error("Failed to start VAPI call:", error)
      throw error
    }
  }

  stop() {
    try {
      console.log("🛑 Stopping VAPI call")
      return this.vapi.stop()
    } catch (error) {
      console.error("Failed to stop VAPI call:", error)
      throw error
    }
  }

  send(message: any) {
    try {
      console.log("📤 Sending message to VAPI:", message)
      return this.vapi.send(message)
    } catch (error) {
      console.error("Failed to send message:", error)
      throw error
    }
  }

  isMuted(): boolean {
    return this.vapi.isMuted()
  }

  setMuted(muted: boolean) {
    try {
      console.log(`🎤 Setting mute to: ${muted}`)
      return this.vapi.setMuted(muted)
    } catch (error) {
      console.error("Failed to set mute:", error)
      throw error
    }
  }

  on(event: string, callback: Function) {
    return this.vapi.on(event, callback)
  }

  off(event: string, callback: Function) {
    return this.vapi.off(event, callback)
  }

  // Health check method
  isHealthy(): boolean {
    return this.isInitialized && !!this.vapi
  }
}

export const vapi = new EnhancedVapi()
