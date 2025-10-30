/**
 * HuggingFace AI Integration for Feedback Polishing
 * Uses HuggingFace Inference API with google/flan-t5-base model
 */

interface HuggingFaceResponse {
  generated_text?: string;
  error?: string;
}

/**
 * Delays execution for exponential backoff retry logic
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Polishes feedback text using HuggingFace AI
 * Implements graceful degradation with retry logic
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
    console.warn('HuggingFace API key not configured. Returning original content.');
    return content;
  }

  // Construct the prompt for the AI model
  const prompt = `Improve the following feedback to be more constructive, professional, and actionable while maintaining its core message and intent:\n\n"${content}"\n\nImproved feedback:`;

  let lastError: Error | null = null;

  // Retry loop with exponential backoff
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(
        'https://api-inference.huggingface.co/models/google/flan-t5-base',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: prompt,
            parameters: {
              max_new_tokens: 500,
              temperature: 0.7,
              top_p: 0.9,
              do_sample: true,
            },
          }),
        }
      );

      // Handle non-200 status codes
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `HuggingFace API error (${response.status}): ${errorText}`
        );
      }

      const result = (await response.json()) as HuggingFaceResponse[] | HuggingFaceResponse;

      // Handle array response
      if (Array.isArray(result) && result.length > 0) {
        const generatedText = result[0].generated_text;
        if (generatedText && generatedText.trim().length > 0) {
          return generatedText.trim();
        }
      }

      // Handle single object response
      if (!Array.isArray(result) && result.generated_text) {
        const generatedText = result.generated_text;
        if (generatedText.trim().length > 0) {
          return generatedText.trim();
        }
      }

      // If we got a response but no generated text, treat as error
      throw new Error('No generated text in response');
    } catch (error) {
      lastError = error as Error;
      console.error(
        `HuggingFace API attempt ${attempt + 1}/${maxRetries} failed:`,
        error
      );

      // Don't retry on the last attempt
      if (attempt < maxRetries - 1) {
        // Exponential backoff: 1s, 2s, 4s, etc.
        const backoffMs = Math.pow(2, attempt) * 1000;
        console.log(`Retrying in ${backoffMs}ms...`);
        await delay(backoffMs);
      }
    }
  }

  // All retries exhausted - log error and return original content
  console.error(
    'HuggingFace AI polishing failed after all retries:',
    lastError?.message
  );
  console.warn('Returning original content as fallback.');

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
