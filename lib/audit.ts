/**
 * Audit Logging Service
 *
 * Provides comprehensive audit logging for compliance requirements:
 * - GDPR Article 32 (Security of processing)
 * - CCPA (California Consumer Privacy Act)
 * - SOC2 (Service Organization Control)
 *
 * All sensitive data access and modifications are logged for:
 * - Security incident investigation
 * - Compliance audits
 * - User activity tracking
 * - Forensic analysis
 */

import { prisma } from '@/server/db';
import { AuditAction, Prisma } from '@prisma/client';
import { logger } from './logger';

/**
 * Audit log entry input
 */
export interface AuditLogInput {
  action: AuditAction;
  entityType: 'USER' | 'FEEDBACK' | 'ABSENCE' | 'NOTIFICATION' | 'SYSTEM';
  entityId: string;
  userId: string;
  userEmail: string;
  userRole: string;
  ipAddress?: string;
  userAgent?: string;
  oldValue?: string;
  newValue?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Context for audit logging (typically from request)
 */
export interface AuditContext {
  userId: string;
  userEmail: string;
  userRole: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Create an audit log entry
 *
 * @param input - Audit log details
 * @returns Created audit log entry
 *
 * @example
 * ```typescript
 * await createAuditLog({
 *   action: 'VIEW_SENSITIVE_DATA',
 *   entityType: 'USER',
 *   entityId: userId,
 *   userId: requesterId,
 *   userEmail: requesterEmail,
 *   userRole: requesterRole,
 *   metadata: { fields: ['ssn', 'salary'] }
 * });
 * ```
 */
export async function createAuditLog(input: AuditLogInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        userId: input.userId,
        userEmail: input.userEmail,
        userRole: input.userRole,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        oldValue: input.oldValue,
        newValue: input.newValue,
        metadata: input.metadata as Prisma.InputJsonValue ?? Prisma.JsonNull,
      },
    });

    logger.debug(
      {
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        userId: input.userId,
      },
      'Audit log created'
    );
  } catch (error) {
    // Log error but don't throw - audit logging should not break the main flow
    logger.error(
      {
        error,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
      },
      'Failed to create audit log'
    );
  }
}

/**
 * Audit helper for viewing sensitive data
 */
export async function auditSensitiveDataView(
  context: AuditContext,
  entityId: string,
  fields: string[]
): Promise<void> {
  await createAuditLog({
    action: 'VIEW_SENSITIVE_DATA',
    entityType: 'USER',
    entityId,
    userId: context.userId,
    userEmail: context.userEmail,
    userRole: context.userRole,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    metadata: { viewedFields: fields },
  });
}

/**
 * Audit helper for modifying sensitive data
 */
export async function auditSensitiveDataUpdate(
  context: AuditContext,
  entityId: string,
  changes: { field: string; oldValue?: string; newValue?: string }[]
): Promise<void> {
  // Mask sensitive values before logging
  const maskedChanges = changes.map((change) => ({
    field: change.field,
    changed: true,
    // Don't log actual sensitive values, just that they changed
  }));

  await createAuditLog({
    action: 'UPDATE_SENSITIVE_DATA',
    entityType: 'USER',
    entityId,
    userId: context.userId,
    userEmail: context.userEmail,
    userRole: context.userRole,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    metadata: { changes: maskedChanges },
  });
}

/**
 * Audit helper for authentication events
 */
export async function auditAuthEvent(
  action: 'LOGIN_SUCCESS' | 'LOGIN_FAILURE' | 'LOGOUT' | 'SESSION_EXPIRED',
  userId: string,
  userEmail: string,
  ipAddress?: string,
  userAgent?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await createAuditLog({
    action,
    entityType: 'SYSTEM',
    entityId: userId,
    userId,
    userEmail,
    userRole: 'UNKNOWN', // Role may not be known at login time
    ipAddress,
    userAgent,
    metadata,
  });
}

/**
 * Audit helper for profile views
 */
export async function auditProfileView(
  context: AuditContext,
  viewedUserId: string,
  includedSensitive: boolean
): Promise<void> {
  await createAuditLog({
    action: includedSensitive ? 'VIEW_SENSITIVE_DATA' : 'VIEW_PROFILE',
    entityType: 'USER',
    entityId: viewedUserId,
    userId: context.userId,
    userEmail: context.userEmail,
    userRole: context.userRole,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    metadata: { includedSensitive },
  });
}

/**
 * Audit helper for user deletion
 */
export async function auditUserDeletion(
  context: AuditContext,
  deletedUserId: string,
  deletedUserEmail: string,
  isRestore: boolean = false
): Promise<void> {
  await createAuditLog({
    action: isRestore ? 'RESTORE_USER' : 'DELETE_USER',
    entityType: 'USER',
    entityId: deletedUserId,
    userId: context.userId,
    userEmail: context.userEmail,
    userRole: context.userRole,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    metadata: { affectedUserEmail: deletedUserEmail },
  });
}

/**
 * Audit helper for feedback operations
 */
export async function auditFeedbackOperation(
  context: AuditContext,
  action: 'CREATE_FEEDBACK' | 'VIEW_FEEDBACK' | 'DELETE_FEEDBACK' | 'UPDATE_FEEDBACK',
  feedbackId: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await createAuditLog({
    action,
    entityType: 'FEEDBACK',
    entityId: feedbackId,
    userId: context.userId,
    userEmail: context.userEmail,
    userRole: context.userRole,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    metadata,
  });
}

/**
 * Audit helper for absence operations
 */
export async function auditAbsenceOperation(
  context: AuditContext,
  action: 'CREATE_ABSENCE' | 'VIEW_ABSENCE' | 'DELETE_ABSENCE' | 'UPDATE_ABSENCE_STATUS',
  absenceId: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  await createAuditLog({
    action,
    entityType: 'ABSENCE',
    entityId: absenceId,
    userId: context.userId,
    userEmail: context.userEmail,
    userRole: context.userRole,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    metadata,
  });
}

/**
 * Query audit logs with filtering
 */
export interface AuditLogQuery {
  userId?: string;
  entityType?: string;
  entityId?: string;
  action?: AuditAction;
  startDate?: Date;
  endDate?: Date;
  skip?: number;
  take?: number;
}

export async function queryAuditLogs(query: AuditLogQuery) {
  const where: Record<string, unknown> = {};

  if (query.userId) where.userId = query.userId;
  if (query.entityType) where.entityType = query.entityType;
  if (query.entityId) where.entityId = query.entityId;
  if (query.action) where.action = query.action;

  if (query.startDate || query.endDate) {
    where.createdAt = {};
    if (query.startDate) (where.createdAt as Record<string, Date>).gte = query.startDate;
    if (query.endDate) (where.createdAt as Record<string, Date>).lte = query.endDate;
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: query.skip,
      take: query.take || 50,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { logs, total };
}

/**
 * Get audit trail for a specific entity
 */
export async function getEntityAuditTrail(
  entityType: string,
  entityId: string,
  options?: { skip?: number; take?: number }
) {
  return queryAuditLogs({
    entityType,
    entityId,
    skip: options?.skip,
    take: options?.take,
  });
}

/**
 * Get user activity log
 */
export async function getUserActivityLog(
  userId: string,
  options?: { skip?: number; take?: number; startDate?: Date; endDate?: Date }
) {
  return queryAuditLogs({
    userId,
    startDate: options?.startDate,
    endDate: options?.endDate,
    skip: options?.skip,
    take: options?.take,
  });
}
