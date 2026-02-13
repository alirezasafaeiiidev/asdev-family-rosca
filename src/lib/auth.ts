/**
 * Authentication Utilities
 * Family ROSCA Platform - OTP-based phone authentication
 */

import { db } from './db';
import { randomInt } from 'crypto';
import { cookies } from 'next/headers';

// Session cookie name
const SESSION_COOKIE = 'rosca_session';

// OTP configuration
const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 5;
const SESSION_EXPIRY_DAYS = 7;

/**
 * Generate a random OTP code
 */
export function generateOtpCode(): string {
  let code = '';
  for (let i = 0; i < OTP_LENGTH; i++) {
    code += randomInt(0, 10).toString();
  }
  return code;
}

/**
 * Create and store OTP for a phone number
 */
export async function createOtp(phone: string): Promise<string> {
  // Invalidate existing unused OTPs for this phone
  await db.oTPCode.updateMany({
    where: {
      phone,
      used: false,
    },
    data: {
      used: true,
    },
  });

  const code = generateOtpCode();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await db.oTPCode.create({
    data: {
      phone,
      code,
      expiresAt,
    },
  });

  return code;
}

/**
 * Verify OTP code
 */
export async function verifyOtp(
  phone: string,
  code: string
): Promise<{ success: boolean; error?: string }> {
  const otpRecord = await db.oTPCode.findFirst({
    where: {
      phone,
      code,
      used: false,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (!otpRecord) {
    return { success: false, error: 'INVALID_OTP' };
  }

  if (otpRecord.expiresAt < new Date()) {
    return { success: false, error: 'OTP_EXPIRED' };
  }

  // Mark OTP as used
  await db.oTPCode.update({
    where: { id: otpRecord.id },
    data: { used: true },
  });

  return { success: true };
}

/**
 * Generate session token
 */
export function generateSessionToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 64; i++) {
    token += chars.charAt(randomInt(0, chars.length));
  }
  return token;
}

/**
 * Create a new session for user
 */
export async function createSession(userId: string): Promise<string> {
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  await db.session.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  });

  return token;
}

/**
 * Get current user from session
 */
export async function getCurrentUser(): Promise<{
  id: string;
  phone: string;
  fullName: string;
  role: string;
  status: string;
} | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  const session = await db.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) {
    return null;
  }

  return {
    id: session.user.id,
    phone: session.user.phone,
    fullName: session.user.fullName,
    role: session.user.role,
    status: session.user.status,
  };
}

/**
 * Get user ID from session (for API use)
 */
export async function getUserId(): Promise<string | null> {
  const user = await getCurrentUser();
  return user?.id ?? null;
}

/**
 * Require authentication - returns user ID or throws
 */
export async function requireAuth(): Promise<string> {
  const userId = await getUserId();
  if (!userId) {
    throw new Error('UNAUTHORIZED');
  }
  return userId;
}

/**
 * Check if user has system-level admin privileges
 */
export function isSystemAdmin(user: { role: string; status: string } | null): boolean {
  if (!user || user.status !== 'ACTIVE') {
    return false;
  }
  return user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
}

/**
 * Set session cookie
 */
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_EXPIRY_DAYS * 24 * 60 * 60,
    path: '/',
  });
}

/**
 * Clear session cookie
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

/**
 * Logout - invalidate session
 */
export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    await db.session.delete({ where: { token } }).catch(() => {});
  }

  await clearSessionCookie();
}

/**
 * Check if user is member of a group
 */
export async function isGroupMember(
  userId: string,
  groupId: string
): Promise<boolean> {
  const membership = await db.membership.findUnique({
    where: {
      groupId_userId: { groupId, userId },
    },
  });
  return membership?.status === 'ACTIVE';
}

/**
 * Check if user is admin/owner of a group
 */
export async function isGroupAdmin(
  userId: string,
  groupId: string
): Promise<boolean> {
  const group = await db.group.findUnique({
    where: { id: groupId },
    select: { ownerId: true },
  });

  if (group?.ownerId === userId) {
    return true;
  }

  const membership = await db.membership.findUnique({
    where: {
      groupId_userId: { groupId, userId },
    },
  });

  return membership?.role === 'ADMIN';
}
