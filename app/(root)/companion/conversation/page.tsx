
"use client"

import { useState } from "react"
import EnhancedCompanionConversation from "@/components/companion/enhanced-companion-conversation"
import EnhancedCompanionConversationWithGroupedDisplay from "@/components/companion/enhanced-companion-conversation-with-grouped-display"
import { TopicSelector } from "@/components/companion/topic-selector"
import type { TopicKey } from "@/types/podcast"

export default function ConversationPage() {
  const [selectedTopic, setSelectedTopic] = useState<TopicKey | null>(null)
  const [completedTopics, setCompletedTopics] = useState<Set<TopicKey>>(new Set())

  const handleTopicComplete = (topic: TopicKey) => {
    setCompletedTopics((prev) => new Set([...prev, topic]))
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Positive Thinking Podcast - Interactive Conversation
          </h1>
          <p className="text-gray-600">Practice English conversation with AI-powered voice interaction</p>
        </div>

        {!selectedTopic ? (
          <TopicSelector
            selectedTopic={selectedTopic}
            onTopicSelect={setSelectedTopic}
            completedTopics={completedTopics}
          />
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <button onClick={() => setSelectedTopic(null)} className="text-blue-600 hover:text-blue-800 font-medium">
                ← Back to Topics
              </button>
              <div className="text-sm text-gray-600">Completed: {completedTopics.size}/10 topics</div>
            </div>

            <EnhancedCompanionConversationWithGroupedDisplay
              selectedTopic={selectedTopic}
              onTopicComplete={handleTopicComplete}
              companionId="positive-thinking-podcast"
              subject="english"
              name="Leo & Gwen"
              userName="English Learner"
              style="casual"
              voice="male"
            />
          </div>
        )}
      </div>
    </div>
  )
}
