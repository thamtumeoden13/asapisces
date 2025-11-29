"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { useConversationContext } from "@/contexts/ConversationContext";

const ProgressOverview = () => {
  const { userLevel, podcastTopics, completedTopics, getTopicProgress } =
    useConversationContext();

  return (
    <Card className="max-w-7xl mx-auto mb-8">
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
  );
};

export { ProgressOverview };

export default ProgressOverview;
