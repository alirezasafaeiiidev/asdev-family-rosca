/**
 * Cycle Detail API Routes
 * GET /api/cycles/[id] - Get cycle details
 * PATCH /api/cycles/[id] - Update cycle status
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, isGroupAdmin } from '@/lib/auth';
import { cycleUpdateSchema } from '@/lib/validations';
import {
  successResponse,
  validationErrorResponse,
  unauthorizedResponse,
  notFoundResponse,
  forbiddenResponse,
  serverErrorResponse,
} from '@/lib/api-response';
import { auditLog } from '@/lib/audit';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/cycles/[id]
 * Get detailed cycle information
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return unauthorizedResponse();
    }

    const { id } = await params;
    const cycleId = id;

    const cycle = await db.cycle.findUnique({
      where: { id: cycleId },
      include: {
        group: {
          include: {
            owner: { select: { id: true, fullName: true } },
            members: {
              where: { status: 'ACTIVE' },
              include: { user: { select: { id: true, fullName: true, phone: true } } },
            },
          },
        },
        contributions: {
          include: {
            user: { select: { id: true, fullName: true, phone: true } },
          },
        },
        draw: {
          include: {
            winner: { select: { id: true, fullName: true, phone: true } },
          },
        },
        payout: true,
      },
    });

    if (!cycle) {
      return notFoundResponse('Cycle');
    }

    // Check membership
    const isMember = cycle.group.members.some((m) => m.userId === currentUser.id);
    if (!isMember) {
      return forbiddenResponse('Not a member of this group');
    }

    // Calculate contribution statistics
    const totalExpected = Number(cycle.group.amountPerCycle) * cycle.group.members.length;
    const confirmedContributions = cycle.contributions.filter((c) => c.status === 'CONFIRMED');
    const totalCollected = confirmedContributions.reduce((sum, c) => sum + Number(c.amount), 0);
    const contributionRate =
      cycle.group.members.length > 0
        ? (confirmedContributions.length / cycle.group.members.length) * 100
        : 0;

    // Check who hasn't contributed
    const contributorIds = new Set(cycle.contributions.map((c) => c.userId));
    const nonContributors = cycle.group.members.filter((m) => !contributorIds.has(m.userId));

    return successResponse({
      cycle: {
        ...cycle,
        group: {
          ...cycle.group,
          amountPerCycle: cycle.group.amountPerCycle.toString(),
        },
        contributions: cycle.contributions.map((c) => ({
          ...c,
          amount: c.amount.toString(),
        })),
        payout: cycle.payout
          ? {
              ...cycle.payout,
              amount: cycle.payout.amount.toString(),
            }
          : null,
        statistics: {
          totalExpected: totalExpected.toString(),
          totalCollected: totalCollected.toString(),
          contributionRate: contributionRate.toFixed(2),
          contributorsCount: confirmedContributions.length,
          expectedCount: cycle.group.members.length,
          nonContributors: nonContributors.map((m) => ({
            id: m.user.id,
            fullName: m.user.fullName,
          })),
        },
      },
    });
  } catch (error) {
    console.error('Get cycle error:', error);
    return serverErrorResponse('Failed to fetch cycle');
  }
}

/**
 * PATCH /api/cycles/[id]
 * Update cycle status (admin only)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return unauthorizedResponse();
    }

    const { id } = await params;
    const cycleId = id;

    const cycle = await db.cycle.findUnique({
      where: { id: cycleId },
      include: { group: true },
    });

    if (!cycle) {
      return notFoundResponse('Cycle');
    }

    // Check admin permission
    const isAdmin = await isGroupAdmin(currentUser.id, cycle.groupId);
    if (!isAdmin) {
      return forbiddenResponse('Only group admins can update cycles');
    }

    const body = await request.json();
    const validation = cycleUpdateSchema.safeParse(body);

    if (!validation.success) {
      return validationErrorResponse(validation.error.flatten());
    }

    const updateData: Record<string, unknown> = {};
    if (validation.data.status) updateData.status = validation.data.status;
    if (validation.data.dueDate) updateData.dueDate = new Date(validation.data.dueDate);

    const updated = await db.cycle.update({
      where: { id: cycleId },
      data: updateData,
    });

    await auditLog('Cycle', cycleId, 'UPDATE', {
      userId: currentUser.id,
      metadata: { updatedFields: Object.keys(updateData) },
    });

    return successResponse({ cycle: updated });
  } catch (error) {
    console.error('Update cycle error:', error);
    return serverErrorResponse('Failed to update cycle');
  }
}
