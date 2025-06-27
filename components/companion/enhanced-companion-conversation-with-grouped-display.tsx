"use client";

import React, { useRef, useCallback } from "react";
import Lottie, { type LottieRefCurrentProps } from "lottie-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useVapiConversation } from "@/hooks/use-vapi-conversation-enhanced-long-sentences";
import { EnhancedConversationDisplayGrouped } from "@/components/companion/enhanced-conversation-display-grouped";
import { ConversationFlowDisplay } from "@/components/companion/conversation-flow-display";
import { DebugPanel } from "@/components/companion/debug-panel";
import { podcastTopics, topicTitles } from "@/data/podcast-topics";
import type { TopicKey, CompanionComponentProps } from "@/types/podcast";
import { LeoSpeechMonitor } from "@/components/companion/leo-speech-monitor";
import soundwaves from "@/constants/soundwaves.json";

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

interface EnhancedCompanionConversationProps
  extends Partial<CompanionComponentProps> {
  selectedTopic?: TopicKey;
  onTopicComplete?: (topic: TopicKey) => void;
}

const EnhancedCompanionConversationWithGroupedDisplay = ({
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
  const lottieRef = useRef<LottieRefCurrentProps>(null);

  // State for debug mode and view preferences
  const [showDebug, setShowDebug] = React.useState(
    process.env.NODE_ENV === "development"
  );
  const [activeTab, setActiveTab] = React.useState("conversation");
  const [leoSpeechStatus, setLeoSpeechStatus] = React.useState<{
    isDelivering: boolean;
    currentSentence: string;
    progress: number;
  }>({
    isDelivering: false,
    currentSentence: "",
    progress: 0,
  });

  // Remove local callState and use hookCallState instead
  // const [callState, setCallState] = useState({ status: CallStatus.INACTIVE, sessionId: "", error: "" })

  // Get steps for current topic
  const currentTopic = (selectedTopic || topic) as TopicKey;
  const steps = podcastTopics[currentTopic] || [];

  // Use enhanced VAPI conversation hook
  const {
    callState: hookCallState,
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
    manualTriggerLeo,
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
    onSessionComplete: () => onTopicComplete?.(currentTopic),
  });

  // Use hookCallState throughout the component
  const callState = hookCallState;

  // Control Lottie animation based on speaking state
  React.useEffect(() => {
    if (lottieRef.current) {
      if (isSpeaking) {
        lottieRef.current.play();
      } else {
        lottieRef.current.stop();
      }
    }
  }, [isSpeaking]);

  // Monitor Leo's speech delivery
  React.useEffect(() => {
    if (currentLine?.speaker === "Leo" && callState.status === "ACTIVE") {
      setLeoSpeechStatus({
        isDelivering: true,
        currentSentence: currentLine.text,
        progress: 0,
      });

      // Calculate expected delivery time
      const wordCount = currentLine.text.split(/\s+/).length;
      const expectedDuration = wordCount * 150 + 3000; // 150ms per word + 3s base

      // Update progress
      const interval = setInterval(() => {
        setLeoSpeechStatus((prev) => {
          const newProgress = Math.min(
            prev.progress + 100 / (expectedDuration / 100),
            100
          );
          return { ...prev, progress: newProgress };
        });
      }, 100);

      // Complete after expected duration
      setTimeout(() => {
        setLeoSpeechStatus({
          isDelivering: false,
          currentSentence: "",
          progress: 100,
        });
        clearInterval(interval);
      }, expectedDuration);

      return () => clearInterval(interval);
    }
  }, [currentLine, callState.status]);

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

  const handleStartCall = useCallback(() => {
    console.log("🚀 Starting VAPI call with enhanced config...");
    // setCallState({ status: CallStatus.CONNECTING })

    // Use startCall from the hook instead of window.VAPI
    startCall();
  }, [startCall]);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header with Topic Info and Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <div>
              <CardTitle className="text-2xl">
                {topicTitles[currentTopic]}
              </CardTitle>
              <p className="text-gray-600">
                Enhanced Voice Conversation Practice
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Debug Mode Toggle */}
              <div className="flex items-center space-x-2">
                {/* <Switch checked={showDebug} onCheckedChange={setShowDebug} /> */}
                <span className="text-sm">Debug</span>
              </div>
              <div
                className={`w-3 h-3 rounded-full ${getStatusColor(callState.status)}`}
              />
              <Badge variant="outline">{getStatusText(callState.status)}</Badge>
            </div>
          </div>

          {/* Enhanced Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <div className="flex items-center space-x-2">
                <span>
                  {conversationState.currentStep}/{conversationState.totalSteps}
                </span>
                {hasPartialInput && (
                  <Badge variant="outline" className="text-xs animate-pulse">
                    Processing...
                  </Badge>
                )}
                {currentSimilarity && (
                  <Badge variant="secondary" className="text-xs">
                    Score: {Math.round(currentSimilarity.score * 100)}%
                  </Badge>
                )}
              </div>
            </div>
            <Progress value={progress} className="h-2" />
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
        {/* Avatar and Controls */}
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
                    callState.status === "FINISHED" ||
                      callState.status === "INACTIVE"
                      ? "opacity-100"
                      : "opacity-0",
                    callState.status === "CONNECTING" &&
                      "opacity-100 animate-pulse"
                  )}
                >
                  <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center">
                    <span className="text-4xl">🎙️</span>
                  </div>
                </div>
                <div
                  className={cn(
                    "absolute transition-opacity duration-100",
                    callState.status === "ACTIVE" ? "opacity-100" : "opacity-0"
                  )}
                >
                  <Lottie
                    lottieRef={lottieRef}
                    animationData={soundwaves}
                    autoplay={false}
                    className="w-32 h-32"
                  />
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

              {/* Leo Speech Monitor */}
              {currentLine?.speaker === "Leo" && (
                <div className="w-full">
                  <LeoSpeechMonitor
                    currentLine={currentLine}
                    isSpeaking={isSpeaking}
                    callState={callState}
                  />
                </div>
              )}

              {/* Leo Speech Status */}
              {leoSpeechStatus.isDelivering &&
                currentLine?.speaker === "Leo" && (
                  <div className="w-full">
                    <Card className="border-blue-200 bg-blue-50">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge variant="default" className="animate-pulse">
                            🎤 Leo Speaking
                          </Badge>
                          <span className="text-xs text-blue-700">
                            {Math.round(leoSpeechStatus.progress)}% complete
                          </span>
                        </div>
                        <Progress
                          value={leoSpeechStatus.progress}
                          className="h-2 mb-2"
                        />
                        <p className="text-xs text-blue-600 leading-relaxed">
                          "{leoSpeechStatus.currentSentence}"
                        </p>
                        <div className="mt-2 text-xs text-blue-500">
                          💡 Leo is delivering this complete sentence. Please
                          wait for him to finish.
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

              {/* Enhanced Control Buttons */}
              <div className="w-full space-y-3">
                <Button
                  onClick={
                    callState.status === "ACTIVE" ? endCall : handleStartCall
                  }
                  disabled={callState.status === "CONNECTING"}
                  className={cn(
                    "w-full",
                    callState.status === "ACTIVE"
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-green-600 hover:bg-green-700",
                    callState.status === "CONNECTING" && "animate-pulse"
                  )}
                >
                  {callState.status === "ACTIVE"
                    ? "End Session"
                    : callState.status === "CONNECTING"
                      ? "Connecting..."
                      : "Start Session"}
                </Button>

                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant="outline"
                    onClick={toggleMute}
                    disabled={callState.status !== "ACTIVE"}
                    className="text-xs"
                  >
                    {isMuted ? "🎤" : "🔇"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={retryCurrentStep}
                    disabled={
                      callState.status !== "ACTIVE" ||
                      !conversationState.isWaitingForUser
                    }
                    className="text-xs"
                  >
                    🔄 Retry
                  </Button>
                  <Button
                    variant="outline"
                    onClick={resetConversation}
                    disabled={callState.status === "ACTIVE"}
                    className="text-xs"
                  >
                    ↺ Reset
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Area with Tabs */}
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="conversation">Conversation</TabsTrigger>
              <TabsTrigger value="flow">Script Flow</TabsTrigger>
              {showDebug && <TabsTrigger value="debug">Debug</TabsTrigger>}
            </TabsList>

            <TabsContent value="conversation" className="mt-4">
              <EnhancedConversationDisplayGrouped
                conversationState={conversationState}
                messages={messages}
                currentLine={currentLine}
                isSpeaking={isSpeaking}
                callState={callState}
                onRetry={retryCurrentStep}
                onSkip={() => skipToStep(conversationState.currentStep + 1)}
                showDebug={showDebug}
              />
            </TabsContent>

            <TabsContent value="flow" className="mt-4">
              <ConversationFlowDisplay
                conversationState={conversationState}
                messages={messages}
                currentLine={currentLine}
                steps={steps}
                onJumpToStep={skipToStep}
              />
            </TabsContent>

            {showDebug && (
              <TabsContent value="debug" className="mt-4">
                <DebugPanel
                  callState={callState}
                  conversationState={conversationState}
                  currentLine={currentLine}
                  onManualTrigger={manualTriggerLeo}
                  onSkipStep={() =>
                    skipToStep(conversationState.currentStep + 1)
                  }
                />
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default EnhancedCompanionConversationWithGroupedDisplay;
