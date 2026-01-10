// File: components/companion/Subtitle.tsx
"use client";

import { MessageSquareText } from "lucide-react";

interface SubtitleProps {
  message: string | null;
}

export const Subtitle = ({ message }: SubtitleProps) => {
  if (!message) {
    return <div className="h-10"></div>; // Giữ chiều cao để tránh giật layout
  }

  return (
    <div className="h-10 flex items-center justify-center gap-2 px-4">
      <MessageSquareText className="w-4 h-4 text-gray-400 flex-shrink-0" />
      <p className="text-sm text-gray-400 italic text-center line-clamp-2">
        {message}
      </p>
    </div>
  );
};
