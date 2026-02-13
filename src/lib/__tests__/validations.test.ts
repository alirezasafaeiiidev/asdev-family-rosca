import { describe, expect, test } from 'bun:test';
import { contributionCreateSchema, membershipCreateSchema } from '@/lib/validations';

describe('validation hardening', () => {
  test('contribution payload ignores client-supplied userId', () => {
    const parsed = contributionCreateSchema.parse({
      cycleId: '11111111-1111-4111-8111-111111111111',
      amount: '250000',
      userId: '22222222-2222-4222-8222-222222222222',
    });

    expect(parsed).toEqual({
      cycleId: '11111111-1111-4111-8111-111111111111',
      amount: '250000',
    });
    expect('userId' in parsed).toBe(false);
  });

  test('membership payload ignores role and userId escalation fields', () => {
    const parsed = membershipCreateSchema.parse({
      groupId: '33333333-3333-4333-8333-333333333333',
      role: 'ADMIN',
      userId: '44444444-4444-4444-8444-444444444444',
    });

    expect(parsed).toEqual({
      groupId: '33333333-3333-4333-8333-333333333333',
    });
    expect('role' in parsed).toBe(false);
    expect('userId' in parsed).toBe(false);
  });
});
