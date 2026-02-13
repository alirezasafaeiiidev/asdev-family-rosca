/**
 * Draw API Route
 * POST /api/groups/[id]/draw - Perform draw for current cycle
 * 
 * MVP Rule: Each member can win at most once per group
 */

import { NextRequest } from 'next/server';
import { randomInt } from 'crypto';
import { db } from '@/lib/db';
import { getCurrentUser, isGroupAdmin } from '@/lib/auth';
import {
  successResponse,
  unauthorizedResponse,
  notFoundResponse,
  forbiddenResponse,
  serverErrorResponse,
  errorResponse,
  conflictResponse,
} from '@/lib/api-response';
import { auditLog } from '@/lib/audit';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/groups/[id]/draw
 * Perform a fair draw for the current open cycle
 * 
 * Constraints:
 * 1. Only one draw per cycle
 * 2. Each member can win at most once per group
 * 3. All contributions must be confirmed before draw
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return unauthorizedResponse();
    }

    const { id } = await params;
    const groupId = id;

    // Check admin permission
    const isAdmin = await isGroupAdmin(currentUser.id, groupId);
    if (!isAdmin) {
      return forbiddenResponse('Only group admins can perform draws');
    }

    // Get group with current cycle and members
    const group = await db.group.findUnique({
      where: { id: groupId },
      include: {
        members: {
          where: { status: 'ACTIVE' },
          include: { user: { select: { id: true, fullName: true, phone: true } } },
        },
        cycles: {
          where: { status: 'OPEN' },
          orderBy: { cycleNumber: 'asc' },
          take: 1,
          include: {
            contributions: true,
            draw: true,
          },
        },
      },
    });

    if (!group) {
      return notFoundResponse('Group');
    }

    // Check if there's an open cycle
    const currentCycle = group.cycles[0];
    if (!currentCycle) {
      return errorResponse('NO_OPEN_CYCLE', 'No open cycle found for this group', 400);
    }

    // Check if draw already exists for this cycle
    if (currentCycle.draw) {
      return conflictResponse('Draw already performed for this cycle');
    }

    // Get all confirmed contributions for this cycle
    const confirmedContributions = currentCycle.contributions.filter(
      (c) => c.status === 'CONFIRMED'
    );

    // Check if all members have contributed
    const contributorIds = new Set(confirmedContributions.map((c) => c.userId));
    const allContributed = group.members.every((m) => contributorIds.has(m.userId));
    if (!allContributed) {
      return errorResponse(
        'INCOMPLETE_CONTRIBUTIONS',
        'Not all members have confirmed contributions',
        400
      );
    }

    // Get all past winners in this group (MVP rule: each member wins once)
    const pastWinners = await db.draw.findMany({
      where: {
        cycle: { groupId },
      },
      select: { winnerId: true },
    });
    const pastWinnerIds = new Set(pastWinners.map((d) => d.winnerId));

    // Filter eligible members (haven't won yet)
    const eligibleMembers = group.members.filter((m) => !pastWinnerIds.has(m.userId));

    if (eligibleMembers.length === 0) {
      return errorResponse(
        'NO_ELIGIBLE_MEMBERS',
        'All members have already won in this group',
        400
      );
    }

    // Perform fair random draw
    const seedValue = `${Date.now()}-${randomInt(0, 1_000_000_000)}`;
    const winnerIndex = randomInt(0, eligibleMembers.length);
    const winner = eligibleMembers[winnerIndex];

    // Calculate payout amount
    const totalAmount = confirmedContributions.reduce(
      (sum, c) => sum + Number(c.amount),
      0
    );

    // Create draw and payout in transaction
    const result = await db.$transaction(async (tx) => {
      // Create draw record
      const draw = await tx.draw.create({
        data: {
          cycleId: currentCycle.id,
          winnerId: winner.userId,
          method: 'RANDOM',
          eligibleCount: eligibleMembers.length,
          seedValue,
        },
      });

      // Create payout record
      const payout = await tx.payout.create({
        data: {
          cycleId: currentCycle.id,
          receiverId: winner.userId,
          amount: BigInt(totalAmount),
          status: 'PENDING',
        },
      });

      // Close the current cycle
      await tx.cycle.update({
        where: { id: currentCycle.id },
        data: { status: 'CLOSED' },
      });

      await tx.membership.updateMany({
        where: {
          groupId,
          userId: winner.userId,
          status: 'ACTIVE',
        },
        data: {
          totalWon: {
            increment: BigInt(totalAmount),
          },
        },
      });

      // Create next cycle if not all cycles completed
      const completedCycles = await tx.cycle.count({
        where: { groupId, status: 'CLOSED' },
      });

      if (completedCycles < group.totalMembers) {
        await tx.cycle.create({
          data: {
            groupId,
            cycleNumber: currentCycle.cycleNumber + 1,
            dueDate: new Date(
              Date.now() + group.cycleDurationDays * 24 * 60 * 60 * 1000
            ),
            status: 'OPEN',
          },
        });
      } else {
        // All cycles completed, mark group as completed
        await tx.group.update({
          where: { id: groupId },
          data: { status: 'COMPLETED' },
        });
      }

      return { draw, payout };
    });

    // Audit logging
    await auditLog('Draw', result.draw.id, 'DRAW', {
      userId: currentUser.id,
      metadata: {
        cycleId: currentCycle.id,
        cycleNumber: currentCycle.cycleNumber,
        winnerId: winner.userId,
        winnerName: winner.user.fullName,
        amount: totalAmount,
        eligibleMembersCount: eligibleMembers.length,
        seedValue,
      },
    });

    await auditLog('Payout', result.payout.id, 'CREATE', {
      userId: currentUser.id,
      metadata: {
        cycleId: currentCycle.id,
        receiverId: winner.userId,
        amount: totalAmount,
      },
    });

    return successResponse({
      draw: {
        id: result.draw.id,
        cycleId: currentCycle.id,
        cycleNumber: currentCycle.cycleNumber,
        winner: winner.user,
        payoutAmount: totalAmount.toString(),
        eligibleMembersCount: eligibleMembers.length,
        seedValue,
      },
      message: `Draw completed successfully! Winner: ${winner.user.fullName}`,
    });
  } catch (error) {
    console.error('Draw error:', error);
    return serverErrorResponse('Failed to perform draw');
  }
}

/**
 * GET /api/groups/[id]/draw
 * Get draw history for a group
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return unauthorizedResponse();
    }

    const { id } = await params;
    const groupId = id;

    // Check membership
    const membership = await db.membership.findUnique({
      where: {
        groupId_userId: { groupId, userId: currentUser.id },
      },
    });

    if (!membership || membership.status !== 'ACTIVE') {
      return forbiddenResponse('Not a member of this group');
    }

    // Get all draws for the group
    const draws = await db.draw.findMany({
      where: {
        cycle: { groupId },
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        winner: {
          select: { id: true, fullName: true, phone: true },
        },
        cycle: {
          select: { id: true, cycleNumber: true },
        },
      },
    });

    // Get payouts for context
    const payouts = await db.payout.findMany({
      where: {
        cycle: { groupId },
      },
      select: {
        cycleId: true,
        amount: true,
        status: true,
      },
    });

    const payoutMap = new Map(
      payouts.map((p) => [p.cycleId, { amount: p.amount.toString(), status: p.status }])
    );

    return successResponse({
      draws: draws.map((d) => ({
        id: d.id,
        cycleNumber: d.cycle.cycleNumber,
        winner: d.winner,
        payout: payoutMap.get(d.cycleId) || null,
        createdAt: d.createdAt,
      })),
      totalDraws: draws.length,
    });
  } catch (error) {
    console.error('Get draws error:', error);
    return serverErrorResponse('Failed to fetch draws');
  }
}
