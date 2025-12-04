"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CallStatus, type TopicKey } from "@/types/podcast";
import { BookOpen } from "lucide-react";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { useConversationContext } from "@/contexts/ConversationContext";

const SettingsPanel = () => {
  const {
    userRole,
    setUserRole,
    ttsProvider,
    setTtsProvider,
    topicConfig,
    selectedTopic,
    setSelectedTopic,
    completedTopics,
    podcastTopics,
    callState,
    geminiFeedback,
    setGeminiFeedback,
  } = useConversationContext();

  const getTopicBadgeVariant = (topic: TopicKey) => {
    if (completedTopics.has(topic)) return "default";
    if (topic === selectedTopic) return "secondary";
    return "outline";
  };

  return (
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
          <label className="block mb-3 text-sm font-medium">Choose Topic</label>
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
                  className={`justify-start text-left h-full p-3 mr-2 whitespace-normal ${
                    isCompleted ? "bg-green-50 border-green-200" : ""
                  } ${isSelected && isCompleted ? "text-gray-700 bg-green-300": ""}`}
                  onClick={() => setSelectedTopic(topicKey)}
                  disabled={callState.status === CallStatus.ACTIVE} // Vô hiệu hóa khi đang nói
                >
                  <div className="flex items-center justify-between w-full gap-2">
                    <div className="flex items-center gap-1">
                      {isCompleted && <span className="text-green-600">✓</span>}
                      <Badge
                        variant={getTopicBadgeVariant(topicKey)}
                        className="text-xs"
                      >
                        {isCompleted ? "Done" : isSelected ? "Active" : "New"}
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
      </CardContent>
    </Card>
  );
};

export { SettingsPanel };

export default SettingsPanel;
