/**
 * Contributions API Routes
 * GET /api/contributions - List contributions
 * POST /api/contributions - Create contribution (with idempotency)
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, isGroupMember } from '@/lib/auth';
import { contributionCreateSchema, paginationSchema } from '@/lib/validations';
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

export function resolveContributionUserId(currentUserId: string): string {
  return currentUserId;
}

/**
 * GET /api/contributions
 * List contributions with filters
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
    const cycleId = searchParams.get('cycleId');
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');

    const whereClause: Record<string, unknown> = {};
    if (cycleId) whereClause.cycleId = cycleId;
    if (userId) whereClause.userId = userId;
    if (status) whereClause.status = status;

    const [contributions, total] = await Promise.all([
      db.contribution.findMany({
        where: {
          ...whereClause,
          cycle: {
            group: {
              members: {
                some: {
                  userId: currentUser.id,
                  status: 'ACTIVE',
                },
              },
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, fullName: true, phone: true } },
          cycle: {
            include: {
              group: { select: { id: true, name: true, amountPerCycle: true } },
            },
          },
        },
      }),
      db.contribution.count({
        where: {
          ...whereClause,
          cycle: {
            group: {
              members: {
                some: {
                  userId: currentUser.id,
                  status: 'ACTIVE',
                },
              },
            },
          },
        },
      }),
    ]);

    return successResponse({
      contributions: contributions.map((c) => ({
        ...c,
        amount: c.amount.toString(),
        cycle: {
          ...c.cycle,
          group: {
            ...c.cycle.group,
            amountPerCycle: c.cycle.group.amountPerCycle.toString(),
          },
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
    console.error('Get contributions error:', error);
    return serverErrorResponse('Failed to fetch contributions');
  }
}

/**
 * POST /api/contributions
 * Create a new contribution (supports idempotency)
 */
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const validation = contributionCreateSchema.safeParse(body);

    if (!validation.success) {
      return validationErrorResponse(validation.error.flatten());
    }

    const { cycleId, amount, idempotencyKey } = validation.data;
    const contributorUserId = resolveContributionUserId(currentUser.id);

    // Get cycle and group info
    const cycle = await db.cycle.findUnique({
      where: { id: cycleId },
      include: {
        group: {
          include: {
            members: { where: { status: 'ACTIVE' } },
          },
        },
      },
    });

    if (!cycle) {
      return notFoundResponse('Cycle');
    }

    // Check if cycle is open
    if (cycle.status !== 'OPEN') {
      return errorResponse('CYCLE_CLOSED', 'This cycle is not accepting contributions', 400);
    }

    // Check membership
    const isMember = await isGroupMember(contributorUserId, cycle.groupId);
    if (!isMember) {
      return errorResponse('NOT_MEMBER', 'User is not a member of this group', 403);
    }

    // Check for existing contribution (one per user per cycle)
    const existingContribution = await db.contribution.findFirst({
      where: { cycleId, userId: contributorUserId },
    });

    if (existingContribution) {
      // If idempotency key matches, return existing contribution
      if (idempotencyKey && existingContribution.idempotencyKey === idempotencyKey) {
        return successResponse({
          contribution: {
            ...existingContribution,
            amount: existingContribution.amount.toString(),
          },
          message: 'Contribution already exists (idempotent)',
        });
      }
      return conflictResponse('User already has a contribution for this cycle');
    }

    // Validate amount matches group's amount per cycle
    if (BigInt(amount) !== cycle.group.amountPerCycle) {
      return validationErrorResponse({
        error: `Amount must be ${cycle.group.amountPerCycle.toString()}`,
      });
    }

    // Create contribution
    const contribution = await db.contribution.create({
      data: {
        cycleId,
        userId: contributorUserId,
        amount: BigInt(amount),
        status: 'PENDING',
        idempotencyKey: idempotencyKey || null,
      },
      include: {
        user: { select: { id: true, fullName: true, phone: true } },
        cycle: {
          include: {
            group: { select: { id: true, name: true } },
          },
        },
      },
    });

    await auditLog('Contribution', contribution.id, 'CREATE', {
      userId: currentUser.id,
      metadata: { cycleId, amount, idempotencyKey },
    });

    return successResponse(
      {
        contribution: {
          ...contribution,
          amount: contribution.amount.toString(),
        },
      },
      201
    );
  } catch (error) {
    console.error('Create contribution error:', error);
    return serverErrorResponse('Failed to create contribution');
  }
}
