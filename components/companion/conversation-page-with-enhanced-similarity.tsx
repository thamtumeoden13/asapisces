"use client"

import { Badge } from "@/components/ui/badge"

import { useState } from "react"
import { useVapiConversation } from "@/hooks/use-vapi-conversation-enhanced"
import { EnhancedConversationDisplay } from "./enhanced-conversation-display"
import { podcastTopics } from "@/data/podcast-topics"
import type { TopicKey } from "@/types/podcast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"

interface ConversationPageProps {
  selectedTopic: TopicKey
  companionId?: string
}

export const ConversationPageWithEnhancedSimilarity = ({
  selectedTopic,
  companionId = "podcast-companion",
}: ConversationPageProps) => {
  const [showDebug, setShowDebug] = useState(process.env.NODE_ENV === "development")

  const steps = podcastTopics[selectedTopic] || []

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
    skipToStep,
    retryCurrentStep,
    progress,
    hasPartialInput,
    currentSimilarity,
  } = useVapiConversation({
    steps,
    companionId,
    subject: "english",
    topic: selectedTopic,
    style: "friendly",
    voice: "leo",
    onSessionComplete: () => {
      console.log("🎉 Session completed!")
    },
  })

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">Enhanced Conversation Practice</CardTitle>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {/* <Switch checked={showDebug} onCheckedChange={setShowDebug} /> */}
                <span className="text-sm">Debug Mode</span>
              </div>
              <Badge variant={callState.status === "ACTIVE" ? "default" : "secondary"}>{callState.status}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <Button
              onClick={callState.status === "ACTIVE" ? endCall : startCall}
              disabled={callState.status === "CONNECTING"}
              className={
                callState.status === "ACTIVE" ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
              }
            >
              {callState.status === "ACTIVE"
                ? "End Session"
                : callState.status === "CONNECTING"
                  ? "Connecting..."
                  : "Start Session"}
            </Button>

            <Button variant="outline" onClick={toggleMute} disabled={callState.status !== "ACTIVE"}>
              {isMuted ? "🎤 Unmute" : "🔇 Mute"}
            </Button>

            <Button variant="outline" onClick={resetConversation} disabled={callState.status === "ACTIVE"}>
              🔄 Reset
            </Button>
          </div>

          {/* Status Indicators */}
          <div className="flex items-center space-x-4 mt-4 text-sm text-gray-600">
            <span>Progress: {Math.round(progress)}%</span>
            {hasPartialInput && <span className="text-yellow-600">⏳ Processing partial input...</span>}
            {currentSimilarity && <span>Last Score: {Math.round(currentSimilarity.score * 100)}%</span>}
          </div>
        </CardContent>
      </Card>

      {/* Main Conversation Display */}
      <EnhancedConversationDisplay
        conversationState={conversationState}
        messages={messages}
        currentLine={currentLine}
        isSpeaking={isSpeaking}
        callState={callState}
        onRetry={retryCurrentStep}
        onSkip={() => skipToStep(conversationState.currentStep + 1)}
        showDebug={showDebug}
      />
    </div>
  )
}
