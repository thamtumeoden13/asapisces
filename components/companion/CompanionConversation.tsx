"use client";

import React, { useEffect, useRef, useState } from "react";
import { cn, configureAssistant, getSubjectColor } from "@/lib/utils";
import { vapi } from "@/lib/vapi.sdk";
import Image from "next/image";
import Lottie, { LottieRefCurrentProps } from "lottie-react";
import soundwaves from "@/constants/soundwaves.json";
import topicMap from "@/constants/transcriptTopics.json";
import { AssistantOverrides } from "@vapi-ai/web/dist/api";
import { CompanionComponentProps, SavedMessage } from "@/types";
import { addToSessionHistory } from "@/lib/actions/session.action";
import { Message } from "@/types/podcast";

enum CallStatus {
  INACTIVE = "INACTIVE",
  CONNECTING = "CONNECTING",
  ACTIVE = "ACTIVE",
  FINISHED = "FINISHED",
}
const CompanionConversation = ({
  companionId,
  subject,
  topic,
  name,
  userName,
  userImage,
  style,
  voice,
}: CompanionComponentProps) => {
  const lottieRef = useRef<LottieRefCurrentProps>(null);

  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [messages, setMessages] = useState<SavedMessage[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);

  type TopicKey = keyof typeof topicMap;
  // Define the expected shape of a step
  type Step = { speaker: string; text: string };

  const steps: Step[] = React.useMemo(() => {
    // Ensure the result is always an array of objects with speaker/text
    const raw = topicMap[topic as TopicKey] || [];
    // If the array is of strings, map to objects; otherwise, assume correct shape
    if (raw.length > 0 && typeof raw[0] === "string") {
      // fallback: treat string as text, unknown speaker
      return (raw as string[]).map((text) => ({ speaker: "Unknown", text }));
    }
    return raw as Step[];
  }, [topic]);

  const toggleMicroPhone = () => {
    const isMuted = vapi.isMuted();
    vapi.setMuted(!isMuted);

    setIsMuted(!isMuted);
  };

  const handleDisconnect = () => {
    setCallStatus(CallStatus.FINISHED);
    vapi.stop();
  };

  const handleConnect = () => {
    setCallStatus(CallStatus.CONNECTING);

    const assistantOverride: AssistantOverrides = {
      variableValues: {
        subject,
        topic,
        style,
      },
      clientMessages: "transcript" as const,
    };

    vapi.start(configureAssistant(voice, style), assistantOverride);
  };

  const checkUserResponse = (
    input: string,
    expected: string
  ): "correct" | "almost" | "wrong" => {
    const normalize = (str: string) =>
      str
        .toLowerCase()
        .replace(/[^\w\s]/g, "")
        .trim();
    const user = normalize(input);
    const ref = normalize(expected);
    if (user === ref) return "correct";
    if (user.includes(ref) || ref.includes(user)) return "almost";
    return "wrong";
  };

  useEffect(() => {
    const onCallStart = () => setCallStatus(CallStatus.ACTIVE);

    const onCallEnd = () => {
      setCallStatus(CallStatus.FINISHED);
      addToSessionHistory(companionId);
    };

    const onMessage = (message: Message) => {
      if (message.type === "transcript" && message.transcriptType === "final") {
        const newMessage = { role: message.role, content: message.transcript };
        setMessages((prevMessages) => [newMessage, ...prevMessages]);

        const current = steps[currentStep];

        if (current?.speaker === "Gwen" && message.role === "user") {
          const result = checkUserResponse(message.transcript, current.text);
          if (result === "correct") {
            setFeedback("✅ Correct!");
            setCurrentStep((prev) => prev + 1);
          } else if (result === "almost") {
            setFeedback("🟡 Almost! Try saying: " + current.text);
          } else {
            setFeedback("❌ Not quite. Try again: " + current.text);
          }
        }
      }
    };

    const onSpeechStart = () => setIsSpeaking(true);
    const onSpeechEnd = () => setIsSpeaking(false);
    const onError = (error: Error) => console.error("Call error:", error);

    vapi.on("call-start", onCallStart);
    vapi.on("call-end", onCallEnd);
    vapi.on("message", onMessage);
    vapi.on("error", onError);
    vapi.on("speech-start", onSpeechStart);
    vapi.on("speech-end", onSpeechEnd);

    return () => {
      vapi.off("call-start", onCallStart);
      vapi.off("call-end", onCallEnd);
      vapi.off("message", onMessage);
      vapi.off("error", onError);
      vapi.off("speech-start", onSpeechStart);
      vapi.off("speech-end", onSpeechEnd);
    };
  }, [steps, currentStep, companionId]);

  useEffect(() => {
    const current = steps[currentStep];
    if (current?.speaker === "Leo") {
      vapi.send(current.text);
      setMessages((prev) => [
        { role: "assistant", content: current.text },
        ...prev,
      ]);
      setCurrentStep((prev) => prev + 1);
    }
  }, [currentStep, steps]);

  useEffect(() => {
    if (lottieRef) {
      if (isSpeaking) lottieRef.current?.play();
      else lottieRef.current?.stop();
    }
  }, [isSpeaking]);

  return (
    <section className="flex flex-col h-[70vh]">
      <section className="flex gap-8 max-sm:flex-col">
        <div className="companion-section">
          <div
            className="companion-avatar"
            style={{ backgroundColor: getSubjectColor(subject) }}
          >
            <div
              className={cn(
                "absolute transition-opacity duration-1000",
                callStatus === CallStatus.FINISHED ||
                  callStatus === CallStatus.INACTIVE
                  ? "opacity-100"
                  : "opacity-0",
                callStatus === CallStatus.CONNECTING &&
                  "opacity-100 animate-pulse"
              )}
            >
              <Image
                src={`/icons/${subject}.svg`}
                alt={subject}
                width={150}
                height={150}
                className="max-sm:w-fit"
              />
            </div>
            <div
              className={cn(
                "absolute transition-opacity duration-100",
                callStatus === CallStatus.ACTIVE ? "opacity-100" : "opacity-0"
              )}
            >
              <Lottie
                lottieRef={lottieRef}
                animationData={soundwaves}
                autoplay={false}
                className="companion-lottie"
              />
            </div>
          </div>
          <p className="font-bold text-black-300 text-2xl">{name}</p>
        </div>

        <div className="user-section">
          <div className="user-avatar">
            <Image
              src={userImage}
              alt={userName}
              width={130}
              height={130}
              className="rounded-lg"
            />
            <p className="font-bold text-2xl text-black-300">{userName}</p>
          </div>
          <button
            className="btn-mic"
            onClick={toggleMicroPhone}
            disabled={callStatus !== CallStatus.INACTIVE}
          >
            <Image
              src={isMuted ? "/icons/mic-off.svg" : "/icons/mic-on.svg"}
              alt="mic"
              width={36}
              height={36}
            />
            <p className="max-sm:hidden text-black-100">
              {isMuted ? "Turn on microphone" : "Turn off microphone"}
            </p>
          </button>
          <button
            className={cn(
              "roudned-lg py-2 cursor-pointer transition-colors w-full text-white",
              callStatus === CallStatus.ACTIVE ? "bg-red-700" : "bg-primary",
              callStatus === CallStatus.CONNECTING && "animate-pulse"
            )}
            onClick={
              callStatus === CallStatus.ACTIVE
                ? handleDisconnect
                : handleConnect
            }
          >
            {callStatus === CallStatus.ACTIVE
              ? "End Session"
              : callStatus === CallStatus.CONNECTING
                ? "Connecting..."
                : "Start Session"}
          </button>
        </div>
      </section>

      {feedback && (
        <p className="text-center mt-4 text-lg font-medium text-black-500">
          {feedback}
        </p>
      )}

      <section className="transcript">
        <div className="transcript-message no-scrollbar">
          {messages.map((message, index) => (
            <p
              key={message.content + index}
              className={cn(
                message.role === "assistant"
                  ? "max-sm:text-sm text-black-200"
                  : "text-primary text-black-200 max-sm:text-sm"
              )}
            >
              {message.role === "assistant" ? name.split(" ")[0] : userName}:{" "}
              {message.content}
            </p>
          ))}
        </div>
        <div className="transcript-fade" />
      </section>
    </section>
  );
};

export default CompanionConversation;
