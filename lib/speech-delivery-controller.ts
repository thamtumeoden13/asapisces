interface SpeechDeliveryOptions {
    preventInterruption: boolean
    ensureCompleteness: boolean
    naturalPacing: boolean
  }
  
  class SpeechDeliveryController {
    private activeSpeechSessions: Map<string, any> = new Map()
  
    /**
     * Send a complete message that should be spoken as one unit
     */
    sendCompleteMessage(
      vapi: any,
      content: string,
      options: SpeechDeliveryOptions = {
        preventInterruption: true,
        ensureCompleteness: true,
        naturalPacing: true,
      },
    ) {
      const sessionId = `speech-${Date.now()}`
  
      console.log(`🎤 Delivering complete message (${sessionId}):`, content)
  
      try {
        // Method 1: Send as assistant message
        vapi.send({
          type: "add-message",
          message: {
            role: "assistant",
            content: content,
            metadata: {
              sessionId,
              deliveryType: "complete",
              preventInterruption: options.preventInterruption,
            },
          },
        })
  
        // Method 2: Send speech control instructions
        if (options.ensureCompleteness) {
          setTimeout(() => {
            vapi.send({
              type: "speech-control",
              action: "speak-complete",
              content: content,
              options: {
                preventInterruption: options.preventInterruption,
                naturalPacing: options.naturalPacing,
              },
            })
          }, 100)
        }
  
        // Track the session
        this.activeSpeechSessions.set(sessionId, {
          content,
          startTime: Date.now(),
          options,
        })
  
        console.log(`✅ Speech session ${sessionId} initiated`)
        return sessionId
      } catch (error) {
        console.error(`❌ Failed to send complete message:`, error)
        throw error
      }
    }
  
    /**
     * Calculate optimal delivery timing based on content
     */
    calculateDeliveryTiming(content: string): {
      estimatedDuration: number
      pausePoints: number[]
      wordCount: number
    } {
      const words = content.split(/\s+/)
      const wordCount = words.length
  
      // Average speaking rate: 2.5 words per second for clear delivery
      const wordsPerSecond = 2.5
      const baseDuration = (wordCount / wordsPerSecond) * 1000
  
      // Add pauses for punctuation
      const commaCount = (content.match(/,/g) || []).length
      const periodCount = (content.match(/[.!?]/g) || []).length
      const quotationCount = (content.match(/"/g) || []).length
  
      const pauseDuration = commaCount * 300 + periodCount * 500 + quotationCount * 200
      const estimatedDuration = baseDuration + pauseDuration
  
      // Find natural pause points
      const pausePoints: number[] = []
      const currentPosition = 0
  
      for (let i = 0; i < content.length; i++) {
        if (content[i].match(/[,.!?]/)) {
          pausePoints.push(i)
        }
      }
  
      return {
        estimatedDuration,
        pausePoints,
        wordCount,
      }
    }
  
    /**
     * Monitor speech delivery progress
     */
    monitorSpeechProgress(sessionId: string, onProgress?: (progress: number) => void): void {
      const session = this.activeSpeechSessions.get(sessionId)
      if (!session) return
  
      const timing = this.calculateDeliveryTiming(session.content)
      const startTime = session.startTime
  
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime
        const progress = Math.min((elapsed / timing.estimatedDuration) * 100, 100)
  
        onProgress?.(progress)
  
        if (progress >= 100) {
          clearInterval(interval)
          this.completeSpeechSession(sessionId)
        }
      }, 100)
  
      // Store interval for cleanup
      session.progressInterval = interval
    }
  
    /**
     * Complete a speech session
     */
    private completeSpeechSession(sessionId: string): void {
      const session = this.activeSpeechSessions.get(sessionId)
      if (session) {
        if (session.progressInterval) {
          clearInterval(session.progressInterval)
        }
        this.activeSpeechSessions.delete(sessionId)
        console.log(`✅ Speech session ${sessionId} completed`)
      }
    }
  
    /**
     * Force complete all active sessions
     */
    forceCompleteAllSessions(): void {
      for (const [sessionId] of this.activeSpeechSessions) {
        this.completeSpeechSession(sessionId)
      }
    }
  
    /**
     * Get active session count
     */
    getActiveSessionCount(): number {
      return this.activeSpeechSessions.size
    }
  }
  
  // Export singleton instance
  export const speechDeliveryController = new SpeechDeliveryController()
  
  // Utility functions
  export const sendCompleteMessage = (vapi: any, content: string, options?: SpeechDeliveryOptions) =>
    speechDeliveryController.sendCompleteMessage(vapi, content, options)
  
  export const calculateSpeechTiming = (content: string) => speechDeliveryController.calculateDeliveryTiming(content)
  
  export const monitorSpeechProgress = (sessionId: string, onProgress?: (progress: number) => void) =>
    speechDeliveryController.monitorSpeechProgress(sessionId, onProgress)
  