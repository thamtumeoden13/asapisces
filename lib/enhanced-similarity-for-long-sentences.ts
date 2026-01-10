interface WordResult {
  word: string;
  match: boolean;
}
interface SimilarityResult {
  score: number;
  confidence: number;
  matchedPhrases: string[];
  missingPhrases: string[];
  feedback: string;
  isPartialMatch: boolean;
  completenessRatio: number;
  shouldWaitForMore: boolean;
  words: WordResult[];
}

interface ConversationContext {
  accumulatedInput: string[];
  expectedText: string;
  startTime: number;
  lastInputTime: number;
  partialMatches: string[];
  keyPhrasesFound: Set<string>;
  totalExpectedWords: number;
}

class EnhancedSimilarityCalculator {
  private contexts: Map<string, ConversationContext> = new Map();
  private readonly CHUNK_TIMEOUT = 4000; // Increased to 4 seconds
  private readonly LONG_SENTENCE_THRESHOLD = 15; // Words count for long sentences
  private readonly MIN_COMPLETENESS_FOR_LONG = 0.7; // 70% completeness for long sentences
  private readonly MIN_PHRASE_LENGTH = 3;

  /**
   * Enhanced partial input detection for long sentences
   */
  private isLikelyPartialInput(
    input: string,
    expected: string,
    isLongSentence: boolean,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    context: ConversationContext
  ): boolean {
    const inputWords = this.normalizeText(input).split(/\s+/);
    const expectedWords = this.normalizeText(expected).split(/\s+/);

    // For long sentences, be more conservative
    if (isLongSentence) {
      // Check if we have less than 60% of expected content
      if (inputWords.length < expectedWords.length * 0.6) return true;

      // Check if input doesn't end with proper punctuation
      if (
        !input.match(/[.!?]$/) &&
        inputWords.length < expectedWords.length * 0.8
      )
        return true;

      // Check if we're missing key phrases
      const keyPhrases = this.extractKeyPhrases(expected);
      const foundPhrases = keyPhrases.filter((phrase) =>
        input.toLowerCase().includes(phrase.toLowerCase())
      );
      if (foundPhrases.length < keyPhrases.length * 0.5) return true;
    }

    // Standard partial detection for shorter sentences
    if (inputWords.length < expectedWords.length * 0.4) return true;
    if (
      !input.match(/[.!?]$/) &&
      inputWords.length < expectedWords.length * 0.7
    )
      return true;

    return false;
  }

  /**
   * Determine if we should wait for more input
   */
  private shouldWaitForMoreInput(
    input: string,
    expected: string,
    isLongSentence: boolean,
    context: ConversationContext
  ): boolean {
    const timeSinceLastInput = Date.now() - context.lastInputTime;

    // Don't wait too long
    if (timeSinceLastInput > this.CHUNK_TIMEOUT) return false;

    // For long sentences, wait if we don't have enough content
    if (isLongSentence) {
      const completeness = this.calculateCompleteness(input, expected);
      if (completeness < this.MIN_COMPLETENESS_FOR_LONG) return true;

      // Wait if we're missing critical phrases
      const keyPhrases = this.extractKeyPhrases(expected);
      const foundPhrases = keyPhrases.filter((phrase) =>
        input.toLowerCase().includes(phrase.toLowerCase())
      );
      if (foundPhrases.length < keyPhrases.length * 0.6) return true;
    }

    return false;
  }

  /**
   * Adjust score specifically for long sentences
   */
  private adjustScoreForLongSentence(
    baseScore: number,
    completenessRatio: number,
    input: string,
    expected: string
  ): number {
    // Boost score if we have good key phrase coverage
    const keyPhrases = this.extractKeyPhrases(expected);
    const foundPhrases = keyPhrases.filter((phrase) =>
      input.toLowerCase().includes(phrase.toLowerCase())
    );
    const keyPhraseRatio = foundPhrases.length / keyPhrases.length;

    // Combine base score with key phrase coverage
    let adjustedScore = baseScore * 0.7 + keyPhraseRatio * 0.3;

    // Boost for good completeness
    if (completenessRatio > 0.7) {
      adjustedScore *= 1.1;
    }

    // Penalty for very incomplete responses
    if (completenessRatio < 0.3) {
      adjustedScore *= 0.6;
    }

    return Math.min(adjustedScore, 1.0);
  }

  /**
   * Check if input contains key phrases from expected text
   */
  private hasKeyPhrases(input: string, expected: string): boolean {
    const keyPhrases = this.extractKeyPhrases(expected);
    const foundPhrases = keyPhrases.filter((phrase) =>
      input.toLowerCase().includes(phrase.toLowerCase())
    );
    return foundPhrases.length >= keyPhrases.length * 0.4; // At least 40% of key phrases
  }

  /**
   * Enhanced feedback generation for long sentences
   */
  private generateEnhancedFeedback(
    input: string,
    expected: string,
    score: number,
    isPartial: boolean,
    shouldWait: boolean,
    completeness: number,
    isLongSentence: boolean
  ): string {
    if (shouldWait) {
      return "🎤 Keep going... I'm listening for the complete sentence.";
    }

    if (isPartial && isLongSentence) {
      return "🎤 Continue speaking... I need to hear more of this sentence.";
    }

    if (isPartial) {
      return "🎤 Keep going... I'm listening for more.";
    }

    if (score >= 0.9) {
      return "✅ Perfect! That was exactly right.";
    }

    if (score >= 0.7) {
      return "🟢 Great job! Very close to the original.";
    }

    if (score >= 0.5) {
      if (isLongSentence && completeness < 0.6) {
        return "🟡 Good start! Try to include more of the complete sentence.";
      }
      return "🟡 Good effort! Try to include more of the key phrases.";
    }

    if (score >= 0.3) {
      return `🟠 You're on the right track. The full sentence is: "${expected}"`;
    }

    return `❌ Let's try again. Please say: "${expected}"`;
  }

  /**
   * Enhanced key phrase extraction for long sentences
   */
  private extractKeyPhrases(text: string): string[] {
    // Split by punctuation and conjunctions, but keep important phrases together
    const phrases = text
      .split(
        /[.!?;]|(?:\s+(?:and|but|or|while|because|since|although|however)\s+)/i
      )
      .map((phrase) => phrase.trim())
      .filter((phrase) => phrase.length >= this.MIN_PHRASE_LENGTH);

    // Also extract noun phrases and important concepts
    const importantPhrases: string[] = [];

    // Look for patterns like "According to X", "Research shows", etc.
    const patterns = [
      /according to [^,.]*/gi,
      /research (?:shows|supports|indicates)[^,.]*/gi,
      /studies (?:show|indicate|suggest)[^,.]*/gi,
      /[A-Z][a-z]+ (?:Clinic|University|Institute|Association)[^,.]*/gi,
    ];

    patterns.forEach((pattern) => {
      const matches = text.match(pattern);
      if (matches) {
        importantPhrases.push(...matches.map((m) => m.trim()));
      }
    });

    return [...phrases, ...importantPhrases].filter(
      (phrase) => phrase.length > 0
    );
  }

  /**
   * Calculate completeness with better handling for long sentences
   */
  private calculateCompleteness(input: string, expected: string): number {
    const inputWords = this.normalizeText(input)
      .split(/\s+/)
      .filter((w) => w.length > 0);
    const expectedWords = this.normalizeText(expected)
      .split(/\s+/)
      .filter((w) => w.length > 0);

    if (expectedWords.length === 0) return 1;

    // For very long sentences, use a more sophisticated approach
    if (expectedWords.length > this.LONG_SENTENCE_THRESHOLD) {
      // Count unique words that appear in both
      const inputWordSet = new Set(inputWords);
      const expectedWordSet = new Set(expectedWords);
      const commonWords = [...inputWordSet].filter((word) =>
        expectedWordSet.has(word)
      );

      // Combine word count ratio with unique word coverage
      const wordCountRatio = Math.min(
        inputWords.length / expectedWords.length,
        1
      );
      const uniqueWordCoverage = commonWords.length / expectedWords.length;

      return wordCountRatio * 0.6 + uniqueWordCoverage * 0.4;
    }

    // Standard completeness for shorter sentences
    return Math.min(inputWords.length / expectedWords.length, 1);
  }

  /**
   * Enhanced confidence calculation
   */
  private calculateConfidence(
    input: string,
    expected: string,
    score: number,
    isLongSentence: boolean
  ): number {
    let confidence = score;

    // For long sentences, be more conservative with confidence
    if (isLongSentence) {
      const completeness = this.calculateCompleteness(input, expected);
      confidence *= completeness * 0.8 + 0.2; // Ensure minimum confidence
    }

    // Boost confidence for exact matches
    if (score > 0.9) confidence = Math.min(confidence * 1.1, 1);

    return confidence;
  }

  // ... (keep all other existing methods unchanged)
  private calculateExactSimilarity(input: string, expected: string): number {
    const expectedWords = this.normalizeText(expected)
      .split(/\s+/)
      .filter(Boolean);
    if (expectedWords.length === 0) return 1.0;

    const analysis = this.analyzeWords(input, expected);
    const matchedWordCount = analysis.filter((w) => w.match).length;

    // Tỷ lệ khớp dựa trên CÂU MỤC TIÊU, không phải câu người dùng nói
    return matchedWordCount / expectedWords.length;
  }

  private calculateSemanticSimilarity(input: string, expected: string): number {
    const inputPhrases = this.extractKeyPhrases(input);
    const expectedPhrases = this.extractKeyPhrases(expected);

    if (expectedPhrases.length === 0) return 0;

    let matchScore = 0;
    for (const expectedPhrase of expectedPhrases) {
      const bestMatch = Math.max(
        ...inputPhrases.map((inputPhrase) =>
          this.calculatePhraseMatch(inputPhrase, expectedPhrase)
        ),
        0
      );
      matchScore += bestMatch;
    }

    return matchScore / expectedPhrases.length;
  }

  private calculatePhraseSimilarity(input: string, expected: string): number {
    const inputPhrases = this.splitIntoPhrases(input);
    const expectedPhrases = this.splitIntoPhrases(expected);

    if (expectedPhrases.length === 0) return 0;

    let totalScore = 0;
    for (const expectedPhrase of expectedPhrases) {
      const bestMatch = Math.max(
        ...inputPhrases.map((inputPhrase) =>
          this.calculateExactSimilarity(inputPhrase, expectedPhrase)
        ),
        0
      );
      totalScore += bestMatch;
    }

    return totalScore / expectedPhrases.length;
  }

  private calculateStructuralSimilarity(
    input: string,
    expected: string
  ): number {
    const inputSentences = input
      .split(/[.!?]+/)
      .filter((s) => s.trim().length > 0);
    const expectedSentences = expected
      .split(/[.!?]+/)
      .filter((s) => s.trim().length > 0);

    const lengthRatio =
      Math.min(input.length, expected.length) /
      Math.max(input.length, expected.length);
    const sentenceRatio =
      Math.min(inputSentences.length, expectedSentences.length) /
      Math.max(inputSentences.length, expectedSentences.length);

    return (lengthRatio + sentenceRatio) / 2;
  }

  private splitIntoPhrases(text: string): string[] {
    return text
      .split(/[.!?;]/)
      .map((phrase) => phrase.trim())
      .filter((phrase) => phrase.length > 0);
  }

  private calculatePhraseMatch(phrase1: string, phrase2: string): number {
    const words1 = this.normalizeText(phrase1).split(/\s+/);
    const words2 = this.normalizeText(phrase2).split(/\s+/);

    if (words1.length === 0 || words2.length === 0) return 0;

    const commonWords = words1.filter((word) =>
      words2.some((w2) => this.wordsMatch(word, w2))
    );

    return commonWords.length / Math.max(words1.length, words2.length);
  }

  private wordsMatch(word1: string, word2: string): boolean {
    if (word1 === word2) return true;

    const variations: Record<string, string[]> = {
      thinking: ["thinking", "thinkin"],
      looking: ["looking", "lookin"],
      everything: ["everything", "everythin", "every thing"],
      about: ["about", "bout", "abt"],
      perfect: ["perfect", "perfekt"],
      problems: ["problems", "problem", "probs"],
      solutions: ["solutions", "solution", "solve"],
      according: ["according", "accordin"],
      research: ["research", "researches"],
      clinic: ["clinic", "clinics"],
      positive: ["positive", "positiv"],
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (const [key, variants] of Object.entries(variations)) {
      if (variants.includes(word1) && variants.includes(word2)) {
        return true;
      }
    }

    return (
      this.levenshteinDistance(word1, word2) <=
      Math.max(1, Math.min(word1.length, word2.length) * 0.2)
    );
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1)
      .fill(null)
      .map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  private analyzePhrases(
    input: string,
    expected: string
  ): {
    matchedPhrases: string[];
    missingPhrases: string[];
  } {
    const inputPhrases = this.extractKeyPhrases(input);
    const expectedPhrases = this.extractKeyPhrases(expected);

    const matchedPhrases: string[] = [];
    const missingPhrases: string[] = [];

    for (const expectedPhrase of expectedPhrases) {
      const isMatched = inputPhrases.some(
        (inputPhrase) =>
          this.calculatePhraseMatch(inputPhrase, expectedPhrase) > 0.6
      );

      if (isMatched) {
        matchedPhrases.push(expectedPhrase);
      } else {
        missingPhrases.push(expectedPhrase);
      }
    }

    return { matchedPhrases, missingPhrases };
  }

  private cleanupOldContexts(): void {
    const now = Date.now();
    for (const [contextId, context] of this.contexts.entries()) {
      if (now - context.lastInputTime > this.CHUNK_TIMEOUT * 2) {
        this.contexts.delete(contextId);
      }
    }
  }

  private analyzeWords(userInput: string, expectedText: string): WordResult[] {
    const inputWords = this.normalizeText(userInput)
      .split(/\s+/)
      .filter(Boolean);
    const expectedWords = this.normalizeText(expectedText)
      .split(/\s+/)
      .filter(Boolean);

    if (inputWords.length === 0) return [];

    const dp = Array(inputWords.length + 1)
      .fill(null)
      .map(() => Array(expectedWords.length + 1).fill(0));

    for (let i = 1; i <= inputWords.length; i++) {
      for (let j = 1; j <= expectedWords.length; j++) {
        if (this.wordsMatch(inputWords[i - 1], expectedWords[j - 1])) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }

    const matchedInputIndices = new Set<number>();
    let i = inputWords.length;
    let j = expectedWords.length;
    while (i > 0 && j > 0) {
      if (this.wordsMatch(inputWords[i - 1], expectedWords[j - 1])) {
        matchedInputIndices.add(i - 1);
        i--;
        j--;
      } else if (dp[i - 1][j] >= dp[i][j - 1]) {
        // Sửa nhỏ: >= để ưu tiên đường đi
        i--;
      } else {
        j--;
      }
    }

    const result: WordResult[] = inputWords.map((word, index) => ({
      word: word,
      match: matchedInputIndices.has(index),
    }));

    return result;
  }

  public resetContext(contextId = "default"): void {
    this.contexts.delete(contextId);
  }

  public getAccumulatedInput(contextId = "default"): string {
    const context = this.contexts.get(contextId);
    return context ? context.accumulatedInput.join(" ") : "";
  }

  /**
   * Enhanced similarity calculation with better handling for long sentences
   */
  public calculateSimilarity(
    userInput: string,
    expectedText: string,
    contextId = "default",
    options: {
      allowPartial?: boolean;
      semanticMatching?: boolean;
      strictMode?: boolean;
      isLongSentence?: boolean;
    } = {}
  ): SimilarityResult {
    const { semanticMatching = true } = options;

    // Auto-detect if this is a long sentence
    const expectedWords = this.normalizeText(expectedText).split(/\s+/);
    const isLongSentence = expectedWords.length >= this.LONG_SENTENCE_THRESHOLD;

    // Get or create context
    let context = this.contexts.get(contextId);
    if (!context || context.expectedText !== expectedText) {
      context = {
        accumulatedInput: [],
        expectedText,
        startTime: Date.now(),
        lastInputTime: Date.now(),
        partialMatches: [],
        keyPhrasesFound: new Set(),
        totalExpectedWords: expectedWords.length,
      };
      this.contexts.set(contextId, context);
    }

    // Add current input to accumulated input
    const cleanInput = userInput.trim();
    if (cleanInput.length > 0) {
      context.accumulatedInput.push(cleanInput);
      context.lastInputTime = Date.now();
    }

    // Combine all accumulated input
    const fullUserInput = context.accumulatedInput.join(" ").trim();

    // Calculate different types of similarity
    const exactMatch = this.calculateExactSimilarity(
      fullUserInput,
      expectedText
    );
    const semanticMatch = semanticMatching
      ? this.calculateSemanticSimilarity(fullUserInput, expectedText)
      : 0;
    const phraseMatch = this.calculatePhraseSimilarity(
      fullUserInput,
      expectedText
    );
    const structuralMatch = this.calculateStructuralSimilarity(
      fullUserInput,
      expectedText
    );

    // Calculate completeness ratio
    const completenessRatio = this.calculateCompleteness(
      fullUserInput,
      expectedText
    );

    // Enhanced partial detection for long sentences
    const isLikelyPartial = this.isLikelyPartialInput(
      fullUserInput,
      expectedText,
      isLongSentence,
      context
    );
    const shouldWaitForMore = this.shouldWaitForMoreInput(
      fullUserInput,
      expectedText,
      isLongSentence,
      context
    );

    // Calculate composite score with long sentence adjustments
    let score = Math.max(
      exactMatch * 1.0,
      semanticMatch * 0.9,
      phraseMatch * 0.8,
      structuralMatch * 0.7
    );

    // Special handling for long sentences
    if (isLongSentence) {
      // More lenient scoring for long sentences
      score = this.adjustScoreForLongSentence(
        score,
        completenessRatio,
        fullUserInput,
        expectedText
      );

      // Don't advance unless we have substantial content
      if (
        completenessRatio < this.MIN_COMPLETENESS_FOR_LONG &&
        !this.hasKeyPhrases(fullUserInput, expectedText)
      ) {
        score = Math.min(score, 0.4); // Cap score to prevent early advancement
      }
    }

    // Calculate confidence with long sentence considerations
    const confidence = this.calculateConfidence(
      fullUserInput,
      expectedText,
      score,
      isLongSentence
    );

    // Generate enhanced feedback
    const feedback = this.generateEnhancedFeedback(
      fullUserInput,
      expectedText,
      score,
      isLikelyPartial,
      shouldWaitForMore,
      completenessRatio,
      isLongSentence
    );

    // Find matched and missing phrases
    const { matchedPhrases, missingPhrases } = this.analyzePhrases(
      fullUserInput,
      expectedText
    );

    // Analyze individual words for highlighting
    const words = this.analyzeWords(fullUserInput, expectedText);

    const result: SimilarityResult = {
      score,
      confidence,
      matchedPhrases,
      missingPhrases,
      feedback,
      isPartialMatch: isLikelyPartial || shouldWaitForMore,
      completenessRatio,
      shouldWaitForMore,
      words,
    };

    // Clean up old contexts
    this.cleanupOldContexts();

    return result;
  }
}

// Export singleton instance
export const enhancedSimilarityCalculator = new EnhancedSimilarityCalculator();

// Export utility functions
export const calculateAdvancedSimilarity = (
  userInput: string,
  expectedText: string,
  contextId?: string,
  options?: {
    allowPartial?: boolean;
    semanticMatching?: boolean;
    strictMode?: boolean;
    isLongSentence?: boolean;
  }
) =>
  enhancedSimilarityCalculator.calculateSimilarity(
    userInput,
    expectedText,
    contextId,
    options
  );

export const resetSimilarityContext = (contextId?: string) =>
  enhancedSimilarityCalculator.resetContext(contextId);

export const getAccumulatedInput = (contextId?: string) =>
  enhancedSimilarityCalculator.getAccumulatedInput(contextId);
