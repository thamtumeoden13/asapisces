// File: components/companion/LiveTranscript.tsx
"use client";

import { cn } from "@/lib/utils";
import type { SimilarityResult } from "@/types";

interface LiveTranscriptProps {
  /** Dòng thoại mục tiêu LUÔN LÀ từ kịch bản (currentLine.text) */
  text: string;
  /** Index của từ karaoke */
  highlightedWordIndex: number;
  /** Lượt của user? */
  isUserTurn: boolean;
  /** Kết quả so sánh real-time (chỉ tồn tại khi user đang nói) */
  realtimeSimilarity: SimilarityResult | null;
  isSpeakingScriptLine: boolean; // Prop mới để bật/tắt karaoke
}

export const LiveTranscript = ({
  text,
  highlightedWordIndex,
  isSpeakingScriptLine,
  isUserTurn,
  realtimeSimilarity,
}: LiveTranscriptProps) => {
  // Tách câu mục tiêu thành các từ
  const expectedWords = text.split(/\s+/);

  // --- Chế độ REAL-TIME (Khi user đang nói) ---
  if (isUserTurn && realtimeSimilarity) {
    return (
      <div className="text-center min-h-[100px]">
        {/* Huy hiệu "Your turn!" */}
        <span className="mb-2 inline-block rounded-full bg-yellow-500/10 px-3 py-1 text-sm font-semibold text-yellow-300 animate-pulse">
          🎯 Your turn!
        </span>
        <p className="text-2xl md:text-3xl font-semibold leading-relaxed">
          {expectedWords.map((expectedWord, index) => {
            // Lấy thông tin từ mảng `words` của realtimeSimilarity
            const userWordInfo = realtimeSimilarity.words[index];
            const isMatched = userWordInfo && userWordInfo.match;

            return (
              <span
                key={index}
                className={cn(
                  "transition-colors duration-150",
                  // Nếu đã được nói và khớp -> màu xanh
                  // Nếu chưa được nói hoặc không có trong user's speech -> màu xám
                  isMatched ? "text-green-300" : "text-gray-500"
                )}
              >
                {expectedWord}{" "}
              </span>
            );
          })}
        </p>
      </div>
    );
  }

  // --- Chế độ KARAOKE (Khi AI đang nói) hoặc Mặc định (Khi đến lượt user nhưng chưa nói) ---
  const words = text.split(/\s+/);
  return (
    <div className="text-center min-h-[100px]">
      {isUserTurn && (
        <span className="mb-2 inline-block rounded-full bg-yellow-500/10 px-3 py-1 text-sm font-semibold text-yellow-300 animate-pulse">
          🎯 Your turn!
        </span>
      )}
      <p className="text-2xl md:text-3xl font-semibold leading-relaxed">
        {words.map((word, index) => (
          <span
            key={index}
            className={cn(
              "transition-colors duration-150",
              // --- SỬA LOGIC Ở ĐÂY ---
              // Chỉ bật karaoke nếu `isSpeakingScriptLine` là true
              isSpeakingScriptLine && index === highlightedWordIndex
                ? "text-cyan-400"
                : "text-white"
            )}
          >
            {word}{" "}
          </span>
        ))}
      </p>
    </div>
  );
};
