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

  it('should reject content shorter than 10 characters', () => {
    const invalidData = {
      receiverId: 'clx1234567890',
      content: 'Short',
    }

    const result = feedbackSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
  })

  it('should reject content longer than 2000 characters', () => {
    const invalidData = {
      receiverId: 'clx1234567890',
      content: 'a'.repeat(2001),
    }

    const result = feedbackSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
  })

  it('should accept content at minimum length (10 characters)', () => {
    const validData = {
      receiverId: 'clx1234567890',
      content: '1234567890',
    }

    const result = feedbackSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('should accept content at maximum length (2000 characters)', () => {
    const validData = {
      receiverId: 'clx1234567890',
      content: 'a'.repeat(2000),
    }

    const result = feedbackSchema.safeParse(validData)
    expect(result.success).toBe(true)
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
