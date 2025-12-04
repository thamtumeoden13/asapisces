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
  const { selectedTopic } = useConversationContext();

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
        <div className="w-full mx-auto max-w-7xl">
          <SettingsPanel />
        </div>

        <div className="">
          <EnhancedCompanionConversation
            feedbackHistory={feedbackHistory}
            isLoadingChart={isLoadingChart}
          />
        </div>
      </div>
    </>
  );
};
