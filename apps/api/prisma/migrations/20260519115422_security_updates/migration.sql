-- AlterTable
ALTER TABLE "Group" ADD COLUMN "deletedAt" DATETIME;

-- AlterTable
ALTER TABLE "Note" ADD COLUMN "deletedAt" DATETIME;

-- AlterTable
ALTER TABLE "Snippet" ADD COLUMN "deletedAt" DATETIME;

-- AlterTable
ALTER TABLE "Workspace" ADD COLUMN "deletedAt" DATETIME;

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "refreshTokenHash" TEXT NOT NULL,
    "tokenFamily" TEXT NOT NULL,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "expiresAt" DATETIME NOT NULL,
    "revokedAt" DATETIME,
    "replacedByTokenId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" DATETIME,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "actorUserId" TEXT,
    "actorEmail" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'success',
    "severity" TEXT NOT NULL DEFAULT 'info',
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "passwordHash" TEXT,
    "name" TEXT,
    "image" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "provider" TEXT NOT NULL DEFAULT 'local',
    "googleId" TEXT,
    "lastLoginAt" DATETIME,
    "lastLoginIp" TEXT,
    "deletedAt" DATETIME,
    "storageQuotaBytes" BIGINT NOT NULL DEFAULT 104857600,
    "usedStorageBytes" BIGINT NOT NULL DEFAULT 0,
    "syncEnabled" BOOLEAN NOT NULL DEFAULT false,
    "tokenVersion" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("createdAt", "email", "id", "image", "isActive", "name", "role", "updatedAt") SELECT "createdAt", "email", "id", "image", "isActive", "name", "role", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Session_refreshTokenHash_key" ON "Session"("refreshTokenHash");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_tokenFamily_idx" ON "Session"("tokenFamily");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex
CREATE INDEX "AuditLog_actorUserId_idx" ON "AuditLog"("actorUserId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");
