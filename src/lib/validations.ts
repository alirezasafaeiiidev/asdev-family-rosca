/**
 * Zod Validation Schemas for Family ROSCA Platform
 */

import { z } from 'zod';

// ============================================
// User Schemas
// ============================================

export const userCreateSchema = z.object({
  phone: z.string().min(10).max(20),
  fullName: z.string().min(2).max(100),
});

export const userUpdateSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
});

// ============================================
// Auth Schemas
// ============================================

export const otpRequestSchema = z.object({
  phone: z.string().min(10).max(20),
});

export const otpVerifySchema = z.object({
  phone: z.string().min(10).max(20),
  code: z.string().length(6, 'OTP must be 6 digits'),
});

// ============================================
// Group Schemas
// ============================================

export const groupCreateSchema = z.object({
  name: z.string().min(2).max(100),
  amountPerCycle: z.string().regex(/^\d+$/, 'Must be a valid number'),
  totalMembers: z.number().int().min(2).max(50),
});

export const groupUpdateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  amountPerCycle: z.string().regex(/^\d+$/, 'Must be a valid number').optional(),
  status: z.enum(['ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED']).optional(),
});

// ============================================
// Membership Schemas
// ============================================

export const membershipCreateSchema = z.object({
  groupId: z.string().uuid(),
});

export const membershipUpdateSchema = z.object({
  role: z.enum(['ADMIN', 'MEMBER']).optional(),
  status: z.enum(['ACTIVE', 'PAUSED', 'REMOVED']).optional(),
});

// ============================================
// Cycle Schemas
// ============================================

export const cycleCreateSchema = z.object({
  groupId: z.string().uuid(),
  cycleNumber: z.number().int().positive(),
  dueDate: z.string().datetime(),
});

export const cycleUpdateSchema = z.object({
  status: z.enum(['OPEN', 'CLOSED', 'CANCELLED']).optional(),
  dueDate: z.string().datetime().optional(),
});

// ============================================
// Contribution Schemas
// ============================================

export const contributionCreateSchema = z.object({
  cycleId: z.string().uuid(),
  amount: z.string().regex(/^\d+$/, 'Must be a valid number'),
  idempotencyKey: z.string().optional(),
});

export const contributionConfirmSchema = z.object({
  status: z.enum(['CONFIRMED', 'FAILED', 'CANCELLED']),
});

// ============================================
// Draw Schemas
// ============================================

export const drawCreateSchema = z.object({
  cycleId: z.string().uuid(),
});

// ============================================
// Payout Schemas
// ============================================

export const payoutCreateSchema = z.object({
  cycleId: z.string().uuid(),
  receiverId: z.string().uuid(),
  amount: z.string().regex(/^\d+$/, 'Must be a valid number'),
});

export const payoutUpdateSchema = z.object({
  status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED']),
});

// ============================================
// Query Schemas
// ============================================

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const groupIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const cycleIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const contributionIdParamSchema = z.object({
  id: z.string().uuid(),
});

// ============================================
// Type Exports
// ============================================

export type UserCreateInput = z.infer<typeof userCreateSchema>;
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;
export type OtpRequestInput = z.infer<typeof otpRequestSchema>;
export type OtpVerifyInput = z.infer<typeof otpVerifySchema>;
export type GroupCreateInput = z.infer<typeof groupCreateSchema>;
export type GroupUpdateInput = z.infer<typeof groupUpdateSchema>;
export type MembershipCreateInput = z.infer<typeof membershipCreateSchema>;
export type MembershipUpdateInput = z.infer<typeof membershipUpdateSchema>;
export type CycleCreateInput = z.infer<typeof cycleCreateSchema>;
export type CycleUpdateInput = z.infer<typeof cycleUpdateSchema>;
export type ContributionCreateInput = z.infer<typeof contributionCreateSchema>;
export type ContributionConfirmInput = z.infer<typeof contributionConfirmSchema>;
export type DrawCreateInput = z.infer<typeof drawCreateSchema>;
export type PayoutCreateInput = z.infer<typeof payoutCreateSchema>;
export type PayoutUpdateInput = z.infer<typeof payoutUpdateSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
