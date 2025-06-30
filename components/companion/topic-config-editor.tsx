"use client"

import { useState } from "react"
import type { TopicConfig } from "@/scripts/transcript-processor"

interface TopicConfigEditorProps {
  config: TopicConfig[]
  onChange: (config: TopicConfig[]) => void
  onClose: () => void
}

export function TopicConfigEditor({ config, onChange, onClose }: TopicConfigEditorProps) {
  const [editingConfig, setEditingConfig] = useState<TopicConfig[]>(config)
  const [errors, setErrors] = useState<Record<number, string>>({})

  const validateConfig = (config: TopicConfig[]): Record<number, string> => {
    const errors: Record<number, string> = {}
    const usedKeys = new Set<string>()

    config.forEach((topic, index) => {
      if (!topic.key.trim()) {
        errors[index] = "Key is required"
      } else if (usedKeys.has(topic.key)) {
        errors[index] = "Key must be unique"
      } else if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(topic.key)) {
        errors[index] = "Key must start with letter and contain only letters, numbers, and underscores"
      }

      if (!topic.keyword.trim()) {
        errors[index] = (errors[index] ? errors[index] + ". " : "") + "Keyword is required"
      }

      usedKeys.add(topic.key)
    })

    return errors
  }

  const handleTopicChange = (index: number, field: keyof TopicConfig, value: string) => {
    const newConfig = [...editingConfig]
    newConfig[index] = { ...newConfig[index], [field]: value }
    setEditingConfig(newConfig)

    // Clear errors for this field
    const newErrors = { ...errors }
    delete newErrors[index]
    setErrors(newErrors)
  }

  const addTopic = () => {
    const newTopic: TopicConfig = {
      key: `topic_${editingConfig.length + 1}`,
      keyword: "",
      title: `Topic ${editingConfig.length + 1}`,
    }
    setEditingConfig([...editingConfig, newTopic])
  }

  const removeTopic = (index: number) => {
    const newConfig = editingConfig.filter((_, i) => i !== index)
    setEditingConfig(newConfig)

    // Remove errors for removed topic
    const newErrors = { ...errors }
    delete newErrors[index]
    setErrors(newErrors)
  }

  const handleSave = () => {
    const validationErrors = validateConfig(editingConfig)

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    onChange(editingConfig)
    onClose()
  }

  const handleReset = () => {
    setEditingConfig(config)
    setErrors({})
  }

  const presetConfigs = {
    englishLearning: [
      { key: "intro", keyword: "Let's go!", title: "Introduction & Welcome" },
      {
        key: "problem",
        keyword: "Let's begin with this: Why can you understand English, but not speak it?",
        title: "The Core Problem",
      },
      { key: "barriers", keyword: "It's like being stuck in a loop.", title: "Speaking Barriers" },
      { key: "techniques", keyword: "Just a brave voice.", title: "Practical Techniques" },
      { key: "mindset", keyword: "Let's set it free.", title: "Mindset Transformation" },
      { key: "vocabulary", keyword: "Bingo!", title: "Key Vocabulary" },
    ],
    general: [
      { key: "intro", keyword: "welcome", title: "Introduction" },
      { key: "main_topic", keyword: "today we're talking about", title: "Main Topic" },
      { key: "discussion", keyword: "let's discuss", title: "Discussion" },
      { key: "conclusion", keyword: "to wrap up", title: "Conclusion" },
    ],
    interview: [
      { key: "intro", keyword: "thanks for joining us", title: "Introduction" },
      { key: "background", keyword: "tell us about yourself", title: "Background" },
      { key: "experience", keyword: "your experience", title: "Experience" },
      { key: "advice", keyword: "what advice", title: "Advice" },
      { key: "closing", keyword: "thank you", title: "Closing" },
    ],
  }

  const loadPreset = (presetName: keyof typeof presetConfigs) => {
    setEditingConfig(presetConfigs[presetName])
    setErrors({})
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-black-100">Topic Configuration Editor</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">
            ×
          </button>
        </div>

        {/* Preset Configurations */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-black-100">Quick Presets:</h3>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => loadPreset("englishLearning")}
              className="px-3 py-1 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 text-sm"
            >
              English Learning
            </button>
            <button
              onClick={() => loadPreset("general")}
              className="px-3 py-1 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 text-sm"
            >
              General Podcast
            </button>
            <button
              onClick={() => loadPreset("interview")}
              className="px-3 py-1 bg-pink-100 text-pink-800 rounded-lg hover:bg-pink-200 text-sm"
            >
              Interview
            </button>
          </div>
        </div>

        {/* Topic Configuration Form */}
        <div className="space-y-4 mb-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-black-300">Topics ({editingConfig.length})</h3>
            <button onClick={addTopic} className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
              + Add Topic
            </button>
          </div>

          {editingConfig.map((topic, index) => (
            <div key={index} className="border rounded-lg p-4 bg-gray-50">
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-semibold text-gray-700">Topic {index + 1}</h4>
                {editingConfig.length > 1 && (
                  <button onClick={() => removeTopic(index)} className="text-red-500 hover:text-red-700 text-sm">
                    Remove
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-black-100">
                    Key <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={topic.key}
                    onChange={(e) => handleTopicChange(index, "key", e.target.value)}
                    className={`w-full p-2 border rounded-lg ${errors[index] ? "border-red-500" : "border-gray-300"}`}
                    placeholder="e.g., intro, problem"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-black-100">Title</label>
                  <input
                    type="text"
                    value={topic.title || ""}
                    onChange={(e) => handleTopicChange(index, "title", e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    placeholder="e.g., Introduction"
                  />
                </div>

                <div className="md:col-span-1">
                  <label className="block text-sm font-medium mb-1 text-black-100">
                    Keyword <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={topic.keyword}
                    onChange={(e) => handleTopicChange(index, "keyword", e.target.value)}
                    className={`w-full p-2 border rounded-lg ${errors[index] ? "border-red-500" : "border-gray-300"}`}
                    placeholder="e.g., Let's go!"
                  />
                </div>
              </div>

              {errors[index] && <p className="text-red-500 text-sm mt-2">{errors[index]}</p>}
            </div>
          ))}
        </div>

        {/* Configuration Preview */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-black-200">Configuration Preview</h3>
          <div className="bg-gray-100 p-4 rounded-lg">
            <pre className="text-xs text-black-300 overflow-x-auto">{JSON.stringify(editingConfig, null, 2)}</pre>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between">
          <div className="flex gap-2">
            <button onClick={handleReset} className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600">
              Reset
            </button>
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400">
              Cancel
            </button>
            <button onClick={handleSave} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
              Save Configuration
            </button>
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold text-blue-800 mb-2">How it works:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li className="text-blue-500">
              <strong>Key:</strong> Unique identifier for the topic (used in code)
            </li>
            <li className="text-blue-500">
              <strong>Title:</strong> Display name for the topic (optional)
            </li>
            <li className="text-blue-500">
              <strong>Keyword:</strong> Text that triggers this topic when found in transcript
            </li>
            <li className="text-blue-500">Topics are detected in order - more specific keywords should come first</li>
            <li className="text-blue-500">Keywords are case-insensitive by default</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
