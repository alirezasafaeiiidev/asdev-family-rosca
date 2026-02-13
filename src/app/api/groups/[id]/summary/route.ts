/**
 * Group Summary API Route
 * GET /api/groups/[id]/summary - Get comprehensive group summary
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import {
  successResponse,
  unauthorizedResponse,
  notFoundResponse,
  forbiddenResponse,
  serverErrorResponse,
} from '@/lib/api-response';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/groups/[id]/summary
 * Get comprehensive group summary with all statistics
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return unauthorizedResponse();
    }

    const { id } = await params;
    const groupId = id;

    // Get group with all related data
    const group = await db.group.findUnique({
      where: { id: groupId },
      include: {
        owner: {
          select: { id: true, fullName: true, phone: true },
        },
        members: {
          where: { status: 'ACTIVE' },
          include: {
            user: {
              select: { id: true, fullName: true, phone: true },
            },
          },
        },
        cycles: {
          orderBy: { cycleNumber: 'asc' },
          include: {
            contributions: {
              where: { status: 'CONFIRMED' },
            },
            draw: {
              include: {
                winner: { select: { id: true, fullName: true } },
              },
            },
            payout: {
              include: {
                receiver: { select: { id: true, fullName: true } },
              },
            },
          },
        },
      },
    });

    if (!group) {
      return notFoundResponse('Group');
    }

    // Check membership
    const isMember = group.members.some((m) => m.userId === currentUser.id);
    if (!isMember) {
      return forbiddenResponse('Not a member of this group');
    }

    // Calculate comprehensive statistics
    const totalCycles = group.cycles.length;
    const completedCycles = group.cycles.filter((c) => c.status === 'CLOSED').length;
    const currentCycle = group.cycles.find((c) => c.status === 'OPEN');

    // Total amount collected
    const totalCollected = group.cycles.reduce((sum, cycle) => {
      return sum + cycle.contributions.reduce((s, c) => s + Number(c.amount), 0);
    }, 0);

    // Total payouts
    const totalPayouts = group.cycles.reduce(
      (sum, cycle) => sum + Number(cycle.payout?.amount || 0),
      0
    );

    // Members who have won
    const winners = group.cycles
      .filter((c) => c.draw)
      .map((c) => ({
        cycleNumber: c.cycleNumber,
        winner: c.draw?.winner,
        amount: c.payout?.amount.toString(),
        payoutStatus: c.payout?.status,
      }));

    // Members who haven't won yet
    const winnerIds = new Set(winners.map((w) => w.winner?.id));
    const pendingWinners = group.members
      .filter((m) => !winnerIds.has(m.userId))
      .map((m) => ({
        id: m.user.id,
        fullName: m.user.fullName,
        phone: m.user.phone,
      }));

    // Member contribution summary
    const memberSummary = group.members.map((m) => {
      const userContributions = group.cycles.flatMap((c) =>
        c.contributions.filter((contrib) => contrib.userId === m.userId)
      );
      const totalContributed = userContributions.reduce((s, c) => s + Number(c.amount), 0);
      const hasWon = winnerIds.has(m.userId);
      const winCycle = winners.find((w) => w.winner?.id === m.userId);

      return {
        id: m.user.id,
        fullName: m.user.fullName,
        phone: m.user.phone,
        role: m.role,
        totalContributed: totalContributed.toString(),
        contributionCount: userContributions.length,
        hasWon,
        wonAt: hasWon ? winCycle?.cycleNumber : null,
        winAmount: hasWon ? winCycle?.amount : null,
      };
    });

    // Cycle progress
    const cycleProgress = group.cycles.map((c) => {
      const confirmedCount = c.contributions.length;
      const expectedCount = group.members.length;
      const progressPercent =
        expectedCount > 0 ? ((confirmedCount / expectedCount) * 100).toFixed(0) : '0';

      return {
        cycleNumber: c.cycleNumber,
        status: c.status,
        dueDate: c.dueDate,
        confirmedContributions: confirmedCount,
        expectedContributions: expectedCount,
        progressPercent,
        winner: c.draw?.winner || null,
      };
    });

    return successResponse({
      group: {
        id: group.id,
        name: group.name,
        status: group.status,
        owner: group.owner,
        amountPerCycle: group.amountPerCycle.toString(),
        totalMembers: group.members.length,
        expectedMembers: group.totalMembers,
        isFull: group.members.length >= group.totalMembers,
        createdAt: group.createdAt,
      },
      statistics: {
        totalCycles,
        completedCycles,
        currentCycleNumber: currentCycle?.cycleNumber || null,
        totalCollected: totalCollected.toString(),
        totalPayouts: totalPayouts.toString(),
        completionPercent:
          totalCycles > 0 ? ((completedCycles / totalCycles) * 100).toFixed(0) : '0',
      },
      winners: winners.map((w) => ({
        cycleNumber: w.cycleNumber,
        winner: w.winner,
        amount: w.amount,
        payoutStatus: w.payoutStatus,
      })),
      pendingWinners,
      memberSummary,
      cycleProgress,
    });
  } catch (error) {
    console.error('Get summary error:', error);
    return serverErrorResponse('Failed to fetch group summary');
  }
}
