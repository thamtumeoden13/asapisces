import fs from "fs";

// B1: Đọc toàn bộ file transcript
const rawTranscript = fs.readFileSync("transcript_2.txt", "utf-8");
const lines = rawTranscript.split("\n").filter(Boolean);

// B2: Các topic chính cần phân loại với titles
const topics = [
  {
    key: "intro",
    keyword: "Let's go!",
    title: "Introduction",
  },
  {
    key: "problem",
    keyword:
      "Let's begin with this: Why can you understand English, but not speak it?",
    title: "Understanding vs Speaking Problem",
  },
  {
    key: "barriers",
    keyword: "It's like being stuck in a loop.",
    title: "Common Speaking Barriers",
  },
  {
    key: "techniques",
    keyword: "Just a brave voice.",
    title: "Speaking Improvement Techniques",
  },
  {
    key: "mindset",
    keyword: "Let's set it free.",
    title: "Mindset and Confidence",
  },
  {
    key: "vocabulary",
    keyword: "Bingo!",
    title: "Vocabulary Learning",
  },
];

let currentTopic = "intro";
const podcastTopics = { [currentTopic]: [] };
const topicTitles = {};

// Tạo topicTitles object
topics.forEach((topic) => {
  topicTitles[topic.key] = topic.title;
});

let pastSpeaker = "Leo";

// B3: Hàm tìm topic hiện tại
function updateTopicFromLine(line) {
  for (const topic of topics) {
    if (line.toLowerCase().includes(topic.keyword.toLowerCase())) {
      currentTopic = topic.key;
      if (!podcastTopics[currentTopic]) podcastTopics[currentTopic] = [];
      return;
    }
  }
}

// B4: Duyệt từng dòng và phân loại
for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();

  // Tìm topic mới nếu có
  updateTopicFromLine(line);

  // Tìm speaker: Leo hoặc Gwen
  const match = line.match(/^(Leo|Gwen):\s*(.*)$/);
  if (match) {
    pastSpeaker = match[1];
    podcastTopics[currentTopic].push({
      speaker: match[1],
      text: match[2],
    });
  } else if (line.length > 0) {
    // Nếu không có speaker, thêm nối tiếp dòng trước
    podcastTopics[currentTopic].push({
      speaker: pastSpeaker,
      text: line,
    });
  }
}

// B5: Tạo output theo format mong muốn
const output = `export const podcastTopics = ${JSON.stringify(podcastTopics, null, 2)};

export const topicTitles = ${JSON.stringify(topicTitles, null, 2)};
`;

// B6: Lưu ra file JavaScript
fs.writeFileSync("podcastData.js", output, "utf-8");

console.log("✅ Đã tạo podcastData.js với format mong muốn!");
console.log("📊 Topics được tạo:", Object.keys(podcastTopics));
console.log("📝 Tổng số câu nói:", Object.values(podcastTopics).flat().length);
