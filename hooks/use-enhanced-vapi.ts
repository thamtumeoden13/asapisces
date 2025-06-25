"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { vapi } from "../lib/vapi.sdk";
import {
  configurePodcastAssistant,
  configureConversationAssistant,
} from "@/lib/vapi-config";
import {
  type VapiCallState,
  type VapiEventHandlers,
  type TranscriptMessage,
  type CallStatusEnum,
  MessageTypeEnum,
} from "@/types/vapi";
import type { TranscriptLine } from "@/types/podcast";

interface UseEnhancedVapiProps {
  steps: TranscriptLine[];
  topic: string;
  voice: string;
  style: string;
  level?: string;
  mode?: "podcast" | "conversation";
  onStepComplete?: (step: number) => void;
  onConversationComplete?: () => void;
}

interface ConversationState {
  currentStep: number;
  totalSteps: number;
  isWaitingForUser: boolean;
  lastUserInput?: string;
  feedback?: string;
  completedSteps: number[];
}

export const useEnhancedVapi = ({
  steps,
  topic,
  voice,
  style,
  level = "intermediate",
  mode = "podcast",
  onStepComplete,
  onConversationComplete,
}: UseEnhancedVapiProps) => {
  // State management
  const [callState, setCallState] = useState<VapiCallState>({
    status: "inactive" as CallStatusEnum,
  });

  const [conversationState, setConversationState] = useState<ConversationState>(
    {
      currentStep: 0,
      totalSteps: steps.length,
      isWaitingForUser: false,
      completedSteps: [],
    }
  );

  const [messages, setMessages] = useState<
    Array<{
      role: "user" | "assistant";
      content: string;
      timestamp: number;
      stepIndex?: number;
    }>
  >([]);

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs for cleanup
  const eventHandlersRef = useRef<VapiEventHandlers>({});
  const conversationTimeoutRef = useRef<NodeJS.Timeout>();

  // Current step helper
  const currentStep = conversationState.currentStep;
  const currentLine = steps[currentStep] || null;
  const isConversationComplete = currentStep >= steps.length;

  // Event handlers
  const handleCallStart = useCallback(() => {
    console.log("📞 Enhanced VAPI: Call started");
    setCallState((prev) => ({
      ...prev,
      status: "active" as CallStatusEnum,
      startTime: Date.now(),
    }));
    setError(null);
  }, []);

  const handleCallEnd = useCallback(() => {
    console.log("📞 Enhanced VAPI: Call ended");
    setCallState((prev) => ({
      ...prev,
      status: "ended" as CallStatusEnum,
      endTime: Date.now(),
      duration: prev.startTime ? Date.now() - prev.startTime : undefined,
    }));

    // Clear any pending timeouts
    if (conversationTimeoutRef.current) {
      clearTimeout(conversationTimeoutRef.current);
    }
  }, []);

  const handleTranscript = useCallback(
    (message: TranscriptMessage) => {
      if (message.transcriptType === "final") {
        const newMessage = {
          role: message.role,
          content: message.transcript,
          timestamp: Date.now(),
          stepIndex: currentStep,
        };

        setMessages((prev) => [newMessage, ...prev]);

        // Handle user responses in podcast mode
        if (
          mode === "podcast" &&
          message.role === "user" &&
          currentLine?.speaker === "Gwen"
        ) {
          const userInput = message.transcript.toLowerCase().trim();
          const expectedResponse = currentLine.text.toLowerCase();

          // Enhanced similarity checking
          const similarity = calculateAdvancedSimilarity(
            userInput,
            expectedResponse
          );

          let feedback = "";
          let shouldAdvance = false;

          if (similarity > 0.7) {
            feedback = "✅ Perfect! That was exactly right.";
            shouldAdvance = true;
          } else if (similarity > 0.4) {
            feedback = "🟡 Good effort! Try to match the script more closely.";
          } else if (userInput.length > 0) {
            feedback = `💡 Let's try Gwen's line: "${currentLine.text}"`;
          }

          setConversationState((prev) => ({
            ...prev,
            feedback,
            lastUserInput: userInput,
            ...(shouldAdvance && {
              currentStep: prev.currentStep + 1,
              completedSteps: [...prev.completedSteps, prev.currentStep],
              isWaitingForUser: false,
            }),
          }));

          if (shouldAdvance) {
            onStepComplete?.(currentStep);
          }
        }
      }
    },
    [mode, currentLine, currentStep, onStepComplete]
  );

  const handleMessage = useCallback(
    (message: any) => {
      switch (message.type) {
        case MessageTypeEnum.TRANSCRIPT:
          handleTranscript(message as TranscriptMessage);
          break;
        default:
          console.log("📨 Received message:", message);
      }
    },
    [handleTranscript]
  );

  const handleSpeechStart = useCallback(() => {
    setIsSpeaking(true);
  }, []);

  const handleSpeechEnd = useCallback(() => {
    setIsSpeaking(false);
  }, []);

  const handleError = useCallback((error: Error) => {
    console.error("❌ Enhanced VAPI Error:", error);
    setError(error.message);
    setCallState((prev) => ({
      ...prev,
      status: "error" as CallStatusEnum,
      error: error.message,
    }));
  }, []);

  // Setup event listeners
  useEffect(() => {
    const handlers = {
      onCallStart: handleCallStart,
      onCallEnd: handleCallEnd,
      onMessage: handleMessage,
      onSpeechStart: handleSpeechStart,
      onSpeechEnd: handleSpeechEnd,
      onError: handleError,
    };

    eventHandlersRef.current = handlers;

    // Register event listeners
    vapi.on("call-start", handlers.onCallStart);
    vapi.on("call-end", handlers.onCallEnd);
    vapi.on("message", handlers.onMessage);
    vapi.on("speech-start", handlers.onSpeechStart);
    vapi.on("speech-end", handlers.onSpeechEnd);
    vapi.on("error", handlers.onError);

    return () => {
      // Cleanup event listeners
      vapi.off("call-start", handlers.onCallStart);
      vapi.off("call-end", handlers.onCallEnd);
      vapi.off("message", handlers.onMessage);
      vapi.off("speech-start", handlers.onSpeechStart);
      vapi.off("speech-end", handlers.onSpeechEnd);
      vapi.off("error", handlers.onError);
    };
  }, [
    handleCallStart,
    handleCallEnd,
    handleMessage,
    handleSpeechStart,
    handleSpeechEnd,
    handleError,
  ]);

  // Auto-advance for Leo's lines in podcast mode
  useEffect(() => {
    if (
      mode === "podcast" &&
      currentLine?.speaker === "Leo" &&
      callState.status === "active"
    ) {
      // Send Leo's message
      vapi.send({
        type: "add-message",
        message: {
          role: "assistant",
          content: currentLine.text,
        },
      });

      // Add to local messages
      setMessages((prev) => [
        {
          role: "assistant",
          content: `Leo: ${currentLine.text}`,
          timestamp: Date.now(),
          stepIndex: currentStep,
        },
        ...prev,
      ]);

      // Auto-advance after delay
      conversationTimeoutRef.current = setTimeout(() => {
        setConversationState((prev) => ({
          ...prev,
          currentStep: prev.currentStep + 1,
        }));
      }, 3000);
    } else if (
      mode === "podcast" &&
      currentLine?.speaker === "Gwen" &&
      callState.status === "active"
    ) {
      setConversationState((prev) => ({
        ...prev,
        isWaitingForUser: true,
        feedback: `🎯 Your turn to say Gwen's line: "${currentLine.text}"`,
      }));
    }
  }, [currentStep, currentLine, callState.status, mode]);

  // Check for conversation completion
  useEffect(() => {
    if (isConversationComplete && conversationState.totalSteps > 0) {
      setConversationState((prev) => ({
        ...prev,
        feedback: "🎉 Conversation completed! Excellent work!",
      }));
      onConversationComplete?.();
    }
  }, [
    isConversationComplete,
    conversationState.totalSteps,
    onConversationComplete,
  ]);

  // Control functions
  const startCall = useCallback(async () => {
    try {
      setCallState((prev) => ({
        ...prev,
        status: "connecting" as CallStatusEnum,
      }));
      setError(null);

      const assistant =
        mode === "podcast"
          ? configurePodcastAssistant(voice, style, topic, steps)
          : configureConversationAssistant(voice, style, topic, level);

      const assistantOverrides = {
        variableValues: {
          topic,
          level,
          style,
        },
      };

      await vapi.start(assistant, assistantOverrides);
    } catch (error) {
      console.error("Failed to start call:", error);
      setError(error instanceof Error ? error.message : "Failed to start call");
      setCallState((prev) => ({ ...prev, status: "error" as CallStatusEnum }));
    }
  }, [mode, voice, style, topic, steps, level]);

  const endCall = useCallback(() => {
    try {
      vapi.stop();
    } catch (error) {
      console.error("Failed to end call:", error);
    }
  }, []);

  const toggleMute = useCallback(() => {
    try {
      const currentMuteState = vapi.isMuted();
      vapi.setMuted(!currentMuteState);
      setIsMuted(!currentMuteState);
    } catch (error) {
      console.error("Failed to toggle mute:", error);
    }
  }, []);

  const resetConversation = useCallback(() => {
    setConversationState({
      currentStep: 0,
      totalSteps: steps.length,
      isWaitingForUser: false,
      completedSteps: [],
    });
    setMessages([]);
    setError(null);

    if (conversationTimeoutRef.current) {
      clearTimeout(conversationTimeoutRef.current);
    }
  }, [steps.length]);

  const skipToStep = useCallback(
    (stepIndex: number) => {
      if (stepIndex >= 0 && stepIndex < steps.length) {
        setConversationState((prev) => ({
          ...prev,
          currentStep: stepIndex,
          isWaitingForUser: false,
          feedback: undefined,
        }));
      }
    },
    [steps.length]
  );

  return {
    // State
    callState,
    conversationState,
    messages,
    isSpeaking,
    isMuted,
    error,
    currentLine,
    isConversationComplete,

    // Actions
    startCall,
    endCall,
    toggleMute,
    resetConversation,
    skipToStep,

    // Computed values
    progress:
      conversationState.totalSteps > 0
        ? (conversationState.currentStep / conversationState.totalSteps) * 100
        : 0,
    isHealthy: vapi.isHealthy(),
  };
};

// Enhanced similarity calculation
function calculateAdvancedSimilarity(input: string, expected: string): number {
  const normalize = (str: string) =>
    str
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 2); // Filter out short words

  const inputWords = normalize(input);
  const expectedWords = normalize(expected);

  if (inputWords.length === 0 || expectedWords.length === 0) return 0;

  // Calculate word overlap
  const commonWords = inputWords.filter((word) =>
    expectedWords.some(
      (expectedWord) =>
        expectedWord.includes(word) || word.includes(expectedWord)
    )
  );

  // Calculate similarity score
  const overlapScore =
    commonWords.length / Math.max(inputWords.length, expectedWords.length);

  // Bonus for exact matches
  const exactMatches = inputWords.filter((word) =>
    expectedWords.includes(word)
  );
  const exactScore = exactMatches.length / expectedWords.length;

  return Math.max(overlapScore, exactScore);
}
