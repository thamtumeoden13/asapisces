"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import EnhancedCompanionConversationV2 from "@/components/companion/enhanced-companion-conversation-v2"
import { podcastTopics, topicTitles } from "@/data/podcast-topics"
import type { TopicKey } from "@/types/podcast"
import { Mic, Brain, Zap, Target, TrendingUp } from "lucide-react"

export default function VapiConversationPage() {
  const [selectedTopic, setSelectedTopic] = useState<TopicKey>("intro")
  const [voiceStyle, setVoiceStyle] = useState<"friendly" | "professional" | "casual" | "encouraging">("friendly")
  const [userLevel, setUserLevel] = useState<"beginner" | "intermediate" | "advanced">("intermediate")
  const [sessionCount, setSessionCount] = useState(0)

  const handleTopicComplete = (topic: TopicKey) => {
    setSessionCount((prev) => prev + 1)

    // Show completion message
    console.log(`Completed topic: ${topic}`)

    // Auto-suggest next topic
    const topicKeys = Object.keys(podcastTopics) as TopicKey[]
    const currentIndex = topicKeys.indexOf(topic)
    if (currentIndex < topicKeys.length - 1) {
      const nextTopic = topicKeys[currentIndex + 1]
      setSelectedTopic(nextTopic)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
      <div className="container mx-auto px-4 py-8">
        {/* Enhanced Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full">
              <Mic className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              VAPI Voice Conversation
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Advanced AI-powered conversation practice with real-time voice recognition, pronunciation feedback, and
            personalized learning analytics
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="text-center">
            <CardContent className="p-4">
              <Brain className="w-8 h-8 mx-auto mb-2 text-indigo-600" />
              <h3 className="font-semibold text-sm">AI-Powered</h3>
              <p className="text-xs text-gray-600">Advanced language processing</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-4">
              <Zap className="w-8 h-8 mx-auto mb-2 text-yellow-600" />
              <h3 className="font-semibold text-sm">Real-time Feedback</h3>
              <p className="text-xs text-gray-600">Instant pronunciation analysis</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-4">
              <Target className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <h3 className="font-semibold text-sm">Adaptive Learning</h3>
              <p className="text-xs text-gray-600">Personalized difficulty adjustment</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="p-4">
              <TrendingUp className="w-8 h-8 mx-auto mb-2 text-purple-600" />
              <h3 className="font-semibold text-sm">Progress Tracking</h3>
              <p className="text-xs text-gray-600">Detailed analytics & insights</p>
            </CardContent>
          </Card>
        </div>

        {/* Configuration Panel */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              Conversation Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Topic</label>
                <Select value={selectedTopic} onValueChange={(value: TopicKey) => setSelectedTopic(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(topicTitles).map(([key, title]) => (
                      <SelectItem key={key} value={key}>
                        {title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Your Level</label>
                <Select value={userLevel} onValueChange={(value: any) => setUserLevel(value)}>
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

              <div>
                <label className="text-sm font-medium mb-2 block">Voice Style</label>
                <Select value={voiceStyle} onValueChange={(value: any) => setVoiceStyle(value)}>
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

              <div className="flex flex-col justify-end">
                <div className="text-sm text-gray-600 mb-2">Sessions Completed</div>
                <Badge variant="outline" className="text-center">
                  {sessionCount} sessions
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Conversation Component */}
        <EnhancedCompanionConversationV2
          companionId="vapi-enhanced"
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

        {/* Tips Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>💡 Pro Tips for Better Practice</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2 text-green-700">For Better Recognition:</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Speak clearly and at a moderate pace</li>
                  <li>• Use a quiet environment with minimal background noise</li>
                  <li>• Position your microphone 6-8 inches from your mouth</li>
                  <li>• Take pauses between sentences</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-blue-700">For Better Learning:</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Focus on pronunciation over speed</li>
                  <li>• Practice the same topic multiple times</li>
                  <li>• Pay attention to the real-time feedback</li>
                  <li>• Review your session analytics after each practice</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
