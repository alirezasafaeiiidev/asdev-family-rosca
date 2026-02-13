/**
 * Groups API Routes
 * GET /api/groups - List groups
 * POST /api/groups - Create new group
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { groupCreateSchema, paginationSchema } from '@/lib/validations';
import {
  successResponse,
  validationErrorResponse,
  unauthorizedResponse,
  serverErrorResponse,
} from '@/lib/api-response';
import { auditLog } from '@/lib/audit';

/**
 * GET /api/groups
 * List groups with pagination and filters
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
    const status = searchParams.get('status');

    const whereClause: Record<string, unknown> = {};
    if (status) {
      whereClause.status = status;
    }

    // Get groups where user is a member
    const [groups, total] = await Promise.all([
      db.group.findMany({
        where: {
          ...whereClause,
          members: {
            some: {
              userId: currentUser.id,
              status: 'ACTIVE',
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          owner: {
            select: { id: true, fullName: true, phone: true },
          },
          _count: {
            select: { members: true, cycles: true },
          },
        },
      }),
      db.group.count({
        where: {
          ...whereClause,
          members: {
            some: {
              userId: currentUser.id,
              status: 'ACTIVE',
            },
          },
        },
      }),
    ]);

    return successResponse({
      groups,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get groups error:', error);
    return serverErrorResponse('Failed to fetch groups');
  }
}

/**
 * POST /api/groups
 * Create a new ROSCA group
 */
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const validation = groupCreateSchema.safeParse(body);

    if (!validation.success) {
      return validationErrorResponse(validation.error.flatten());
    }

    const { name, amountPerCycle, totalMembers } = validation.data;

    // Create group and membership in a transaction
    const result = await db.$transaction(async (tx) => {
      // Create the group
      const group = await tx.group.create({
        data: {
          name,
          amountPerCycle: BigInt(amountPerCycle),
          totalMembers,
          ownerId: currentUser.id,
          status: 'ACTIVE',
        },
      });

      // Create owner's membership
      await tx.membership.create({
        data: {
          groupId: group.id,
          userId: currentUser.id,
          role: 'ADMIN',
          status: 'ACTIVE',
        },
      });

      // Create first cycle
      const firstCycle = await tx.cycle.create({
        data: {
          groupId: group.id,
          cycleNumber: 1,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          status: 'OPEN',
        },
      });

      return { group, firstCycle };
    });

    // Audit logging
    await auditLog('Group', result.group.id, 'CREATE', {
      userId: currentUser.id,
      metadata: { name, totalMembers, amountPerCycle },
    });

    await auditLog('Membership', result.group.id, 'JOIN', {
      userId: currentUser.id,
      metadata: { role: 'ADMIN' },
    });

    await auditLog('Cycle', result.firstCycle.id, 'CREATE', {
      userId: currentUser.id,
      metadata: { cycleNumber: 1 },
    });

    return successResponse(
      {
        group: {
          ...result.group,
          amountPerCycle: result.group.amountPerCycle.toString(),
        },
        firstCycle: result.firstCycle,
      },
      201
    );
  } catch (error) {
    console.error('Create group error:', error);
    return serverErrorResponse('Failed to create group');
  }
}
