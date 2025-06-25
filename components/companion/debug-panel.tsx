"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface DebugPanelProps {
  callState: any;
  conversationState: any;
  currentLine: any;
  onManualTrigger?: () => void;
  onSkipStep?: () => void;
}

export const DebugPanel = ({
  callState,
  conversationState,
  currentLine,
  onManualTrigger,
  onSkipStep,
}: DebugPanelProps) => {
  return (
    <Card className="border-orange-200">
      <CardHeader>
        <CardTitle className="text-lg text-orange-700">
          🐛 Debug Panel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Info */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Call Status:</span>
            <Badge variant="outline" className="ml-2">
              {callState.status}
            </Badge>
          </div>
          <div>
            <span className="font-medium">Current Step:</span>
            <Badge variant="outline" className="ml-2">
              {conversationState.currentStep}/{conversationState.totalSteps}
            </Badge>
          </div>
          <div>
            <span className="font-medium">Current Speaker:</span>
            <Badge variant="outline" className="ml-2">
              {currentLine?.speaker || "None"}
            </Badge>
          </div>
          <div>
            <span className="font-medium">Waiting for User:</span>
            <Badge variant="outline" className="ml-2">
              {conversationState.isWaitingForUser ? "Yes" : "No"}
            </Badge>
          </div>
        </div>

        {/* Current Line */}
        {currentLine && (
          <div className="p-3 bg-gray-50 rounded border">
            <p className="text-sm font-medium mb-1">Current Line:</p>
            <p className="text-sm">{currentLine.text}</p>
          </div>
        )}

        {/* Manual Controls */}
        <div className="flex space-x-2">
          {currentLine?.speaker === "Leo" && onManualTrigger && (
            <Button size="sm" onClick={onManualTrigger} variant="outline">
              🎤 Force Leo to Speak
            </Button>
          )}
          {onSkipStep && (
            <Button size="sm" onClick={onSkipStep} variant="outline">
              ⏭️ Skip Current Step
            </Button>
          )}
        </div>

        {/* Instructions */}
        <div className="text-xs text-gray-600 p-2 bg-blue-50 rounded">
          <p className="font-medium mb-1">Debug Instructions:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Check browser console for detailed logs</li>
            <li>Use "Force Leo to Speak" if AI doesn't speak</li>
            <li>Check VAPI connection status</li>
            <li>Verify environment variables are set</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
