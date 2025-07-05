"use client";

// VAPI Speech Event Analysis và Debugging

export interface VapiSpeechEventContext {
  callStatus: string;
  isWaitingForUser: boolean;
  currentSpeaker: string;
  currentStep: number;
  timestamp: number;
  shouldProcess: boolean;
  reason: string;
}

export class VapiEventAnalyzer {
  private eventHistory: Array<{
    event: string;
    context: VapiSpeechEventContext;
    processed: boolean;
  }> = [];

  analyzeEvent(
    eventType: string,
    callStatus: string,
    isWaitingForUser: boolean,
    currentSpeaker: string,
    currentStep: number
  ): VapiSpeechEventContext {
    const context: VapiSpeechEventContext = {
      callStatus,
      isWaitingForUser,
      currentSpeaker,
      currentStep,
      timestamp: Date.now(),
      shouldProcess: false,
      reason: "",
    };

    // Analyze when speech-start should be processed
    if (eventType === "speech-start") {
      if (callStatus !== "ACTIVE") {
        context.reason = "❌ Call not active";
      } else if (!isWaitingForUser) {
        context.reason = "❌ Not waiting for user input";
      } else if (currentSpeaker !== "Gwen") {
        context.reason = "❌ Current step is not Gwen's turn";
      } else {
        context.shouldProcess = true;
        context.reason = "✅ Valid user speech start";
      }
    }

    // Analyze when speech-end should be processed
    if (eventType === "speech-end") {
      if (callStatus !== "ACTIVE") {
        context.reason = "❌ Call not active";
      } else if (!isWaitingForUser) {
        context.reason = "❌ Not waiting for user input";
      } else if (currentSpeaker !== "Gwen") {
        context.reason = "❌ Current step is not Gwen's turn";
      } else {
        context.shouldProcess = true;
        context.reason = "✅ Valid user speech end";
      }
    }

    // Store in history
    this.eventHistory.push({
      event: eventType,
      context,
      processed: context.shouldProcess,
    });

    // Keep only last 50 events
    if (this.eventHistory.length > 50) {
      this.eventHistory = this.eventHistory.slice(-50);
    }

    return context;
  }

  getEventHistory() {
    return this.eventHistory;
  }

  getUnexpectedEvents() {
    return this.eventHistory.filter(
      (e) => !e.processed && e.event.includes("speech")
    );
  }

  clearHistory() {
    this.eventHistory = [];
  }
}
