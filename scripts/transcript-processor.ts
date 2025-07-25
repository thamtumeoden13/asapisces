import { PodcastEntry, PodcastTopics, ProcessorOptions, ProcessorResult, TopicConfig, TopicTitles } from "@/types";

/**
 * Main transcript processor function
 * @param rawTranscript - Raw transcript text
 * @param topics - Array of topic configurations (exact format as original)
 * @param options - Processing options
 * @returns Processed podcast data
 */
export function processTranscript(
  rawTranscript: string,
  topics: TopicConfig[],
  options: ProcessorOptions = {}
): ProcessorResult {
  const startTime = Date.now();

  // Default options
  const {
    defaultTopic = "intro",
    minTextLength = 0,
    caseSensitive = false,
    enableScoring = false,
  } = options;

  // Initialize
  const lines = rawTranscript.split("\n").filter(Boolean);
  let currentTopic = defaultTopic;
  const podcastTopics: PodcastTopics = { [currentTopic]: [] };
  const topicTitles: TopicTitles = {};

  // Build topic titles mapping (use key as title if no title provided)
  topics.forEach((topic) => {
    topicTitles[topic.key] = topic.title || topic.key;
    if (!podcastTopics[topic.key]) {
      podcastTopics[topic.key] = [];
    }
  });

  let pastSpeaker = "Leo";
  const speakers = new Set<string>();

  // Topic detection function - exact match with keyword
  function updateTopicFromLine(line: string): void {
    for (const topic of topics) {
      if (line.toLowerCase().trimEnd().includes(topic.keyword.toLowerCase().trimEnd())) {
        currentTopic = topic.key;
        if (!podcastTopics[currentTopic]) podcastTopics[currentTopic] = [];
        return;
      }
    }
  }

  // Process each line - exact logic as original
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Find topic from line
    updateTopicFromLine(line);

    // Find speaker: Leo or Gwen
    const match = line.match(/^(Leo|Gwen):\s*(.*)$/);
    if (match) {
      pastSpeaker = match[1];
      speakers.add(pastSpeaker);
      const text = match[2].trim();

      if (text.length > minTextLength) {
        podcastTopics[currentTopic].push({
          speaker: match[1] as "Leo" | "Gwen",
          text: text,
        });
      }
    } else if (line.length > minTextLength) {
      // If no speaker, continue with previous speaker
      podcastTopics[currentTopic].push({
        speaker: pastSpeaker as "Leo" | "Gwen",
        text: line,
      });
    }
  }

  // Calculate metadata
  const totalEntries = Object.values(podcastTopics).flat().length;
  const processingTime = Date.now() - startTime;

  return {
    podcastTopics,
    topicTitles,
    metadata: {
      totalEntries,
      totalTopics: Object.keys(podcastTopics).length,
      speakers: Array.from(speakers),
      processingTime,
    },
  };
}

/**
 * Utility functions for working with processed data
 */
export class PodcastDataUtils {
  constructor(
    private podcastTopics: PodcastTopics,
    private topicTitles: TopicTitles
  ) {}

  /**
   * Get all entries for a specific topic
   */
  getTopicEntries(topic: string): PodcastEntry[] {
    return this.podcastTopics[topic] || [];
  }

  /**
   * Get entries by speaker across all topics
   */
  getEntriesBySpeaker(
    speaker: string
  ): Array<PodcastEntry & { topic: string }> {
    const results: Array<PodcastEntry & { topic: string }> = [];

    Object.entries(this.podcastTopics).forEach(([topic, entries]) => {
      entries.forEach((entry) => {
        if (entry.speaker === speaker) {
          results.push({ ...entry, topic });
        }
      });
    });

    return results;
  }

  /**
   * Search for entries containing specific text
   */
  searchEntries(
    searchText: string,
    caseSensitive = false
  ): Array<PodcastEntry & { topic: string }> {
    const results: Array<PodcastEntry & { topic: string }> = [];
    const searchTerm = caseSensitive ? searchText : searchText.toLowerCase();

    Object.entries(this.podcastTopics).forEach(([topic, entries]) => {
      entries.forEach((entry) => {
        const entryText = caseSensitive ? entry.text : entry.text.toLowerCase();
        if (entryText.includes(searchTerm)) {
          results.push({ ...entry, topic });
        }
      });
    });

    return results;
  }

  /**
   * Get statistics about the podcast data
   */
  getStatistics() {
    const stats = {
      totalTopics: Object.keys(this.podcastTopics).length,
      totalEntries: Object.values(this.podcastTopics).flat().length,
      topicBreakdown: {} as Record<string, { count: number; title: string }>,
      speakerBreakdown: {} as Record<string, number>,
    };

    // Topic breakdown
    Object.entries(this.podcastTopics).forEach(([topic, entries]) => {
      stats.topicBreakdown[topic] = {
        count: entries.length,
        title: this.topicTitles[topic] || topic,
      };
    });

    // Speaker breakdown
    Object.values(this.podcastTopics)
      .flat()
      .forEach((entry) => {
        stats.speakerBreakdown[entry.speaker] =
          (stats.speakerBreakdown[entry.speaker] || 0) + 1;
      });

    return stats;
  }

  /**
   * Export data in different formats
   */
  exportData(format: "json" | "csv" | "markdown" = "json") {
    switch (format) {
      case "json":
        return JSON.stringify(
          {
            podcastTopics: this.podcastTopics,
            topicTitles: this.topicTitles,
          },
          null,
          2
        );

      case "csv":
        const csvRows = ["Topic,Speaker,Text"];
        Object.entries(this.podcastTopics).forEach(([topic, entries]) => {
          entries.forEach((entry) => {
            csvRows.push(
              `"${topic}","${entry.speaker}","${entry.text.replace(/"/g, '""')}"`
            );
          });
        });
        return csvRows.join("\n");

      case "markdown":
        let markdown = "# Podcast Transcript\n\n";
        Object.entries(this.podcastTopics).forEach(([topic, entries]) => {
          markdown += `## ${this.topicTitles[topic] || topic}\n\n`;
          entries.forEach((entry) => {
            markdown += `**${entry.speaker}:** ${entry.text}\n\n`;
          });
        });
        return markdown;

      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * Download data in different formats
   */
  downloadData(filename: string, format: "json" | "csv" | "markdown" = "json") {
    const data = this.exportData(format);
    const blob = new Blob([data], {
      type: `text/${format === "json" ? "json" : format === "csv" ? "csv" : "markdown"}`,
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

/**
 * Helper function to create topic configurations
 * @param topics - Array of topic configurations
 * @returns Array of topic configurations
 */
export function createTopicConfig(
  topics: Omit<TopicConfig, "keyword">[]
): TopicConfig[] {
  return topics.map((topic) => ({ ...topic, keyword: topic.key }));
}

