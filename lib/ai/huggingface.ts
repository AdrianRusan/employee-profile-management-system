/**
 * HuggingFace AI Integration for Feedback Polishing
 * Uses HuggingFace Inference Providers API with Qwen/Qwen2.5-7B-Instruct model
 * via OpenAI-compatible chat completions endpoint
 */

import { logger } from '@/lib/logger';

interface ChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: string;
}

/**
 * Delays execution for exponential backoff retry logic
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Redact PII from text before sending to AI
 */
function redactPII(text: string): string {
  // Redact email addresses
  let sanitized = text.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]');

  // Redact SSN patterns (XXX-XX-XXXX)
  sanitized = sanitized.replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN]');

  // Redact phone numbers (various formats)
  sanitized = sanitized.replace(/\b(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g, '[PHONE]');

  // Redact credit card numbers (16 digits)
  sanitized = sanitized.replace(/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, '[CREDIT_CARD]');

  return sanitized;
}

/**
 * Polishes feedback text using HuggingFace AI
 * Implements graceful degradation with retry logic and PII redaction
 *
 * @param content - Original feedback text to polish
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @returns Polished feedback text, or original content if AI service fails
 */
export async function polishFeedback(
  content: string,
  maxRetries: number = 3
): Promise<string> {
  const apiKey = process.env.HUGGINGFACE_API_KEY;

  // Return original content if API key is not configured
  if (!apiKey) {
    logger.warn('HuggingFace API key not configured. Returning original content.');
    return content;
  }

  // Redact PII before sending to AI
  const sanitizedContent = redactPII(content);
  logger.info({
    originalLength: content.length,
    sanitizedLength: sanitizedContent.length,
    redacted: sanitizedContent !== content
  }, 'PII redaction applied before AI processing');

  // Construct the messages for the chat completion API using sanitized content
  const messages = [
    {
      role: 'user',
      content: `Improve the following feedback to be more constructive, professional, and actionable while maintaining its core message and intent:\n\n"${sanitizedContent}"\n\nImproved feedback:`
    }
  ];

  const startTime = Date.now();

  let lastError: Error | null = null;

  // Retry loop with exponential backoff
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const response = await fetch(
        'https://router.huggingface.co/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'Qwen/Qwen2.5-7B-Instruct',
            messages: messages,
            max_tokens: 500,
            temperature: 0.7,
            top_p: 0.9,
          }),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      // Handle non-200 status codes
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `HuggingFace API error (${response.status}): ${errorText}`
        );
      }

      const result = (await response.json()) as ChatCompletionResponse;

      // Handle OpenAI-compatible chat completion response
      if (result.choices && result.choices.length > 0) {
        const messageContent = result.choices[0].message?.content;
        if (messageContent && messageContent.trim().length > 0) {
          const duration = Date.now() - startTime;

          // Log AI usage for cost tracking
          logger.info({
            attempt: attempt + 1,
            duration,
            inputLength: sanitizedContent.length,
            outputLength: messageContent.length,
            model: 'Qwen/Qwen2.5-7B-Instruct',
            success: true,
          }, 'AI feedback polishing successful');

          return messageContent.trim();
        }
      }

      // If we got a response but no generated text, treat as error
      throw new Error('No generated text in response');
    } catch (error) {
      clearTimeout(timeoutId);

      // Handle timeout errors
      if (error instanceof Error && error.name === 'AbortError') {
        lastError = new Error('Request timeout after 30 seconds');
        logger.error(
          { attempt: attempt + 1, maxRetries },
          `HuggingFace API attempt ${attempt + 1}/${maxRetries} timed out`
        );
      } else {
        lastError = error as Error;
        logger.error(
          { error, attempt: attempt + 1, maxRetries },
          `HuggingFace API attempt ${attempt + 1}/${maxRetries} failed`
        );
      }

      // Don't retry on the last attempt
      if (attempt < maxRetries - 1) {
        // Exponential backoff: 1s, 2s, 4s, etc.
        const backoffMs = Math.pow(2, attempt) * 1000;
        logger.info({ backoffMs }, `Retrying in ${backoffMs}ms...`);
        await delay(backoffMs);
      }
    }
  }

  // All retries exhausted - log error and return original content
  logger.error(
    { error: lastError?.message },
    'HuggingFace AI polishing failed after all retries'
  );
  logger.warn('Returning original content as fallback');

  return content;
}

/**
 * Check if HuggingFace API is configured
 * @returns true if API key is available, false otherwise
 */
export function isHuggingFaceConfigured(): boolean {
  return !!process.env.HUGGINGFACE_API_KEY;
}

/**
 * Validates that feedback content is within acceptable limits for AI processing
 * @param content - Feedback content to validate
 * @returns true if valid, false otherwise
 */
export function isValidForAIPolishing(content: string): boolean {
  const trimmed = content.trim();
  return trimmed.length >= 10 && trimmed.length <= 2000;
}
