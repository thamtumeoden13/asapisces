// File: components/companion/LiveTranscript.tsx

import { cn } from "@/lib/utils";
import type { SimilarityResult } from "@/types";

interface LiveTranscriptProps {
  /** Dòng thoại mục tiêu */
  text: string;
  /** Index của từ karaoke */
  highlightedWordIndex: number;
  /** AI đang nói? */
  isSpeaking: boolean;
  /** Lượt của user? */
  isUserTurn: boolean;
  /** Kết quả so sánh cuối cùng */
  finalSimilarity: SimilarityResult | null;
  /** Kết quả so sánh real-time */
  realtimeSimilarity: SimilarityResult | null;
}

export const LiveTranscript = ({
  text,
  highlightedWordIndex,
  isSpeaking,
  isUserTurn,
  finalSimilarity,
  realtimeSimilarity,
}: LiveTranscriptProps) => {
  // --- Chế độ 1: REAL-TIME (Ưu tiên cao nhất khi user đang nói) ---
  if (isUserTurn && realtimeSimilarity && realtimeSimilarity.words.length > 0) {
    const expectedWords = text.split(/\s+/);

    return (
      <div className="text-center min-h-[100px]">
        <p className="text-2xl md:text-3xl font-semibold leading-relaxed">
          {expectedWords.map((expectedWord, index) => {
            // Tìm xem từ của người dùng có khớp với từ mục tiêu này không
            const userWordInfo = realtimeSimilarity.words[index];
            const isMatched = userWordInfo && userWordInfo.match;

            return (
              <span
                key={index}
                className={cn(
                  "transition-colors duration-150",
                  isMatched ? "text-green-300" : "text-gray-500" // Từ khớp màu xanh, còn lại màu xám
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

  if (finalSimilarity && finalSimilarity.words.length > 0) {
    return (
      <div className="text-center min-h-[100px]">
        <p className="text-2xl md:text-3xl font-semibold leading-relaxed">
          {finalSimilarity.words.map((wordInfo, index) => (
            <span
              key={index}
              className={cn(
                "rounded px-1",
                wordInfo.match
                  ? "text-green-300 bg-green-500/10"
                  : "text-red-400 bg-red-500/20"
              )}
            >
              {wordInfo.word}{" "}
            </span>
          ))}
        </p>
        {/* Hiển thị điểm số */}
        <div className="mt-4 text-sm font-medium text-gray-400">
          Similarity:{" "}
          <span
            className={cn(
              "font-bold",
              finalSimilarity.score >= 0.7 ? "text-green-400" : "text-red-400"
            )}
          >
            {Math.round(finalSimilarity.score * 100)}%
          </span>
        </div>
      </div>
    );
  }

  // --- Chế độ 3: KARAOKE (Khi AI nói) hoặc Mặc định ---
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
              isSpeaking && index === highlightedWordIndex
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
