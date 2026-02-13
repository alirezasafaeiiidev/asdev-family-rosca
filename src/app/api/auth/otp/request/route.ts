/**
 * POST /api/auth/otp/request
 * Request OTP code for phone number
 */

import { NextRequest } from 'next/server';
import { createOtp } from '@/lib/auth';
import { otpRequestSchema } from '@/lib/validations';
import { successResponse, validationErrorResponse, serverErrorResponse } from '@/lib/api-response';
import { auditLog } from '@/lib/audit';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = otpRequestSchema.safeParse(body);

    if (!validation.success) {
      return validationErrorResponse(validation.error.flatten());
    }

    const { phone } = validation.data;

    // Generate and store OTP
    await createOtp(phone);

    // Audit log
    await auditLog('OTPCode', phone, 'CREATE', {
      metadata: { action: 'OTP_REQUESTED' },
    });

    return successResponse({
      message: 'OTP sent successfully',
      phone,
    });
  } catch (error) {
    console.error('OTP request error:', error);
    return serverErrorResponse('Failed to send OTP');
  }
}
