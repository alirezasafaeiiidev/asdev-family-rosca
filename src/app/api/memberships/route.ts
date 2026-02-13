/**
 * Memberships API Routes
 * POST /api/memberships - Join a group
 * GET /api/memberships - List user's memberships
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { membershipCreateSchema, paginationSchema } from '@/lib/validations';
import {
  successResponse,
  validationErrorResponse,
  unauthorizedResponse,
  notFoundResponse,
  serverErrorResponse,
  conflictResponse,
  errorResponse,
} from '@/lib/api-response';
import { auditLog } from '@/lib/audit';

export function resolveJoinRole(): 'MEMBER' {
  return 'MEMBER';
}

/**
 * GET /api/memberships
 * List current user's memberships
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
      limit: searchParams.get('limit') || 20,
    });

    if (!validation.success) {
      return validationErrorResponse(validation.error.flatten());
    }

    const { page, limit } = validation.data;
    const skip = (page - 1) * limit;

    const [memberships, total] = await Promise.all([
      db.membership.findMany({
        where: { userId: currentUser.id },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          group: {
            include: {
              owner: {
                select: { id: true, fullName: true },
              },
              _count: {
                select: { members: true },
              },
            },
          },
        },
      }),
      db.membership.count({
        where: { userId: currentUser.id },
      }),
    ]);

    return successResponse({
      memberships,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get memberships error:', error);
    return serverErrorResponse('Failed to fetch memberships');
  }
}

/**
 * POST /api/memberships
 * Join a group
 */
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const validation = membershipCreateSchema.safeParse(body);

    if (!validation.success) {
      return validationErrorResponse(validation.error.flatten());
    }

    const { groupId } = validation.data;

    // Check if group exists and is active
    const group = await db.group.findUnique({
      where: { id: groupId },
      select: {
        id: true,
        status: true,
        totalMembers: true,
      },
    });

    if (!group) {
      return notFoundResponse('Group');
    }

    if (group.status !== 'ACTIVE') {
      return errorResponse('GROUP_NOT_ACTIVE', 'This group is not accepting new members', 400);
    }

    const activeMemberCount = await db.membership.count({
      where: {
        groupId,
        status: 'ACTIVE',
      },
    });

    // Check if group is full (based on active members only)
    if (activeMemberCount >= group.totalMembers) {
      return errorResponse('GROUP_FULL', 'This group has reached its member limit', 400);
    }

    // Check if already a member
    const existingMembership = await db.membership.findUnique({
      where: {
        groupId_userId: { groupId, userId: currentUser.id },
      },
    });

    if (existingMembership) {
      if (existingMembership.status === 'ACTIVE') {
        return conflictResponse('Already a member of this group');
      }
      // Reactivate removed/paused membership
      await db.membership.update({
        where: { id: existingMembership.id },
        data: { status: 'ACTIVE' },
      });
      
      await auditLog('Membership', existingMembership.id, 'JOIN', {
        userId: currentUser.id,
        metadata: { action: 'REACTIVATED' },
      });

      return successResponse({ message: 'Membership reactivated' });
    }

    // Create new membership
    const membership = await db.membership.create({
      data: {
        groupId,
        userId: currentUser.id,
        role: resolveJoinRole(),
        status: 'ACTIVE',
      },
      include: {
        group: true,
        user: {
          select: { id: true, fullName: true, phone: true },
        },
      },
    });

    await auditLog('Membership', membership.id, 'JOIN', {
      userId: currentUser.id,
      metadata: { groupId, role: membership.role },
    });

    return successResponse({ membership }, 201);
  } catch (error) {
    console.error('Create membership error:', error);
    return serverErrorResponse('Failed to join group');
  }
}
