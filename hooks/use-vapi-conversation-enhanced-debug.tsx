"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { vapi } from "@/lib/vapi.sdk"
import { configureAssistant } from "@/lib/vapi-config"
import { calculateAdvancedSimilarity, resetSimilarityContext } from "@/lib/enhanced-similarity-for-long-sentences"
import type { VapiMessage, VapiCallState, ConversationState, TranscriptLine } from "@/types/podcast"
import { CallStatus } from "@/types/podcast"

interface UseVapiConversationProps {
  steps: TranscriptLine[]
  companionId: string
  subject: string
  topic: string
  style: string
  voice: string
  onSessionComplete?: () => void
}

export const useVapiConversation = ({
  steps,
  companionId,
  subject,
  topic,
  style,
  voice,
  onSessionComplete,
}: UseVapiConversationProps) => {
  const [callState, setCallState] = useState<VapiCallState>({
    status: CallStatus.INACTIVE,
  })

  // Enhanced conversation state with similarity info
  const [conversationState, setConversationState] = useState<ConversationState & { similarity?: any }>({
    currentStep: 0,
    totalSteps: steps.length,
    isWaitingForUser: false,
    similarity: null,
  })

  // Enhanced messages with similarity data
  const [messages, setMessages] = useState<
    Array<{
      role: "user" | "assistant"
      content: string
      timestamp: number
      similarity?: any
      isPartial?: boolean
    }>
  >([])

  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isMuted, setIsMuted] = useState(false)

  // Refs for managing async operations and preventing infinite loops
  const currentStepRef = useRef(conversationState.currentStep)
  const isCallReadyRef = useRef(false)
  const messagesRef = useRef(messages)
  const lastProcessedMessageRef = useRef<string>("")
  const sentMessagesRef = useRef<Set<string>>(new Set()) // Track messages we've sent
  const conversationCompletedRef = useRef(false) // Track if conversation is completed
  const sessionCompleteCalledRef = useRef(false) // Track if onSessionComplete was called
  const currentTimeoutRef = useRef<NodeJS.Timeout | null>(null) // Track current timeout

  // Update refs when values change
  useEffect(() => {
    currentStepRef.current = conversationState.currentStep
  }, [conversationState.currentStep])

  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  const currentStep = conversationState.currentStep
  const currentLine = steps[currentStep] || null

  // Calculate speaking time based on text length and speaking rate
  const calculateSpeakingTime = useCallback((text: string): number => {
    // Average speaking rate: 150-160 words per minute
    // Add buffer time for natural pauses and processing
    const words = text.split(/\s+/).length
    const baseTimePerWord = 400 // milliseconds per word (150 WPM)
    const bufferTime = 2000 // 2 seconds buffer
    const minimumTime = 3000 // minimum 3 seconds

    const calculatedTime = words * baseTimePerWord + bufferTime
    return Math.max(calculatedTime, minimumTime)
  }, [])

  // Handle final similarity result and determine next action
  const handleFinalSimilarityResult = useCallback(
    (similarityResult: any, stepIndex: number) => {
      // Determine if user should advance (lowered threshold for better UX)
      const shouldAdvance = similarityResult.score >= 0.5 // More lenient threshold

      // Update conversation state
      setConversationState((prev) => ({
        ...prev,
        feedback: similarityResult.feedback,
        similarity: similarityResult,
        ...(shouldAdvance && {
          currentStep: prev.currentStep + 1,
          isWaitingForUser: false,
        }),
      }))

      // Clean up context if advancing
      if (shouldAdvance) {
        resetSimilarityContext(`${companionId}-step-${stepIndex}`)

        // Log successful completion
        console.log(`✅ Step ${stepIndex} completed with score: ${similarityResult.score.toFixed(2)}`)
      } else {
        // Log retry needed
        console.log(`🔄 Step ${stepIndex} needs retry. Score: ${similarityResult.score.toFixed(2)}`)
      }
    },
    [companionId],
  )

  // Enhanced message handler with advanced similarity and deduplication
  const handleMessage = useCallback(
    (message: VapiMessage) => {
      console.log("📨 Received VAPI message:", message)

      // Only process final transcripts to avoid duplicates
      if (message.type === "transcript" && message.transcriptType === "final") {
        const messageKey = `${message.role}-${message.transcript}`

        // Prevent processing the same message twice
        if (lastProcessedMessageRef.current === messageKey) {
          console.log("🚫 Same message already processed, skipping:", message.transcript)
          return
        }

        lastProcessedMessageRef.current = messageKey

        // Check if this is a message we sent (Leo's message)
        const isOurMessage = sentMessagesRef.current.has(message.transcript.trim())
        if (isOurMessage && message.role === "assistant") {
          console.log("🎯 This is our sent message, not adding duplicate:", message.transcript)
          return
        }

        const newMessage = {
          role: message.role,
          content: message.transcript,
          timestamp: Date.now(),
        }

        // Check for duplicate messages using ref to avoid dependency issues
        const isDuplicate = messagesRef.current.some(
          (msg) =>
            msg.content.trim() === message.transcript.trim() &&
            msg.role === message.role &&
            Date.now() - msg.timestamp < 5000, // 5 second window
        )

        if (isDuplicate) {
          console.log("🚫 Duplicate message detected, skipping:", message.transcript)
          return
        }

        // Handle user responses with advanced similarity
        if (message.role === "user" && currentLine?.speaker === "Gwen") {
          const contextId = `${companionId}-step-${currentStepRef.current}`

          // Calculate advanced similarity
          const similarityResult = calculateAdvancedSimilarity(message.transcript, currentLine.text, contextId, {
            allowPartial: false, // Only process complete sentences
            semanticMatching: true,
            strictMode: false,
          })

          // Enhanced message with similarity data
          const enhancedMessage = {
            ...newMessage,
            similarity: similarityResult,
            isPartial: false,
          }

          setMessages((prev) => [enhancedMessage, ...prev])

          // Handle final similarity result
          handleFinalSimilarityResult(similarityResult, currentStepRef.current)
        } else {
          // Non-user messages (assistant messages)
          console.log("➕ Adding assistant message:", message.transcript)
          setMessages((prev) => [newMessage, ...prev])
        }
      }

      // Handle other message types if needed
      else if (message.type === "speech-start") {
        setIsSpeaking(true)
      } else if (message.type === "speech-end") {
        setIsSpeaking(false)
      }
    },
    [currentLine, companionId, handleFinalSimilarityResult], // Removed messages from dependencies
  )

  // Function to send Leo's message with dynamic timing
  const sendLeoMessage = useCallback(
    (line: TranscriptLine, stepIndex: number) => {
      console.log(`🎤 Attempting to send Leo's message (step ${stepIndex}):`, line.text)

      // Calculate speaking time based on text length
      const speakingTime = calculateSpeakingTime(line.text)
      console.log(`⏱️ Calculated speaking time: ${speakingTime}ms for ${line.text.split(/\s+/).length} words`)

      // Track that we're sending this message
      sentMessagesRef.current.add(line.text.trim())

      try {
        // Method 1: Try add-message
        vapi.send({
          type: "add-message",
          message: {
            role: "assistant",
            content: line.text,
          },
        })
        console.log("✅ Sent via add-message")

        // Method 2: Also try direct say (if available)
        setTimeout(() => {
          try {
            vapi.send({
              type: "say",
              message: line.text,
            })
            console.log("✅ Sent via say command")
          } catch (error) {
            console.log("ℹ️ Say command not available:", error)
          }
        }, 100)
      } catch (error) {
        console.error("❌ Failed to send Leo's message:", error)

        // If VAPI fails, add message locally as fallback
        setMessages((prev) => [
          {
            role: "assistant",
            content: line.text,
            timestamp: Date.now(),
          },
          ...prev,
        ])
      }

      // Return the calculated speaking time for use in scheduling
      return speakingTime
    },
    [calculateSpeakingTime],
  )

  // VAPI Event Handlers
  const handleCallStart = useCallback(() => {
    console.log("📞 Call started - Setting up conversation")
    setCallState({ status: CallStatus.ACTIVE })
    isCallReadyRef.current = true
    conversationCompletedRef.current = false
    sessionCompleteCalledRef.current = false

    console.log("🎯 First line:", steps[0]?.speaker, "-", steps[0]?.text?.substring(0, 50) + "...")

    // If first line is Leo, send it immediately
    if (steps[0]?.speaker === "Leo") {
      console.log("🚀 First line is Leo - sending immediately")
      setTimeout(() => {
        const speakingTime = sendLeoMessage(steps[0], 0)

        // Move to next step after calculated speaking time
        currentTimeoutRef.current = setTimeout(() => {
          setConversationState((prev) => ({
            ...prev,
            currentStep: 1,
          }))
        }, speakingTime)
      }, 1000) // 1 second delay to ensure VAPI is ready
    }
  }, [steps, sendLeoMessage])

  const handleCallEnd = useCallback(() => {
    setCallState({ status: CallStatus.FINISHED })
    isCallReadyRef.current = false
    console.log("📞 Call ended")

    // Clear any pending timeouts
    if (currentTimeoutRef.current) {
      clearTimeout(currentTimeoutRef.current)
      currentTimeoutRef.current = null
    }

    // Clean up all similarity contexts
    for (let i = 0; i < steps.length; i++) {
      resetSimilarityContext(`${companionId}-step-${i}`)
    }
  }, [steps.length, companionId])

  const handleSpeechStart = useCallback(() => {
    console.log("🎤 Speech started")
    setIsSpeaking(true)
  }, [])

  const handleSpeechEnd = useCallback(() => {
    console.log("🎤 Speech ended")
    setIsSpeaking(false)
  }, [])

  const handleError = useCallback((error: Error) => {
    console.error("❌ VAPI Error:", error)
    setCallState({ status: CallStatus.ERROR, error: error.message })
  }, [])

  // Setup VAPI event listeners
  useEffect(() => {
    console.log("🔧 Setting up VAPI event listeners")

    vapi.on("call-start", handleCallStart)
    vapi.on("call-end", handleCallEnd)
    vapi.on("message", handleMessage)
    vapi.on("speech-start", handleSpeechStart)
    vapi.on("speech-end", handleSpeechEnd)
    vapi.on("error", handleError)

    return () => {
      console.log("🧹 Cleaning up VAPI event listeners")
      vapi.off("call-start", handleCallStart)
      vapi.off("call-end", handleCallEnd)
      vapi.off("message", handleMessage)
      vapi.off("speech-start", handleSpeechStart)
      vapi.off("speech-end", handleSpeechEnd)
      vapi.off("error", handleError)
    }
  }, [handleCallStart, handleCallEnd, handleMessage, handleSpeechStart, handleSpeechEnd, handleError])

  // Auto-advance conversation for Leo's lines with dynamic timing
  useEffect(() => {
    if (currentStep === 0 || !isCallReadyRef.current || conversationCompletedRef.current) return

    // Clear any existing timeout
    if (currentTimeoutRef.current) {
      clearTimeout(currentTimeoutRef.current)
      currentTimeoutRef.current = null
    }

    if (currentLine?.speaker === "Leo" && callState.status === CallStatus.ACTIVE) {
      console.log(`🗣️ Leo speaking (step ${currentStep}):`, currentLine.text)

      const speakingTime = sendLeoMessage(currentLine, currentStep)

      // Move to next step after calculated speaking time
      currentTimeoutRef.current = setTimeout(() => {
        if (!conversationCompletedRef.current) {
          setConversationState((prev) => ({
            ...prev,
            currentStep: prev.currentStep + 1,
          }))
        }
      }, speakingTime)
    } else if (currentLine?.speaker === "Gwen" && callState.status === CallStatus.ACTIVE) {
      console.log(`👤 Waiting for user (step ${currentStep}):`, currentLine.text)

      // Wait for user response
      setConversationState((prev) => ({
        ...prev,
        isWaitingForUser: true,
        feedback: `🎯 Your turn: "${currentLine.text}"`,
      }))
    }
  }, [currentStep, currentLine, callState.status, sendLeoMessage])

  // Check for conversation completion - with proper guards
  useEffect(() => {
    if (
      currentStep >= steps.length &&
      steps.length > 0 &&
      !conversationCompletedRef.current &&
      !sessionCompleteCalledRef.current
    ) {
      console.log("🎉 Conversation completed!")
      conversationCompletedRef.current = true
      sessionCompleteCalledRef.current = true

      // Clear any pending timeouts
      if (currentTimeoutRef.current) {
        clearTimeout(currentTimeoutRef.current)
        currentTimeoutRef.current = null
      }

      setConversationState((prev) => ({
        ...prev,
        feedback: "🎉 Conversation completed! Great job!",
      }))

      // Call onSessionComplete only once
      if (onSessionComplete) {
        setTimeout(() => {
          onSessionComplete()
        }, 100)
      }
    }
  }, [currentStep, steps.length, onSessionComplete])

  // Control functions
  const startCall = useCallback(() => {
    console.log("🚀 Starting VAPI call...")
    setCallState({ status: CallStatus.CONNECTING })

    const assistantConfig = configureAssistant(voice, style)
    console.log("🔧 Assistant config:", assistantConfig)

    const assistantOverrides = {
      variableValues: {
        subject,
        topic,
        style,
      },
      clientMessages: ["transcript"] as const,
    }
    console.log("🔧 Assistant overrides:", assistantOverrides)

    try {
      vapi.start(assistantConfig, assistantOverrides)
      console.log("✅ VAPI start called successfully")
    } catch (error) {
      console.error("❌ Failed to start VAPI:", error)
      setCallState({ status: CallStatus.ERROR, error: error.message })
    }
  }, [subject, topic, style, voice])

  const endCall = useCallback(() => {
    console.log("🛑 Ending call...")

    // Clear any pending timeouts
    if (currentTimeoutRef.current) {
      clearTimeout(currentTimeoutRef.current)
      currentTimeoutRef.current = null
    }

    vapi.stop()
    setCallState({ status: CallStatus.FINISHED })
  }, [])

  const toggleMute = useCallback(() => {
    const currentMuteState = vapi.isMuted()
    vapi.setMuted(!currentMuteState)
    setIsMuted(!currentMuteState)
    console.log(`🔇 Mute toggled: ${!currentMuteState}`)
  }, [])

  const resetConversation = useCallback(() => {
    console.log("🔄 Resetting conversation...")

    // Clear any pending timeouts
    if (currentTimeoutRef.current) {
      clearTimeout(currentTimeoutRef.current)
      currentTimeoutRef.current = null
    }

    // Clean up all similarity contexts
    for (let i = 0; i < steps.length; i++) {
      resetSimilarityContext(`${companionId}-step-${i}`)
    }

    // Reset refs
    lastProcessedMessageRef.current = ""
    sentMessagesRef.current.clear()
    conversationCompletedRef.current = false
    sessionCompleteCalledRef.current = false

    setConversationState({
      currentStep: 0,
      totalSteps: steps.length,
      isWaitingForUser: false,
      similarity: null,
    })
    setMessages([])
    isCallReadyRef.current = false
  }, [steps.length, companionId])

  // Additional utility functions
  const skipToStep = useCallback(
    (stepIndex: number) => {
      if (stepIndex >= 0 && stepIndex < steps.length) {
        console.log(`⏭️ Skipping to step ${stepIndex}`)

        // Clear any pending timeouts
        if (currentTimeoutRef.current) {
          clearTimeout(currentTimeoutRef.current)
          currentTimeoutRef.current = null
        }

        // Clean up current step context
        resetSimilarityContext(`${companionId}-step-${conversationState.currentStep}`)

        setConversationState((prev) => ({
          ...prev,
          currentStep: stepIndex,
          isWaitingForUser: false,
          feedback: undefined,
          similarity: null,
        }))
      }
    },
    [steps.length, companionId, conversationState.currentStep],
  )

  const retryCurrentStep = useCallback(() => {
    console.log(`🔄 Retrying step ${conversationState.currentStep}`)

    // Clear any pending timeouts
    if (currentTimeoutRef.current) {
      clearTimeout(currentTimeoutRef.current)
      currentTimeoutRef.current = null
    }

    // Reset context for current step
    resetSimilarityContext(`${companionId}-step-${conversationState.currentStep}`)

    setConversationState((prev) => ({
      ...prev,
      isWaitingForUser: true,
      feedback: currentLine ? `🎯 Let's try again: "${currentLine.text}"` : "Ready to continue!",
      similarity: null,
    }))
  }, [companionId, conversationState.currentStep, currentLine])

  // Manual trigger for testing
  const manualTriggerLeo = useCallback(() => {
    if (currentLine?.speaker === "Leo") {
      console.log("🎯 Manual trigger for Leo's line")
      sendLeoMessage(currentLine, currentStep)
    }
  }, [currentLine, currentStep, sendLeoMessage])

  return {
    // State
    callState,
    conversationState,
    messages,
    isSpeaking,
    isMuted,
    currentLine,

    // Actions
    startCall,
    endCall,
    toggleMute,
    resetConversation,
    skipToStep,
    retryCurrentStep,
    manualTriggerLeo,

    // Computed values
    progress: conversationState.totalSteps > 0 ? (currentStep / conversationState.totalSteps) * 100 : 0,
    hasPartialInput: messages.some((msg) => msg.isPartial),
    currentSimilarity: conversationState.similarity,
  }
}
