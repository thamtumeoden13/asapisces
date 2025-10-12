"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, Mic, Square } from "lucide-react"; // Thêm Square cho nút Stop
import { TranscriptLine, CallStatus, ConversationState } from "@/types/podcast"; // Import các kiểu dữ liệu

// --- PROPS MỚI CHO COMPONENT ---
interface PodcastPlayerProps {
  // Dữ liệu từ hook useConversation
  callState: { status: string; error?: string };
  conversationState: ConversationState & {
    similarity?: unknown;
    retryCounter?: number;
  };
  currentLine: TranscriptLine | null;
  isSpeaking: boolean; // AI đang nói
  partialTranscript: string; // Lời nói của người dùng

  // Các hàm điều khiển từ hook
  startCall: () => void;
  endCall: () => void;
}

export function PodcastPlayer({
  callState,
  conversationState,
  currentLine,
  isSpeaking,
  partialTranscript,
  startCall,
  endCall,
}: PodcastPlayerProps) {
  // State isPlaying giờ được suy ra từ callState
  const isPlaying =
    callState.status === CallStatus.ACTIVE ||
    callState.status === CallStatus.CONNECTING;

  // Waveform visualization (giữ nguyên)
  const [waveformBars] = useState(() =>
    Array.from({ length: 60 }, () => Math.random() * 80 + 20)
  );

  const formatTime = (
    percentage: number,
    totalDurationSeconds: number = 180
  ) => {
    const currentSeconds = Math.floor(
      (percentage / 100) * totalDurationSeconds
    );
    const mins = Math.floor(currentSeconds / 60);
    const secs = currentSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getButtonIcon = () => {
    if (callState.status === CallStatus.CONNECTING) {
      return (
        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
      );
    }
    if (isPlaying) {
      return <Square className="w-6 h-6" />; // Nút Stop
    }
    return <Play className="w-6 h-6 ml-1" />;
  };

  const handlePlayButtonClick = () => {
    if (isPlaying) {
      endCall();
    } else {
      startCall();
    }
  };

  const getTopicProgress = () => {
    return (conversationState.currentStep / conversationState.totalSteps) * 100;
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/assets/AI-Generate-Image.png')",
        }}
      >
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* Content Overlay */}
      <div className="relative z-10 flex flex-col justify-between min-h-screen p-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="bg-white/90 backdrop-blur-sm rounded-full p-3">
              <Mic className="w-8 h-8 text-red-500" />
            </div>
          </div>

          <div className="bg-black/80 backdrop-blur-sm rounded-2xl px-4 py-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <Mic className="w-4 h-4 text-black" />
              </div>
              <div className="text-white font-bold text-sm">
                PODCAST
                <br />
                AND CHILL
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col justify-center items-center text-center space-y-8">
          {/* Waveform Visualization - Kích hoạt bằng isSpeaking */}
          <div className="flex items-end justify-center gap-1 h-20 w-full max-w-2xl">
            {waveformBars.map((height, index) => (
              <div
                key={index}
                className={`bg-white/80 rounded-full transition-all duration-300 ${isSpeaking ? "animate-pulse" : ""}`}
                style={{
                  height: `${height * (isSpeaking ? Math.random() * 0.5 + 0.5 : 0.2)}%`,
                  width: "4px",
                  animationDelay: `${index * 50}ms`,
                }}
              />
            ))}
          </div>

          {/* --- KHU VỰC HIỂN THỊ ĐỘNG --- */}
          {currentLine && isPlaying && (
            <Card className="bg-white/95 backdrop-blur-sm p-8 max-w-2xl mx-auto w-full">
              <div className="space-y-4">
                <div
                  className={`
                  px-4 py-2 rounded-full inline-block font-bold
                  ${currentLine.speaker === "Gwen" ? "bg-pink-500 text-white" : "bg-black text-white"}
                `}
                >
                  {currentLine.speaker}
                  {conversationState.isWaitingForUser && (
                    <span className="ml-2 animate-pulse">Your turn!</span>
                  )}
                </div>
                <blockquote className="text-xl md:text-2xl font-medium text-gray-800 leading-relaxed min-h-[100px]">
                  {currentLine.text}
                </blockquote>
              </div>
            </Card>
          )}

          {/* --- HIỂN THỊ LỜI NÓI CỦA NGƯỜI DÙNG --- */}
          {partialTranscript && conversationState.isWaitingForUser && (
            <Card className="bg-blue-50/90 backdrop-blur-sm p-6 max-w-2xl mx-auto w-full animate-pulse">
              <div className="text-sm font-medium text-blue-800 mb-2">
                You're speaking...
              </div>
              <p className="text-lg text-blue-700">"{partialTranscript}..."</p>
            </Card>
          )}
        </div>

        {/* Player Controls */}
        <Card className="bg-white/95 backdrop-blur-sm p-6 space-y-4">
          {/* Progress Bar - Điều khiển bằng conversationState.progress */}
          <div className="space-y-2">
            <Slider value={[getTopicProgress()]} className="w-full" />
            <div className="flex justify-between text-sm text-gray-600">
              <span>
                {conversationState.currentStep}/{conversationState.totalSteps}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={handlePlayButtonClick}
                disabled={callState.status === CallStatus.CONNECTING}
                size="lg"
                className="rounded-full w-14 h-14 bg-red-500 hover:bg-red-600"
              >
                {getButtonIcon()}
              </Button>
              <div className="text-sm font-medium text-gray-700">
                {isPlaying
                  ? callState.status === CallStatus.CONNECTING
                    ? "Connecting..."
                    : "Session in Progress"
                  : "Start Your Session"}
              </div>
            </div>
            {/* Volume Control (tạm thời bỏ qua, vì Web Speech API khó chỉnh volume) */}
          </div>
        </Card>
      </div>
    </div>
  );
}
