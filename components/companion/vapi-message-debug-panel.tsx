"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, MessageSquare, Bot, User, Settings } from "lucide-react";

interface VapiMessageDebugPanelProps {
  debugMessages: any[];
  callStatus: string;
  isWaitingForUser: boolean;
  currentSpeaker: string;
  currentStep: number;
  onClearMessages: () => void;
}

export function VapiMessageDebugPanel({
  debugMessages,
  callStatus,
  isWaitingForUser,
  currentSpeaker,
  currentStep,
  onClearMessages,
}: VapiMessageDebugPanelProps) {
  const unexpectedMessages = debugMessages.filter(
    (m) => !m.processed && m.type !== "speech-update"
  );

  const messageStats = debugMessages.reduce(
    (acc, msg) => {
      acc[msg.type] = (acc[msg.type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const getMessageIcon = (type: string, role?: string) => {
    if (type === "transcript") {
      return role === "user" ? (
        <User className="w-3 h-3" />
      ) : (
        <Bot className="w-3 h-3" />
      );
    }
    if (type === "function-call") return <Settings className="w-3 h-3" />;
    return <MessageSquare className="w-3 h-3" />;
  };

  const getMessageColor = (processed: boolean, type: string) => {
    if (!processed) return "bg-red-50 border-red-200";
    if (type === "transcript") return "bg-green-50 border-green-200";
    return "bg-blue-50 border-blue-200";
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageSquare className="w-5 h-5" />
            VAPI Messages Debug
          </CardTitle>
          <Button variant="outline" size="sm" onClick={onClearMessages}>
            Clear Messages
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="messages" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="stats">Statistics</TabsTrigger>
            <TabsTrigger value="unexpected">Issues</TabsTrigger>
          </TabsList>

          <TabsContent value="messages" className="space-y-4">
            {/* Current State */}
            <div className="p-3 border border-blue-200 rounded-lg bg-blue-50">
              <h4 className="mb-2 text-sm font-medium text-blue-800">
                Current State
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="font-medium">Call Status:</span>
                  <Badge variant="outline" className="ml-2">
                    {callStatus}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium">Step:</span> {currentStep}
                </div>
                <div>
                  <span className="font-medium">Waiting for User:</span>
                  <Badge
                    variant={isWaitingForUser ? "default" : "outline"}
                    className="ml-2"
                  >
                    {isWaitingForUser ? "YES" : "NO"}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium">Current Speaker:</span>{" "}
                  {currentSpeaker}
                </div>
              </div>
            </div>

            {/* Recent Messages */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Recent Messages</h4>
              <div className="space-y-1 overflow-y-auto max-h-60">
                {debugMessages.slice(0, 20).map((msg, index) => (
                  <div
                    key={index}
                    className={`p-2 rounded text-xs border ${getMessageColor(msg.processed, msg.type)}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        {getMessageIcon(msg.type, msg.role)}
                        <span className="font-medium">{msg.type}</span>
                        {msg.transcriptType && (
                          <Badge variant="outline" className="text-xs">
                            {msg.transcriptType}
                          </Badge>
                        )}
                        {msg.role && (
                          <Badge variant="outline" className="text-xs">
                            {msg.role}
                          </Badge>
                        )}
                        <Badge
                          variant={msg.processed ? "default" : "destructive"}
                          className="text-xs"
                        >
                          {msg.processed ? "PROCESSED" : "IGNORED"}
                        </Badge>
                      </div>
                      <span className="text-gray-500">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    {msg.content && (
                      <div className="mb-1 text-gray-700 truncate">
                        Content: "{msg.content.substring(0, 50)}..."
                      </div>
                    )}

                    <div className="text-gray-600">{msg.analysis.reason}</div>

                    <div className="mt-1 text-gray-500">
                      Call: {msg.analysis.callStatus} | Waiting:{" "}
                      {msg.analysis.isWaitingForUser ? "YES" : "NO"} | Speaker:{" "}
                      {msg.analysis.currentSpeaker}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {debugMessages.length === 0 && (
              <p className="py-4 text-sm text-center text-gray-500">
                No messages recorded yet. Start a conversation to see messages.
              </p>
            )}
          </TabsContent>

          <TabsContent value="stats" className="space-y-4">
            <div className="p-3 border border-gray-200 rounded-lg bg-gray-50">
              <h4 className="mb-3 text-sm font-medium">Message Statistics</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Total Messages:</span>
                  <span className="font-medium">{debugMessages.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Processed:</span>
                  <span className="font-medium text-green-600">
                    {debugMessages.filter((m) => m.processed).length}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Ignored:</span>
                  <span className="font-medium text-red-600">
                    {debugMessages.filter((m) => !m.processed).length}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-3 border border-gray-200 rounded-lg bg-gray-50">
              <h4 className="mb-3 text-sm font-medium">Message Types</h4>
              <div className="space-y-1">
                {Object.entries(messageStats).map(([type, count]) => (
                  <div key={type} className="flex justify-between text-sm">
                    <span>{type}:</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="unexpected" className="space-y-4">
            {unexpectedMessages.length > 0 ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-medium text-red-800">
                    Unexpected Messages ({unexpectedMessages.length})
                  </span>
                </div>

                <div className="space-y-1 overflow-y-auto max-h-40">
                  {unexpectedMessages.map((msg, index) => (
                    <div
                      key={index}
                      className="p-2 text-xs border border-red-200 rounded bg-red-50"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          {getMessageIcon(msg.type, msg.role)}
                          <span className="font-medium">{msg.type}</span>
                          {msg.role && (
                            <Badge variant="outline" className="text-xs">
                              {msg.role}
                            </Badge>
                          )}
                        </div>
                        <span className="text-gray-500">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="text-red-700">{msg.analysis.reason}</div>
                      {msg.content && (
                        <div className="mt-1 text-red-600 truncate">
                          "{msg.content.substring(0, 50)}..."
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-4 text-center text-green-600">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                  <span className="font-medium">All Good!</span>
                </div>
                <p className="text-sm">No unexpected messages detected.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
