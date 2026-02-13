# Family ROSCA Platform

A **non-custodial** Rotating Savings and Credit Association (ROSCA) platform for families, friends, and neighborhoods.

> **The system does not replace trust. It structures and documents trust.**

## 🏠 Overview

This platform enables groups to manage savings circles (known as ROSCAs, chit funds, tandas, or arisan in various cultures) where:

- Members contribute a fixed amount each cycle
- One member receives the total pool each cycle (via fair random draw)
- Each member wins exactly once per group

### Key Features

- ✅ Phone-based OTP authentication
- ✅ Group management with member roles
- ✅ Cycle-based contributions
- ✅ Fair random draw with constraints
- ✅ Payout tracking
- ✅ Complete audit logging
- ✅ Idempotent contribution creation
- ✅ One winner per member (MVP rule)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Bun (or npm/yarn)
- SQLite (included)

### Installation

```bash
# Install dependencies
bun install

# Create local environment
cp .env.example .env

# Push database schema
bun run db:push

# Start development server
bun run dev
```

The application will be available at `http://localhost:3000`

### Security Defaults

- OTP value is not returned from the OTP request API.
- Contribution creation always uses the authenticated session user.
- Membership join always creates `MEMBER` role (no client-side privilege escalation).
- Entity-level audit filters require system admin role.

### Migration (Schema Hardening)

```bash
# Optional backup
cp db/custom.db db/custom.db.bak

# Apply latest schema (adds unique/index/fk hardening)
DATABASE_URL='file:../db/custom.db' bunx prisma db push --accept-data-loss
```

## 📡 API Endpoints

### Authentication

#### POST `/api/auth/otp/request`
Request an OTP code for phone authentication.

**Request:**
```json
{
  "phone": "09123456789"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "OTP sent successfully",
    "phone": "09123456789"
  }
}
```

#### POST `/api/auth/otp/verify`
Verify OTP and create session.

**Request:**
```json
{
  "phone": "09123456789",
  "code": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Authentication successful",
    "user": {
      "id": "uuid",
      "phone": "09123456789",
      "fullName": "User_6789",
      "isNewUser": true
    }
  }
}
```

#### GET `/api/auth/me`
Get current authenticated user.

#### POST `/api/auth/logout`
Logout and clear session.

---

### Groups

#### GET `/api/groups`
List groups where the user is a member.

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)
- `status` - Filter by status (ACTIVE, PAUSED, COMPLETED, CANCELLED)

#### POST `/api/groups`
Create a new ROSCA group.

**Request:**
```json
{
  "name": "Family Savings Circle",
  "amountPerCycle": "1000000",
  "totalMembers": 5
}
```

#### GET `/api/groups/[id]`
Get detailed group information including members, cycles, and statistics.

#### PATCH `/api/groups/[id]`
Update group settings (admin only).

**Request:**
```json
{
  "name": "Updated Name",
  "status": "ACTIVE"
}
```

#### DELETE `/api/groups/[id]`
Cancel group (owner only).

---

### Memberships

#### GET `/api/memberships`
List user's memberships.

#### POST `/api/memberships`
Join a group.

**Request:**
```json
{
  "groupId": "uuid"
}
```

#### PATCH `/api/memberships/[id]`
Update membership (admin can change role/status).

#### DELETE `/api/memberships/[id]`
Leave group.

---

### Cycles

#### GET `/api/cycles`
List cycles with optional filters.

**Query Parameters:**
- `page`, `limit` - Pagination
- `groupId` - Filter by group
- `status` - Filter by status (OPEN, CLOSED, CANCELLED)

#### POST `/api/cycles`
Create a new cycle (admin only).

**Request:**
```json
{
  "groupId": "uuid",
  "cycleNumber": 2,
  "dueDate": "2025-03-15T00:00:00Z"
}
```

#### GET `/api/cycles/[id]`
Get detailed cycle information with contribution statistics.

#### PATCH `/api/cycles/[id]`
Update cycle status (admin only).

---

### Contributions

#### GET `/api/contributions`
List contributions with filters.

**Query Parameters:**
- `page`, `limit` - Pagination
- `cycleId` - Filter by cycle
- `userId` - Filter by user
- `status` - Filter by status (PENDING, CONFIRMED, FAILED, CANCELLED)

#### POST `/api/contributions`
Create a contribution (supports idempotency).

**Request:**
```json
{
  "cycleId": "uuid",
  "amount": "1000000",
  "idempotencyKey": "unique-key-optional"
}
```

#### GET `/api/contributions/[id]`
Get contribution details.

#### PATCH `/api/contributions/[id]/confirm`
Confirm or reject a contribution (admin only).

**Request:**
```json
{
  "status": "CONFIRMED"
}
```

---

### Draws

#### POST `/api/groups/[id]/draw`
Perform a fair random draw for the current cycle.

**Constraints:**
- All members must have confirmed contributions
- Each member can win only once per group
- Only one draw per cycle

**Response:**
```json
{
  "success": true,
  "data": {
    "draw": {
      "id": "uuid",
      "cycleNumber": 1,
      "winner": {
        "id": "uuid",
        "fullName": "John Doe"
      },
      "payoutAmount": "5000000",
      "eligibleMembersCount": 5,
      "seedValue": "1739460692123-12832193"
    },
    "message": "Draw completed successfully! Winner: John Doe"
  }
}
```

#### GET `/api/groups/[id]/draw`
Get draw history for a group.

---

### Payouts

#### GET `/api/payouts`
List payouts.

#### PATCH `/api/payouts`
Update payout status (admin only).

Valid statuses: `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`

**Request:**
```json
{
  "payoutId": "uuid",
  "status": "COMPLETED"
}
```

---

### Group Summary

#### GET `/api/groups/[id]/summary`
Get comprehensive group summary including:
- Member contribution summary
- Winner history
- Cycle progress
- Pending winners

---

### Audit Logs

#### GET `/api/audit`
Get audit logs.

**Query Parameters:**
- `page`, `limit` - Pagination
- `entity` - Filter by entity type (admin-only)
- `entityId` - Filter by entity ID (admin-only)

## 📊 Database Schema

```
User ─┬─< Membership >── Group
      │                      │
      ├─< Contribution >── Cycle
      │                      │
      ├─< Draw >─────────────┘
      │
      └─< Payout

AuditLog (tracks all state changes)
OTPCode (phone authentication)
Session (user sessions)
```

## 🔒 Constraints

### Business Rules

1. **Unique Membership**: One membership per user per group
2. **One Contribution Per Cycle**: Each member contributes once per cycle
3. **One Draw Per Cycle**: Only one draw allowed per cycle
4. **One Win Per Member**: Each member can win at most once per group (MVP rule)
5. **Complete Contributions Required**: All members must confirm contributions before draw

### Data Integrity

- Foreign key cascades for deletions
- Unique constraints on (groupId, userId)
- Idempotency keys for contribution creation

## 🛡️ Security

- OTP-based phone authentication
- HTTP-only session cookies
- Role-based access control (ADMIN/MEMBER)
- Audit logging for all state changes
- Input validation with Zod

## ✅ Verification Status (2026-02-13)

- `bun run test`: pass
- `bun run lint`: pass
- `bun run build`: pass

## 📝 Non-Custodial Design

This platform is **non-custodial**:

- ❌ Does NOT hold funds
- ❌ Does NOT process payments
- ❌ Does NOT act as financial guarantor
- ✅ Records contributions and payouts
- ✅ Documents agreements between members
- ✅ Tracks who has won and who is waiting

## 🔧 Development

```bash
# Run linting
bun run lint

# Push schema changes
bun run db:push

# Generate Prisma client
bun run db:generate
```

## 📄 License

MIT

---

**Guiding Principle**: The system does not replace trust. It structures and documents trust.
