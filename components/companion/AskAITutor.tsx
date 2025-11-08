// File: components/companion/AskAITutor.tsx
"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Send, Edit, Lightbulb } from "lucide-react";
import ReactMarkdown from "react-markdown"; // Cài đặt: npm install react-markdown
import {
  askAboutConversationAction,
  AITutorResponse,
} from "@/lib/actions/general.action";

// Giả định các kiểu dữ liệu này được export từ đâu đó
type Message = { role: string; content: string };
type TranscriptLine = { speaker: string; text: string };

interface AskAITutorProps {
  userRole: "Leo" | "Gwen";
  fullTranscript: Message[];
  originalScript: TranscriptLine[];
}

export function AskAITutor({
  userRole,
  fullTranscript,
  originalScript,
}: AskAITutorProps) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<AITutorResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || isLoading) return;

    setIsLoading(true);
    setError("");
    setAnswer(null);

    const result = await askAboutConversationAction({
      question,
      userRole,
      fullTranscript,
      originalScript,
    });

    if (result.success && result.answer) {
      setAnswer(result.answer);
    } else {
      setError(result.error || "An unexpected error occurred.");
    }
    setIsLoading(false);
  };

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-500" />
          Ask Your AI Tutor
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex items-start gap-2">
          <Input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g., What does 'fall flat on your face' mean?"
            className="flex-grow"
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading || !question.trim()}>
            {isLoading ? "Thinking..." : <Send className="w-4 h-4" />}
          </Button>
        </form>

        {(isLoading || error || answer) && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border space-y-4">
            {isLoading && (
              <p className="text-gray-500 animate-pulse">
                Your tutor is typing...
              </p>
            )}
            {error && <p className="text-red-500">{error}</p>}

            {/* --- LOGIC HIỂN THỊ MỚI --- */}
            {answer && (
              <div className="space-y-4 text-sm">
                {/* 1. Câu trả lời trực tiếp */}
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown>{answer.directAnswer}</ReactMarkdown>
                </div>

                {/* 2. Hiển thị ví dụ nếu có */}
                {answer.examples && answer.examples.length > 0 && (
                  <div>
                    <h5 className="font-semibold mb-2 flex items-center gap-1.5">
                      <Edit className="w-4 h-4" /> Examples from your speech:
                    </h5>
                    <div className="space-y-3">
                      {answer.examples.map((ex, index) => (
                        <div
                          key={index}
                          className="p-3 bg-white border rounded-md"
                        >
                          <p className="text-gray-500">
                            You said:{" "}
                            <span className="font-mono text-red-600">
                              &quot;{ex.fromTranscript}&quot;
                            </span>
                          </p>
                          <p className="text-gray-700 mt-1">
                            Suggestion:{" "}
                            <span className="font-mono text-green-600">
                              &quot;{ex.suggestion}&quot;
                            </span>
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Hiển thị giải thích thêm nếu có */}
                {answer.furtherExplanation && (
                  <div>
                    <h5 className="font-semibold mb-2 flex items-center gap-1.5">
                      <Lightbulb className="w-4 h-4 text-yellow-500" /> Pro Tip:
                    </h5>
                    <div className="prose prose-sm max-w-none text-gray-600">
                      <ReactMarkdown>{answer.furtherExplanation}</ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
