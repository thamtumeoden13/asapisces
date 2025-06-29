import {
  processTranscript,
  createTopicConfig,
  PodcastDataUtils,
  type TopicConfig,
} from "./transcript-processor";

// Example usage
export function exampleUsage() {
  // Sample raw transcript
  const rawTranscript = `
Leo: Hey everyone! Welcome back to Pod Chill!
Gwen: I'm here to help Leo stay on track.
Leo: Let's begin with this: Why can you understand English, but not speak it?
Gwen: Well, listening is a passive skill.
Leo: It's like being stuck in a loop.
Gwen: Just a brave voice.
Leo: Let's set it free.
Gwen: Bingo!
  `;

  // Define topic configuration
  const topicConfig: TopicConfig[] = createTopicConfig([
    {
      key: "intro",
      keywords: ["Welcome back", "Pod Chill"],
      title: "Introduction & Welcome",
      description: "Opening remarks and podcast introduction",
      priority: 1,
    },
    {
      key: "problem",
      keywords: ["Why can you understand English", "passive skill"],
      title: "The Core Problem",
      description: "Understanding vs speaking English difficulty",
      priority: 2,
    },
    {
      key: "barriers",
      keywords: ["stuck in a loop"],
      title: "Speaking Barriers",
      description: "Common obstacles in English speaking",
      priority: 3,
    },
    {
      key: "techniques",
      keywords: ["brave voice"],
      title: "Practical Techniques",
      description: "Tips for improving speaking",
      priority: 4,
    },
    {
      key: "mindset",
      keywords: ["Let's set it free"],
      title: "Mindset Transformation",
      description: "Changing mental approach to speaking",
      priority: 5,
    },
    {
      key: "vocabulary",
      keywords: ["Bingo!"],
      title: "Key Vocabulary",
      description: "Important phrases and expressions",
      priority: 6,
    },
  ]);

  // Process the transcript
  const result = processTranscript(rawTranscript, topicConfig, {
    defaultTopic: "intro",
    minTextLength: 5,
    enableScoring: true,
    caseSensitive: false,
  });

  // Extract results
  const { podcastTopics, topicTitles, metadata } = result;

  console.log("📊 Processing Results:");
  console.log(`✅ Total entries: ${metadata.totalEntries}`);
  console.log(`📝 Total topics: ${metadata.totalTopics}`);
  console.log(`⏱️ Processing time: ${metadata.processingTime}ms`);
  console.log(`👥 Speakers: ${metadata.speakers.join(", ")}`);

  // Use utility class
  const utils = new PodcastDataUtils(podcastTopics, topicTitles);

  // Get statistics
  const stats = utils.getStatistics();
  console.log("\n📈 Statistics:", stats);

  // Search functionality
  const searchResults = utils.searchEntries("English");
  console.log("\n🔍 Search results for 'English':", searchResults);

  // Export in different formats
  const jsonExport = utils.exportData("json");
  const csvExport = utils.exportData("csv");
  const markdownExport = utils.exportData("markdown");

  return {
    podcastTopics,
    topicTitles,
    metadata,
    utils,
    exports: {
      json: jsonExport,
      csv: csvExport,
      markdown: markdownExport,
    },
  };
}

// For direct usage without example
export function processMyTranscript(
  rawTranscript: string,
  topicConfig: TopicConfig[]
) {
  const result = processTranscript(rawTranscript, topicConfig);
  return {
    podcastTopics: result.podcastTopics,
    topicTitles: result.topicTitles,
  };
}
