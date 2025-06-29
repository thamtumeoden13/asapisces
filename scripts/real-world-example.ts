import fs from "fs";
import {
  processTranscript,
  createTopicConfig,
  PodcastDataUtils,
} from "./transcript-processor";

// Real-world usage with your actual data
export function processEnglishLearningPodcast() {
  // Read your transcript file
  const rawTranscript = fs.readFileSync("transcript_2.txt", "utf-8");

  // Your actual topic configuration
  const topicConfig = createTopicConfig([
    {
      key: "intro",
      keywords: ["Let's go!", "Welcome back to Pod Chill", "I'm Leo"],
      title: "Introduction & Welcome",
      description: "Opening remarks and podcast introduction",
      priority: 1,
    },
    {
      key: "problem",
      keywords: [
        "Why can you understand English, but not speak it?",
        "passive skill",
        "listening is like watching",
      ],
      title: "The Core Problem",
      description: "Understanding vs speaking English difficulty",
      priority: 2,
    },
    {
      key: "barriers",
      keywords: [
        "stuck in a loop",
        "translating in your head",
        "fear",
        "freeze",
      ],
      title: "Speaking Barriers",
      description: "Common obstacles in English speaking",
      priority: 3,
    },
    {
      key: "techniques",
      keywords: [
        "shadowing",
        "record your voice",
        "think in English",
        "stop translating",
      ],
      title: "Practical Techniques",
      description: "Five practical tips for improving speaking",
      priority: 4,
    },
    {
      key: "mindset",
      keywords: ["Let's set it free", "confidence", "brave voice", "mindset"],
      title: "Mindset Transformation",
      description: "Changing mental approach to speaking",
      priority: 5,
    },
    {
      key: "vocabulary",
      keywords: [
        "Bingo!",
        "fall flat on your face",
        "stay on track",
        "backed by science",
      ],
      title: "Key Vocabulary",
      description: "Important phrases and expressions explained",
      priority: 6,
    },
  ]);

  // Process with custom options
  const result = processTranscript(rawTranscript, topicConfig, {
    defaultTopic: "intro",
    minTextLength: 3,
    enableScoring: true,
    caseSensitive: false,
  });

  // Create utility instance
  const utils = new PodcastDataUtils(result.podcastTopics, result.topicTitles);

  // Log detailed statistics
  console.log("🎙️ English Learning Podcast Processing Complete!");
  console.log("\n📊 METADATA:");
  console.log(`   Total entries: ${result.metadata.totalEntries}`);
  console.log(`   Total topics: ${result.metadata.totalTopics}`);
  console.log(`   Processing time: ${result.metadata.processingTime}ms`);
  console.log(`   Speakers: ${result.metadata.speakers.join(", ")}`);

  const stats = utils.getStatistics();
  console.log("\n📈 TOPIC BREAKDOWN:");
  Object.entries(stats.topicBreakdown).forEach(([topic, data]) => {
    console.log(`   ${data.title}: ${data.count} entries`);
  });

  console.log("\n👥 SPEAKER BREAKDOWN:");
  Object.entries(stats.speakerBreakdown).forEach(([speaker, count]) => {
    console.log(`   ${speaker}: ${count} entries`);
  });

  // Save processed data
  const outputData = {
    podcastTopics: result.podcastTopics,
    topicTitles: result.topicTitles,
    metadata: result.metadata,
  };

  fs.writeFileSync(
    "processed-podcast-data.json",
    JSON.stringify(outputData, null, 2),
    "utf-8"
  );

  console.log("\n✅ Saved processed data to 'processed-podcast-data.json'");

  return result;
}

// Run the processor
if (require.main === module) {
  processEnglishLearningPodcast();
}
