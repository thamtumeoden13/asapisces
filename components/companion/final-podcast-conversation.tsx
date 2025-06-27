"use client"

import { useRef, useCallback, useState, useEffect } from "react"
import Lottie, { type LottieRefCurrentProps } from "lottie-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { vapi } from "@/lib/vapi.sdk"
import { configureAssistant } from "@/lib/vapi-config"
import { calculateAdvancedSimilarity, resetSimilarityContext } from "@/lib/enhanced-similarity-for-long-sentences"
import { podcastTopics, topicTitles } from "@/data/podcast-topics"
import type {
  TopicKey,
  CompanionComponentProps,
  VapiMessage,
  VapiCallState,
  ConversationState,
  TranscriptLine,
} from "@/types/podcast"
import { CallStatus } from "@/types/podcast"
import soundwaves from "@/constants/soundwaves.json"

const cn = (...classes: (string | undefined)[]) => classes.filter(Boolean).join(" ")

const getSubjectColor = (subject: string) => {
  const colors: Record<string, string> = {
    english: "#3B82F6",
    math: "#EF4444",
    science: "#10B981",
    history: "#F59E0B",
    default: "#6B7280",
  }
  return colors[subject] || colors.default
}

interface FinalPodcastConversationProps extends Partial<CompanionComponentProps> {
  selectedTopic?: TopicKey
  onTopicComplete?: (topic: TopicKey) => void
}

const FinalPodcastConversation = ({
  companionId = "demo",
  subject = "english",
  topic = "intro",
  name = "Leo & Gwen",
  userName = "Student",
  userImage = "/placeholder.svg?height=130&width=130",
  style = "conversational",
  voice = "friendly",
  selectedTopic,
  onTopicComplete,
}: FinalPodcastConversationProps) => {
  const lottieRef = useRef<LottieRefCurrentProps>(null)

  // Enhanced refs for managing Leo's complete speech delivery
  const currentStepRef = useRef(0)
  const partialInputTimeoutRef = useRef<NodeJS.Timeout>()
  const isCallReadyRef = useRef(false)
  const leoSpeechTimeoutRef = useRef<NodeJS.Timeout>()
  const speechDeliveryLockRef = useRef(false)

  // State management
  const [showDebug, setShowDebug] = useState(process.env.NODE_ENV === "development")
  const [activeTab, setActiveTab] = useState("conversation")

  const [callState, setCallState] = useState<VapiCallState>({
    status: CallStatus.INACTIVE,
  })

  const [conversationState, setConversationState] = useState<
    ConversationState & {
      similarity?: any
      feedback?: string
    }
  >({
    currentStep: 0,
    totalSteps: 0,
    isWaitingForUser: false,
    similarity: null,
    feedback: null,
  })

  const [messages, setMessages] = useState<
    Array<{
      role: "user" | "assistant"
      content: string
      timestamp: number
      similarity?: any
      isPartial?: boolean
      stepIndex?: number
      speaker?: string
      isComplete?: boolean
    }>
  >([])

  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [leoSpeechProgress, setLeoSpeechProgress] = useState({
    isDelivering: false,
    currentSentence: "",
    progress: 0,
    estimatedDuration: 0,
  })

  // Get steps for current topic
  const currentTopic = (selectedTopic || topic) as TopicKey
  const steps = podcastTopics[currentTopic] || []
  const currentStep = conversationState.currentStep
  const currentLine = steps[currentStep] || null

  // Update refs when step changes
  useEffect(() => {
    currentStepRef.current = conversationState.currentStep
  }, [conversationState.currentStep])

  // Initialize conversation state when steps change
  useEffect(() => {
    setConversationState((prev) => ({
      ...prev,
      totalSteps: steps.length,
    }))
  }, [steps.length])

  // Enhanced Leo message delivery function
  const deliverLeoMessage = useCallback((line: TranscriptLine, stepIndex: number) => {
    if (speechDeliveryLockRef.current) {
      console.log("🔒 Speech delivery locked, skipping duplicate")
      return
    }

    speechDeliveryLockRef.current = true
    console.log(`🎤 Leo delivering COMPLETE message (step ${stepIndex}):`, line.text)

    // Calculate delivery timing based on sentence complexity
    const wordCount = line.text.split(/\s+/).length
    const sentenceCount = line.text.split(/[.!?]+/).filter((s) => s.trim()).length
    const hasCommas = (line.text.match(/,/g) || []).length

    // Enhanced timing calculation
    const baseTime = 2000 // 2 seconds minimum
    const wordTime = wordCount * 120 // 120ms per word (slower for clarity)
    const sentenceTime = sentenceCount * 500 // 500ms pause per sentence
    const commaTime = hasCommas * 200 // 200ms pause per comma
    const estimatedDuration = baseTime + wordTime + sentenceTime + commaTime

    console.log(
      `⏱️ Leo speech timing: ${wordCount} words, ${sentenceCount} sentences, ${hasCommas} commas = ${estimatedDuration}ms`,
    )

    // Start Leo speech progress tracking
    setLeoSpeechProgress({
      isDelivering: true,
      currentSentence: line.text,
      progress: 0,
      estimatedDuration,
    })

    try {
      // Send complete message with enhanced metadata
      vapi.send({
        type: "add-message",
        message: {
          role: "assistant",
          content: line.text,
          metadata: {
            deliveryType: "complete-sentence",
            preventInterruption: true,
            stepIndex: stepIndex,
            speaker: "Leo",
            wordCount: wordCount,
            estimatedDuration: estimatedDuration,
            timestamp: Date.now(),
          },
        },
      })

      // Backup delivery instruction
      setTimeout(() => {
        vapi.send({
          type: "function_call",
          function_call: {
            name: "deliver_complete_speech",
            parameters: {
              text: line.text,
              prevent_interruption: true,
              ensure_completion: true,
              duration_ms: estimatedDuration,
            },
          },
        })
      }, 100)

      console.log("✅ Leo message sent with complete delivery instructions")
    } catch (error) {
      console.error("❌ Failed to send Leo's message:", error)
      speechDeliveryLockRef.current = false
      return
    }

    // Add to local messages immediately
    setMessages((prev) => [
      {
        role: "assistant",
        content: line.text,
        timestamp: Date.now(),
        stepIndex: stepIndex,
        speaker: "Leo",
        isComplete: true,
      },
      ...prev,
    ])

    // Progress tracking interval
    const progressInterval = setInterval(() => {
      setLeoSpeechProgress((prev) => {
        const newProgress = Math.min(prev.progress + 100 / (estimatedDuration / 100), 100)
        return { ...prev, progress: newProgress }
      })
    }, 100)

    // Complete delivery after estimated duration
    leoSpeechTimeoutRef.current = setTimeout(() => {
      console.log(`✅ Leo completed speaking step ${stepIndex}`)

      clearInterval(progressInterval)
      setLeoSpeechProgress({
        isDelivering: false,
        currentSentence: "",
        progress: 100,
        estimatedDuration: 0,
      })

      speechDeliveryLockRef.current = false

      // Move to next step
      setTimeout(() => {
        setConversationState((prev) => ({
          ...prev,
          currentStep: prev.currentStep + 1,
        }))
      }, 500) // Small buffer before advancing
    }, estimatedDuration)

    return () => {
      clearInterval(progressInterval)
      if (leoSpeechTimeoutRef.current) {
        clearTimeout(leoSpeechTimeoutRef.current)
      }
    }
  }, [])

  // Enhanced message handler
  const handleMessage = useCallback(
    (message: VapiMessage) => {
      console.log("📨 Received VAPI message:", message)

      if (message.type === "transcript") {
        if (message.transcriptType === "partial") {
          console.log("🎤 Partial transcript:", message.transcript)
          return
        }

        if (message.transcriptType === "final") {
          const newMessage = {
            role: message.role,
            content: message.transcript,
            timestamp: Date.now(),
          }

          // Handle user responses with enhanced similarity
          if (message.role === "user" && currentLine?.speaker === "Gwen") {
            const contextId = `${companionId}-step-${currentStepRef.current}`
            const expectedWords = currentLine.text.split(/\s+/)
            const isLongSentence = expectedWords.length >= 15

            console.log(`🔍 Analyzing ${isLongSentence ? "LONG" : "short"} sentence (${expectedWords.length} words)`)

            const similarityResult = calculateAdvancedSimilarity(message.transcript, currentLine.text, contextId, {
              allowPartial: true,
              semanticMatching: true,
              strictMode: false,
              isLongSentence,
            })

            const enhancedMessage = {
              ...newMessage,
              similarity: similarityResult,
              isPartial: similarityResult.isPartialMatch,
              stepIndex: currentStepRef.current,
            }

            setMessages((prev) => [enhancedMessage, ...prev])

            // Handle partial vs complete input
            if (similarityResult.shouldWaitForMore || similarityResult.isPartialMatch) {
              setConversationState((prev) => ({
                ...prev,
                feedback: similarityResult.feedback,
                similarity: similarityResult,
              }))

              if (partialInputTimeoutRef.current) {
                clearTimeout(partialInputTimeoutRef.current)
              }

              const timeoutDuration = isLongSentence ? 5000 : 3000

              partialInputTimeoutRef.current = setTimeout(() => {
                console.log("⏰ Timeout reached, forcing final evaluation")
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

            handleFinalSimilarityResult(similarityResult, currentStepRef.current)
          } else {
            setMessages((prev) => [newMessage, ...prev])
          }
        }
      }
    },
    [currentLine, companionId],
  )

  // Handle final similarity result
  const handleFinalSimilarityResult = useCallback(
    (similarityResult: any, stepIndex: number) => {
      if (partialInputTimeoutRef.current) {
        clearTimeout(partialInputTimeoutRef.current)
        partialInputTimeoutRef.current = undefined
      }

      const currentLineText = steps[stepIndex]?.text || ""
      const isLongSentence = currentLineText.split(/\s+/).length >= 15

      let advancementThreshold = 0.5

      if (isLongSentence) {
        if (similarityResult.completenessRatio >= 0.7 && similarityResult.score >= 0.4) {
          advancementThreshold = 0.4
        } else {
          advancementThreshold = 0.6
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
        resetSimilarityContext(`${companionId}-step-${stepIndex}`)
        console.log(`✅ Step ${stepIndex} completed with score: ${similarityResult.score.toFixed(2)}`)
      } else {
        console.log(`🔄 Step ${stepIndex} needs retry. Score: ${similarityResult.score.toFixed(2)}`)
      }
    },
    [companionId, steps],
  )

  // VAPI Event Handlers
  const handleCallStart = useCallback(() => {
    console.log("📞 Call started - Setting up conversation")
    setCallState({ status: CallStatus.ACTIVE })
    isCallReadyRef.current = true

    console.log("🎯 First line:", steps[0]?.speaker, "-", steps[0]?.text?.substring(0, 50) + "...")

    if (steps[0]?.speaker === "Leo") {
      console.log("🚀 First line is Leo - delivering immediately")
      setTimeout(() => {
        deliverLeoMessage(steps[0], 0)
      }, 1000)
    }
  }, [steps, deliverLeoMessage])

  const handleCallEnd = useCallback(() => {
    setCallState({ status: CallStatus.FINISHED })
    isCallReadyRef.current = false
    speechDeliveryLockRef.current = false
    console.log("📞 Call ended")

    // Cleanup all contexts and timeouts
    for (let i = 0; i < steps.length; i++) {
      resetSimilarityContext(`${companionId}-step-${i}`)
    }

    if (partialInputTimeoutRef.current) {
      clearTimeout(partialInputTimeoutRef.current)
    }
    if (leoSpeechTimeoutRef.current) {
      clearTimeout(leoSpeechTimeoutRef.current)
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
    speechDeliveryLockRef.current = false
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

  // Auto-advance conversation for Leo's lines
  useEffect(() => {
    if (currentStep === 0 || !isCallReadyRef.current) return

    if (currentLine?.speaker === "Leo" && callState.status === CallStatus.ACTIVE) {
      console.log(`🗣️ Leo speaking COMPLETE sentence (step ${currentStep}):`, currentLine.text)
      deliverLeoMessage(currentLine, currentStep)
    } else if (currentLine?.speaker === "Gwen" && callState.status === CallStatus.ACTIVE) {
      const isLongSentence = currentLine.text.split(/\s+/).length >= 15
      console.log(
        `👤 Waiting for user (step ${currentStep}, ${isLongSentence ? "LONG" : "short"} sentence):`,
        currentLine.text,
      )

      const feedback = isLongSentence
        ? `🎯 Your turn (this is a longer sentence, take your time): "${currentLine.text}"`
        : `🎯 Your turn: "${currentLine.text}"`

      setConversationState((prev) => ({
        ...prev,
        isWaitingForUser: true,
        feedback,
      }))
    }
  }, [currentStep, currentLine, callState.status, deliverLeoMessage])

  // Check for conversation completion
  useEffect(() => {
    if (currentStep >= steps.length && steps.length > 0) {
      setConversationState((prev) => ({
        ...prev,
        feedback: "🎉 Conversation completed! Great job!",
      }))
      onTopicComplete?.(currentTopic)
    }
  }, [currentStep, steps.length, onTopicComplete, currentTopic])

  // Control functions
  const startCall = useCallback(() => {
    console.log("🚀 Starting VAPI call...")
    setCallState({ status: CallStatus.CONNECTING })

    const assistantConfig = configureAssistant(voice, style)
    const assistantOverrides = {
      variableValues: {
        subject,
        topic: currentTopic,
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
  }, [subject, currentTopic, style, voice])

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

    // Cleanup all contexts and timeouts
    for (let i = 0; i < steps.length; i++) {
      resetSimilarityContext(`${companionId}-step-${i}`)
    }

    if (partialInputTimeoutRef.current) {
      clearTimeout(partialInputTimeoutRef.current)
    }
    if (leoSpeechTimeoutRef.current) {
      clearTimeout(leoSpeechTimeoutRef.current)
    }

    speechDeliveryLockRef.current = false
    isCallReadyRef.current = false

    setConversationState({
      currentStep: 0,
      totalSteps: steps.length,
      isWaitingForUser: false,
      similarity: null,
      feedback: null,
    })
    setMessages([])
    setLeoSpeechProgress({
      isDelivering: false,
      currentSentence: "",
      progress: 0,
      estimatedDuration: 0,
    })
  }, [steps.length, companionId])

  const skipToStep = useCallback(
    (stepIndex: number) => {
      if (stepIndex >= 0 && stepIndex < steps.length) {
        console.log(`⏭️ Skipping to step ${stepIndex}`)

        resetSimilarityContext(`${companionId}-step-${conversationState.currentStep}`)
        speechDeliveryLockRef.current = false

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

  // Control Lottie animation based on speaking state
  useEffect(() => {
    if (lottieRef.current) {
      if (isSpeaking || leoSpeechProgress.isDelivering) {
        lottieRef.current.play()
      } else {
        lottieRef.current.stop()
      }
    }
  }, [isSpeaking, leoSpeechProgress.isDelivering])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-500"
      case "CONNECTING":
        return "bg-yellow-500 animate-pulse"
      case "ERROR":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "INACTIVE":
        return "Ready to Start"
      case "CONNECTING":
        return "Connecting..."
      case "ACTIVE":
        return "Active Call"
      case "FINISHED":
        return "Call Ended"
      case "ERROR":
        return "Error"
      default:
        return status
    }
  }

  const progress = conversationState.totalSteps > 0 ? (currentStep / conversationState.totalSteps) * 100 : 0
  const hasPartialInput = messages.some((msg) => msg.isPartial)
  const currentSimilarity = conversationState.similarity

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header with Topic Info and Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <div>
              <CardTitle className="text-2xl">{topicTitles[currentTopic]}</CardTitle>
              <p className="text-gray-600">Enhanced Voice Conversation Practice</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {/* <Switch checked={showDebug} onCheckedChange={setShowDebug} /> */}
                <span className="text-sm">Debug</span>
              </div>
              <div className={`w-3 h-3 rounded-full ${getStatusColor(callState.status)}`} />
              <Badge variant="outline">{getStatusText(callState.status)}</Badge>
            </div>
          </div>

          {/* Enhanced Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <div className="flex items-center space-x-2">
                <span>
                  {conversationState.currentStep}/{conversationState.totalSteps}
                </span>
                {hasPartialInput && (
                  <Badge variant="outline" className="text-xs animate-pulse">
                    Processing...
                  </Badge>
                )}
                {currentSimilarity && (
                  <Badge variant="secondary" className="text-xs">
                    Score: {Math.round(currentSimilarity.score * 100)}%
                  </Badge>
                )}
              </div>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardHeader>

        {/* Error Display */}
        {callState.status === "ERROR" && (
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>Error: {callState.error}</AlertDescription>
            </Alert>
          </CardContent>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Avatar and Controls */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center space-y-6">
              {/* Enhanced Companion Avatar */}
              <div
                className="relative w-40 h-40 rounded-full flex items-center justify-center"
                style={{ backgroundColor: getSubjectColor(subject) }}
              >
                <div
                  className={cn(
                    "absolute transition-opacity duration-1000",
                    callState.status === "FINISHED" || callState.status === "INACTIVE" ? "opacity-100" : "opacity-0",
                    callState.status === "CONNECTING" && "opacity-100 animate-pulse",
                  )}
                >
                  <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center">
                    <span className="text-4xl">🎙️</span>
                  </div>
                </div>
                <div
                  className={cn(
                    "absolute transition-opacity duration-100",
                    callState.status === "ACTIVE" ? "opacity-100" : "opacity-0",
                  )}
                >
                  <Lottie lottieRef={lottieRef} animationData={soundwaves} autoplay={false} className="w-32 h-32" />
                </div>
              </div>

              <div className="text-center">
                <h2 className="text-xl font-bold">{name}</h2>
                <p className="text-gray-600">Your Conversation Partner</p>
              </div>

              {/* User Avatar */}
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">👤</span>
                </div>
                <div>
                  <p className="font-medium">{userName}</p>
                  <p className="text-sm text-gray-600">Student</p>
                </div>
              </div>

              {/* Leo Speech Progress Monitor */}
              {leoSpeechProgress.isDelivering && currentLine?.speaker === "Leo" && (
                <div className="w-full">
                  <Card className="border-blue-200 bg-blue-50">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge variant="default" className="animate-pulse">
                          🎤 Leo Speaking
                        </Badge>
                        <span className="text-xs text-blue-700">
                          {Math.round(leoSpeechProgress.progress)}% complete
                        </span>
                      </div>
                      <Progress value={leoSpeechProgress.progress} className="h-2 mb-2" />
                      <p className="text-xs text-blue-600 leading-relaxed">"{leoSpeechProgress.currentSentence}"</p>
                      <div className="mt-2 text-xs text-blue-500">
                        💡 Leo is delivering this complete sentence. Please wait for him to finish.
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        Estimated: {Math.round(leoSpeechProgress.estimatedDuration / 1000)}s
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Enhanced Control Buttons */}
              <div className="w-full space-y-3">
                <Button
                  onClick={callState.status === "ACTIVE" ? endCall : startCall}
                  disabled={callState.status === "CONNECTING"}
                  className={cn(
                    "w-full",
                    callState.status === "ACTIVE" ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700",
                    callState.status === "CONNECTING" && "animate-pulse",
                  )}
                >
                  {callState.status === "ACTIVE"
                    ? "End Session"
                    : callState.status === "CONNECTING"
                      ? "Connecting..."
                      : "Start Session"}
                </Button>

                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant="outline"
                    onClick={toggleMute}
                    disabled={callState.status !== "ACTIVE"}
                    className="text-xs"
                  >
                    {isMuted ? "🎤" : "🔇"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={retryCurrentStep}
                    disabled={callState.status !== "ACTIVE" || !conversationState.isWaitingForUser}
                    className="text-xs"
                  >
                    🔄 Retry
                  </Button>
                  <Button
                    variant="outline"
                    onClick={resetConversation}
                    disabled={callState.status === "ACTIVE"}
                    className="text-xs"
                  >
                    ↺ Reset
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Area with Tabs */}
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="conversation">Conversation</TabsTrigger>
              <TabsTrigger value="flow">Script Flow</TabsTrigger>
            </TabsList>

            <TabsContent value="conversation" className="mt-4">
              {/* Current Line Display */}
              {currentLine && (
                <Card className="border-l-4 border-l-blue-400 mb-4">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <Badge variant={currentLine.speaker === "Leo" ? "default" : "secondary"} className="text-sm">
                          {currentLine.speaker}
                        </Badge>
                        {conversationState.isWaitingForUser && (
                          <Badge variant="outline" className="animate-pulse text-sm">
                            Your turn!
                          </Badge>
                        )}
                        {isSpeaking && (
                          <Badge variant="outline" className="bg-blue-50 text-sm">
                            🎤 Listening...
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        Step {conversationState.currentStep + 1} of {conversationState.totalSteps}
                      </div>
                    </div>

                    <div className="bg-blue-50 p-3 rounded-lg border">
                      <p className="text-sm font-medium leading-relaxed">{currentLine.text}</p>
                    </div>

                    <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                      <span>{currentLine.text.split(/\s+/).length} words</span>
                      {currentLine.text.split(/\s+/).length >= 15 && (
                        <Badge variant="outline" className="text-xs">
                          Long sentence - take your time
                        </Badge>
                      )}
                    </div>

                    {conversationState.isWaitingForUser && callState.status === "ACTIVE" && (
                      <div className="flex space-x-2 mt-3">
                        <Button size="sm" variant="outline" onClick={retryCurrentStep}>
                          🔄 Try Again
                        </Button>
                        {showDebug && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => skipToStep(conversationState.currentStep + 1)}
                          >
                            ⏭️ Skip
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Enhanced Feedback Display */}
              {conversationState.feedback && (
                <Card className="border-l-4 border-l-yellow-400 mb-4">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-2">
                      <span className="text-lg">💡</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{conversationState.feedback}</p>
                        {conversationState.similarity && (
                          <div className="mt-2 text-xs text-gray-600">
                            Score: {Math.round(conversationState.similarity.score * 100)}% | Completeness:{" "}
                            {Math.round(conversationState.similarity.completenessRatio * 100)}%
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Conversation History */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Conversation History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {messages.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">Start speaking to see the conversation</p>
                    ) : (
                      messages.map((message, index) => (
                        <div
                          key={index}
                          className={`rounded-lg border transition-all duration-200 ${
                            message.role === "assistant"
                              ? "bg-blue-50 border-blue-200"
                              : message.isComplete
                                ? "bg-green-50 border-green-200"
                                : "bg-yellow-50 border-yellow-200"
                          }`}
                        >
                          <div className="p-3 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <Badge variant={message.role === "assistant" ? "default" : "secondary"}>
                                  {message.speaker || (message.role === "assistant" ? "Leo" : "You")}
                                </Badge>
                                {message.similarity && (
                                  <Badge variant="secondary" className="text-xs">
                                    {Math.round(message.similarity.score * 100)}%
                                  </Badge>
                                )}
                                {message.isComplete && message.role === "assistant" && (
                                  <Badge variant="outline" className="text-xs bg-blue-100">
                                    ✅ Complete
                                  </Badge>
                                )}
                                {message.stepIndex !== undefined && (
                                  <span className="text-xs text-gray-500">Step {message.stepIndex + 1}</span>
                                )}
                              </div>
                              <span className="text-xs text-gray-500">
                                {new Date(message.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                          </div>
                          <div className="p-3">
                            <p className="text-sm leading-relaxed">{message.content}</p>
                            {message.role === "assistant" && (
                              <div className="mt-2 text-xs text-gray-500">
                                {message.content.split(/\s+/).length} words
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="flow" className="mt-4">
              {/* Script Flow Display */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Conversation Script</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {steps.map((step, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          index === conversationState.currentStep
                            ? "bg-blue-50 border-blue-300"
                            : index < conversationState.currentStep
                              ? "bg-green-50 border-green-200"
                              : "bg-gray-50 border-gray-200"
                        }`}
                        onClick={() => showDebug && skipToStep(index)}
                      >
                        <div className="flex items-start space-x-2">
                          <Badge
                            variant={
                              index === conversationState.currentStep
                                ? "default"
                                : index < conversationState.currentStep
                                  ? "secondary"
                                  : "outline"
                            }
                            className="text-xs"
                          >
                            {index + 1}
                          </Badge>
                          <Badge variant={step.speaker === "Leo" ? "default" : "secondary"} className="text-xs">
                            {step.speaker}
                          </Badge>
                          <p className="text-sm flex-1">{step.text}</p>
                        </div>
                        {step.speaker === "Leo" && (
                          <div className="mt-2 flex items-center space-x-2">
                            <Badge variant="outline" className="text-xs">
                              📝 {step.text.split(/\s+/).length} words
                            </Badge>
                            {step.text.split(/\s+/).length > 15 && (
                              <Badge variant="outline" className="text-xs bg-orange-100">
                                📏 Long sentence
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Debug Information */}
      {showDebug && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Debug Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Call State:</strong> {callState.status}
              </div>
              <div>
                <strong>Current Step:</strong> {conversationState.currentStep}/{conversationState.totalSteps}
              </div>
              <div>
                <strong>Is Speaking:</strong> {isSpeaking ? "Yes" : "No"}
              </div>
              <div>
                <strong>Leo Delivering:</strong> {leoSpeechProgress.isDelivering ? "Yes" : "No"}
              </div>
              <div>
                <strong>Speech Lock:</strong> {speechDeliveryLockRef.current ? "Locked" : "Unlocked"}
              </div>
              <div>
                <strong>Waiting for User:</strong> {conversationState.isWaitingForUser ? "Yes" : "No"}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default FinalPodcastConversation
