/**
 * Payouts API Routes
 * GET /api/payouts - List payouts
 * PATCH /api/payouts - Update payout status
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, isGroupAdmin } from '@/lib/auth';
import { payoutUpdateSchema, paginationSchema } from '@/lib/validations';
import {
  successResponse,
  validationErrorResponse,
  unauthorizedResponse,
  notFoundResponse,
  forbiddenResponse,
  errorResponse,
  serverErrorResponse,
} from '@/lib/api-response';
import { auditLog } from '@/lib/audit';

/**
 * GET /api/payouts
 * List payouts with filters
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
    const receiverId = searchParams.get('receiverId');

    const whereClause: Record<string, unknown> = {};
    if (status) whereClause.status = status;
    if (receiverId) whereClause.receiverId = receiverId;

    const [payouts, total] = await Promise.all([
      db.payout.findMany({
        where: {
          ...whereClause,
          OR: [
            { receiverId: currentUser.id },
            {
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
          ],
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          receiver: { select: { id: true, fullName: true, phone: true } },
          cycle: {
            include: {
              group: { select: { id: true, name: true } },
            },
          },
        },
      }),
      db.payout.count({
        where: {
          ...whereClause,
          OR: [
            { receiverId: currentUser.id },
            {
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
          ],
        },
      }),
    ]);

    return successResponse({
      payouts: payouts.map((p) => ({
        id: p.id,
        amount: p.amount.toString(),
        status: p.status,
        receiver: p.receiver,
        group: p.cycle.group,
        cycleNumber: p.cycle.cycleNumber,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get payouts error:', error);
    return serverErrorResponse('Failed to fetch payouts');
  }
}

/**
 * PATCH /api/payouts
 * Update payout status (admin only)
 */
export async function PATCH(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const { payoutId, ...updateData } = body;

    if (!payoutId) {
      return validationErrorResponse({ error: 'payoutId is required' });
    }

    const validation = payoutUpdateSchema.safeParse(updateData);
    if (!validation.success) {
      return validationErrorResponse(validation.error.flatten());
    }

    // Get payout
    const payout = await db.payout.findUnique({
      where: { id: payoutId },
      include: {
        cycle: { include: { group: true } },
      },
    });

    if (!payout) {
      return notFoundResponse('Payout');
    }

    // Check admin permission
    const isAdmin = await isGroupAdmin(currentUser.id, payout.cycle.groupId);
    if (!isAdmin) {
      return forbiddenResponse('Only group admins can update payouts');
    }

    const nextStatus = validation.data.status;
    const allowedTransitions: Record<string, string[]> = {
      PENDING: ['PROCESSING', 'COMPLETED', 'FAILED'],
      PROCESSING: ['COMPLETED', 'FAILED'],
      COMPLETED: [],
      FAILED: [],
    };
    const currentAllowed = allowedTransitions[payout.status] || [];

    if (nextStatus !== payout.status && !currentAllowed.includes(nextStatus)) {
      return errorResponse(
        'INVALID_STATUS',
        `Invalid status transition from ${payout.status} to ${nextStatus}`,
        400
      );
    }

    // Update payout
    const updated = await db.payout.update({
      where: { id: payoutId },
      data: {
        status: nextStatus,
        processedAt: nextStatus === 'COMPLETED' ? new Date() : payout.processedAt,
      },
    });

    await auditLog('Payout', payoutId, 'UPDATE', {
      userId: currentUser.id,
      metadata: {
        status: validation.data.status,
        receiverId: payout.receiverId,
        amount: payout.amount.toString(),
      },
    });

    return successResponse({
      payout: {
        ...updated,
        amount: updated.amount.toString(),
      },
    });
  } catch (error) {
    console.error('Update payout error:', error);
    return serverErrorResponse('Failed to update payout');
  }
}
