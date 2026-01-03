"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type {
  CompanionComponentProps,
  PodcastTopics,
  TopicConfig,
  TopicTitles,
} from "@/types";
import { CallStatus, type TopicKey } from "@/types/podcast";
import { VOICEID_MAP } from "@/constants";

// Định nghĩa các giá trị sẽ được lưu trong context
interface ConversationContextType extends CompanionComponentProps {
  // State
  selectedTopic: TopicKey | undefined;
  completedTopics: Set<keyof PodcastTopics>;
  userRole: "Gwen" | "Leo";
  ttsProvider: "webspeech" | "elevenlabs";
  geminiFeedback: "standard" | "gemini";
  userLevel: "beginner" | "intermediate" | "advanced";
  viewMode: "immersive" | "classic";
  voiceId: string;
  callState: { status: CallStatus };

  // Setter functions
  setSelectedTopic: (topic: TopicKey) => void;
  onTopicComplete: (topic: TopicKey) => void;
  setUserRole: (role: "Gwen" | "Leo") => void;
  setTtsProvider: (provider: "webspeech" | "elevenlabs") => void;
  setGeminiFeedback: (feedback: "standard" | "gemini") => void;
  setUserLevel: (level: "beginner" | "intermediate" | "advanced") => void;
  setViewMode: (mode: "immersive" | "classic") => void;
  onCallStateChange: (status: CallStatus) => void;
  getTopicProgress: () => number;

  // Dữ liệu tĩnh từ server
  podcastTopics: PodcastTopics;
  topicConfig: TopicConfig[]; // Bạn có thể định nghĩa kiểu chặt chẽ hơn
  topicTitles: TopicTitles;
}

interface ConversationProviderProps extends CompanionComponentProps {
  children: ReactNode;
}

const ConversationContext = createContext<ConversationContextType | undefined>(
  undefined
);

// Provider Component
export const ConversationProvider = (props: ConversationProviderProps) => {
  const { initialCompletedTopics, transcriptData, voice, children } = props;
  const { podcastTopics, topicConfig, topicTitles } = transcriptData;
  const completedTopicsSet = new Set(
    initialCompletedTopics.map((item) => item.topicId)
  );

  const [selectedTopic, setSelectedTopic] = useState<TopicKey | undefined>(
    () => topicConfig?.[0]?.key
  );
  const [completedTopics, setCompletedTopics] =
    useState<Set<keyof PodcastTopics>>(completedTopicsSet);
  const [userRole, setUserRole] = useState<"Gwen" | "Leo">("Gwen");
  const [ttsProvider, setTtsProvider] = useState<"webspeech" | "elevenlabs">(
    "webspeech"
  );

  const [geminiFeedback, setGeminiFeedback] = useState<"standard" | "gemini">(
    "standard"
  );

  const [userLevel, setUserLevel] = useState<
    "beginner" | "intermediate" | "advanced"
  >("beginner");

  const [viewMode, setViewMode] = useState<"immersive" | "classic">(
    "immersive"
  );

  const [callState, setCallState] = useState<{ status: CallStatus }>({
    status: CallStatus.IDLE,
  });

  const voiceId =
    VOICEID_MAP[voice as keyof typeof VOICEID_MAP] || VOICEID_MAP.female;

  const onTopicComplete = (topic: TopicKey) => {
    setCompletedTopics((prev) => new Set([...prev, topic]));
    const topicKeys = Object.keys(podcastTopics) as TopicKey[];
    const currentIndex = topicKeys.indexOf(topic);

    if (currentIndex < topicKeys.length - 1) {
      const nextTopic = topicKeys[currentIndex + 1];
      setSelectedTopic(nextTopic);
    }
  };

  const onCallStateChange = (status: CallStatus) => {
    setCallState({ status });
  };

  const getTopicProgress = () => {
    const totalTopics = Object.keys(podcastTopics).length;
    const completed = completedTopics.size;
    return (completed / totalTopics) * 100;
  };

  const value = {
    ...props,
    voiceId,
    selectedTopic,
    completedTopics,
    userRole,
    ttsProvider,
    geminiFeedback,
    podcastTopics,
    topicConfig,
    topicTitles,
    userLevel,
    viewMode,
    callState,
    setSelectedTopic,
    setUserRole,
    setTtsProvider,
    setGeminiFeedback,
    setUserLevel,
    setViewMode,
    onTopicComplete,
    onCallStateChange,
    getTopicProgress,
  };

  return (
    <ConversationContext.Provider value={value}>
      {children}
    </ConversationContext.Provider>
  );
};

// Custom Hook để sử dụng context dễ dàng hơn
export const useConversationContext = () => {
  const context = useContext(ConversationContext);
  if (context === undefined) {
    throw new Error(
      "useConversationContext must be used within a ConversationProvider"
    );
  }
  return context;
};
