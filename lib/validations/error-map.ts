/**
 * Custom Zod Error Map
 * Provides user-friendly error messages for validation failures
 */

import { z } from 'zod';

export const customErrorMap: z.ZodErrorMap = (issue, ctx) => {
  if (issue.code === z.ZodIssueCode.invalid_type) {
    if (issue.expected === 'string') {
      return { message: 'This field must be text' };
    }
    if (issue.expected === 'number') {
      return { message: 'This field must be a number' };
    }
    if (issue.expected === 'date') {
      return { message: 'Please provide a valid date' };
    }
  }

  if (issue.code === z.ZodIssueCode.invalid_string) {
    if (issue.validation === 'email') {
      return { message: 'Please enter a valid email address' };
    }
    if (issue.validation === 'url') {
      return { message: 'Please enter a valid URL' };
    }
  }

  if (issue.code === z.ZodIssueCode.too_small) {
    if (issue.type === 'string') {
      return {
        message: `Must be at least ${issue.minimum} character${issue.minimum === 1 ? '' : 's'}`,
      };
    }
    if (issue.type === 'number') {
      return { message: `Must be at least ${issue.minimum}` };
    }
    if (issue.type === 'array') {
      return {
        message: `Please select at least ${issue.minimum} item${issue.minimum === 1 ? '' : 's'}`,
      };
    }
  }

  if (issue.code === z.ZodIssueCode.too_big) {
    if (issue.type === 'string') {
      return {
        message: `Must be no more than ${issue.maximum} character${issue.maximum === 1 ? '' : 's'}`,
      };
    }
    if (issue.type === 'number') {
      return { message: `Must be no more than ${issue.maximum}` };
    }
    if (issue.type === 'array') {
      return {
        message: `Please select no more than ${issue.maximum} item${issue.maximum === 1 ? '' : 's'}`,
      };
    }
  }

  if (issue.code === z.ZodIssueCode.invalid_enum_value) {
    return {
      message: `Please select a valid option from: ${issue.options.join(', ')}`,
    };
  }

  // Default error message
  return { message: ctx.defaultError };
};

/**
 * Apply custom error map to Zod globally
 * Call this once at application startup
 */
export function initializeZodErrorMap() {
  z.setErrorMap(customErrorMap);
}
