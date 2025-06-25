"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface SimilarityDebugPanelProps {
  similarity: any;
  userInput: string;
  expectedText: string;
}

export const SimilarityDebugPanel = ({
  similarity,
  userInput,
  expectedText,
}: SimilarityDebugPanelProps) => {
  if (!similarity) return null;

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return "text-green-600";
    if (score >= 0.6) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadge = (score: number) => {
    if (score >= 0.8) return "success";
    if (score >= 0.6) return "warning";
    return "destructive";
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-lg">Similarity Analysis</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Score */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Overall Score</span>
            <Badge variant={getScoreBadge(similarity.score)}>
              {Math.round(similarity.score * 100)}%
            </Badge>
          </div>
          <Progress value={similarity.score * 100} className="h-2" />
        </div>

        {/* Confidence */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Confidence</span>
            <span className="text-sm text-gray-600">
              {Math.round(similarity.confidence * 100)}%
            </span>
          </div>
          <Progress value={similarity.confidence * 100} className="h-1" />
        </div>

        {/* Matched Phrases */}
        {similarity.matchedPhrases.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-green-600 mb-2">
              ✅ Matched Phrases
            </h4>
            <div className="flex flex-wrap gap-1">
              {similarity.matchedPhrases.map(
                (phrase: string, index: number) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="text-xs bg-green-50"
                  >
                    {phrase}
                  </Badge>
                )
              )}
            </div>
          </div>
        )}

        {/* Missing Phrases */}
        {similarity.missingPhrases.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-red-600 mb-2">
              ❌ Missing Phrases
            </h4>
            <div className="flex flex-wrap gap-1">
              {similarity.missingPhrases.map(
                (phrase: string, index: number) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="text-xs bg-red-50"
                  >
                    {phrase}
                  </Badge>
                )
              )}
            </div>
          </div>
        )}

        {/* Partial Match Indicator */}
        {similarity.isPartialMatch && (
          <div className="p-2 bg-blue-50 border border-blue-200 rounded">
            <p className="text-sm text-blue-700">
              🎤 Partial input detected - waiting for more...
            </p>
          </div>
        )}

        {/* Input Comparison */}
        <div className="space-y-2">
          <div>
            <h4 className="text-sm font-medium mb-1">Your Input:</h4>
            <p className="text-sm bg-gray-50 p-2 rounded border">{userInput}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium mb-1">Expected:</h4>
            <p className="text-sm bg-blue-50 p-2 rounded border">
              {expectedText}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
