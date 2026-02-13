# Changelog

All notable changes to this project are documented in this file.

## 2026-02-13

### feat: complete phased security hardening and build reliability (`d760719`)

- Enforced server-side identity for contribution creation.
- Removed client-side privilege escalation paths in membership join.
- Restricted `/api/users` and entity-level `/api/audit` filtering with admin checks.
- Stopped OTP exposure in API/UI.
- Hardened financial flows:
  - cryptographic draw randomness with stored `seedValue`
  - payout status transition validation
  - cycle creation guard when open cycle exists
  - membership `totalPaid`/`totalWon` aggregation updates
- Upgraded build quality:
  - `typescript.ignoreBuildErrors: false`
  - `reactStrictMode: true`
  - `noImplicitAny: true`
- Added tests and test script (`bun test`) for validation and access policies.
- Added Prisma migration artifacts for schema integrity.

### chore: sync local sqlite db with hardened prisma schema (`fcb528b`)

- Applied schema updates to local `db/custom.db`.
- Verified indexes and `Session -> User` foreign key after sync.
