/**
 * Contribution Detail API Routes
 * GET /api/contributions/[id] - Get contribution details
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
 * GET /api/contributions/[id]
 * Get contribution details
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return unauthorizedResponse();
    }

    const { id } = await params;
    const contributionId = id;

    const contribution = await db.contribution.findUnique({
      where: { id: contributionId },
      include: {
        user: { select: { id: true, fullName: true, phone: true } },
        cycle: {
          include: {
            group: {
              include: {
                members: { where: { status: 'ACTIVE' } },
              },
            },
          },
        },
      },
    });

    if (!contribution) {
      return notFoundResponse('Contribution');
    }

    // Check membership
    const isMember = contribution.cycle.group.members.some(
      (m) => m.userId === currentUser.id
    );
    if (!isMember) {
      return forbiddenResponse('Not a member of this group');
    }

    return successResponse({
      contribution: {
        ...contribution,
        amount: contribution.amount.toString(),
        cycle: {
          ...contribution.cycle,
          group: {
            id: contribution.cycle.group.id,
            name: contribution.cycle.group.name,
          },
        },
      },
    });
  } catch (error) {
    console.error('Get contribution error:', error);
    return serverErrorResponse('Failed to fetch contribution');
  }
}
