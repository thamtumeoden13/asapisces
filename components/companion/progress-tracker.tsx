"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { TopicKey, TranscriptLine } from "@/types/podcast"

interface ProgressTrackerProps {
  currentTopic: TopicKey | null
  currentStep: number
  totalSteps: number
  completedTopics: Set<TopicKey>
  currentLine: TranscriptLine | null
}

export function ProgressTracker({
  currentTopic,
  currentStep,
  totalSteps,
  completedTopics,
  currentLine,
}: ProgressTrackerProps) {
  const progressPercentage = totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0

  return (
    <Card className="w-full mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Progress Tracker</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Current Topic Progress</span>
              <span>
                {currentStep}/{totalSteps}
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>

          <div>
            <div className="text-sm text-gray-600 mb-1">Topics Completed</div>
            <div className="text-2xl font-bold text-green-600">{completedTopics.size}/10</div>
          </div>

          {currentLine && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="text-sm font-medium text-blue-800 mb-1">Current Speaker: {currentLine.speaker}</div>
              <div className="text-sm text-blue-700">{currentLine.text}</div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
