import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { appRouter } from '../_app'
import { createInnerTRPCContext } from '../../trpc'
import { mockUsers } from '../../../lib/test-utils'
import { Decimal } from '@prisma/client/runtime/library'

// Mock Prisma Client
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
  feedback: {
    findMany: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
  absenceRequest: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
}

describe('user.getById', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return full user data for MANAGER viewing any user', async () => {
    const mockUser = {
      ...mockUsers.employee,
      salary: new Decimal(mockUsers.employee.salary),
      performanceRating: mockUsers.employee.performanceRating,
    }

    mockPrisma.user.findUnique.mockResolvedValue(mockUser)

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
    const result = await caller.user.getById({ id: mockUsers.employee.id })

    expect(result).toBeDefined()
    expect(result.salary).toBeDefined()
    expect(result.ssn).toBeDefined()
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: mockUsers.employee.id },
    })
  })

  it('should filter sensitive fields for COWORKER viewing other user', async () => {
    const mockUser = {
      ...mockUsers.employee,
      salary: new Decimal(mockUsers.employee.salary),
      performanceRating: mockUsers.employee.performanceRating,
    }

    mockPrisma.user.findUnique.mockResolvedValue(mockUser)

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
    const result = await caller.user.getById({ id: mockUsers.employee.id })

    expect(result).toBeDefined()
    expect(result.name).toBe(mockUsers.employee.name)
    expect(result.email).toBe(mockUsers.employee.email)
    // Sensitive fields should be filtered
    expect(result.salary).toBeUndefined()
    expect(result.ssn).toBeUndefined()
    expect(result.performanceRating).toBeUndefined()
  })

  it('should return full user data for user viewing their own profile', async () => {
    const mockUser = {
      ...mockUsers.employee,
      salary: new Decimal(mockUsers.employee.salary),
      performanceRating: mockUsers.employee.performanceRating,
    }

    mockPrisma.user.findUnique.mockResolvedValue(mockUser)

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
    const result = await caller.user.getById({ id: mockUsers.employee.id })

    expect(result).toBeDefined()
    expect(result.salary).toBeDefined()
    expect(result.ssn).toBeDefined()
  })
})

describe('user.update', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should allow user to update their own profile', async () => {
    const updateData = {
      name: 'Updated Name',
      title: 'Updated Title',
    }

    const mockUser = {
      ...mockUsers.employee,
      ...updateData,
      salary: new Decimal(mockUsers.employee.salary),
    }

    mockPrisma.user.findUnique.mockResolvedValue(mockUser)
    mockPrisma.user.update.mockResolvedValue(mockUser)

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
    const result = await caller.user.update({
      id: mockUsers.employee.id,
      ...updateData,
    })

    expect(result).toBeDefined()
    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: mockUsers.employee.id },
      data: updateData,
    })
  })

  it('should allow MANAGER to update any user profile', async () => {
    const updateData = {
      name: 'Updated Name',
      title: 'Updated Title',
    }

    const mockUser = {
      ...mockUsers.employee,
      ...updateData,
      salary: new Decimal(mockUsers.employee.salary),
    }

    mockPrisma.user.update.mockResolvedValue(mockUser)

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
    const result = await caller.user.update({
      id: mockUsers.employee.id,
      ...updateData,
    })

    expect(result).toBeDefined()
    expect(mockPrisma.user.update).toHaveBeenCalled()
  })

  it('should reject COWORKER updating another user profile', async () => {
    const updateData = {
      name: 'Updated Name',
      title: 'Updated Title',
    }

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
      caller.user.update({
        id: mockUsers.employee.id,
        ...updateData,
      })
    ).rejects.toThrow()
  })
})

describe('user.updateSensitive', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should allow MANAGER to update sensitive fields', async () => {
    const updateData = {
      salary: 110000,
      performanceRating: 5,
    }

    const mockUser = {
      ...mockUsers.employee,
      ...updateData,
      salary: new Decimal(updateData.salary),
    }

    mockPrisma.user.update.mockResolvedValue(mockUser)

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
    const result = await caller.user.updateSensitive({
      id: mockUsers.employee.id,
      ...updateData,
    })

    expect(result).toBeDefined()
    expect(mockPrisma.user.update).toHaveBeenCalled()
  })

  it('should reject EMPLOYEE updating sensitive fields', async () => {
    const updateData = {
      salary: 110000,
      performanceRating: 5,
    }

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
      caller.user.updateSensitive({
        id: mockUsers.employee.id,
        ...updateData,
      })
    ).rejects.toThrow()
  })
})
