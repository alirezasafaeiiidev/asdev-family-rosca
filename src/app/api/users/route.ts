/**
 * Users API Routes
 * GET /api/users - List users (admin)
 * POST /api/users - Create user manually
 */

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, isSystemAdmin } from '@/lib/auth';
import { userCreateSchema, paginationSchema } from '@/lib/validations';
import {
  successResponse,
  validationErrorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  serverErrorResponse,
} from '@/lib/api-response';
import { auditLog } from '@/lib/audit';

/**
 * GET /api/users
 * List all users with pagination
 */
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return unauthorizedResponse();
    }
    if (!isSystemAdmin(currentUser)) {
      return forbiddenResponse('Only admins can list users');
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

    const [users, total] = await Promise.all([
      db.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          phone: true,
          fullName: true,
          createdAt: true,
          _count: {
            select: { memberships: true },
          },
        },
      }),
      db.user.count(),
    ]);

    return successResponse({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
    return serverErrorResponse('Failed to fetch users');
  }
}

/**
 * PATCH /api/users
 * Update current user profile
 */
export async function PATCH(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const validation = userCreateSchema.partial().safeParse(body);

    if (!validation.success) {
      return validationErrorResponse(validation.error.flatten());
    }

    const updatedUser = await db.user.update({
      where: { id: currentUser.id },
      data: validation.data,
      select: {
        id: true,
        phone: true,
        fullName: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await auditLog('User', currentUser.id, 'UPDATE', {
      userId: currentUser.id,
      metadata: { updatedFields: Object.keys(validation.data) },
    });

    return successResponse({ user: updatedUser });
  } catch (error) {
    console.error('Update user error:', error);
    return serverErrorResponse('Failed to update user');
  }
}
