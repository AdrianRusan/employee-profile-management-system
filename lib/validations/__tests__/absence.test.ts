import { describe, it, expect } from '@jest/globals'
import { absenceRequestSchema } from '../absence'

describe('absenceRequestSchema', () => {
  it('should validate correct absence request data', () => {
    const validData = {
      startDate: new Date('2024-02-01'),
      endDate: new Date('2024-02-05'),
      reason: 'Family vacation for the holidays',
    }

    const result = absenceRequestSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('should reject reason shorter than 10 characters', () => {
    const invalidData = {
      startDate: new Date('2024-02-01'),
      endDate: new Date('2024-02-05'),
      reason: 'Short',
    }

    const result = absenceRequestSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
  })

  it('should reject end date before start date', () => {
    const invalidData = {
      startDate: new Date('2024-02-05'),
      endDate: new Date('2024-02-01'),
      reason: 'Family vacation',
    }

    const result = absenceRequestSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
  })

  it('should reject end date equal to start date', () => {
    const invalidData = {
      startDate: new Date('2024-02-01'),
      endDate: new Date('2024-02-01'),
      reason: 'Family vacation',
    }

    const result = absenceRequestSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
  })

  it('should accept same day with different times', () => {
    const validData = {
      startDate: new Date('2024-02-01T09:00:00'),
      endDate: new Date('2024-02-01T17:00:00'),
      reason: 'Medical appointment',
    }

    const result = absenceRequestSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('should require all fields', () => {
    const invalidData = {
      startDate: new Date('2024-02-01'),
    }

    const result = absenceRequestSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
  })

  it('should reject non-date startDate', () => {
    const invalidData = {
      startDate: 'not-a-date',
      endDate: new Date('2024-02-05'),
      reason: 'Family vacation',
    }

    const result = absenceRequestSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
  })

  it('should reject non-date endDate', () => {
    const invalidData = {
      startDate: new Date('2024-02-01'),
      endDate: 'not-a-date',
      reason: 'Family vacation',
    }

    const result = absenceRequestSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
  })
})
