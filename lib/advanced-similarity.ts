interface SimilarityResult {
    score: number
    confidence: number
    matchedPhrases: string[]
    missingPhrases: string[]
    feedback: string
    isPartialMatch: boolean
  }
  
  interface ConversationContext {
    accumulatedInput: string[]
    expectedText: string
    startTime: number
    lastInputTime: number
    partialMatches: string[]
  }
  
  class AdvancedSimilarityCalculator {
    private contexts: Map<string, ConversationContext> = new Map()
    private readonly CHUNK_TIMEOUT = 3000 // 3 seconds to wait for more chunks
    private readonly MIN_PHRASE_LENGTH = 3
    private readonly SEMANTIC_THRESHOLD = 0.6
  
    /**
     * Main similarity calculation with context awareness
     */
    calculateSimilarity(
      userInput: string,
      expectedText: string,
      contextId = "default",
      options: {
        allowPartial?: boolean
        semanticMatching?: boolean
        strictMode?: boolean
      } = {},
    ): SimilarityResult {
      const { allowPartial = true, semanticMatching = true, strictMode = false } = options
  
      // Get or create context
      let context = this.contexts.get(contextId)
      if (!context || context.expectedText !== expectedText) {
        context = {
          accumulatedInput: [],
          expectedText,
          startTime: Date.now(),
          lastInputTime: Date.now(),
          partialMatches: [],
        }
        this.contexts.set(contextId, context)
      }
  
      // Add current input to accumulated input
      context.accumulatedInput.push(userInput.trim())
      context.lastInputTime = Date.now()
  
      // Combine all accumulated input
      const fullUserInput = context.accumulatedInput.join(" ").trim()
  
      // Calculate different types of similarity
      const exactMatch = this.calculateExactSimilarity(fullUserInput, expectedText)
      const semanticMatch = semanticMatching ? this.calculateSemanticSimilarity(fullUserInput, expectedText) : 0
      const phraseMatch = this.calculatePhraseSimilarity(fullUserInput, expectedText)
      const structuralMatch = this.calculateStructuralSimilarity(fullUserInput, expectedText)
  
      // Determine if this might be a partial input (waiting for more)
      const isLikelyPartial = this.isLikelyPartialInput(fullUserInput, expectedText)
  
      // Calculate composite score
      let score = Math.max(exactMatch * 1.0, semanticMatch * 0.9, phraseMatch * 0.8, structuralMatch * 0.7)
  
      // Adjust score based on completeness
      const completenessRatio = this.calculateCompleteness(fullUserInput, expectedText)
      if (completenessRatio < 0.5 && !isLikelyPartial) {
        score *= 0.7 // Penalize incomplete responses
      }
  
      // Calculate confidence
      const confidence = this.calculateConfidence(fullUserInput, expectedText, score)
  
      // Generate feedback
      const feedback = this.generateFeedback(fullUserInput, expectedText, score, isLikelyPartial, context)
  
      // Find matched and missing phrases
      const { matchedPhrases, missingPhrases } = this.analyzePhrases(fullUserInput, expectedText)
  
      const result: SimilarityResult = {
        score,
        confidence,
        matchedPhrases,
        missingPhrases,
        feedback,
        isPartialMatch: isLikelyPartial,
      }
  
      // Clean up old contexts
      this.cleanupOldContexts()
  
      return result
    }
  
    /**
     * Calculate exact word-by-word similarity
     */
    private calculateExactSimilarity(input: string, expected: string): number {
      const inputWords = this.normalizeText(input).split(/\s+/)
      const expectedWords = this.normalizeText(expected).split(/\s+/)
  
      if (expectedWords.length === 0) return 0
  
      const matchedWords = inputWords.filter((word) =>
        expectedWords.some((expectedWord) => this.wordsMatch(word, expectedWord)),
      )
  
      return matchedWords.length / expectedWords.length
    }
  
    /**
     * Calculate semantic similarity using key phrases and concepts
     */
    private calculateSemanticSimilarity(input: string, expected: string): number {
      const inputPhrases = this.extractKeyPhrases(input)
      const expectedPhrases = this.extractKeyPhrases(expected)
  
      if (expectedPhrases.length === 0) return 0
  
      let matchScore = 0
      for (const expectedPhrase of expectedPhrases) {
        const bestMatch = Math.max(
          ...inputPhrases.map((inputPhrase) => this.calculatePhraseMatch(inputPhrase, expectedPhrase)),
          0,
        )
        matchScore += bestMatch
      }
  
      return matchScore / expectedPhrases.length
    }
  
    /**
     * Calculate phrase-level similarity
     */
    private calculatePhraseSimilarity(input: string, expected: string): number {
      const inputPhrases = this.splitIntoPhrases(input)
      const expectedPhrases = this.splitIntoPhrases(expected)
  
      if (expectedPhrases.length === 0) return 0
  
      let totalScore = 0
      for (const expectedPhrase of expectedPhrases) {
        const bestMatch = Math.max(
          ...inputPhrases.map((inputPhrase) => this.calculateExactSimilarity(inputPhrase, expectedPhrase)),
          0,
        )
        totalScore += bestMatch
      }
  
      return totalScore / expectedPhrases.length
    }
  
    /**
     * Calculate structural similarity (sentence structure, length, etc.)
     */
    private calculateStructuralSimilarity(input: string, expected: string): number {
      const inputSentences = input.split(/[.!?]+/).filter((s) => s.trim().length > 0)
      const expectedSentences = expected.split(/[.!?]+/).filter((s) => s.trim().length > 0)
  
      // Length similarity
      const lengthRatio = Math.min(input.length, expected.length) / Math.max(input.length, expected.length)
  
      // Sentence count similarity
      const sentenceRatio =
        Math.min(inputSentences.length, expectedSentences.length) /
        Math.max(inputSentences.length, expectedSentences.length)
  
      return (lengthRatio + sentenceRatio) / 2
    }
  
    /**
     * Determine if input is likely partial (user still speaking)
     */
    private isLikelyPartialInput(input: string, expected: string): boolean {
      const inputWords = this.normalizeText(input).split(/\s+/)
      const expectedWords = this.normalizeText(expected).split(/\s+/)
  
      // Check if input is significantly shorter
      if (inputWords.length < expectedWords.length * 0.3) return true
  
      // Check if input ends abruptly (no punctuation)
      if (!input.match(/[.!?]$/)) return true
  
      // Check if input contains beginning of expected text
      const expectedStart = expectedWords.slice(0, Math.min(5, expectedWords.length)).join(" ")
      const inputStart = inputWords.slice(0, Math.min(5, inputWords.length)).join(" ")
  
      if (this.calculateExactSimilarity(inputStart, expectedStart) > 0.7) {
        return inputWords.length < expectedWords.length * 0.8
      }
  
      return false
    }
  
    /**
     * Calculate how complete the input is compared to expected
     */
    private calculateCompleteness(input: string, expected: string): number {
      const inputLength = this.normalizeText(input).length
      const expectedLength = this.normalizeText(expected).length
  
      if (expectedLength === 0) return 1
  
      return Math.min(inputLength / expectedLength, 1)
    }
  
    /**
     * Calculate confidence in the similarity score
     */
    private calculateConfidence(input: string, expected: string, score: number): number {
      const inputWords = this.normalizeText(input).split(/\s+/)
      const expectedWords = this.normalizeText(expected).split(/\s+/)
  
      // Base confidence on score
      let confidence = score
  
      // Adjust based on length difference
      const lengthRatio =
        Math.min(inputWords.length, expectedWords.length) / Math.max(inputWords.length, expectedWords.length)
      confidence *= lengthRatio
  
      // Boost confidence for exact matches
      if (score > 0.9) confidence = Math.min(confidence * 1.1, 1)
  
      return confidence
    }
  
    /**
     * Generate helpful feedback for the user
     */
    private generateFeedback(
      input: string,
      expected: string,
      score: number,
      isPartial: boolean,
      context: ConversationContext,
    ): string {
      if (isPartial) {
        return "🎤 Keep going... I'm listening for more."
      }
  
      if (score >= 0.9) {
        return "✅ Perfect! That was exactly right."
      }
  
      if (score >= 0.7) {
        return "🟢 Great job! Very close to the original."
      }
  
      if (score >= 0.5) {
        return "🟡 Good effort! Try to include more of the key phrases."
      }
  
      if (score >= 0.3) {
        return `🟠 You're on the right track. Try saying: "${expected}"`
      }
  
      return `❌ Let's try again. Please say: "${expected}"`
    }
  
    /**
     * Analyze which phrases were matched and which are missing
     */
    private analyzePhrases(
      input: string,
      expected: string,
    ): {
      matchedPhrases: string[]
      missingPhrases: string[]
    } {
      const inputPhrases = this.extractKeyPhrases(input)
      const expectedPhrases = this.extractKeyPhrases(expected)
  
      const matchedPhrases: string[] = []
      const missingPhrases: string[] = []
  
      for (const expectedPhrase of expectedPhrases) {
        const isMatched = inputPhrases.some((inputPhrase) => this.calculatePhraseMatch(inputPhrase, expectedPhrase) > 0.6)
  
        if (isMatched) {
          matchedPhrases.push(expectedPhrase)
        } else {
          missingPhrases.push(expectedPhrase)
        }
      }
  
      return { matchedPhrases, missingPhrases }
    }
  
    /**
     * Extract key phrases from text
     */
    private extractKeyPhrases(text: string): string[] {
      // Split by punctuation and conjunctions
      const phrases = text
        .split(/[.!?;,]|(?:\s+(?:and|but|or|while|because|since|although|however)\s+)/i)
        .map((phrase) => phrase.trim())
        .filter((phrase) => phrase.length >= this.MIN_PHRASE_LENGTH)
  
      return phrases
    }
  
    /**
     * Split text into meaningful phrases
     */
    private splitIntoPhrases(text: string): string[] {
      return text
        .split(/[.!?;]/)
        .map((phrase) => phrase.trim())
        .filter((phrase) => phrase.length > 0)
    }
  
    /**
     * Calculate match between two phrases
     */
    private calculatePhraseMatch(phrase1: string, phrase2: string): number {
      const words1 = this.normalizeText(phrase1).split(/\s+/)
      const words2 = this.normalizeText(phrase2).split(/\s+/)
  
      if (words1.length === 0 || words2.length === 0) return 0
  
      const commonWords = words1.filter((word) => words2.some((w2) => this.wordsMatch(word, w2)))
  
      return commonWords.length / Math.max(words1.length, words2.length)
    }
  
    /**
     * Check if two words match (with fuzzy matching)
     */
    private wordsMatch(word1: string, word2: string): boolean {
      if (word1 === word2) return true
  
      // Handle common speech recognition errors
      const variations: Record<string, string[]> = {
        thinking: ["thinking", "thinkin", "thinking"],
        looking: ["looking", "lookin", "looking"],
        everything: ["everything", "everythin", "every thing"],
        about: ["about", "bout", "abt"],
        perfect: ["perfect", "perfekt", "perfect"],
        problems: ["problems", "problem", "probs"],
        solutions: ["solutions", "solution", "solve"],
      }
  
      for (const [key, variants] of Object.entries(variations)) {
        if (variants.includes(word1) && variants.includes(word2)) {
          return true
        }
      }
  
      // Levenshtein distance for typos
      return this.levenshteinDistance(word1, word2) <= Math.max(1, Math.min(word1.length, word2.length) * 0.2)
    }
  
    /**
     * Calculate Levenshtein distance between two strings
     */
    private levenshteinDistance(str1: string, str2: string): number {
      const matrix = Array(str2.length + 1)
        .fill(null)
        .map(() => Array(str1.length + 1).fill(null))
  
      for (let i = 0; i <= str1.length; i++) matrix[0][i] = i
      for (let j = 0; j <= str2.length; j++) matrix[j][0] = j
  
      for (let j = 1; j <= str2.length; j++) {
        for (let i = 1; i <= str1.length; i++) {
          const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1
          matrix[j][i] = Math.min(
            matrix[j][i - 1] + 1, // deletion
            matrix[j - 1][i] + 1, // insertion
            matrix[j - 1][i - 1] + indicator, // substitution
          )
        }
      }
  
      return matrix[str2.length][str1.length]
    }
  
    /**
     * Normalize text for comparison
     */
    private normalizeText(text: string): string {
      return text
        .toLowerCase()
        .replace(/[^\w\s]/g, " ") // Replace punctuation with spaces
        .replace(/\s+/g, " ") // Normalize whitespace
        .trim()
    }
  
    /**
     * Clean up old contexts to prevent memory leaks
     */
    private cleanupOldContexts(): void {
      const now = Date.now()
      for (const [contextId, context] of this.contexts.entries()) {
        if (now - context.lastInputTime > this.CHUNK_TIMEOUT * 2) {
          this.contexts.delete(contextId)
        }
      }
    }
  
    /**
     * Reset context for a specific conversation
     */
    resetContext(contextId = "default"): void {
      this.contexts.delete(contextId)
    }
  
    /**
     * Get accumulated input for debugging
     */
    getAccumulatedInput(contextId = "default"): string {
      const context = this.contexts.get(contextId)
      return context ? context.accumulatedInput.join(" ") : ""
    }
  }
  
  // Export singleton instance
  export const similarityCalculator = new AdvancedSimilarityCalculator()
  
  // Export utility functions
  export const calculateAdvancedSimilarity = (
    userInput: string,
    expectedText: string,
    contextId?: string,
    options?: any,
  ) => similarityCalculator.calculateSimilarity(userInput, expectedText, contextId, options)
  
  export const resetSimilarityContext = (contextId?: string) => similarityCalculator.resetContext(contextId)
  
  export const getAccumulatedInput = (contextId?: string) => similarityCalculator.getAccumulatedInput(contextId)
  