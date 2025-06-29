import fs from "fs"

// Phiên bản nâng cao với TypeScript types chi tiết hơn
const rawTranscript = fs.readFileSync("transcript_2.txt", "utf-8")
const lines = rawTranscript.split("\n").filter(Boolean)

// Cấu hình topics với metadata
const topicConfig = [
  {
    key: "intro",
    keywords: ["Let's go!", "Welcome back to Pod Chill", "I'm Leo"],
    title: "Introduction & Welcome",
    description: "Opening remarks and podcast introduction",
  },
  {
    key: "problem",
    keywords: ["Why can you understand English, but not speak it?", "passive skill", "listening is like watching"],
    title: "The Core Problem",
    description: "Understanding vs speaking English difficulty",
  },
  {
    key: "barriers",
    keywords: ["stuck in a loop", "translating in your head", "fear", "freeze"],
    title: "Speaking Barriers",
    description: "Common obstacles in English speaking",
  },
  {
    key: "techniques",
    keywords: ["shadowing", "record your voice", "think in English", "stop translating"],
    title: "Practical Techniques",
    description: "Five practical tips for improving speaking",
  },
  {
    key: "mindset",
    keywords: ["Let's set it free", "confidence", "brave voice", "mindset"],
    title: "Mindset Transformation",
    description: "Changing mental approach to speaking",
  },
  {
    key: "vocabulary",
    keywords: ["Bingo!", "fall flat on your face", "stay on track", "backed by science"],
    title: "Key Vocabulary",
    description: "Important phrases and expressions explained",
  },
]

let currentTopic = "intro"
const podcastTopics = { [currentTopic]: [] }
const topicTitles = {}
const topicDescriptions = {}

// Tạo metadata từ config
topicConfig.forEach((topic) => {
  topicTitles[topic.key] = topic.title
  topicDescriptions[topic.key] = topic.description
})

let pastSpeaker = "Leo"

// Hàm tìm topic với scoring system
function findBestTopicFromLine(line) {
  const lineLower = line.toLowerCase()
  let bestMatch = null
  let bestScore = 0

  for (const topic of topicConfig) {
    let score = 0
    for (const keyword of topic.keywords) {
      if (lineLower.includes(keyword.toLowerCase())) {
        score += keyword.length // Longer keywords get higher priority
      }
    }
    if (score > bestScore) {
      bestScore = score
      bestMatch = topic.key
    }
  }

  return bestMatch
}

// Xử lý từng dòng với improved logic
for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim()

  // Kiểm tra topic mới với scoring
  const newTopic = findBestTopicFromLine(line)
  if (newTopic && newTopic !== currentTopic) {
    currentTopic = newTopic
    if (!podcastTopics[currentTopic]) {
      podcastTopics[currentTopic] = []
    }
  }

  // Xử lý speaker và text với validation
  const match = line.match(/^(Leo|Gwen):\s*(.*)$/)
  if (match) {
    pastSpeaker = match[1]
    const text = match[2].trim()

    if (text.length > 0) {
      podcastTopics[currentTopic].push({
        speaker: match[1],
        text: text,
      })
    }
  } else if (line.length > 0 && !line.includes(":")) {
    // Dòng tiếp theo không có speaker
    if (line.length > 3) {
      // Ignore very short lines
      podcastTopics[currentTopic].push({
        speaker: pastSpeaker,
        text: line,
      })
    }
  }
}

// Tạo comprehensive TypeScript types
const createAdvancedTypeScriptTypes = () => {
  const topicKeys = Object.keys(podcastTopics)
    .map((key) => `"${key}"`)
    .join(" | ")

  return `// Comprehensive TypeScript type definitions for Podcast Data

/**
 * Represents a single podcast entry with speaker and text
 */
export interface PodcastEntry {
  /** The speaker name - either Leo or Gwen */
  speaker: "Leo" | "Gwen";
  /** The spoken text content */
  text: string;
}

/**
 * Union type of all available topic keys
 */
export type TopicKey = ${topicKeys};

/**
 * Main podcast topics structure containing all categorized entries
 */
export interface PodcastTopics {
${Object.keys(podcastTopics)
  .map((key) => `  /** ${topicDescriptions[key]} */\n  ${key}: PodcastEntry[];`)
  .join("\n")}
}

/**
 * Mapping of topic keys to their display titles
 */
export type TopicTitles = Record<keyof PodcastTopics, string>;

/**
 * Mapping of topic keys to their descriptions
 */
export type TopicDescriptions = Record<keyof PodcastTopics, string>;

/**
 * Complete podcast data structure
 */
export interface PodcastData {
  topics: PodcastTopics;
  titles: TopicTitles;
  descriptions: TopicDescriptions;
  metadata: {
    totalEntries: number;
    totalTopics: number;
    speakers: Array<"Leo" | "Gwen">;
    generatedAt: string;
  };
}
`
}

// Tạo output với advanced TypeScript
const createAdvancedOutput = () => {
  const types = createAdvancedTypeScriptTypes()

  const podcastTopicsStr = JSON.stringify(podcastTopics, null, 2)
    .replace(/"speaker":/g, "\n    speaker:")
    .replace(/"text":/g, "\n    text:")

  const topicTitlesStr = JSON.stringify(topicTitles, null, 2)
  const topicDescriptionsStr = JSON.stringify(topicDescriptions, null, 2)

  const totalEntries = Object.values(podcastTopics).flat().length
  const metadata = {
    totalEntries,
    totalTopics: Object.keys(podcastTopics).length,
    speakers: ["Leo", "Gwen"],
    generatedAt: new Date().toISOString(),
  }

  return `${types}
export const podcastTopics: PodcastTopics = ${podcastTopicsStr};

export const topicTitles: TopicTitles = ${topicTitlesStr};

export const topicDescriptions: TopicDescriptions = ${topicDescriptionsStr};

export const podcastData: PodcastData = {
  topics: podcastTopics,
  titles: topicTitles,
  descriptions: topicDescriptions,
  metadata: ${JSON.stringify(metadata, null, 2)},
};

// Utility functions with TypeScript support

/**
 * Get all entries for a specific topic
 */
export function getTopicEntries(topic: TopicKey): PodcastEntry[] {
  return podcastTopics[topic] || [];
}

/**
 * Get entries by speaker across all topics
 */
export function getEntriesBySpeaker(speaker: "Leo" | "Gwen"): PodcastEntry[] {
  return Object.values(podcastTopics)
    .flat()
    .filter(entry => entry.speaker === speaker);
}

/**
 * Search for entries containing specific text
 */
export function searchEntries(searchText: string): Array<PodcastEntry & { topic: TopicKey }> {
  const results: Array<PodcastEntry & { topic: TopicKey }> = [];
  
  Object.entries(podcastTopics).forEach(([topic, entries]) => {
    entries.forEach(entry => {
      if (entry.text.toLowerCase().includes(searchText.toLowerCase())) {
        results.push({ ...entry, topic: topic as TopicKey });
      }
    });
  });
  
  return results;
}
`
}

// Lưu file TypeScript
fs.writeFileSync("podcastData_adv.ts", createAdvancedOutput(), "utf-8")

// Detailed statistics
console.log("✅ Đã tạo podcastData.ts với comprehensive TypeScript types!")
console.log("\n📊 CHI TIẾT THỐNG KÊ:")
console.log(`📝 Tổng số topics: ${Object.keys(podcastTopics).length}`)
console.log(`💬 Tổng số câu nói: ${Object.values(podcastTopics).flat().length}`)
console.log(`👥 Speakers: Leo, Gwen`)

console.log("\n📋 PHÂN TÍCH THEO TOPIC:")
Object.entries(podcastTopics).forEach(([topic, content]) => {
  const leoCount = content.filter((entry) => entry.speaker === "Leo").length
  const gwenCount = content.filter((entry) => entry.speaker === "Gwen").length
  console.log(`   ${topic}: ${content.length} câu (Leo: ${leoCount}, Gwen: ${gwenCount})`)
})

console.log("\n🎯 FEATURES ĐƯỢC TẠO:")
console.log("   ✓ Comprehensive TypeScript interfaces")
console.log("   ✓ Topic descriptions và metadata")
console.log("   ✓ Utility functions với type safety")
console.log("   ✓ Search và filter functions")
console.log("   ✓ Complete documentation")
