import { CompanionComponentProps } from "@/types";
import {
  getCompletedTopicForCompanion,
  getFeedbackHistoryForTopic,
} from "@/lib/actions/feedback.action"; // Hàm lấy lịch sử điểm số
import { calculateStreakAction } from "@/lib/actions/session.action";
import { ConversationProvider } from "@/contexts/ConversationContext";
import { PracticeUI } from "./PracticeUI";

const ConversationComponent = async (props: CompanionComponentProps) => {
  const { companionId, transcriptData } = props;
  // Lấy dữ liệu biểu đồ ban đầu cho topic đầu tiên
  const initialTopicKey = transcriptData?.topicConfig?.[0]?.key || "intro";
  const [initialFeedbackHistory, streakData, initialCompletedTopics] =
    await Promise.all([
      getFeedbackHistoryForTopic(initialTopicKey),
      calculateStreakAction(),
      getCompletedTopicForCompanion(companionId),
    ]);
  console.log("Streak Data:", streakData);

  return (
    <>
      <ConversationProvider
        {...props}
        initialCompletedTopics={initialCompletedTopics}
      >
        <PracticeUI
          {...props}
          initialFeedbackHistory={initialFeedbackHistory}
          initialCompletedTopics={initialCompletedTopics}
        />
      </ConversationProvider>
    </>
  );
};

export default ConversationComponent;
