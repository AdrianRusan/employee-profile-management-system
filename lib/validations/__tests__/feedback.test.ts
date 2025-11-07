import { describe, it, expect } from '@jest/globals'
import { feedbackSchema } from '../feedback'

describe('feedbackSchema', () => {
  it('should validate correct feedback data', () => {
    const validData = {
      receiverId: 'clx1234567890',
      content: 'Great work on the project! Your attention to detail was impressive.',
    }

    const result = feedbackSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('should reject content shorter than 20 characters', () => {
    const invalidData = {
      receiverId: 'clx1234567890',
      content: 'Short',
    }

    const result = feedbackSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Feedback must be at least 20 characters long')
    }
  })

  it('should reject content with fewer than 5 words', () => {
    const invalidData = {
      receiverId: 'clx1234567890',
      content: 'Four words here now', // 19 chars, 4 words
    }

    const result = feedbackSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
  })

  it('should reject content with 4 words but sufficient chars', () => {
    const invalidData = {
      receiverId: 'clx1234567890',
      content: 'Four reasonable length words', // 28 chars, exactly 4 words
    }

    const result = feedbackSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
    if (!result.success) {
      // Should fail on word count since it has > 20 chars but < 5 words
      const wordCountError = result.error.issues.find(issue =>
        issue.message === 'Feedback must contain at least 5 words'
      )
      expect(wordCountError).toBeDefined()
    }
  })

  it('should reject single-word generic feedback', () => {
    const testCases = ['ok', 'good', 'fine', 'nice', 'great', 'OK', 'GOOD']

    testCases.forEach(word => {
      const invalidData = {
        receiverId: 'clx1234567890',
        content: word,
      }

      const result = feedbackSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  it('should reject content longer than 2000 characters', () => {
    const invalidData = {
      receiverId: 'clx1234567890',
      content: 'a'.repeat(2001),
    }

    const result = feedbackSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
  })

  it('should accept content at minimum length (20 characters, 5 words)', () => {
    const validData = {
      receiverId: 'clx1234567890',
      content: 'This is valid feedback text',
    }

    const result = feedbackSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('should accept content at maximum length (2000 characters)', () => {
    const validData = {
      receiverId: 'clx1234567890',
      // Create content with 2000 characters and at least 5 words
      content: 'This is valid feedback text. ' + 'a'.repeat(1971),
    }

    const result = feedbackSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('should trim whitespace from content', () => {
    const validData = {
      receiverId: 'clx1234567890',
      content: '   This is valid feedback text   ',
    }

    const result = feedbackSchema.safeParse(validData)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.content).toBe('This is valid feedback text')
    }
  })

  it('should reject empty string', () => {
    const invalidData = {
      receiverId: 'clx1234567890',
      content: '',
    }

    const result = feedbackSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
  })

  it('should reject whitespace-only content', () => {
    const invalidData = {
      receiverId: 'clx1234567890',
      content: '     ',
    }

    const result = feedbackSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
  })

  it('should require receiverId', () => {
    const invalidData = {
      content: 'Great work on the project!',
    }

    const result = feedbackSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
  })

  it('should reject invalid receiverId format', () => {
    const invalidData = {
      receiverId: 'invalid-id',
      content: 'Great work on the project!',
    }

    const result = feedbackSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
  })
})
