"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Mic, Volume2, Clock, Target, TrendingUp, AlertCircle } from "lucide-react"
import type { SpeechQualityMetrics } from "@/lib/enhanced-voice-recognition"

interface RealTimeFeedbackPanelProps {
  speechMetrics: SpeechQualityMetrics | null
  realTimeMetrics: {
    responseTime: number
    confidenceLevel: number
    speechClarity: number
  }
  currentSimilarity: number
  suggestions: string[]
  isActive: boolean
}

export function RealTimeFeedbackPanel({
  speechMetrics,
  realTimeMetrics,
  currentSimilarity,
  suggestions = [],
  isActive,
}: RealTimeFeedbackPanelProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return "default"
    if (score >= 60) return "secondary"
    return "destructive"
  }

  return (
    <div className="space-y-4">
      {/* Real-time Metrics */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Real-time Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Target className="h-3 w-3" />
                  Accuracy
                </span>
                <Badge variant={getScoreBadgeVariant(currentSimilarity * 100)}>
                  {Math.round(currentSimilarity * 100)}%
                </Badge>
              </div>
              <Progress value={currentSimilarity * 100} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Response Time
                </span>
                <span className="text-xs font-medium">{(realTimeMetrics.responseTime / 1000).toFixed(1)}s</span>
              </div>
              <Progress value={Math.max(0, 100 - realTimeMetrics.responseTime / 50)} className="h-2" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Mic className="h-3 w-3" />
                  Confidence
                </span>
                <span className={`text-xs font-medium ${getScoreColor(realTimeMetrics.confidenceLevel)}`}>
                  {Math.round(realTimeMetrics.confidenceLevel)}%
                </span>
              </div>
              <Progress value={realTimeMetrics.confidenceLevel} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Volume2 className="h-3 w-3" />
                  Clarity
                </span>
                <span className={`text-xs font-medium ${getScoreColor(realTimeMetrics.speechClarity)}`}>
                  {Math.round(realTimeMetrics.speechClarity)}%
                </span>
              </div>
              <Progress value={realTimeMetrics.speechClarity} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Speech Quality Metrics */}
      {speechMetrics && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Speech Quality</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <div className={`text-lg font-bold ${getScoreColor(speechMetrics.pronunciation * 100)}`}>
                  {Math.round(speechMetrics.pronunciation * 100)}%
                </div>
                <div className="text-xs text-muted-foreground">Pronunciation</div>
              </div>
              <div className="text-center">
                <div className={`text-lg font-bold ${getScoreColor(speechMetrics.fluency * 100)}`}>
                  {Math.round(speechMetrics.fluency * 100)}%
                </div>
                <div className="text-xs text-muted-foreground">Fluency</div>
              </div>
              <div className="text-center">
                <div className={`text-lg font-bold ${getScoreColor(speechMetrics.pace * 100)}`}>
                  {Math.round(speechMetrics.pace * 100)}%
                </div>
                <div className="text-xs text-muted-foreground">Pace</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {suggestions.map((suggestion, index) => (
                <li key={index} className="text-xs text-muted-foreground flex items-start gap-2">
                  <span className="w-1 h-1 bg-muted-foreground rounded-full mt-2 flex-shrink-0" />
                  {suggestion}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Status Indicator */}
      <div className="flex items-center justify-center">
        <div
          className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs ${
            isActive
              ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
              : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
          }`}
        >
          <div className={`w-2 h-2 rounded-full ${isActive ? "bg-green-500 animate-pulse" : "bg-gray-400"}`} />
          {isActive ? "Listening..." : "Ready"}
        </div>
      </div>
    </div>
  )
}
