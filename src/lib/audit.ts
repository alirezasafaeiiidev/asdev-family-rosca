/**
 * Audit Logging Utility
 * Family ROSCA Platform
 */

import { db } from './db';

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'CONFIRM'
  | 'DRAW'
  | 'PAYOUT'
  | 'JOIN'
  | 'LEAVE'
  | 'LOGIN'
  | 'LOGOUT';

export type AuditEntity =
  | 'User'
  | 'Group'
  | 'Membership'
  | 'Cycle'
  | 'Contribution'
  | 'Draw'
  | 'Payout'
  | 'OTPCode'
  | 'Session';

interface AuditLogInput {
  entity: AuditEntity;
  entityId: string;
  action: AuditAction;
  userId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(input: AuditLogInput): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        entity: input.entity,
        entityId: input.entityId,
        action: input.action,
        userId: input.userId || null,
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
      },
    });
  } catch (error) {
    // Log error but don't throw - audit logging should not break the main flow
    console.error('Failed to create audit log:', error);
  }
}

/**
 * Create audit log with additional context
 */
export async function auditLog(
  entity: AuditEntity,
  entityId: string,
  action: AuditAction,
  options?: { userId?: string; metadata?: Record<string, unknown> }
): Promise<void> {
  return createAuditLog({
    entity,
    entityId,
    action,
    ...options,
  });
}

/**
 * Get audit logs for a specific entity
 */
export async function getEntityAuditLogs(
  entity: AuditEntity,
  entityId: string,
  options?: { limit?: number; offset?: number }
) {
  const limit = options?.limit ?? 50;
  const offset = options?.offset ?? 0;

  return db.auditLog.findMany({
    where: {
      entity,
      entityId,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
    skip: offset,
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          phone: true,
        },
      },
    },
  });
}

/**
 * Get all audit logs with pagination
 */
export async function getAllAuditLogs(options?: { limit?: number; offset?: number }) {
  const limit = options?.limit ?? 50;
  const offset = options?.offset ?? 0;

  return db.auditLog.findMany({
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
    skip: offset,
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          phone: true,
        },
      },
    },
  });
}
