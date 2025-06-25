"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { vapi } from "@/lib/vapi.sdk"
import { configureAssistant } from "@/lib/vapi-config"
import { calculateAdvancedSimilarity, resetSimilarityContext } from "@/lib/enhanced-similarity-for-long-sentences"
import type { VapiMessage, VapiCallState, ConversationState, TranscriptLine } from "../types/podcast"
import { CallStatus } from "../types/podcast"

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

  const [conversationState, setConversationState] = useState<ConversationState & { similarity?: any }>({
    currentStep: 0,
    totalSteps: steps.length,
    isWaitingForUser: false,
    similarity: null,
  })

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

  // Enhanced refs for long sentence handling
  const currentStepRef = useRef(conversationState.currentStep)
  const partialInputTimeoutRef = useRef<NodeJS.Timeout>()
  const isCallReadyRef = useRef(false)
  const lastTranscriptRef = useRef<string>("")

  // Update ref when step changes
  useEffect(() => {
    currentStepRef.current = conversationState.currentStep
  }, [conversationState.currentStep])

  const currentStep = conversationState.currentStep
  const currentLine = steps[currentStep] || null

  // Enhanced message handler with better long sentence support
  const handleMessage = useCallback(
    (message: VapiMessage) => {
      console.log("📨 Received VAPI message:", message)

      if (message.type === "transcript") {
        // Handle both partial and final transcripts for better UX
        if (message.transcriptType === "partial") {
          // Update UI to show user is speaking
          lastTranscriptRef.current = message.transcript
          console.log("🎤 Partial transcript:", message.transcript)
          return
        }

        if (message.transcriptType === "final") {
          const newMessage = {
            role: message.role,
            content: message.transcript,
            timestamp: Date.now(),
          }

          // Handle user responses with enhanced similarity for long sentences
          if (message.role === "user" && currentLine?.speaker === "Gwen") {
            const contextId = `${companionId}-step-${currentStepRef.current}`

            // Detect if this is a long sentence
            const expectedWords = currentLine.text.split(/\s+/)
            const isLongSentence = expectedWords.length >= 15

            console.log(`🔍 Analyzing ${isLongSentence ? "LONG" : "short"} sentence (${expectedWords.length} words)`)

            // Calculate enhanced similarity with long sentence awareness
            const similarityResult = calculateAdvancedSimilarity(message.transcript, currentLine.text, contextId, {
              allowPartial: true,
              semanticMatching: true,
              strictMode: false,
              isLongSentence,
            })

            console.log("📊 Similarity result:", {
              score: similarityResult.score,
              completeness: similarityResult.completenessRatio,
              isPartial: similarityResult.isPartialMatch,
              shouldWait: similarityResult.shouldWaitForMore,
            })

            // Enhanced message with similarity data
            const enhancedMessage = {
              ...newMessage,
              similarity: similarityResult,
              isPartial: similarityResult.isPartialMatch,
            }

            setMessages((prev) => [enhancedMessage, ...prev])

            // Enhanced handling for partial input and long sentences
            if (similarityResult.shouldWaitForMore || similarityResult.isPartialMatch) {
              setConversationState((prev) => ({
                ...prev,
                feedback: similarityResult.feedback,
                similarity: similarityResult,
              }))

              // Clear existing timeout and set new one with longer delay for long sentences
              if (partialInputTimeoutRef.current) {
                clearTimeout(partialInputTimeoutRef.current)
              }

              const timeoutDuration = isLongSentence ? 5000 : 3000 // Longer timeout for long sentences

              partialInputTimeoutRef.current = setTimeout(() => {
                console.log("⏰ Timeout reached, forcing final evaluation")
                // Force final evaluation after timeout
                const finalResult = calculateAdvancedSimilarity(message.transcript, currentLine.text, contextId, {
                  allowPartial: false,
                  semanticMatching: true,
                  strictMode: false,
                  isLongSentence,
                })

                handleFinalSimilarityResult(finalResult, currentStepRef.current)
              }, timeoutDuration)

              return
            }

            // Handle complete input immediately
            handleFinalSimilarityResult(similarityResult, currentStepRef.current)
          } else {
            // Non-user messages (assistant messages)
            setMessages((prev) => [newMessage, ...prev])
          }
        }
      }
    },
    [currentLine, companionId],
  )

  // Enhanced final similarity result handler
  const handleFinalSimilarityResult = useCallback(
    (similarityResult: any, stepIndex: number) => {
      // Clear any pending timeout
      if (partialInputTimeoutRef.current) {
        clearTimeout(partialInputTimeoutRef.current)
        partialInputTimeoutRef.current = undefined
      }

      // Enhanced threshold logic for long sentences
      const currentLineText = steps[stepIndex]?.text || ""
      const isLongSentence = currentLineText.split(/\s+/).length >= 15

      // Adjust advancement threshold based on sentence length
      let advancementThreshold = 0.5 // Default threshold

      if (isLongSentence) {
        // For long sentences, require higher completeness
        if (similarityResult.completenessRatio >= 0.7 && similarityResult.score >= 0.4) {
          advancementThreshold = 0.4 // Lower score threshold if good completeness
        } else {
          advancementThreshold = 0.6 // Higher threshold for incomplete long sentences
        }
      }

      const shouldAdvance = similarityResult.score >= advancementThreshold

      console.log(`🎯 Final evaluation (step ${stepIndex}):`, {
        score: similarityResult.score,
        threshold: advancementThreshold,
        completeness: similarityResult.completenessRatio,
        shouldAdvance,
        isLongSentence,
      })

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
        console.log(`✅ Step ${stepIndex} completed with score: ${similarityResult.score.toFixed(2)}`)
      } else {
        console.log(`🔄 Step ${stepIndex} needs retry. Score: ${similarityResult.score.toFixed(2)}`)
      }
    },
    [companionId, steps],
  )

  // Function to send Leo's message
  const sendLeoMessage = useCallback((line: TranscriptLine, stepIndex: number) => {
    console.log(`🎤 Sending Leo's message (step ${stepIndex}):`, line.text)

    try {
      vapi.send({
        type: "add-message",
        message: {
          role: "assistant",
          content: line.text,
        },
      })
      console.log("✅ Sent Leo's message successfully")
    } catch (error) {
      console.error("❌ Failed to send Leo's message:", error)
    }

    // Add to local messages
    setMessages((prev) => [
      {
        role: "assistant",
        content: line.text,
        timestamp: Date.now(),
      },
      ...prev,
    ])
  }, [])

  // VAPI Event Handlers
  const handleCallStart = useCallback(() => {
    console.log("📞 Call started - Setting up conversation")
    setCallState({ status: CallStatus.ACTIVE })
    isCallReadyRef.current = true

    console.log("🎯 First line:", steps[0]?.speaker, "-", steps[0]?.text?.substring(0, 50) + "...")

    // If first line is Leo, send it immediately
    if (steps[0]?.speaker === "Leo") {
      console.log("🚀 First line is Leo - sending immediately")
      setTimeout(() => {
        sendLeoMessage(steps[0], 0)

        // Move to next step
        setTimeout(() => {
          setConversationState((prev) => ({
            ...prev,
            currentStep: 1,
          }))
        }, 3000)
      }, 1000)
    }
  }, [steps, sendLeoMessage])

  const handleCallEnd = useCallback(() => {
    setCallState({ status: CallStatus.FINISHED })
    isCallReadyRef.current = false
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

  // Auto-advance conversation for Leo's lines (skip step 0 as handled above)
  useEffect(() => {
    if (currentStep === 0 || !isCallReadyRef.current) return

    if (currentLine?.speaker === "Leo" && callState.status === CallStatus.ACTIVE) {
      console.log(`🗣️ Leo speaking (step ${currentStep}):`, currentLine.text)

      sendLeoMessage(currentLine, currentStep)

      // Move to next step after a delay
      setTimeout(() => {
        setConversationState((prev) => ({
          ...prev,
          currentStep: prev.currentStep + 1,
        }))
      }, 3000)
    } else if (currentLine?.speaker === "Gwen" && callState.status === CallStatus.ACTIVE) {
      const isLongSentence = currentLine.text.split(/\s+/).length >= 15
      console.log(
        `👤 Waiting for user (step ${currentStep}, ${isLongSentence ? "LONG" : "short"} sentence):`,
        currentLine.text,
      )

      // Enhanced feedback for long sentences
      const feedback = isLongSentence
        ? `🎯 Your turn (this is a longer sentence, take your time): "${currentLine.text}"`
        : `🎯 Your turn: "${currentLine.text}"`

      setConversationState((prev) => ({
        ...prev,
        isWaitingForUser: true,
        feedback,
      }))
    }
  }, [currentStep, currentLine, callState.status, sendLeoMessage])

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
    console.log("🚀 Starting VAPI call...")
    setCallState({ status: CallStatus.CONNECTING })

    const assistantConfig = configureAssistant(voice, style)
    const assistantOverrides = {
      variableValues: {
        subject,
        topic,
        style,
      },
      clientMessages: ["transcript"] as const,
    }

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
    isCallReadyRef.current = false
    lastTranscriptRef.current = ""
  }, [steps.length, companionId])

  // Additional utility functions
  const skipToStep = useCallback(
    (stepIndex: number) => {
      if (stepIndex >= 0 && stepIndex < steps.length) {
        console.log(`⏭️ Skipping to step ${stepIndex}`)

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

    // Reset context for current step
    resetSimilarityContext(`${companionId}-step-${conversationState.currentStep}`)

    const isLongSentence = currentLine ? currentLine.text.split(/\s+/).length >= 15 : false
    const feedback = isLongSentence
      ? `🎯 Let's try again (take your time with this longer sentence): "${currentLine?.text}"`
      : `🎯 Let's try again: "${currentLine?.text}"`

    setConversationState((prev) => ({
      ...prev,
      isWaitingForUser: true,
      feedback,
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
