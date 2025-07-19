"use client"

import type React from "react"

import { useState, useMemo } from "react"
import { processTranscript, PodcastDataUtils, type TopicConfig } from "@/scripts/transcript-processor"
import { TopicConfigEditor } from "./topic-config-editor"

// Sample data for demo
const SAMPLE_TRANSCRIPT = `Leo: Hey hey hey! What's up, everybody? 
Leo: Welcome back to Pod Chill!
Leo: I'm Leo – your favorite joke master.
Gwen: And I'm Gwen. 
Gwen: I'm here to help Leo stay on track so that he doesn't make too many silly jokes.
Leo: That's my talent! But today we're not just here for jokes. 
Leo: We're talking about something serious. Kind of.
Gwen: A problem many English learners face: You can understand English. You watch movies, you understand songs, maybe you even understand us.
Leo: But when it's your turn to speak?
Gwen: It's like... blank.
Gwen: You freeze. 
Gwen: Or you say "uh... uh..." like a broken robot.
Leo: So why does this happen?
Gwen: Let's go!

Leo: Let's begin with this: Why can you understand English, but not speak it?
Gwen: Well, listening is a passive skill. 
Gwen: Your brain just receives information.
Leo: It's like being stuck in a loop. 
Leo: But don't worry—we're not gonna leave you hanging. 
Leo: We've got five things that actually help.
Gwen: You don't need perfect grammar. Just a brave voice.
Leo: It's already inside. Let's set it free.

Gwen: Before wrapping up, we will learn some phrases.
Leo: Bingo!`

// Default topic configuration
const DEFAULT_TOPIC_CONFIG: TopicConfig[] = [
  {
    "key": "intro",
    "keyword": "Hey everyone!",
    "title": "Introduction & Welcome"
  },
  {
    "key": "problem",
    "keyword": "Gwen, let's start with the basics.",
    "title": "The Core Problem"
  },
  {
    "key": "barriers",
    "keyword": "Now, Leo, let's talk about how someone can develop a positive mindset. ",
    "title": "Speaking Barriers"
  },
  {
    "key": "vocabulary",
    "keyword": "Now let's learn some vocabulary below, so you can understand the topic better before continuing to listen.",
    "title": "Key Vocabulary"
  },
  {
    "key": "techniques",
    "keyword": "Sometimes we're too hard on ourselves, right? ",
    "title": "Practical Techniques"
  },
  {
    "key": "mindset",
    "keyword": "Hmm, what's next?",
    "title": "Mindset Transformation"
  },
  {
    "key": "pratice",
    "keyword": "Last but not least, Gwen, how can we stay positive when things go wrong?",
    "title": "Stay positive"
  }
]

export default function EnhancedTranscriptProcessor() {
  const [rawTranscript, setRawTranscript] = useState(SAMPLE_TRANSCRIPT)
  const [topicConfig, setTopicConfig] = useState<TopicConfig[]>(DEFAULT_TOPIC_CONFIG)
  const [isEditingConfig, setIsEditingConfig] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSpeaker, setSelectedSpeaker] = useState<string>("all")

  // Process transcript with current config
  const processedData = useMemo(() => {
    if (!rawTranscript.trim() || topicConfig.length === 0) return null

    return processTranscript(rawTranscript, topicConfig, {
      defaultTopic: topicConfig[0]?.key || "intro",
      minTextLength: 3,
      enableScoring: true,
    })
  }, [rawTranscript, topicConfig])

  // Create utils instance
  const utils = useMemo(() => {
    if (!processedData) return null
    return new PodcastDataUtils(processedData.podcastTopics, processedData.topicTitles)
  }, [processedData])

  // Get filtered results
  const filteredResults = useMemo(() => {
    if (!utils || !processedData) return []

    let results = Object.entries(processedData.podcastTopics).flatMap(([topic, entries]) =>
      entries.map((entry) => ({ ...entry, topic })),
    )

    if (searchTerm) {
      results = utils.searchEntries(searchTerm)
    }

    if (selectedSpeaker !== "all") {
      results = results.filter((entry) => entry.speaker === selectedSpeaker)
    }

    return results
  }, [utils, searchTerm, selectedSpeaker, processedData])

  const handleDownload = (format: "json" | "csv" | "markdown") => {
    if (!utils) return
    utils.downloadData(`podcast-transcript`, format)
  }

  const handleConfigSave = (newConfig: TopicConfig[]) => {
    setTopicConfig(newConfig)
    setIsEditingConfig(false)
  }

  const handleImportConfig = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const config = JSON.parse(e.target?.result as string)
        if (Array.isArray(config) && config.every((item) => item.key && item.keyword)) {
          setTopicConfig(config)
        } else {
          alert("Invalid configuration format")
        }
      } catch (error) {
        alert("Error parsing configuration file")
      }
    }
    reader.readAsText(file)
  }

  const handleExportConfig = () => {
    const dataStr = JSON.stringify(topicConfig, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = "topic-config.json"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  if (!processedData || !utils) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Enhanced Transcript Processor</h1>

        {/* Configuration Management */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h2 className="text-lg font-semibold mb-3">Topic Configuration</h2>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setIsEditingConfig(true)}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
            >
              Edit Topics
            </button>
            <button
              onClick={handleExportConfig}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Export Config
            </button>
            <label className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 cursor-pointer">
              Import Config
              <input type="file" accept=".json" onChange={handleImportConfig} className="hidden" />
            </label>
          </div>
          <p className="text-sm text-gray-600 mt-2">Current topics: {topicConfig.map((t) => t.key).join(", ")}</p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Raw Transcript:</label>
          <textarea
            value={rawTranscript}
            onChange={(e) => setRawTranscript(e.target.value)}
            className="w-full h-32 p-3 border rounded-lg"
            placeholder="Paste your transcript here..."
          />
        </div>

        {isEditingConfig && (
          <TopicConfigEditor
            config={topicConfig}
            onChange={handleConfigSave}
            onClose={() => setIsEditingConfig(false)}
          />
        )}
      </div>
    )
  }

  const stats = utils.getStatistics()

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Enhanced Transcript Processor</h1>

      {/* Configuration Management */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold">Topic Configuration</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditingConfig(true)}
              className="px-3 py-1 bg-purple-500 text-white rounded-lg hover:bg-purple-600 text-sm"
            >
              Edit Topics
            </button>
            <button
              onClick={handleExportConfig}
              className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
            >
              Export
            </button>
            <label className="px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 cursor-pointer text-sm">
              Import
              <input type="file" accept=".json" onChange={handleImportConfig} className="hidden" />
            </label>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {topicConfig.map((topic) => (
            <div key={topic.key} className="bg-white p-2 rounded border">
              <div className="font-medium text-sm">{topic.title || topic.key}</div>
              <div className="text-xs text-gray-600 truncate">"{topic.keyword}"</div>
            </div>
          ))}
        </div>
      </div>

      {/* Input Section */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Raw Transcript:</label>
        <textarea
          value={rawTranscript}
          onChange={(e) => setRawTranscript(e.target.value)}
          className="w-full h-32 p-3 border rounded-lg"
          placeholder="Paste your transcript here..."
        />
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-800">Total Entries</h3>
          <p className="text-2xl font-bold text-blue-600">{stats.totalEntries}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="font-semibold text-green-800">Topics</h3>
          <p className="text-2xl font-bold text-green-600">{stats.totalTopics}</p>
        </div>
        <div className="bg-pink-100 p-4 rounded-lg">
          <h3 className="font-semibold text-pink-800">Processing Time</h3>
          <p className="text-2xl font-bold text-pink-600">{processedData.metadata.processingTime}ms</p>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg">
          <h3 className="font-semibold text-orange-800">Speakers</h3>
          <p className="text-2xl font-bold text-orange-600">{processedData.metadata.speakers.length}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1 min-w-64">
          <input
            type="text"
            placeholder="Search in transcript..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 border rounded-lg"
          />
        </div>
        <select
          value={selectedSpeaker}
          onChange={(e) => setSelectedSpeaker(e.target.value)}
          className="p-2 border rounded-lg"
        >
          <option value="all">All Speakers</option>
          {processedData.metadata.speakers.map((speaker) => (
            <option key={speaker} value={speaker}>
              {speaker}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <button
            onClick={() => handleDownload("json")}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Download JSON
          </button>
          <button
            onClick={() => handleDownload("csv")}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
          >
            Download CSV
          </button>
          <button
            onClick={() => handleDownload("markdown")}
            className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600"
          >
            Download MD
          </button>
        </div>
      </div>

      {/* Topic Breakdown */}
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-3">Topic Breakdown</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(stats.topicBreakdown).map(([topic, data]) => (
            <div key={topic} className="bg-blue-50 p-3 rounded-lg">
              <h3 className="font-semibold text-blue-800">{data.title}</h3>
              <p className="text-sm text-gray-600">{data.count} entries</p>
            </div>
          ))}
        </div>
      </div>

      {/* Results */}
      <div>
        <h2 className="text-xl font-bold mb-3">Transcript Entries ({filteredResults.length})</h2>
        <div className="space-y-3 max-h-[90vh] p-2 overflow-auto rounded-lg bg-red-500">
          {filteredResults.map((entry, index) => (
            <div key={index} className="bg-white p-4 border rounded-lg shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  {processedData.topicTitles[entry.topic]}
                </span>
                <span className="font-semibold text-gray-700">{entry.speaker}:</span>
              </div>
              <p className="text-gray-800">{entry.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Topic Config Editor Modal */}
      {isEditingConfig && (
        <TopicConfigEditor config={topicConfig} onChange={handleConfigSave} onClose={() => setIsEditingConfig(false)} />
      )}
    </div>
  )
}
