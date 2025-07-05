"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertCircle, Activity, Mic, MicOff } from "lucide-react"

interface VapiDebugPanelProps {
  debugEvents: any[]
  callStatus: string
  isWaitingForUser: boolean
  currentSpeaker: string
  currentStep: number
  onClearEvents: () => void
}

export function VapiDebugPanel({
  debugEvents,
  callStatus,
  isWaitingForUser,
  currentSpeaker,
  currentStep,
  onClearEvents,
}: VapiDebugPanelProps) {
  const unexpectedEvents = debugEvents.filter((e) => !e.processed && e.type.includes("speech"))

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="w-5 h-5" />
            VAPI Speech Events Debug
          </CardTitle>
          <Button variant="outline" size="sm" onClick={onClearEvents}>
            Clear Events
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Current State */}
          <div className="p-3 border border-blue-200 rounded-lg bg-blue-50">
            <h4 className="mb-2 text-sm font-medium text-blue-800">Current State</h4>
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
                <Badge variant={isWaitingForUser ? "default" : "outline"} className="ml-2">
                  {isWaitingForUser ? "YES" : "NO"}
                </Badge>
              </div>
              <div>
                <span className="font-medium">Current Speaker:</span> {currentSpeaker}
              </div>
            </div>
          </div>

          {/* Unexpected Events Alert */}
          {unexpectedEvents.length > 0 && (
            <div className="p-3 border border-red-200 rounded-lg bg-red-50">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span className="text-sm font-medium text-red-800">Unexpected Events ({unexpectedEvents.length})</span>
              </div>
              <div className="space-y-1">
                {unexpectedEvents.slice(0, 3).map((event, index) => (
                  <div key={index} className="text-xs text-red-700">
                    {event.type}: {event.analysis.reason}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Events */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Recent Speech Events</h4>
            <div className="space-y-1 overflow-y-auto max-h-40">
              {debugEvents.slice(0, 10).map((event, index) => (
                <div
                  key={index}
                  className={`p-2 rounded text-xs border ${
                    event.processed ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      {event.type.includes("speech-start") ? (
                        <Mic className="w-3 h-3" />
                      ) : (
                        <MicOff className="w-3 h-3" />
                      )}
                      <span className="font-medium">{event.type}</span>
                      <Badge variant={event.processed ? "default" : "destructive"} className="text-xs">
                        {event.processed ? "PROCESSED" : "IGNORED"}
                      </Badge>
                    </div>
                    <span className="text-gray-500">{new Date(event.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div className="text-gray-600">{event.analysis.reason}</div>
                  <div className="mt-1 text-gray-500">
                    Call: {event.analysis.callStatus} | Waiting: {event.analysis.isWaitingForUser ? "YES" : "NO"} |
                    Speaker: {event.analysis.currentSpeaker}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {debugEvents.length === 0 && (
            <p className="py-4 text-sm text-center text-gray-500">
              No speech events recorded yet. Start a conversation to see events.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
