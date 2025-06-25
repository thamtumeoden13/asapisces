"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { SimilarityDebugPanel } from "./similarity-debug-panel"

interface EnhancedConversationDisplayProps {
  conversationState: any
  messages: any[]
  currentLine: any
  isSpeaking: boolean
  callState: any
  onRetry?: () => void
  onSkip?: () => void
  showDebug?: boolean
}

export const EnhancedConversationDisplay = ({
  conversationState,
  messages,
  currentLine,
  isSpeaking,
  callState,
  onRetry,
  onSkip,
  showDebug = false,
}: EnhancedConversationDisplayProps) => {
  const getMessageBadgeVariant = (similarity: any) => {
    if (!similarity) return "secondary"
    if (similarity.score >= 0.8) return "default"
    if (similarity.score >= 0.6) return "secondary"
    return "destructive"
  }

  const getMessageBadgeText = (similarity: any) => {
    if (!similarity) return "N/A"
    return `${Math.round(similarity.score * 100)}%`
  }

  return (
    <div className="space-y-4">
      {/* Current Line Display */}
      {currentLine && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Badge variant={currentLine.speaker === "Leo" ? "default" : "secondary"}>{currentLine.speaker}</Badge>
              {conversationState.isWaitingForUser && (
                <Badge variant="outline" className="animate-pulse">
                  Your turn!
                </Badge>
              )}
              {isSpeaking && (
                <Badge variant="outline" className="bg-blue-50">
                  🎤 Listening...
                </Badge>
              )}
            </div>
            <p className="text-sm font-medium">{currentLine.text}</p>

            {/* Action Buttons */}
            {conversationState.isWaitingForUser && callState.status === "ACTIVE" && (
              <div className="flex space-x-2 mt-3">
                {onRetry && (
                  <Button size="sm" variant="outline" onClick={onRetry}>
                    🔄 Try Again
                  </Button>
                )}
                {onSkip && process.env.NODE_ENV === "development" && (
                  <Button size="sm" variant="outline" onClick={onSkip}>
                    ⏭️ Skip
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Feedback Display */}
      {conversationState.feedback && (
        <Card className="border-l-4 border-l-blue-400">
          <CardContent className="p-4">
            <p className="text-sm">{conversationState.feedback}</p>
          </CardContent>
        </Card>
      )}

      {/* Progress */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between text-sm mb-2">
            <span>Progress</span>
            <span>
              {conversationState.currentStep}/{conversationState.totalSteps}
            </span>
          </div>
          <Progress value={(conversationState.currentStep / conversationState.totalSteps) * 100} className="h-2" />
        </CardContent>
      </Card>

      {/* Messages History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Conversation History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {messages.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Start speaking to see the conversation</p>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${
                    message.role === "assistant"
                      ? "bg-blue-50 border-blue-200"
                      : message.isPartial
                        ? "bg-yellow-50 border-yellow-200"
                        : "bg-green-50 border-green-200"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Badge variant={message.role === "assistant" ? "default" : "secondary"}>
                        {message.role === "assistant" ? "AI" : "You"}
                      </Badge>
                      {message.similarity && (
                        <Badge variant={getMessageBadgeVariant(message.similarity)}>
                          {getMessageBadgeText(message.similarity)}
                        </Badge>
                      )}
                      {message.isPartial && (
                        <Badge variant="outline" className="text-xs">
                          Partial
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">{new Date(message.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-sm">{message.content}</p>

                  {/* Debug Panel */}
                  {showDebug && message.similarity && (
                    <SimilarityDebugPanel
                      similarity={message.similarity}
                      userInput={message.content}
                      expectedText={currentLine?.text || ""}
                    />
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
