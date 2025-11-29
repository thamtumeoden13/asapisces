"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type {
  CompanionComponentProps,
  PodcastTopics,
  TopicConfig,
  TopicTitles,
} from "@/types";
import { CallStatus, type TopicKey } from "@/types/podcast";

// Định nghĩa các giá trị sẽ được lưu trong context
interface ConversationContextType {
  // State
  selectedTopic: TopicKey | undefined;
  completedTopics: Set<keyof PodcastTopics>;
  userRole: "Gwen" | "Leo";
  ttsProvider: "webspeech" | "elevenlabs";
  userLevel: "beginner" | "intermediate" | "advanced";
  callState: { status: CallStatus };

  // Setter functions
  setSelectedTopic: (topic: TopicKey) => void;
  addCompletedTopic: (topic: TopicKey) => void;
  setUserRole: (role: "Gwen" | "Leo") => void;
  setTtsProvider: (provider: "webspeech" | "elevenlabs") => void;
  setUserLevel: (level: "beginner" | "intermediate" | "advanced") => void;
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
  const { initialCompletedTopics, transcriptData, children } = props;
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

  const [userLevel, setUserLevel] = useState<
    "beginner" | "intermediate" | "advanced"
  >("beginner");

  const [callState, setCallState] = useState<{ status: CallStatus }>({
    status: CallStatus.IDLE,
  });

  const addCompletedTopic = (topic: TopicKey) => {
    setCompletedTopics((prev) => new Set([...prev, topic]));
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
    selectedTopic,
    completedTopics,
    userRole,
    ttsProvider,
    podcastTopics,
    topicConfig,
    topicTitles,
    userLevel,
    callState,
    setSelectedTopic,
    setUserRole,
    setTtsProvider,
    setUserLevel,
    addCompletedTopic,
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
