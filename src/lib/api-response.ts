/**
 * Standardized API Response Helpers
 * Family ROSCA Platform
 */

import { NextResponse } from 'next/server';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    timestamp: string;
    requestId?: string;
  };
}

export function successResponse<T>(data: T, status = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
      },
    },
    { status }
  );
}

export function errorResponse(
  code: string,
  message: string,
  status = 400,
  details?: unknown
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        details,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    },
    { status }
  );
}

export function notFoundResponse(entity: string): NextResponse<ApiResponse> {
  return errorResponse('NOT_FOUND', `${entity} not found`, 404);
}

export function validationErrorResponse(details: unknown): NextResponse<ApiResponse> {
  return errorResponse('VALIDATION_ERROR', 'Invalid request data', 400, details);
}

export function unauthorizedResponse(message = 'Unauthorized'): NextResponse<ApiResponse> {
  return errorResponse('UNAUTHORIZED', message, 401);
}

export function forbiddenResponse(message = 'Forbidden'): NextResponse<ApiResponse> {
  return errorResponse('FORBIDDEN', message, 403);
}

export function conflictResponse(message: string, details?: unknown): NextResponse<ApiResponse> {
  return errorResponse('CONFLICT', message, 409, details);
}

export function serverErrorResponse(message = 'Internal server error'): NextResponse<ApiResponse> {
  return errorResponse('SERVER_ERROR', message, 500);
}

// Error codes enum
export const ErrorCodes = {
  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_FIELD: 'MISSING_FIELD',
  
  // Authentication
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_OTP: 'INVALID_OTP',
  OTP_EXPIRED: 'OTP_EXPIRED',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  
  // Authorization
  FORBIDDEN: 'FORBIDDEN',
  NOT_OWNER: 'NOT_OWNER',
  NOT_MEMBER: 'NOT_MEMBER',
  
  // Resource
  NOT_FOUND: 'NOT_FOUND',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  GROUP_NOT_FOUND: 'GROUP_NOT_FOUND',
  CYCLE_NOT_FOUND: 'CYCLE_NOT_FOUND',
  
  // Business Logic
  CONFLICT: 'CONFLICT',
  ALREADY_MEMBER: 'ALREADY_MEMBER',
  ALREADY_DRAWN: 'ALREADY_DRAWN',
  ALREADY_WINNER: 'ALREADY_WINNER',
  GROUP_FULL: 'GROUP_FULL',
  INVALID_STATUS: 'INVALID_STATUS',
  
  // Server
  SERVER_ERROR: 'SERVER_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
} as const;
