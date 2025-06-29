import fs from "fs"

// B1: Đọc toàn bộ file transcript
const rawTranscript = fs.readFileSync("transcript_2.txt", "utf-8")
const lines = rawTranscript.split("\n").filter(Boolean)

// B2: Cấu hình topics với TypeScript support
const topicConfig = [
  {
    key: "intro",
    keywords: ["Let's go!", "Welcome back to Pod Chill"],
    title: "Introduction & Welcome",
  },
  {
    key: "problem",
    keywords: ["Why can you understand English, but not speak it?", "passive skill"],
    title: "The Core Problem",
  },
  {
    key: "barriers",
    keywords: ["stuck in a loop", "translating in your head", "fear"],
    title: "Speaking Barriers",
  },
  {
    key: "techniques",
    keywords: ["shadowing", "record your voice", "think in English"],
    title: "Practical Techniques",
  },
  {
    key: "mindset",
    keywords: ["Let's set it free", "confidence", "brave voice"],
    title: "Mindset Transformation",
  },
  {
    key: "vocabulary",
    keywords: ["Bingo!", "fall flat on your face", "stay on track"],
    title: "Key Vocabulary",
  },
]

let currentTopic = "intro"
const podcastTopics = { [currentTopic]: [] }
const topicTitles = {}

// Tạo topicTitles từ config
topicConfig.forEach((topic) => {
  topicTitles[topic.key] = topic.title
})

let pastSpeaker = "Leo"

// Hàm tìm topic với multiple keywords
function findTopicFromLine(line) {
  const lineLower = line.toLowerCase()

  for (const topic of topicConfig) {
    for (const keyword of topic.keywords) {
      if (lineLower.includes(keyword.toLowerCase())) {
        return topic.key
      }
    }
  }
  return null
}

// Xử lý từng dòng
for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim()

  // Kiểm tra topic mới
  const newTopic = findTopicFromLine(line)
  if (newTopic && newTopic !== currentTopic) {
    currentTopic = newTopic
    if (!podcastTopics[currentTopic]) {
      podcastTopics[currentTopic] = []
    }
  }

  // Xử lý speaker và text
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
    podcastTopics[currentTopic].push({
      speaker: pastSpeaker,
      text: line,
    })
  }
}

// B3: Tạo TypeScript types
const createTypeScriptTypes = () => {
  const topicKeys = Object.keys(podcastTopics)
    .map((key) => `"${key}"`)
    .join(" | ")

  return `// TypeScript type definitions
export interface PodcastEntry {
  speaker: "Leo" | "Gwen";
  text: string;
}

export type TopicKey = ${topicKeys};

export interface PodcastTopics {
  ${Object.keys(podcastTopics)
    .map((key) => `${key}: PodcastEntry[];`)
    .join("\n  ")}
}

export type TopicTitles = Record<keyof PodcastTopics, string>;
`
}

// B4: Tạo output với TypeScript
const createTypeScriptOutput = () => {
  const types = createTypeScriptTypes()

  const podcastTopicsStr = JSON.stringify(podcastTopics, null, 2)
    .replace(/"speaker":/g, "\n    speaker:")
    .replace(/"text":/g, "\n    text:")

  const topicTitlesStr = JSON.stringify(topicTitles, null, 2)

  return `${types}
export const podcastTopics: PodcastTopics = ${podcastTopicsStr};

export const topicTitles: TopicTitles = ${topicTitlesStr};
`
}

// B5: Lưu file TypeScript
fs.writeFileSync("podcastData.ts", createTypeScriptOutput(), "utf-8")

// Thống kê
console.log("✅ Đã tạo podcastData.ts với TypeScript types!")
console.log("\n📊 THỐNG KÊ:")
console.log(`📝 Tổng số topics: ${Object.keys(podcastTopics).length}`)
Object.entries(podcastTopics).forEach(([topic, content]) => {
  console.log(`   ${topic}: ${content.length} câu nói`)
})
console.log(`💬 Tổng số câu nói: ${Object.values(podcastTopics).flat().length}`)
