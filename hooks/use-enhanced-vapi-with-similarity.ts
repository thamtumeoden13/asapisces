"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { vapi } from "../lib/vapi.sdk"
import { configurePodcastAssistant } from "../lib/vapi-config"
import { calculateAdvancedSimilarity, resetSimilarityContext } from "@/lib/advanced-similarity"
import type { VapiCallState, TranscriptMessage, CallStatusEnum } from "@/types/vapi"
import type { TranscriptLine } from "../types/podcast"

interface UseEnhancedVapiWithSimilarityProps {
  steps: TranscriptLine[]
  topic: string
  voice: string
  style: string
  onStepComplete?: (step: number) => void
  onConversationComplete?: () => void
}

export const useEnhancedVapiWithSimilarity = ({
  steps,
  topic,
  voice,
  style,
  onStepComplete,
  onConversationComplete,
}: UseEnhancedVapiWithSimilarityProps) => {
  const [callState, setCallState] = useState<VapiCallState>({
    status: "inactive" as CallStatusEnum,
  })

  const [conversationState, setConversationState] = useState({
    currentStep: 0,
    totalSteps: steps.length,
    isWaitingForUser: false,
    feedback: "",
    similarity: null as any,
  })

  const [messages, setMessages] = useState<
    Array<{
      role: "user" | "assistant"
      content: string
      timestamp: number
      similarity?: any
    }>
  >([])

  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isMuted, setIsMuted] = useState(false)

  // Refs
  const currentStepRef = useRef(conversationState.currentStep)
  const waitingTimeoutRef = useRef<NodeJS.Timeout>()

  // Update ref when step changes
  useEffect(() => {
    currentStepRef.current = conversationState.currentStep
  }, [conversationState.currentStep])

  const currentLine = steps[conversationState.currentStep] || null

  // Enhanced transcript handler with advanced similarity
  const handleTranscript = useCallback(
    (message: TranscriptMessage) => {
      if (message.transcriptType === "final" && message.role === "user") {
        const currentStep = currentStepRef.current
        const currentLine = steps[currentStep]

        if (!currentLine || currentLine.speaker !== "Gwen") return

        // Calculate advanced similarity
        const contextId = `step-${currentStep}`
        const similarityResult = calculateAdvancedSimilarity(message.transcript, currentLine.text, contextId, {
          allowPartial: true,
          semanticMatching: true,
          strictMode: false,
        })

        // Add message with similarity info
        const newMessage = {
          role: message.role,
          content: message.transcript,
          timestamp: Date.now(),
          similarity: similarityResult,
        }

        setMessages((prev) => [newMessage, ...prev])

        // Handle partial matches (user still speaking)
        if (similarityResult.isPartialMatch) {
          setConversationState((prev) => ({
            ...prev,
            feedback: similarityResult.feedback,
            similarity: similarityResult,
          }))

          // Clear any existing timeout and set new one
          if (waitingTimeoutRef.current) {
            clearTimeout(waitingTimeoutRef.current)
          }

          // Wait for more input
          waitingTimeoutRef.current = setTimeout(() => {
            // If no more input after timeout, evaluate what we have
            const finalResult = calculateAdvancedSimilarity(message.transcript, currentLine.text, contextId, {
              allowPartial: false,
            })

            handleSimilarityResult(finalResult, currentStep)
          }, 3000) // Wait 3 seconds for more input

          return
        }

        // Handle complete input
        handleSimilarityResult(similarityResult, currentStep)
      }
    },
    [steps],
  )

  // Handle similarity result and determine next action
  const handleSimilarityResult = useCallback(
    (similarityResult: any, stepIndex: number) => {
      const shouldAdvance = similarityResult.score >= 0.6 // Lower threshold for advancement

      setConversationState((prev) => ({
        ...prev,
        feedback: similarityResult.feedback,
        similarity: similarityResult,
        ...(shouldAdvance && {
          currentStep: prev.currentStep + 1,
          isWaitingForUser: false,
        }),
      }))

      if (shouldAdvance) {
        // Reset context for this step
        resetSimilarityContext(`step-${stepIndex}`)
        onStepComplete?.(stepIndex)
      }

      // Clear waiting timeout
      if (waitingTimeoutRef.current) {
        clearTimeout(waitingTimeoutRef.current)
        waitingTimeoutRef.current = undefined
      }
    },
    [onStepComplete],
  )

  // VAPI Event Handlers
  const handleCallStart = useCallback(() => {
    setCallState((prev) => ({ ...prev, status: "active" as CallStatusEnum }))
  }, [])

  const handleCallEnd = useCallback(() => {
    setCallState((prev) => ({ ...prev, status: "ended" as CallStatusEnum }))

    // Clean up all contexts
    for (let i = 0; i < steps.length; i++) {
      resetSimilarityContext(`step-${i}`)
    }
  }, [steps.length])

  const handleMessage = useCallback(
    (message: any) => {
      if (message.type === "transcript") {
        handleTranscript(message as TranscriptMessage)
      }
    },
    [handleTranscript],
  )

  const handleSpeechStart = useCallback(() => setIsSpeaking(true), [])
  const handleSpeechEnd = useCallback(() => setIsSpeaking(false), [])
  const handleError = useCallback((error: Error) => {
    console.error("VAPI Error:", error)
    setCallState((prev) => ({ ...prev, status: "error" as CallStatusEnum, error: error.message }))
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

  // Auto-advance for Leo's lines
  useEffect(() => {
    if (currentLine?.speaker === "Leo" && callState.status === "active") {
      // Send Leo's message
      vapi.send({
        type: "add-message",
        message: {
          role: "assistant",
          content: currentLine.text,
        },
      })

      // Add to messages
      setMessages((prev) => [
        {
          role: "assistant",
          content: `Leo: ${currentLine.text}`,
          timestamp: Date.now(),
        },
        ...prev,
      ])

      // Auto-advance after delay
      setTimeout(() => {
        setConversationState((prev) => ({
          ...prev,
          currentStep: prev.currentStep + 1,
        }))
      }, 3000)
    } else if (currentLine?.speaker === "Gwen" && callState.status === "active") {
      setConversationState((prev) => ({
        ...prev,
        isWaitingForUser: true,
        feedback: `🎯 Your turn to say: "${currentLine.text}"`,
      }))
    }
  }, [conversationState.currentStep, currentLine, callState.status])

  // Check for conversation completion
  useEffect(() => {
    if (conversationState.currentStep >= steps.length && steps.length > 0) {
      setConversationState((prev) => ({
        ...prev,
        feedback: "🎉 Conversation completed! Excellent work!",
      }))
      onConversationComplete?.()
    }
  }, [conversationState.currentStep, steps.length, onConversationComplete])

  // Control functions
  const startCall = useCallback(async () => {
    try {
      setCallState((prev) => ({ ...prev, status: "connecting" as CallStatusEnum }))

      const assistant = configurePodcastAssistant(voice, style, topic, steps)
      const assistantOverrides = {
        variableValues: { topic, style },
      }

      await vapi.start(assistant, assistantOverrides)
    } catch (error) {
      console.error("Failed to start call:", error)
      setCallState((prev) => ({
        ...prev,
        status: "error" as CallStatusEnum,
        error: error instanceof Error ? error.message : "Failed to start call",
      }))
    }
  }, [voice, style, topic, steps])

  const endCall = useCallback(() => {
    vapi.stop()
  }, [])

  const toggleMute = useCallback(() => {
    const currentMuteState = vapi.isMuted()
    vapi.setMuted(!currentMuteState)
    setIsMuted(!currentMuteState)
  }, [])

  const resetConversation = useCallback(() => {
    // Reset all similarity contexts
    for (let i = 0; i < steps.length; i++) {
      resetSimilarityContext(`step-${i}`)
    }

    setConversationState({
      currentStep: 0,
      totalSteps: steps.length,
      isWaitingForUser: false,
      feedback: "",
      similarity: null,
    })
    setMessages([])

    if (waitingTimeoutRef.current) {
      clearTimeout(waitingTimeoutRef.current)
    }
  }, [steps.length])

  return {
    callState,
    conversationState,
    messages,
    isSpeaking,
    isMuted,
    currentLine,
    startCall,
    endCall,
    toggleMute,
    resetConversation,
    progress:
      conversationState.totalSteps > 0 ? (conversationState.currentStep / conversationState.totalSteps) * 100 : 0,
  }
}
