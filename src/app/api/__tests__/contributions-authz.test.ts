import { describe, expect, test } from 'bun:test';
import { resolveContributionUserId } from '../contributions/route';

describe('contributions authz policy', () => {
  test('always resolves actor to authenticated user id', () => {
    expect(resolveContributionUserId('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')).toBe(
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
    );
  });
});
