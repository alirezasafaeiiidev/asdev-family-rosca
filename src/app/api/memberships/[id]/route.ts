/**
 * Membership Detail API Routes
 * PATCH /api/memberships/[id] - Update membership role/status
 * DELETE /api/memberships/[id] - Leave group
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, isGroupAdmin } from '@/lib/auth';
import { membershipUpdateSchema } from '@/lib/validations';
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
 * PATCH /api/memberships/[id]
 * Update membership (admin can change role/status)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return unauthorizedResponse();
    }

    const { id } = await params;
    const membershipId = id;

    const body = await request.json();
    const validation = membershipUpdateSchema.safeParse(body);

    if (!validation.success) {
      return validationErrorResponse(validation.error.flatten());
    }

    // Get membership
    const membership = await db.membership.findUnique({
      where: { id: membershipId },
      include: { group: true },
    });

    if (!membership) {
      return notFoundResponse('Membership');
    }

    // Check if user is admin of the group
    const isAdmin = await isGroupAdmin(currentUser.id, membership.groupId);
    if (!isAdmin && membership.userId !== currentUser.id) {
      return forbiddenResponse('Only group admins can update memberships');
    }

    const updateData: Record<string, unknown> = {};
    if (validation.data.role && isAdmin) updateData.role = validation.data.role;
    if (validation.data.status) updateData.status = validation.data.status;

    const updated = await db.membership.update({
      where: { id: membershipId },
      data: updateData,
    });

    await auditLog('Membership', membershipId, 'UPDATE', {
      userId: currentUser.id,
      metadata: { updatedFields: Object.keys(updateData) },
    });

    return successResponse({ membership: updated });
  } catch (error) {
    console.error('Update membership error:', error);
    return serverErrorResponse('Failed to update membership');
  }
}

/**
 * DELETE /api/memberships/[id]
 * Leave group or remove member
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return unauthorizedResponse();
    }

    const { id } = await params;
    const membershipId = id;

    const membership = await db.membership.findUnique({
      where: { id: membershipId },
      include: { group: true },
    });

    if (!membership) {
      return notFoundResponse('Membership');
    }

    // Check permissions
    const isAdmin = await isGroupAdmin(currentUser.id, membership.groupId);
    const isSelf = membership.userId === currentUser.id;

    if (!isAdmin && !isSelf) {
      return forbiddenResponse('Cannot remove other members');
    }

    // Cannot remove owner
    if (membership.group.ownerId === membership.userId) {
      return forbiddenResponse('Cannot remove the group owner');
    }

    // Update status to REMOVED instead of deleting
    await db.membership.update({
      where: { id: membershipId },
      data: { status: 'REMOVED' },
    });

    await auditLog('Membership', membershipId, 'LEAVE', {
      userId: currentUser.id,
      metadata: { action: isSelf ? 'SELF_LEAVE' : 'REMOVED_BY_ADMIN' },
    });

    return successResponse({ message: 'Left group successfully' });
  } catch (error) {
    console.error('Delete membership error:', error);
    return serverErrorResponse('Failed to leave group');
  }
}
