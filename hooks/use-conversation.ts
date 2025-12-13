// File: hooks/use-conversation.ts (FINAL, RESTRUCTURED VERSION)
"use client";

import {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
  useReducer,
} from "react";
import {
  createClient,
  LiveClient,
  LiveTranscriptionEvents,
} from "@deepgram/sdk";
import {
  calculateAdvancedSimilarity,
  resetSimilarityContext,
} from "@/lib/enhanced-similarity-for-long-sentences";
import type { TranscriptLine } from "@/types/podcast";
import { CallStatus } from "@/types/podcast";
import type { TimingSettings, Message, SimilarityResult } from "@/types"; // Đảm bảo Message được import từ types của bạn
import { recordSessionStartAction } from "@/lib/actions/session.action";
import { getSmartRetryFeedbackAction } from "@/lib/actions/general.action";
import {
  LONG_SENTENCE_GRACE_PERIOD_MS_BONUS,
  LONG_SENTENCE_WORD_THRESHOLD,
  LOWSCORETHERESHOLD,
  SHOULDADVANCESCORETHERESHOLD,
} from "@/constants";
import { toast } from "./use-toast";

import { startConversationSessionAction } from "@/lib/actions/conversation.action";
import { generateSpeechAction } from "@/lib/actions/tts.action";

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

// Định nghĩa cấu trúc state tập trung
interface ConversationReducerState {
  status: CallStatus;
  error?: string;
  currentStep: number;
  isWaitingForUser: boolean;
  isAwaitingAI: boolean;
  preventProcessingSpeech: boolean;
  similarity: SimilarityResult | null;
}

// Định nghĩa tất cả các hành động có thể thay đổi state
type ConversationAction =
  | { type: "STARTING_CALL" }
  | { type: "CALL_STARTED" }
  | { type: "CALL_FAILED"; payload: string }
  | { type: "END_CALL" }
  | { type: "RESET" }
  | { type: "ADVANCE_STEP" }
  | { type: "SET_USER_TURN" }
  | { type: "SET_AI_TURN" }
  | { type: "START_PROCESSING_SPEECH" }
  | { type: "STOP_PROCESSING_SPEECH" }
  | { type: "RETRY_STEP" }
  | { type: "SKIP_TO_STEP"; payload: { stepIndex: number } };

const initialConversationState: ConversationReducerState = {
  status: CallStatus.INACTIVE,
  currentStep: 0,
  isWaitingForUser: false,
  isAwaitingAI: false,
  preventProcessingSpeech: true,
  similarity: null,
};

// Hàm Reducer: Logic trung tâm để xử lý các thay đổi state
const conversationReducer = (
  state: ConversationReducerState,
  action: ConversationAction
): ConversationReducerState => {
  switch (action.type) {
    case "STARTING_CALL":
      return { ...state, status: CallStatus.CONNECTING, error: undefined };
    case "CALL_STARTED":
      return { ...state, status: CallStatus.ACTIVE };
    case "CALL_FAILED":
      return { ...state, status: CallStatus.ERROR, error: action.payload };
    case "END_CALL":
      return {
        ...state,
        status: CallStatus.FINISHED,
        isWaitingForUser: false,
        isAwaitingAI: false,
        preventProcessingSpeech: true,
      };
    case "RESET":
      return initialConversationState;
    case "ADVANCE_STEP":
      return {
        ...state,
        currentStep: state.currentStep + 1,
        isWaitingForUser: false,
        isAwaitingAI: false,
      };
    case "SET_USER_TURN":
      return {
        ...state,
        isWaitingForUser: true,
        isAwaitingAI: false,
      };
    case "SET_AI_TURN":
      return {
        ...state,
        isAwaitingAI: true,
        isWaitingForUser: false,
      };
    case "START_PROCESSING_SPEECH":
      return { ...state, preventProcessingSpeech: true };
    case "STOP_PROCESSING_SPEECH":
      return { ...state, preventProcessingSpeech: false };
    case "RETRY_STEP":
      return {
        ...state,
        isWaitingForUser: false,
        isAwaitingAI: false,
        preventProcessingSpeech: false,
      };
    case "SKIP_TO_STEP":
      return {
        ...state,
        currentStep: action.payload.stepIndex,
        similarity: null,
        isWaitingForUser: false,
        isAwaitingAI: false,
        preventProcessingSpeech: false,
      };
    default:
      return state;
  }
};

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
  const [state, dispatch] = useReducer(
    conversationReducer,
    initialConversationState
  );

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

  const messagesRef = useRef(messages);
  const accumulatedTranscriptRef = useRef<string>("");
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const turnTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const gracePeriodTimerRef = useRef<NodeJS.Timeout | null>(null);
  const stateRef = useRef<ConversationReducerState>(state);

  // Cập nhật refs khi state thay đổi
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // --- DERIVED STATE & MEMOS ---
  const currentLine: TranscriptLine | null = useMemo(
    () => steps[state.currentStep] || null,
    [steps, state.currentStep]
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
    (text: string) => {
      if (!voiceId) {
        console.error("ElevenLabs voiceId is required.");
        // Trả về một Promise đã bị reject ngay lập tức
        return Promise.reject(
          new Error("ElevenLabs voiceId is not configured.")
        );
      }

      return new Promise<void>(async (resolve, reject) => {
        if (!text) return resolve();
        setIsSpeaking(true);
        try {
          const result = await generateSpeechAction(text, voiceId);

          if (!result.success || !result.audioUrl) {
            // Ném lỗi để khối catch bên dưới xử lý
            throw new Error(result.error || "Failed to get audio URL.");
          }

          // 2. Phát audio từ URL nhận được
          if (!audioPlayerRef.current) {
            audioPlayerRef.current = new Audio();
          }
          const player = audioPlayerRef.current;
          player.src = result.audioUrl;

          // Xóa các event listener cũ để tránh bị gọi nhiều lần
          player.onended = null;
          player.onerror = null;

          player.onended = () => {
            setIsSpeaking(false);
            resolve();
          };

          player.onerror = (e) => {
            console.error("Audio playback error:", e);
            setIsSpeaking(false);
            // Vẫn resolve để không làm treo cuộc gọi, nhưng log lỗi
            // Hoặc bạn có thể reject nếu muốn dừng cuộc gọi khi audio lỗi
            reject(new Error("Audio playback failed."));
          };

          await player.play();
        } catch (error) {
          // 3. Bắt tất cả các lỗi (từ generateSpeechAction hoặc player.play())
          const errorMessage =
            error instanceof Error
              ? error.message
              : "An unknown speech error occurred.";
          console.error("Failed to speak with ElevenLabs:", errorMessage);

          setIsSpeaking(false);

          // Reject Promise để `useEffect` trung tâm có thể bắt và xử lý
          // (ví dụ: hiển thị toast và endCall)
          reject(new Error(errorMessage));
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

  const handleUserSpeech = useCallback(
    async (transcript: string) => {
      // --- Bắt đầu xử lý ---
      const currentState = stateRef.current;
      const expectedLine = steps[currentState.currentStep];
      dispatch({ type: "START_PROCESSING_SPEECH" });

      if (!expectedLine || expectedLine.speaker !== userRole) {
        console.warn(
          "Received user speech when it's not the user's turn or no expected line."
        );
        // dispatch({ type: "STOP_PROCESSING_SPEECH" });
        return;
      }

      const similarityResult = calculateAdvancedSimilarity(
        transcript,
        expectedLine.text,
        `step-${currentState.currentStep}`
      );
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

      const shouldAdvance =
        similarityResult.score >= SHOULDADVANCESCORETHERESHOLD;

      if (shouldAdvance) {
        console.log(
          `✅ Good score on step ${currentState.currentStep}. Advancing.`
        );

        dispatch({ type: "ADVANCE_STEP" });
      } else {
        console.log(
          `🔄 Low score on step ${currentState.currentStep}. Retrying.`
        );
        dispatch({ type: "START_PROCESSING_SPEECH" });
        dispatch({ type: "SET_AI_TURN" });
        let retryMsg: string;
        const lowScoreThreshold = similarityResult.score < LOWSCORETHERESHOLD;

        if (geminiFeedback === "gemini" && !lowScoreThreshold) {
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
          retryMsg = generateRetryMessage(
            expectedLine.text,
            similarityResult.score,
            transcript
          );
        }

        setMessages((prev) => [
          {
            type: "assistant",
            role: "assistant",
            content: retryMsg,
            timestamp: Date.now(),
          },
          ...prev,
        ]);
        await speakAI(retryMsg);
        if (turnTimeoutRef.current) {
          clearTimeout(turnTimeoutRef.current);
        }
        turnTimeoutRef.current = setTimeout(() => {
          console.log(
            `👤 User's turn (step ${currentState.currentStep}). Listener is now active.`
          );

          resetSimilarityContext(`step-${currentState.currentStep}`);
          dispatch({ type: "STOP_PROCESSING_SPEECH" });
          dispatch({ type: "SET_USER_TURN" });
        }, 750);
      }
      setPartialTranscript("");
    },
    [steps, userRole, geminiFeedback, generateRetryMessage, speakAI]
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
      const currentState = stateRef.current;
      const expectedLine = steps[currentState.currentStep];
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
        if (fullTranscript && !currentState.preventProcessingSpeech) {
          handleUserSpeech(fullTranscript);
        }
      }, gracePeriod);
    },
    [steps, resolvedTimingSettings.responseWaitTime, handleUserSpeech]
  );
  const endCall = useCallback(() => {
    if (state.status === CallStatus.FINISHED) return;
    dispatch({ type: "END_CALL" });

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
  }, [state.status]);

  const handleCompletedCall = useCallback(() => {
    endCall();
    onSessionComplete?.();
  }, [endCall, onSessionComplete]);

  const resetConversation = useCallback(() => {
    endCall();
    dispatch({ type: "RESET" });
    setMessages([]);
    setPartialTranscript("");
  }, [endCall]);

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
    dispatch({ type: "STARTING_CALL" });
    try {
      // if (companionId) recordSessionStartAction(companionId);
      // const response = await fetch("/api/deepgram");
      // const data = await response.json();
      // if (!data.deepgramToken) throw new Error("Failed to get Deepgram token.");

      // 1. Gọi Server Action để kiểm tra credit và lấy token
      const sessionResult = await startConversationSessionAction();

      if (!sessionResult.success || !sessionResult.token) {
        // Ném lỗi để khối catch bên dưới xử lý và hiển thị cho người dùng
        console.error(
          "Failed to start conversation session:",
          sessionResult.error
        );
        throw new Error(sessionResult.error || "Failed to start session.");
      }

      // 2. Nếu thành công, tiếp tục logic kết nối Deepgram với token đã nhận
      if (companionId) recordSessionStartAction(companionId);

      const client = createClient(sessionResult.token).listen.live({
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
        dispatch({ type: "CALL_STARTED" });
      });

      client.on(LiveTranscriptionEvents.Transcript, (data) => {
        const currentState = stateRef.current;
        const transcript = data.channel.alternatives[0].transcript;

        console.log("isWaitingForUser:", currentState.isWaitingForUser);
        console.log("isAwaitingAI:", currentState.isAwaitingAI);
        console.log(
          "preventProcessingSpeech:",
          currentState.preventProcessingSpeech
        );
        if (
          !transcript ||
          !currentState.isWaitingForUser ||
          currentState.preventProcessingSpeech ||
          currentState.isAwaitingAI
        )
          return;
        resetInactivityTimer();
        if (data.is_final) {
          processFinalTranscript(transcript);
        } else if (!data.is_final) {
          setPartialTranscript(transcript);
        }
      });

      client.on(LiveTranscriptionEvents.Error, (e) => {
        console.error(e);
        endCall();
      });
      client.on(LiveTranscriptionEvents.Close, () => endCall());
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred.";
      dispatch({ type: "CALL_FAILED", payload: errorMessage });
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
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
        dispatch({ type: "SKIP_TO_STEP", payload: { stepIndex } });
      }
    },
    [steps.length]
  );

  const retryCurrentStep = useCallback(() => {
    if (currentLine) dispatch({ type: "RETRY_STEP" });
  }, [currentLine]);

  // --- useEffect TRUNG TÂM ---
  useEffect(() => {
    if (state.status !== "ACTIVE") return;

    const currentState = stateRef.current;

    let isCancelled = false;
    let keepAliveInterval: NodeJS.Timeout | null = null;
    let turnTimeoutId: NodeJS.Timeout | null = null;
    const processTurn = async () => {
      if (isCancelled) return;

      const line = steps[state.currentStep];
      if (!line) {
        handleCompletedCall();
        // endCall();
        // onSessionComplete?.();
        return;
      }

      const isAITurn = line.speaker?.trim() !== userRole.trim();

      if (isAITurn) {
        console.log(`🗣️ AI's turn (as ${line.speaker})`);
        const lastMessage = messagesRef.current[0];
        if (
          lastMessage?.role === "assistant" &&
          lastMessage?.content === line.text
        ) {
          return;
        }
        dispatch({ type: "START_PROCESSING_SPEECH" });
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
        try {
          console.log("Speaking AI line:", line.text);
          await speakAI(line.text);
          if (keepAliveInterval) clearInterval(keepAliveInterval);
          if (isCancelled) return;
          turnTimeoutId = setTimeout(() => {
            if (isCancelled) return;
            console.log("Advancing to next step after AI speech.");
            dispatch({ type: "ADVANCE_STEP" });
          }, resolvedTimingSettings.stepTransitionDelay);
        } catch (error) {
          // Xử lý lỗi ở đây
          if (isCancelled) return; // Bỏ qua nếu đã cleanup

          const errorMessage =
            error instanceof Error
              ? error.message
              : "An unknown error occurred.";
          console.error("Critical speak error:", errorMessage);

          // Hiển thị toast cho người dùng
          toast({
            variant: "destructive",
            title: "Speech Error",
            description: errorMessage,
          });
          // Kết thúc cuộc gọi
          endCall();
        }
      } else {
        console.log(`👤 User's turn (as ${line.speaker})`);
        if (!currentState.isWaitingForUser) {
          turnTimeoutId = setTimeout(() => {
            if (isCancelled) return;
            dispatch({ type: "STOP_PROCESSING_SPEECH" });
            dispatch({ type: "SET_USER_TURN" });
            resetInactivityTimer();
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status, state.currentStep, userRole]);

  return {
    callState: { status: state.status, error: state.error },
    conversationState: {
      currentStep: state.currentStep,
      totalSteps: steps.length,
      isWaitingForUser: state.isWaitingForUser,
    },
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
  };
};
