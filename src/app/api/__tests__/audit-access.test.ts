import { describe, expect, test } from 'bun:test';
import { canUseEntityAuditFilter } from '../audit/route';

describe('audit access policy', () => {
  test('entity-level filters require admin role', () => {
    expect(canUseEntityAuditFilter(false)).toBe(false);
    expect(canUseEntityAuditFilter(true)).toBe(true);
  });
});
