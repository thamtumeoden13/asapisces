"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import {
  calculateAdvancedSimilarity,
  resetSimilarityContext,
} from "@/lib/enhanced-similarity-for-long-sentences";
import { VapiEventAnalyzer } from "@/lib/vapi-event-analyzer";
import { VapiMessageAnalyzer } from "@/lib/vapi-message-analyzer";
import type {
  VapiMessage,
  VapiCallState,
  ConversationState,
  TranscriptLine,
} from "@/types/podcast";
import { CallStatus } from "@/types/podcast";
import { TimingSettings } from "@/types";

import {
  createClient,
  LiveClient,
  LiveTranscriptionEvents,
} from "@deepgram/sdk";

interface UseConversationProps {
  steps: TranscriptLine[];
  voiceId: string; // Sử dụng Voice ID của ElevenLabs
  companionId: string; // ID của Companion (Leo)
  onSessionComplete?: () => void;
  timingSettings?: Partial<TimingSettings>;
}

export const useConversation = ({
  steps,
  voiceId,
  companionId,
  onSessionComplete,
  timingSettings = {},
}: UseConversationProps) => {
  // THIẾT LẬP GIÁ TRỊ MẶC ĐỊNH
  const resolvedTimingSettings: TimingSettings = {
    stepTransitionDelay: 1000,
    speechTimeout: 3000,
    autoAdvance: true,
    quickMode: false,
    responseWaitTime: 2500, // Giá trị mặc định cho grace period
    ...timingSettings, // Ghi đè bằng các giá trị được truyền vào
  };

  const [debugEvents, setDebugEvents] = useState<any[]>([]);
  const [debugMessages, setDebugMessages] = useState<any[]>([]);

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
  const [partialTranscript, setPartialTranscript] = useState<string>("");
  const [speechBuffer, setSpeechBuffer] = useState<string[]>([]);

  const [speechProgress, setSpeechProgress] = useState<{
    wordCount: number;
    expectedWords: number;
    completionPercent: number;
    isMinimumMet: boolean;
    hasMinimumWords: boolean; // ✨ NEW: Track if 50% words reached
  }>({
    wordCount: 0,
    expectedWords: 0,
    completionPercent: 0,
    isMinimumMet: false,
    hasMinimumWords: false, // ✨ NEW
  });

  // ✨ NEW: Enhanced analyzers for debugging
  const eventAnalyzer = useRef(new VapiEventAnalyzer());
  const messageAnalyzer = useRef(new VapiMessageAnalyzer());

  // --- CÁC REFS (Loại bỏ VAPI, thêm Deepgram & Audio) ---
  const deepgramClientRef = useRef<LiveClient | null>(null);
  const microphoneRef = useRef<{
    mediaStream: MediaStream;
    recorder: MediaRecorder;
  } | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const speechBufferTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastPartialUpdateRef = useRef<number>(0);
  const speechEndDelayRef = useRef<NodeJS.Timeout | null>(null);
  // From Gemini
  const accumulatedTranscriptRef = useRef<string>("");
  const finalTranscriptGracePeriodRef = useRef<NodeJS.Timeout | null>(null);

  // ✨ ENHANCED: Speech timing and completion tracking with new thresholds
  const speechCompletionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const speechStartTimeRef = useRef<number>(0);
  const minimumSpeechDurationRef = useRef<number>(6000); // Tăng từ 4000ms lên 6000ms (6 giây)
  const speechWaitTimeoutRef = useRef<NodeJS.Timeout | null>(null); // ✨ NEW: For 2-second wait after speech ends

  // Refs for managing async operations and preventing infinite loops
  const currentStepRef = useRef<number>(0);
  const isCallReadyRef = useRef(false);
  const messagesRef = useRef(messages);
  const lastProcessedMessageRef = useRef<string>("");
  const sentMessagesRef = useRef<Set<string>>(new Set());
  const conversationCompletedRef = useRef(false);
  const sessionCompleteCalledRef = useRef(false);
  const currentTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const processingUserInputRef = useRef(false);
  const isAwaitingAIRef = useRef(false); // THÊM DÒNG NÀY
  const lastSimilarityResultRef = useRef<any>(null);
  const currentUserSpeechRef = useRef<string>("");
  const speechEndTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const evaluatedMessagesRef = useRef<Set<string>>(new Set());

  // State tracking refs
  const isWaitingForUserRef = useRef(false);
  const currentSpeakerRef = useRef<string>("");
  const callStatusRef = useRef<string>(CallStatus.INACTIVE);

  const currentStep = conversationState.currentStep;
  // From Gemini
  // const currentLine = steps[currentStep] || null;

  // Calculate speaking time based on text length and speaking rate
  const calculateSpeakingTime = useCallback((text: string): number => {
    const words = text.split(/\s+/).length;
    const baseTimePerWord = 400;
    const bufferTime = 2000;
    const minimumTime = 3000;

    const calculatedTime = words * baseTimePerWord + bufferTime;
    return Math.max(calculatedTime, minimumTime);
  }, []);

  // Function to send Leo's message
  const sendLeoMessage = useCallback(
    (line: TranscriptLine, stepIndex: number) => {
      const speakingTime = calculateSpeakingTime(line.text);
      sentMessagesRef.current.add(line.text.trim());

      const immediateMessage = {
        role: "assistant" as const,
        content: line.text,
        timestamp: Date.now(),
      };

      setMessages((prev) => [immediateMessage, ...prev]);

      // try {
      //   vapi.send({
      //     type: "add-message",
      //     message: {
      //       role: "assistant",
      //       content: line.text,
      //     },
      //   });

      //   setTimeout(() => {
      //     try {
      //       vapi.send({
      //         type: "say",
      //         message: line.text,
      //       });
      //     } catch (error) {
      //       console.log("ℹ️ Say command not available:", error);
      //     }
      //   }, 100);
      // } catch (error) {
      //   console.error("❌ Failed to send Leo's message to VAPI:", error);
      // }

      console.log(
        `🎤 Sending Leo's message immediately (step ${stepIndex}):`,
        line.text
      );
      return speakingTime;
    },
    [calculateSpeakingTime]
  );

  // --- CÁC HÀM ĐIỀU KHIỂN MỚI ---

  // 1. Hàm phát giọng nói của AI qua ElevenLabs
  const speakAI = useCallback(
    (text: string) => {
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

          audioPlayerRef.current.src = audioUrl;
          audioPlayerRef.current.onended = () => {
            setIsSpeaking(false);
            URL.revokeObjectURL(audioUrl);
            resolve();
          };
          audioPlayerRef.current.onerror = (e) => {
            setIsSpeaking(false);
            URL.revokeObjectURL(audioUrl);
            reject(e);
          };

          await audioPlayerRef.current.play();
        } catch (error) {
          setIsSpeaking(false);
          console.error("Speak AI error:", error);
          reject(error);
        }
      });
    },
    [voiceId]
  );
  // From Gemini
  const getConversationBlock = useCallback(
    (
      steps: TranscriptLine[],
      startIndex: number,
      options: { maxWords?: number } = {}
    ) => {
      if (!steps[startIndex]) {
        return { speaker: null, text: "", endIndex: startIndex, wordCount: 0 };
      }

      const speaker = steps[startIndex].speaker;
      let combinedText = "";
      let wordCount = 0;
      let endIndex = startIndex - 1; // Bắt đầu từ -1 so với startIndex

      for (let i = startIndex; i < steps.length; i++) {
        // Dừng lại nếu người nói thay đổi
        if (steps[i].speaker !== speaker) {
          break;
        }

        const currentLineText = steps[i].text;
        const currentLineWordCount = currentLineText.split(/\s+/).length;

        // KIỂM TRA GIỚI HẠN TỪ (chỉ áp dụng nếu có options.maxWords)
        if (
          options.maxWords &&
          wordCount + currentLineWordCount > options.maxWords &&
          wordCount > 0
        ) {
          // Dừng lại TRƯỚC khi thêm dòng này nếu nó làm tràn bộ đệm
          // và bộ đệm đã có nội dung.
          break;
        }

        // Nếu không bị giới hạn, thêm dòng hiện tại vào khối
        combinedText += currentLineText + " ";
        wordCount += currentLineWordCount;
        endIndex = i;

        // Dừng lại NẾU chỉ cần xử lý một dòng mà dòng đó đã vượt quá giới hạn
        // (trường hợp một câu đơn lẻ đã rất dài)
        if (options.maxWords && wordCount > options.maxWords) {
          break;
        }
      }

      return {
        speaker,
        text: combinedText.trim(),
        endIndex, // Chỉ số của dòng cuối cùng trong khối đã được xử lý
        wordCount,
      };
    },
    []
  );

  // SỬA ĐỔI LOGIC TÍNH TOÁN currentBlock
  const currentBlock = useMemo(() => {
    const speaker = steps[currentStep]?.speaker;

    if (speaker === "Gwen") {
      // Áp dụng giới hạn 20 từ cho người dùng
      return getConversationBlock(steps, currentStep, { maxWords: 20 });
    }

    // Không áp dụng giới hạn cho AI (Leo)
    return getConversationBlock(steps, currentStep);
  }, [steps, currentStep, getConversationBlock]);

  const currentLine = useMemo(
    () => ({
      speaker: currentBlock.speaker,
      text: currentBlock.text,
    }),
    [currentBlock.speaker, currentBlock.text]
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

  // Handle final similarity result and determine next action
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
      ) {
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

      // ✨ CHANGED: Use 0.7 threshold instead of 0.5
      const shouldAdvance = similarityResult.score >= 0.7;
      setConversationState((prev) => ({
        ...prev,
        similarity: similarityResult,
      }));
      // const currentStepLine = steps[stepIndex];

      console.log(
        `📊 Final evaluation for step ${stepIndex}: ${similarityResult.score.toFixed(2)} (${shouldAdvance ? "ADVANCE" : "RETRY"})`
      );

      setConversationState((prev) => ({
        ...prev,
        feedback: similarityResult.feedback,
        similarity: similarityResult,
      }));

      if (shouldAdvance) {
        // From Gemini
        // ✨ ADVANCE: Move to next step
        console.log("✅ Good score! Moving to the end of the current block.");
        isAwaitingAIRef.current = true; // 🚩🚩🚩 ĐẶT CỜ Ở ĐÂY 🚩🚩🚩
        console.log("🚫 User input is now locked until AI finishes.");
        // TÍNH TOÁN BƯỚC TIẾP THEO
        const blockInfo = getConversationBlock(steps, stepIndex);
        const nextStep = blockInfo.endIndex + 1; // Nhảy đến bước sau khi khối kết thúc

        setConversationState((prev) => ({
          ...prev,
          // currentStep: prev.currentStep + 1,
          currentStep: nextStep,
          isWaitingForUser: false,
        }));
        resetSimilarityContext(`${companionId}-step-${stepIndex}`);

        // Clear speech buffer
        setSpeechBuffer([]);
        setPartialTranscript("");
      } else {
        // ✨ LOGIC RETRY KHI NÓI SAI ✨
        console.log("🔄 Low score! Leo will ask Gwen to repeat.");

        const randomRetryMessage = generateRetryMessage(
          currentLine.text,
          similarityResult.score,
          partialTranscript
        );

        // Thêm tin nhắn của AI vào lịch sử chat
        const leoRetryMessage = {
          role: "assistant" as const,
          content: randomRetryMessage,
          timestamp: Date.now(),
        };
        setMessages((prev) => [leoRetryMessage, ...prev]);

        await speakAI(randomRetryMessage);

        // // Dừng Deepgram và cho AI nói
        // if (deepgramClientRef.current?.getReadyState() === 1)
        //   deepgramClientRef.current?.pause(true);
        // await speakAI(randomRetryMessage);
        // if (deepgramClientRef.current?.getReadyState() === 1)
        //   deepgramClientRef.current?.pause(false);

        // Reset context và chuẩn bị cho người dùng thử lại
        const contextId = `${companionId}-step-${stepIndex}`;
        resetSimilarityContext(contextId);

        setConversationState((prev) => ({ ...prev, isWaitingForUser: true }));
        processingUserInputRef.current = false;

        // Dọn dẹp
        evaluatedMessagesRef.current.delete(
          `${stepIndex}-${messageContent.trim()}`
        );
        setPartialTranscript("");
      }

      if (shouldAdvance) {
        setTimeout(() => {
          processingUserInputRef.current = false;
        }, 2000);
      }
    },
    [
      companionId,
      steps,
      speakAI,
      getConversationBlock,
      generateRetryMessage,
      currentLine,
      partialTranscript,
    ]
  );

  // 3. Hàm đánh giá transcript (tách ra từ logic cũ)
  const evaluateTranscript = useCallback(
    (transcript: string) => {
      const contextId = `step-${currentStepRef.current}`; // ContextId đơn giản hơn
      const similarityResult = calculateAdvancedSimilarity(
        transcript,
        currentLine!.text,
        contextId,
        {
          /* options */
        }
      );

      const enhancedMessage = {
        role: "user" as const,
        content: transcript,
        timestamp: Date.now(),
        similarity: similarityResult,
      };
      setMessages((prev) => [enhancedMessage, ...prev]);

      handleFinalSimilarityResult(
        similarityResult,
        currentStepRef.current,
        transcript
      );

      setPartialTranscript("");
    },
    [currentLine, handleFinalSimilarityResult]
  );

  // 2. Hàm xử lý khi transcript cuối cùng được nhận từ Deepgram
  const handleFinalTranscript = useCallback(
    (transcript: string) => {
      // Logic này gần như là sự kết hợp của handleTranscriptMessage và processTranscriptImmediate cũ
      const messageContent = transcript.trim();
      if (!messageContent) return;

      // Áp dụng logic đệm cho câu dài (giữ nguyên)
      const isLongSentence =
        currentLine && currentLine.text.split(/\s+/).length > 10;
      if (isLongSentence) {
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
            // Gọi hàm đánh giá
            evaluateTranscript(fullTranscript);
          }
          accumulatedTranscriptRef.current = "";
        }, resolvedTimingSettings.responseWaitTime);
      } else {
        // Xử lý câu ngắn ngay lập tức
        evaluateTranscript(messageContent);
      }
    },
    [currentLine, resolvedTimingSettings.responseWaitTime, evaluateTranscript]
  );

  const calculateSpeechProgress = useCallback(
    (spokenText: string, expectedText: string) => {
      const spokenWords = spokenText
        .trim()
        .split(/\s+/)
        .filter((word) => word.length > 0);
      const expectedWords = expectedText
        .trim()
        .split(/\s+/)
        .filter((word) => word.length > 0);

      const wordCount = spokenWords.length;
      const expectedWordCount = expectedWords.length;
      const completionPercent = Math.round(
        (wordCount / expectedWordCount) * 100
      );
      const isMinimumMet = completionPercent >= 30; // Giảm từ 40% xuống 30%
      const hasMinimumWords = wordCount >= Math.ceil(expectedWordCount * 0.3); // Giảm từ 0.4 xuống 0.3

      console.log(
        `📊 Speech Progress: ${wordCount}/${expectedWordCount} words (${completionPercent}%) - 30% threshold: ${hasMinimumWords}`
      );

      return {
        wordCount,
        expectedWords: expectedWordCount,
        completionPercent,
        isMinimumMet,
        hasMinimumWords,
      };
    },
    []
  );

  // ✨ NEW: Enhanced transcript message handler with long sentence support
  const handleTranscriptMessage = useCallback(
    (message: VapiMessage, analysis: any) => {
      const messageContent = message.transcript?.trim();

      if (!messageContent) {
        console.log("🚫 Empty transcript, skipping");
        return;
      }

      // ✨ ENHANCED: Handle partial transcripts for long sentences
      if (message.transcriptType === "partial") {
        if (
          isWaitingForUserRef.current &&
          message.role === "user" &&
          currentSpeakerRef.current === "Gwen"
        ) {
          console.log(
            "⏸️ User speaking (partial):",
            messageContent.substring(0, 100) + "..."
          );

          // Update partial transcript for UI feedback - KHÔNG reset timer ở đây
          setPartialTranscript(messageContent);
          lastPartialUpdateRef.current = Date.now();

          // ✨ NEW: Calculate and update speech progress
          if (currentLine) {
            const progress = calculateSpeechProgress(
              messageContent,
              currentLine.text
            );
            setSpeechProgress(progress);

            console.log(
              `📈 Speech progress: ${progress.completionPercent}% (${progress.wordCount}/${progress.expectedWords} words) - Has minimum words: ${progress.hasMinimumWords}`
            );
          }

          // Add to speech buffer - tăng buffer size
          setSpeechBuffer((prev) => {
            const newBuffer = [...prev, messageContent].slice(-10); // Tăng từ 5 lên 10
            return newBuffer;
          });

          // KHÔNG reset speechEndDelayRef ở đây để tránh cắt transcript
        }
        return;
      }

      // ✨ ENHANCED: Handle final transcripts with completeness check
      if (message.transcriptType === "final") {
        // Enhanced guards for user messages
        // From Gemini
        if (message.role === "user") {
          // 🚩🚩🚩 THÊM LỚP BẢO VỆ NÀY 🚩🚩🚩
          if (isAwaitingAIRef.current) {
            console.log(
              "🚫 Ignoring user transcript - System is awaiting AI response.",
              messageContent
            );
            return;
          }
          // 🚩🚩🚩 KẾT THÚC LỚP BẢO VỆ 🚩🚩🚩

          if (!analysis.shouldProcess) {
            console.log(
              `🚫 Ignoring user transcript - ${analysis.reason}:`,
              messageContent
            );
            return;
          }

          const isLongSentence =
            currentLine && currentLine.text.split(/\s+/).length > 10;

          // XỬ LÝ NGAY LẬP TỨC VỚI CÂU NGẮN
          if (!isLongSentence) {
            console.log("🏃 Short sentence detected, processing immediately.");
            processTranscriptImmediate(message, messageContent);
            return;
          }

          // LOGIC ĐỆM CHO CÂU DÀI
          console.log("🧠 Long sentence detected, using buffering logic.");

          // 1. Nối bản ghi mới vào bộ đệm
          accumulatedTranscriptRef.current = (
            accumulatedTranscriptRef.current +
            " " +
            messageContent
          ).trim();
          console.log(
            `📝 Transcript buffer updated: "${accumulatedTranscriptRef.current}"`
          );

          // Cập nhật giao diện với transcript đang được tích lũy
          setPartialTranscript(accumulatedTranscriptRef.current);

          // 2. Xóa bộ đếm thời gian cũ nếu có (vì người dùng đã nói tiếp)
          if (finalTranscriptGracePeriodRef.current) {
            clearTimeout(finalTranscriptGracePeriodRef.current);
          }

          // 3. Đặt một bộ đếm thời gian mới
          // const GRACE_PERIOD_MS = 5000; // 2.5 giây. Bạn có thể điều chỉnh con số này.
          const GRACE_PERIOD_MS = resolvedTimingSettings.responseWaitTime;
          console.log(
            `⏳ Setting a ${GRACE_PERIOD_MS}ms grace period (user setting)...`
          );

          finalTranscriptGracePeriodRef.current = setTimeout(() => {
            console.log(
              "⏰ Grace period ended. Evaluating buffered transcript."
            );
            const fullTranscript = accumulatedTranscriptRef.current.trim();

            if (fullTranscript) {
              // Tạo một đối tượng message giả để truyền đi, chứa toàn bộ transcript
              const combinedMessage = {
                ...message,
                transcript: fullTranscript,
              };
              processTranscriptImmediate(combinedMessage, fullTranscript);
            }

            // 4. Dọn dẹp sau khi xử lý
            accumulatedTranscriptRef.current = "";
            finalTranscriptGracePeriodRef.current = null;
            console.log("🧹 Buffer cleared.");
          }, GRACE_PERIOD_MS);
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

          // Check if this is a message we sent
          const isOurMessage = sentMessagesRef.current.has(messageContent);
          if (isOurMessage) {
            console.log(
              "🎯 This is our sent message, already displayed, skipping:",
              messageContent
            );
            return;
          }

          console.log("🤖 Processing assistant transcript:", messageContent);
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
      }
    },
    [
      currentLine,
      companionId,
      handleFinalSimilarityResult,
      calculateSpeechProgress,
    ]
  );

  // ✨ ENHANCED: Process user transcript with smart timing for long sentences
  const processUserTranscript = useCallback(
    (message: VapiMessage, messageContent: string) => {
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

      // ✨ NEW: Check if transcript is too short compared to expected
      const expectedWordCount = currentLine!.text.split(/\s+/).length;
      const spokenWords = messageContent.split(/\s+/).length;

      if (expectedWordCount > 10 && spokenWords < expectedWordCount * 0.2) {
        console.log(
          `🚫 Transcript too short for long sentence: ${spokenWords}/${expectedWordCount} words, waiting for more...`
        );
        return;
      }

      // Continue with existing logic...
      const progress = calculateSpeechProgress(
        messageContent,
        currentLine!.text
      );
      setSpeechProgress(progress);

      const speechDuration = Date.now() - speechStartTimeRef.current;
      const hasMinimumDuration =
        speechDuration >= minimumSpeechDurationRef.current;
      const hasMinimumWords = progress.hasMinimumWords; // ✨ NEW: Use the 50% word threshold

      // ✨ NEW: Check if this is a long sentence (>10 words)
      const isLongSentence = expectedWordCount > 10;

      console.log(
        `⏱️ Speech Analysis for ${isLongSentence ? "LONG" : "SHORT"} sentence (${expectedWordCount} words):`
      );
      console.log(
        `   Duration: ${speechDuration}ms (min: ${minimumSpeechDurationRef.current}ms)`
      );
      console.log(
        `   Words spoken: ${progress.wordCount}/${progress.expectedWords} (${progress.completionPercent}%)`
      );
      console.log(`   Has 50% words: ${hasMinimumWords}`);
      console.log(
        `   Should process immediately: ${hasMinimumWords && hasMinimumDuration}`
      );

      // ✨ ENHANCED: Different logic for long vs short sentences
      if (isLongSentence) {
        // For long sentences, require BOTH conditions: sufficient words AND sufficient time
        if (hasMinimumWords && speechDuration >= 5000) {
          // Tăng từ 3000ms lên 5000ms (5 giây)
          console.log(
            "✅ Long sentence: 40% words + 5s duration reached, processing immediately"
          );
          processTranscriptImmediate(message, messageContent);
        } else {
          console.log("⏳ Long sentence: Waiting longer for completion...");

          // Clear any existing wait timeout
          if (speechWaitTimeoutRef.current) {
            clearTimeout(speechWaitTimeoutRef.current);
          }

          // Set 6-second wait timeout for long sentences
          speechWaitTimeoutRef.current = setTimeout(() => {
            console.log(
              "⏰ Long sentence: 6-second wait completed, processing now..."
            );
            processTranscriptImmediate(message, messageContent);
          }, 6000); // Tăng từ 4000ms lên 6000ms
        }
      } else {
        // For short sentences, use original logic
        if (!hasMinimumDuration || !hasMinimumWords) {
          console.log("⏳ Short sentence: Waiting for completion...");

          if (speechCompletionTimeoutRef.current) {
            clearTimeout(speechCompletionTimeoutRef.current);
          }

          speechCompletionTimeoutRef.current = setTimeout(() => {
            console.log(
              "⏰ Short sentence: Completion timeout reached, processing now..."
            );
            processTranscriptImmediate(message, messageContent);
          }, 2000);

          return;
        }

        // Process immediately if conditions are met
        processTranscriptImmediate(message, messageContent);
      }
    },
    [companionId, currentLine, calculateSpeechProgress]
  );

  // ✨ NEW: Immediate transcript processing
  const processTranscriptImmediate = useCallback(
    (message: VapiMessage, messageContent: string) => {
      // Clear all wait timeouts
      if (speechWaitTimeoutRef.current) {
        clearTimeout(speechWaitTimeoutRef.current);
        speechWaitTimeoutRef.current = null;
      }

      if (speechCompletionTimeoutRef.current) {
        clearTimeout(speechCompletionTimeoutRef.current);
        speechCompletionTimeoutRef.current = null;
      }

      const contextId = `${companionId}-step-${currentStepRef.current}`;

      const similarityResult = calculateAdvancedSimilarity(
        messageContent,
        currentLine!.text,
        contextId,
        {
          allowPartial: false,
          semanticMatching: true,
          strictMode: false,
        }
      );

      const enhancedMessage = {
        role: message.role as "user" | "assistant",
        content: messageContent,
        timestamp: Date.now(),
        similarity: similarityResult,
        isPartial: false,
      };

      setMessages((prev) => [enhancedMessage, ...prev]);
      handleFinalSimilarityResult(
        similarityResult,
        currentStepRef.current,
        messageContent
      );

      // Clear partial transcript and progress after processing
      setPartialTranscript("");
      setSpeechBuffer([]);
      setSpeechProgress({
        wordCount: 0,
        expectedWords: 0,
        completionPercent: 0,
        isMinimumMet: false,
        hasMinimumWords: false, // ✨ NEW
      });
    },
    [companionId, currentLine, handleFinalSimilarityResult]
  );

  const handleError = useCallback((error: Error) => {
    console.error("❌ VAPI Error:", error);
    setCallState({ status: CallStatus.ERROR, error: error.message });
    callStatusRef.current = CallStatus.ERROR;
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
    if (currentTimeoutRef.current) clearTimeout(currentTimeoutRef.current);
    if (finalTranscriptGracePeriodRef.current)
      clearTimeout(finalTranscriptGracePeriodRef.current);

    deepgramClientRef.current?.finish();
    deepgramClientRef.current = null;

    if (microphoneRef.current) {
      microphoneRef.current.recorder.stop();
      microphoneRef.current.stream.getTracks().forEach((track) => track.stop());
      microphoneRef.current = null;
    }

    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current.src = "";
    }

    // Reset các trạng thái khác nếu cần
    conversationCompletedRef.current = true;
  }, [callState.status]);

  const toggleMute = useCallback(() => {
    if (!microphoneRef.current) return;
    const audioTracks = microphoneRef.current.mediaStream.getAudioTracks();
    if (audioTracks.length > 0) {
      const isCurrentlyMuted = !audioTracks[0].enabled;
      audioTracks[0].enabled = isCurrentlyMuted;
      setIsMuted(!isCurrentlyMuted);
    }
  }, []);
  // Bên trong hook, gần các hàm useCallback khác

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    inactivityTimerRef.current = setTimeout(() => {
      console.log("⏰ Inactivity timeout reached. Ending call.");
      endCall();
    }, 90000); // 90 giây
  }, [endCall]);
  // Trong hook của bạn

  // Speech event handlers with detailed analysis
  const handleSpeechStart = useCallback(() => {
    const analysis = eventAnalyzer.current.analyzeEvent(
      "speech-start",
      callStatusRef.current,
      isWaitingForUserRef.current,
      currentSpeakerRef.current,
      currentStepRef.current
    );

    console.log(`🎤 DIRECT SPEECH-START Handler:`, analysis.reason);

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
      resetInactivityTimer();

      // ✨ NEW: Track speech start time
      speechStartTimeRef.current = Date.now();

      // Reset speech tracking
      setPartialTranscript("");
      setSpeechBuffer([]);
      setSpeechProgress({
        wordCount: 0,
        expectedWords: currentLine ? currentLine.text.split(/\s+/).length : 0,
        completionPercent: 0,
        isMinimumMet: false,
        hasMinimumWords: false, // ✨ NEW
      });
      lastPartialUpdateRef.current = Date.now();

      // ✨ NEW: Clear any existing wait timeouts when new speech starts
      if (speechWaitTimeoutRef.current) {
        clearTimeout(speechWaitTimeoutRef.current);
        speechWaitTimeoutRef.current = null;
      }
    } else {
      console.log(`🚫 Ignoring direct speech-start - ${analysis.reason}`);
    }
  }, [currentLine, resetInactivityTimer]);

  const handleSpeechEnd = useCallback(() => {
    const analysis = eventAnalyzer.current.analyzeEvent(
      "speech-end",
      callStatusRef.current,
      isWaitingForUserRef.current,
      currentSpeakerRef.current,
      currentStepRef.current
    );

    console.log(`🎤 DIRECT SPEECH-END Handler:`, analysis.reason);

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

      const speechDuration = Date.now() - speechStartTimeRef.current;
      console.log(`🎤 Speech ended after ${speechDuration}ms`);

      // ✨ ENHANCED: For long sentences, add extra delay to handle pauses
      if (currentLine) {
        const expectedWordCount = currentLine.text.split(/\s+/).length;
        const isLongSentence = expectedWordCount > 10;

        if (isLongSentence) {
          console.log(
            "⏳ Long sentence detected - adding 3-second buffer for natural pauses..."
          );

          // For long sentences, wait 3 seconds to see if user continues speaking
          // This handles natural pauses in speech
        }
      }
    } else {
      console.log(`🚫 Ignoring direct speech-end - ${analysis.reason}`);
    }
  }, [currentLine]);

  // VAPI Event Handlers
  const handleCallStart = useCallback(() => {
    console.log("📞 Call started - Setting up conversation");
    resetInactivityTimer();
    setCallState({ status: CallStatus.ACTIVE });
    isCallReadyRef.current = true;
    callStatusRef.current = CallStatus.ACTIVE;
    conversationCompletedRef.current = false;
    sessionCompleteCalledRef.current = false;
    processingUserInputRef.current = false;
    lastSimilarityResultRef.current = null;
    currentUserSpeechRef.current = "";
    evaluatedMessagesRef.current.clear();

    // Clear speech tracking
    setPartialTranscript("");
    setSpeechBuffer([]);
    lastPartialUpdateRef.current = 0;

    // ✨ NEW: Clear all wait timeouts
    if (speechWaitTimeoutRef.current) {
      clearTimeout(speechWaitTimeoutRef.current);
      speechWaitTimeoutRef.current = null;
    }

    // Clear debug data
    eventAnalyzer.current.clearHistory();
    messageAnalyzer.current.clearHistory();
    setDebugEvents([]);
    setDebugMessages([]);

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

    // Clear all timers
    if (currentTimeoutRef.current) {
      clearTimeout(currentTimeoutRef.current);
      currentTimeoutRef.current = null;
    }

    if (speechEndTimeoutRef.current) {
      clearTimeout(speechEndTimeoutRef.current);
      speechEndTimeoutRef.current = null;
    }

    if (speechEndDelayRef.current) {
      clearTimeout(speechEndDelayRef.current);
      speechEndDelayRef.current = null;
    }

    if (speechBufferTimeoutRef.current) {
      clearTimeout(speechBufferTimeoutRef.current);
      speechBufferTimeoutRef.current = null;
    }

    if (speechCompletionTimeoutRef.current) {
      clearTimeout(speechCompletionTimeoutRef.current);
      speechCompletionTimeoutRef.current = null;
    }

    // From Gemini
    if (finalTranscriptGracePeriodRef.current) {
      clearTimeout(finalTranscriptGracePeriodRef.current);
      finalTranscriptGracePeriodRef.current = null;
    }
    accumulatedTranscriptRef.current = ""; // Dọn dẹp buffer

    // ✨ NEW: Clear wait timeout
    if (speechWaitTimeoutRef.current) {
      clearTimeout(speechWaitTimeoutRef.current);
      speechWaitTimeoutRef.current = null;
    }

    // Dọn dẹp timer không hoạt động
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }

    processingUserInputRef.current = false;
    lastSimilarityResultRef.current = null;
    currentUserSpeechRef.current = "";
    evaluatedMessagesRef.current.clear();

    // Clear speech tracking
    setPartialTranscript("");
    setSpeechBuffer([]);

    for (let i = 0; i < steps.length; i++) {
      resetSimilarityContext(`${companionId}-step-${i}`);
    }
  }, [steps.length, companionId]);

  // Control functions
  const startCall = useCallback(async () => {
    setCallState({ status: CallStatus.CONNECTING });
    try {
      // --- BẮT ĐẦU THAY ĐỔI ---

      // 1. Gọi API route của bạn để lấy token tạm thời
      console.log("Fetching temporary token from /api/deepgram...");
      const response = await fetch("/api/deepgram");
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `Failed to get temporary token: ${errorData.error || response.statusText}`
        );
      }
      const data = await response.json();
      const tempToken = data.deepgramToken;

      if (!tempToken) {
        throw new Error(
          "Temporary Deepgram token is missing in the API response."
        );
      }

      console.log("✅ Successfully fetched temporary Deepgram token.");

      // 2. Sử dụng token tạm thời để khởi tạo Deepgram client
      // KHÔNG CÒN `process.env` ở đây nữa!
      const deepgram = createClient(tempToken);

      if (!deepgram) {
        throw new Error("Deepgram client creation failed");
      }
      // --- KẾT THÚC THAY ĐỔI ---

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      console.log("🎤 Microphone access granted.");
      const client = deepgram.listen.live({
        model: "nova-2",
        language: "en-US",
        smart_format: true,
        interim_results: true,
      });

      deepgramClientRef.current = client;

      console.log("🔊 Starting live transcription...");

      if (!client) {
        throw new Error("Deepgram client initialization failed");
      }

      // 3. Lắng nghe tất cả các sự kiện quan trọng TRƯỚC khi kết nối
      client.on(LiveTranscriptionEvents.Open, async () => {
        console.log("✅ Deepgram connection established.");
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0 && client.getReadyState() === 1)
            client.send(e.data);
        };
        microphoneRef.current = { mediaStream: stream, recorder };
        recorder.start(250);
        setCallState({ status: CallStatus.ACTIVE }); // <- Chuyển trạng thái ACTIVE ở đây!
      });

      console.log("🔊 Listening for live transcription events...");

      client.on(LiveTranscriptionEvents.Transcript, (data) => {
        const transcript = data.channel.alternatives[0].transcript;
        if (
          !transcript ||
          isAwaitingAIRef.current ||
          isWaitingForUserRef.current === false
        )
          return;

        resetInactivityTimer();
        if (data.is_final && !processingUserInputRef.current) {
          handleFinalTranscript(transcript);
        } else {
          setPartialTranscript(transcript);
        }
      });

      console.log("🔊 Live transcription started successfully.");

      client.on(LiveTranscriptionEvents.error, (error) => {
        console.error("❌ Deepgram WebSocket Error:", error);
        endCall();
      });
      client.on(LiveTranscriptionEvents.close, () => {
        console.log("ℹ️ Deepgram connection closed.");
        endCall();
      });
    } catch (error) {
      console.error("Failed to start conversation:", error);
      setCallState({
        status: CallStatus.ERROR,
        error: (error as Error).message,
      });
    }
  }, [endCall, resetInactivityTimer, handleFinalTranscript]);

  const resetConversation = useCallback(() => {
    console.log("🔄 Resetting conversation...");

    // Clear all timers
    if (currentTimeoutRef.current) {
      clearTimeout(currentTimeoutRef.current);
      currentTimeoutRef.current = null;
    }

    if (speechEndTimeoutRef.current) {
      clearTimeout(speechEndTimeoutRef.current);
      speechEndTimeoutRef.current = null;
    }

    if (speechEndDelayRef.current) {
      clearTimeout(speechEndDelayRef.current);
      speechEndDelayRef.current = null;
    }

    if (speechCompletionTimeoutRef.current) {
      clearTimeout(speechCompletionTimeoutRef.current);
      speechCompletionTimeoutRef.current = null;
    }

    // From Gemini
    if (finalTranscriptGracePeriodRef.current) {
      clearTimeout(finalTranscriptGracePeriodRef.current);
      finalTranscriptGracePeriodRef.current = null;
    }
    accumulatedTranscriptRef.current = ""; // Dọn dẹp buffer

    // ✨ NEW: Clear wait timeout
    if (speechWaitTimeoutRef.current) {
      clearTimeout(speechWaitTimeoutRef.current);
      speechWaitTimeoutRef.current = null;
    }

    // Dọn dẹp timer không hoạt động
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
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

    // Clear speech tracking
    setPartialTranscript("");
    setSpeechBuffer([]);

    // Clear debug data
    eventAnalyzer.current.clearHistory();
    messageAnalyzer.current.clearHistory();
    setDebugEvents([]);
    setDebugMessages([]);

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

        // Clear all timers
        if (currentTimeoutRef.current) {
          clearTimeout(currentTimeoutRef.current);
          currentTimeoutRef.current = null;
        }

        if (speechEndTimeoutRef.current) {
          clearTimeout(speechEndTimeoutRef.current);
          speechEndTimeoutRef.current = null;
        }

        if (speechEndDelayRef.current) {
          clearTimeout(speechEndDelayRef.current);
          speechEndDelayRef.current = null;
        }

        if (speechCompletionTimeoutRef.current) {
          clearTimeout(speechCompletionTimeoutRef.current);
          speechCompletionTimeoutRef.current = null;
        }

        // From Gemini
        if (finalTranscriptGracePeriodRef.current) {
          clearTimeout(finalTranscriptGracePeriodRef.current);
          finalTranscriptGracePeriodRef.current = null;
        }
        accumulatedTranscriptRef.current = ""; // Dọn dẹp buffer

        // ✨ NEW: Clear wait timeout
        if (speechWaitTimeoutRef.current) {
          clearTimeout(speechWaitTimeoutRef.current);
          speechWaitTimeoutRef.current = null;
        }

        // Dọn dẹp timer không hoạt động
        if (inactivityTimerRef.current) {
          clearTimeout(inactivityTimerRef.current);
          inactivityTimerRef.current = null;
        }

        processingUserInputRef.current = false;
        lastSimilarityResultRef.current = null;
        currentUserSpeechRef.current = "";
        evaluatedMessagesRef.current.clear();

        // Clear speech tracking
        setPartialTranscript("");
        setSpeechBuffer([]);

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

    // Clear all timers
    if (currentTimeoutRef.current) {
      clearTimeout(currentTimeoutRef.current);
      currentTimeoutRef.current = null;
    }

    if (speechEndTimeoutRef.current) {
      clearTimeout(speechEndTimeoutRef.current);
      speechEndTimeoutRef.current = null;
    }

    if (speechEndDelayRef.current) {
      clearTimeout(speechEndDelayRef.current);
      speechEndDelayRef.current = null;
    }

    if (speechCompletionTimeoutRef.current) {
      clearTimeout(speechCompletionTimeoutRef.current);
      speechCompletionTimeoutRef.current = null;
    }

    // From Gemini
    if (finalTranscriptGracePeriodRef.current) {
      clearTimeout(finalTranscriptGracePeriodRef.current);
      finalTranscriptGracePeriodRef.current = null;
    }
    accumulatedTranscriptRef.current = ""; // Dọn dẹp buffer

    // ✨ NEW: Clear wait timeout
    if (speechWaitTimeoutRef.current) {
      clearTimeout(speechWaitTimeoutRef.current);
      speechWaitTimeoutRef.current = null;
    }

    // Dọn dẹp timer không hoạt động
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }

    processingUserInputRef.current = false;
    lastSimilarityResultRef.current = null;
    currentUserSpeechRef.current = "";
    evaluatedMessagesRef.current.clear();

    // Clear speech tracking
    setPartialTranscript("");
    setSpeechBuffer([]);

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

  // Update refs when values change
  // useEffect(() => {
  //   currentStepRef.current = conversationState.currentStep;
  //   isWaitingForUserRef.current = conversationState.isWaitingForUser;
  //   callStatusRef.current = callState.status;
  // }, [
  //   conversationState.currentStep,
  //   conversationState.isWaitingForUser,
  //   callState.status,
  // ]);

  useEffect(() => {
    currentStepRef.current = conversationState.currentStep;
  }, [conversationState.currentStep]);
  useEffect(() => {
    isWaitingForUserRef.current = conversationState.isWaitingForUser;
  }, [conversationState.isWaitingForUser]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Update current speaker ref
  useEffect(() => {
    currentSpeakerRef.current = currentLine?.speaker || "";
  }, [currentLine?.speaker]);

  useEffect(() => {
    console.log(
      `[useEffect Triggered] Step: ${currentStep}, Status: ${callState.status}, Completed: ${conversationCompletedRef.current}`
    );
    // 1. Điều kiện dừng: không làm gì nếu cuộc gọi không active hoặc đã hoàn thành
    if (
      callState.status !== CallStatus.ACTIVE ||
      conversationCompletedRef.current
    ) {
      console.log("[useEffect Bypassed] Conditions not met.");
      return;
    }

    // 2. Hàm bất đồng bộ để xử lý lượt nói (giữ nguyên)
    const processTurn = async () => {
      console.log(`🔄 Processing turn for step ${currentStep}...`);
      // Clear timeout cũ để tránh chạy song song
      if (currentTimeoutRef.current) {
        clearTimeout(currentTimeoutRef.current);
        currentTimeoutRef.current = null;
      }

      const blockInfo = getConversationBlock(steps, currentStep);
      console.log(`🔍 Block info for step ${currentStep}:`);
      if (!blockInfo.speaker) {
        // Nếu hết kịch bản hoặc bước trống
        if (currentStep >= steps.length && !sessionCompleteCalledRef.current) {
          console.log("🎉 Conversation completed!");
          sessionCompleteCalledRef.current = true;
          onSessionComplete?.();
          endCall();
        }
        return;
      }

      // --- BẮT ĐẦU LOGIC CỦA LEO ---
      if (blockInfo.speaker === "Leo") {
        console.log(`🗣️ Leo's turn (step ${currentStep}): "${blockInfo.text}"`);

        // Thêm tin nhắn của Leo vào lịch sử chat
        const message = {
          role: "assistant" as const,
          content: blockInfo.text,
          timestamp: Date.now(),
        };
        setMessages((prev) => {
          // Tránh thêm tin nhắn trùng lặp nếu useEffect chạy lại
          if (prev[0]?.content === message.content) return prev;
          return [message, ...prev];
        });
        sentMessagesRef.current.add(blockInfo.text);

        // (Deepgram ListenLiveClient does not support pause/resume. If needed, implement your own buffering logic here.)

        // AI nói
        await speakAI(blockInfo.text);

        // (Deepgram ListenLiveClient does not support pause/resume. If needed, implement your own buffering logic here.)

        // Lên lịch để tự động chuyển sang bước tiếp theo
        const nextStep = blockInfo.endIndex + 1;

        currentTimeoutRef.current = setTimeout(() => {
          if (currentStepRef.current === currentStep) {
            setConversationState((prev) => ({
              ...prev,
              currentStep: nextStep,
            }));
          }
        }, resolvedTimingSettings.stepTransitionDelay);
      }
      // --- KẾT THÚC LOGIC CỦA LEO ---

      // --- BẮT ĐẦU LOGIC CỦA GWEN ---
      else if (blockInfo.speaker === "Gwen") {
        console.log(
          `👤 Gwen's turn (step ${currentStep}): "${blockInfo.text}"`
        );

        isAwaitingAIRef.current = false;
        resetInactivityTimer();
        setConversationState((prev) => ({
          ...prev,
          isWaitingForUser: true,
          feedback: `🎯 Your turn: "${blockInfo.text}"`,
        }));
      }
      // --- KẾT THÚC LOGIC CỦA GWEN ---
      else if (currentStep < steps.length) {
        // Trường hợp bước trống hoặc lỗi, tự động bỏ qua
        console.log(`⏭️ Skipping empty or invalid step ${currentStep}`);
        setConversationState((prev) => ({
          ...prev,
          currentStep: prev.currentStep + 1,
        }));
      }
    };

    // 3. Xử lý logic bắt đầu cuộc gọi một cách rõ ràng
    // Nếu là bước đầu tiên (currentStep = 0) và useEffect này được trigger bởi callState.status
    // chúng ta sẽ đợi một chút để đảm bảo mọi thứ sẵn sàng rồi mới bắt đầu.
    if (currentStep === 0 && conversationState.isWaitingForUser === false) {
      // Đợi 500ms để đảm bảo kết nối ổn định hoàn toàn rồi mới cho Leo nói
      currentTimeoutRef.current = setTimeout(() => {
        processTurn();
      }, 500);
    } else {
      // Nếu không phải bước đầu tiên, xử lý ngay lập tức
      processTurn();
    }

    // Hàm dọn dẹp để xóa timeout nếu component bị unmount
    return () => {
      if (currentTimeoutRef.current) {
        clearTimeout(currentTimeoutRef.current);
      }
    };
  }, [
    steps,
    currentStep,
    callState.status,
    conversationState.isWaitingForUser,
    resolvedTimingSettings.stepTransitionDelay,
    onSessionComplete,
    endCall,
    getConversationBlock,
    resetInactivityTimer,
    speakAI,
  ]); // Phụ thuộc vào cả currentStep và callState.status

  // Auto-advance conversation logic
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

    // From Gemini
    if (
      currentBlock?.speaker === "Leo" &&
      callState.status === CallStatus.ACTIVE
    ) {
      console.log(`🗣️ Leo speaking (step ${currentStep}):`, currentBlock.text);

      const speakingTime = sendLeoMessage(currentLine, currentStep);
      // Tổng thời gian chờ = thời gian nói + độ trễ chuyển bước
      const totalWaitTime =
        speakingTime + resolvedTimingSettings.stepTransitionDelay;
      console.log(
        `🎤 Leo speaking (${speakingTime}ms) + delay (${resolvedTimingSettings.stepTransitionDelay}ms) = total wait ${totalWaitTime}ms`
      );

      currentTimeoutRef.current = setTimeout(() => {
        if (!conversationCompletedRef.current) {
          // TÍNH TOÁN BƯỚC TIẾP THEO
          const nextStep = currentBlock.endIndex + 1;
          setConversationState((prev) => ({
            ...prev,
            // currentStep: prev.currentStep + 1,
            currentStep: nextStep,
          }));
        }
      }, totalWaitTime);
    } else if (
      currentBlock?.speaker === "Gwen" &&
      callState.status === CallStatus.ACTIVE
    ) {
      console.log(
        `👤 Waiting for user (step ${currentStep}):`,
        currentBlock.text
      );

      setIsSpeaking(false);
      processingUserInputRef.current = false;
      lastSimilarityResultRef.current = null;
      currentUserSpeechRef.current = "";

      // Clear speech tracking for new step
      setPartialTranscript("");
      setSpeechBuffer([]);

      // ✨ NEW: Clear wait timeouts for new step
      if (speechWaitTimeoutRef.current) {
        clearTimeout(speechWaitTimeoutRef.current);
        speechWaitTimeoutRef.current = null;
      }

      // 🚩🚩🚩 HẠ CỜ Ở ĐÂY KHI CHUẨN BỊ LẮNG NGHE LẠI 🚩🚩🚩
      isAwaitingAIRef.current = false;
      console.log("✅ User input is now unlocked. Ready to listen.");

      resetInactivityTimer();
      setConversationState((prev) => ({
        ...prev,
        isWaitingForUser: true,
        feedback: `🎯 Your turn: "${currentBlock.text}"`,
      }));

      setTimeout(() => {
        console.log("✅ Ready for user input - State updated");
      }, 100);
    }
  }, [
    currentStep,
    currentBlock,
    callState.status,
    sendLeoMessage,
    currentLine,
    resetInactivityTimer,
    resolvedTimingSettings.stepTransitionDelay,
  ]);

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

      // Clear all timers
      if (currentTimeoutRef.current) {
        clearTimeout(currentTimeoutRef.current);
        currentTimeoutRef.current = null;
      }

      if (speechEndTimeoutRef.current) {
        clearTimeout(speechEndTimeoutRef.current);
        speechEndTimeoutRef.current = null;
      }

      if (speechEndDelayRef.current) {
        clearTimeout(speechEndDelayRef.current);
        speechEndDelayRef.current = null;
      }

      if (speechCompletionTimeoutRef.current) {
        clearTimeout(speechCompletionTimeoutRef.current);
        speechCompletionTimeoutRef.current = null;
      }

      // ✨ NEW: Clear wait timeout
      if (speechWaitTimeoutRef.current) {
        clearTimeout(speechWaitTimeoutRef.current);
        speechWaitTimeoutRef.current = null;
      }

      // Dọn dẹp timer không hoạt động
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
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

  return {
    // State
    callState,
    conversationState,
    messages,
    isSpeaking,
    isMuted,
    currentLine,
    audioPlayerRef,

    // ✨ NEW: Speech tracking for long sentences
    partialTranscript,
    speechBuffer,

    // ✨ NEW: Debug data
    debugEvents,
    debugMessages,

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
    speechProgress,
  };
};
