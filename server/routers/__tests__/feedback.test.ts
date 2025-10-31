import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { appRouter } from '../_app'
import { createInnerTRPCContext } from '../../trpc'
import { mockUsers, mockFeedback } from '../../../lib/test-utils'

// Mock Prisma Client
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
  feedback: {
    findMany: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    findUnique: jest.fn(),
  },
  absenceRequest: {
    findMany: jest.fn(),
    create: jest.fn(),
  },
}

describe('feedback.create', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should allow any authenticated user to create feedback', async () => {
    const feedbackData = {
      receiverId: mockUsers.employee.id,
      content: 'Great work on the recent project!',
    }

    mockPrisma.feedback.create.mockResolvedValue({
      ...mockFeedback,
      ...feedbackData,
      giverId: mockUsers.coworker.id,
    })

    const ctx = createInnerTRPCContext({
      session: {
        user: {
          id: mockUsers.coworker.id,
          role: 'COWORKER',
        },
      },
      prisma: mockPrisma as any,
    })

    const caller = appRouter.createCaller(ctx)
    const result = await caller.feedback.create(feedbackData)

    expect(result).toBeDefined()
    expect(mockPrisma.feedback.create).toHaveBeenCalledWith({
      data: {
        ...feedbackData,
        giverId: mockUsers.coworker.id,
      },
    })
  })
})

describe('feedback.getForUser', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should allow user to view their own feedback', async () => {
    mockPrisma.feedback.findMany.mockResolvedValue([mockFeedback])

    const ctx = createInnerTRPCContext({
      session: {
        user: {
          id: mockUsers.employee.id,
          role: 'EMPLOYEE',
        },
      },
      prisma: mockPrisma as any,
    })

    const caller = appRouter.createCaller(ctx)
    const result = await caller.feedback.getForUser({
      userId: mockUsers.employee.id,
    })

    expect(result).toBeDefined()
    expect(result.length).toBeGreaterThan(0)
    expect(mockPrisma.feedback.findMany).toHaveBeenCalled()
  })

  it('should allow MANAGER to view any user feedback', async () => {
    mockPrisma.feedback.findMany.mockResolvedValue([mockFeedback])

    const ctx = createInnerTRPCContext({
      session: {
        user: {
          id: mockUsers.manager.id,
          role: 'MANAGER',
        },
      },
      prisma: mockPrisma as any,
    })

    const caller = appRouter.createCaller(ctx)
    const result = await caller.feedback.getForUser({
      userId: mockUsers.employee.id,
    })

    expect(result).toBeDefined()
    expect(mockPrisma.feedback.findMany).toHaveBeenCalled()
  })

  it('should reject COWORKER viewing another user feedback', async () => {
    const ctx = createInnerTRPCContext({
      session: {
        user: {
          id: mockUsers.coworker.id,
          role: 'COWORKER',
        },
      },
      prisma: mockPrisma as any,
    })

    const caller = appRouter.createCaller(ctx)

    await expect(
      caller.feedback.getForUser({ userId: mockUsers.employee.id })
    ).rejects.toThrow()
  })
})

describe('feedback.delete', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should allow feedback giver to delete their feedback', async () => {
    mockPrisma.feedback.findUnique.mockResolvedValue(mockFeedback)
    mockPrisma.feedback.delete.mockResolvedValue(mockFeedback)

    const ctx = createInnerTRPCContext({
      session: {
        user: {
          id: mockUsers.coworker.id,
          role: 'COWORKER',
        },
      },
      prisma: mockPrisma as any,
    })

    const caller = appRouter.createCaller(ctx)
    await caller.feedback.delete({ id: mockFeedback.id })

    expect(mockPrisma.feedback.delete).toHaveBeenCalledWith({
      where: { id: mockFeedback.id },
    })
  })

  it('should allow MANAGER to delete any feedback', async () => {
    mockPrisma.feedback.findUnique.mockResolvedValue(mockFeedback)
    mockPrisma.feedback.delete.mockResolvedValue(mockFeedback)

    const ctx = createInnerTRPCContext({
      session: {
        user: {
          id: mockUsers.manager.id,
          role: 'MANAGER',
        },
      },
      prisma: mockPrisma as any,
    })

    const caller = appRouter.createCaller(ctx)
    await caller.feedback.delete({ id: mockFeedback.id })

    expect(mockPrisma.feedback.delete).toHaveBeenCalled()
  })

  it('should reject unauthorized user deleting feedback', async () => {
    mockPrisma.feedback.findUnique.mockResolvedValue(mockFeedback)

    const ctx = createInnerTRPCContext({
      session: {
        user: {
          id: mockUsers.employee.id,
          role: 'EMPLOYEE',
        },
      },
      prisma: mockPrisma as any,
    })

    const caller = appRouter.createCaller(ctx)

    await expect(
      caller.feedback.delete({ id: mockFeedback.id })
    ).rejects.toThrow()
  })
})
