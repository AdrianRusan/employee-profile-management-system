/**
 * Integration Tests for Audit Logging
 *
 * Tests the audit logging service including:
 * - Creating audit log entries
 * - Helper functions for common operations
 * - Querying audit logs
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createAuditLog,
  auditSensitiveDataView,
  auditSensitiveDataUpdate,
  auditAuthEvent,
  auditProfileView,
  auditUserDeletion,
  auditFeedbackOperation,
  auditAbsenceOperation,
  queryAuditLogs,
  getEntityAuditTrail,
  getUserActivityLog,
} from '@/lib/audit';
import { Prisma } from '@prisma/client';

// Mock Prisma
vi.mock('@/server/db', () => ({
  prisma: {
    auditLog: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { prisma } from '@/server/db';

const mockContext = {
  userId: 'user-123',
  userEmail: 'user@example.com',
  userRole: 'MANAGER',
  ipAddress: '192.168.1.1',
  userAgent: 'Mozilla/5.0',
};

describe('Audit Logging', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createAuditLog', () => {
    it('should create an audit log entry', async () => {
      vi.mocked(prisma.auditLog.create).mockResolvedValue({
        id: 'audit-1',
        action: 'VIEW_PROFILE',
        entityType: 'USER',
        entityId: 'entity-123',
        userId: 'user-123',
        userEmail: 'user@example.com',
        userRole: 'MANAGER',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        oldValue: null,
        newValue: null,
        metadata: null,
        createdAt: new Date(),
      });

      await createAuditLog({
        action: 'VIEW_PROFILE',
        entityType: 'USER',
        entityId: 'entity-123',
        userId: 'user-123',
        userEmail: 'user@example.com',
        userRole: 'MANAGER',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      });

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'VIEW_PROFILE',
          entityType: 'USER',
          entityId: 'entity-123',
          userId: 'user-123',
          userEmail: 'user@example.com',
          userRole: 'MANAGER',
        }),
      });
    });

    it('should handle metadata', async () => {
      vi.mocked(prisma.auditLog.create).mockResolvedValue({
        id: 'audit-1',
        action: 'VIEW_SENSITIVE_DATA',
        entityType: 'USER',
        entityId: 'entity-123',
        userId: 'user-123',
        userEmail: 'user@example.com',
        userRole: 'MANAGER',
        ipAddress: null,
        userAgent: null,
        oldValue: null,
        newValue: null,
        metadata: { fields: ['ssn', 'salary'] },
        createdAt: new Date(),
      });

      await createAuditLog({
        action: 'VIEW_SENSITIVE_DATA',
        entityType: 'USER',
        entityId: 'entity-123',
        userId: 'user-123',
        userEmail: 'user@example.com',
        userRole: 'MANAGER',
        metadata: { fields: ['ssn', 'salary'] },
      });

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          metadata: { fields: ['ssn', 'salary'] },
        }),
      });
    });

    it('should not throw on database error', async () => {
      vi.mocked(prisma.auditLog.create).mockRejectedValue(new Error('DB error'));

      await expect(
        createAuditLog({
          action: 'VIEW_PROFILE',
          entityType: 'USER',
          entityId: 'entity-123',
          userId: 'user-123',
          userEmail: 'user@example.com',
          userRole: 'MANAGER',
        })
      ).resolves.not.toThrow();
    });
  });

  describe('auditSensitiveDataView', () => {
    it('should log sensitive data view with fields', async () => {
      vi.mocked(prisma.auditLog.create).mockResolvedValue({} as any);

      await auditSensitiveDataView(mockContext, 'user-456', ['ssn', 'salary']);

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'VIEW_SENSITIVE_DATA',
          entityType: 'USER',
          entityId: 'user-456',
          metadata: { viewedFields: ['ssn', 'salary'] },
        }),
      });
    });
  });

  describe('auditSensitiveDataUpdate', () => {
    it('should log sensitive data update with masked changes', async () => {
      vi.mocked(prisma.auditLog.create).mockResolvedValue({} as any);

      await auditSensitiveDataUpdate(mockContext, 'user-456', [
        { field: 'salary', oldValue: '50000', newValue: '60000' },
      ]);

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'UPDATE_SENSITIVE_DATA',
          entityType: 'USER',
          entityId: 'user-456',
          metadata: {
            changes: [{ field: 'salary', changed: true }],
          },
        }),
      });
    });
  });

  describe('auditAuthEvent', () => {
    it('should log login success', async () => {
      vi.mocked(prisma.auditLog.create).mockResolvedValue({} as any);

      await auditAuthEvent(
        'LOGIN_SUCCESS',
        'user-123',
        'user@example.com',
        '192.168.1.1',
        'Mozilla/5.0'
      );

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'LOGIN_SUCCESS',
          entityType: 'SYSTEM',
          entityId: 'user-123',
          userRole: 'UNKNOWN',
        }),
      });
    });

    it('should log login failure', async () => {
      vi.mocked(prisma.auditLog.create).mockResolvedValue({} as any);

      await auditAuthEvent(
        'LOGIN_FAILURE',
        'user-123',
        'user@example.com',
        '192.168.1.1'
      );

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'LOGIN_FAILURE',
        }),
      });
    });
  });

  describe('auditProfileView', () => {
    it('should log profile view without sensitive data', async () => {
      vi.mocked(prisma.auditLog.create).mockResolvedValue({} as any);

      await auditProfileView(mockContext, 'user-456', false);

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'VIEW_PROFILE',
          entityId: 'user-456',
          metadata: { includedSensitive: false },
        }),
      });
    });

    it('should log profile view with sensitive data', async () => {
      vi.mocked(prisma.auditLog.create).mockResolvedValue({} as any);

      await auditProfileView(mockContext, 'user-456', true);

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'VIEW_SENSITIVE_DATA',
          metadata: { includedSensitive: true },
        }),
      });
    });
  });

  describe('auditUserDeletion', () => {
    it('should log user deletion', async () => {
      vi.mocked(prisma.auditLog.create).mockResolvedValue({} as any);

      await auditUserDeletion(mockContext, 'user-456', 'deleted@example.com', false);

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'DELETE_USER',
          entityId: 'user-456',
          metadata: { affectedUserEmail: 'deleted@example.com' },
        }),
      });
    });

    it('should log user restoration', async () => {
      vi.mocked(prisma.auditLog.create).mockResolvedValue({} as any);

      await auditUserDeletion(mockContext, 'user-456', 'restored@example.com', true);

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'RESTORE_USER',
        }),
      });
    });
  });

  describe('auditFeedbackOperation', () => {
    it('should log feedback creation', async () => {
      vi.mocked(prisma.auditLog.create).mockResolvedValue({} as any);

      await auditFeedbackOperation(mockContext, 'CREATE_FEEDBACK', 'feedback-123', {
        receiverId: 'user-456',
      });

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'CREATE_FEEDBACK',
          entityType: 'FEEDBACK',
          entityId: 'feedback-123',
          metadata: { receiverId: 'user-456' },
        }),
      });
    });
  });

  describe('auditAbsenceOperation', () => {
    it('should log absence status update', async () => {
      vi.mocked(prisma.auditLog.create).mockResolvedValue({} as any);

      await auditAbsenceOperation(mockContext, 'UPDATE_ABSENCE_STATUS', 'absence-123', {
        oldStatus: 'PENDING',
        newStatus: 'APPROVED',
      });

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'UPDATE_ABSENCE_STATUS',
          entityType: 'ABSENCE',
          entityId: 'absence-123',
        }),
      });
    });
  });

  describe('queryAuditLogs', () => {
    it('should query logs with filters', async () => {
      const mockLogs = [
        { id: 'audit-1', action: 'VIEW_PROFILE', createdAt: new Date() },
      ];
      vi.mocked(prisma.auditLog.findMany).mockResolvedValue(mockLogs as any);
      vi.mocked(prisma.auditLog.count).mockResolvedValue(1);

      const result = await queryAuditLogs({
        userId: 'user-123',
        entityType: 'USER',
        take: 10,
      });

      expect(result.logs).toEqual(mockLogs);
      expect(result.total).toBe(1);
    });

    it('should support date range filtering', async () => {
      vi.mocked(prisma.auditLog.findMany).mockResolvedValue([]);
      vi.mocked(prisma.auditLog.count).mockResolvedValue(0);

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      await queryAuditLogs({ startDate, endDate });

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: { gte: startDate, lte: endDate },
          }),
        })
      );
    });
  });

  describe('getEntityAuditTrail', () => {
    it('should get audit trail for entity', async () => {
      vi.mocked(prisma.auditLog.findMany).mockResolvedValue([]);
      vi.mocked(prisma.auditLog.count).mockResolvedValue(0);

      await getEntityAuditTrail('USER', 'user-123', { take: 20 });

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            entityType: 'USER',
            entityId: 'user-123',
          }),
        })
      );
    });
  });

  describe('getUserActivityLog', () => {
    it('should get activity log for user', async () => {
      vi.mocked(prisma.auditLog.findMany).mockResolvedValue([]);
      vi.mocked(prisma.auditLog.count).mockResolvedValue(0);

      await getUserActivityLog('user-123', { take: 50 });

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'user-123',
          }),
        })
      );
    });
  });
});
