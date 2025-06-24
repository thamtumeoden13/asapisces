"use client";

import { useState } from "react";
import EnhancedVapiConversation from "@/components/companion/enhanced-vapi-conversation";
import { TopicSelector } from "@/components/companion/topic-selector";
import type { TopicKey } from "@/types/podcast";

export default function VapiConversationPage() {
  const [selectedTopic, setSelectedTopic] = useState<TopicKey | null>(null);
  const [completedTopics, setCompletedTopics] = useState<Set<TopicKey>>(
    new Set()
  );
  const [mode, setMode] = useState<"podcast" | "conversation">("podcast");

  const handleTopicComplete = (topic: TopicKey) => {
    setCompletedTopics((prev) => new Set([...prev, topic]));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Enhanced VAPI Conversation Practice
          </h1>
          <p className="text-gray-600">
            Practice English with AI-powered voice conversation
          </p>
        </div>

        {!selectedTopic ? (
          <div className="space-y-6">
            {/* Mode Selector */}
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setMode("podcast")}
                className={`px-4 py-2 rounded-lg ${
                  mode === "podcast"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                📻 Podcast Script
              </button>
              <button
                onClick={() => setMode("conversation")}
                className={`px-4 py-2 rounded-lg ${
                  mode === "conversation"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                💬 Free Conversation
              </button>
            </div>

            <TopicSelector
              selectedTopic={selectedTopic}
              onTopicSelect={setSelectedTopic}
              completedTopics={completedTopics}
            />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setSelectedTopic(null)}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                ← Back to Topics
              </button>
              <div className="text-sm text-gray-600">
                Completed: {completedTopics.size}/10 topics
              </div>
            </div>

            <EnhancedVapiConversation
              selectedTopic={selectedTopic}
              onTopicComplete={handleTopicComplete}
              voice="leo"
              style="friendly"
              level="intermediate"
              mode={mode}
            />
          </div>
        )}
      </div>
    </div>
  );
}
