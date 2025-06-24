"use client"

import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TopicSelector } from "@/components/companion/topic-selector"
import { ProgressTracker } from "@/components/companion/progress-tracker"
import { podcastTopics, topicTitles } from "@/data/podcast-topics"
import type { TopicKey, TranscriptLine, SavedMessage, CompanionComponentProps } from "@/types/podcast"

const cn = (...classes: string[]) => classes.filter(Boolean).join(" ")

enum CallStatus {
  INACTIVE = "INACTIVE",
  CONNECTING = "CONNECTING",
  ACTIVE = "ACTIVE",
  FINISHED = "FINISHED",
}

const EnhancedCompanionComponent = ({
  companionId = "demo",
  subject = "english",
  topic = "intro",
  name = "Leo & Gwen",
  userName = "Student",
  userImage = "/placeholder.svg?height=130&width=130",
  style = "conversational",
  voice = "friendly",
}: Partial<CompanionComponentProps>) => {
  // State management
  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [messages, setMessages] = useState<SavedMessage[]>([])
  const [currentStep, setCurrentStep] = useState(0)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [selectedTopic, setSelectedTopic] = useState<TopicKey | null>(null)
  const [completedTopics, setCompletedTopics] = useState<Set<TopicKey>>(new Set())
  const [isAutoPlaying, setIsAutoPlaying] = useState(false)

  // Get current topic steps
  const steps: TranscriptLine[] = React.useMemo(() => {
    if (!selectedTopic) return []
    return podcastTopics[selectedTopic] || []
  }, [selectedTopic])

  const currentLine = steps[currentStep] || null

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying || !currentLine) return

    const timer = setTimeout(() => {
      if (currentLine.speaker === "Leo" || currentLine.speaker === "Narrator") {
        // Auto-advance for Leo and Narrator
        setMessages((prev) => [{ role: "assistant", content: `${currentLine.speaker}: ${currentLine.text}` }, ...prev])
        setCurrentStep((prev) => prev + 1)
      } else if (currentLine.speaker === "Gwen") {
        // Wait for user interaction for Gwen's lines
        setFeedback(`🎯 Your turn to respond: "${currentLine.text}"`)
      }
    }, 2000)

    return () => clearTimeout(timer)
  }, [currentStep, currentLine, isAutoPlaying])

  // Handle topic completion
  useEffect(() => {
    if (selectedTopic && currentStep >= steps.length && steps.length > 0) {
      setCompletedTopics((prev) => new Set([...prev, selectedTopic]))
      setFeedback("🎉 Topic completed! Choose another topic to continue learning.")
      setIsAutoPlaying(false)
    }
  }, [currentStep, steps.length, selectedTopic])

  const handleTopicSelect = (topic: TopicKey) => {
    setSelectedTopic(topic)
    setCurrentStep(0)
    setMessages([])
    setFeedback(null)
    setCallStatus(CallStatus.INACTIVE)
    setIsAutoPlaying(false)
  }

  const handleStartSession = () => {
    if (!selectedTopic) {
      setFeedback("Please select a topic first!")
      return
    }
    setCallStatus(CallStatus.ACTIVE)
    setIsAutoPlaying(true)
    setFeedback(null)
  }

  const handleStopSession = () => {
    setCallStatus(CallStatus.INACTIVE)
    setIsAutoPlaying(false)
    setFeedback(null)
  }

  const handleUserResponse = (response: string) => {
    if (!currentLine || currentLine.speaker !== "Gwen") return

    setMessages((prev) => [{ role: "user", content: response }, ...prev])

    // Simple response checking
    const isCorrect = response.toLowerCase().includes(currentLine.text.toLowerCase().substring(0, 10))

    if (isCorrect) {
      setFeedback("✅ Great response! Moving to next part...")
      setTimeout(() => {
        setCurrentStep((prev) => prev + 1)
        setFeedback(null)
      }, 1500)
    } else {
      setFeedback(`💡 Try saying something like: "${currentLine.text}"`)
    }
  }

  const toggleMicrophone = () => {
    setIsMuted(!isMuted)
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Topic Selector */}
      <TopicSelector
        selectedTopic={selectedTopic}
        onTopicSelect={handleTopicSelect}
        completedTopics={completedTopics}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Interaction Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Companion Interface */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl">🎙️</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{name}</h2>
                    <p className="text-gray-600">
                      {selectedTopic ? topicTitles[selectedTopic] : "Select a topic to start"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-xl">👤</span>
                  </div>
                  <span className="font-medium">{userName}</span>
                </div>
              </div>

              {/* Control Buttons */}
              <div className="flex space-x-4 mb-6">
                <Button
                  onClick={callStatus === CallStatus.ACTIVE ? handleStopSession : handleStartSession}
                  disabled={!selectedTopic}
                  className={cn(
                    "flex-1",
                    callStatus === CallStatus.ACTIVE
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-green-600 hover:bg-green-700",
                  )}
                >
                  {callStatus === CallStatus.ACTIVE ? "Stop Session" : "Start Session"}
                </Button>
                <Button variant="outline" onClick={toggleMicrophone} disabled={callStatus !== CallStatus.ACTIVE}>
                  {isMuted ? "🎤 Unmute" : "🔇 Mute"}
                </Button>
              </div>

              {/* Feedback Area */}
              {feedback && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                  <p className="text-blue-800">{feedback}</p>
                </div>
              )}

              {/* Quick Response Buttons for Gwen's lines */}
              {currentLine?.speaker === "Gwen" && callStatus === CallStatus.ACTIVE && (
                <div className="space-y-2 mb-4">
                  <p className="text-sm font-medium">Quick responses:</p>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleUserResponse("I understand")}>
                      I understand
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleUserResponse("That makes sense")}>
                      That makes sense
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleUserResponse("Can you explain more?")}>
                      Can you explain more?
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Conversation History */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Conversation History</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {messages.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Start a session to see the conversation history</p>
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
                      <div className="flex items-start space-x-2">
                        <Badge variant={message.role === "assistant" ? "default" : "secondary"}>
                          {message.role === "assistant" ? "Assistant" : "You"}
                        </Badge>
                        <p className="text-sm flex-1">{message.content}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Sidebar */}
        <div className="space-y-6">
          <ProgressTracker
            currentTopic={selectedTopic}
            currentStep={currentStep}
            totalSteps={steps.length}
            completedTopics={completedTopics}
            currentLine={currentLine}
          />

          {/* Topic Overview */}
          {selectedTopic && (
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Topic Overview</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Total Lines:</span>
                    <span>{steps.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Leo Lines:</span>
                    <span>{steps.filter((s) => s.speaker === "Leo").length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Gwen Lines:</span>
                    <span>{steps.filter((s) => s.speaker === "Gwen").length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Interactive Parts:</span>
                    <span>{steps.filter((s) => s.speaker === "Gwen").length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default EnhancedCompanionComponent
