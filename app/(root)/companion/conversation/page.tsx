"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import EnhancedCompanionConversationV2 from "@/components/companion/enhanced-companion-conversation-v2";
import { podcastTopics, topicTitles } from "@/data/podcast-topics";
import type { TopicKey } from "@/types/podcast";
import { BookOpen, Users, Target, TrendingUp } from "lucide-react";

export default function ConversationPage() {
  const [selectedTopic, setSelectedTopic] = useState<TopicKey>("intro");
  const [completedTopics, setCompletedTopics] = useState<Set<TopicKey>>(
    new Set()
  );
  const [userLevel, setUserLevel] = useState<
    "beginner" | "intermediate" | "advanced"
  >("intermediate");
  const [voiceStyle, setVoiceStyle] = useState<
    "friendly" | "professional" | "casual" | "encouraging"
  >("friendly");

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            AI Conversation Practice
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Practice English conversation with AI companions using advanced
            voice recognition and real-time feedback
          </p>
        </div>

        {/* Progress Overview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Learning Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <div className="text-3xl font-bold text-purple-600">
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

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Topic Selection Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Practice Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Level Selection */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Your Level
                  </label>
                  <Select
                    value={userLevel}
                    onValueChange={(value: any) => setUserLevel(value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Voice Style Selection */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Voice Style
                  </label>
                  <Select
                    value={voiceStyle}
                    onValueChange={(value: any) => setVoiceStyle(value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="encouraging">Encouraging</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Topic Selection */}
                <div>
                  <label className="text-sm font-medium mb-3 block">
                    Choose Topic
                  </label>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {Object.entries(topicTitles).map(([key, title]) => {
                      const topicKey = key as TopicKey;
                      const isCompleted = completedTopics.has(topicKey);
                      const isSelected = selectedTopic === topicKey;

                      return (
                        <Button
                          key={key}
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          className={`w-full justify-start text-left h-full p-3 whitespace-normal ${
                            isCompleted ? "bg-green-50 border-green-200" : ""
                          }`}
                          onClick={() => setSelectedTopic(topicKey)}
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className="flex flex-col flex-wrap">
                              <div className="font-medium text-sm">{title}</div>
                              <div className="text-xs text-gray-500 mt-1">
                                {podcastTopics[topicKey]?.length || 0} steps
                              </div>
                            </div>
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
                          </div>
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Quick Stats
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Completed:</span>
                      <span className="font-medium">
                        {completedTopics.size}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Remaining:</span>
                      <span className="font-medium">
                        {Object.keys(podcastTopics).length -
                          completedTopics.size}
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
          <div className="lg:col-span-3">
            <EnhancedCompanionConversationV2
              companionId="leo-gwen-podcast"
              subject="english"
              topic={selectedTopic}
              name="Leo & Gwen"
              userName="Student"
              userImage="/placeholder.svg?height=130&width=130"
              style={voiceStyle}
              voice="leo"
              selectedTopic={selectedTopic}
              onTopicComplete={handleTopicComplete}
            />
          </div>
        </div>

        {/* Help Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              How It Works
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">🎯</span>
                </div>
                <h3 className="font-medium mb-2">Choose Your Topic</h3>
                <p className="text-sm text-gray-600">
                  Select from various conversation topics based on your learning
                  goals and interests.
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">🎤</span>
                </div>
                <h3 className="font-medium mb-2">Practice Speaking</h3>
                <p className="text-sm text-gray-600">
                  Engage in natural conversation with AI companions using
                  advanced voice recognition.
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">📊</span>
                </div>
                <h3 className="font-medium mb-2">Get Real-time Feedback</h3>
                <p className="text-sm text-gray-600">
                  Receive instant feedback on pronunciation, fluency, and
                  conversation skills.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
