"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { vapi } from "@/lib/vapi.sdk";
import { configureAssistant } from "@/lib/vapi-config";
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

interface UseVapiConversationProps {
  steps: TranscriptLine[];
  companionId: string;
  subject: string;
  topic: string;
  style: string;
  voice: string;
  onSessionComplete?: () => void;
  timingSettings?: Partial<TimingSettings>;
}

export const useVapiConversation = ({
  steps,
  companionId,
  subject,
  topic,
  style,
  voice,
  onSessionComplete,
  timingSettings = {},
}: UseVapiConversationProps) => {
  // THIẾT LẬP GIÁ TRỊ MẶC ĐỊNH
  const resolvedTimingSettings: TimingSettings = {
    stepTransitionDelay: 1000,
    speechTimeout: 3000,
    autoAdvance: true,
    quickMode: false,
    responseWaitTime: 2500, // Giá trị mặc định cho grace period
    ...timingSettings, // Ghi đè bằng các giá trị được truyền vào
  };

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

  // ✨ NEW: Enhanced analyzers for debugging
  const eventAnalyzer = useRef(new VapiEventAnalyzer());
  const messageAnalyzer = useRef(new VapiMessageAnalyzer());
  const [debugEvents, setDebugEvents] = useState<any[]>([]);
  const [debugMessages, setDebugMessages] = useState<any[]>([]);

  // ✨ NEW: Long sentence handling
  const [partialTranscript, setPartialTranscript] = useState<string>("");
  const [speechBuffer, setSpeechBuffer] = useState<string[]>([]);
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
  const evaluatedMessagesRef = useRef<Set<string>>(new Set());

  // State tracking refs
  const isWaitingForUserRef = useRef(false);
  const currentSpeakerRef = useRef<string>("");
  const callStatusRef = useRef<string>(CallStatus.INACTIVE);

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

      console.log(
        `🎤 Sending Leo's message immediately (step ${stepIndex}):`,
        line.text
      );
      return speakingTime;
    },
    [calculateSpeakingTime]
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
  // From Gemini
  // const currentLine = steps[currentStep] || null;

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

  // Update current speaker ref
  useEffect(() => {
    currentSpeakerRef.current = currentLine?.speaker || "";
  }, [currentLine?.speaker]);

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

      // ✨ CHANGED: Use 0.7 threshold instead of 0.5
      const shouldAdvance = similarityResult.score >= 0.7;
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
        // ✨ RETRY: Leo asks Gwen to repeat
        console.log("🔄 Low score! Leo will ask Gwen to repeat");

        // Create Leo's retry message with context about partial speech
        const randomRetryMessage = generateRetryMessage(
          currentLine?.text || "",
          similarityResult.score,
          partialTranscript
        );

        // Send Leo's retry message immediately
        const leoRetryLine = {
          speaker: "Leo" as const,
          text: randomRetryMessage,
        };

        // Use sendLeoMessage to make Leo speak the retry request
        setTimeout(() => {
          sendLeoMessage(leoRetryLine, stepIndex);

          // After Leo speaks, set waiting for user again

          // ================================================================
          // ✨✨✨ ĐÂY LÀ CHỖ CẦN THÊM CODE ✨✨✨
          console.log(
            `🔄 Resetting similarity context for retry on step ${stepIndex}`
          );
          const contextId = `${companionId}-step-${stepIndex}`;
          resetSimilarityContext(contextId);
          // ================================================================

          setTimeout(() => {
            setConversationState((prev) => ({
              ...prev,
              isWaitingForUser: true,
              feedback: `🎯 Try the complete sentence: "${currentLine?.text}"`,
            }));

            // Clear the evaluation key so user can try again
            evaluatedMessagesRef.current.delete(evaluationKey);
            processingUserInputRef.current = false;

            // Reset speech tracking
            setSpeechBuffer([]);
            setPartialTranscript("");
          }, 2000); // Wait 2 seconds for Leo to finish speaking
        }, 500); // Small delay before Leo responds
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
      sendLeoMessage,
      partialTranscript,
      generateRetryMessage,
    ]
  );

  // ✨ COMPREHENSIVE: Message handler with detailed analysis
  const handleMessage = useCallback(
    (message: VapiMessage) => {
      // ✨ NEW: Analyze every message that comes through
      const analysis = messageAnalyzer.current.analyzeMessage(
        message,
        callStatusRef.current,
        isWaitingForUserRef.current,
        currentSpeakerRef.current
      );

      console.log(
        `📨 VAPI MESSAGE [${message.type}]:`,
        analysis.reason,
        message.transcriptType ? `(${message.transcriptType})` : "",
        message.role ? `[${message.role}]` : "",
        message.transcript?.substring(0, 50) + "..." ||
          message.content?.substring(0, 50) + "..." ||
          ""
      );

      // ✨ NEW: Update debug messages
      setDebugMessages((prev) => [
        {
          type: message.type,
          transcriptType: message.transcriptType,
          role: message.role,
          content: message.transcript || message.content || "",
          timestamp: Date.now(),
          analysis,
          processed: analysis.shouldProcess,
          rawMessage: message,
        },
        ...prev.slice(0, 49), // Keep last 50 messages
      ]);

      // Early guard - only process if call is active (except for system messages)
      if (
        !isCallReadyRef.current ||
        (callStatusRef.current !== CallStatus.ACTIVE && message.type !== "hang")
      ) {
        console.log("🚫 Ignoring message - call not ready:", message.type);
        return;
      }

      // ✨ DETAILED: Handle different message types
      switch (message.type) {
        case "transcript":
          handleTranscriptMessage(message, analysis);
          break;

        case "function-call":
          console.log(
            "🔧 Function call:",
            message.functionCall?.name,
            message.functionCall?.parameters
          );
          break;

        case "hang":
          console.log("📞 Call hang detected");
          break;

        case "speech-update":
          console.log("🎤 Speech update:", message.status);
          break;

        case "conversation-update":
          console.log("💬 Conversation update:", message);
          break;

        case "model-output":
          console.log(
            "🤖 Model output:",
            message.output?.substring(0, 100) + "..."
          );
          break;

        case "tool-calls":
          console.log("🛠️ Tool calls:", message.toolCalls);
          break;

        case "error":
          console.error("❌ VAPI Error message:", message.error);
          break;

        default:
          console.log("❓ Unknown message type:", message.type, message);
      }
    },
    [currentLine, companionId, handleFinalSimilarityResult]
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
  }, [currentLine]);

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

      setConversationState((prev) => ({
        ...prev,
        isWaitingForUser: true,
        feedback: `🎯 Your turn: "${currentBlock.text}"`,
      }));

      setTimeout(() => {
        console.log("✅ Ready for user input - State updated");
      }, 100);
    }
  }, [currentStep, currentBlock, callState.status, sendLeoMessage]);

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

  return {
    // State
    callState,
    conversationState,
    messages,
    isSpeaking,
    isMuted,
    currentLine,

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
