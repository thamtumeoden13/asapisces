// File: components/companion/Subtitle.tsx
"use client";

import { MessageSquareText } from "lucide-react";
import { cn } from "@/lib/utils";

interface SubtitleProps {
  // Thay đổi prop để nhận một object
  retryInfo: {
    message: string;
    score: number;
  } | null;
}

export const Subtitle = ({ retryInfo }: SubtitleProps) => {
  // Giữ chiều cao cố định để không làm giật layout
  if (!retryInfo) {
    return <div className="h-12 md:h-16"></div>;
  }

  const { message, score } = retryInfo;
  const scorePercentage = Math.round(score * 100);

  return (
    <div className="h-12 md:h-16 flex flex-col items-center justify-center gap-1 px-4">
      {/* Tin nhắn retry */}
      <div className="flex items-center gap-2">
        <MessageSquareText className="w-4 h-4 text-gray-400 flex-shrink-0" />
        <p className="text-sm text-gray-400 italic text-center line-clamp-2">
          {message}
        </p>
      </div>

      {/* Điểm số */}
      <div className="text-xs font-medium text-gray-500">
        Similarity:{" "}
        <span
          className={cn(
            "font-bold text-sm", // Tăng cỡ chữ một chút
            score >= 0.7 ? "text-green-400" : "text-red-400"
          )}
        >
          {scorePercentage}%
        </span>
      </div>
    </div>
  );
};
