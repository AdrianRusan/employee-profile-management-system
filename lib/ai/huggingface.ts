/**
 * HuggingFace AI Integration for Feedback Polishing
 * Uses HuggingFace Inference Providers API with Qwen/Qwen2.5-72B-Instruct model
 * via OpenAI-compatible chat completions endpoint
 *
 * Specialized for workplace feedback transformation with:
 * - Role-based system prompts
 * - Few-shot examples for consistent output
 * - Output format constraints
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
 * System prompt that defines the AI's role and behavior
 */
const FEEDBACK_POLISH_SYSTEM_PROMPT = `You are an expert workplace feedback coach specializing in transforming raw feedback into constructive, professional, and actionable guidance.

Your role is to:
1. PRESERVE the original meaning and intent completely - never change what the feedback is about
2. REFRAME negative or harsh language into growth-oriented suggestions
3. ADD specific, actionable recommendations where the original is vague
4. MAINTAIN appropriate length - similar to the original, slightly longer if adding actionable advice
5. USE a professional but warm and supportive tone

Critical guidelines:
- Never add information or concerns not implied by the original feedback
- Never remove important critical points - constructive criticism is valuable
- Focus on behaviors and outcomes, not personality traits
- Suggest concrete improvements, don't just point out problems
- Keep the feedback direct and honest while being respectful
- Use "Consider..." or "It would help to..." instead of "You should..." or "You need to..."

Output format:
- Return ONLY the polished feedback text
- Do NOT include any explanations, notes, or meta-commentary
- Do NOT start with "Here's the polished version" or similar phrases
- Do NOT use quotation marks around your response`;

/**
 * Few-shot examples to guide the model's output style
 */
const FEW_SHOT_EXAMPLES = [
  {
    original: "Your code is messy and hard to read.",
    polished: "I noticed some opportunities to enhance code readability in your recent work. Consider breaking down longer functions into smaller, focused units and adding brief comments to explain complex logic. Consistent formatting and meaningful variable names would also make the codebase more maintainable for the whole team."
  },
  {
    original: "You're always late to meetings and it's annoying.",
    polished: "I've observed that meeting punctuality has been a challenge recently. When meetings start late, it impacts the team's momentum and scheduling. Setting calendar reminders 5-10 minutes before meetings might help, and if delays are unavoidable, a quick heads-up message would be appreciated by everyone."
  },
  {
    original: "Good job on the project.",
    polished: "Great work on completing the project! Your dedication to meeting the deadline while maintaining quality was evident. The approach you took to organize the deliverables made the review process smooth. Keep up this level of attention to detail in future projects."
  },
  {
    original: "You don't communicate enough with the team.",
    polished: "Increasing communication with the team would really benefit our collaboration. Consider sharing brief updates during standups about your current progress and any blockers you're facing. Proactive communication helps everyone stay aligned and creates opportunities for the team to support each other more effectively."
  }
];

/**
 * Delays execution for exponential backoff retry logic
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Builds the messages array for the chat completion API
 * Includes system prompt, few-shot examples, and the user's feedback
 */
function buildMessages(content: string): Array<{ role: string; content: string }> {
  const messages: Array<{ role: string; content: string }> = [
    {
      role: 'system',
      content: FEEDBACK_POLISH_SYSTEM_PROMPT
    }
  ];

  // Add few-shot examples
  for (const example of FEW_SHOT_EXAMPLES) {
    messages.push({
      role: 'user',
      content: `Polish this workplace feedback:\n\n${example.original}`
    });
    messages.push({
      role: 'assistant',
      content: example.polished
    });
  }

  // Add the actual feedback to polish
  messages.push({
    role: 'user',
    content: `Polish this workplace feedback:\n\n${content}`
  });

  return messages;
}

/**
 * Cleans the AI response to remove any unwanted prefixes or formatting
 */
function cleanResponse(response: string): string {
  let cleaned = response.trim();

  // Remove common unwanted prefixes
  const unwantedPrefixes = [
    /^here'?s?\s*(the\s*)?(polished|improved|refined)\s*(version|feedback)?:?\s*/i,
    /^polished\s*(version|feedback)?:?\s*/i,
    /^improved\s*(version|feedback)?:?\s*/i,
  ];

  for (const prefix of unwantedPrefixes) {
    cleaned = cleaned.replace(prefix, '').trim();
  }

  // Remove surrounding quotes if present
  if ((cleaned.startsWith('"') && cleaned.endsWith('"')) ||
      (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
    cleaned = cleaned.slice(1, -1).trim();
  }

  return cleaned;
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
    logger.warn('HuggingFace API key not configured. Returning original content.');
    return content;
  }

  const messages = buildMessages(content);
  let lastError: Error | null = null;

  // Retry loop with exponential backoff
  for (let attempt = 0; attempt < maxRetries; attempt++) {
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
            model: 'Qwen/Qwen2.5-72B-Instruct',
            messages: messages,
            max_tokens: 600,
            temperature: 0.5, // Lower temperature for more consistent output
            top_p: 0.9,
            stop: ['\n\nOriginal:', '\n\nPolish this', '---'], // Stop sequences
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

      const result = (await response.json()) as ChatCompletionResponse;

      // Handle OpenAI-compatible chat completion response
      if (result.choices && result.choices.length > 0) {
        const messageContent = result.choices[0].message?.content;
        if (messageContent && messageContent.trim().length > 0) {
          const polished = cleanResponse(messageContent);

          // Sanity check: polished content should be reasonable length
          if (polished.length >= 10 && polished.length <= content.length * 5) {
            logger.info(
              { originalLength: content.length, polishedLength: polished.length },
              'Feedback polished successfully'
            );
            return polished;
          }

          logger.warn(
            { originalLength: content.length, polishedLength: polished.length },
            'Polished content length seems unreasonable, using original'
          );
          return content;
        }
      }

      // If we got a response but no generated text, treat as error
      throw new Error('No generated text in response');
    } catch (error) {
      lastError = error as Error;
      logger.error(
        { error, attempt: attempt + 1, maxRetries },
        `HuggingFace API attempt ${attempt + 1}/${maxRetries} failed`
      );

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
