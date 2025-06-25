"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useState } from "react"

interface ConversationFlowDisplayProps {
  conversationState: any
  messages: any[]
  currentLine: any
  steps: any[]
  onJumpToStep?: (stepIndex: number) => void
}

export const ConversationFlowDisplay = ({
  conversationState,
  messages,
  currentLine,
  steps,
  onJumpToStep,
}: ConversationFlowDisplayProps) => {
  const [showFullScript, setShowFullScript] = useState(false)

  // Create a flow view of the conversation
  const conversationFlow = createConversationFlow(steps, messages, conversationState.currentStep)

  return (
    <div className="space-y-4">
      {/* Script Overview Toggle */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Conversation Script</CardTitle>
            <Button variant="outline" size="sm" onClick={() => setShowFullScript(!showFullScript)}>
              {showFullScript ? "Hide Full Script" : "Show Full Script"}
            </Button>
          </div>
        </CardHeader>
        {showFullScript && (
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
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
                  onClick={() => onJumpToStep?.(index)}
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
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Current Context */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Current Context</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Previous line for context */}
            {conversationState.currentStep > 0 && (
              <div className="p-3 bg-gray-50 rounded-lg border">
                <div className="flex items-center space-x-2 mb-2">
                  <Badge variant="outline" className="text-xs">
                    Previous
                  </Badge>
                  <Badge
                    variant={steps[conversationState.currentStep - 1]?.speaker === "Leo" ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {steps[conversationState.currentStep - 1]?.speaker}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">{steps[conversationState.currentStep - 1]?.text}</p>
              </div>
            )}

            {/* Current line */}
            {currentLine && (
              <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-300">
                <div className="flex items-center space-x-2 mb-2">
                  <Badge variant="default" className="text-sm">
                    Current
                  </Badge>
                  <Badge variant={currentLine.speaker === "Leo" ? "default" : "secondary"} className="text-sm">
                    {currentLine.speaker}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    Step {conversationState.currentStep + 1} of {conversationState.totalSteps}
                  </span>
                </div>
                <p className="text-sm font-medium leading-relaxed">{currentLine.text}</p>

                {/* Sentence analysis */}
                <div className="mt-3 flex items-center space-x-4 text-xs text-gray-500">
                  <span>{currentLine.text.split(/\s+/).length} words</span>
                  <span>{currentLine.text.split(/[.!?]+/).length} sentences</span>
                  {currentLine.text.split(/\s+/).length >= 15 && (
                    <Badge variant="outline" className="text-xs">
                      Long sentence
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Next line preview */}
            {conversationState.currentStep < steps.length - 1 && (
              <div className="p-3 bg-gray-50 rounded-lg border border-dashed">
                <div className="flex items-center space-x-2 mb-2">
                  <Badge variant="outline" className="text-xs">
                    Next
                  </Badge>
                  <Badge
                    variant={steps[conversationState.currentStep + 1]?.speaker === "Leo" ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {steps[conversationState.currentStep + 1]?.speaker}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">{steps[conversationState.currentStep + 1]?.text}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Conversation Flow */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Conversation Flow</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {conversationFlow.map((item, index) => (
              <div key={index}>
                <div
                  className={`p-3 rounded-lg ${
                    item.type === "completed"
                      ? "bg-green-50 border border-green-200"
                      : item.type === "current"
                        ? "bg-blue-50 border-2 border-blue-300"
                        : item.type === "user-response"
                          ? "bg-yellow-50 border border-yellow-200"
                          : "bg-gray-50 border border-gray-200"
                  }`}
                >
                  <div className="flex items-start space-x-2">
                    <Badge
                      variant={
                        item.type === "completed" ? "secondary" : item.type === "current" ? "default" : "outline"
                      }
                      className="text-xs"
                    >
                      {item.stepIndex + 1}
                    </Badge>
                    <Badge variant={item.speaker === "Leo" ? "default" : "secondary"} className="text-xs">
                      {item.speaker}
                    </Badge>
                    <div className="flex-1">
                      <p className="text-sm leading-relaxed">{item.content}</p>
                      {item.userResponse && (
                        <div className="mt-2 p-2 bg-white rounded border">
                          <p className="text-xs text-gray-600 mb-1">Your response:</p>
                          <p className="text-sm">{item.userResponse}</p>
                          {item.similarity && (
                            <div className="mt-1 text-xs text-gray-500">
                              Score: {Math.round(item.similarity.score * 100)}%
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {index < conversationFlow.length - 1 && (
                  <div className="flex justify-center py-1">
                    <div className="w-px h-4 bg-gray-300"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Helper function to create conversation flow
function createConversationFlow(steps: any[], messages: any[], currentStep: number) {
  const flow: any[] = []

  for (let i = 0; i <= Math.min(currentStep, steps.length - 1); i++) {
    const step = steps[i]
    const stepMessages = messages.filter((m) => m.stepIndex === i)

    if (i < currentStep) {
      // Completed step
      flow.push({
        type: "completed",
        stepIndex: i,
        speaker: step.speaker,
        content: step.text,
        userResponse: step.speaker === "Gwen" ? stepMessages.find((m) => m.role === "user")?.content : null,
        similarity: stepMessages.find((m) => m.similarity)?.similarity,
      })
    } else if (i === currentStep) {
      // Current step
      flow.push({
        type: "current",
        stepIndex: i,
        speaker: step.speaker,
        content: step.text,
        userResponse: step.speaker === "Gwen" ? stepMessages.find((m) => m.role === "user")?.content : null,
        similarity: stepMessages.find((m) => m.similarity)?.similarity,
      })
    }
  }

  return flow
}
