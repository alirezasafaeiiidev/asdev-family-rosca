import { describe, expect, test } from 'bun:test';
import { resolveJoinRole } from '../memberships/route';

describe('membership role policy', () => {
  test('join endpoint always creates MEMBER role', () => {
    expect(resolveJoinRole()).toBe('MEMBER');
  });
});
