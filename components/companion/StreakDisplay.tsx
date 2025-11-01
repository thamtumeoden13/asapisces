// File: components/companion/StreakDisplay.tsx
"use client";

import { Flame } from "lucide-react";
import { cn } from "@/lib/utils"; // Giả sử bạn có hàm tiện ích này

interface StreakDisplayProps {
  streak: number;
  practicedToday: boolean;
}

export function StreakDisplay({ streak, practicedToday }: StreakDisplayProps) {
  const hasStreak = streak > 0;
  
  return (
    <div className="flex flex-col items-center justify-center text-center p-4 bg-orange-50 rounded-lg">
      <div className="relative">
        <Flame
          className={cn(
            "w-12 h-12 transition-colors",
            hasStreak ? "text-orange-500" : "text-gray-400"
          )}
        />
        {/* Thêm hiệu ứng lấp lánh nếu đã luyện tập hôm nay */}
        {practicedToday && (
            <div className="absolute top-0 left-0 w-12 h-12 bg-orange-400 rounded-full animate-ping opacity-75 -z-10"></div>
        )}
      </div>
      <p className="mt-2 text-2xl font-bold text-orange-600">{streak}</p>
      <p className="text-xs text-gray-600">
        {hasStreak ? "Day Streak" : "Start a session to begin your streak!"}
      </p>
    </div>
  );
}