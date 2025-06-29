export interface SessionData {
  sessionId: string;
  userId: string;
  companionId: string;
  topic: string;
  startTime: number;
  endTime?: number;
  totalSteps: number;
  completedSteps: number;
  averageAccuracy: number;
  averageResponseTime: number;
  improvements: string[];
}

export interface StepCompletion {
  stepNumber: number;
  expectedText: string;
  userText: string;
  responseTime: number;
  accuracyScore: number;
  pronunciationScore: number;
  fluencyScore: number;
}

export interface SessionInsights {
  overallScore: number;
  strengths: string[];
  areasForImprovement: string[];
  recommendations: string[];
  progressTrend: "improving" | "stable" | "declining";
}

export class ConversationAnalytics {
  private sessions: Map<string, SessionData> = new Map();
  private stepCompletions: Map<string, StepCompletion[]> = new Map();

  startSession(
    userId: string,
    companionId: string,
    topic: string,
    totalSteps: number
  ): string {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const sessionData: SessionData = {
      sessionId,
      userId,
      companionId,
      topic,
      startTime: Date.now(),
      totalSteps,
      completedSteps: 0,
      averageAccuracy: 0,
      averageResponseTime: 0,
      improvements: [],
    };

    this.sessions.set(sessionId, sessionData);
    this.stepCompletions.set(sessionId, []);

    console.log(`📊 Analytics session started: ${sessionId}`);
    return sessionId;
  }

  recordStepCompletion(sessionId: string, completion: StepCompletion) {
    const session = this.sessions.get(sessionId);
    const completions = this.stepCompletions.get(sessionId);

    if (!session || !completions) {
      console.error(`Session ${sessionId} not found`);
      return;
    }

    completions.push(completion);

    // Update session statistics
    session.completedSteps = completions.length;
    session.averageAccuracy =
      completions.reduce((sum, c) => sum + c.accuracyScore, 0) /
      completions.length;
    session.averageResponseTime =
      completions.reduce((sum, c) => sum + c.responseTime, 0) /
      completions.length;

    console.log(
      `📈 Step ${completion.stepNumber} completed with ${completion.accuracyScore}% accuracy`
    );
  }

  endSession(sessionId: string): SessionInsights {
    const session = this.sessions.get(sessionId);
    const completions = this.stepCompletions.get(sessionId);

    if (!session || !completions) {
      throw new Error(`Session ${sessionId} not found`);
    }

    session.endTime = Date.now();

    const insights = this.generateInsights(session, completions);
    console.log(`🎯 Session ${sessionId} completed:`, insights);

    return insights;
  }

  private generateInsights(
    session: SessionData,
    completions: StepCompletion[]
  ): SessionInsights {
    const overallScore = session.averageAccuracy;
    const strengths: string[] = [];
    const areasForImprovement: string[] = [];
    const recommendations: string[] = [];

    // Analyze strengths
    if (session.averageAccuracy > 80) {
      strengths.push("Excellent accuracy");
    }
    if (session.averageResponseTime < 3000) {
      strengths.push("Quick response time");
    }

    // Analyze areas for improvement
    if (session.averageAccuracy < 70) {
      areasForImprovement.push("Pronunciation accuracy");
      recommendations.push("Practice pronunciation of difficult words");
    }
    if (session.averageResponseTime > 5000) {
      areasForImprovement.push("Response speed");
      recommendations.push("Try to respond more quickly");
    }

    // Determine progress trend
    let progressTrend: "improving" | "stable" | "declining" = "stable";
    if (completions.length > 5) {
      const firstHalf = completions.slice(
        0,
        Math.floor(completions.length / 2)
      );
      const secondHalf = completions.slice(Math.floor(completions.length / 2));

      const firstHalfAvg =
        firstHalf.reduce((sum, c) => sum + c.accuracyScore, 0) /
        firstHalf.length;
      const secondHalfAvg =
        secondHalf.reduce((sum, c) => sum + c.accuracyScore, 0) /
        secondHalf.length;

      if (secondHalfAvg > firstHalfAvg + 5) {
        progressTrend = "improving";
      } else if (secondHalfAvg < firstHalfAvg - 5) {
        progressTrend = "declining";
      }
    }

    return {
      overallScore,
      strengths,
      areasForImprovement,
      recommendations,
      progressTrend,
    };
  }

  getSessionHistory(userId: string): SessionData[] {
    return Array.from(this.sessions.values()).filter(
      (session) => session.userId === userId
    );
  }

  getUserProgress(userId: string): any {
    const userSessions = this.getSessionHistory(userId);

    if (userSessions.length === 0) {
      return null;
    }

    const totalSessions = userSessions.length;
    const averageScore =
      userSessions.reduce((sum, s) => sum + s.averageAccuracy, 0) /
      totalSessions;
    const totalPracticeTime = userSessions.reduce((sum, s) => {
      return sum + ((s.endTime || Date.now()) - s.startTime);
    }, 0);

    return {
      totalSessions,
      averageScore,
      totalPracticeTime,
      lastSessionDate: Math.max(...userSessions.map((s) => s.startTime)),
      improvementRate: this.calculateImprovementRate(userSessions),
    };
  }

  private calculateImprovementRate(sessions: SessionData[]): number {
    if (sessions.length < 2) return 0;

    const sortedSessions = sessions.sort((a, b) => a.startTime - b.startTime);
    const firstSession = sortedSessions[0];
    const lastSession = sortedSessions[sortedSessions.length - 1];

    return lastSession.averageAccuracy - firstSession.averageAccuracy;
  }
}

export type ConversationInsights = {
  sessionSummary: string;
  keyAchievements?: string[];
  personalizedFeedback: string;
  nextSessionRecommendations?: string[];
};
