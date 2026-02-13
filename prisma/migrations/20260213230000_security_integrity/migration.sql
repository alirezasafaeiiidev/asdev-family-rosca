-- Security and data-integrity hardening migration

-- Add unique constraint to prevent duplicate contributions per cycle/user.
CREATE UNIQUE INDEX IF NOT EXISTS "Contribution_cycleId_userId_key"
ON "Contribution"("cycleId", "userId");

-- Add OTP lookup index for auth checks.
CREATE INDEX IF NOT EXISTS "OTPCode_phone_used_expiresAt_idx"
ON "OTPCode"("phone", "used", "expiresAt");

-- Recreate Session table to add foreign key relation to User.
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_Session" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "deviceInfo" TEXT,
  "ipAddress" TEXT,
  "expiresAt" DATETIME NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Session_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "new_Session" ("id", "userId", "token", "deviceInfo", "ipAddress", "expiresAt", "createdAt")
SELECT "id", "userId", "token", "deviceInfo", "ipAddress", "expiresAt", "createdAt"
FROM "Session";

DROP TABLE "Session";
ALTER TABLE "new_Session" RENAME TO "Session";

CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");
CREATE INDEX "Session_userId_idx" ON "Session"("userId");
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

PRAGMA foreign_keys=ON;
