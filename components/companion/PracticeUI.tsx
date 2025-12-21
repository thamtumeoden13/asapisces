"use client";

import { useConversationContext } from "@/contexts/ConversationContext";
import { SettingsPanel } from "./SettingsPanel"; // Component con
import EnhancedCompanionConversation from "./enhanced-companion-conversation";
import { ProgressOverview } from "./ProgressOverview";
import { getFeedbackHistoryForTopic } from "@/lib/actions/feedback.action";
import { useEffect, useState } from "react";
import { CompanionComponentProps } from "@/types";
import { WeaknessProfile } from "./WeaknessProfile";

export const PracticeUI = (props: CompanionComponentProps) => {
  // Truyền các props chưa dùng đến
  const { companionId, selectedTopic } = useConversationContext();

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
        <div className="mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
          <div className="lg:col-span-2">
            <SettingsPanel />
          </div>
          <WeaknessProfile companionId={companionId} topicId={selectedTopic!} />
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
