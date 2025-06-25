"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { SimilarityDebugPanel } from "./similarity-debug-panel"
import { useState } from "react"

interface GroupedMessage {
  speaker: string
  content: string[]
  timestamp: number
  similarity?: any
  isComplete: boolean
  stepIndex: number
}

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

export const EnhancedConversationDisplayGrouped = ({
  conversationState,
  messages,
  currentLine,
  isSpeaking,
  callState,
  onRetry,
  onSkip,
  showDebug = false,
}: EnhancedConversationDisplayProps) => {
  const [expandedMessages, setExpandedMessages] = useState<Set<number>>(new Set())

  // Group consecutive messages from the same speaker
  const groupedMessages = groupMessagesBySpeaker(messages)

  const toggleExpanded = (index: number) => {
    const newExpanded = new Set(expandedMessages)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedMessages(newExpanded)
  }

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
        <Card className="border-l-4 border-l-blue-400">
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

            {/* Full sentence display */}
            <div className="bg-blue-50 p-3 rounded-lg border">
              <p className="text-sm font-medium leading-relaxed">{currentLine.text}</p>
            </div>

            {/* Word count and complexity indicator */}
            <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
              <span>{currentLine.text.split(/\s+/).length} words</span>
              {currentLine.text.split(/\s+/).length >= 15 && (
                <Badge variant="outline" className="text-xs">
                  Long sentence - take your time
                </Badge>
              )}
            </div>

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

      {/* Enhanced Feedback Display */}
      {conversationState.feedback && (
        <Card className="border-l-4 border-l-yellow-400">
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

      {/* Progress */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between text-sm mb-2">
            <span>Conversation Progress</span>
            <span>
              {conversationState.currentStep}/{conversationState.totalSteps}
            </span>
          </div>
          <Progress value={(conversationState.currentStep / conversationState.totalSteps) * 100} className="h-2" />
        </CardContent>
      </Card>

      {/* Grouped Messages History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Conversation History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {groupedMessages.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Start speaking to see the conversation</p>
            ) : (
              groupedMessages.map((group, index) => (
                <div
                  key={index}
                  className={`rounded-lg border transition-all duration-200 ${
                    group.speaker === "AI"
                      ? "bg-blue-50 border-blue-200"
                      : group.isComplete
                        ? "bg-green-50 border-green-200"
                        : "bg-yellow-50 border-yellow-200"
                  }`}
                >
                  {/* Message Header */}
                  <div className="p-3 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge variant={group.speaker === "AI" ? "default" : "secondary"}>{group.speaker}</Badge>
                        {group.similarity && (
                          <Badge variant={getMessageBadgeVariant(group.similarity)} className="text-xs">
                            {getMessageBadgeText(group.similarity)}
                          </Badge>
                        )}
                        {!group.isComplete && group.speaker !== "AI" && (
                          <Badge variant="outline" className="text-xs animate-pulse">
                            Partial
                          </Badge>
                        )}
                        <span className="text-xs text-gray-500">Step {group.stepIndex + 1}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">{new Date(group.timestamp).toLocaleTimeString()}</span>
                        {group.content.length > 1 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleExpanded(index)}
                            className="h-6 w-6 p-0"
                          >
                            {expandedMessages.has(index) ? "−" : "+"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Message Content */}
                  <div className="p-3">
                    {group.content.length === 1 ? (
                      // Single message - show full content
                      <p className="text-sm leading-relaxed">{group.content[0]}</p>
                    ) : (
                      // Multiple messages - show grouped or expanded
                      <div>
                        {expandedMessages.has(index) ? (
                          // Expanded view - show all parts
                          <div className="space-y-2">
                            {group.content.map((content, partIndex) => (
                              <div key={partIndex} className="flex items-start space-x-2">
                                <span className="text-xs text-gray-400 mt-1 min-w-[20px]">{partIndex + 1}.</span>
                                <p className="text-sm leading-relaxed flex-1">{content}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          // Collapsed view - show combined content
                          <div>
                            <p className="text-sm leading-relaxed">{group.content.join(" ")}</p>
                            <div className="mt-2 text-xs text-gray-500">
                              {group.content.length} parts • Click + to expand
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Word count for user messages */}
                    {group.speaker !== "AI" && (
                      <div className="mt-2 text-xs text-gray-500">
                        {group.content.join(" ").split(/\s+/).length} words
                      </div>
                    )}
                  </div>

                  {/* Debug Panel */}
                  {showDebug && group.similarity && (
                    <div className="border-t border-gray-200">
                      <SimilarityDebugPanel
                        similarity={group.similarity}
                        userInput={group.content.join(" ")}
                        expectedText={currentLine?.text || ""}
                      />
                    </div>
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

// Helper function to group messages by speaker and context
function groupMessagesBySpeaker(messages: any[]): GroupedMessage[] {
  if (!messages || messages.length === 0) return []

  const grouped: GroupedMessage[] = []
  let currentGroup: GroupedMessage | null = null

  // Sort messages by timestamp (oldest first for proper grouping)
  const sortedMessages = [...messages].reverse()

  for (const message of sortedMessages) {
    const speaker = message.role === "assistant" ? "AI" : "You"
    const stepIndex = message.stepIndex || 0

    // Check if we should start a new group
    const shouldStartNewGroup =
      !currentGroup ||
      currentGroup.speaker !== speaker ||
      message.timestamp - currentGroup.timestamp > 10000 || // 10 seconds gap
      Math.abs(currentGroup.stepIndex - stepIndex) > 1 // Different steps

    if (shouldStartNewGroup) {
      // Save current group if exists
      if (currentGroup) {
        grouped.push(currentGroup)
      }

      // Start new group
      currentGroup = {
        speaker,
        content: [message.content],
        timestamp: message.timestamp,
        similarity: message.similarity,
        isComplete: !message.isPartial,
        stepIndex,
      }
    } else {
      // Add to current group
      currentGroup.content.push(message.content)
      currentGroup.timestamp = Math.max(currentGroup.timestamp, message.timestamp)

      // Update similarity with the latest one
      if (message.similarity) {
        currentGroup.similarity = message.similarity
      }

      // Update completion status
      if (!message.isPartial) {
        currentGroup.isComplete = true
      }
    }
  }

  // Add the last group
  if (currentGroup) {
    grouped.push(currentGroup)
  }

  // Return in reverse order (newest first)
  return grouped.reverse()
}
