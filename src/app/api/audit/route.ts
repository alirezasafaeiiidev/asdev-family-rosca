/**
 * Audit Log API Routes
 * GET /api/audit - Get audit logs (admin only)
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, isSystemAdmin } from '@/lib/auth';
import { paginationSchema } from '@/lib/validations';
import {
  successResponse,
  validationErrorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  serverErrorResponse,
} from '@/lib/api-response';
import { getEntityAuditLogs, type AuditEntity } from '@/lib/audit';

export function canUseEntityAuditFilter(isAdmin: boolean): boolean {
  return isAdmin;
}

function isAuditEntity(entity: string): entity is AuditEntity {
  const allowedEntities: AuditEntity[] = [
    'User',
    'Group',
    'Membership',
    'Cycle',
    'Contribution',
    'Draw',
    'Payout',
    'OTPCode',
    'Session',
  ];
  return allowedEntities.includes(entity as AuditEntity);
}

/**
 * GET /api/audit
 * Get audit logs
 */
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(request.url);
    const validation = paginationSchema.safeParse({
      page: searchParams.get('page') || 1,
      limit: searchParams.get('limit') || 50,
    });

    if (!validation.success) {
      return validationErrorResponse(validation.error.flatten());
    }

    const { page, limit } = validation.data;
    const offset = (page - 1) * limit;

    const entity = searchParams.get('entity');
    const entityId = searchParams.get('entityId');
    const isAdmin = isSystemAdmin(currentUser);

    let logs;
    let total;

    if (entity && entityId) {
      if (!canUseEntityAuditFilter(isAdmin)) {
        return forbiddenResponse('Entity audit access requires admin role');
      }
      if (!isAuditEntity(entity)) {
        return validationErrorResponse({ entity: 'Invalid audit entity type' });
      }
      // Get logs for specific entity
      logs = await getEntityAuditLogs(entity, entityId, { limit, offset });
      total = logs.length;
    } else {
      // Get all logs (only show user's own activity)
      logs = await db.auditLog.findMany({
        where: {
          OR: [{ userId: currentUser.id }],
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          user: {
            select: { id: true, fullName: true, phone: true },
          },
        },
      });
      total = await db.auditLog.count({
        where: {
          OR: [{ userId: currentUser.id }],
        },
      });
    }

    return successResponse({
      logs: logs.map((log) => ({
        id: log.id,
        entity: log.entity,
        entityId: log.entityId,
        action: log.action,
        user: log.user,
        metadata: log.metadata ? JSON.parse(log.metadata) : null,
        createdAt: log.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    return serverErrorResponse('Failed to fetch audit logs');
  }
}
