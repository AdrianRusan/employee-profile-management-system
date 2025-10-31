import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { appRouter } from '../_app'
import { createInnerTRPCContext } from '../../trpc'
import { mockUsers, mockAbsenceRequest } from '../../../lib/test-utils'

// Mock Prisma Client
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
  feedback: {
    findMany: jest.fn(),
    create: jest.fn(),
  },
  absenceRequest: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
}

describe('absence.create', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should allow employee to create absence request', async () => {
    const absenceData = {
      startDate: new Date('2024-03-01'),
      endDate: new Date('2024-03-05'),
      reason: 'Family vacation for spring break',
    }

    mockPrisma.absenceRequest.findFirst.mockResolvedValue(null) // No overlap
    mockPrisma.absenceRequest.create.mockResolvedValue({
      ...mockAbsenceRequest,
      ...absenceData,
      userId: mockUsers.employee.id,
    })

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
    const result = await caller.absence.create(absenceData)

    expect(result).toBeDefined()
    expect(mockPrisma.absenceRequest.create).toHaveBeenCalledWith({
      data: {
        ...absenceData,
        userId: mockUsers.employee.id,
      },
    })
  })

  it('should reject overlapping absence requests', async () => {
    const absenceData = {
      startDate: new Date('2024-03-01'),
      endDate: new Date('2024-03-05'),
      reason: 'Family vacation',
    }

    // Mock existing overlapping absence
    mockPrisma.absenceRequest.findFirst.mockResolvedValue(mockAbsenceRequest)

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

    await expect(caller.absence.create(absenceData)).rejects.toThrow()
  })
})

describe('absence.getForUser', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should allow user to view their own absence requests', async () => {
    mockPrisma.absenceRequest.findMany.mockResolvedValue([mockAbsenceRequest])

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
    const result = await caller.absence.getForUser({
      userId: mockUsers.employee.id,
    })

    expect(result).toBeDefined()
    expect(result.length).toBeGreaterThan(0)
  })

  it('should allow MANAGER to view any user absence requests', async () => {
    mockPrisma.absenceRequest.findMany.mockResolvedValue([mockAbsenceRequest])

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
    const result = await caller.absence.getForUser({
      userId: mockUsers.employee.id,
    })

    expect(result).toBeDefined()
  })

  it('should reject COWORKER viewing another user absence requests', async () => {
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
      caller.absence.getForUser({ userId: mockUsers.employee.id })
    ).rejects.toThrow()
  })
})

describe('absence.updateStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should allow MANAGER to approve absence request', async () => {
    const updatedRequest = {
      ...mockAbsenceRequest,
      status: 'APPROVED' as const,
    }

    mockPrisma.absenceRequest.update.mockResolvedValue(updatedRequest)

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
    const result = await caller.absence.updateStatus({
      id: mockAbsenceRequest.id,
      status: 'APPROVED',
    })

    expect(result).toBeDefined()
    expect(mockPrisma.absenceRequest.update).toHaveBeenCalledWith({
      where: { id: mockAbsenceRequest.id },
      data: { status: 'APPROVED' },
    })
  })

  it('should allow MANAGER to reject absence request', async () => {
    const updatedRequest = {
      ...mockAbsenceRequest,
      status: 'REJECTED' as const,
    }

    mockPrisma.absenceRequest.update.mockResolvedValue(updatedRequest)

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
    const result = await caller.absence.updateStatus({
      id: mockAbsenceRequest.id,
      status: 'REJECTED',
    })

    expect(result).toBeDefined()
  })

  it('should reject EMPLOYEE updating absence status', async () => {
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
      caller.absence.updateStatus({
        id: mockAbsenceRequest.id,
        status: 'APPROVED',
      })
    ).rejects.toThrow()
  })
})
