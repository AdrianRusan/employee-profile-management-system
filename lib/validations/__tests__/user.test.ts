import { describe, it, expect } from '@jest/globals'
import { profileSchema, sensitiveProfileSchema } from '../user'

describe('profileSchema', () => {
  it('should validate correct profile data', () => {
    const validData = {
      name: 'John Doe',
      email: 'john@example.com',
      title: 'Software Engineer',
      department: 'Engineering',
      bio: 'Full-stack developer with 5 years of experience',
    }

    const result = profileSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('should reject empty name', () => {
    const invalidData = {
      name: '',
      email: 'john@example.com',
      title: 'Software Engineer',
      department: 'Engineering',
    }

    const result = profileSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
  })

  it('should reject invalid email', () => {
    const invalidData = {
      name: 'John Doe',
      email: 'invalid-email',
      title: 'Software Engineer',
      department: 'Engineering',
    }

    const result = profileSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
  })

  it('should reject name longer than 100 characters', () => {
    const invalidData = {
      name: 'a'.repeat(101),
      email: 'john@example.com',
      title: 'Software Engineer',
      department: 'Engineering',
    }

    const result = profileSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
  })

  it('should allow optional bio', () => {
    const validData = {
      name: 'John Doe',
      email: 'john@example.com',
      title: 'Software Engineer',
      department: 'Engineering',
    }

    const result = profileSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('should reject bio longer than 500 characters', () => {
    const invalidData = {
      name: 'John Doe',
      email: 'john@example.com',
      title: 'Software Engineer',
      department: 'Engineering',
      bio: 'a'.repeat(501),
    }

    const result = profileSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
  })
})

describe('sensitiveProfileSchema', () => {
  it('should validate correct sensitive data', () => {
    const validData = {
      salary: 100000,
      performanceRating: 4,
    }

    const result = sensitiveProfileSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('should allow optional salary', () => {
    const validData = {
      performanceRating: 4,
    }

    const result = sensitiveProfileSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('should reject negative salary', () => {
    const invalidData = {
      salary: -1000,
      performanceRating: 4,
    }

    const result = sensitiveProfileSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
  })

  it('should reject performance rating below 1', () => {
    const invalidData = {
      salary: 100000,
      performanceRating: 0,
    }

    const result = sensitiveProfileSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
  })

  it('should reject performance rating above 5', () => {
    const invalidData = {
      salary: 100000,
      performanceRating: 6,
    }

    const result = sensitiveProfileSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
  })
})
