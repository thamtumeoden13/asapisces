// components/companion/AudioVisualizer.tsx
import Lottie from "lottie-react";
import soundwaves from "@/constants/soundwaves.json";

export const AudioVisualizer = ({ isSpeaking }: { isSpeaking: boolean }) => (
  <div className="h-16 mt-4">
    {isSpeaking && (
      <Lottie
        animationData={soundwaves}
        loop={true}
        className="w-full h-full"
      />
    )}
  </div>
);