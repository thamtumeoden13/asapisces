import fs from "fs";

// B1: Đọc toàn bộ file transcript
const rawTranscript = fs.readFileSync("transcript_2.txt", "utf-8");
const lines = rawTranscript.split("\n").filter(Boolean);

// B2: Các topic chính cần phân loại
const topics = [
  {
    key: "intro",
    keyword: "Let’s go!",
  },
  {
    key: "problem",
    keyword:
      "Let’s begin with this: Why can you understand English, but not speak it?",
  },
  {
    key: "barriers",
    keyword: "It's like being stuck in a loop.",
  },
  {
    key: "techniques",
    keyword: "Just a brave voice.",
  },
  {
    key: "mindset",
    keyword: "Let’s set it free.",
  },
  {
    key: "vocabulary",
    keyword: "Bingo!",
  },
];

let currentTopic = "intro";
const result = { [currentTopic]: [] };
let pastSpeaker = "Leo"

// B3: Hàm tìm topic hiện tại
function updateTopicFromLine(line) {
  for (const topic of topics) {
    if (line.toLowerCase().includes(topic.keyword.toLowerCase())) {
      currentTopic = topic.key;
      if (!result[currentTopic]) result[currentTopic] = [];
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
    pastSpeaker = match[1]
    result[currentTopic].push({
      speaker: match[1],
      text: match[2],
    });
  } else if (line.length > 0) {
    // Nếu không có speaker, thêm nối tiếp dòng trước
    result[currentTopic].push({
      speaker: pastSpeaker,
      text: line,
    });
  }
}

// B5: Lưu ra file JSON
fs.writeFileSync(
  "transcriptTopics_2.json",
  JSON.stringify(result, null, 2),
  "utf-8"
);

console.log("✅ Đã chia thành từng topic và lưu vào transcriptTopics_2.json!");
