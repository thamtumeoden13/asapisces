"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { topicTitles } from "@/data/podcast-topics"
import type { TopicKey } from "@/types/podcast"

interface TopicSelectorProps {
  selectedTopic: TopicKey | null
  onTopicSelect: (topic: TopicKey) => void
  completedTopics: Set<TopicKey>
}

export function TopicSelector({ selectedTopic, onTopicSelect, completedTopics }: TopicSelectorProps) {
  const topics = Object.keys(topicTitles) as TopicKey[]

  return (
    <Card className="w-full mb-6">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4">Choose a Topic to Practice</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {topics.map((topic) => (
            <Button
              key={topic}
              variant={selectedTopic === topic ? "default" : "outline"}
              className="relative h-auto p-3 text-left flex flex-col items-start"
              onClick={() => onTopicSelect(topic)}
            >
              <span className="text-sm font-medium">{topicTitles[topic]}</span>
              {completedTopics.has(topic) && (
                <Badge variant="secondary" className="mt-1 text-xs">
                  ✓ Completed
                </Badge>
              )}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
