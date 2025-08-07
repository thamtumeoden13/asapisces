// File: hooks/use-conversation-final.ts (FINAL, SIMPLIFIED VERSION)
"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
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
import { TimingSettings } from "@/types";
import { Message } from "postcss";
import { recordSessionStartAction } from "@/lib/actions/session.action";

type TTSProvider = "webspeech" | "elevenlabs";

interface UseConversationProps {
  voiceId?: string; // ID của giọng nói AI từ ElevenLabs,
  companionId?: string; // ID của companion, nếu có
  // Các bước của cuộc trò chuyện, mỗi bước là một đối tượng TranscriptLine
  steps: TranscriptLine[];
  onSessionComplete?: () => void;
  ttsProvider: TTSProvider;
  timingSettings?: Partial<TimingSettings>;
}

const LONG_SENTENCE_WORD_THRESHOLD = 8; // <-- GIẢM từ 15 xuống 8 từ
const LONG_SENTENCE_GRACE_PERIOD_MS_BONUS = 2000; // Thêm 2 giây cho câu dài

export const useConversation = ({
  steps,
  voiceId,
  companionId,
  ttsProvider,
  timingSettings = {},
  onSessionComplete,
}: UseConversationProps) => {
  // --- STATE ---
  const [callState, setCallState] = useState<VapiCallState>({
    status: CallStatus.INACTIVE,
  });
  const [conversationState, setConversationState] = useState<
    ConversationState & { similarity?: unknown; retryCounter?: number }
  >({
    currentStep: 0,
    totalSteps: steps.length,
    isWaitingForUser: false,
    similarity: null,
    retryCounter: 0,
  });

  const [messages, setMessages] = useState<Message[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [partialTranscript, setPartialTranscript] = useState<string>("");

  // --- REFS ---
  const deepgramClientRef = useRef<LiveClient | null>(null);
  const microphoneRef = useRef<{
    stream: MediaStream;
    recorder: MediaRecorder;
  } | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const currentStepRef = useRef(0);
  const isWaitingForUserRef = useRef(false);
  const isAwaitingAIRef = useRef(false);
  const messagesRef = useRef(messages);
  const conversationCompletedRef = useRef(false);
  const processingUserInputRef = useRef(false);
  const accumulatedTranscriptRef = useRef<string>("");
  const finalTranscriptGracePeriodRef = useRef<NodeJS.Timeout | null>(null);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
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

  const resolvedTimingSettings = useMemo(
    () => ({
      stepTransitionDelay: 1000,
      responseWaitTime: 2500, // Grace period mặc định
      speechTimeout: 90000, // Inactivity timeout mặc định (90 giây)
      ...timingSettings,
    }),
    [timingSettings]
  );

  // --- HÀM TIỆN ÍCH ---
  const speakAIByWebSpeechAPI = useCallback((text: string) => {
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

  // 1. Hàm phát giọng nói của AI qua ElevenLabs
  const speakAIByElevenLabs = useCallback(
    async (text: string) => {
      if (!voiceId) {
        console.error("ElevenLabs voiceId is required but was not provided.");
        return;
      }
      return new Promise<void>(async (resolve, reject) => {
        if (!text) return resolve();
        setIsSpeaking(true);
        try {
          const response = await fetch("/api/tts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text, voiceId }),
          });
          if (!response.ok || !response.body)
            throw new Error("API call to /api/tts failed");

          const audioBlob = await response.blob();
          const audioUrl = URL.createObjectURL(audioBlob);

          if (!audioPlayerRef.current) audioPlayerRef.current = new Audio();

          const player = audioPlayerRef.current;
          player.src = audioUrl;
          player.onended = () => {
            setIsSpeaking(false);
            URL.revokeObjectURL(audioUrl);
            resolve();
          };
          player.onerror = (e) => {
            setIsSpeaking(false);
            URL.revokeObjectURL(audioUrl);
            reject(e);
          };
          await player.play();
        } catch (error) {
          setIsSpeaking(false);
          console.error("ElevenLabs Speak AI error:", error);
          reject(error);
        }
      });
    },
    [voiceId]
  );

  const speakAI = useCallback(
    (text: string) => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      
      if (ttsProvider === "elevenlabs") {
        return speakAIByElevenLabs(text);
      }
      // Mặc định hoặc khi ttsProvider là 'webspeech'
      return speakAIByWebSpeechAPI(text);
    },
    [ttsProvider, speakAIByElevenLabs, speakAIByWebSpeechAPI]
  );

  const generateRetryMessage = useCallback(
    (originalText: string, score: number, partialText?: string) => {
      const scorePercent = Math.round(score * 100);

      // Different messages based on how much was spoken
      if (partialText && partialText.length > 0) {
        const partialWords = partialText.trim().split(/\s+/).length;
        const totalWords = originalText.trim().split(/\s+/).length;
        const completionPercent = Math.round((partialWords / totalWords) * 100);

        if (completionPercent < 30) {
          return `I heard "${partialText}" but please continue with the full sentence: "${originalText}"`;
        } else if (completionPercent < 70) {
          return `Good start with "${partialText}". Now say the complete sentence: "${originalText}"`;
        } else {
          return `Almost there! You said "${partialText}". Try the full sentence: "${originalText}"`;
        }
      }

      const retryTemplates = [
        `Not quite there (${scorePercent}%). Let's try the complete sentence: "${originalText}"`,
        `Close, but let's practice the full sentence: "${originalText}"`,
        `Let me help you with the complete sentence. Say: "${originalText}"`,
        `Try the full sentence once more: "${originalText}"`,
        `Let's get the complete sentence right: "${originalText}"`,
        `Almost! Say the entire sentence: "${originalText}"`,
        `Let's practice that complete sentence again: "${originalText}"`,
        `Please say the full sentence like this: "${originalText}"`,
      ];

      return retryTemplates[Math.floor(Math.random() * retryTemplates.length)];
    },
    []
  );

  // --- HÀM XỬ LÝ CHÍNH ---

  // TẠO MỘT HÀM MỚI ĐỂ XỬ LÝ SAU KHI ĐÃ CÓ BẢN GHI HOÀN CHỈNH

  const handleUserSpeech = useCallback(
    async (transcript: string) => {
      const messageContent = transcript.trim();
      if (!messageContent) return;

      // Lấy stepIndex ngay từ đầu từ ref để có giá trị mới nhất
      const stepIndex = currentStepRef.current;
      const expectedLine = steps[stepIndex];
      if (!expectedLine || expectedLine.speaker !== "Gwen") return;

      // --- LOGIC GOM CÂU DÀI ---
      const isLongSentence =
        expectedLine.text.split(/\s+/).length > LONG_SENTENCE_WORD_THRESHOLD;

      // Gom transcript vào bộ đệm
      accumulatedTranscriptRef.current = (
        accumulatedTranscriptRef.current +
        " " +
        messageContent
      ).trim();
      setPartialTranscript(accumulatedTranscriptRef.current);

      // Xóa timer cũ
      if (finalTranscriptGracePeriodRef.current)
        clearTimeout(finalTranscriptGracePeriodRef.current);

      // Nếu là câu ngắn, chúng ta vẫn cần một grace period nhỏ để xử lý các final transcript đến nhanh
      const gracePeriod = isLongSentence
        ? resolvedTimingSettings.responseWaitTime +
          LONG_SENTENCE_GRACE_PERIOD_MS_BONUS // Thêm 2 giây cho câu dài
        : resolvedTimingSettings.responseWaitTime;

      finalTranscriptGracePeriodRef.current = setTimeout(async () => {
        const fullTranscript = accumulatedTranscriptRef.current.trim();
        accumulatedTranscriptRef.current = ""; // Dọn dẹp ngay lập tức

        if (!fullTranscript || processingUserInputRef.current) return;

        console.log("before update processing is true");
        processingUserInputRef.current = true;

        // --- Bắt đầu logic xử lý (trước đây nằm trong `process`) ---
        const similarityResult = calculateAdvancedSimilarity(
          fullTranscript,
          expectedLine.text,
          `step-${stepIndex}`
        );

        console.log(
          `Similarity score for step ${stepIndex}:`,
          similarityResult
        );

        const shouldAdvance = similarityResult.score >= 0.6;
        isAwaitingAIRef.current = true; // Khóa input cho lượt nói tiếp theo của AI

        if (shouldAdvance) {
          console.log(`✅ Good score on step ${stepIndex}. Advancing.`);
          setMessages((prev) => [
            {
              type: "user", // Add the required type property
              role: "user",
              content: fullTranscript,
              timestamp: Date.now(),
              similarity: similarityResult,
            },
            ...prev,
          ]);
          setConversationState((prev) => ({
            ...prev,
            similarity: similarityResult,
            currentStep: prev.currentStep + 1,
            isWaitingForUser: false,
          }));
        } else {
          // isWaitingForUserRef.current = false; // Đặt lại trạng thái chờ người dùng
          console.log(`🔄 Low score on step ${stepIndex}. Retrying.`);
          // const retryMsg = generateRetryMessage(expectedLine.text);
          const retryMsg = generateRetryMessage(
            expectedLine.text,
            similarityResult.score,
            partialTranscript
          );
          setMessages((prev) => [
            {
              type: "assistant",
              role: "assistant",
              content: retryMsg,
              timestamp: Date.now(),
              similarity: similarityResult,
            },
            ...prev,
          ]);

          await speakAI(retryMsg);

          if (turnTimeoutRef.current) {
            clearTimeout(turnTimeoutRef.current);
          }
          turnTimeoutRef.current = setTimeout(() => {
            console.log(
              `👤 Gwen's turn (step ${stepIndex}). Listener is now active.`
            );

            isAwaitingAIRef.current = false;
            resetSimilarityContext(`step-${stepIndex}`);
            setConversationState((prev) => ({
              ...prev,
              similarity: similarityResult,
              isWaitingForUser: true,
              retryCounter: (prev.retryCounter || 0) + 1,
            }));
          }, 750);
        }
        console.log("after update processing is false");
        processingUserInputRef.current = false;
        setPartialTranscript("");

        // --- Kết thúc logic xử lý ---
      }, gracePeriod);

      return () => {
        if (turnTimeoutRef.current) {
          clearTimeout(turnTimeoutRef.current);
        }
      };
    },
    [steps, resolvedTimingSettings, generateRetryMessage, speakAI]
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

    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current.src = "";
    }
    window.speechSynthesis?.cancel();
    conversationCompletedRef.current = true;
  }, [callState.status]);

  const resetConversation = useCallback(() => {
    endCall();
    setConversationState({
      currentStep: 0,
      totalSteps: steps.length,
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
  }, [endCall, steps]);

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);

    // --- SỬ DỤNG TIMINGSETTINGS Ở ĐÂY ---
    inactivityTimerRef.current = setTimeout(() => {
      console.log(
        `⏰ Inactivity timeout of ${resolvedTimingSettings.speechTimeout / 1000}s reached. Ending call.`
      );
      endCall();
    }, resolvedTimingSettings.speechTimeout);
  }, [endCall, resolvedTimingSettings]);

  const startCall = useCallback(async () => {
    resetConversation();
    setCallState({ status: CallStatus.CONNECTING });
    try {
      recordSessionStartAction(companionId);
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
        console.log("Transcript received:", transcript);

        console.log("isWaitingForUserRef:", isWaitingForUserRef.current);
        console.log("isAwaitingAIRef:", isAwaitingAIRef.current);
        console.log("processingUserInputRef:", processingUserInputRef.current);

        if (
          !transcript ||
          !isWaitingForUserRef.current ||
          isAwaitingAIRef.current
        )
          return;
        resetInactivityTimer();
        if (data.is_final) {
          if (!processingUserInputRef.current) {
            handleUserSpeech(transcript);
          }
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
          {
            type: "assistant",
            role: "assistant",
            content: line.text,
            timestamp: Date.now(),
          },
          ...prev,
        ]);
        await speakAI(line.text);

        if (keepAliveInterval) clearInterval(keepAliveInterval); // 3. Tắt KeepAlive
        // KHÔNG mở khóa input ở đây, để cho lượt của Gwen xử lý

        if (!isCancelled) {
          console.log(
            `🎤 Leo finished. Waiting ${resolvedTimingSettings.stepTransitionDelay}ms before advancing.`
          );

          // --- SỬ DỤNG TIMINGSETTINGS Ở ĐÂY ---
          setTimeout(() => {
            if (!isCancelled) {
              // Kiểm tra lại cờ isCancelled
              setConversationState((prev) => ({
                ...prev,
                currentStep: prev.currentStep + 1,
              }));
            }
          }, resolvedTimingSettings.stepTransitionDelay);
          // --- KẾT THÚC SỬA ĐỔI ---
        }
      } else if (line.speaker === "Gwen") {
        // Chỉ cần hạ cờ và đặt trạng thái chờ
        if (!isWaitingForUserRef.current) {
          if (turnTimeoutRef.current) {
            clearTimeout(turnTimeoutRef.current);
          }
          turnTimeoutRef.current = setTimeout(() => {
            if (isCancelled) return;
            console.log(
              `👤 Gwen's turn (step ${conversationState.currentStep}). Listener is now active.`
            );

            isAwaitingAIRef.current = false;
            resetInactivityTimer();
            setConversationState((prev) => ({
              ...prev,
              isWaitingForUser: true,
            }));
          }, 750);
        }
      }
    };

    const timeoutId = setTimeout(processTurn, 100);
    return () => {
      isCancelled = true;
      clearTimeout(timeoutId);

      if (turnTimeoutRef.current) {
        clearTimeout(turnTimeoutRef.current);
      }
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
    audioPlayerRef,
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
