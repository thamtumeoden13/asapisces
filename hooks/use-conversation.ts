// File: hooks/use-conversation.ts (FINAL, RESTRUCTURED VERSION)
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
import type { TimingSettings, Message } from "@/types"; // Đảm bảo Message được import từ types của bạn
import { recordSessionStartAction } from "@/lib/actions/session.action";
import { getSmartRetryFeedbackAction } from "@/lib/actions/general.action";
import {
  LONG_SENTENCE_GRACE_PERIOD_MS_BONUS,
  LONG_SENTENCE_WORD_THRESHOLD,
  LOWSCORETHERESHOLD,
  SHOULDADVANCESCORETHERESHOLD,
} from "@/constants";

type TTSProvider = "webspeech" | "elevenlabs";
type GeminiFeedbackOption = "standard" | "gemini";

// --- Props ---
interface UseConversationProps {
  steps: TranscriptLine[];
  companionId?: string;
  voiceId?: string;
  ttsProvider: TTSProvider;
  geminiFeedback?: GeminiFeedbackOption;
  timingSettings?: Partial<TimingSettings>;
  userRole: "Gwen" | "Leo";
  onSessionComplete?: () => void;
}

export const useConversation = ({
  steps,
  companionId,
  voiceId,
  ttsProvider,
  geminiFeedback,
  timingSettings = {},
  userRole,
  onSessionComplete,
}: UseConversationProps) => {
  // --- STATE & REFS ---
  const [callState, setCallState] = useState<VapiCallState>({
    status: CallStatus.INACTIVE,
  });
  const [conversationState, setConversationState] = useState<
    ConversationState & { similarity?: unknown; retryCounter: number }
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
  const gracePeriodTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Cập nhật refs khi state thay đổi
  useEffect(() => {
    currentStepRef.current = conversationState.currentStep;
  }, [conversationState.currentStep]);
  useEffect(() => {
    isWaitingForUserRef.current = conversationState.isWaitingForUser;
  }, [conversationState.isWaitingForUser]);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const currentLine: TranscriptLine | null = useMemo(
    () => steps[conversationState.currentStep] || null,
    [steps, conversationState.currentStep]
  );

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
      // --- CÁC NHÓM MẪU CÂU THEO NGỮ CẢNH ---

      // 1. Điểm cao (> 0.6): Rất khích lệ, chỉ cần một chút chỉnh sửa.
      const high_score_templates = [
        `Almost perfect! Let's try it one more time: "${originalText}"`,
        `You're so close! Just a little tweak. Say: "${originalText}"`,
        `Excellent effort! Let's nail the final version: "${originalText}"`,
      ];

      // 2. Điểm trung bình (0.4 - 0.6): Khích lệ và hướng dẫn.
      // Ưu tiên sử dụng partialText nếu có.
      const medium_score_templates = partialText
        ? [
            `That's a great start with "${partialText}". Now for the full sentence: "${originalText}"`,
            `I heard "${partialText}", you've got the main idea! Let's try the complete version: "${originalText}"`,
          ]
        : [
            `Good attempt! Let's practice the full sentence now: "${originalText}"`,
            `You're on the right track. Let's try it like this: "${originalText}"`,
          ];

      // 3. Điểm thấp (< 0.4): Hướng dẫn nhẹ nhàng, rõ ràng.
      const low_score_templates = [
        `Let's try that one from the beginning. Say: "${originalText}"`,
        `Let me help you with that. The sentence is: "${originalText}"`,
        `No worries! Let's practice together: "${originalText}"`,
      ];

      // --- LOGIC CHỌN MẪU CÂU ---

      let selectedTemplates;

      if (score > 0.6) {
        selectedTemplates = high_score_templates;
      } else if (score >= 0.4) {
        selectedTemplates = medium_score_templates;
      } else {
        selectedTemplates = low_score_templates;
      }

      // Chọn ngẫu nhiên một câu trong nhóm đã được chọn
      return selectedTemplates[
        Math.floor(Math.random() * selectedTemplates.length)
      ];
    },
    []
  );
  // --- CÁC HÀM ĐIỀU KHIỂN CHÍNH ---
  // HÀM SỐ 1: CHỈ XỬ LÝ LOGIC ĐÁNH GIÁ VÀ QUYẾT ĐỊNH
  const handleUserSpeech = useCallback(
    async (transcript: string) => {
      const stepIndex = currentStepRef.current;

      // --- Bắt đầu xử lý ---
      processingUserInputRef.current = true;

      // Lấy đúng câu thoại cần so sánh
      const expectedLine = steps[stepIndex];
      // Điều kiện bảo vệ: chỉ xử lý nếu đúng lượt của người dùng
      if (!expectedLine || expectedLine.speaker !== userRole) {
        processingUserInputRef.current = false;
        return;
      }

      // Tính toán similarity
      const similarityResult = calculateAdvancedSimilarity(
        transcript,
        expectedLine.text,
        `step-${stepIndex}`
      );

      // Cập nhật tin nhắn vào UI
      setMessages((prev) => [
        {
          type: "user",
          role: "user",
          content: transcript,
          timestamp: Date.now(),
          similarity: similarityResult,
        },
        ...prev,
      ]);

      // Quyết định advance hay retry
      const shouldAdvance =
        similarityResult.score >= SHOULDADVANCESCORETHERESHOLD; // Ngưỡng 70%
      isAwaitingAIRef.current = true;
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
        isAwaitingAIRef.current = true; // Khóa input khi AI chuẩn bị nói
        let retryMsg: string;

        // --- LOGIC QUYẾT ĐỊNH "HYBRID RETRY" ---
        const lowScoreThreshold = similarityResult.score < LOWSCORETHERESHOLD;

        if (
          geminiFeedback === "gemini" ||
          (geminiFeedback === "standard" && !lowScoreThreshold)
        ) {
          console.log("-> Complex error detected. Calling AI for smart retry.");
          const smartFeedbackResult = await getSmartRetryFeedbackAction({
            expectedSentence: expectedLine.text,
            userSentence: transcript,
          });
          retryMsg =
            smartFeedbackResult.feedbackMessage ||
            generateRetryMessage(
              expectedLine.text,
              similarityResult.score,
              transcript
            );
        } else {
          console.log("-> Simple error detected. Using local retry message.");
          retryMsg = generateRetryMessage(
            expectedLine.text,
            similarityResult.score,
            transcript
          );
        }

        // --- KẾT THÚC LOGIC QUYẾT ĐỊNH ---

        setMessages((prev) => [
          {
            type: "assistant",
            role: "assistant",
            content: retryMsg,
            timestamp: Date.now(),
          },
          ...prev,
        ]);

        await speakAI(retryMsg); // Chờ AI nói xong
        if (turnTimeoutRef.current) {
          clearTimeout(turnTimeoutRef.current);
        }
        turnTimeoutRef.current = setTimeout(() => {
          console.log(
            `👤 User's turn (step ${stepIndex}). Listener is now active.`
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

      // --- Kết thúc xử lý ---
      processingUserInputRef.current = false;
      setPartialTranscript("");
    },
    [
      steps,
      userRole,
      geminiFeedback,
      generateRetryMessage,
      speakAI,
    ]
  );

  // HÀM SỐ 2: CHỈ XỬ LÝ VIỆC GOM BẢN GHI VÀ GRACE PERIOD
  const processFinalTranscript = useCallback(
    (transcript: string) => {
      const messageContent = transcript.trim();
      if (!messageContent) return;

      // Gom transcript vào bộ đệm
      accumulatedTranscriptRef.current = (
        accumulatedTranscriptRef.current +
        " " +
        messageContent
      ).trim();

      // Cập nhật UI để người dùng thấy họ đang nói gì
      setPartialTranscript(accumulatedTranscriptRef.current);

      // Xóa timer cũ nếu người dùng nói tiếp
      if (gracePeriodTimerRef.current) {
        clearTimeout(gracePeriodTimerRef.current);
      }

      const expectedLine = steps[currentStepRef.current];
      if (!expectedLine) return; // Bảo vệ nếu không có step tiếp theo

      if (
        expectedLine.text.split(/\s+/).length > LONG_SENTENCE_WORD_THRESHOLD &&
        accumulatedTranscriptRef.current.split(/\s+/).length <
          expectedLine.text.split(/\s+/).length / 2
      ) {
        // Nếu số từ hiện tại trong bộ đệm còn ít hơn một nửa số từ của câu mục tiêu, không cần thiết phải xử lý ngay
        return;
      }

      // Xác định xem có phải câu dài không và tính toán grace period
      const isLongSentence = expectedLine.text.split(/\s+/).length > 8;
      const gracePeriod = isLongSentence
        ? resolvedTimingSettings.responseWaitTime +
          LONG_SENTENCE_GRACE_PERIOD_MS_BONUS
        : resolvedTimingSettings.responseWaitTime;

      // Đặt timer mới
      gracePeriodTimerRef.current = setTimeout(() => {
        const fullTranscript = accumulatedTranscriptRef.current.trim();
        // Dọn dẹp bộ đệm ngay lập tức
        accumulatedTranscriptRef.current = "";

        // Chỉ xử lý nếu có transcript và không có xử lý nào khác đang chạy
        if (fullTranscript && !processingUserInputRef.current) {
          handleUserSpeech(fullTranscript);
        }
      }, gracePeriod);
    },
    [steps, resolvedTimingSettings.responseWaitTime, handleUserSpeech]
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
      if (companionId) recordSessionStartAction(companionId);
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

      client.on(LiveTranscriptionEvents.Open, async () => {
        console.log("✅ Deepgram connection established. Recorder will start.");
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        const recorder = new MediaRecorder(stream);
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0 && client.getReadyState() === 1)
            client.send(e.data);
        };
        microphoneRef.current = { stream, recorder };
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
            processFinalTranscript(transcript);
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
  }, [
    resetConversation,
    companionId,
    resetInactivityTimer,
    processFinalTranscript,
    endCall,
  ]);

  // ... (Các hàm điều khiển phụ như toggleMute, skipToStep, ...)

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

  const manualTriggerAI = useCallback(() => {
    if (currentLine?.speaker !== userRole) speakAI(currentLine.text);
  }, [currentLine, userRole, speakAI]);

  // --- useEffect TRUNG TÂM ---
  useEffect(() => {
    if (callState.status !== "ACTIVE" || conversationCompletedRef.current)
      return;
    let isCancelled = false;
    let keepAliveInterval: NodeJS.Timeout | null = null;
    let turnTimeoutId: NodeJS.Timeout | null = null;

    const processTurn = async () => {
      if (isCancelled) return;

      const line = steps[conversationState.currentStep];
      if (!line) {
        onSessionComplete?.();
        endCall();
        return;
      }

      const isAITurn = line.speaker !== userRole;

      if (isAITurn) {
        console.log(`🗣️ AI's turn (as ${line.speaker})`);
        if (
          messagesRef.current.some(
            (msg) => msg.content === line.text && msg.role === "assistant"
          )
        ) {
          return;
        }
        processingUserInputRef.current = true; // Khóa input khi Leo chuẩn bị nói
        const client = deepgramClientRef.current;
        if (client)
          keepAliveInterval = setInterval(() => client.keepAlive(), 10000);

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
        if (keepAliveInterval) clearInterval(keepAliveInterval);

        if (!isCancelled) {
          turnTimeoutId = setTimeout(() => {
            if (!isCancelled) {
              setConversationState((prev) => ({
                ...prev,
                currentStep: prev.currentStep + 1,
              }));
            }
          }, resolvedTimingSettings.stepTransitionDelay);
        }
      } else {
        console.log(`👤 User's turn (as ${line.speaker})`);
        if (!isWaitingForUserRef.current) {
          turnTimeoutId = setTimeout(() => {
            if (isCancelled) return;
            processingUserInputRef.current = false; // Mở khóa input khi đến lượt Gwen

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

    processTurn();

    return () => {
      isCancelled = true;
      if (keepAliveInterval) clearInterval(keepAliveInterval);
      if (turnTimeoutId) clearTimeout(turnTimeoutId);
    };
  }, [
    conversationState.currentStep,
    conversationState.retryCounter,
    callState.status,
    userRole,
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
    manualTriggerAI,
  };
};
