"use client";

import React, { useRef } from "react";
import Lottie, { type LottieRefCurrentProps } from "lottie-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { useVapiConversation } from "@/hooks/use-vapi-conversation-enhanced-debug"; // Updated import
import { SimilarityDebugPanel } from "@/components/companion/similarity-debug-panel"; // New component
import { podcastTopics, topicTitles } from "@/data/podcast-topics";
import {
  type TopicKey,
  type CompanionComponentProps,
  CallStatus,
} from "@/types/podcast";
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

const EnhancedCompanionConversation = ({
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

  // State for debug mode
  const [showDebug, setShowDebug] = React.useState(
    process.env.NODE_ENV === "development"
  );

  // Get steps for current topic
  const currentTopic = (selectedTopic || topic) as TopicKey;
  const steps = podcastTopics[currentTopic] || [];

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
    onSessionComplete: () => onTopicComplete?.(currentTopic),
  });

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

  const getMessageBadgeVariant = (similarity: any) => {
    if (!similarity) return "secondary";
    if (similarity.score >= 0.8) return "default";
    if (similarity.score >= 0.6) return "secondary";
    return "destructive";
  };

  const getMessageBadgeText = (similarity: any) => {
    if (!similarity) return "N/A";
    return `${Math.round(similarity.score * 100)}%`;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header with Topic Info and Debug Toggle */}
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
                  <Badge
                    variant={getMessageBadgeVariant(currentSimilarity)}
                    className="text-xs"
                  >
                    {getMessageBadgeText(currentSimilarity)}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                    callState.status === CallStatus.FINISHED ||
                      callState.status === CallStatus.INACTIVE
                      ? "opacity-100"
                      : "opacity-0",
                    callState.status === CallStatus.CONNECTING
                      ? "opacity-100 animate-pulse"
                      : undefined
                  )}
                >
                  <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center">
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

              {/* Enhanced Control Buttons */}
              <div className="w-full space-y-3">
                <Button
                  onClick={callState.status === "ACTIVE" ? endCall : startCall}
                  disabled={callState.status === "CONNECTING"}
                  className={cn(
                    "w-full",
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

        {/* Enhanced Conversation Display */}
        <Card>
          <CardHeader>
            <CardTitle>Live Conversation</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Current Line Display */}
            {currentLine && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Badge
                    variant={
                      currentLine.speaker === "Leo" ? "default" : "secondary"
                    }
                  >
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

                {/* Skip button for development */}
                {showDebug && conversationState.isWaitingForUser && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      skipToStep(conversationState.currentStep + 1)
                    }
                    className="mt-2"
                  >
                    ⏭️ Skip (Debug)
                  </Button>
                )}
              </div>
            )}

            {/* Enhanced Feedback */}
            {conversationState.feedback && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  {conversationState.feedback}
                </p>
              </div>
            )}

            {/* Enhanced Message History */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {messages.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  Start a session to begin the conversation
                </p>
              ) : (
                messages.map((message, index) => (
                  <div
                    key={index}
                    className={cn(
                      "p-3 rounded-lg border",
                      message.role === "assistant"
                        ? "bg-blue-50 border-blue-200"
                        : message.isPartial
                          ? "bg-yellow-50 border-yellow-200"
                          : "bg-green-50 border-green-200"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <Badge
                            variant={
                              message.role === "assistant"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {message.role === "assistant"
                              ? name.split(" ")[0]
                              : userName}
                          </Badge>
                          {message.similarity && (
                            <Badge
                              variant={getMessageBadgeVariant(
                                message.similarity
                              )}
                              className="text-xs"
                            >
                              {getMessageBadgeText(message.similarity)}
                            </Badge>
                          )}
                          {message.isPartial && (
                            <Badge
                              variant="outline"
                              className="text-xs animate-pulse"
                            >
                              Partial
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm">{message.content}</p>

                        {/* Debug Panel */}
                        {showDebug && message.similarity && (
                          <div className="mt-3">
                            <SimilarityDebugPanel
                              similarity={message.similarity}
                              userInput={message.content}
                              expectedText={currentLine?.text || ""}
                            />
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 ml-2">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Development Tools */}
      {showDebug && (
        <Card>
          <CardHeader>
            <CardTitle>Debug Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium">Call Status:</span>
                <p>{callState.status}</p>
              </div>
              <div>
                <span className="font-medium">Current Step:</span>
                <p>
                  {conversationState.currentStep}/{conversationState.totalSteps}
                </p>
              </div>
              <div>
                <span className="font-medium">Waiting for User:</span>
                <p>{conversationState.isWaitingForUser ? "Yes" : "No"}</p>
              </div>
              <div>
                <span className="font-medium">Has Partial Input:</span>
                <p>{hasPartialInput ? "Yes" : "No"}</p>
              </div>
            </div>

            {/* Step Navigator */}
            <div className="mt-4">
              <p className="font-medium mb-2">Step Navigator:</p>
              <div className="grid grid-cols-5 gap-2">
                {steps.map((step, index) => (
                  <Button
                    key={index}
                    variant={
                      index === conversationState.currentStep
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() => skipToStep(index)}
                    disabled={callState.status === "ACTIVE"}
                    className="text-xs"
                  >
                    {index + 1}: {step.speaker}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EnhancedCompanionConversation;
