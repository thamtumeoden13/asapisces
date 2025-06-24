"use client";

import { useEffect, useState, useCallback } from "react";
import { vapi } from "@/lib/vapi.sdk";
import { configureAssistant } from "@/lib/vapi-config";
import type {
  VapiMessage,
  VapiCallState,
  ConversationState,
  TranscriptLine,
} from "../types/podcast";
import { CallStatus } from "../types/podcast";

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
  const [conversationState, setConversationState] = useState<ConversationState>(
    {
      currentStep: 0,
      totalSteps: steps.length,
      isWaitingForUser: false,
    }
  );
  const [messages, setMessages] = useState<
    Array<{ role: "user" | "assistant"; content: string; timestamp: number }>
  >([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const currentStep = conversationState.currentStep;
  const currentLine = steps[currentStep] || null;

  // VAPI Event Handlers
  const handleCallStart = useCallback(() => {
    setCallState({ status: CallStatus.ACTIVE });
    console.log("📞 Call started");
  }, []);

  const handleCallEnd = useCallback(() => {
    setCallState({ status: CallStatus.FINISHED });
    console.log("📞 Call ended");
    // Add to session history here if needed
  }, []);

  const handleMessage = useCallback(
    (message: VapiMessage) => {
      if (message.type === "transcript" && message.transcriptType === "final") {
        const newMessage = {
          role: message.role,
          content: message.transcript,
          timestamp: Date.now(),
        };

        setMessages((prev) => [newMessage, ...prev]);

        // Handle user responses
        if (message.role === "user" && currentLine?.speaker === "Gwen") {
          const userInput = message.transcript.toLowerCase().trim();
          const expectedResponse = currentLine.text.toLowerCase();

          // Simple similarity check
          const similarity = calculateSimilarity(userInput, expectedResponse);

          let feedback = "";
          if (similarity > 0.8) {
            feedback = "✅ Excellent response!";
            setConversationState((prev) => ({
              ...prev,
              currentStep: prev.currentStep + 1,
              isWaitingForUser: false,
              feedback,
            }));
          } else if (similarity > 0.5) {
            feedback = "🟡 Good try! Try to be more specific.";
            setConversationState((prev) => ({ ...prev, feedback }));
          } else {
            feedback = `💡 Try saying something like: "${currentLine.text}"`;
            setConversationState((prev) => ({ ...prev, feedback }));
          }
        }
      }
    },
    [currentLine]
  );

  const handleSpeechStart = useCallback(() => {
    setIsSpeaking(true);
  }, []);

  const handleSpeechEnd = useCallback(() => {
    setIsSpeaking(false);
  }, []);

  const handleError = useCallback((error: Error) => {
    console.error("VAPI Error:", error);
    setCallState({ status: CallStatus.ERROR, error: error.message });
  }, []);

  // Setup VAPI event listeners
  useEffect(() => {
    vapi.on("call-start", handleCallStart);
    vapi.on("call-end", handleCallEnd);
    vapi.on("message", handleMessage);
    vapi.on("speech-start", handleSpeechStart);
    vapi.on("speech-end", handleSpeechEnd);
    vapi.on("error", handleError);

    return () => {
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

  // Auto-advance conversation for Leo's lines
  useEffect(() => {
    if (
      currentLine?.speaker === "Leo" &&
      callState.status === CallStatus.ACTIVE
    ) {
      // Send Leo's message to VAPI
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
          content: currentLine.text,
          timestamp: Date.now(),
        },
        ...prev,
      ]);

      // Move to next step after a delay
      setTimeout(() => {
        setConversationState((prev) => ({
          ...prev,
          currentStep: prev.currentStep + 1,
        }));
      }, 2000);
    } else if (
      currentLine?.speaker === "Gwen" &&
      callState.status === CallStatus.ACTIVE
    ) {
      // Wait for user response
      setConversationState((prev) => ({
        ...prev,
        isWaitingForUser: true,
        feedback: `🎯 Your turn: "${currentLine.text}"`,
      }));
    }
  }, [currentStep, currentLine, callState.status]);

  // Check for conversation completion
  useEffect(() => {
    if (currentStep >= steps.length && steps.length > 0) {
      setConversationState((prev) => ({
        ...prev,
        feedback: "🎉 Conversation completed! Great job!",
      }));
      onSessionComplete?.();
    }
  }, [currentStep, steps.length, onSessionComplete]);

  // Control functions
  const startCall = useCallback(() => {
    setCallState({ status: CallStatus.CONNECTING });

    const assistantOverrides = {
      variableValues: {
        subject,
        topic,
        style,
      },
      clientMessages: ["transcript"] as const,
    };

    vapi.start(configureAssistant(voice, style), assistantOverrides);
  }, [subject, topic, style, voice]);

  const endCall = useCallback(() => {
    vapi.stop();
    setCallState({ status: CallStatus.FINISHED });
  }, []);

  const toggleMute = useCallback(() => {
    const currentMuteState = vapi.isMuted();
    vapi.setMuted(!currentMuteState);
    setIsMuted(!currentMuteState);
  }, []);

  const resetConversation = useCallback(() => {
    setConversationState({
      currentStep: 0,
      totalSteps: steps.length,
      isWaitingForUser: false,
    });
    setMessages([]);
  }, [steps.length]);

  return {
    // State
    callState,
    conversationState,
    messages,
    isSpeaking,
    isMuted,
    currentLine,

    // Actions
    startCall,
    endCall,
    toggleMute,
    resetConversation,
  };
};

// Helper function for similarity calculation
function calculateSimilarity(str1: string, str2: string): number {
  const words1 = str1.split(/\s+/);
  const words2 = str2.split(/\s+/);

  const commonWords = words1.filter((word) =>
    words2.some((w2) => w2.includes(word) || word.includes(w2))
  );

  return commonWords.length / Math.max(words1.length, words2.length);
}
