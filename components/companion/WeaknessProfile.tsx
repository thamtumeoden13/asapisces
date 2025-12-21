"use client";

import { useEffect, useState } from "react";
import {
  getTopPronunciationErrorsAction,
  type PronunciationError,
} from "@/lib/actions/analytics.action";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, Volume2, Loader2 } from "lucide-react";
import { Button } from "../ui/button";

export const WeaknessProfile = ({
  companionId,
  topicId,
}: {
  companionId: string;
  topicId: string;
}) => {
  const [errors, setErrors] = useState<PronunciationError[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    getTopPronunciationErrorsAction({
      limit: 5,
      companionId,
      topicId,
    })
      .then((data) => {
        setErrors(data);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [companionId, topicId]);

  // Hàm để phát âm mẫu một từ
  const speakWord = (word: string) => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = "en-US";
      utterance.rate = 0.8; // Nói chậm hơn một chút để nghe rõ
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Target className="w-5 h-5 text-red-500" />
          <span>Your Words to Practice</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        )}

        {!isLoading && errors.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-4">
            Great job! We haven&apos;t detected any recurring pronunciation
            errors yet. Keep practicing!
          </p>
        )}

        {!isLoading && errors.length > 0 && (
          <ul className="space-y-3">
            {errors.map(({ word, error_count }) => (
              <li
                key={word}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex flex-col">
                  <span className="font-semibold text-base capitalize">
                    {word}
                  </span>
                  <span className="text-xs text-gray-500">
                    {error_count} mistakes
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => speakWord(word)}
                  aria-label={`Listen to ${word}`}
                >
                  <Volume2 className="w-5 h-5 text-blue-500" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};
