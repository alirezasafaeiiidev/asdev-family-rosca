/**
 * Group Details API Routes
 * GET /api/groups/[id] - Get group details
 * PATCH /api/groups/[id] - Update group
 * DELETE /api/groups/[id] - Delete/cancel group
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, isGroupAdmin } from '@/lib/auth';
import { groupUpdateSchema, groupIdParamSchema } from '@/lib/validations';
import {
  successResponse,
  validationErrorResponse,
  unauthorizedResponse,
  notFoundResponse,
  forbiddenResponse,
  serverErrorResponse,
  errorResponse,
} from '@/lib/api-response';
import { auditLog } from '@/lib/audit';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/groups/[id]
 * Get detailed group information
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return unauthorizedResponse();
    }

    const { id } = await params;
    const groupId = id;

    // Get group with members and cycles
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
              select: {
                id: true,
                userId: true,
                amount: true,
                status: true,
              },
            },
            draw: {
              include: {
                winner: {
                  select: { id: true, fullName: true },
                },
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

    // Calculate statistics
    const totalCollected = group.cycles.reduce((sum, cycle) => {
      const confirmedContributions = cycle.contributions.filter(
        (c) => c.status === 'CONFIRMED'
      );
      return sum + confirmedContributions.reduce((s, c) => s + Number(c.amount), 0);
    }, 0);

    const currentCycle = group.cycles.find((c) => c.status === 'OPEN');
    const completedCycles = group.cycles.filter((c) => c.status === 'CLOSED').length;

    return successResponse({
      group: {
        ...group,
        amountPerCycle: group.amountPerCycle.toString(),
        statistics: {
          totalCollected: totalCollected.toString(),
          currentCycle: currentCycle?.cycleNumber || null,
          completedCycles,
          totalMembers: group.members.length,
          expectedMembers: group.totalMembers,
          isFull: group.members.length >= group.totalMembers,
        },
      },
    });
  } catch (error) {
    console.error('Get group error:', error);
    return serverErrorResponse('Failed to fetch group');
  }
}

/**
 * PATCH /api/groups/[id]
 * Update group settings (admin only)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return unauthorizedResponse();
    }

    const { id } = await params;
    const groupId = id;

    // Check admin access
    const isAdmin = await isGroupAdmin(currentUser.id, groupId);
    if (!isAdmin) {
      return forbiddenResponse('Only group admins can update settings');
    }

    const body = await request.json();
    const validation = groupUpdateSchema.safeParse(body);

    if (!validation.success) {
      return validationErrorResponse(validation.error.flatten());
    }

    const updateData: Record<string, unknown> = {};
    if (validation.data.name) updateData.name = validation.data.name;
    if (validation.data.amountPerCycle)
      updateData.amountPerCycle = BigInt(validation.data.amountPerCycle);
    if (validation.data.status) updateData.status = validation.data.status;

    const group = await db.group.update({
      where: { id: groupId },
      data: updateData,
    });

    await auditLog('Group', groupId, 'UPDATE', {
      userId: currentUser.id,
      metadata: { updatedFields: Object.keys(updateData) },
    });

    return successResponse({
      group: {
        ...group,
        amountPerCycle: group.amountPerCycle.toString(),
      },
    });
  } catch (error) {
    console.error('Update group error:', error);
    return serverErrorResponse('Failed to update group');
  }
}

/**
 * DELETE /api/groups/[id]
 * Cancel group (admin only)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return unauthorizedResponse();
    }

    const { id } = await params;
    const groupId = id;

    // Check if owner
    const group = await db.group.findUnique({
      where: { id: groupId },
      select: { ownerId: true },
    });

    if (!group) {
      return notFoundResponse('Group');
    }

    if (group.ownerId !== currentUser.id) {
      return forbiddenResponse('Only the group owner can cancel the group');
    }

    // Update status to cancelled
    await db.group.update({
      where: { id: groupId },
      data: { status: 'CANCELLED' },
    });

    await auditLog('Group', groupId, 'DELETE', {
      userId: currentUser.id,
      metadata: { action: 'CANCELLED' },
    });

    return successResponse({ message: 'Group cancelled successfully' });
  } catch (error) {
    console.error('Delete group error:', error);
    return serverErrorResponse('Failed to cancel group');
  }
}
