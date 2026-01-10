// components/companion/AudioVisualizer.tsx
"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface AudioVisualizerProps {
  isActive: boolean;
  barCount?: number;
}

export const AudioVisualizer = ({
  isActive,
  barCount = 50,
}: AudioVisualizerProps) => {
  const [waveformBars] = useState(() =>
    Array.from({ length: barCount }, () => ({
      baseHeight: Math.random() * 60 + 10,
      animationDelay: `${Math.random() * 500}ms`,
      animationDuration: `${Math.random() * 0.5 + 0.5}s`, // Thêm duration ngẫu nhiên
    }))
  );

  const placeholderHeight = "h-16 mt-4";

  return (
    <div
      className={cn(
        "flex items-center justify-center gap-[2px] w-full max-w-md",
        placeholderHeight
      )}
    >
      {waveformBars.map((bar, index) => (
        <div
          key={index}
          className="bg-gray-500 rounded-full w-[3px] transition-all duration-300 ease-in-out"
          style={{
            height: !isActive ? "10%" : `${bar.baseHeight}%`,
            // --- SỬA LỖI Ở ĐÂY: Tách các thuộc tính animation ---
            animationName: isActive ? "pulse" : "none",
            animationDuration: bar.animationDuration,
            animationIterationCount: "infinite",
            animationDirection: "alternate",
            animationTimingFunction: "ease-in-out",
            animationDelay: bar.animationDelay,
          }}
        />
      ))}
    </div>
  );
};
