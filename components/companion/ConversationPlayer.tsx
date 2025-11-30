"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import EnhancedCompanionConversationV3 from "@/components/companion/enhanced-companion-conversation";
import { CallStatus, type TopicKey } from "@/types/podcast";
import { BookOpen, Target, TrendingUp } from "lucide-react";
import { CompanionComponentProps, PodcastTopics, TopicTitles } from "@/types";
import {
  getFeedbackHistoryForTopic,
  FeedbackHistoryPoint,
  FeedbackHistoryCompletedTopic,
} from "@/lib/actions/feedback.action";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";

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
interface ConversationPlayerProps extends CompanionComponentProps {
  initialFeedbackHistory: FeedbackHistoryPoint[];
  initialCompletedTopics: FeedbackHistoryCompletedTopic[];
}
export const ConversationPlayer = ({
  companionId,
  subject,
  name,
  userName,
  userImage,
  userId,
  transcriptData,
  initialFeedbackHistory,
  initialCompletedTopics,
}: ConversationPlayerProps) => {

  const complementedTopicsSet = new Set(
    initialCompletedTopics.map((item) => item.topicId)
  );

  const [topicTitles, setTopicTitles] = useState<TopicTitles>({});
  const [topicConfig, setTopicConfig] = useState<TopicConfig[]>([]);
  const [podcastTopics, setPodcastTopics] = useState<PodcastTopics>({});

  const [selectedTopic, setSelectedTopic] = useState<TopicKey | undefined>(undefined);
  const [completedTopics, setCompletedTopics] = useState<Set<keyof PodcastTopics>>(complementedTopicsSet);
  
  const [userLevel, setUserLevel] = useState<
    "beginner" | "intermediate" | "advanced"
  >("intermediate");
  const [voiceStyle, setVoiceStyle] = useState<
    "friendly" | "professional" | "casual" | "encouraging"
  >("friendly");

  // State mới cho biểu đồ
  const [feedbackHistory, setFeedbackHistory] = useState<
    FeedbackHistoryPoint[]
  >(initialFeedbackHistory);
  const [isLoadingChart, setIsLoadingChart] = useState(false);

  const [userRole, setUserRole] = useState<"Gwen" | "Leo">("Gwen");
  const [callState, setCallState] = useState<{ status: CallStatus }>({
    status: CallStatus.IDLE,
  });

  const [ttsProvider, setTtsProvider] = useState<"webspeech" | "elevenlabs">(
    "webspeech"
  );
  const [geminiFeedback, setGeminiFeedback] = useState<"standard" | "gemini">(
    "standard"
  );
  // Lấy voiceId dựa trên lựa chọn
  const selectedVoiceId = voiceStyles[voiceStyle];

  const handleTopicComplete = (topic: TopicKey) => {
    setCompletedTopics((prev) => new Set([...prev, topic]));

    // Auto-suggest next topic
    const topicKeys = Object.keys(podcastTopics) as TopicKey[];
    const currentIndex = topicKeys.indexOf(topic);
    if (currentIndex < topicKeys.length - 1) {
      const nextTopic = topicKeys[currentIndex + 1];
      setSelectedTopic(nextTopic);
    }
  };

  const handleChangeCallState = useCallback(
    (newStatus: CallStatus) => {
      setCallState({ status: newStatus });
    },
    []
  );

  const getTopicProgress = () => {
    const totalTopics = Object.keys(podcastTopics).length;
    const completed = completedTopics.size;
    return (completed / totalTopics) * 100;
  };

  const getTopicBadgeVariant = (topic: TopicKey) => {
    if (completedTopics.has(topic)) return "default";
    if (topic === selectedTopic) return "secondary";
    return "outline";
  };

  // --- LOGIC useEffect ĐỂ CẬP NHẬT BIỂU ĐỒ KHI TOPIC THAY ĐỔI ---
  useEffect(() => {
    console.log("Fetching feedback history for topic:", selectedTopic);
    if(!selectedTopic) return
    setIsLoadingChart(true);
    getFeedbackHistoryForTopic(selectedTopic).then((data) => {
      setFeedbackHistory(data);
      setIsLoadingChart(false);
    });
  }, [selectedTopic]);

  useEffect(() => {
    if (transcriptData && !selectedTopic) {
      const { topicTitles, podcastTopics, topicConfig } = transcriptData;

      setTopicTitles(topicTitles);
      setPodcastTopics(podcastTopics);
      setTopicConfig(topicConfig as TopicConfig[]);
      if (topicConfig && topicConfig.length > 0) {
        setSelectedTopic(topicConfig[0].key as TopicKey);
      }
    }
  }, [transcriptData, selectedTopic]);

  return (
    <>
      {/* Progress Overview - Có thể hiển thị một phần dữ liệu tĩnh từ server */}
      <Card className="mx-auto mb-8 max-w-7xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Learning Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {completedTopics.size}
              </div>
              <div className="text-sm text-gray-600">Topics Completed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {getTopicProgress().toFixed(0)}%
              </div>
              <div className="text-sm text-gray-600">Overall Progress</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple">
                {Object.keys(podcastTopics).length}
              </div>
              <div className="text-sm text-gray-600">Total Topics</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">
                {userLevel}
              </div>
              <div className="text-sm text-gray-600">Current Level</div>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="flex flex-col gap-8">
        {/* Topic Selection Sidebar */}
        <div className="mx-auto max-w-7xl">
          <Card className="">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Practice Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <Label className="block mb-3 text-sm font-medium">
                  Choose Your Role
                </Label>
                <RadioGroup
                  defaultValue={userRole}
                  onValueChange={(value: "Gwen" | "Leo") => setUserRole(value)}
                  className="flex gap-4"
                  disabled={callState.status === CallStatus.ACTIVE} // Vô hiệu hóa khi đang nói
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Gwen" id="role-gwen" />
                    <Label htmlFor="role-gwen">I want to be Gwen</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Leo" id="role-leo" />
                    <Label htmlFor="role-leo">I want to be Leo</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* TTS Provider Settings */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  Use High-Quality Voice (ElevenLabs)
                </span>
                <Switch
                  checked={ttsProvider === "elevenlabs"}
                  disabled={callState.status === CallStatus.ACTIVE} // Vô hiệu hóa khi đang nói
                  onCheckedChange={(checked) => {
                    setTtsProvider(checked ? "elevenlabs" : "webspeech");
                  }}
                />
              </div>
               <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  Use High-Quality Feedback (Gemini)
                </span>
                <Switch
                  checked={geminiFeedback === "gemini"}
                  disabled={callState.status === CallStatus.ACTIVE} // Vô hiệu hóa khi đang nói
                  onCheckedChange={(checked) => {
                    setGeminiFeedback(checked ? "gemini" : "standard");
                  }}
                />
              </div>
              {/* Topic Selection */}
              <div>
                <label className="block mb-3 text-sm font-medium">
                  Choose Topic
                </label>
                <div className="space-y-2 overflow-auto max-h-80">
                  {topicConfig?.map(({ key, title }) => {
                    const topicKey = key as TopicKey;
                    const isCompleted = completedTopics.has(topicKey);
                    const isSelected = selectedTopic === topicKey;

                    return (
                      <Button
                        key={key}
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        className={`justify-start text-left h-full p-3 mr-2 whitespace-normal  ${
                          isCompleted ? "bg-green-50 border-green-200" : ""
                        }`}
                        onClick={() => setSelectedTopic(topicKey)}
                        disabled={callState.status === CallStatus.ACTIVE} // Vô hiệu hóa khi đang nói
                      >
                        <div className="flex items-center justify-between w-full gap-2">
                          <div className="flex items-center gap-1">
                            {isCompleted && (
                              <span className="text-green-600">✓</span>
                            )}
                            <Badge
                              variant={getTopicBadgeVariant(topicKey)}
                              className="text-xs"
                            >
                              {isCompleted
                                ? "Done"
                                : isSelected
                                  ? "Active"
                                  : "New"}
                            </Badge>
                          </div>
                          <div className="flex flex-col flex-wrap">
                            <div className="text-sm font-medium">{title}</div>
                            <div className="mt-1 text-xs text-gray-500">
                              {podcastTopics[topicKey]?.length || 0} steps
                            </div>
                          </div>
                        </div>
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="pt-4 border-t">
                <h4 className="flex items-center gap-2 mb-2 font-medium">
                  <Target className="w-4 h-4" />
                  Quick Stats
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Completed:</span>
                    <span className="font-medium">{completedTopics.size}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Remaining:</span>
                    <span className="font-medium">
                      {Object.keys(podcastTopics).length - completedTopics.size}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Progress:</span>
                    <span className="font-medium">
                      {getTopicProgress().toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Conversation Area */}
        <div className="">
          <EnhancedCompanionConversationV3
            companionId={companionId}
            subject={subject}
            topicTitles={topicTitles}
            podcastTopics={podcastTopics}
            name={name}
            userName={userName}
            userImage={userImage}
            userId={userId}
            voiceId={selectedVoiceId}
            selectedTopic={selectedTopic}
            isLoadingChart={isLoadingChart}
            feedbackHistory={feedbackHistory}
            userRole={userRole}
            ttsProvider={ttsProvider}
            geminiFeedback={geminiFeedback}
            onCallStateChange={handleChangeCallState}
            onTopicComplete={handleTopicComplete}
          />
        </div>
      </div>
    </>
  );
};
