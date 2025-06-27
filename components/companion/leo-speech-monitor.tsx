"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useState, useEffect } from "react"

interface LeoSpeechMonitorProps {
  currentLine: any
  isSpeaking: boolean
  callState: any
}

export const LeoSpeechMonitor = ({ currentLine, isSpeaking, callState }: LeoSpeechMonitorProps) => {
  const [speechProgress, setSpeechProgress] = useState(0)
  const [estimatedDuration, setEstimatedDuration] = useState(0)
  const [speechStartTime, setSpeechStartTime] = useState<number | null>(null)

  // Calculate estimated speech duration based on word count
  useEffect(() => {
    if (currentLine?.speaker === "Leo") {
      const wordCount = currentLine.text.split(/\s+/).length
      const wordsPerSecond = 2.5 // Average speaking rate
      const duration = (wordCount / wordsPerSecond) * 1000 // Convert to milliseconds
      setEstimatedDuration(duration)
    }
  }, [currentLine])

  // Track speech progress
  useEffect(() => {
    if (isSpeaking && currentLine?.speaker === "Leo") {
      setSpeechStartTime(Date.now())
      const interval = setInterval(() => {
        if (speechStartTime) {
          const elapsed = Date.now() - speechStartTime
          const progress = Math.min((elapsed / estimatedDuration) * 100, 100)
          setSpeechProgress(progress)
        }
      }, 100)

      return () => clearInterval(interval)
    } else {
      setSpeechProgress(0)
      setSpeechStartTime(null)
    }
  }, [isSpeaking, currentLine, speechStartTime, estimatedDuration])

  if (!currentLine || currentLine.speaker !== "Leo") return null

  return (
    <Card className="border-blue-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-blue-700">🎤 Leo Speaking</CardTitle>
          <Badge variant={isSpeaking ? "default" : "secondary"}>{isSpeaking ? "Speaking..." : "Ready"}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current sentence being spoken */}
        <div className="p-3 bg-blue-50 rounded-lg border">
          <p className="text-sm font-medium leading-relaxed">{currentLine.text}</p>
        </div>

        {/* Speech progress */}
        {isSpeaking && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Speech Progress</span>
              <span>{Math.round(speechProgress)}%</span>
            </div>
            <Progress value={speechProgress} className="h-2" />
            <div className="text-xs text-gray-500 text-center">
              Estimated duration: {Math.round(estimatedDuration / 1000)}s
            </div>
          </div>
        )}

        {/* Sentence analysis */}
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="font-medium">{currentLine.text.split(/\s+/).length}</div>
            <div className="text-xs text-gray-500">Words</div>
          </div>
          <div className="text-center">
            <div className="font-medium">{currentLine.text.split(/[.!?]+/).length}</div>
            <div className="text-xs text-gray-500">Sentences</div>
          </div>
          <div className="text-center">
            <div className="font-medium">{Math.round(estimatedDuration / 1000)}s</div>
            <div className="text-xs text-gray-500">Est. Time</div>
          </div>
        </div>

        {/* Speech quality indicators */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span>Sentence Type:</span>
            <Badge variant="outline" className="text-xs">
              {currentLine.text.split(/\s+/).length >= 15 ? "Long" : "Standard"}
            </Badge>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span>Complexity:</span>
            <Badge variant="outline" className="text-xs">
              {currentLine.text.includes(",") && currentLine.text.includes('"') ? "Complex" : "Simple"}
            </Badge>
          </div>
        </div>

        {/* Instructions for user */}
        {!isSpeaking && callState.status === "ACTIVE" && (
          <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
            💡 Leo will speak this complete sentence. Listen carefully and wait for him to finish before responding.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
