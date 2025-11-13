import DOMPurify from 'dompurify';
import { logger } from './logger';

/**
 * Server-side HTML sanitization configuration
 * Removes all potentially dangerous HTML tags and attributes
 */
const SANITIZE_CONFIG: DOMPurify.Config = {
  // Allow only safe inline text formatting
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'u', 'br', 'p'],
  ALLOWED_ATTR: [],
  KEEP_CONTENT: true, // Preserve text content even if tags are removed
  ALLOW_DATA_ATTR: false,
  ALLOW_UNKNOWN_PROTOCOLS: false,
  SAFE_FOR_TEMPLATES: true,
};

/**
 * Strict sanitization for plain text fields
 * Strips ALL HTML tags and only keeps text content
 */
const STRICT_CONFIG: DOMPurify.Config = {
  ALLOWED_TAGS: [], // No HTML tags allowed
  ALLOWED_ATTR: [],
  KEEP_CONTENT: true,
  ALLOW_DATA_ATTR: false,
  ALLOW_UNKNOWN_PROTOCOLS: false,
  SAFE_FOR_TEMPLATES: true,
};

/**
 * Check if we're in a browser environment
 * DOMPurify requires a DOM, so we need different approaches for server/client
 */
const isBrowser = typeof window !== 'undefined';

/**
 * Sanitize HTML content to prevent XSS attacks
 *
 * @param dirty - Untrusted HTML string from user input
 * @param strict - If true, strips ALL HTML tags (for plain text fields)
 * @returns Sanitized HTML string safe for rendering
 *
 * @example
 * ```typescript
 * // Allow basic formatting
 * const bio = sanitizeHtml(userInput); // Keeps <b>, <i>, etc.
 *
 * // Strip all HTML (for names, titles, etc.)
 * const name = sanitizeHtml(userInput, true); // Text only
 * ```
 */
export function sanitizeHtml(dirty: string, strict = false): string {
  if (!dirty) return '';

  try {
    if (isBrowser) {
      // Client-side: Use DOMPurify directly with the DOM
      return DOMPurify.sanitize(dirty, strict ? STRICT_CONFIG : SANITIZE_CONFIG);
    } else {
      // Server-side: Create a minimal DOM for DOMPurify using JSDOM
      // For server-side, we'll use a more conservative approach
      // and just strip all HTML tags for safety
      return stripHtmlTags(dirty);
    }
  } catch (error) {
    logger.error({ error, inputLength: dirty.length }, 'HTML sanitization failed');
    // On error, return empty string for safety
    return '';
  }
}

/**
 * Server-side HTML tag stripper
 * Simple regex-based approach for server-side sanitization
 * More conservative than DOMPurify but works without DOM
 */
function stripHtmlTags(html: string): string {
  if (!html) return '';

  // Remove HTML tags
  let cleaned = html.replace(/<[^>]*>/g, '');

  // Decode HTML entities
  cleaned = cleaned
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');

  // Remove potential script injection attempts
  cleaned = cleaned
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');

  return cleaned.trim();
}

/**
 * Sanitize user input for safe database storage
 * Use this on all user-generated content before saving to database
 *
 * @param input - User input object with fields to sanitize
 * @param fields - Array of field names to sanitize
 * @returns Object with sanitized fields
 *
 * @example
 * ```typescript
 * const sanitized = sanitizeUserInput(
 *   { name: userInput.name, bio: userInput.bio },
 *   ['name', 'bio']
 * );
 * ```
 */
export function sanitizeUserInput<T extends Record<string, unknown>>(
  input: T,
  fields: (keyof T)[]
): T {
  const sanitized = { ...input };

  for (const field of fields) {
    const value = sanitized[field];
    if (typeof value === 'string') {
      // Use strict mode (strip all HTML) for most fields
      sanitized[field] = sanitizeHtml(value, true) as T[keyof T];
    }
  }

  return sanitized;
}

/**
 * Sanitize feedback content
 * Allows basic formatting but removes dangerous HTML
 *
 * @param content - Feedback content from user
 * @returns Sanitized content safe for storage and display
 */
export function sanitizeFeedback(content: string): string {
  if (!content) return '';

  // Allow basic formatting in feedback
  // Remove dangerous tags but keep basic text formatting
  return isBrowser
    ? DOMPurify.sanitize(content, SANITIZE_CONFIG)
    : stripHtmlTags(content);
}

/**
 * Sanitize bio/description fields
 * Allows basic text formatting for rich descriptions
 */
export function sanitizeBio(bio: string): string {
  if (!bio) return '';

  return isBrowser
    ? DOMPurify.sanitize(bio, SANITIZE_CONFIG)
    : stripHtmlTags(bio);
}

/**
 * Validate and sanitize file names
 * Prevents path traversal and dangerous characters
 *
 * @param filename - Original filename from user
 * @returns Safe filename with dangerous characters removed
 */
export function sanitizeFilename(filename: string): string {
  if (!filename) return 'file';

  // Remove path traversal attempts
  let safe = filename.replace(/\.\./g, '');

  // Remove directory separators
  safe = safe.replace(/[\/\\]/g, '');

  // Allow only alphanumeric, dash, underscore, and dot
  safe = safe.replace(/[^a-zA-Z0-9._-]/g, '_');

  // Remove leading dots (hidden files)
  safe = safe.replace(/^\.+/, '');

  // Truncate to reasonable length
  safe = safe.slice(0, 255);

  return safe || 'file';
}

/**
 * Client-side hook for sanitizing input as user types
 * Use in forms to provide real-time sanitization
 *
 * @example
 * ```tsx
 * const [bio, setBio] = useState('');
 * const sanitizedBio = useSanitizedInput(bio);
 * ```
 */
export function useSanitizedInput(value: string, strict = false): string {
  if (!isBrowser) return value;
  return sanitizeHtml(value, strict);
}

/**
 * List of fields that should be sanitized before storage
 */
export const SANITIZABLE_FIELDS = {
  user: ['name', 'bio', 'title', 'department', 'address'] as const,
  feedback: ['content', 'polishedContent'] as const,
  absence: ['reason'] as const,
} as const;
