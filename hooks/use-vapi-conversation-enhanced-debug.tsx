"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { vapi } from "@/lib/vapi.sdk";
import { configureAssistant } from "@/lib/vapi-config";
import {
  calculateAdvancedSimilarity,
  resetSimilarityContext,
} from "@/lib/enhanced-similarity-for-long-sentences";
import { VapiEventAnalyzer } from "@/lib/vapi-event-analyzer";
import type {
  VapiMessage,
  VapiCallState,
  ConversationState,
  TranscriptLine,
} from "@/types/podcast";
import { CallStatus } from "@/types/podcast";

interface UseVapiConversationProps {
  steps: TranscriptLine[];
  companionId: string;
  subject: string;
  topic: string;
  style: string;
  voice: string;
  onSessionComplete?: () => void;
}

export const useVapiConversation = ({
  steps,
  companionId,
  subject,
  topic,
  style,
  voice,
  onSessionComplete,
}: UseVapiConversationProps) => {
  const [callState, setCallState] = useState<VapiCallState>({
    status: CallStatus.INACTIVE,
  });

  const [conversationState, setConversationState] = useState<
    ConversationState & { similarity?: any }
  >({
    currentStep: 0,
    totalSteps: steps.length,
    isWaitingForUser: false,
    similarity: null,
  });

  const [messages, setMessages] = useState<
    Array<{
      role: "user" | "assistant";
      content: string;
      timestamp: number;
      similarity?: any;
      isPartial?: boolean;
    }>
  >([]);

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // ✨ NEW: Event analyzer for debugging
  const eventAnalyzer = useRef(new VapiEventAnalyzer());
  const [debugEvents, setDebugEvents] = useState<any[]>([]);

  // Refs for managing async operations and preventing infinite loops
  const currentStepRef = useRef(conversationState.currentStep);
  const isCallReadyRef = useRef(false);
  const messagesRef = useRef(messages);
  const lastProcessedMessageRef = useRef<string>("");
  const sentMessagesRef = useRef<Set<string>>(new Set());
  const conversationCompletedRef = useRef(false);
  const sessionCompleteCalledRef = useRef(false);
  const currentTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const processingUserInputRef = useRef(false);
  const lastSimilarityResultRef = useRef<any>(null);
  const currentUserSpeechRef = useRef<string>("");
  const speechEndTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const evaluatedMessagesRef = useRef<Set<string>>(new Set());

  // State tracking refs
  const isWaitingForUserRef = useRef(false);
  const currentSpeakerRef = useRef<string>("");
  const callStatusRef = useRef<string>(CallStatus.INACTIVE);

  // Update refs when values change
  useEffect(() => {
    currentStepRef.current = conversationState.currentStep;
    isWaitingForUserRef.current = conversationState.isWaitingForUser;
    callStatusRef.current = callState.status;
  }, [
    conversationState.currentStep,
    conversationState.isWaitingForUser,
    callState.status,
  ]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const currentStep = conversationState.currentStep;
  const currentLine = steps[currentStep] || null;

  // Update current speaker ref
  useEffect(() => {
    currentSpeakerRef.current = currentLine?.speaker || "";
  }, [currentLine?.speaker]);

  // Calculate speaking time based on text length and speaking rate
  const calculateSpeakingTime = useCallback((text: string): number => {
    const words = text.split(/\s+/).length;
    const baseTimePerWord = 400;
    const bufferTime = 2000;
    const minimumTime = 3000;

    const calculatedTime = words * baseTimePerWord + bufferTime;
    return Math.max(calculatedTime, minimumTime);
  }, []);

  // Handle final similarity result and determine next action
  const handleFinalSimilarityResult = useCallback(
    (similarityResult: any, stepIndex: number, messageContent: string) => {
      const evaluationKey = `${stepIndex}-${messageContent.trim()}`;

      if (evaluatedMessagesRef.current.has(evaluationKey)) {
        console.log(
          "🚫 Already evaluated this message for this step, skipping"
        );
        return;
      }

      if (processingUserInputRef.current) {
        console.log("🚫 Already processing similarity result, skipping");
        return;
      }

      evaluatedMessagesRef.current.add(evaluationKey);
      processingUserInputRef.current = true;

      const shouldAdvance = similarityResult.score >= 0.5;

      console.log(
        `📊 Final evaluation for step ${stepIndex}: ${similarityResult.score.toFixed(2)} (${shouldAdvance ? "ADVANCE" : "RETRY"})`
      );

      setConversationState((prev) => ({
        ...prev,
        feedback: similarityResult.feedback,
        similarity: similarityResult,
        ...(shouldAdvance && {
          currentStep: prev.currentStep + 1,
          isWaitingForUser: false,
        }),
      }));

      if (shouldAdvance) {
        resetSimilarityContext(`${companionId}-step-${stepIndex}`);
      }

      setTimeout(() => {
        processingUserInputRef.current = false;
      }, 2000);
    },
    [companionId, steps]
  );

  // ✨ COMPREHENSIVE: Message handler with detailed event analysis
  const handleMessage = useCallback(
    (message: VapiMessage) => {
      // Early guard - only process if call is active
      if (
        !isCallReadyRef.current ||
        callStatusRef.current !== CallStatus.ACTIVE
      ) {
        console.log("🚫 Ignoring message - call not active:", message.type);
        return;
      }

      console.log(
        "📨 Processing VAPI message:",
        message.type,
        message.transcriptType || "",
        `Call: ${callStatusRef.current}`,
        `Waiting: ${isWaitingForUserRef.current}`,
        `Speaker: ${currentSpeakerRef.current}`,
        message.transcript?.substring(0, 50) + "..."
      );

      // ✨ ENHANCED: Handle speech events with comprehensive analysis
      if (message.type === "speech-start") {
        const analysis = eventAnalyzer.current.analyzeEvent(
          "speech-start",
          callStatusRef.current,
          isWaitingForUserRef.current,
          currentSpeakerRef.current,
          currentStepRef.current
        );

        console.log(`🎤 SPEECH-START Analysis:`, analysis.reason);

        // Update debug events
        setDebugEvents((prev) => [
          {
            type: "speech-start",
            timestamp: Date.now(),
            analysis,
            processed: analysis.shouldProcess,
          },
          ...prev.slice(0, 19), // Keep last 20 events
        ]);

        if (analysis.shouldProcess) {
          setIsSpeaking(true);
          currentUserSpeechRef.current = "";
          console.log("✅ Processing speech-start - User input expected");
        } else {
          console.log(`🚫 Ignoring speech-start - ${analysis.reason}`);
        }
        return;
      }

      if (message.type === "speech-end") {
        const analysis = eventAnalyzer.current.analyzeEvent(
          "speech-end",
          callStatusRef.current,
          isWaitingForUserRef.current,
          currentSpeakerRef.current,
          currentStepRef.current
        );

        console.log(`🎤 SPEECH-END Analysis:`, analysis.reason);

        // Update debug events
        setDebugEvents((prev) => [
          {
            type: "speech-end",
            timestamp: Date.now(),
            analysis,
            processed: analysis.shouldProcess,
          },
          ...prev.slice(0, 19),
        ]);

        if (analysis.shouldProcess) {
          setIsSpeaking(false);
          console.log("✅ Processing speech-end - User input completed");

          if (speechEndTimeoutRef.current) {
            clearTimeout(speechEndTimeoutRef.current);
          }

          speechEndTimeoutRef.current = setTimeout(() => {
            if (
              currentUserSpeechRef.current &&
              currentLine?.speaker === "Gwen"
            ) {
              console.log(
                "⏰ Processing final speech after speech-end:",
                currentUserSpeechRef.current
              );
            }
          }, 500);
        } else {
          console.log(`🚫 Ignoring speech-end - ${analysis.reason}`);
        }
        return;
      }

      // Process transcripts with comprehensive guards
      if (message.type === "transcript" && message.transcriptType === "final") {
        const messageContent = message.transcript.trim();

        if (!messageContent) {
          console.log("🚫 Empty transcript, skipping");
          return;
        }

        // Enhanced guards for user messages
        if (message.role === "user") {
          if (!isWaitingForUserRef.current) {
            console.log(
              "🚫 Ignoring user transcript - not waiting for user:",
              messageContent
            );
            return;
          }

          if (currentSpeakerRef.current !== "Gwen") {
            console.log(
              "🚫 Ignoring user transcript - current step is not Gwen's:",
              messageContent
            );
            return;
          }

          console.log("👤 Processing VALID user transcript:", messageContent);
        }

        // Enhanced guards for assistant messages
        if (message.role === "assistant") {
          if (isWaitingForUserRef.current) {
            console.log(
              "🚫 Ignoring assistant message while waiting for user:",
              messageContent
            );
            return;
          }

          const isOurMessage = sentMessagesRef.current.has(messageContent);
          if (isOurMessage) {
            console.log(
              "🎯 This is our sent message, already displayed, skipping:",
              messageContent
            );
            return;
          }
        }

        // Check for recent duplicates
        const isDuplicate = messagesRef.current.some(
          (msg) =>
            msg.content.trim() === messageContent &&
            msg.role === message.role &&
            Date.now() - msg.timestamp < 3000
        );

        if (isDuplicate) {
          console.log(
            "🚫 Duplicate message detected, skipping:",
            messageContent
          );
          return;
        }

        const newMessage = {
          role: message.role,
          content: messageContent,
          timestamp: Date.now(),
        };

        // Process user responses
        if (message.role === "user" && currentLine?.speaker === "Gwen") {
          currentUserSpeechRef.current = messageContent;
          const evaluationKey = `${currentStepRef.current}-${messageContent}`;

          if (evaluatedMessagesRef.current.has(evaluationKey)) {
            console.log("🚫 Already evaluated this exact message, skipping");
            return;
          }

          if (processingUserInputRef.current) {
            console.log("🚫 Currently processing another input, skipping");
            return;
          }

          const contextId = `${companionId}-step-${currentStepRef.current}`;

          const similarityResult = calculateAdvancedSimilarity(
            messageContent,
            currentLine.text,
            contextId,
            {
              allowPartial: false,
              semanticMatching: true,
              strictMode: false,
            }
          );

          const enhancedMessage = {
            ...newMessage,
            similarity: similarityResult,
            isPartial: false,
          };

          setMessages((prev) => [enhancedMessage, ...prev]);
          handleFinalSimilarityResult(
            similarityResult,
            currentStepRef.current,
            messageContent
          );
        }

        lastProcessedMessageRef.current = `${message.role}-${messageContent}-${Date.now()}`;
      }

      // Handle partial transcripts with guards
      if (
        message.type === "transcript" &&
        message.transcriptType === "partial"
      ) {
        if (
          isWaitingForUserRef.current &&
          message.role === "user" &&
          currentSpeakerRef.current === "Gwen"
        ) {
          console.log(
            "⏸️ User speaking (partial):",
            message.transcript?.substring(0, 30) + "..."
          );
        }
        return;
      }
    },
    [currentLine, companionId, handleFinalSimilarityResult]
  );

  // Function to send Leo's message
  const sendLeoMessage = useCallback(
    (line: TranscriptLine, stepIndex: number) => {
      console.log(
        `🎤 Sending Leo's message immediately (step ${stepIndex}):`,
        line.text
      );

      const speakingTime = calculateSpeakingTime(line.text);
      sentMessagesRef.current.add(line.text.trim());

      const immediateMessage = {
        role: "assistant" as const,
        content: line.text,
        timestamp: Date.now(),
      };

      setMessages((prev) => [immediateMessage, ...prev]);

      try {
        vapi.send({
          type: "add-message",
          message: {
            role: "assistant",
            content: line.text,
          },
        });

        setTimeout(() => {
          try {
            vapi.send({
              type: "say",
              message: line.text,
            });
          } catch (error) {
            console.log("ℹ️ Say command not available:", error);
          }
        }, 100);
      } catch (error) {
        console.error("❌ Failed to send Leo's message to VAPI:", error);
      }

      return speakingTime;
    },
    [calculateSpeakingTime]
  );

  // ✨ COMPREHENSIVE: Speech event handlers with detailed analysis
  const handleSpeechStart = useCallback(() => {
    const analysis = eventAnalyzer.current.analyzeEvent(
      "speech-start",
      callStatusRef.current,
      isWaitingForUserRef.current,
      currentSpeakerRef.current,
      currentStepRef.current
    );

    console.log(`🎤 DIRECT SPEECH-START Handler:`, analysis.reason);

    // Update debug events
    setDebugEvents((prev) => [
      {
        type: "speech-start-direct",
        timestamp: Date.now(),
        analysis,
        processed: analysis.shouldProcess,
      },
      ...prev.slice(0, 19),
    ]);

    if (analysis.shouldProcess) {
      console.log("✅ Direct speech-start - User input expected");
      setIsSpeaking(true);
    } else {
      console.log(`🚫 Ignoring direct speech-start - ${analysis.reason}`);
    }
  }, []);

  const handleSpeechEnd = useCallback(() => {
    const analysis = eventAnalyzer.current.analyzeEvent(
      "speech-end",
      callStatusRef.current,
      isWaitingForUserRef.current,
      currentSpeakerRef.current,
      currentStepRef.current
    );

    console.log(`🎤 DIRECT SPEECH-END Handler:`, analysis.reason);

    // Update debug events
    setDebugEvents((prev) => [
      {
        type: "speech-end-direct",
        timestamp: Date.now(),
        analysis,
        processed: analysis.shouldProcess,
      },
      ...prev.slice(0, 19),
    ]);

    if (analysis.shouldProcess) {
      console.log("✅ Direct speech-end - Processing user input");
      setIsSpeaking(false);
    } else {
      console.log(`🚫 Ignoring direct speech-end - ${analysis.reason}`);
    }
  }, []);

  // VAPI Event Handlers
  const handleCallStart = useCallback(() => {
    console.log("📞 Call started - Setting up conversation");
    setCallState({ status: CallStatus.ACTIVE });
    isCallReadyRef.current = true;
    callStatusRef.current = CallStatus.ACTIVE;
    conversationCompletedRef.current = false;
    sessionCompleteCalledRef.current = false;
    processingUserInputRef.current = false;
    lastSimilarityResultRef.current = null;
    currentUserSpeechRef.current = "";
    evaluatedMessagesRef.current.clear();

    // Clear debug events
    eventAnalyzer.current.clearHistory();
    setDebugEvents([]);

    if (steps[0]?.speaker === "Leo") {
      setTimeout(() => {
        const speakingTime = sendLeoMessage(steps[0], 0);
        currentTimeoutRef.current = setTimeout(() => {
          setConversationState((prev) => ({
            ...prev,
            currentStep: 1,
          }));
        }, speakingTime);
      }, 1000);
    }
  }, [steps, sendLeoMessage]);

  const handleCallEnd = useCallback(() => {
    setCallState({ status: CallStatus.FINISHED });
    isCallReadyRef.current = false;
    callStatusRef.current = CallStatus.FINISHED;
    console.log("📞 Call ended");

    if (currentTimeoutRef.current) {
      clearTimeout(currentTimeoutRef.current);
      currentTimeoutRef.current = null;
    }

    if (speechEndTimeoutRef.current) {
      clearTimeout(speechEndTimeoutRef.current);
      speechEndTimeoutRef.current = null;
    }

    processingUserInputRef.current = false;
    lastSimilarityResultRef.current = null;
    currentUserSpeechRef.current = "";
    evaluatedMessagesRef.current.clear();

    for (let i = 0; i < steps.length; i++) {
      resetSimilarityContext(`${companionId}-step-${i}`);
    }
  }, [steps.length, companionId]);

  const handleError = useCallback((error: Error) => {
    console.error("❌ VAPI Error:", error);
    setCallState({ status: CallStatus.ERROR, error: error.message });
    callStatusRef.current = CallStatus.ERROR;
  }, []);

  // Setup VAPI event listeners
  useEffect(() => {
    console.log("🔧 Setting up VAPI event listeners");

    vapi.on("call-start", handleCallStart);
    vapi.on("call-end", handleCallEnd);
    vapi.on("message", handleMessage);
    vapi.on("speech-start", handleSpeechStart);
    vapi.on("speech-end", handleSpeechEnd);
    vapi.on("error", handleError);

    return () => {
      console.log("🧹 Cleaning up VAPI event listeners");
      vapi.off("call-start", handleCallStart);
      vapi.off("call-end", handleCallEnd);
      vapi.off("message", handleMessage);
      vapi.off("speech-start", handleSpeechStart);
      vapi.off("speech-end", handleSpeechEnd);
      vapi.off("error", handleError);
    };
  }, [
    handleCallStart,
    handleCallEnd,
    handleMessage,
    handleSpeechStart,
    handleSpeechEnd,
    handleError,
  ]);

  // Auto-advance conversation with better state management
  useEffect(() => {
    if (
      currentStep === 0 ||
      !isCallReadyRef.current ||
      conversationCompletedRef.current
    )
      return;

    if (currentTimeoutRef.current) {
      clearTimeout(currentTimeoutRef.current);
      currentTimeoutRef.current = null;
    }

    if (
      currentLine?.speaker === "Leo" &&
      callState.status === CallStatus.ACTIVE
    ) {
      console.log(`🗣️ Leo speaking (step ${currentStep}):`, currentLine.text);

      const speakingTime = sendLeoMessage(currentLine, currentStep);

      currentTimeoutRef.current = setTimeout(() => {
        if (!conversationCompletedRef.current) {
          setConversationState((prev) => ({
            ...prev,
            currentStep: prev.currentStep + 1,
          }));
        }
      }, speakingTime);
    } else if (
      currentLine?.speaker === "Gwen" &&
      callState.status === CallStatus.ACTIVE
    ) {
      console.log(
        `👤 Waiting for user (step ${currentStep}):`,
        currentLine.text
      );

      setIsSpeaking(false);
      processingUserInputRef.current = false;
      lastSimilarityResultRef.current = null;
      currentUserSpeechRef.current = "";

      setConversationState((prev) => ({
        ...prev,
        isWaitingForUser: true,
        feedback: `🎯 Your turn: "${currentLine.text}"`,
      }));

      setTimeout(() => {
        console.log("✅ Ready for user input - State updated");
      }, 100);
    }
  }, [currentStep, currentLine, callState.status, sendLeoMessage]);

  // Check for conversation completion
  useEffect(() => {
    if (
      currentStep >= steps.length &&
      steps.length > 0 &&
      !conversationCompletedRef.current &&
      !sessionCompleteCalledRef.current
    ) {
      console.log("🎉 Conversation completed!");
      conversationCompletedRef.current = true;
      sessionCompleteCalledRef.current = true;

      if (currentTimeoutRef.current) {
        clearTimeout(currentTimeoutRef.current);
        currentTimeoutRef.current = null;
      }

      if (speechEndTimeoutRef.current) {
        clearTimeout(speechEndTimeoutRef.current);
        speechEndTimeoutRef.current = null;
      }

      processingUserInputRef.current = false;
      lastSimilarityResultRef.current = null;
      currentUserSpeechRef.current = "";
      evaluatedMessagesRef.current.clear();

      setConversationState((prev) => ({
        ...prev,
        feedback: "🎉 Conversation completed! Great job!",
      }));

      if (onSessionComplete) {
        setTimeout(() => {
          onSessionComplete();
        }, 100);
      }
    }
  }, [currentStep, steps.length, onSessionComplete]);

  // Control functions
  const startCall = useCallback(() => {
    console.log("🚀 Starting VAPI call...");
    setCallState({ status: CallStatus.CONNECTING });
    callStatusRef.current = CallStatus.CONNECTING;

    const assistantConfig = configureAssistant(voice, style);
    const assistantOverrides = {
      variableValues: { subject, topic, style },
      clientMessages: ["transcript"] as const,
    };

    try {
      vapi.start(assistantConfig, assistantOverrides);
    } catch (error) {
      console.error("❌ Failed to start VAPI:", error);
      setCallState({ status: CallStatus.ERROR, error: error.message });
      callStatusRef.current = CallStatus.ERROR;
    }
  }, [subject, topic, style, voice]);

  const endCall = useCallback(() => {
    console.log("🛑 Ending call...");

    if (currentTimeoutRef.current) {
      clearTimeout(currentTimeoutRef.current);
      currentTimeoutRef.current = null;
    }

    if (speechEndTimeoutRef.current) {
      clearTimeout(speechEndTimeoutRef.current);
      speechEndTimeoutRef.current = null;
    }

    processingUserInputRef.current = false;
    lastSimilarityResultRef.current = null;
    currentUserSpeechRef.current = "";
    evaluatedMessagesRef.current.clear();

    vapi.stop();
    setCallState({ status: CallStatus.FINISHED });
    callStatusRef.current = CallStatus.FINISHED;
  }, []);

  const toggleMute = useCallback(() => {
    const currentMuteState = vapi.isMuted();
    vapi.setMuted(!currentMuteState);
    setIsMuted(!currentMuteState);
  }, []);

  const resetConversation = useCallback(() => {
    console.log("🔄 Resetting conversation...");

    if (currentTimeoutRef.current) {
      clearTimeout(currentTimeoutRef.current);
      currentTimeoutRef.current = null;
    }

    if (speechEndTimeoutRef.current) {
      clearTimeout(speechEndTimeoutRef.current);
      speechEndTimeoutRef.current = null;
    }

    for (let i = 0; i < steps.length; i++) {
      resetSimilarityContext(`${companionId}-step-${i}`);
    }

    lastProcessedMessageRef.current = "";
    sentMessagesRef.current.clear();
    conversationCompletedRef.current = false;
    sessionCompleteCalledRef.current = false;
    processingUserInputRef.current = false;
    lastSimilarityResultRef.current = null;
    currentUserSpeechRef.current = "";
    evaluatedMessagesRef.current.clear();

    // Clear debug events
    eventAnalyzer.current.clearHistory();
    setDebugEvents([]);

    setConversationState({
      currentStep: 0,
      totalSteps: steps.length,
      isWaitingForUser: false,
      similarity: null,
    });
    setMessages([]);
    isCallReadyRef.current = false;
    callStatusRef.current = CallStatus.INACTIVE;
  }, [steps.length, companionId]);

  const skipToStep = useCallback(
    (stepIndex: number) => {
      if (stepIndex >= 0 && stepIndex < steps.length) {
        console.log(`⏭️ Skipping to step ${stepIndex}`);

        if (currentTimeoutRef.current) {
          clearTimeout(currentTimeoutRef.current);
          currentTimeoutRef.current = null;
        }

        if (speechEndTimeoutRef.current) {
          clearTimeout(speechEndTimeoutRef.current);
          speechEndTimeoutRef.current = null;
        }

        processingUserInputRef.current = false;
        lastSimilarityResultRef.current = null;
        currentUserSpeechRef.current = "";
        evaluatedMessagesRef.current.clear();

        resetSimilarityContext(
          `${companionId}-step-${conversationState.currentStep}`
        );

        setConversationState((prev) => ({
          ...prev,
          currentStep: stepIndex,
          isWaitingForUser: false,
          feedback: undefined,
          similarity: null,
        }));
      }
    },
    [steps.length, companionId, conversationState.currentStep]
  );

  const retryCurrentStep = useCallback(() => {
    console.log(`🔄 Retrying step ${conversationState.currentStep}`);

    if (currentTimeoutRef.current) {
      clearTimeout(currentTimeoutRef.current);
      currentTimeoutRef.current = null;
    }

    if (speechEndTimeoutRef.current) {
      clearTimeout(speechEndTimeoutRef.current);
      speechEndTimeoutRef.current = null;
    }

    processingUserInputRef.current = false;
    lastSimilarityResultRef.current = null;
    currentUserSpeechRef.current = "";
    evaluatedMessagesRef.current.clear();

    resetSimilarityContext(
      `${companionId}-step-${conversationState.currentStep}`
    );

    setConversationState((prev) => ({
      ...prev,
      isWaitingForUser: true,
      feedback: currentLine
        ? `🎯 Let's try again: "${currentLine.text}"`
        : "Ready to continue!",
      similarity: null,
    }));
  }, [companionId, conversationState.currentStep, currentLine]);

  const manualTriggerLeo = useCallback(() => {
    if (currentLine?.speaker === "Leo") {
      sendLeoMessage(currentLine, currentStep);
    }
  }, [currentLine, currentStep, sendLeoMessage]);

  return {
    // State
    callState,
    conversationState,
    messages,
    isSpeaking,
    isMuted,
    currentLine,

    // ✨ NEW: Debug data
    debugEvents,

    // Actions
    startCall,
    endCall,
    toggleMute,
    resetConversation,
    skipToStep,
    retryCurrentStep,
    manualTriggerLeo,

    // Computed values
    progress:
      conversationState.totalSteps > 0
        ? (currentStep / conversationState.totalSteps) * 100
        : 0,
    hasPartialInput: messages.some((msg) => msg.isPartial),
    currentSimilarity: conversationState.similarity,
  };
};
