"use client"

import { useRef, useState, useEffect } from "react"
import Lottie, { type LottieRefCurrentProps } from "lottie-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useVapiConversation } from "@/hooks/use-vapi-conversation-enhanced-debug"
import { EnhancedVoiceRecognition, type SpeechQualityMetrics } from "@/lib/enhanced-voice-recognition"
import { ConversationAnalytics, type ConversationInsights } from "@/lib/conversation-analytics"
import { RealTimeFeedbackPanel } from "@/components/companion/real-time-feedback-panel"
import { podcastTopics, topicTitles } from "@/data/podcast-topics"
import { type TopicKey, type CompanionComponentProps, CallStatus } from "@/types/podcast"
import soundwaves from "@/constants/soundwaves.json"
import { Mic, MicOff, RotateCcw, SkipForward, Award, TrendingUp, Target, Brain, Zap } from "lucide-react"

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

interface EnhancedCompanionConversationV2Props extends Partial<CompanionComponentProps> {
  selectedTopic?: TopicKey
  onTopicComplete?: (topic: TopicKey) => void
}

const EnhancedCompanionConversationV2 = ({
  companionId = "demo",
  subject = "english",
  topic = "intro",
  name = "Leo & Gwen",
  userName = "Student",
  userImage = "/placeholder.svg?height=130&width=130",
  style = "casual",
  voice = "male",
  selectedTopic,
  onTopicComplete,
}: EnhancedCompanionConversationV2Props) => {
  const lottieRef = useRef<LottieRefCurrentProps>(null)

  // Enhanced state management
  const [showDebug, setShowDebug] = useState(process.env.NODE_ENV === "development")
  const [speechMetrics, setSpeechMetrics] = useState<SpeechQualityMetrics | null>(null)
  const [sessionInsights, setSessionInsights] = useState<ConversationInsights | null>(null)
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [pronunciationFeedback, setPronunciationFeedback] = useState<any>(null)
  const [realTimeMetrics, setRealTimeMetrics] = useState({
    responseTime: 0,
    confidenceLevel: 0,
    speechClarity: 0,
  })

  // Initialize enhanced services
  const voiceRecognition = useRef(
    new EnhancedVoiceRecognition({
      language: "en-US",
      sensitivity: 0.8,
      noiseReduction: true,
      adaptiveThreshold: true,
      contextAware: true,
    }),
  )

  const analytics = useRef(new ConversationAnalytics())

  // Get steps for current topic
  const currentTopic = (selectedTopic || topic) as TopicKey
  const steps = podcastTopics[currentTopic] || []

  // Use enhanced VAPI conversation hook
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
    subject,
    topic: currentTopic,
    style,
    voice,
    onSessionComplete: () => {
      handleSessionComplete()
      onTopicComplete?.(currentTopic)
    },
  })

  // Control Lottie animation
  useEffect(() => {
    if (lottieRef.current) {
      if (isSpeaking) {
        lottieRef.current.play()
      } else {
        lottieRef.current.stop()
      }
    }
  }, [isSpeaking])

  // Start analytics session when call starts
  useEffect(() => {
    if (callState.status === CallStatus.ACTIVE && !currentSessionId) {
      const sessionId = analytics.current.startSession(
        "user123", // Replace with actual user ID
        companionId,
        currentTopic,
        steps.length,
      )
      setCurrentSessionId(sessionId)
    }
  }, [callState.status, companionId, currentTopic, steps.length, currentSessionId])

  // Handle session completion
  const handleSessionComplete = () => {
    if (currentSessionId) {
      const insights = analytics.current.endSession(currentSessionId)
      setSessionInsights(insights)
      setCurrentSessionId(null)
    }
  }

  // Enhanced message handling with speech analysis
  useEffect(() => {
    const latestMessage = messages[0]
    if (latestMessage && latestMessage.role === "user" && currentSessionId && currentLine) {
      // Simulate speech quality analysis
      const mockMetrics: SpeechQualityMetrics = {
        clarity: Math.random() * 0.3 + 0.7,
        pace: Math.random() * 0.4 + 0.6,
        volume: Math.random() * 0.2 + 0.8,
        pronunciation: Math.random() * 0.3 + 0.7,
        fluency: Math.random() * 0.4 + 0.6,
      }

      setSpeechMetrics(mockMetrics)

      // Get pronunciation feedback
      const feedback = voiceRecognition.current.getPronunciationFeedback(
        latestMessage.content,
        currentLine.text,
        mockMetrics,
      )
      setPronunciationFeedback(feedback)

      // Record step completion in analytics
      analytics.current.recordStepCompletion(currentSessionId, {
        stepNumber: conversationState.currentStep,
        expectedText: currentLine.text,
        userText: latestMessage.content,
        responseTime: realTimeMetrics.responseTime,
        accuracyScore: feedback.score,
        pronunciationScore: mockMetrics.pronunciation * 100,
        fluencyScore: mockMetrics.fluency * 100,
      })

      // Update real-time metrics
      setRealTimeMetrics({
        responseTime: Math.random() * 3000 + 1000,
        confidenceLevel: mockMetrics.clarity * 100,
        speechClarity: mockMetrics.pronunciation * 100,
      })
    }
  }, [messages, currentSessionId, currentLine, conversationState.currentStep, realTimeMetrics.responseTime])

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

  const getMetricColor = (value: number) => {
    if (value >= 80) return "text-green-600"
    if (value >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getMetricBadgeVariant = (value: number) => {
    if (value >= 80) return "default"
    if (value >= 60) return "secondary"
    return "destructive"
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Enhanced Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Target className="w-6 h-6" />
                {topicTitles[currentTopic]}
              </CardTitle>
              <p className="text-gray-600">Enhanced AI Conversation Practice with Real-time Analytics</p>
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

          {/* Enhanced Progress with Real-time Metrics */}
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <div className="flex items-center space-x-4">
                <span>
                  {conversationState.currentStep}/{conversationState.totalSteps}
                </span>
                {realTimeMetrics.responseTime > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {(realTimeMetrics.responseTime / 1000).toFixed(1)}s response
                  </Badge>
                )}
                {realTimeMetrics.confidenceLevel > 0 && (
                  <Badge variant={getMetricBadgeVariant(realTimeMetrics.confidenceLevel)} className="text-xs">
                    {realTimeMetrics.confidenceLevel.toFixed(0)}% confidence
                  </Badge>
                )}
              </div>
            </div>
            <Progress value={progress} className="h-2" />

            {/* Real-time Speech Metrics */}
            {speechMetrics && (
              <div className="grid grid-cols-5 gap-2 text-xs">
                <div className="text-center">
                  <div className={`font-medium ${getMetricColor(speechMetrics.clarity * 100)}`}>
                    {(speechMetrics.clarity * 100).toFixed(0)}%
                  </div>
                  <div className="text-gray-500">Clarity</div>
                </div>
                <div className="text-center">
                  <div className={`font-medium ${getMetricColor(speechMetrics.pace * 100)}`}>
                    {(speechMetrics.pace * 100).toFixed(0)}%
                  </div>
                  <div className="text-gray-500">Pace</div>
                </div>
                <div className="text-center">
                  <div className={`font-medium ${getMetricColor(speechMetrics.volume * 100)}`}>
                    {(speechMetrics.volume * 100).toFixed(0)}%
                  </div>
                  <div className="text-gray-500">Volume</div>
                </div>
                <div className="text-center">
                  <div className={`font-medium ${getMetricColor(speechMetrics.pronunciation * 100)}`}>
                    {(speechMetrics.pronunciation * 100).toFixed(0)}%
                  </div>
                  <div className="text-gray-500">Pronunciation</div>
                </div>
                <div className="text-center">
                  <div className={`font-medium ${getMetricColor(speechMetrics.fluency * 100)}`}>
                    {(speechMetrics.fluency * 100).toFixed(0)}%
                  </div>
                  <div className="text-gray-500">Fluency</div>
                </div>
              </div>
            )}
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
        {/* Main Conversation Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Enhanced Avatar and Controls */}
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
                      callState.status === CallStatus.FINISHED || callState.status === CallStatus.INACTIVE
                        ? "opacity-100"
                        : "opacity-0",
                      callState.status === CallStatus.CONNECTING ? "opacity-100 animate-pulse" : undefined,
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
                  <p className="text-gray-600">Your AI Conversation Partner</p>
                </div>

                {/* Enhanced Control Buttons */}
                <div className="w-full space-y-3">
                  <Button
                    onClick={callState.status === "ACTIVE" ? endCall : startCall}
                    disabled={callState.status === "CONNECTING"}
                    className={cn(
                      "w-full",
                      callState.status === "ACTIVE" ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700",
                      callState.status === "CONNECTING" ? "animate-pulse" : undefined,
                    )}
                  >
                    {callState.status === "ACTIVE"
                      ? "End Session"
                      : callState.status === "CONNECTING"
                        ? "Connecting..."
                        : "Start Session"}
                  </Button>

                  <div className="grid grid-cols-4 gap-2">
                    <Button
                      variant="outline"
                      onClick={toggleMute}
                      disabled={callState.status !== "ACTIVE"}
                      className="text-xs"
                    >
                      {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={retryCurrentStep}
                      disabled={callState.status !== "ACTIVE" || !conversationState.isWaitingForUser}
                      className="text-xs"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      onClick={resetConversation}
                      disabled={callState.status === "ACTIVE"}
                      className="text-xs"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => skipToStep(conversationState.currentStep + 1)}
                      disabled={callState.status !== "ACTIVE" || !showDebug}
                      className="text-xs"
                    >
                      <SkipForward className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Conversation Display with Tabs */}
          <Card>
            <CardHeader>
              <CardTitle>Live Conversation</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="conversation" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="conversation">Conversation</TabsTrigger>
                  <TabsTrigger value="feedback">Feedback</TabsTrigger>
                  <TabsTrigger value="analytics">Analytics</TabsTrigger>
                </TabsList>

                <TabsContent value="conversation" className="space-y-4">
                  {/* Current Line Display */}
                  {currentLine && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge variant={currentLine.speaker === "Leo" ? "default" : "secondary"}>
                          {currentLine.speaker}
                        </Badge>
                        {conversationState.isWaitingForUser && (
                          <Badge variant="outline" className="animate-pulse">
                            Your turn!
                          </Badge>
                        )}
                        {isSpeaking && (
                          <Badge variant="outline" className="bg-green-50">
                            🎤 Listening...
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm">{currentLine.text}</p>
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
                            "p-3 rounded-lg border",
                            message.role === "assistant"
                              ? "bg-blue-50 border-blue-200"
                              : "bg-green-50 border-green-200",
                          )}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <Badge variant={message.role === "assistant" ? "default" : "secondary"}>
                                  {message.role === "assistant" ? name.split(" ")[0] : userName}
                                </Badge>
                                {message.similarity && (
                                  <Badge variant="outline" className="text-xs">
                                    {Math.round(message.similarity.score * 100)}% match
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm">{message.content}</p>
                            </div>
                            <span className="text-xs text-gray-500 ml-2">
                              {new Date(message.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="feedback" className="space-y-4">
                  {pronunciationFeedback && pronunciationFeedback?.strengths?.length > 0 ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <h4 className="font-medium text-green-800 mb-2">
                          Pronunciation Score: {pronunciationFeedback.score.toFixed(0)}/100
                        </h4>
                        <div className="space-y-2">
                          {pronunciationFeedback.strengths.map((strength: string, index: number) => (
                            <div key={index} className="flex items-center space-x-2 text-green-700">
                              <Award className="w-4 h-4" />
                              <span className="text-sm">{strength}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {pronunciationFeedback.feedback.length > 0 && (
                        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <h4 className="font-medium text-yellow-800 mb-2">Feedback</h4>
                          <div className="space-y-1">
                            {pronunciationFeedback.feedback.map((feedback: string, index: number) => (
                              <p key={index} className="text-sm text-yellow-700">
                                {feedback}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}

                      {pronunciationFeedback.improvements.length > 0 && (
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <h4 className="font-medium text-blue-800 mb-2">Areas for Improvement</h4>
                          <div className="space-y-1">
                            {pronunciationFeedback.improvements.map((improvement: string, index: number) => (
                              <p key={index} className="text-sm text-blue-700">
                                {improvement}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">Start speaking to get pronunciation feedback</p>
                  )}
                </TabsContent>

                <TabsContent value="analytics" className="space-y-4">
                  {sessionInsights ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4" />
                          Session Summary
                        </h4>
                        <p className="text-sm text-gray-700">{sessionInsights.sessionSummary}</p>
                      </div>

                      {sessionInsights.keyAchievements?.length > 0 && (
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                          <h4 className="font-medium text-green-800 mb-2">Achievements</h4>
                          <div className="space-y-1">
                            {sessionInsights.keyAchievements.map((achievement, index) => (
                              <p key={index} className="text-sm text-green-700">
                                {achievement}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 className="font-medium text-blue-800 mb-2">Personalized Feedback</h4>
                        <p className="text-sm text-blue-700">{sessionInsights.personalizedFeedback}</p>
                      </div>

                      {sessionInsights.nextSessionRecommendations?.length > 0 && (
                        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                          <h4 className="font-medium text-purple-800 mb-2">Next Session Recommendations</h4>
                          <div className="space-y-1">
                            {sessionInsights.nextSessionRecommendations.map((recommendation, index) => (
                              <p key={index} className="text-sm text-purple-700">
                                • {recommendation}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">Complete a session to see analytics</p>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Sidebar with Real-time Feedback */}
        <div className="space-y-6">
          {/* Real-time Feedback Panel */}
          {/* <RealTimeFeedbackPanel
            speechMetrics={speechMetrics}
            pronunciationScore={pronunciationFeedback?.score || 0}
            responseTime={realTimeMetrics.responseTime}
            confidenceLevel={realTimeMetrics.confidenceLevel}
            currentStreak={conversationState.currentStep}
            sessionStats={{
              totalAttempts: messages.filter((m) => m.role === "user").length,
              successfulAttempts: messages.filter((m) => m.role === "user" && m.similarity && m.similarity.score > 0.7)
                .length,
              averageScore: speechMetrics
                ? ((speechMetrics.pronunciation + speechMetrics.fluency + speechMetrics.clarity) / 3) * 100
                : 0,
              improvementTrend: Math.random() * 10 - 5, // Mock improvement trend
            }}
            recentFeedback={
              pronunciationFeedback ? [...pronunciationFeedback.feedback, ...pronunciationFeedback.improvements] : []
            }
            isActive={callState.status === CallStatus.ACTIVE}
          /> */}

          {/* Topic Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Brain className="w-5 h-5" />
                Topic Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Total Steps:</span>
                  <span>{steps.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Completed:</span>
                  <span>{conversationState.currentStep}</span>
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
                  <span>Progress:</span>
                  <span>{progress.toFixed(1)}%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button variant="outline" size="sm" onClick={() => setShowDebug(!showDebug)} className="w-full">
                  Toggle Debug Mode
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetConversation}
                  disabled={callState.status === "ACTIVE"}
                  className="w-full"
                >
                  Reset Conversation
                </Button>
                {showDebug && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => skipToStep(conversationState.currentStep + 1)}
                    disabled={callState.status !== "ACTIVE"}
                    className="w-full"
                  >
                    Skip Step (Debug)
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default EnhancedCompanionConversationV2
