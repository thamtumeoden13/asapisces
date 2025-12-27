"use client";

import { useRef, useState, useEffect, useMemo, useCallback } from "react";
import Lottie, { type LottieRefCurrentProps } from "lottie-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useConversation } from "@/hooks/use-conversation";
import {
  EnhancedVoiceRecognition,
  type SpeechQualityMetrics,
} from "@/lib/enhanced-voice-recognition";
import { ConversationAnalytics } from "@/lib/conversation-analytics";
import { type TopicKey, CallStatus } from "@/types/podcast";
import soundwaves from "@/constants/soundwaves.json";
import {
  Mic,
  MicOff,
  RotateCcw,
  SkipForward,
  Zap,
  Clock,
  FastForward,
  MessageSquare,
  Maximize,
  Minimize,
} from "lucide-react";
import type { MessageGroup } from "@/types";
import { createLanguageFeedback } from "@/lib/actions/general.action";
import {
  FeedbackHistoryPoint,
  saveConversationFeedbackAction,
} from "@/lib/actions/feedback.action";
import { AnalyticsChart } from "./AnalyticsChart";
import { TranslatedText } from "./TranslatedText";
import { AskAITutor } from "./AskAITutor";
import { SHOULDADVANCESCORETHERESHOLD } from "@/constants";
import { useConversationContext } from "@/contexts/ConversationContext";
import { SpeakerAvatar } from "./SpeakerAvatar";
import { AudioVisualizer } from "./AudioVisualizer";
import { LiveTranscript } from "./LiveTranscript";
import { useFullscreen } from "@/hooks/use-fullscreen";
// import { PodcastPlayer } from "./podcast-player";

const cn = (...classes: (string | undefined)[]) =>
  classes.filter(Boolean).join(" ");

const getSubjectColor = (subject: string) => {
  const colors: Record<string, string> = {
    english: "#3B82F6",
    math: "#EF4444",
    science: "#10B981",
    history: "#F59E0B",
    default: "#3B82F6",
  };
  return colors[subject] || colors.default;
};

interface ImmersiveViewComponentProps {
  isLoadingChart?: boolean;
  feedbackHistory?: FeedbackHistoryPoint[];
}

const ImmersiveViewComponent = ({
  isLoadingChart = false,
  feedbackHistory = [],
}: ImmersiveViewComponentProps) => {
  const {
    companionId,
    subject,
    topic,
    name,
    userName,
    userId,
    voiceId,
    userRole,
    ttsProvider,
    geminiFeedback,
    selectedTopic,
    podcastTopics,
    topicTitles,
    onTopicComplete,
    onCallStateChange,
  } = useConversationContext();

  const lottieRef = useRef<LottieRefCurrentProps>(null);

  // Timing Configuration State
  const [timingSettings, setTimingSettings] = useState({
    stepTransitionDelay: 1000,
    responseWaitTime: 1500,
    speechTimeout: 40000,
    autoAdvance: true,
    quickMode: false,
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
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [pronunciationFeedback, setPronunciationFeedback] =
    useState<unknown>(null);

  // THÊM CÁC STATE NÀY
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);
  const [sessionFeedback, setSessionFeedback] = useState<any | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"success" | "error" | "">("");

  const [activeTab, setActiveTab] = useState<
    "conversation" | "feedback" | "analytics" | "settings"
  >("conversation");

  // Auto-advance timer
  const autoAdvanceTimer = useRef<NodeJS.Timeout | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  // Initialize enhanced services with optimized settings
  const voiceRecognition = useRef(
    new EnhancedVoiceRecognition({
      language: "en-US",
      sensitivity: 6,
      noiseReduction: true,
      adaptiveThreshold: true,
      contextAware: true,
    })
  );

  const analytics = useRef(new ConversationAnalytics());

  const fullscreenRef = useRef<HTMLDivElement>(null);

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
    startCall,
    endCall,
    toggleMute,
    resetConversation,
    skipToStep,
    retryCurrentStep,
    audioPlayerRef,
    highlightedWordIndex,
  } = useConversation({
    steps,
    voiceId,
    ttsProvider: ttsProvider,
    geminiFeedback: geminiFeedback,
    companionId,
    topicId: currentTopic,
    onSessionComplete: () => {
      handleSessionComplete(
        messages
          .filter((msg) => msg.role === "user" || msg.role === "assistant")
          .map((msg) => ({
            role: msg.role as "user" | "assistant",
            content: msg.content,
          })),
        steps
      );
      onTopicComplete?.(currentTopic);
    },
    timingSettings, // Pass timing settings to the hook
    userRole, // Pass userRole to the hook
  });

  const { isFullscreen, toggleFullscreen } = useFullscreen(fullscreenRef);

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
    const groups: MessageGroup[] = [];
    let currentGroup: MessageGroup | null = null;

    for (const message of sortedMessages) {
      if (!currentGroup || currentGroup.role !== message.role) {
        currentGroup = {
          role: message.role,
          speaker: message.role === "assistant" ? name.split(" ")[0] : userName,
          messages: [
            {
              role: message.role,
              content: message.content,
              timestamp: message.timestamp,
              similarity: message.similarity || null,
            },
          ],
          timestamp: message.timestamp,
        };
        groups.push(currentGroup as MessageGroup);
      } else {
        currentGroup.messages.push({
          role: message.role,
          content: message.content,
          timestamp: message.timestamp,
          similarity: message.similarity || null,
        });
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
        userId: userId ?? "", // Ensure userId is a string
        transcript: finalMessages.filter((msg) => msg.content.trim() !== ""), // Lọc tin nhắn rỗng
        script: script,
        userRole: userRole, // Add userRole to match CreateLanguageFeedbackParams
      };

      const result = await createLanguageFeedback(feedbackParams);

      if (result.success && result.feedback) {
        console.log("✅ Feedback received:", result.feedback);
        setSessionFeedback(result.feedback);

        console.log("💾 Attempting to save feedback to DB...");
        setIsSaving(true);
        setSaveStatus("");

        const saveResult = await saveConversationFeedbackAction({
          userId: userId ?? "",
          topicId: currentTopic,
          companionId: companionId,
          totalScore: result.feedback.totalScore,
          categoryScores: result.feedback.categoryScores,
          strengths: result.feedback.strengths,
          areasForImprovement: result.feedback.areasForImprovement,
          finalAssessment: result.feedback.finalAssessment,
        });

        if (saveResult.success) {
          console.log("✅ Feedback saved successfully!");
          setSaveStatus("success");
        } else {
          console.error("❌ Failed to save feedback:", saveResult.error);
          setSaveStatus("error");
        }
        setIsSaving(false);
      } else {
        console.error("❌ Failed to generate feedback.");
        // Có thể hiển thị thông báo lỗi cho người dùng
        setSessionFeedback({
          error: "Could not generate feedback at this time.",
        });
      }

      setIsGeneratingFeedback(false);
    },
    [userId, companionId, currentTopic, userRole]
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
          clarity: Math.random() * 0.3 + 0.6,
          pace: Math.random() * 0.4 + 0.6,
          volume: Math.random() * 0.2 + 0.8,
          pronunciation: Math.random() * 0.3 + 0.6,
          fluency: Math.random() * 0.4 + 0.6,
          confidence: Math.random() * 0.3 + 0.6,
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

  useEffect(() => {
    onCallStateChange?.(callState.status);
  }, [callState.status]);

  console.log(
    `[UI RENDER] Step: ${conversationState.currentStep}`,
    `Speaker: ${currentLine?.speaker}`,
    `Line: "${currentLine?.text.substring(0, 30)}..."`
  );

  return (
    <div
      className={cn("max-w-7xl mx-auto", showDebug ? "space-y-6" : "space-y-0")}
    >
      <div
        className={cn(
          "grid grid-cols-1 gap-6",
          showDebug ? "lg:grid-cols-3 gap-6" : "lg:grid-cols-1 gap-0"
        )}
      >
        {/* Main Conversation Area */}
        <div className="col-span-3 space-y-6">
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
                <TabsList
                  className={cn(
                    "grid w-full",
                    showDebug ? "grid-cols-4" : "grid-cols-3"
                  )}
                >
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
                  {showDebug && (
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
                  )}
                </TabsList>

                <TabsContent value="conversation" className="space-y-4">
                  <div
                    ref={fullscreenRef}
                    className="bg-gray-800 text-white rounded-xl relative"
                  >
                    <div className="absolute top-4 right-4 z-10">
                      <Button
                        onClick={toggleFullscreen}
                        variant="ghost"
                        size="icon"
                        className="text-white hover:bg-white/10"
                      >
                        {isFullscreen ? (
                          <Minimize className="w-5 h-5" />
                        ) : (
                          <Maximize className="w-5 h-5" />
                        )}
                      </Button>
                    </div>

                    <Card className="bg-gray-800 text-white p-6 md:p-10 rounded-xl">
                      <div className="flex justify-between items-center h-[44vh] w-full">
                        {/* Nhân vật 1 (AI/User) */}
                        <SpeakerAvatar
                          name={"user"}
                          image={"/img/gallery-1.webp"}
                          isActive={currentLine?.speaker === userRole}
                        />

                        {/* Khu vực trung tâm: Dòng thoại và Sóng âm */}
                        <div className="flex flex-col items-center justify-center text-center w-4/6 space-y-4 h-full relative">
                          <LiveTranscript
                            text={
                              currentLine?.text || "Start a session to begin."
                            }
                            isUserTurn={conversationState.isWaitingForUser}
                          />
                          <AudioVisualizer isSpeaking={isSpeaking} />
                          <audio ref={audioPlayerRef} className="hidden" />{" "}
                          <div className="flex flex-row items-between space-y-4 justify-center w-full p-2 absolute bottom-0 left-0 right-0">
                            <div className="grid grid-cols-3 gap-2">
                              <div className="">
                                <Button
                                  onClick={
                                    callState.status === "ACTIVE"
                                      ? endCall
                                      : startCall
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
                              </div>
                              <div className="col-span-2">
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
                                      skipToStep(
                                        conversationState.currentStep + 1
                                      )
                                    }
                                    disabled={callState.status !== "ACTIVE"}
                                    className="text-xs bg-transparent"
                                  >
                                    <SkipForward className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Nhân vật 2 (AI/User) */}
                        <SpeakerAvatar
                          name={"AI"}
                          image={"/img/gallery-1.webp"}
                          isActive={currentLine?.speaker !== userRole}
                        />
                      </div>
                    </Card>
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
                                <li key={index} className="text-green-950">
                                  {item}
                                </li>
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
                                <li key={index} className="text-yellow-950">
                                  {item}
                                </li>
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

                  {/* THÊM PHẦN HIỂN THỊ TRẠNG THÁI LƯU */}
                  {sessionFeedback && !sessionFeedback.error && (
                    <div className="mt-4 text-sm text-center">
                      {isSaving && (
                        <p className="text-blue-600 animate-pulse">
                          Saving your feedback...
                        </p>
                      )}
                      {saveStatus === "success" && (
                        <p className="text-green-600">
                          ✓ Feedback saved successfully!
                        </p>
                      )}
                      {saveStatus === "error" && (
                        <p className="text-red-600">
                          Could not save your feedback. Please try again later.
                        </p>
                      )}
                    </div>
                  )}

                  {callState.status === CallStatus.FINISHED &&
                    messages.length > 0 && (
                      <AskAITutor
                        userRole={userRole}
                        fullTranscript={messages}
                        originalScript={steps}
                      />
                    )}
                </TabsContent>

                <TabsContent value="analytics" className="space-y-4">
                  {/* --- TÍCH HỢP BIỂU ĐỒ VÀO ĐÂY --- */}
                  {/* Bạn có thể đặt nó trong một Card hoặc trong Tab "Analytics" */}
                  <Card className="mt-8">
                    <CardHeader>
                      <CardTitle>
                        Progress History for:{" "}
                        {topicTitles[selectedTopic ?? topic]}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {isLoadingChart ? (
                        <div className="flex items-center justify-center h-64">
                          <p>Loading Chart Data...</p>
                        </div>
                      ) : (
                        <AnalyticsChart data={feedbackHistory} />
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {showDebug && (
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
                              min={500}
                              step={500}
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
                              max={60000}
                              min={20000}
                              step={5000}
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
                                stepTransitionDelay: 1000,
                                responseWaitTime: 2500,
                                speechTimeout: 30000,
                                autoAdvance: true,
                                quickMode: true,
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
                                responseWaitTime: 3500,
                                speechTimeout: 40000,
                                autoAdvance: false,
                                quickMode: false,
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
                )}
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ImmersiveViewComponent;
