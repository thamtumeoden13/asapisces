// File: components/companion/LiveTranscript.tsx

import { cn } from "@/lib/utils";

interface LiveTranscriptProps {
  /** Dòng thoại hiện tại cần hiển thị */
  text: string;
  /** Index của từ đang được highlight */
  highlightedWordIndex: number;
  /** Cho biết AI có đang nói hay không */
  isSpeaking: boolean;
  /** Cho biết đây có phải là lượt của người dùng hay không */
  isUserTurn: boolean;
}

export const LiveTranscript = ({
  text,
  highlightedWordIndex,
  isSpeaking,
  isUserTurn,
}: LiveTranscriptProps) => {
  // Tách câu thành các từ để có thể render riêng lẻ
  const words = text.split(/\s+/);

  return (
    <div className="text-center min-h-[100px]">
      {/* Hiển thị gợi ý cho người dùng */}
      {isUserTurn && (
        <span className="mb-2 inline-block rounded-full bg-yellow-500/10 px-3 py-1 text-sm font-semibold text-yellow-300 animate-pulse">
          🎯 Your turn!
        </span>
      )}

      {/* Hiển thị dòng thoại chính */}
      <p className="text-2xl md:text-3xl font-semibold leading-relaxed text-white">
        {words.map((word, index) => (
          <span
            key={index}
            className={cn(
              "transition-colors duration-150",
              // Logic highlight:
              // Chỉ highlight khi AI đang nói và index của từ khớp với highlightedWordIndex
              isSpeaking && index === highlightedWordIndex
                ? "text-cyan-400" // Màu được highlight
                : "text-white" // Màu mặc định
            )}
          >
            {word}{" "}
          </span>
        ))}
      </p>
    </div>
  );
};
