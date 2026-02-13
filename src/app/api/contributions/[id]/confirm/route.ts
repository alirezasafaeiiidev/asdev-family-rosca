/**
 * Contribution Confirm API Route
 * PATCH /api/contributions/[id]/confirm - Confirm/reject contribution
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, isGroupAdmin } from '@/lib/auth';
import { contributionConfirmSchema } from '@/lib/validations';
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
 * PATCH /api/contributions/[id]/confirm
 * Confirm or reject a contribution (admin only)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return unauthorizedResponse();
    }

    const { id } = await params;
    const contributionId = id;

    const body = await request.json();
    const validation = contributionConfirmSchema.safeParse(body);

    if (!validation.success) {
      return validationErrorResponse(validation.error.flatten());
    }

    const { status } = validation.data;

    // Get contribution
    const contribution = await db.contribution.findUnique({
      where: { id: contributionId },
      include: {
        cycle: { include: { group: true } },
        user: { select: { id: true, fullName: true } },
      },
    });

    if (!contribution) {
      return notFoundResponse('Contribution');
    }

    // Check admin permission
    const isAdmin = await isGroupAdmin(currentUser.id, contribution.cycle.groupId);
    if (!isAdmin) {
      return forbiddenResponse('Only group admins can confirm contributions');
    }

    // Check if contribution is in PENDING status
    if (contribution.status !== 'PENDING') {
      return errorResponse(
        'INVALID_STATUS',
        `Cannot confirm contribution with status ${contribution.status}`,
        400
      );
    }

    // Update contribution
    const now = new Date();
    const updateData: { status: string; confirmedAt?: Date; paidAt?: Date } = { status };
    if (status === 'CONFIRMED') {
      updateData.confirmedAt = now;
      updateData.paidAt = now;
    }

    const updated = await db.$transaction(async (tx) => {
      const nextContribution = await tx.contribution.update({
        where: { id: contributionId },
        data: updateData,
      });

      if (status === 'CONFIRMED') {
        await tx.membership.updateMany({
          where: {
            groupId: contribution.cycle.groupId,
            userId: contribution.userId,
            status: 'ACTIVE',
          },
          data: {
            totalPaid: {
              increment: contribution.amount,
            },
          },
        });
      }

      return nextContribution;
    });

    await auditLog('Contribution', contributionId, 'CONFIRM', {
      userId: currentUser.id,
      metadata: {
        status,
        contributorId: contribution.userId,
        amount: contribution.amount.toString(),
      },
    });

    return successResponse({
      contribution: {
        ...updated,
        amount: updated.amount.toString(),
      },
    });
  } catch (error) {
    console.error('Confirm contribution error:', error);
    return serverErrorResponse('Failed to confirm contribution');
  }
}
