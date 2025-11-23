"use client";

import type React from "react";

import { useState, useMemo, useEffect } from "react";
import {
  processTranscript,
  PodcastDataUtils,
  type TopicConfig,
} from "@/scripts/transcript-processor";
import { TopicConfigEditor } from "@/components/companion/topic-config-editor";
import { TranscriptSaveForm } from "@/components/companion/transcript-save-form";
import { Button } from "@/components/ui/button";
import { Save, Download, Sparkles, Settings } from "lucide-react";
import { DEFAULT_TOPIC_CONFIG, SAMPLE_TRANSCRIPT } from "@/constants";
import { generateTopicConfigAction } from "@/lib/actions/general.action";

export default function TranscriptProcessorComponent({
  editMode = false,
  companionData = null,
}: {
  editMode?: boolean;
  companionData?: any;
}) {
  const [rawTranscript, setRawTranscript] = useState(SAMPLE_TRANSCRIPT);
  const [topicConfig, setTopicConfig] =
    useState<TopicConfig[]>(DEFAULT_TOPIC_CONFIG);
  const [isEditingConfig, setIsEditingConfig] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSpeaker, setSelectedSpeaker] = useState<string>("all");
  const [isGenerating, setIsGenerating] = useState(false);

  // Process transcript with current config
  const processedData = useMemo(() => {
    if (!rawTranscript.trim() || topicConfig.length === 0) return null;

    return processTranscript(rawTranscript, topicConfig, {
      defaultTopic: topicConfig[0]?.key || "intro",
      minTextLength: 3,
      enableScoring: true,
    });
  }, [rawTranscript, topicConfig]);

  // Create utils instance
  const utils = useMemo(() => {
    if (!processedData) return null;
    return new PodcastDataUtils(
      processedData.podcastTopics,
      processedData.topicTitles
    );
  }, [processedData]);

  // Get filtered results
  const filteredResults = useMemo(() => {
    if (!utils || !processedData) return [];

    let results = Object.entries(processedData.podcastTopics).flatMap(
      ([topic, entries]) => entries.map((entry) => ({ ...entry, topic }))
    );

    if (searchTerm) {
      results = utils.searchEntries(searchTerm);
    }

    if (selectedSpeaker !== "all") {
      results = results.filter((entry) => entry.speaker === selectedSpeaker);
    }

    return results;
  }, [utils, searchTerm, selectedSpeaker, processedData]);

  const handleDownload = (format: "json" | "csv" | "markdown") => {
    if (!utils) return;
    utils.downloadData(`podcast-transcript`, format);
  };

  const handleConfigSave = (newConfig: TopicConfig[]) => {
    setTopicConfig(newConfig);
    setIsEditingConfig(false);
  };

  const handleImportConfig = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const config = JSON.parse(e.target?.result as string);
        if (
          Array.isArray(config) &&
          config.every((item) => item.key && item.keyword)
        ) {
          setTopicConfig(config);
        } else {
          alert("Invalid configuration format");
        }
      } catch (error) {
        alert("Error parsing configuration file");
      }
    };
    reader.readAsText(file);
  };

  const handleExportConfig = () => {
    const dataStr = JSON.stringify(topicConfig, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "topic-config.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleAutoGenerateTopics = async () => {
    setIsGenerating(true);
    try {
      // THAY ĐỔI Ở ĐÂY: Bỏ các tham số không cần thiết
      const result = await generateTopicConfigAction({ rawTranscript });
      if (result.success && result.data) {
        setTopicConfig(result.data);
      } else {
        alert(result.error || "An unknown error occurred.");
      }
    } catch (error) {
      console.error(error);
      alert("Failed to connect to the AI service.");
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (companionData && companionData.transcript_data) {
      setRawTranscript(companionData.transcript_data.rawTranscript || "");
      setTopicConfig(
        companionData.transcript_data.topicConfig || DEFAULT_TOPIC_CONFIG
      );
    }
  }, [companionData]);

  if (!processedData || !utils) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4 text-black-400">
          Transcript Processor
        </h1>

        {/* Configuration Management */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h2 className="text-lg font-semibold mb-3 text-black-200">
            Topic Configuration
          </h2>
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={handleAutoGenerateTopics}
              variant="outline"
              size="sm"
              className="text-purple-600 border-purple-200 hover:bg-purple-50"
              disabled={isGenerating || !rawTranscript.trim()}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {isGenerating ? "Generating..." : "Auto-Generate Topics"}
            </Button>
            <Button
              onClick={() => setIsEditingConfig(true)}
              variant="outline"
              size="sm"
              className="text-black-200"
            >
              <Settings className="w-4 h-4 mr-2" />
              Edit Topics
            </Button>
            <Button onClick={handleExportConfig} variant="outline" size="sm">
              Export Config
            </Button>
            <label className="inline-flex items-center px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 cursor-pointer text-sm">
              Import Config
              <input
                type="file"
                accept=".json"
                onChange={handleImportConfig}
                className="hidden"
              />
            </label>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Current topics: {topicConfig.map((t) => t.key).join(", ")}
          </p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2 text-black-300">
            Raw Transcript:
          </label>
          <textarea
            value={rawTranscript}
            onChange={(e) => setRawTranscript(e.target.value)}
            className="w-full h-32 p-3 border rounded-lg text-black-100"
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
    );
  }

  const stats = utils.getStatistics();

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-black-400">
        Transcript Processor
      </h1>

      {/* Configuration Management */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold text-black-200">
            Topic Configuration
          </h2>
          <div className="flex gap-2">
            <Button
              onClick={handleAutoGenerateTopics}
              variant="outline"
              size="sm"
              className="text-blue-400 border-purple hover:bg-purple"
              disabled={isGenerating || !rawTranscript.trim()}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {isGenerating ? "Generating..." : "Auto-Generate Topics"}
            </Button>

            <Button
              onClick={() => setIsEditingConfig(true)}
              variant="outline"
              size="sm"
              className="text-black-200"
            >
              <Settings className="w-4 h-4 mr-2" />
              Edit Topics
            </Button>
            <Button
              onClick={handleExportConfig}
              variant="outline"
              size="sm"
              className="text-black-200"
            >
              Export
            </Button>
            <label className="inline-flex items-center px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 cursor-pointer text-sm">
              Import
              <input
                type="file"
                accept=".json"
                onChange={handleImportConfig}
                className="hidden"
              />
            </label>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {topicConfig.map((topic) => (
            <div key={topic.key} className="bg-white p-2 rounded border">
              <div className="font-medium text-sm text-black-100">
                {topic.title || topic.key}
              </div>
              <div className="text-xs text-gray-600 truncate">
                &quot;{topic.keyword}&quot;
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Input Section */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2 text-black">
          Raw Transcript:
        </label>
        <textarea
          value={rawTranscript}
          onChange={(e) => setRawTranscript(e.target.value)}
          className="w-full h-32 p-3 border rounded-lg text-black-300"
          placeholder="Paste your transcript here..."
        />
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-800">Total Entries</h3>
          <p className="text-2xl font-bold text-blue-600">
            {stats.totalEntries}
          </p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="font-semibold text-green-800">Topics</h3>
          <p className="text-2xl font-bold text-green-600">
            {stats.totalTopics}
          </p>
        </div>
        <div className="bg-pink-100 p-4 rounded-lg">
          <h3 className="font-semibold text-pink-800">Processing Time</h3>
          <p className="text-2xl font-bold text-pink-600">
            {processedData.metadata.processingTime}ms
          </p>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg">
          <h3 className="font-semibold text-orange-800">Speakers</h3>
          <p className="text-2xl font-bold text-orange-600">
            {processedData.metadata.speakers.length}
          </p>
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
          className="border rounded-lg text-black-300"
        >
          <option value="all">All Speakers</option>
          {processedData.metadata.speakers.map((speaker) => (
            <option key={speaker} value={speaker}>
              {speaker}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          {/* Save to Supabase Button */}
          <TranscriptSaveForm
            rawTranscript={rawTranscript}
            topicConfig={topicConfig}
            processedData={processedData}
            companion={companionData}
          >
            <Button className="bg-pink-500 hover:bg-pink-600">
              <Save className="w-4 h-4 mr-2" />
              {editMode ? "Update Companion" : "Save Companion"}
            </Button>
          </TranscriptSaveForm>

          {/* Download Buttons */}
          <Button
            onClick={() => handleDownload("json")}
            variant="outline"
            className="text-black-300"
          >
            <Download className="w-4 h-4 mr-2" />
            JSON
          </Button>
          <Button
            onClick={() => handleDownload("csv")}
            variant="outline"
            className="text-black-300"
          >
            <Download className="w-4 h-4 mr-2" />
            CSV
          </Button>
          <Button
            onClick={() => handleDownload("markdown")}
            variant="outline"
            className="text-black-300"
          >
            <Download className="w-4 h-4 mr-2" />
            MD
          </Button>
        </div>
      </div>

      {/* Topic Breakdown */}
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-3 text-black-100">Topic Breakdown</h2>
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
        <h2 className="text-xl font-bold mb-3 text-black-200">
          Transcript Entries ({filteredResults.length})
        </h2>
        <div className="space-y-3 max-h-[90vh] border p-2 overflow-auto">
          {filteredResults.map((entry, index) => (
            <div
              key={index}
              className="bg-white p-4 border rounded-lg shadow-sm"
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  {processedData.topicTitles[entry.topic]}
                </span>
                <span className="font-semibold text-gray-700">
                  {entry.speaker}:
                </span>
              </div>
              <p className="text-gray-800">{entry.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Topic Config Editor Modal */}
      {isEditingConfig && (
        <TopicConfigEditor
          config={topicConfig}
          onChange={handleConfigSave}
          onClose={() => setIsEditingConfig(false)}
        />
      )}
    </div>
  );
}
