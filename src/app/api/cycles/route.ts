/**
 * Cycles API Routes
 * GET /api/cycles - List cycles
 * POST /api/cycles - Create new cycle
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { cycleCreateSchema, paginationSchema } from '@/lib/validations';
import {
  successResponse,
  validationErrorResponse,
  unauthorizedResponse,
  notFoundResponse,
  forbiddenResponse,
  conflictResponse,
  serverErrorResponse,
} from '@/lib/api-response';
import { auditLog } from '@/lib/audit';

/**
 * GET /api/cycles
 * List cycles with optional group filter
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
    const groupId = searchParams.get('groupId');
    const status = searchParams.get('status');

    const whereClause: Record<string, unknown> = {};
    if (groupId) whereClause.groupId = groupId;
    if (status) whereClause.status = status;

    // Only show cycles from groups where user is a member
    const [cycles, total] = await Promise.all([
      db.cycle.findMany({
        where: {
          ...whereClause,
          group: {
            members: {
              some: {
                userId: currentUser.id,
                status: 'ACTIVE',
              },
            },
          },
        },
        skip,
        take: limit,
        orderBy: [{ groupId: 'asc' }, { cycleNumber: 'asc' }],
        include: {
          group: {
            select: { id: true, name: true, amountPerCycle: true },
          },
          _count: {
            select: { contributions: true },
          },
          draw: {
            include: {
              winner: {
                select: { id: true, fullName: true },
              },
            },
          },
        },
      }),
      db.cycle.count({
        where: {
          ...whereClause,
          group: {
            members: {
              some: {
                userId: currentUser.id,
                status: 'ACTIVE',
              },
            },
          },
        },
      }),
    ]);

    return successResponse({
      cycles: cycles.map((c) => ({
        ...c,
        group: {
          ...c.group,
          amountPerCycle: c.group.amountPerCycle.toString(),
        },
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get cycles error:', error);
    return serverErrorResponse('Failed to fetch cycles');
  }
}

/**
 * POST /api/cycles
 * Create a new cycle (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const validation = cycleCreateSchema.safeParse(body);

    if (!validation.success) {
      return validationErrorResponse(validation.error.flatten());
    }

    const { groupId, cycleNumber, dueDate } = validation.data;

    // Check if group exists
    const group = await db.group.findUnique({
      where: { id: groupId },
      include: {
        members: { where: { status: 'ACTIVE' } },
        cycles: { orderBy: { cycleNumber: 'desc' }, take: 1 },
      },
    });

    if (!group) {
      return notFoundResponse('Group');
    }

    // Check admin permission
    const isOwner = group.ownerId === currentUser.id;
    const membership = await db.membership.findUnique({
      where: { groupId_userId: { groupId, userId: currentUser.id } },
    });
    const isAdmin = membership?.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return forbiddenResponse('Only group admins can create cycles');
    }

    const openCycle = await db.cycle.findFirst({
      where: {
        groupId,
        status: 'OPEN',
      },
      select: { id: true },
    });
    if (openCycle) {
      return conflictResponse('Cannot create a new cycle while another cycle is open');
    }

    // Validate cycle number
    const nextCycleNumber = (group.cycles[0]?.cycleNumber || 0) + 1;
    if (cycleNumber !== nextCycleNumber) {
      return validationErrorResponse({
        error: `Next cycle number should be ${nextCycleNumber}`,
      });
    }

    // Max cycles = number of members
    if (cycleNumber > group.members.length) {
      return validationErrorResponse({
        error: 'Cycle number exceeds number of members',
      });
    }

    const cycle = await db.cycle.create({
      data: {
        groupId,
        cycleNumber,
        dueDate: new Date(dueDate),
        status: 'OPEN',
      },
    });

    await auditLog('Cycle', cycle.id, 'CREATE', {
      userId: currentUser.id,
      metadata: { cycleNumber, groupId },
    });

    return successResponse({ cycle }, 201);
  } catch (error) {
    console.error('Create cycle error:', error);
    return serverErrorResponse('Failed to create cycle');
  }
}
