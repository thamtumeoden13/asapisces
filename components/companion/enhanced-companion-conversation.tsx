"use client"

import React, { useRef } from "react"
import Lottie, { type LottieRefCurrentProps } from "lottie-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useVapiConversation } from "@/hooks/use-vapi-conversation"
import { podcastTopics, topicTitles } from "@/data/podcast-topics"
import type { TopicKey, CompanionComponentProps } from "@/types/podcast"
import { CallStatus } from "@/types/podcast"

// Mock soundwaves animation data
const soundwaves = {
  v: "5.7.4",
  fr: 30,
  ip: 0,
  op: 90,
  w: 200,
  h: 200,
  nm: "Soundwaves",
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: "wave",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [100, 100, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: {
          a: 1,
          k: [
            { t: 0, s: [100, 100, 100] },
            { t: 30, s: [120, 120, 100] },
            { t: 60, s: [100, 100, 100] },
          ],
        },
      },
      ao: 0,
      shapes: [
        {
          ty: "el",
          p: { a: 0, k: [0, 0] },
          s: { a: 0, k: [50, 50] },
        },
      ],
      ip: 0,
      op: 90,
      st: 0,
      bm: 0,
    },
  ],
}

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

interface EnhancedCompanionConversationProps extends Partial<CompanionComponentProps> {
  selectedTopic?: TopicKey
  onTopicComplete?: (topic: TopicKey) => void
}

const EnhancedCompanionConversation = ({
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
}: EnhancedCompanionConversationProps) => {
  const lottieRef = useRef<LottieRefCurrentProps>(null)

  // Get steps for current topic
  const currentTopic = (selectedTopic || topic) as TopicKey
  const steps = podcastTopics[currentTopic] || []

  // Use VAPI conversation hook
  const {
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
  } = useVapiConversation({
    steps,
    companionId,
    subject,
    topic: currentTopic,
    style,
    voice,
    onSessionComplete: () => onTopicComplete?.(currentTopic),
  })

  // Control Lottie animation based on speaking state
  React.useEffect(() => {
    if (lottieRef.current) {
      if (isSpeaking) {
        lottieRef.current.play()
      } else {
        lottieRef.current.stop()
      }
    }
  }, [isSpeaking])

  const progressPercentage =
    conversationState.totalSteps > 0 ? (conversationState.currentStep / conversationState.totalSteps) * 100 : 0

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header with Topic Info */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">{topicTitles[currentTopic]}</h1>
              <p className="text-gray-600">Interactive Conversation Practice</p>
            </div>
            <Badge variant={callState.status === CallStatus.ACTIVE ? "default" : "secondary"}>{callState.status}</Badge>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>
                {conversationState.currentStep}/{conversationState.totalSteps}
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Main Conversation Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Avatar and Controls */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center space-y-6">
              {/* Companion Avatar */}
              <div
                className="relative w-40 h-40 rounded-full flex items-center justify-center"
                style={{ backgroundColor: getSubjectColor(subject) }}
              >
                <div
                  className={cn(
                    "absolute transition-opacity duration-1000",
                    callState.status === CallStatus.FINISHED || callState.status === CallStatus.INACTIVE
                      ? "opacity-100"
                      : "opacity-0",
                    callState.status === CallStatus.CONNECTING && "opacity-100 animate-pulse",
                  )}
                >
                  <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center">
                    <span className="text-4xl">🎙️</span>
                  </div>
                </div>
                <div
                  className={cn(
                    "absolute transition-opacity duration-100",
                    callState.status === CallStatus.ACTIVE ? "opacity-100" : "opacity-0",
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

              {/* Control Buttons */}
              <div className="w-full space-y-3">
                <Button
                  onClick={callState.status === CallStatus.ACTIVE ? endCall : startCall}
                  disabled={callState.status === CallStatus.CONNECTING}
                  className={cn(
                    "w-full",
                    callState.status === CallStatus.ACTIVE
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-green-600 hover:bg-green-700",
                    callState.status === CallStatus.CONNECTING && "animate-pulse",
                  )}
                >
                  {callState.status === CallStatus.ACTIVE
                    ? "End Session"
                    : callState.status === CallStatus.CONNECTING
                      ? "Connecting..."
                      : "Start Session"}
                </Button>

                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={toggleMute}
                    disabled={callState.status !== CallStatus.ACTIVE}
                    className="flex-1"
                  >
                    {isMuted ? "🎤 Unmute" : "🔇 Mute"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={resetConversation}
                    disabled={callState.status === CallStatus.ACTIVE}
                    className="flex-1"
                  >
                    🔄 Reset
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Conversation Display */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Live Conversation</h3>

            {/* Current Line Display */}
            {currentLine && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Badge variant={currentLine.speaker === "Leo" ? "default" : "secondary"}>{currentLine.speaker}</Badge>
                  {conversationState.isWaitingForUser && (
                    <Badge variant="outline" className="animate-pulse">
                      Waiting for your response...
                    </Badge>
                  )}
                </div>
                <p className="text-sm">{currentLine.text}</p>
              </div>
            )}

            {/* Feedback */}
            {conversationState.feedback && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">{conversationState.feedback}</p>
              </div>
            )}

            {/* Message History */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {messages.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Start a session to begin the conversation</p>
              ) : (
                messages.map((message, index) => (
                  <div
                    key={index}
                    className={cn(
                      "p-3 rounded-lg",
                      message.role === "assistant"
                        ? "bg-blue-50 border-l-4 border-blue-400"
                        : "bg-green-50 border-l-4 border-green-400",
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <Badge variant={message.role === "assistant" ? "default" : "secondary"} className="mb-1">
                          {message.role === "assistant" ? name.split(" ")[0] : userName}
                        </Badge>
                        <p className="text-sm">{message.content}</p>
                      </div>
                      <span className="text-xs text-gray-500">{new Date(message.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error Display */}
      {callState.status === CallStatus.ERROR && (
        <Card className="border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-red-600">
              <span>⚠️</span>
              <p className="text-sm">Error: {callState.error}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default EnhancedCompanionConversation
