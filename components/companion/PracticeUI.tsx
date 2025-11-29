"use client";

import { useConversationContext } from "@/contexts/ConversationContext";
import { SettingsPanel } from "./SettingsPanel"; // Component con
import EnhancedCompanionConversation from "./enhanced-companion-conversation";
import { ProgressOverview } from "./ProgressOverview";
import { getFeedbackHistoryForTopic } from "@/lib/actions/feedback.action";
import { useEffect, useState } from "react";
import { CompanionComponentProps } from "@/types";

export const PracticeUI = (props: CompanionComponentProps) => {
  // Truyền các props chưa dùng đến
  const { selectedTopic, podcastTopics, topicTitles , onCallStateChange } =
    useConversationContext();

  // State và logic fetch biểu đồ có thể ở đây hoặc trong component con
  const [feedbackHistory, setFeedbackHistory] = useState(
    props.initialFeedbackHistory
  );
  const [isLoadingChart, setIsLoadingChart] = useState(false);

  useEffect(() => {
    if (!selectedTopic) return;
    setIsLoadingChart(true);
    getFeedbackHistoryForTopic(selectedTopic).then((data) => {
      setFeedbackHistory(data);
      setIsLoadingChart(false);
    });
  }, [selectedTopic]);

  return (
    <>
      <ProgressOverview />
      <div className="flex flex-col gap-8">
        <div className="max-w-7xl mx-auto w-full">
          <SettingsPanel />
        </div>

        <div className="">
          <EnhancedCompanionConversation
            {...props} // Truyền các props còn lại
            selectedTopic={selectedTopic}
            podcastTopics={podcastTopics}
            topicTitles={topicTitles}
            feedbackHistory={feedbackHistory}
            isLoadingChart={isLoadingChart}
            onCallStateChange={(status) => onCallStateChange(status)}
          />
        </div>
      </div>
    </>
  );
};
