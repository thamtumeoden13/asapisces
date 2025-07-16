// File: hooks/use-conversation-final.ts (FINAL, SIMPLIFIED VERSION)
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  createClient,
  LiveClient,
  LiveTranscriptionEvents,
} from "@deepgram/sdk";
import {
  calculateAdvancedSimilarity,
  resetSimilarityContext,
} from "@/lib/enhanced-similarity-for-long-sentences";
import type {
  VapiCallState,
  ConversationState,
  TranscriptLine,
} from "@/types/podcast";
import { CallStatus } from "@/types/podcast";

interface UseConversationProps {
  steps: TranscriptLine[];
  onSessionComplete?: () => void;
}

export const useConversation = ({
  steps,
  onSessionComplete,
}: UseConversationProps) => {
  // --- STATE ---
  const [callState, setCallState] = useState<VapiCallState>({
    status: CallStatus.INACTIVE,
  });
  const [conversationState, setConversationState] = useState({
    currentStep: 0,
    isWaitingForUser: false,
    retryCounter: 0, // Dùng để trigger useEffect khi retry
  });
  const [messages, setMessages] = useState<
    Array<{
      role: string;
      content: string;
      timestamp: number;
      similarity?: any;
    }>
  >([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [partialTranscript, setPartialTranscript] = useState<string>("");

  // --- REFS ---
  const deepgramClientRef = useRef<LiveClient | null>(null);
  const microphoneRef = useRef<{
    stream: MediaStream;
    recorder: MediaRecorder;
  } | null>(null);

  const currentStepRef = useRef(0);
  const isWaitingForUserRef = useRef(false);
  const isAwaitingAIRef = useRef(false);
  const messagesRef = useRef(messages);
  const conversationCompletedRef = useRef(false);
  const processingUserInputRef = useRef(false);
  const sessionCompleteCalledRef = useRef(false);
  const accumulatedTranscriptRef = useRef<string>("");
  const finalTranscriptGracePeriodRef = useRef<NodeJS.Timeout | null>(null);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const evaluatedMessagesRef = useRef<Set<string>>(new Set());
  const gwenTurnStartTimeRef = useRef<number>(0);
  const turnTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cập nhật ref khi state messages thay đổi
  useEffect(() => {
    currentStepRef.current = conversationState.currentStep;
  }, [conversationState.currentStep]);
  useEffect(() => {
    isWaitingForUserRef.current = conversationState.isWaitingForUser;
  }, [conversationState.isWaitingForUser]);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // --- LOGIC HIỂN THỊ ---
  const currentLine: TranscriptLine | null =
    steps[conversationState.currentStep] || null;

  // --- HÀM TIỆN ÍCH ---
  const speakAI = useCallback((text: string) => {
    return new Promise<void>((resolve, reject) => {
      if (!text || typeof window === "undefined" || !window.speechSynthesis)
        return resolve();
      setIsSpeaking(true);
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.onend = () => {
        setIsSpeaking(false);
        resolve();
      };
      utterance.onerror = (e) => {
        setIsSpeaking(false);
        reject(e);
      };
      window.speechSynthesis.speak(utterance);
    });
  }, []);

  const generateRetryMessage = useCallback((originalText: string) => {
    return `Let's try that again. Please say: "${originalText}"`;
  }, []);

  // --- HÀM XỬ LÝ CHÍNH ---

  // TẠO MỘT HÀM MỚI ĐỂ XỬ LÝ SAU KHI ĐÃ CÓ BẢN GHI HOÀN CHỈNH

  const handleUserSpeech = useCallback(
    async (transcript: string) => {
      // 1. Hàm nội bộ để xử lý sau khi đã có bản ghi cuối cùng
      const process = async (finalTranscript: string) => {
        if (processingUserInputRef.current) return;
        processingUserInputRef.current = true;

        // Dọn dẹp bộ đệm ngay lập tức để không bị ảnh hưởng bởi các lần gọi sau
        accumulatedTranscriptRef.current = "";
        if (finalTranscriptGracePeriodRef.current)
          clearTimeout(finalTranscriptGracePeriodRef.current);

        const stepIndex = currentStepRef.current;
        const expectedLine = steps[stepIndex];

        // Tính toán độ tương đồng
        const similarityResult = calculateAdvancedSimilarity(
          finalTranscript,
          expectedLine.text,
          `step-${stepIndex}`
        );
        setMessages((prev) => [
          {
            role: "user",
            content: finalTranscript,
            timestamp: Date.now(),
            similarity: similarityResult,
          },
          ...prev,
        ]);
        setPartialTranscript("");

        const shouldAdvance = similarityResult.score >= 0.6;
        isAwaitingAIRef.current = true; // Khóa input cho lượt nói tiếp theo của AI

        if (shouldAdvance) {
          console.log(`✅ Good score on step ${stepIndex}. Advancing.`);
          setConversationState((prev) => ({
            ...prev,
            similarity: similarityResult,
            currentStep: prev.currentStep + 1,
            isWaitingForUser: false,
          }));
        } else {
          console.log(`🔄 Low score on step ${stepIndex}. Retrying.`);
          const retryMsg = generateRetryMessage(expectedLine.text);
          setMessages((prev) => [
            { role: "assistant", content: retryMsg, timestamp: Date.now() },
            ...prev,
          ]);

          await speakAI(retryMsg); // Chờ AI nói xong

          resetSimilarityContext(`step-${stepIndex}`);
          // Trigger useEffect để chuẩn bị lại lượt của Gwen
          setConversationState((prev) => ({
            ...prev,
            similarity: similarityResult,
            isWaitingForUser: true,
            retryCounter: prev.retryCounter + 1,
          }));
        }

        processingUserInputRef.current = false;
      };

      // 2. Logic chính của handleUserSpeech: quyết định có gom câu hay không
      const messageContent = transcript.trim();
      if (!messageContent) return;

      const stepIndex = currentStepRef.current;
      const expectedLine = steps[stepIndex];
      if (!expectedLine || expectedLine.speaker !== "Gwen") return;

      const isLongSentence = expectedLine.text.split(/\s+/).length > 15;

      if (isLongSentence) {
        // Gom các mảnh của câu dài
        accumulatedTranscriptRef.current = (
          accumulatedTranscriptRef.current +
          " " +
          messageContent
        ).trim();
        setPartialTranscript(accumulatedTranscriptRef.current);

        if (finalTranscriptGracePeriodRef.current)
          clearTimeout(finalTranscriptGracePeriodRef.current);

        finalTranscriptGracePeriodRef.current = setTimeout(() => {
          const fullTranscript = accumulatedTranscriptRef.current.trim();
          if (fullTranscript) {
            process(fullTranscript); // Gọi hàm nội bộ để xử lý
          }
          accumulatedTranscriptRef.current = "";
        }, 1500); // Thời gian chờ 1.5 giây
      } else {
        // Xử lý ngay lập tức với câu ngắn
        process(messageContent); // Gọi hàm nội bộ để xử lý
      }
      return () => {
        if (finalTranscriptGracePeriodRef.current) {
          clearTimeout(finalTranscriptGracePeriodRef.current);
          finalTranscriptGracePeriodRef.current = null;
        }
      };
    },
    [steps, generateRetryMessage, speakAI]
  );

  const endCall = useCallback(() => {
    if (callState.status === CallStatus.FINISHED) return;
    setCallState({ status: CallStatus.FINISHED });

    deepgramClientRef.current?.requestClose();
    deepgramClientRef.current = null;

    if (microphoneRef.current) {
      if (microphoneRef.current.recorder?.state === "recording")
        microphoneRef.current.recorder.stop();
      microphoneRef.current.stream.getTracks().forEach((track) => track.stop());
      microphoneRef.current = null;
    }
    window.speechSynthesis?.cancel();
    conversationCompletedRef.current = true;
  }, [callState.status]);

  const resetConversation = useCallback(() => {
    endCall();
    setConversationState({
      currentStep: 0,
      isWaitingForUser: false,
      retryCounter: 0,
    });
    setMessages([]);
    setPartialTranscript("");
    conversationCompletedRef.current = false;
    if (finalTranscriptGracePeriodRef.current) {
      clearTimeout(finalTranscriptGracePeriodRef.current);
    }
    if (finalTranscriptGracePeriodRef.current) {
      clearTimeout(finalTranscriptGracePeriodRef.current);
    }
  }, [endCall]);

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    inactivityTimerRef.current = setTimeout(() => endCall(), 90000);
  }, [endCall]);

  const startCall = useCallback(async () => {
    resetConversation();
    setCallState({ status: CallStatus.CONNECTING });
    try {
      const response = await fetch("/api/deepgram");
      const data = await response.json();
      if (!data.deepgramToken) throw new Error("Failed to get Deepgram token.");

      const client = createClient(data.deepgramToken).listen.live({
        model: "nova-2",
        language: "en-US",
        interim_results: true,
        keepalive: "true",
      });
      deepgramClientRef.current = client;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      microphoneRef.current = { stream, recorder };

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0 && client.getReadyState() === 1)
          client.send(e.data);
      };

      client.on(LiveTranscriptionEvents.Open, () => {
        console.log("✅ Deepgram connection established. Recorder will start.");
        recorder.start(250);
        setCallState({ status: CallStatus.ACTIVE });
      });

      client.on(LiveTranscriptionEvents.Transcript, (data) => {
        const transcript = data.channel.alternatives[0].transcript;
        console.log(
          "Transcript received:",
          transcript,
          isAwaitingAIRef.current,
          isWaitingForUserRef.current
        );

        if (
          !transcript ||
          isAwaitingAIRef.current ||
          !isWaitingForUserRef.current
        )
          return;
        resetInactivityTimer();
        console.log("Processing user input:", processingUserInputRef.current);
        if (data.is_final && !processingUserInputRef.current) {
          handleUserSpeech(transcript);
        } else {
          setPartialTranscript(transcript);
        }
      });

      client.on(LiveTranscriptionEvents.Error, (e) => {
        console.error(e);
        endCall();
      });
      client.on(LiveTranscriptionEvents.Close, () => endCall());
    } catch (error) {
      setCallState({
        status: CallStatus.ERROR,
        error: (error as Error).message,
      });
    }
  }, [endCall, handleUserSpeech, resetConversation, resetInactivityTimer]);

  // Các hàm điều khiển phụ

  const toggleMute = useCallback(() => {
    if (!microphoneRef.current) return;
    const audioTracks = microphoneRef.current.stream.getAudioTracks();
    if (audioTracks.length > 0) {
      const isCurrentlyMuted = !audioTracks[0].enabled;
      audioTracks[0].enabled = isCurrentlyMuted;
      setIsMuted(!isCurrentlyMuted);
    }
  }, []);

  const skipToStep = useCallback(
    (stepIndex: number) => {
      if (stepIndex >= 0 && stepIndex < steps.length) {
        setConversationState((prev) => ({
          ...prev,
          currentStep: stepIndex,
          isWaitingForUser: false,
          similarity: null,
        }));
        processingUserInputRef.current = false;
      }
    },
    [steps.length]
  );

  const retryCurrentStep = useCallback(() => {
    setConversationState((prev) => ({
      ...prev,
      isWaitingForUser: true,
      retryCounter: (prev.retryCounter || 0) + 1,
      feedback: `🎯 Let's try again: "${currentLine.text}"`,
    }));
  }, [currentLine]);

  const manualTriggerLeo = useCallback(() => {
    if (currentLine?.speaker === "Leo") speakAI(currentLine.text);
  }, [currentLine, speakAI]);

  // --- useEffect TRUNG TÂM ---
  useEffect(() => {
    if (callState.status !== "ACTIVE" || conversationCompletedRef.current)
      return;

    let isCancelled = false;
    let keepAliveInterval: NodeJS.Timeout | null = null;

    const processTurn = async () => {
      if (isCancelled) return;
      const line = steps[conversationState.currentStep];
      if (!line) {
        onSessionComplete?.();
        endCall();
        return;
      }

      if (line.speaker === "Leo") {
        if (messagesRef.current.some((msg) => msg.content === line.text))
          return;

        // --- LOGIC MỚI ---
        isAwaitingAIRef.current = true; // 1. Khóa input
        const client = deepgramClientRef.current;
        if (client)
          keepAliveInterval = setInterval(() => client.keepAlive(), 10000); // 2. Bật KeepAlive

        setMessages((prev) => [
          { role: "assistant", content: line.text, timestamp: Date.now() },
          ...prev,
        ]);
        await speakAI(line.text);

        if (keepAliveInterval) clearInterval(keepAliveInterval); // 3. Tắt KeepAlive
        // KHÔNG mở khóa input ở đây, để cho lượt của Gwen xử lý

        if (!isCancelled) {
          setConversationState((prev) => ({
            ...prev,
            currentStep: prev.currentStep + 1,
          }));
        }
      } else if (line.speaker === "Gwen") {
        // Chỉ cần hạ cờ và đặt trạng thái chờ
        isAwaitingAIRef.current = false;
        resetInactivityTimer();
        if (!conversationState.isWaitingForUser) {
          setConversationState((prev) => ({ ...prev, isWaitingForUser: true }));
        }
      }
    };

    const timeoutId = setTimeout(processTurn, 100);
    return () => {
      isCancelled = true;
      clearTimeout(timeoutId);
      if (keepAliveInterval) clearInterval(keepAliveInterval);
    };
  }, [
    conversationState.currentStep,
    conversationState.retryCounter,
    callState.status,
  ]);

  return {
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
    manualTriggerLeo,
  };
};
