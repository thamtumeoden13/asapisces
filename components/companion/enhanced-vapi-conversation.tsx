"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useEnhancedVapi } from "@/hooks/use-enhanced-vapi"
import { podcastTopics, topicTitles } from "@/data/podcast-topics"
import type { TopicKey } from "@/types/podcast"

interface EnhancedVapiConversationProps {
  selectedTopic: TopicKey
  onTopicComplete?: (topic: TopicKey) => void
  voice?: string
  style?: string
  level?: string
  mode?: "podcast" | "conversation"
}

const EnhancedVapiConversation = ({
  selectedTopic,
  onTopicComplete,
  voice = "leo",
  style = "friendly",
  level = "intermediate",
  mode = "podcast",
}: EnhancedVapiConversationProps) => {
  const steps = podcastTopics[selectedTopic] || []

  const {
    callState,
    conversationState,
    messages,
    isSpeaking,
    isMuted,
    error,
    currentLine,
    isConversationComplete,
    startCall,
    endCall,
    toggleMute,
    resetConversation,
    skipToStep,
    progress,
    isHealthy,
  } = useEnhancedVapi({
    steps,
    topic: selectedTopic,
    voice,
    style,
    level,
    mode,
    onStepComplete: (step) => {
      console.log(`Step ${step} completed!`)
    },
    onConversationComplete: () => {
      onTopicComplete?.(selectedTopic)
    },
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500"
      case "connecting":
        return "bg-yellow-500 animate-pulse"
      case "error":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "inactive":
        return "Ready to Start"
      case "connecting":
        return "Connecting..."
      case "active":
        return "Active Call"
      case "ended":
        return "Call Ended"
      case "error":
        return "Error"
      default:
        return status
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{topicTitles[selectedTopic]}</CardTitle>
              <p className="text-gray-600 mt-1">
                {mode === "podcast" ? "Podcast Script Practice" : "Free Conversation"}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${getStatusColor(callState.status)}`} />
              <Badge variant="outline">{getStatusText(callState.status)}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Progress */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Progress</span>
                <span>
                  {conversationState.currentStep}/{conversationState.totalSteps}
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Health Check */}
            {!isHealthy && (
              <Alert>
                <AlertDescription>⚠️ VAPI connection issue detected. Please refresh the page.</AlertDescription>
              </Alert>
            )}

            {/* Error Display */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>Error: {error}</AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Voice Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Main Controls */}
            <div className="space-y-3">
              <Button
                onClick={callState.status === "active" ? endCall : startCall}
                disabled={callState.status === "connecting" || !isHealthy}
                className={`w-full ${
                  callState.status === "active" ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {callState.status === "active"
                  ? "End Session"
                  : callState.status === "connecting"
                    ? "Connecting..."
                    : "Start Session"}
              </Button>

              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={toggleMute} disabled={callState.status !== "active"}>
                  {isMuted ? "🎤 Unmute" : "🔇 Mute"}
                </Button>
                <Button variant="outline" onClick={resetConversation} disabled={callState.status === "active"}>
                  🔄 Reset
                </Button>
              </div>
            </div>

            {/* Speaking Indicator */}
            {isSpeaking && (
              <div className="flex items-center justify-center p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  <span className="text-blue-700 text-sm">AI is speaking...</span>
                </div>
              </div>
            )}

            {/* Current Line Display */}
            {currentLine && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Badge variant={currentLine.speaker === "Leo" ? "default" : "secondary"}>{currentLine.speaker}</Badge>
                  {conversationState.isWaitingForUser && (
                    <Badge variant="outline" className="animate-pulse">
                      Your turn!
                    </Badge>
                  )}
                </div>
                <p className="text-sm">{currentLine.text}</p>
              </div>
            )}

            {/* Feedback */}
            {conversationState.feedback && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">{conversationState.feedback}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Conversation History */}
        <Card>
          <CardHeader>
            <CardTitle>Conversation History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {messages.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Start a session to see the conversation</p>
              ) : (
                messages.map((message, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg ${
                      message.role === "assistant"
                        ? "bg-blue-50 border-l-4 border-blue-400"
                        : "bg-green-50 border-l-4 border-green-400"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <Badge variant={message.role === "assistant" ? "default" : "secondary"}>
                            {message.role === "assistant" ? "AI" : "You"}
                          </Badge>
                          {message.stepIndex !== undefined && (
                            <Badge variant="outline" className="text-xs">
                              Step {message.stepIndex + 1}
                            </Badge>
                          )}
                        </div>
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

      {/* Step Navigator (for debugging/testing) */}
      {process.env.NODE_ENV === "development" && (
        <Card>
          <CardHeader>
            <CardTitle>Step Navigator (Dev Mode)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-2">
              {steps.map((step, index) => (
                <Button
                  key={index}
                  variant={index === conversationState.currentStep ? "default" : "outline"}
                  size="sm"
                  onClick={() => skipToStep(index)}
                  disabled={callState.status === "active"}
                  className="text-xs"
                >
                  {index + 1}: {step.speaker}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default EnhancedVapiConversation
