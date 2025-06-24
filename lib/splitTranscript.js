import fs from "fs";

// B1: Đọc toàn bộ file transcript
const rawTranscript = fs.readFileSync("transcript.txt", "utf-8");
const lines = rawTranscript.split("\n").filter(Boolean);

// B2: Các topic chính cần phân loại
const topics = [
  { key: "intro", keyword: "Let's get started" },
  { key: "definition", keyword: "What exactly is positive thinking" },
  { key: "health", keyword: "how does positive thinking impact our health" },
  { key: "mindset", keyword: "how someone can develop a positive mindset" },
  { key: "vocabulary", keyword: "Now let's learn some vocabulary" },
  { key: "selftalk", keyword: "how can we stop negative self-talk" },
  { key: "toxic", keyword: "toxic positivity" },
  { key: "visualization", keyword: "setting goals" },
  { key: "environment", keyword: "positive environment" },
  { key: "resilience", keyword: "things go wrong" },
];

let currentTopic = "intro";
const result = { [currentTopic]: [] };

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
    result[currentTopic].push({
      speaker: match[1],
      text: match[2],
    });
  } else if (line.length > 0) {
    // Nếu không có speaker, thêm như "narration" hoặc nối tiếp dòng trước
    result[currentTopic].push({
      speaker: "Narrator",
      text: line,
    });
  }
}

// B5: Lưu ra file JSON
fs.writeFileSync("transcriptTopics.json", JSON.stringify(result, null, 2), "utf-8");

console.log("✅ Đã chia thành từng topic và lưu vào transcriptTopics.json!");
