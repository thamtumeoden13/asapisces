// Gợi ý: Đổi tên file này thành `hooks/use-conversation.ts`
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
import type { TimingSettings } from "@/types";

// --- Giao diện props mới ---
interface UseConversationProps {
  steps: TranscriptLine[];
  onSessionComplete?: () => void;
  timingSettings?: Partial<TimingSettings>;
}

export const useConversation = ({
  steps,
  onSessionComplete,
  timingSettings = {},
}: UseConversationProps) => {
  // --- STATE & REFS ---
  const resolvedTimingSettings: TimingSettings = {
    stepTransitionDelay: 1000,
    responseWaitTime: 2500,
    speechTimeout: timingSettings.speechTimeout ?? 5000,
    autoAdvance: timingSettings.autoAdvance ?? false,
    quickMode: timingSettings.quickMode ?? false,
    ...timingSettings,
  };

  const [callState, setCallState] = useState<VapiCallState>({
    status: CallStatus.INACTIVE,
  });
  const [conversationState, setConversationState] = useState<
    ConversationState & { similarity?: any; retryCounter?: number }
  >({
    currentStep: 0,
    totalSteps: steps.length,
    isWaitingForUser: false,
    similarity: null,
    retryCounter: 0,
  });
  const [messages, setMessages] = useState<
    Array<{
      role: "user" | "assistant";
      content: string;
      timestamp: number;
      similarity?: any;
    }>
  >([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [partialTranscript, setPartialTranscript] = useState<string>("");

  const deepgramClientRef = useRef<LiveClient | null>(null);
  const microphoneRef = useRef<{
    stream: MediaStream;
    recorder: MediaRecorder;
  } | null>(null);

  const currentStepRef = useRef(0);
  const isWaitingForUserRef = useRef(false);
  const isAwaitingAIRef = useRef(false);
  const processingUserInputRef = useRef(false);
  const conversationCompletedRef = useRef(false);
  const sessionCompleteCalledRef = useRef(false);
  const messagesRef = useRef(messages);
  const accumulatedTranscriptRef = useRef<string>("");
  const finalTranscriptGracePeriodRef = useRef<NodeJS.Timeout | null>(null);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const evaluatedMessagesRef = useRef<Set<string>>(new Set());
  const gwenTurnStartTimeRef = useRef<number>(0);
  const turnTimeoutRef = useRef<NodeJS.Timeout | null>(null);
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

  // --- HÀM TIỆN ÍCH (Ổn định hóa với useCallback) ---
  const getConversationBlock = useCallback(
    (
      steps: TranscriptLine[],
      startIndex: number,
      options: { maxWords?: number } = {}
    ) => {
      if (!steps[startIndex])
        return { speaker: null, text: "", endIndex: startIndex, wordCount: 0 };
      const speaker = steps[startIndex].speaker;
      let combinedText = "";
      let wordCount = 0;
      let endIndex = startIndex - 1;
      for (let i = startIndex; i < steps.length; i++) {
        if (steps[i].speaker !== speaker) break;
        const currentLineText = steps[i].text;
        const currentLineWordCount = currentLineText.split(/\s+/).length;
        if (
          options.maxWords &&
          wordCount + currentLineWordCount > options.maxWords &&
          wordCount > 0
        )
          break;
        combinedText += currentLineText + " ";
        wordCount += currentLineWordCount;
        endIndex = i;
        if (options.maxWords && wordCount > options.maxWords) break;
      }
      return { speaker, text: combinedText.trim(), endIndex, wordCount };
    },
    []
  );
  // ✨ NEW: Generate varied retry messages from Leo
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

  const currentStep = conversationState.currentStep;
  const currentBlock = useMemo(() => {
    const speaker = steps[currentStep]?.speaker;
    const options = speaker === "Gwen" ? { maxWords: 20 } : {};
    return getConversationBlock(steps, currentStep, options);
  }, [steps, currentStep, getConversationBlock]);

  const currentLine = {
    speaker: currentBlock.speaker,
    text: currentBlock.text,
  };

  // --- CÁC HÀM ĐIỀU KHIỂN CHÍNH ---

  const speakAI = useCallback((text: string) => {
    return new Promise<void>((resolve, reject) => {
      if (!text || typeof window === "undefined" || !window.speechSynthesis)
        return resolve();
      setIsSpeaking(true);
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US"; // Đảm bảo nói đúng ngôn ngữ
      utterance.onend = () => {
        setIsSpeaking(false);
        resolve();
      };
      utterance.onerror = (e) => {
        setIsSpeaking(false);
        console.error("SpeechSynthesis Error:", e);
        reject(e);
      };
      window.speechSynthesis.speak(utterance);
    });
  }, []);

  const endCall = useCallback(() => {
    if (
      callState.status === CallStatus.INACTIVE ||
      callState.status === CallStatus.FINISHED
    )
      return;
    console.log("🛑 Ending call...");
    setCallState({ status: CallStatus.FINISHED });

    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    if (finalTranscriptGracePeriodRef.current)
      clearTimeout(finalTranscriptGracePeriodRef.current);

    if (deepgramClientRef.current) {
      deepgramClientRef.current.finish();
      deepgramClientRef.current = null;
    }
    if (microphoneRef.current) {
      microphoneRef.current.recorder.stop();
      microphoneRef.current.stream.getTracks().forEach((track) => track.stop());
      microphoneRef.current = null;
    }
    window.speechSynthesis?.cancel();
    conversationCompletedRef.current = true;
  }, [callState.status]);

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    inactivityTimerRef.current = setTimeout(() => endCall(), 90000);
  }, [endCall]);

  const handleFinalSimilarityResult = useCallback(
    async (
      similarityResult: any,
      stepIndex: number,
      messageContent: string
    ) => {
      const evaluationKey = `${stepIndex}-${messageContent.trim()}`;
      if (
        evaluatedMessagesRef.current.has(evaluationKey) ||
        processingUserInputRef.current
      )
        return;
      processingUserInputRef.current = true;
      evaluatedMessagesRef.current.add(evaluationKey);
      const shouldAdvance = similarityResult.score >= 0.6;
      setConversationState((prev) => ({
        ...prev,
        similarity: similarityResult,
      }));

      const blockForAction = getConversationBlock(steps, stepIndex);
      if (shouldAdvance) {
        isAwaitingAIRef.current = true;
        const nextStep = blockForAction.endIndex + 1;
        setConversationState((prev) => ({
          ...prev,
          currentStep: nextStep,
          isWaitingForUser: false,
        }));
      } else {
        const retryMsg = generateRetryMessage(
          blockForAction.text,
          similarityResult.score,
          partialTranscript
        );
        if (typeof retryMsg === "string" && retryMsg.length > 0) {
          setMessages((prev) => [
            { role: "assistant", content: retryMsg, timestamp: Date.now() },
            ...prev,
          ]);
          await speakAI(retryMsg);
        }
        resetSimilarityContext(`step-${stepIndex}`);
        setConversationState((prev) => ({
          ...prev,
          isWaitingForUser: true,
          retryCounter: (prev.retryCounter || 0) + 1,
        }));
      }
      processingUserInputRef.current = false;
      if (!shouldAdvance) evaluatedMessagesRef.current.delete(evaluationKey);
    },
    [
      steps,
      partialTranscript,
      speakAI,
      getConversationBlock,
      generateRetryMessage,
    ]
  );
  // --- LOGIC XỬ LÝ LỜI NÓI CỦA NGƯỜI DÙNG (Độc lập với state bên ngoài) ---
  // Trong file hook của bạn

  // HÀM NÀY SẼ LÀM TẤT CẢ LOGIC XỬ LÝ
  const handleUserSpeech = useCallback(
    async (transcript: string) => {
      const stepIndex = currentStepRef.current;

      const evaluationKey = `${stepIndex}-${transcript}`;
      if (
        evaluatedMessagesRef.current.has(evaluationKey) ||
        processingUserInputRef.current
      )
        return;

      processingUserInputRef.current = true;
      evaluatedMessagesRef.current.add(evaluationKey);

      const blockToCompare = getConversationBlock(steps, stepIndex);
      if (blockToCompare.speaker !== "Gwen") {
        processingUserInputRef.current = false;
        return;
      }

      const similarityResult = calculateAdvancedSimilarity(
        transcript,
        blockToCompare.text,
        `step-${stepIndex}`
      );

      setMessages((prev) => [
        {
          role: "user",
          content: transcript,
          timestamp: Date.now(),
          similarity: similarityResult,
        },
        ...prev,
      ]);
      setPartialTranscript("");

      const shouldAdvance = similarityResult.score >= 0.7;
      setConversationState((prev) => ({
        ...prev,
        similarity: similarityResult,
      }));

      if (shouldAdvance) {
        console.log(`✅ Good score on step ${stepIndex}. Advancing.`);

        // --- ĐẶT CỜ KHI CHUẨN BỊ CHO AI NÓI ---
        isAwaitingAIRef.current = true;

        const nextStep = blockToCompare.endIndex + 1;
        setConversationState((prev) => ({
          ...prev,
          currentStep: nextStep,
          isWaitingForUser: false,
        }));
      } else {
        console.log(`🔄 Low score on step ${stepIndex}. Retrying.`);

        // --- ĐẶT CỜ NGAY LẬP TỨC KHI BẮT ĐẦU RETRY ---
        isAwaitingAIRef.current = true;
        console.log("🚫 User input locked for AI retry message.");

        const retryMsg = generateRetryMessage(
          blockToCompare.text,
          similarityResult.score,
          partialTranscript
        );
        setMessages((prev) => [
          { role: "assistant", content: retryMsg, timestamp: Date.now() },
          ...prev,
        ]);

        // Chờ AI nói xong
        await speakAI(retryMsg);

        // Sau khi AI nói xong, chuẩn bị cho người dùng thử lại
        console.log("🎤 AI retry message finished. Preparing for user input.");
        resetSimilarityContext(`step-${stepIndex}`);

        // Set isWaitingForUser để thiết lập lượt của Gwen, nhưng cờ isAwaitingAIRef vẫn là true
        // để useEffect có thể hạ nó xuống một cách an toàn.
        setConversationState((prev) => ({
          ...prev,
          isWaitingForUser: true,
          retryCounter: (prev.retryCounter || 0) + 1,
        }));
      }

      processingUserInputRef.current = false;
      if (!shouldAdvance) evaluatedMessagesRef.current.delete(evaluationKey);
    },
    [
      steps,
      partialTranscript,
      getConversationBlock,
      generateRetryMessage,
      speakAI,
    ]
  );

  const handleFinalTranscript = useCallback(
    (transcript: string) => {
      const messageContent = transcript.trim();
      if (!messageContent) return;

      console.log("🎤 Final transcript received:", messageContent);

      // --- THÊM LỚP BẢO VỆ MỚI ---
      // const lastAIMessage = messagesRef.current.find(
      //   (msg) => msg.role === "assistant"
      // );
      // // 1. Phớt lờ nếu transcript quá ngắn
      // if (messageContent.split(/\s+/).length < 2) {
      //   console.log(
      //     `🚫 Ignoring very short transcript (possible echo): "${messageContent}"`
      //   );
      //   return;
      // }
      // // 2. Phớt lờ nếu transcript giống một phần của câu AI vừa nói
      // if (lastAIMessage && lastAIMessage.content.includes(messageContent)) {
      //   console.log(
      //     `🚫 Ignoring transcript that matches last AI message (possible echo): "${messageContent}"`
      //   );
      //   return;
      // }
      // --- KẾT THÚC LỚP BẢO VỆ ---
      const timeSinceGwenTurnStart = Date.now() - gwenTurnStartTimeRef.current;
      if (gwenTurnStartTimeRef.current > 0 && timeSinceGwenTurnStart < 500) {
        console.log(
          `🚫 Ignoring early transcript (received ${timeSinceGwenTurnStart}ms after turn start): "${messageContent}"`
        );
        return;
      }

      // Lấy thông tin khối hiện tại để kiểm tra độ dài
      const blockInfo = getConversationBlock(steps, currentStepRef.current);

      console.log(
        `🎤 Processing final transcript for step ${currentStepRef.current}: "${messageContent}"`
      );
      const isLongSentence = blockInfo.text.split(/\s+/).length > 20;

      if (isLongSentence) {
        // Gom các bản ghi final cho câu dài
        accumulatedTranscriptRef.current = (
          accumulatedTranscriptRef.current +
          " " +
          messageContent
        ).trim();
        setPartialTranscript(accumulatedTranscriptRef.current); // Cập nhật UI để người dùng thấy

        if (finalTranscriptGracePeriodRef.current)
          clearTimeout(finalTranscriptGracePeriodRef.current);

        finalTranscriptGracePeriodRef.current = setTimeout(() => {
          const fullTranscript = accumulatedTranscriptRef.current.trim();
          if (fullTranscript) {
            console.log(
              "🎤 Long sentence grace period ended. Processing:",
              fullTranscript
            );
            handleUserSpeech(fullTranscript); // <-- GỌI handleUserSpeech
          }
          accumulatedTranscriptRef.current = "";
        }, resolvedTimingSettings.responseWaitTime);
      } else {
        // Với câu ngắn, xử lý ngay lập tức
        console.log("🎤 Short sentence received. Processing:", messageContent);
        handleUserSpeech(messageContent); // <-- GỌI handleUserSpeech
      }
    },
    [
      steps,
      getConversationBlock,
      resolvedTimingSettings.responseWaitTime,
      handleUserSpeech,
    ]
  );

  const startCall = useCallback(async () => {
    setCallState({ status: CallStatus.CONNECTING });
    resetConversation(); // Reset lại mọi thứ trước khi bắt đầu
    conversationCompletedRef.current = false;
    sessionCompleteCalledRef.current = false;

    try {
      const response = await fetch("/api/deepgram");
      const data = await response.json();
      if (!data.deepgramToken) throw new Error("Failed to get Deepgram token.");

      const client = createClient(data.deepgramToken).listen.live({
        model: "nova-2",
        language: "en-US",
        smart_format: true,
        interim_results: true,
        keepalive: "true",
      });
      deepgramClientRef.current = client;

      client.on(LiveTranscriptionEvents.Open, async () => {
        console.log("✅ Deepgram connection established.");
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
        if (
          !transcript ||
          isAwaitingAIRef.current ||
          !isWaitingForUserRef.current
        )
          return;
        resetInactivityTimer();
        if (data.is_final && !processingUserInputRef.current) {
          handleFinalTranscript(transcript); // <-- Đã kết nối đúng
        } else {
          setPartialTranscript(transcript);
        }
      });

      client.on(LiveTranscriptionEvents.Error, (e) => {
        console.error("❌ Deepgram WebSocket Error:", e);
        endCall();
      });
      client.on(LiveTranscriptionEvents.Close, (e) => {
        console.log("ℹ️ Deepgram connection closed.", e);
        endCall();
      });
    } catch (error) {
      setCallState({
        status: CallStatus.ERROR,
        error: (error as Error).message,
      });
    }
  }, [endCall, handleFinalTranscript, resetInactivityTimer]);

  const resetConversation = useCallback(() => {
    endCall();
    setConversationState({
      currentStep: 0,
      totalSteps: steps.length,
      isWaitingForUser: false,
      similarity: null,
      retryCounter: 0,
    });
    setMessages([]);
    setPartialTranscript("");
    // ... dọn dẹp các refs khác nếu cần ...
  }, [endCall, steps.length]);

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
  }, [currentLine.text]);

  const manualTriggerLeo = useCallback(() => {
    if (currentLine?.speaker === "Leo") speakAI(currentLine.text);
  }, [currentLine, speakAI]);

  // --- useEffect TRUNG TÂM ĐIỀU KHIỂN LUỒNG HỘI THOẠI ---
  useEffect(() => {
    if (callState.status !== "ACTIVE" || conversationCompletedRef.current)
      return;

    let isCancelled = false;
    let keepAliveInterval: NodeJS.Timeout | null = null;
    if (turnTimeoutRef.current) {
      clearTimeout(turnTimeoutRef.current);
    }
    if (turnTimeoutRef.current) {
      clearTimeout(turnTimeoutRef.current);
    }
    const processTurn = async () => {
      if (isCancelled) return;
      const block = getConversationBlock(steps, currentStep);

      if (!block.speaker) {
        if (currentStep >= steps.length && !sessionCompleteCalledRef.current) {
          console.log("🎉 Conversation completed!");
          sessionCompleteCalledRef.current = true;
          onSessionComplete?.();
          endCall();
        }
        return;
      }

      if (block.speaker === "Leo") {
        const alreadySent = messagesRef.current.some(
          (msg) => msg.content === block.text && msg.role === "assistant"
        );
        if (alreadySent) return;

        const client = deepgramClientRef.current;
        if (client && client.getReadyState() === 1) {
          keepAliveInterval = setInterval(() => {
            console.log("➡️ Sending KeepAlive to Deepgram");
            client.keepAlive();
          }, 10000); // Gửi mỗi 10 giây
        }
        console.log(`🗣️ Leo's turn (step ${currentStep})`);
        setMessages((prev) => [
          { role: "assistant", content: block.text, timestamp: Date.now() },
          ...prev,
        ]);
        if (microphoneRef.current?.recorder.state === "recording") {
          microphoneRef.current.recorder.pause();
          console.log("🎤 Mic recorder paused.");
        }
        await speakAI(block.text);
        setTimeout(() => {
          if (microphoneRef.current?.recorder.state === "paused") {
            microphoneRef.current.recorder.resume();
            console.log("🎤 Mic recorder resumed.");
          }
        }, 300);

        if (keepAliveInterval) {
          clearInterval(keepAliveInterval);
          keepAliveInterval = null;
        }
        if (!isCancelled) {
          const nextStep = block.endIndex + 1;
          console.log(`🎤 Leo finished. Advancing to step ${nextStep}.`);
          setConversationState((prev) => ({ ...prev, currentStep: nextStep }));
        }
      } else if (block.speaker === "Gwen") {
        if (!isWaitingForUserRef.current) {
          if (turnTimeoutRef.current) {
            clearTimeout(turnTimeoutRef.current);
          }
          turnTimeoutRef.current = setTimeout(() => {
            if (isCancelled) return;
            console.log(
              `👤 Gwen's turn (step ${currentStep}). Listener is now active.`
            );

            // Ghi lại thời điểm bắt đầu lắng nghe
            gwenTurnStartTimeRef.current = Date.now();

            isAwaitingAIRef.current = false;
            resetInactivityTimer();
            setConversationState((prev) => ({
              ...prev,
              isWaitingForUser: true,
              feedback: `🎯 Your turn: "${block.text}"`,
            }));
          }, 750);
        }
      }
    };

    turnTimeoutRef.current = setTimeout(processTurn, 100);
    return () => {
      isCancelled = true;

      if (turnTimeoutRef.current) {
        clearTimeout(turnTimeoutRef.current);
      }
      if (keepAliveInterval) {
        clearInterval(keepAliveInterval);
      }
    };
  }, [currentStep, callState.status, conversationState.retryCounter]);

  // --- RETURN API CỦA HOOK ---
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
