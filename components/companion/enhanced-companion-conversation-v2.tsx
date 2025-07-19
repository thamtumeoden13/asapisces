"use client";

import { useRef, useState, useEffect, useMemo, useCallback } from "react";
import Lottie, { type LottieRefCurrentProps } from "lottie-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useVapiConversation } from "@/hooks/use-vapi-conversation-enhanced-debug";
import {
  EnhancedVoiceRecognition,
  type SpeechQualityMetrics,
} from "@/lib/enhanced-voice-recognition";
import {
  ConversationAnalytics,
  type ConversationInsights,
} from "@/lib/conversation-analytics";
import {
  type TopicKey,
  type CompanionComponentProps,
  CallStatus,
  TranscriptLine,
} from "@/types/podcast";
import soundwaves from "@/constants/soundwaves.json";
import {
  Mic,
  MicOff,
  RotateCcw,
  SkipForward,
  Target,
  Brain,
  Zap,
  Clock,
  FastForward,
  AlertCircle,
  MessageSquare,
} from "lucide-react";
import type { PodcastTopics, TopicTitles } from "@/types";
import { createLanguageFeedback } from "@/lib/actions/general.action";

const cn = (...classes: (string | undefined)[]) =>
  classes.filter(Boolean).join(" ");

const getSubjectColor = (subject: string) => {
  const colors: Record<string, string> = {
    english: "#3B82F6",
    math: "#EF4444",
    science: "#10B981",
    history: "#F59E0B",
    default: "#6B7280",
  };
  return colors[subject] || colors.default;
};

interface EnhancedCompanionConversationOptimizedProps
  extends Partial<CompanionComponentProps> {
  topicTitles: TopicTitles;
  podcastTopics: PodcastTopics;
  selectedTopic?: TopicKey;
  onTopicComplete?: (topic: TopicKey) => void;
}

const EnhancedCompanionConversationOptimized = ({
  companionId = "demo",
  subject = "english",
  topic = "intro",
  topicTitles,
  podcastTopics,
  name = "Leo & Gwen",
  userName = "Student",
  userImage = "/placeholder.svg?height=130&width=130",
  style = "casual",
  voice = "male",
  selectedTopic,
  onTopicComplete,
}: EnhancedCompanionConversationOptimizedProps) => {
  const lottieRef = useRef<LottieRefCurrentProps>(null);

  // Timing Configuration State
  const [timingSettings, setTimingSettings] = useState({
    stepTransitionDelay: 1000,
    speechTimeout: 3000,
    autoAdvance: true,
    quickMode: false,
    responseWaitTime: 5000,
  });

  // Performance State
  const [performanceMode, setPerformanceMode] = useState({
    reducedAnimations: false,
    fastTransitions: true,
    skipIntermediateSteps: false,
    instantFeedback: true,
  });

  // Enhanced state management
  const [showDebug, setShowDebug] = useState(
    process.env.NODE_ENV === "development"
  );
  const [speechMetrics, setSpeechMetrics] =
    useState<SpeechQualityMetrics | null>(null);
  const [sessionInsights, setSessionInsights] =
    useState<ConversationInsights | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [pronunciationFeedback, setPronunciationFeedback] = useState<any>(null);
  const [realTimeMetrics, setRealTimeMetrics] = useState({
    responseTime: 0,
    confidenceLevel: 0,
    speechClarity: 0,
  });

  // THÊM CÁC STATE NÀY
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);
  const [sessionFeedback, setSessionFeedback] = useState<any | null>(null); // Kiểu 'any' để đơn giản, bạn có thể dùng kiểu từ schema

  const [activeTab, setActiveTab] = useState<
    "conversation" | "feedback" | "analytics" | "settings"
  >("conversation");

  // Step timing tracking
  const [stepTimings, setStepTimings] = useState<{
    [key: number]: { startTime: number; endTime?: number; duration?: number };
  }>({});

  // Auto-advance timer
  const autoAdvanceTimer = useRef<NodeJS.Timeout | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  // Initialize enhanced services with optimized settings
  const voiceRecognition = useRef(
    new EnhancedVoiceRecognition({
      language: "en-US",
      sensitivity: 0.7,
      noiseReduction: true,
      adaptiveThreshold: true,
      contextAware: true,
      quickResponse: true,
    })
  );

  const analytics = useRef(new ConversationAnalytics());

  // Get steps for current topic
  const currentTopic = (selectedTopic || topic) as TopicKey;
  const steps = podcastTopics[currentTopic] || [];

  // Use enhanced VAPI conversation hook with timing settings
  const {
    callState,
    conversationState,
    messages,
    isSpeaking,
    isMuted,
    currentLine,
    partialTranscript,
    speechBuffer,
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
      handleSessionComplete(messages, steps);
      onTopicComplete?.(currentTopic);
    },
    timingSettings, // Pass timing settings to the hook
  });

  // ✨ NEW: Debug state tracking
  useEffect(() => {
    if (showDebug) {
      console.log(
        `🔍 State Debug - Step: ${conversationState.currentStep}, Waiting: ${conversationState.isWaitingForUser}, Speaker: ${currentLine?.speaker}, Call: ${callState.status}`
      );
    }
  }, [
    conversationState.currentStep,
    conversationState.isWaitingForUser,
    currentLine?.speaker,
    callState.status,
    showDebug,
  ]);

  // Auto-advance timer function
  const startAutoAdvanceTimer = useCallback(() => {
    if (autoAdvanceTimer.current) {
      clearTimeout(autoAdvanceTimer.current);
    }

    if (!timingSettings.autoAdvance) return;

    const delay = timingSettings.quickMode
      ? 500
      : timingSettings.stepTransitionDelay;
    setCountdown(Math.ceil(delay / 1000));

    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev && prev > 1) {
          return prev - 1;
        } else {
          clearInterval(countdownInterval);
          return null;
        }
      });
    }, 1000);

    autoAdvanceTimer.current = setTimeout(() => {
      if (conversationState.currentStep < steps.length) {
        skipToStep(conversationState.currentStep + 1);
      }
      setCountdown(null);
      clearInterval(countdownInterval);
    }, delay);
  }, [timingSettings, conversationState.currentStep, steps.length, skipToStep]);

  // Manual advance function
  const manualAdvance = useCallback(() => {
    if (autoAdvanceTimer.current) {
      clearTimeout(autoAdvanceTimer.current);
      setCountdown(null);
    }
    if (conversationState.currentStep < steps.length) {
      skipToStep(conversationState.currentStep + 1);
    }
  }, [conversationState.currentStep, steps.length, skipToStep]);

  // Message grouping with performance optimization
  const groupedMessages = useMemo(() => {
    if (messages.length === 0) return [];

    const sortedMessages = [...messages].sort(
      (a, b) => a.timestamp - b.timestamp
    );
    const groups: any[] = [];
    let currentGroup: any = null;

    for (const message of sortedMessages) {
      if (!currentGroup || currentGroup.role !== message.role) {
        currentGroup = {
          role: message.role,
          speaker: message.role === "assistant" ? name.split(" ")[0] : userName,
          messages: [message],
          timestamp: message.timestamp,
        };
        groups.push(currentGroup);
      } else {
        currentGroup.messages.push(message);
        currentGroup.timestamp = message.timestamp;
      }
    }

    return groups.reverse().map((group) => ({
      ...group,
      messages: group.messages.reverse(),
    }));
  }, [messages, name, userName]);

  // Control Lottie animation with performance optimization
  useEffect(() => {
    if (lottieRef.current && !performanceMode.reducedAnimations) {
      if (isSpeaking) {
        lottieRef.current.play();
      } else {
        lottieRef.current.stop();
      }
    }
  }, [isSpeaking, performanceMode.reducedAnimations]);

  // Debounced analytics session start
  useEffect(() => {
    if (callState.status === CallStatus.ACTIVE && !currentSessionId) {
      const sessionId = analytics.current.startSession(
        "user123",
        companionId,
        currentTopic,
        steps.length
      );
      setCurrentSessionId(sessionId);
    }
  }, [
    callState.status,
    companionId,
    currentTopic,
    steps.length,
    currentSessionId,
  ]);

  // Handle session completion

  const handleSessionComplete = useCallback(
    async (
      finalMessages: Array<{ role: "user" | "assistant"; content: string }>,
      script: Array<{ speaker: string; text: string }>
    ) => {
      console.log("🎉 Session complete! Generating feedback...");
      setIsGeneratingFeedback(true);
      setSessionFeedback(null);
      setActiveTab("feedback"); // Tự động chuyển đến tab feedback

      // Chuẩn bị dữ liệu cho hàm feedback
      const feedbackParams = {
        sessionId: `${companionId}-${currentTopic}`,
        userId: "current-user-id", // Thay thế bằng ID người dùng thực tế
        transcript: finalMessages.filter((msg) => msg.content.trim() !== ""), // Lọc tin nhắn rỗng
        script: script,
      };

      const result = await createLanguageFeedback(feedbackParams);

      if (result.success && result.feedback) {
        console.log("✅ Feedback received:", result.feedback);
        setSessionFeedback(result.feedback);
      } else {
        console.error("❌ Failed to generate feedback.");
        // Có thể hiển thị thông báo lỗi cho người dùng
        setSessionFeedback({
          error: "Could not generate feedback at this time.",
        });
      }

      setIsGeneratingFeedback(false);
    },
    [companionId, currentTopic]
  ); // Thêm dependencies
  // Throttled message handling to reduce re-renders
  useEffect(() => {
    const latestMessage = messages[0];
    if (
      latestMessage &&
      latestMessage.role === "user" &&
      currentSessionId &&
      currentLine
    ) {
      requestAnimationFrame(() => {
        const mockMetrics: SpeechQualityMetrics = {
          clarity: Math.random() * 0.3 + 0.7,
          pace: Math.random() * 0.4 + 0.6,
          volume: Math.random() * 0.2 + 0.8,
          pronunciation: Math.random() * 0.3 + 0.7,
          fluency: Math.random() * 0.4 + 0.6,
        };

        setSpeechMetrics(mockMetrics);

        if (performanceMode.instantFeedback) {
          const feedback = voiceRecognition.current.getPronunciationFeedback(
            latestMessage.content,
            currentLine.text,
            mockMetrics
          );
          setPronunciationFeedback(feedback);
        }
      });
    }
  }, [
    messages,
    currentSessionId,
    currentLine,
    performanceMode.instantFeedback,
  ]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (autoAdvanceTimer.current) {
        clearTimeout(autoAdvanceTimer.current);
      }
    };
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-500";
      case "CONNECTING":
        return "bg-yellow-500 animate-pulse";
      case "ERROR":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "INACTIVE":
        return "Ready to Start";
      case "CONNECTING":
        return "Connecting...";
      case "ACTIVE":
        return "Active Call";
      case "FINISHED":
        return "Call Ended";
      case "ERROR":
        return "Error";
      default:
        return status;
    }
  };

  const getMetricColor = (value: number) => {
    if (value >= 80) return "text-green-600";
    if (value >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  console.log(
    `[UI RENDER] Step: ${conversationState.currentStep}`,
    `Speaker: ${currentLine?.speaker}`,
    `Line: "${currentLine?.text.substring(0, 30)}..."`
  );

  return (
    <div className="max-w-6xl p-6 mx-auto space-y-6">
      {/* Enhanced Header with Timing Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Target className="w-6 h-6" />
                {topicTitles[currentTopic]}
              </CardTitle>
              <p className="text-gray-600">
                Enhanced AI Conversation Practice - Smart Long Sentence
                Processing
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Quick Mode Toggle */}
              <div className="flex items-center space-x-2">
                <Switch
                  checked={timingSettings.quickMode}
                  onCheckedChange={(checked) =>
                    setTimingSettings((prev) => ({
                      ...prev,
                      quickMode: checked,
                    }))
                  }
                />
                <span className="text-sm">Quick Mode</span>
              </div>

              {/* Auto-advance Toggle */}
              <div className="flex items-center space-x-2">
                <Switch
                  checked={timingSettings.autoAdvance}
                  onCheckedChange={(checked) =>
                    setTimingSettings((prev) => ({
                      ...prev,
                      autoAdvance: checked,
                    }))
                  }
                />
                <span className="text-sm">Auto-advance</span>
              </div>

              <div
                className={`w-3 h-3 rounded-full ${getStatusColor(callState.status)}`}
              />
              <Badge variant="outline">{getStatusText(callState.status)}</Badge>
            </div>
          </div>

          {/* ✨ NEW: State Debug Display */}
          {showDebug && (
            <div className="p-3 mb-4 border border-blue-200 rounded-lg bg-blue-50">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">
                  Debug State
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-xs">
                <div>
                  <span className="font-medium">Step:</span>{" "}
                  {conversationState.currentStep}/{conversationState.totalSteps}
                </div>
                <div>
                  <span className="font-medium">Waiting:</span>{" "}
                  <Badge
                    variant={
                      conversationState.isWaitingForUser ? "default" : "outline"
                    }
                    className="text-xs"
                  >
                    {conversationState.isWaitingForUser ? "YES" : "NO"}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium">Speaker:</span>{" "}
                  {currentLine?.speaker || "None"}
                </div>
                <div>
                  <span className="font-medium">Speaking:</span>{" "}
                  <Badge
                    variant={isSpeaking ? "default" : "outline"}
                    className="text-xs"
                  >
                    {isSpeaking ? "YES" : "NO"}
                  </Badge>
                </div>
              </div>

              {/* ✨ NEW: Partial transcript display */}
              {partialTranscript && (
                <div className="p-2 mt-2 border border-yellow-200 rounded bg-yellow-50">
                  <div className="flex items-center gap-2 mb-1">
                    <MessageSquare className="w-3 h-3 text-yellow-600" />
                    <span className="text-xs font-medium text-yellow-800">
                      Live Speech
                    </span>
                  </div>
                  <div className="text-xs text-yellow-700">
                    "{partialTranscript}..."
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Enhanced Progress with Timing Info */}
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <div className="flex items-center space-x-4">
                <span>
                  {conversationState.currentStep}/{conversationState.totalSteps}
                </span>

                {/* Countdown display */}
                {countdown && timingSettings.autoAdvance && (
                  <Badge variant="outline" className="text-xs animate-pulse">
                    Auto-advance in {countdown}s
                  </Badge>
                )}

                {/* Step timing display */}
                {stepTimings[conversationState.currentStep]?.duration && (
                  <Badge variant="outline" className="text-xs">
                    Last step:{" "}
                    {(
                      stepTimings[conversationState.currentStep].duration / 1000
                    ).toFixed(1)}
                    s
                  </Badge>
                )}

                {realTimeMetrics.responseTime > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {(realTimeMetrics.responseTime / 1000).toFixed(1)}s response
                  </Badge>
                )}
              </div>
            </div>
            <Progress value={progress} className="h-2" />

            {/* Real-time Speech Metrics */}
            {speechMetrics && (
              <div className="grid grid-cols-5 gap-2 text-xs">
                <div className="text-center">
                  <div
                    className={`font-medium ${getMetricColor(speechMetrics.clarity * 100)}`}
                  >
                    {(speechMetrics.clarity * 100).toFixed(0)}%
                  </div>
                  <div className="text-gray-500">Clarity</div>
                </div>
                <div className="text-center">
                  <div
                    className={`font-medium ${getMetricColor(speechMetrics.pace * 100)}`}
                  >
                    {(speechMetrics.pace * 100).toFixed(0)}%
                  </div>
                  <div className="text-gray-500">Pace</div>
                </div>
                <div className="text-center">
                  <div
                    className={`font-medium ${getMetricColor(speechMetrics.volume * 100)}`}
                  >
                    {(speechMetrics.volume * 100).toFixed(0)}%
                  </div>
                  <div className="text-gray-500">Volume</div>
                </div>
                <div className="text-center">
                  <div
                    className={`font-medium ${getMetricColor(speechMetrics.pronunciation * 100)}`}
                  >
                    {(speechMetrics.pronunciation * 100).toFixed(0)}%
                  </div>
                  <div className="text-gray-500">Pronunciation</div>
                </div>
                <div className="text-center">
                  <div
                    className={`font-medium ${getMetricColor(speechMetrics.fluency * 100)}`}
                  >
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Conversation Area */}
        <div className="space-y-6 lg:col-span-2">
          {/* Enhanced Avatar and Controls */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col items-center space-y-6">
                {/* Enhanced Companion Avatar */}
                <div
                  className="relative flex items-center justify-center w-40 h-40 rounded-full"
                  style={{ backgroundColor: getSubjectColor(subject) }}
                >
                  <div
                    className={cn(
                      "absolute transition-opacity duration-300",
                      callState.status === CallStatus.FINISHED ||
                        callState.status === CallStatus.INACTIVE
                        ? "opacity-100"
                        : "opacity-0",
                      callState.status === CallStatus.CONNECTING
                        ? "opacity-100 animate-pulse"
                        : undefined
                    )}
                  >
                    <div className="flex items-center justify-center w-24 h-24 bg-white rounded-full">
                      <span className="text-4xl">🎙️</span>
                    </div>
                  </div>
                  <div
                    className={cn(
                      "absolute transition-opacity duration-100",
                      callState.status === CallStatus.ACTIVE
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  >
                    {!performanceMode.reducedAnimations && (
                      <Lottie
                        lottieRef={lottieRef}
                        animationData={soundwaves}
                        autoplay={false}
                        className="w-32 h-32"
                      />
                    )}
                    {performanceMode.reducedAnimations && (
                      <div className="flex items-center justify-center w-32 h-32">
                        <div
                          className={cn(
                            "w-16 h-16 bg-white rounded-full flex items-center justify-center",
                            isSpeaking ? "animate-pulse" : ""
                          )}
                        >
                          <Mic className="w-8 h-8" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-center">
                  <h2 className="text-xl font-bold">{name}</h2>
                  <p className="text-gray-600">Your AI Conversation Partner</p>
                </div>

                {/* Enhanced Control Buttons */}
                <div className="w-full space-y-3">
                  <Button
                    onClick={
                      callState.status === "ACTIVE" ? endCall : startCall
                    }
                    disabled={callState.status === "CONNECTING"}
                    className={cn(
                      "w-full transition-all duration-200",
                      callState.status === "ACTIVE"
                        ? "bg-red-600 hover:bg-red-700"
                        : "bg-green-600 hover:bg-green-700",
                      callState.status === "CONNECTING"
                        ? "animate-pulse"
                        : undefined
                    )}
                  >
                    {callState.status === "ACTIVE"
                      ? "End Session"
                      : callState.status === "CONNECTING"
                        ? "Connecting..."
                        : "Start Session"}
                  </Button>

                  <div className="grid grid-cols-5 gap-2">
                    <Button
                      variant="outline"
                      onClick={toggleMute}
                      disabled={callState.status !== "ACTIVE"}
                      className="text-xs bg-transparent"
                    >
                      {isMuted ? (
                        <MicOff className="w-4 h-4" />
                      ) : (
                        <Mic className="w-4 h-4" />
                      )}
                    </Button>

                    <Button
                      variant="outline"
                      onClick={manualAdvance}
                      disabled={callState.status !== "ACTIVE"}
                      className="text-xs bg-transparent"
                      title="Advance to next step"
                    >
                      <FastForward className="w-4 h-4" />
                    </Button>

                    <Button
                      variant="outline"
                      onClick={retryCurrentStep}
                      disabled={
                        callState.status !== "ACTIVE" ||
                        !conversationState.isWaitingForUser
                      }
                      className="text-xs bg-transparent"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      onClick={resetConversation}
                      disabled={callState.status === "ACTIVE"}
                      className="text-xs bg-transparent"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() =>
                        skipToStep(conversationState.currentStep + 1)
                      }
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
              <Tabs
                defaultValue="conversation"
                value={activeTab}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger
                    className={`${activeTab == "conversation" && "text-white-100"}`}
                    style={{
                      backgroundColor:
                        activeTab == "conversation" ? "#313c72" : "transparent",
                    }}
                    value="conversation"
                    onClick={() => setActiveTab("conversation")}
                  >
                    Conversation
                  </TabsTrigger>
                  <TabsTrigger
                    value="feedback"
                    className={`${activeTab == "feedback" && "text-white-100"}`}
                    style={{
                      backgroundColor:
                        activeTab == "feedback" ? "#313c72" : "transparent",
                    }}
                    onClick={() => setActiveTab("feedback")}
                  >
                    Feedback
                  </TabsTrigger>
                  <TabsTrigger
                    value="analytics"
                    className={`${activeTab == "analytics" && "text-white-100"}`}
                    style={{
                      backgroundColor:
                        activeTab == "analytics" ? "#313c72" : "transparent",
                    }}
                    onClick={() => setActiveTab("analytics")}
                  >
                    Analytics
                  </TabsTrigger>
                  <TabsTrigger
                    value="settings"
                    className={`${activeTab == "settings" && "text-white-100"}`}
                    style={{
                      backgroundColor:
                        activeTab == "settings" ? "#313c72" : "transparent",
                    }}
                    onClick={() => setActiveTab("settings")}
                  >
                    Settings
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="conversation" className="space-y-4">
                  {/* Current Line Display with countdown */}
                  {currentLine && (
                    <div className="relative p-5 overflow-hidden border-2 border-purple-300 rounded-lg shadow-md bg-gradient-to-r from-purple-50 via-rose-50 to-indigo-50">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-100/20 to-indigo-100/20 animate-pulse"></div>

                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <Badge
                              variant={
                                currentLine.speaker === "Leo"
                                  ? "default"
                                  : "secondary"
                              }
                              className="text-sm font-medium text-purple-800 bg-purple-100 border-purple-300"
                            >
                              {currentLine.speaker}
                            </Badge>
                            {conversationState.isWaitingForUser && (
                              <Badge
                                variant="outline"
                                className="text-yellow-700 border-yellow-300 animate-pulse bg-yellow-50"
                              >
                                🎯 Your turn!
                              </Badge>
                            )}
                            {isSpeaking && (
                              <Badge
                                variant="outline"
                                className="text-green-700 border-green-300 bg-green-50"
                              >
                                🎤 Listening...
                              </Badge>
                            )}
                            <Badge
                              variant="outline"
                              className="font-semibold text-purple-700 bg-purple-100 border-purple-300"
                            >
                              ⚡ CURRENT
                            </Badge>

                            {/* ✨ NEW: Long sentence indicator with processing delay info */}
                            {currentLine.text.split(/\s+/).length > 10 && (
                              <Badge
                                variant="outline"
                                className="text-blue-700 border-blue-300 bg-blue-50"
                              >
                                📏 Long sentence (2s delay)
                              </Badge>
                            )}
                          </div>

                          {/* Countdown and manual advance */}
                          <div className="flex items-center space-x-2">
                            {countdown && (
                              <Badge
                                variant="outline"
                                className="animate-pulse"
                              >
                                {countdown}s
                              </Badge>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={manualAdvance}
                              disabled={callState.status !== "ACTIVE"}
                              className="text-xs bg-transparent"
                            >
                              <FastForward className="w-3 h-3 mr-1" />
                              Next
                            </Button>
                          </div>
                        </div>
                        <p className="text-lg font-semibold leading-relaxed text-purple-900">
                          {/* THAY THẾ DÒNG NÀY */}
                          {/* {currentLine.text} */}
                          {/* BẰNG ĐOẠN CODE NÀY ĐỂ XUỐNG DÒNG */}
                          {currentLine.text
                            .split(". ")
                            .map((sentence, index, array) => (
                              <span key={index} className="block mb-2">
                                {sentence}
                                {index < array.length - 1 ? "." : ""}
                              </span>
                            ))}
                        </p>

                        {/* ✨ NEW: Enhanced word count and processing info for long sentences */}
                        {currentLine.text.split(/\s+/).length > 10 && (
                          <div className="mt-2 text-xs text-purple-600">
                            {currentLine.text.split(/\s+/).length} words •
                            System waits 2 seconds after you finish speaking •
                            Minimum 50% completion required
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ✨ NEW: Enhanced live partial transcript display */}
                  {partialTranscript && conversationState.isWaitingForUser && (
                    <div className="p-3 border border-blue-200 rounded-lg bg-blue-50">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="w-4 h-4 text-blue-600 animate-pulse" />
                        <span className="text-sm font-medium text-blue-800">
                          You&apos;re speaking...
                        </span>
                        {currentLine &&
                          currentLine.text.split(/\s+/).length > 10 && (
                            <Badge
                              variant="outline"
                              className="text-xs text-blue-700 bg-blue-100"
                            >
                              Processing delay active
                            </Badge>
                          )}
                      </div>
                      <div className="text-sm text-blue-700">
                        &quot;{partialTranscript}...&quot;
                      </div>
                      <div className="mt-1 text-xs text-blue-600">
                        {currentLine &&
                        currentLine.text.split(/\s+/).length > 10
                          ? "Continue speaking - system will wait 2 seconds after you finish"
                          : "Continue speaking to complete the sentence"}
                      </div>
                      {/* ✨ NEW: Word count progress for long sentences */}
                      {currentLine &&
                        currentLine.text.split(/\s+/).length > 10 && (
                          <div className="mt-1 text-xs text-blue-600">
                            Progress:{" "}
                            {partialTranscript.trim().split(/\s+/).length} /{" "}
                            {currentLine.text.split(/\s+/).length} words (
                            {Math.round(
                              (partialTranscript.trim().split(/\s+/).length /
                                currentLine.text.split(/\s+/).length) *
                                100
                            )}
                            %)
                          </div>
                        )}
                    </div>
                  )}

                  {/* Optimized Message History */}
                  <div className="space-y-4 overflow-y-auto max-h-96">
                    {groupedMessages.length === 0 ? (
                      <p className="py-8 text-center text-gray-500">
                        Start a session to begin the conversation
                      </p>
                    ) : (
                      groupedMessages.map((group, groupIndex) => (
                        <div
                          key={`${group.role}-${group.timestamp}-${groupIndex}`}
                          className={cn(
                            "p-4 rounded-lg border-l-4 shadow-sm transition-all duration-200",
                            group.role === "assistant"
                              ? "bg-blue-50 border-l-blue-400 border border-blue-200"
                              : "bg-green-50 border-l-green-400 border border-green-200"
                          )}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <Badge
                                variant={
                                  group.role === "assistant"
                                    ? "default"
                                    : "secondary"
                                }
                                className="text-sm"
                              >
                                {group.speaker}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {group.messages.length} message
                                {group.messages.length > 1 ? "s" : ""}
                              </Badge>
                              {group.messages.some(
                                (msg: any) => msg.similarity
                              ) && (
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "text-xs",
                                    group.messages.find(
                                      (msg: any) => msg.similarity
                                    )?.similarity?.score >= 0.7
                                      ? "text-green-700 border-green-300 bg-green-50"
                                      : "text-red-700 border-red-300 bg-red-50"
                                  )}
                                >
                                  {Math.round(
                                    group.messages.find(
                                      (msg: any) => msg.similarity
                                    )?.similarity?.score * 100 || 0
                                  )}
                                  % match{" "}
                                  {group.messages.find(
                                    (msg: any) => msg.similarity
                                  )?.similarity?.score >= 0.7
                                    ? "✅"
                                    : "❌"}
                                </Badge>
                              )}
                            </div>
                            <span className="text-xs text-gray-500">
                              {new Date(group.timestamp).toLocaleTimeString()}
                            </span>
                          </div>

                          <div className="space-y-2">
                            {group.messages.map(
                              (message: any, messageIndex: number) => (
                                <div
                                  key={`${message.timestamp}-${messageIndex}`}
                                  className="text-sm leading-relaxed text-gray-700"
                                >
                                  <p className="mb-1">{message.content}</p>
                                  {message.similarity && (
                                    <div className="mt-1 text-xs text-gray-500">
                                      Similarity:{" "}
                                      <span
                                        className={cn(
                                          "font-medium",
                                          message.similarity.score >= 0.7
                                            ? "text-green-600"
                                            : "text-red-600"
                                        )}
                                      >
                                        {Math.round(
                                          message.similarity.score * 100
                                        )}
                                        %
                                      </span>
                                      {message.similarity.score < 0.7 &&
                                        " (Needs retry)"}
                                    </div>
                                  )}
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </TabsContent>

                {/* Other tabs remain the same... */}
                <TabsContent
                  value="feedback"
                  className="p-4 space-y-4 border rounded-md bg-gray-50"
                >
                  {isGeneratingFeedback && (
                    <div className="flex flex-col items-center justify-center py-8">
                      <div className="w-8 h-8 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
                      <p className="mt-4 text-gray-600">
                        AI is analyzing your conversation...
                      </p>
                    </div>
                  )}

                  {!isGeneratingFeedback && !sessionFeedback && (
                    <p className="py-8 text-center text-gray-500">
                      Complete a session to receive your feedback.
                    </p>
                  )}

                  {sessionFeedback && !sessionFeedback.error && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-xl font-bold text-gray-800">
                          Conversation Feedback
                        </h3>
                        <p className="text-gray-600">
                          {sessionFeedback.finalAssessment}
                        </p>
                      </div>

                      {/* Scores */}
                      <div className="p-4 bg-white border rounded-lg">
                        <h4 className="mb-2 font-semibold">
                          Overall Score: {sessionFeedback.totalScore}/100
                        </h4>
                        <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-3 lg:grid-cols-5">
                          {Object.entries(sessionFeedback.categoryScores).map(
                            ([key, value]) => (
                              <div key={key} className="text-center">
                                <p className="text-lg font-bold text-blue-600">
                                  {value as number}
                                </p>
                                <p className="text-xs font-medium text-gray-500 capitalize">
                                  {key}
                                </p>
                              </div>
                            )
                          )}
                        </div>
                      </div>

                      {/* Strengths and Improvements */}
                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div className="p-4 border-l-4 border-green-500 rounded-r-lg bg-green-50">
                          <h4 className="mb-2 font-semibold text-green-800">
                            👍 Strengths
                          </h4>
                          <ul className="space-y-1 text-green-700 list-disc list-inside">
                            {sessionFeedback.strengths.map(
                              (item: string, index: number) => (
                                <li key={index} className="text-green-950">{item}</li>
                              )
                            )}
                          </ul>
                        </div>
                        <div className="p-4 border-l-4 border-yellow-500 rounded-r-lg bg-yellow-50">
                          <h4 className="mb-2 font-semibold text-yellow-800">
                            🎯 Areas for Improvement
                          </h4>
                          <ul className="space-y-1 text-yellow-700 list-disc list-inside">
                            {sessionFeedback.areasForImprovement.map(
                              (item: string, index: number) => (
                                <li key={index} className="text-yellow-950">{item}</li>
                              )
                            )}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {sessionFeedback?.error && (
                    <p className="py-8 text-center text-red-500">
                      {sessionFeedback.error}
                    </p>
                  )}
                </TabsContent>

                <TabsContent value="analytics" className="space-y-4">
                  <p className="py-8 text-center text-gray-500">
                    Analytics content...
                  </p>
                </TabsContent>

                <TabsContent value="settings" className="space-y-6">
                  <div className="space-y-6">
                    {/* Timing Settings */}
                    <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <h4 className="flex items-center gap-2 mb-4 font-medium">
                        <Clock className="w-4 h-4" />
                        Timing Settings
                      </h4>

                      <div className="space-y-4">
                        <div>
                          <label className="block mb-2 text-sm font-medium">
                            Step Transition Delay:{" "}
                            {timingSettings.stepTransitionDelay}ms
                          </label>
                          <Slider
                            value={[timingSettings.stepTransitionDelay]}
                            onValueChange={([value]) =>
                              setTimingSettings((prev) => ({
                                ...prev,
                                stepTransitionDelay: value,
                              }))
                            }
                            max={5000}
                            min={100}
                            step={100}
                            className="w-full"
                          />
                        </div>

                        <div>
                          <label className="block mb-2 text-sm font-medium">
                            Speech Timeout: {timingSettings.speechTimeout}ms
                          </label>
                          <Slider
                            value={[timingSettings.speechTimeout]}
                            onValueChange={([value]) =>
                              setTimingSettings((prev) => ({
                                ...prev,
                                speechTimeout: value,
                              }))
                            }
                            max={10000}
                            min={1000}
                            step={500}
                            className="w-full"
                          />
                        </div>

                        <div>
                          <label className="block mb-2 text-sm font-medium">
                            Response Wait Time:{" "}
                            {timingSettings.responseWaitTime}ms
                          </label>
                          <Slider
                            value={[timingSettings.responseWaitTime]}
                            onValueChange={([value]) =>
                              setTimingSettings((prev) => ({
                                ...prev,
                                responseWaitTime: value,
                              }))
                            }
                            max={8000}
                            min={500}
                            step={250}
                            className="w-full"
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            Auto-advance Steps
                          </span>
                          <Switch
                            checked={timingSettings.autoAdvance}
                            onCheckedChange={(checked) =>
                              setTimingSettings((prev) => ({
                                ...prev,
                                autoAdvance: checked,
                              }))
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            Quick Mode
                          </span>
                          <Switch
                            checked={timingSettings.quickMode}
                            onCheckedChange={(checked) =>
                              setTimingSettings((prev) => ({
                                ...prev,
                                quickMode: checked,
                              }))
                            }
                          />
                        </div>
                      </div>
                    </div>

                    {/* Performance Settings */}
                    <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <h4 className="flex items-center gap-2 mb-4 font-medium">
                        <Zap className="w-4 h-4" />
                        Performance Settings
                      </h4>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            Reduced Animations
                          </span>
                          <Switch
                            checked={performanceMode.reducedAnimations}
                            onCheckedChange={(checked) =>
                              setPerformanceMode((prev) => ({
                                ...prev,
                                reducedAnimations: checked,
                              }))
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            Fast Transitions
                          </span>
                          <Switch
                            checked={performanceMode.fastTransitions}
                            onCheckedChange={(checked) =>
                              setPerformanceMode((prev) => ({
                                ...prev,
                                fastTransitions: checked,
                              }))
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            Instant Feedback
                          </span>
                          <Switch
                            checked={performanceMode.instantFeedback}
                            onCheckedChange={(checked) =>
                              setPerformanceMode((prev) => ({
                                ...prev,
                                instantFeedback: checked,
                              }))
                            }
                          />
                        </div>
                      </div>
                    </div>

                    {/* Quick Presets */}
                    <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <h4 className="mb-4 font-medium">Quick Presets</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setTimingSettings({
                              stepTransitionDelay: 500,
                              speechTimeout: 2000,
                              autoAdvance: true,
                              quickMode: true,
                              responseWaitTime: 1000,
                            });
                            setPerformanceMode({
                              reducedAnimations: true,
                              fastTransitions: true,
                              skipIntermediateSteps: false,
                              instantFeedback: true,
                            });
                          }}
                        >
                          ⚡ Speed Mode
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setTimingSettings({
                              stepTransitionDelay: 2000,
                              speechTimeout: 5000,
                              autoAdvance: false,
                              quickMode: false,
                              responseWaitTime: 3000,
                            });
                            setPerformanceMode({
                              reducedAnimations: false,
                              fastTransitions: false,
                              skipIntermediateSteps: false,
                              instantFeedback: false,
                            });
                          }}
                        >
                          🎯 Careful Mode
                        </Button>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Sidebar */}
        <div className="space-y-6">
          {/* Topic Overview with Timing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
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
                  <span>
                    {steps.filter((s) => s.speaker === "Gwen").length}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Long Sentences:</span>
                  <span>
                    {
                      steps.filter((s) => s.text.split(/\s+/).length > 10)
                        .length
                    }
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Progress:</span>
                  <span>{progress.toFixed(1)}%</span>
                </div>

                {/* Average step time */}
                {Object.keys(stepTimings).length > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Avg Step Time:</span>
                    <span>
                      {(
                        Object.values(stepTimings)
                          .filter((t) => t.duration)
                          .reduce((acc, t) => acc + (t.duration || 0), 0) /
                        Object.values(stepTimings).filter((t) => t.duration)
                          .length /
                        1000
                      ).toFixed(1)}
                      s
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Zap className="w-5 h-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setTimingSettings((prev) => ({
                      ...prev,
                      quickMode: !prev.quickMode,
                    }))
                  }
                  className={cn(
                    "w-full",
                    timingSettings.quickMode
                      ? "bg-yellow-100 border-yellow-300"
                      : ""
                  )}
                >
                  {timingSettings.quickMode
                    ? "🐌 Normal Speed"
                    : "⚡ Quick Mode"}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setTimingSettings((prev) => ({
                      ...prev,
                      autoAdvance: !prev.autoAdvance,
                    }))
                  }
                  className={cn(
                    "w-full",
                    timingSettings.autoAdvance
                      ? "bg-green-100 border-green-300"
                      : ""
                  )}
                >
                  {timingSettings.autoAdvance
                    ? "⏸️ Manual Mode"
                    : "▶️ Auto-advance"}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={manualAdvance}
                  disabled={callState.status !== "ACTIVE"}
                  className="w-full bg-transparent"
                >
                  <FastForward className="w-4 h-4 mr-2" />
                  Next Step
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDebug(!showDebug)}
                  className="w-full"
                >
                  Toggle Debug Mode
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetConversation}
                  disabled={callState.status === "ACTIVE"}
                  className="w-full bg-transparent"
                >
                  Reset Conversation
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EnhancedCompanionConversationOptimized;
