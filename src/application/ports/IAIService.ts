/**
 * AI Service Port Interface
 * Defines contract for AI-powered features
 */
export interface IAIService {
  /**
   * Check if AI service is available
   */
  isAvailable(): boolean;

  /**
   * Polish feedback content using AI
   */
  polishFeedback(content: string): Promise<string>;
}

/**
 * Result type for AI operations with error handling
 */
export interface AIPolishResult {
  original: string;
  polished: string;
  success: boolean;
  error?: string;
}
