// File: hooks/use-conversation.ts (FIXED AND RESTRUCTURED VERSION)
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
import type { TimingSettings, Message, SimilarityResult } from "@/types";
import { recordSessionStartAction } from "@/lib/actions/session.action";
import { getSmartRetryFeedbackAction } from "@/lib/actions/general.action";
import { recordPronunciationErrorsAction } from "@/lib/actions/analytics.action";
import {
  LONG_SENTENCE_GRACE_PERIOD_MS_BONUS,
  LONG_SENTENCE_WORD_THRESHOLD,
  LOWSCORETHERESHOLD,
  SHOULDADVANCESCORETHERESHOLD,
} from "@/constants";
import { toast } from "./use-toast";

import { startConversationSessionAction } from "@/lib/actions/conversation.action";
import { generateSpeechAction } from "@/lib/actions/tts.action";
import { hasHighQualityTTS } from "@/lib/permissions";
import { audioPlayer } from "@/lib/AudioPlayer";

type TTSProvider = "webspeech" | "elevenlabs";
type GeminiFeedbackOption = "standard" | "gemini";

// --- Props ---
interface UseConversationProps {
  steps: TranscriptLine[];
  companionId: string;
  topicId: string;
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
  isProcessingSpeech: boolean;
  isSpeaking: boolean;
  isSpeakingScriptLine: boolean;
  isListening: boolean;
  similarity: SimilarityResult | null; // Thêm similarity vào state chính
  retryMessage: string | null; // Thêm thông điệp retry
}

// Định nghĩa tất cả các hành động có thể thay đổi state
type ConversationAction =
  | { type: "STARTING_CALL" }
  | { type: "CALL_STARTED" }
  | { type: "CALL_FAILED"; payload: string }
  | { type: "END_CALL"; payload?: { reason: string } }
  | { type: "RESET" }
  | { type: "ADVANCE_STEP" }
  | { type: "SET_USER_TURN" }
  | { type: "START_PROCESSING_SPEECH" }
  | {
      type: "RETRY_STEP";
      payload: { similarity: SimilarityResult; message: string };
    }
  | { type: "SKIP_TO_STEP"; payload: { stepIndex: number } }
  | { type: "SPEAK_START"; payload: { isScriptLine: boolean } }
  | { type: "SPEAK_END" }
  | { type: "LISTEN_START" }
  | { type: "LISTEN_END" };

const initialConversationState: ConversationReducerState = {
  status: CallStatus.INACTIVE,
  currentStep: 0,
  isWaitingForUser: false,
  isProcessingSpeech: true, // Khóa xử lý lúc đầu
  isSpeaking: false,
  isSpeakingScriptLine: false,
  isListening: false,
  similarity: null,
  retryMessage: null,
};

// Hàm Reducer: Logic trung tâm để xử lý các thay đổi state
const conversationReducer = (
  state: ConversationReducerState,
  action: ConversationAction,
): ConversationReducerState => {
  switch (action.type) {
    case "STARTING_CALL":
      return {
        ...initialConversationState,
        status: CallStatus.CONNECTING,
        isProcessingSpeech: false, // Mở khóa khi bắt đầu gọi
      };
    case "CALL_STARTED":
      return { ...state, status: CallStatus.ACTIVE };
    case "CALL_FAILED":
      return {
        ...state,
        status: CallStatus.ERROR,
        error: action.payload,
        isProcessingSpeech: true, // Khóa xử lý khi có lỗi
      };
    case "END_CALL":
      return {
        ...state,
        status: CallStatus.FINISHED,
        isWaitingForUser: false,
        isProcessingSpeech: true,
        isSpeaking: false,
        isListening: false,
      };
    case "RESET":
      return initialConversationState;
    case "ADVANCE_STEP":
      return {
        ...state,
        currentStep: state.currentStep + 1,
        isWaitingForUser: false,
        isProcessingSpeech: false,
        similarity: null,
        retryMessage: null,
      };
    case "SET_USER_TURN":
      return { ...state, isWaitingForUser: true, isProcessingSpeech: false };
    case "START_PROCESSING_SPEECH":
      return { ...state, isProcessingSpeech: true, isWaitingForUser: false };
    case "RETRY_STEP":
      return {
        ...state,
        isWaitingForUser: false,
        isProcessingSpeech: true, // Đang xử lý việc retry
        similarity: action.payload.similarity,
        retryMessage: action.payload.message,
      };
    case "SKIP_TO_STEP":
      return {
        ...state,
        currentStep: action.payload.stepIndex,
        isWaitingForUser: false,
        isProcessingSpeech: false,
        similarity: null,
        retryMessage: null,
      };
    case "SPEAK_START":
      return {
        ...state,
        isSpeaking: true,
        isSpeakingScriptLine: action.payload.isScriptLine,
      };
    case "SPEAK_END":
      return { ...state, isSpeaking: false, isSpeakingScriptLine: false };
    case "LISTEN_START":
      return { ...state, isListening: true };
    case "LISTEN_END":
      return { ...state, isListening: false };
    default:
      return state;
  }
};

export const useConversation = ({
  steps,
  companionId,
  topicId,
  voiceId,
  ttsProvider,
  geminiFeedback,
  timingSettings = {},
  userRole,
  onSessionComplete,
}: UseConversationProps) => {
  const [state, dispatch] = useReducer(
    conversationReducer,
    initialConversationState,
  );

  const [messages, setMessages] = useState<Message[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [partialTranscript, setPartialTranscript] = useState<string>("");
  const [highlightedWordIndex, setHighlightedWordIndex] = useState(-1);
  const [realtimeSimilarity, setRealtimeSimilarity] =
    useState<SimilarityResult | null>(null);
  const [retryInfo, setRetryInfo] = useState<any>(null); // Để tạm any cho dễ debug

  const isAnyoneSpeaking = state.isSpeaking || state.isListening;
  const currentLine: TranscriptLine | null = useMemo(
    () => steps[state.currentStep] || null,
    [steps, state.currentStep],
  );
  const resolvedTimingSettings = useMemo(
    () => ({
      stepTransitionDelay: 1000,
      responseWaitTime: 2500,
      speechTimeout: 90000,
      ...timingSettings,
    }),
    [timingSettings],
  );

  const stateRef = useRef(state);
  stateRef.current = state;
  const deepgramClientRef = useRef<LiveClient | null>(null);
  const microphoneRef = useRef<any>(null);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const accumulatedTranscriptRef = useRef<string>("");
  const gracePeriodTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Hàm tiện ích để lấy stack trace của caller, giúp xác định ai đã gọi hàm hiện tại
  const getCallerInfo = (offset: number = 2): string => {
    try {
      throw new Error();
    } catch (e: any) {
      // Stack trace sẽ có dạng: Error\n  at getCallerInfo (...)\n  at callingFunction (...)\n ...
      return e.stack?.split('\n')[offset + 1]?.trim() || "Unknown Caller";
    }
  };


  // --- HÀM TIỆN ÍCH ---
  const speakAIByWebSpeechAPI = useCallback((text: string) => {
    return new Promise<void>((resolve, reject) => {
      if (!text || typeof window === "undefined" || !window.speechSynthesis) {
        return resolve();
      }
      window.speechSynthesis.resume();
      window.speechSynthesis.cancel();

      setHighlightedWordIndex(-1);

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";

      const cleanupAndResolve = () => {
        setHighlightedWordIndex(-1);
        resolve();
      };

      utterance.onboundary = (event) => {
        if (event.name === "word") {
          const words = text.split(/\s+/);
          let charCount = 0;
          for (let i = 0; i < words.length; i++) {
            charCount += words[i].length + 1;
            if (event.charIndex < charCount) {
              setHighlightedWordIndex(i);
              break;
            }
          }
        }
      };

      utterance.onend = cleanupAndResolve;
      utterance.onerror = (e) => {
        console.error("Web Speech Synthesis error:", e.error);
        reject(e);
      };

      window.speechSynthesis.speak(utterance);
    });
  }, []);

  const speakAIByElevenLabs = useCallback(
    async (text: string) => {
      if (!voiceId) {
        throw new Error("ElevenLabs voiceId is not configured.");
      }
      if (!text) return;

      const isHighQuality = await hasHighQualityTTS();
      const qualityTier = isHighQuality ? "premium" : "standard";

      const result = await generateSpeechAction({ text, voiceId, qualityTier });
      if (!result.success || !result.audioUrl) {
        throw new Error(result.error || "Failed to get audio URL.");
      }
      // Bổ sung try-catch cục bộ để log lỗi từ audioPlayer.play()
      try {
        await audioPlayer.play(result.audioUrl);
      } catch (playError) {
        console.error("speakAIByElevenLabs: audioPlayer.play() rejected!", playError);
        throw playError; // Re-throw để speakAI có thể bắt được
      }
    },
    [voiceId],
  );

  const speakAI = useCallback(
    async (text: string, isScriptLine: boolean = false) => {
      dispatch({ type: "SPEAK_START", payload: { isScriptLine } });
      try {
        if (ttsProvider === "elevenlabs") {
          await speakAIByElevenLabs(text);
        } else {
          await speakAIByWebSpeechAPI(text);
        }
      } catch (error) {
        // Chỉ ném lại lỗi để useEffect bắt. speakAIByElevenLabs đã log lỗi cụ thể.
        throw error;
      } finally {
        dispatch({ type: "SPEAK_END" });
      }
    },
    [ttsProvider, speakAIByElevenLabs, speakAIByWebSpeechAPI],
  );

  const generateRetryMessage = useCallback(
    (originalText: string, score: number, partialText?: string) => {
      const high_score_templates = [
        `Almost perfect! Let's try it one more time: "${originalText}"`,
        `You're so close! Just a little tweak. Say: "${originalText}"`,
      ];
      const medium_score_templates = partialText
        ? [
            `That's a great start with "${partialText}". Now for the full sentence: "${originalText}"`,
            `I heard "${partialText}", you've got the main idea! Let's try the complete version: "${originalText}"`,
          ]
        : [
            `Good attempt! Let's practice the full sentence now: "${originalText}"`,
            `You're on the right track. Let's try it like this: "${originalText}"`,
          ];
      const low_score_templates = [
        `Let's try that one from the beginning. Say: "${originalText}"`,
        `Let me help you with that. The sentence is: "${originalText}"`,
      ];

      let selectedTemplates;
      if (score > 0.6) selectedTemplates = high_score_templates;
      else if (score >= 0.4) selectedTemplates = medium_score_templates;
      else selectedTemplates = low_score_templates;

      return selectedTemplates[
        Math.floor(Math.random() * selectedTemplates.length)
      ];
    },
    [],
  );

  const handleUserSpeech = useCallback(
    async (transcript: string) => {
      const currentState = stateRef.current;
      const expectedLine = steps[currentState.currentStep];

      dispatch({ type: "START_PROCESSING_SPEECH" });
      dispatch({ type: "LISTEN_END" });
      setRealtimeSimilarity(null);
      setPartialTranscript("");

      if (!expectedLine || expectedLine.speaker?.trim() !== userRole.trim()) {
        console.warn("User speech received, but it's not their turn.");
        return;
      }

      const finalSimilarity = calculateAdvancedSimilarity(
        transcript,
        expectedLine.text,
        `step-${currentState.currentStep}`,
      );

      const userMessage: Message = {
        role: "user",
        content: transcript,
        timestamp: Date.now(),
        similarity: finalSimilarity,
      };
      setMessages((prev) => [userMessage, ...prev]);

      if (finalSimilarity.words?.length > 0) {
        const incorrectWords = finalSimilarity.words
          .filter((word) => !word.match)
          .map((word) => word.word);
        if (incorrectWords.length > 0) {
          recordPronunciationErrorsAction({
            incorrectWords,
            companionId,
            topicId,
          });
        }
      }

      const shouldAdvance =
        finalSimilarity.score >= SHOULDADVANCESCORETHERESHOLD;

      if (shouldAdvance) {
        console.log(`✅ Good score. Advancing.`);
        setRetryInfo(null);
        setTimeout(() => {
          dispatch({ type: "ADVANCE_STEP" });
        }, resolvedTimingSettings.stepTransitionDelay);
      } else {
        console.log(`🔄 Low score. Retrying.`);
        let retryMsgText: string;
        let assistantMessages: Message[];

        if (
          geminiFeedback === "gemini" &&
          finalSimilarity.score >= LOWSCORETHERESHOLD
        ) {
          const smartFeedbackResult = await getSmartRetryFeedbackAction({
            expectedSentence: expectedLine.text,
            userSentence: transcript,
          });

          if (smartFeedbackResult.success && smartFeedbackResult.focusPoint) {
            const { encouragingPhrase, focusPoint } = smartFeedbackResult;
            const initialMsg = `${encouragingPhrase || "Almost there!"} Let's focus on the phrase:`;
            const finalMsg = `Now, try the full sentence: "${expectedLine.text}"`;

            retryMsgText = `${initialMsg} "${focusPoint}" ${finalMsg}`;

            const now = Date.now();
            assistantMessages = [
              {
                role: "assistant",
                content: initialMsg,
                timestamp: now,
              },
              {
                role: "assistant",
                content: `"${focusPoint}"`,
                timestamp: now + 1,
              },
              {
                role: "assistant",
                content: finalMsg,
                timestamp: now + 2,
              },
            ];

            await speakAI(initialMsg);
            await speakAI(focusPoint);
            await speakAI(finalMsg);
          } else {
            retryMsgText = generateRetryMessage(
              expectedLine.text,
              finalSimilarity.score,
              transcript,
            );
            assistantMessages = [
              {
                role: "assistant",
                content: retryMsgText,
                timestamp: Date.now(),
              },
            ];
            await speakAI(retryMsgText);
          }
        } else {
          retryMsgText = generateRetryMessage(
            expectedLine.text,
            finalSimilarity.score,
            transcript,
          );
          assistantMessages = [
            {
              role: "assistant",
              content: retryMsgText,
              timestamp: Date.now(),
            },
          ];
          await speakAI(retryMsgText);
        }

        setMessages((prev) => [...assistantMessages, ...prev]);
        setRetryInfo({ message: retryMsgText, score: finalSimilarity.score });

        resetSimilarityContext(`step-${currentState.currentStep}`);
        dispatch({ type: "SET_USER_TURN" });
      }
    },
    [
      steps,
      userRole,
      geminiFeedback,
      generateRetryMessage,
      speakAI,
      companionId,
      topicId,
      resolvedTimingSettings.stepTransitionDelay,
    ],
  );

  const processFinalTranscript = useCallback(
    (transcript: string) => {
      if (!transcript.trim()) return;

      accumulatedTranscriptRef.current = (
        accumulatedTranscriptRef.current +
        " " +
        transcript
      ).trim();
      setPartialTranscript(accumulatedTranscriptRef.current);

      if (gracePeriodTimerRef.current) {
        clearTimeout(gracePeriodTimerRef.current);
      }

      const currentState = stateRef.current;
      const expectedLine = steps[currentState.currentStep];
      if (!expectedLine) return;

      const isLongSentence =
        expectedLine.text.split(/\s+/).length > LONG_SENTENCE_WORD_THRESHOLD;
      const gracePeriod = isLongSentence
        ? resolvedTimingSettings.responseWaitTime +
          LONG_SENTENCE_GRACE_PERIOD_MS_BONUS
        : resolvedTimingSettings.responseWaitTime;

      gracePeriodTimerRef.current = setTimeout(() => {
        const fullTranscript = accumulatedTranscriptRef.current.trim();
        accumulatedTranscriptRef.current = "";

        if (fullTranscript && !stateRef.current.isProcessingSpeech) {
          handleUserSpeech(fullTranscript);
        }
      }, gracePeriod);
    },
    [steps, resolvedTimingSettings.responseWaitTime, handleUserSpeech],
  );

  const endCall = useCallback((reason: string = "No reason specified") => {
    // Tránh gọi endCall nhiều lần liên tiếp
    if (
      stateRef.current.status === CallStatus.INACTIVE ||
      stateRef.current.status === CallStatus.FINISHED
    )
      return;

    const caller = getCallerInfo(2); // Lấy thông tin về hàm đã gọi endCall
    console.log(`[ACTION] Ending call. Reason: "${reason}". Called by: ${caller}`);
    dispatch({ type: "END_CALL", payload: { reason } });

    // Cần phải truyền lý do dừng vào audioPlayer.stop() để có thể phân biệt trong log của AudioPlayer
    audioPlayer.stop(new Error(`Call ended: "${reason}". Initiated by: ${caller}`));
    window.speechSynthesis?.cancel();

    deepgramClientRef.current?.requestClose();
    deepgramClientRef.current = null;

    if (microphoneRef.current) {
      microphoneRef.current.recorder?.stop();
      microphoneRef.current.stream.getTracks().forEach((track: any) => track.stop());
      microphoneRef.current = null;
    }

    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
  }, []); // `getCallerInfo` không cần trong dependency array


  const handleCompletedCall = useCallback(() => {
    endCall("Conversation completed naturally");
    onSessionComplete?.();
  }, [endCall, onSessionComplete]);

  const resetConversation = useCallback(() => {
    endCall("Resetting conversation via user action");
    dispatch({ type: "RESET" });
    setMessages([]);
    setPartialTranscript("");
  }, [endCall]);

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    inactivityTimerRef.current = setTimeout(() => {
      console.log(`⏰ Inactivity timeout reached. Ending call.`);
      endCall("Inactivity timeout triggered");
    }, resolvedTimingSettings.speechTimeout);
  }, [endCall, resolvedTimingSettings.speechTimeout]);

  const startCall = useCallback(async () => {
    resetConversation(); // Ensures clean state. This will call endCall internally.
    dispatch({ type: "STARTING_CALL" });

    try {
      const sessionResult = await startConversationSessionAction();
      if (!sessionResult.success || !sessionResult.token) {
        throw new Error(sessionResult.error || "Failed to start session.");
      }

      if (companionId) recordSessionStartAction(companionId);

      const client = createClient(sessionResult.token).listen.live({
        model: "nova-2",
        language: "en-US",
        interim_results: true,
        endpointing: 300,
        utterance_end_ms: 1000,
        keepalive: "true",
      });
      deepgramClientRef.current = client;

      client.on(LiveTranscriptionEvents.Open, async () => {
        console.log("✅ Deepgram connection opened.");
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        const recorder = new MediaRecorder(stream);
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0 && client.getReadyState() === 1) {
            client.send(e.data);
          }
        };
        microphoneRef.current = { stream, recorder };
        recorder.start(250);
        dispatch({ type: "CALL_STARTED" });
      });

      client.on(LiveTranscriptionEvents.Transcript, (data) => {
        const { is_final, channel } = data;
        const transcript = channel.alternatives[0].transcript;
        const currentState = stateRef.current;

        if (
          !transcript ||
          !currentState.isWaitingForUser ||
          currentState.isProcessingSpeech
        ) {
          return;
        }

        if (!currentState.isListening) {
          dispatch({ type: "LISTEN_START" });
        }

        resetInactivityTimer();

        if (is_final) {
          dispatch({ type: "LISTEN_END" });
          processFinalTranscript(transcript);
        } else {
          setPartialTranscript(transcript);
          const expectedLine = steps[currentState.currentStep];
          if (expectedLine) {
            const interimSimilarity = calculateAdvancedSimilarity(
              transcript,
              expectedLine.text,
              `interim-step-${currentState.currentStep}`,
            );
            setRealtimeSimilarity(interimSimilarity);
          }
        }
      });

      client.on(LiveTranscriptionEvents.Error, (e) => {
        console.error("Deepgram Error:", e);
        dispatch({
          type: "CALL_FAILED",
          payload: "A connection error occurred.",
        });
        endCall("Deepgram Client Error during transcription"); // Gán lý do cụ thể
      });
      client.on(LiveTranscriptionEvents.Close, () => {
        console.log("Deepgram connection closed.");
        endCall("Deepgram connection closed by server/client"); // Gán lý do cụ thể
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred.";
      dispatch({ type: "CALL_FAILED", payload: errorMessage });
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
      endCall(`Start call initialization failed: ${errorMessage}`); // Gán lý do cụ thể
    }
  }, [
    companionId,
    processFinalTranscript,
    resetConversation,
    resetInactivityTimer,
    steps,
    endCall,
  ]);

  const toggleMute = useCallback(() => {
    if (!microphoneRef.current) return;
    const audioTracks = microphoneRef.current.stream.getAudioTracks();
    if (audioTracks.length > 0) {
      audioTracks[0].enabled = !audioTracks[0].enabled;
      setIsMuted(!audioTracks[0].enabled);
    }
  }, []);

  const skipToStep = useCallback(
    (stepIndex: number) => {
      if (stepIndex >= 0 && stepIndex < steps.length) {
        console.log(`[ACTION] Skipping to step ${stepIndex}`);
        audioPlayer.stop(new Error(`Skipping to step ${stepIndex} (user action)`)); // Gán lý do cụ thể
        window.speechSynthesis.cancel();
        if (gracePeriodTimerRef.current)
          clearTimeout(gracePeriodTimerRef.current);
        accumulatedTranscriptRef.current = "";
        dispatch({ type: "SKIP_TO_STEP", payload: { stepIndex } });
      }
    },
    [steps.length],
  );

  const retryCurrentStep = useCallback(() => {
    if (currentLine && !stateRef.current.isProcessingSpeech) {
      console.log(`[ACTION] Retrying current step.`);
      audioPlayer.stop(new Error(`Retrying current step (user action)`)); // Gán lý do cụ thể
      window.speechSynthesis.cancel();
      setMessages((prev) => [
        { role: "assistant", content: currentLine.text, timestamp: Date.now() },
        ...prev,
      ]);
      speakAI(currentLine.text, true).then(() => {
        dispatch({ type: "SET_USER_TURN" });
      }).catch(err => {
        console.error("Error during retryCurrentStep speakAI:", err);
        // Có thể quyết định endCall tại đây nếu lỗi nghiêm trọng
      });
    }
  }, [currentLine, speakAI]);

  // --- DEBUGGING EFFECT: GIỮ NGUYÊN HOẶC XÓA NẾU KHÔNG CÓ LOG UNMOUNTED ---
  useEffect(() => {
    console.log("--- Conversation Hook MOUNTED ---");
    return () => {
      // Nếu không có log này thì có nghĩa component không bị unmount.
      // Bạn có thể xóa effect này nếu muốn.
      // console.error("--- Conversation Hook UNMOUNTED --- This might be the cause of the problem!");
    };
  }, []);

  // --- useEffect TRUNG TÂM (PHIÊN BẢN ỔN ĐỊNH) ---
  useEffect(() => {
    if (state.status !== CallStatus.ACTIVE) return;

    const line = steps[state.currentStep];
    if (!line) {
      handleCompletedCall();
      return;
    }

    setRetryInfo(null);

    const isAITurn = line.speaker?.trim() !== userRole.trim();
    let delayTimeout: NodeJS.Timeout;

    const processTurn = async () => {
      const currentState = stateRef.current;
      
      if (isAITurn) {
        if (currentState.isSpeaking || currentState.isProcessingSpeech) {
          console.log("useEffect guard: AI is already speaking or processing, skipping turn logic.");
          return;
        }

        dispatch({ type: "START_PROCESSING_SPEECH" });
        setMessages((prev) => [{ role: "assistant", content: line.text, timestamp: Date.now() }, ...prev]);

        try {
          await speakAI(line.text, true);
          delayTimeout = setTimeout(() => {
            dispatch({ type: "ADVANCE_STEP" });
          }, resolvedTimingSettings.stepTransitionDelay);
        } catch (error) {
          if (error instanceof Error && (error.message.includes("interrupted") || error.message.includes("stopped") || error.message.includes("ended"))) {
             console.warn(`AI speech was interrupted as expected. The flow will stop here for this turn. Reason: ${error.message}`);
             // Không làm gì cả, không chuyển step. Đảm bảo isProcessingSpeech được reset ở một nơi khác nếu cần.
             // Nếu không chuyển step, thì currentState.isProcessingSpeech vẫn là true, nó sẽ bị guard ở lần chạy useEffect tiếp theo.
             // Đây là một điểm cần chú ý.
          } else {
            console.error("Critical error during AI speech, ending call:", error);
            endCall("Critical speech error from speakAI catch block");
          }
        }
      } else { // Lượt của người dùng
        if (!currentState.isWaitingForUser && !currentState.isProcessingSpeech) {
          delayTimeout = setTimeout(() => {
            dispatch({ type: "SET_USER_TURN" });
            resetInactivityTimer();
          }, 500);
        }
      }
    };

    processTurn();

    return () => {
      if (delayTimeout) clearTimeout(delayTimeout);
    };
  }, [state.status, state.currentStep, endCall, handleCompletedCall, resolvedTimingSettings.stepTransitionDelay, resetInactivityTimer, speakAI, steps, userRole]);


  return {
    callState: { status: state.status, error: state.error },
    conversationState: {
      currentStep: state.currentStep,
      totalSteps: steps.length,
      isWaitingForUser: state.isWaitingForUser,
      // similarity không còn trong reducer state, nó là state phụ
      // bạn có thể trả về null hoặc giá trị khác nếu cần
      similarity: realtimeSimilarity,
    },
    realtimeSimilarity,
    messages,
    retryInfo,
    isSpeaking: state.isSpeaking,
    isListening: state.isListening,
    isMuted,
    currentLine,
    partialTranscript,
    highlightedWordIndex,
    isSpeakingScriptLine: state.isSpeakingScriptLine,
    isAnyoneSpeaking,
    startCall,
    endCall, // Trả về hàm endCall có lý do
    toggleMute,
    resetConversation,
    skipToStep,
    retryCurrentStep,
  };
};