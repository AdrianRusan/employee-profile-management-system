import { IAIService } from '../../application/ports/IAIService';
import { polishFeedback, isHuggingFaceConfigured, isValidForAIPolishing } from '../../../lib/ai/huggingface';

/**
 * HuggingFace implementation of IAIService interface
 * Wraps the existing HuggingFace AI utilities to conform to the application port
 *
 * Uses HuggingFace Inference API with Qwen/Qwen2.5-7B-Instruct model
 * via OpenAI-compatible chat completions endpoint
 *
 * Features:
 * - Feedback text polishing and improvement
 * - Graceful degradation (returns original content if AI fails)
 * - Retry logic with exponential backoff
 * - Input validation for content length
 */
export class HuggingFaceAIService implements IAIService {
  /**
   * Polishes feedback text using HuggingFace AI
   * Makes the feedback more constructive, professional, and actionable
   *
   * @param content - Original feedback text to polish
   * @param maxRetries - Maximum number of retry attempts (default: 3)
   * @returns Polished feedback text, or original content if AI service fails
   *
   * @example
   * const original = "Your code is messy and hard to read.";
   * const polished = await aiService.polishFeedback(original);
   * // Returns: "Consider improving code readability by following consistent formatting..."
   */
  async polishFeedback(content: string, maxRetries?: number): Promise<string> {
    // Validate content before sending to AI
    if (!this.isValidForPolishing(content)) {
      return content;
    }

    return polishFeedback(content, maxRetries);
  }

  /**
   * Checks if HuggingFace AI service is configured and available
   *
   * @returns true if API key is configured, false otherwise
   *
   * @example
   * if (aiService.isAvailable()) {
   *   const polished = await aiService.polishFeedback(content);
   * } else {
   *   // Handle AI service not available
   * }
   */
  isAvailable(): boolean {
    return isHuggingFaceConfigured();
  }

  /**
   * Validates that feedback content is within acceptable limits for AI processing
   *
   * @param content - Feedback content to validate
   * @returns true if valid (10-2000 characters), false otherwise
   *
   * @example
   * aiService.isValidForPolishing("Too short"); // false
   * aiService.isValidForPolishing("This is a valid feedback length"); // true
   */
  isValidForPolishing(content: string): boolean {
    return isValidForAIPolishing(content);
  }
}
