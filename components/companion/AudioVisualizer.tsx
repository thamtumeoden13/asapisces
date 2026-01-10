// components/companion/AudioVisualizer.tsx
"use client";

import { useState } from "react";

interface AudioVisualizerProps {
  isActive: boolean;
  barCount?: number;
}

export const AudioVisualizer = ({
  isActive,
  barCount = 50,
}: AudioVisualizerProps) => {
  // Mảng này chỉ được tạo một lần khi component mount
  const [waveformBars] = useState(() =>
    Array.from({ length: barCount }, () => ({
      // Chiều cao cơ bản ngẫu nhiên từ 10% đến 70%
      baseHeight: Math.random() * 60 + 10,
      // Delay ngẫu nhiên cho animation
      animationDelay: `${Math.random() * 500}ms`,
    }))
  );

  return (
    <div className="flex items-center justify-center gap-[2px] h-16 w-full max-w-md mt-4">
      {waveformBars.map((bar, index) => (
        <div
          key={index}
          className="bg-gray-500 rounded-full w-[3px] transition-all duration-300 ease-in-out"
          style={{
            // Khi không nói, chiều cao là 10%
            height: !isActive ? "10%" : `${bar.baseHeight}%`,
            // Khi nói, kích hoạt animation
            animation: isActive
              ? `bar ${Math.random() * 0.5 + 0.5}s ease-in-out infinite alternate`
              : "none",
            animationDelay: bar.animationDelay,
          }}
        />
      ))}
    </div>
  );
};
