import { describe, expect, test } from 'bun:test';
import { isSystemAdmin } from '@/lib/auth';

describe('isSystemAdmin', () => {
  test('accepts ACTIVE ADMIN', () => {
    expect(isSystemAdmin({ role: 'ADMIN', status: 'ACTIVE' })).toBe(true);
  });

  test('accepts ACTIVE SUPER_ADMIN', () => {
    expect(isSystemAdmin({ role: 'SUPER_ADMIN', status: 'ACTIVE' })).toBe(true);
  });

  test('rejects inactive admin and regular users', () => {
    expect(isSystemAdmin({ role: 'ADMIN', status: 'SUSPENDED' })).toBe(false);
    expect(isSystemAdmin({ role: 'USER', status: 'ACTIVE' })).toBe(false);
    expect(isSystemAdmin(null)).toBe(false);
  });
});
