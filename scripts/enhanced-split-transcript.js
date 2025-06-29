import fs from "fs";

// Phiên bản nâng cao với nhiều tùy chọn hơn
const rawTranscript = fs.readFileSync("transcript_2.txt", "utf-8");
const lines = rawTranscript.split("\n").filter(Boolean);

// Cấu hình topics linh hoạt hơn
const topicConfig = [
  {
    key: "intro",
    keywords: ["Let's go!", "Welcome back to Pod Chill"],
    title: "Introduction & Welcome",
    priority: 1,
  },
  {
    key: "problem",
    keywords: [
      "Why can you understand English, but not speak it?",
      "passive skill",
    ],
    title: "The Core Problem",
    priority: 2,
  },
  {
    key: "barriers",
    keywords: ["stuck in a loop", "translating in your head", "fear"],
    title: "Speaking Barriers",
    priority: 3,
  },
  {
    key: "techniques",
    keywords: ["shadowing", "record your voice", "think in English"],
    title: "Practical Techniques",
    priority: 4,
  },
  {
    key: "mindset",
    keywords: ["Let's set it free", "confidence", "brave voice"],
    title: "Mindset Transformation",
    priority: 5,
  },
  {
    key: "vocabulary",
    keywords: ["Bingo!", "fall flat on your face", "stay on track"],
    title: "Key Vocabulary",
    priority: 6,
  },
];

let currentTopic = "intro";
const podcastTopics = { [currentTopic]: [] };
const topicTitles = {};

// Tạo topicTitles từ config
topicConfig.forEach((topic) => {
  topicTitles[topic.key] = topic.title;
});

let pastSpeaker = "Leo";

// Hàm tìm topic với multiple keywords
function findTopicFromLine(line) {
  const lineLower = line.toLowerCase();

  for (const topic of topicConfig) {
    for (const keyword of topic.keywords) {
      if (lineLower.includes(keyword.toLowerCase())) {
        return topic.key;
      }
    }
  }
  return null;
}

// Xử lý từng dòng
for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();

  // Kiểm tra topic mới
  const newTopic = findTopicFromLine(line);
  if (newTopic && newTopic !== currentTopic) {
    currentTopic = newTopic;
    if (!podcastTopics[currentTopic]) {
      podcastTopics[currentTopic] = [];
    }
  }

  // Xử lý speaker và text
  const match = line.match(/^(Leo|Gwen):\s*(.*)$/);
  if (match) {
    pastSpeaker = match[1];
    const text = match[2].trim();

    if (text.length > 0) {
      podcastTopics[currentTopic].push({
        speaker: match[1],
        text: text,
      });
    }
  } else if (line.length > 0 && !line.includes(":")) {
    // Dòng tiếp theo không có speaker
    podcastTopics[currentTopic].push({
      speaker: pastSpeaker,
      text: line,
    });
  }
}

// Tạo output với format đẹp
const createOutput = () => {
  const podcastTopicsStr = JSON.stringify(podcastTopics, null, 2)
    .replace(/"speaker":/g, "\n    speaker:")
    .replace(/"text":/g, "\n    text:");

  const topicTitlesStr = JSON.stringify(topicTitles, null, 2);

  return `export const podcastTopics = ${podcastTopicsStr};

export const topicTitles = ${topicTitlesStr};
`;
};

// Lưu file
fs.writeFileSync("podcastData.js", createOutput(), "utf-8");

// Thống kê
console.log("✅ Đã tạo podcastData.js thành công!");
console.log("\n📊 THỐNG KÊ:");
console.log(`📝 Tổng số topics: ${Object.keys(podcastTopics).length}`);
Object.entries(podcastTopics).forEach(([topic, content]) => {
  console.log(`   ${topic}: ${content.length} câu nói`);
});
console.log(
  `💬 Tổng số câu nói: ${Object.values(podcastTopics).flat().length}`
);
