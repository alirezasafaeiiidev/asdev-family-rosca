/**
 * POST /api/auth/otp/verify
 * Verify OTP and create session
 */

import { NextRequest } from 'next/server';
import { verifyOtp, createSession, setSessionCookie } from '@/lib/auth';
import { otpVerifySchema } from '@/lib/validations';
import { db } from '@/lib/db';
import {
  successResponse,
  validationErrorResponse,
  errorResponse,
  serverErrorResponse,
} from '@/lib/api-response';
import { auditLog } from '@/lib/audit';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = otpVerifySchema.safeParse(body);

    if (!validation.success) {
      return validationErrorResponse(validation.error.flatten());
    }

    const { phone, code } = validation.data;

    // Verify OTP
    const result = await verifyOtp(phone, code);
    if (!result.success) {
      return errorResponse(result.error || 'INVALID_OTP', 'Invalid or expired OTP', 401);
    }

    // Find or create user
    let user = await db.user.findUnique({
      where: { phone },
    });

    const isNewUser = !user;

    if (!user) {
      // Create new user with placeholder name
      user = await db.user.create({
        data: {
          phone,
          fullName: `User_${phone.slice(-4)}`, // Placeholder name
        },
      });
      await auditLog('User', user.id, 'CREATE', {
        metadata: { source: 'OTP_REGISTRATION' },
      });
    }

    // Create session
    const token = await createSession(user.id);
    await setSessionCookie(token);

    // Audit log
    await auditLog('Session', user.id, 'LOGIN', {
      userId: user.id,
      metadata: { isNewUser },
    });

    return successResponse({
      message: 'Authentication successful',
      user: {
        id: user.id,
        phone: user.phone,
        fullName: user.fullName,
        isNewUser,
      },
    });
  } catch (error) {
    console.error('OTP verify error:', error);
    return serverErrorResponse('Failed to verify OTP');
  }
}
