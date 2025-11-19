import { CompanionComponentProps } from "@/types";
import {
  getCompletedTopicForCompanion,
  getFeedbackHistoryForTopic,
} from "@/lib/actions/feedback.action"; // Hàm lấy lịch sử điểm số
import { ConversationPlayer } from "./ConversationPlayer";
import { calculateStreakAction } from "@/lib/actions/session.action";

const ConversationComponent = async ({
  companionId,
  subject,
  topic,
  name,
  userName,
  userImage,
  userId,
  style,
  voice,
  transcriptData,
}: CompanionComponentProps) => {
  // Lấy dữ liệu biểu đồ ban đầu cho topic đầu tiên
  const initialTopicKey = transcriptData?.topicConfig?.[0]?.key || "intro";
  const initialFeedbackHistory =
    await getFeedbackHistoryForTopic(initialTopicKey);
  const streakData = await calculateStreakAction();
  const initialCompletedTopics =
    await getCompletedTopicForCompanion(companionId);

  console.log("Streak Data:", streakData);

  return (
    <>
      {/* Render Client Component và truyền dữ liệu đã fetch vào */}
      <ConversationPlayer
        companionId={companionId}
        subject={subject}
        topic={topic}
        name={name}
        userName={userName}
        userImage={userImage}
        userId={userId}
        style={style}
        voice={voice}
        voiceId={voice}
        transcriptData={transcriptData}
        initialFeedbackHistory={initialFeedbackHistory}
        initialCompletedTopics={initialCompletedTopics}
      />
    </>
  );
};

export default ConversationComponent;
