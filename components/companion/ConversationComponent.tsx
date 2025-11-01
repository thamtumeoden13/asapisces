import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { CompanionComponentProps } from "@/types";
import { getFeedbackHistoryForTopic } from "@/lib/actions/feedback.action"; // Hàm lấy lịch sử điểm số
import { ConversationPlayer } from "./ConversationPlayer";
import { StreakDisplay } from "./StreakDisplay";
import { calculateStreakAction } from "@/lib/actions/session.action";

const voiceStyles = {
  friendly: "pNInz6obpgDQGcFmaJgB", // Adam
  professional: "GBv7mTt0atIp3Br8iCZE", // Thomas
  casual: "2EiwWnXFnvU5JabPnv8n", // Clyde
  encouraging: "21m00Tcm4TlvDq8ikWAM", // Rachel
};

interface TopicConfig {
  key: string;
  keyword: string;
  title?: string;
  description?: string;
  priority?: number;
}
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

  console.log("Streak Data:", streakData);

  // Dữ liệu tổng quan có thể được tính toán ở đây nếu cần
  const totalTopics = transcriptData?.topicConfig?.length || 0;
  // (completedTopics và userLevel sẽ được quản lý ở client)

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
      />
    </>
  );
};

export default ConversationComponent;
