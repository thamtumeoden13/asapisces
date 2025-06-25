"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { vapi } from "@/lib/vapi.sdk"
import { configureAssistant } from "@/lib/vapi-config"
import { calculateAdvancedSimilarity, resetSimilarityContext } from "@/lib/advanced-similarity"
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

  // Refs for managing async operations
  const currentStepRef = useRef(conversationState.currentStep)
  const partialInputTimeoutRef = useRef<NodeJS.Timeout>()

  // Update ref when step changes
  useEffect(() => {
    currentStepRef.current = conversationState.currentStep
  }, [conversationState.currentStep])

  const currentStep = conversationState.currentStep
  const currentLine = steps[currentStep] || null

  // Enhanced message handler with advanced similarity
  const handleMessage = useCallback(
    (message: VapiMessage) => {
      if (message.type === "transcript" && message.transcriptType === "final") {
        const newMessage = {
          role: message.role,
          content: message.transcript,
          timestamp: Date.now(),
        }

        // Handle user responses with advanced similarity
        if (message.role === "user" && currentLine?.speaker === "Gwen") {
          const contextId = `${companionId}-step-${currentStepRef.current}`

          // Calculate advanced similarity
          const similarityResult = calculateAdvancedSimilarity(message.transcript, currentLine.text, contextId, {
            allowPartial: true,
            semanticMatching: true,
            strictMode: false,
          })

          // Enhanced message with similarity data
          const enhancedMessage = {
            ...newMessage,
            similarity: similarityResult,
            isPartial: similarityResult.isPartialMatch,
          }

          setMessages((prev) => [enhancedMessage, ...prev])

          // Handle partial input (user still speaking)
          if (similarityResult.isPartialMatch) {
            setConversationState((prev) => ({
              ...prev,
              feedback: similarityResult.feedback,
              similarity: similarityResult,
            }))

            // Clear existing timeout and set new one
            if (partialInputTimeoutRef.current) {
              clearTimeout(partialInputTimeoutRef.current)
            }

            // Wait for more input before final evaluation
            partialInputTimeoutRef.current = setTimeout(() => {
              // Force final evaluation after timeout
              const finalResult = calculateAdvancedSimilarity(message.transcript, currentLine.text, contextId, {
                allowPartial: false, // Force final evaluation
                semanticMatching: true,
                strictMode: false,
              })

              handleFinalSimilarityResult(finalResult, currentStepRef.current)
            }, 3000) // Wait 3 seconds for more input

            return
          }

          // Handle complete input immediately
          handleFinalSimilarityResult(similarityResult, currentStepRef.current)
        } else {
          // Non-user messages (assistant messages)
          setMessages((prev) => [newMessage, ...prev])
        }
      }
    },
    [currentLine, companionId],
  )

  // Handle final similarity result and determine next action
  const handleFinalSimilarityResult = useCallback(
    (similarityResult: any, stepIndex: number) => {
      // Clear any pending timeout
      if (partialInputTimeoutRef.current) {
        clearTimeout(partialInputTimeoutRef.current)
        partialInputTimeoutRef.current = undefined
      }

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

  // VAPI Event Handlers (unchanged)
  const handleCallStart = useCallback(() => {
    setCallState({ status: CallStatus.ACTIVE })
    console.log("📞 Call started")
  }, [])

  const handleCallEnd = useCallback(() => {
    setCallState({ status: CallStatus.FINISHED })
    console.log("📞 Call ended")

    // Clean up all similarity contexts
    for (let i = 0; i < steps.length; i++) {
      resetSimilarityContext(`${companionId}-step-${i}`)
    }

    // Clear any pending timeouts
    if (partialInputTimeoutRef.current) {
      clearTimeout(partialInputTimeoutRef.current)
    }
  }, [steps.length, companionId])

  const handleSpeechStart = useCallback(() => {
    setIsSpeaking(true)
  }, [])

  const handleSpeechEnd = useCallback(() => {
    setIsSpeaking(false)
  }, [])

  const handleError = useCallback((error: Error) => {
    console.error("VAPI Error:", error)
    setCallState({ status: CallStatus.ERROR, error: error.message })
  }, [])

  // Setup VAPI event listeners
  useEffect(() => {
    vapi.on("call-start", handleCallStart)
    vapi.on("call-end", handleCallEnd)
    vapi.on("message", handleMessage)
    vapi.on("speech-start", handleSpeechStart)
    vapi.on("speech-end", handleSpeechEnd)
    vapi.on("error", handleError)

    return () => {
      vapi.off("call-start", handleCallStart)
      vapi.off("call-end", handleCallEnd)
      vapi.off("message", handleMessage)
      vapi.off("speech-start", handleSpeechStart)
      vapi.off("speech-end", handleSpeechEnd)
      vapi.off("error", handleError)
    }
  }, [handleCallStart, handleCallEnd, handleMessage, handleSpeechStart, handleSpeechEnd, handleError])

  // Auto-advance conversation for Leo's lines
  useEffect(() => {
    if (currentLine?.speaker === "Leo" && callState.status === CallStatus.ACTIVE) {
      // Send Leo's message to VAPI
      vapi.send({
        type: "add-message",
        message: {
          role: "assistant",
          content: currentLine.text,
        },
      })

      // Add to local messages
      setMessages((prev) => [
        {
          role: "assistant",
          content: currentLine.text,
          timestamp: Date.now(),
        },
        ...prev,
      ])

      // Move to next step after a delay
      setTimeout(() => {
        setConversationState((prev) => ({
          ...prev,
          currentStep: prev.currentStep + 1,
        }))
      }, 2000)
    } else if (currentLine?.speaker === "Gwen" && callState.status === CallStatus.ACTIVE) {
      // Wait for user response
      setConversationState((prev) => ({
        ...prev,
        isWaitingForUser: true,
        feedback: `🎯 Your turn: "${currentLine.text}"`,
      }))
    }
  }, [currentStep, currentLine, callState.status])

  // Check for conversation completion
  useEffect(() => {
    if (currentStep >= steps.length && steps.length > 0) {
      setConversationState((prev) => ({
        ...prev,
        feedback: "🎉 Conversation completed! Great job!",
      }))
      onSessionComplete?.()
    }
  }, [currentStep, steps.length, onSessionComplete])

  // Control functions
  const startCall = useCallback(() => {
    setCallState({ status: CallStatus.CONNECTING })

    const assistantOverrides = {
      variableValues: {
        subject,
        topic,
        style,
      },
      clientMessages: ["transcript"] as const,
    }

    vapi.start(configureAssistant(voice, style), assistantOverrides)
  }, [subject, topic, style, voice])

  const endCall = useCallback(() => {
    vapi.stop()
    setCallState({ status: CallStatus.FINISHED })
  }, [])

  const toggleMute = useCallback(() => {
    const currentMuteState = vapi.isMuted()
    vapi.setMuted(!currentMuteState)
    setIsMuted(!currentMuteState)
  }, [])

  const resetConversation = useCallback(() => {
    // Clean up all similarity contexts
    for (let i = 0; i < steps.length; i++) {
      resetSimilarityContext(`${companionId}-step-${i}`)
    }

    // Clear timeouts
    if (partialInputTimeoutRef.current) {
      clearTimeout(partialInputTimeoutRef.current)
    }

    setConversationState({
      currentStep: 0,
      totalSteps: steps.length,
      isWaitingForUser: false,
      similarity: null,
    })
    setMessages([])
  }, [steps.length, companionId])

  // Additional utility functions
  const skipToStep = useCallback(
    (stepIndex: number) => {
      if (stepIndex >= 0 && stepIndex < steps.length) {
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
    // Reset context for current step
    resetSimilarityContext(`${companionId}-step-${conversationState.currentStep}`)

    setConversationState((prev) => ({
      ...prev,
      isWaitingForUser: true,
      feedback: currentLine ? `🎯 Let's try again: "${currentLine.text}"` : "Ready to continue!",
      similarity: null,
    }))
  }, [companionId, conversationState.currentStep, currentLine])

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

    // Computed values
    progress: conversationState.totalSteps > 0 ? (currentStep / conversationState.totalSteps) * 100 : 0,
    hasPartialInput: messages.some((msg) => msg.isPartial),
    currentSimilarity: conversationState.similarity,
  }
}
