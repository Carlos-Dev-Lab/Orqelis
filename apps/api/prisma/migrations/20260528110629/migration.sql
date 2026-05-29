/*
  Warnings:

  - You are about to drop the column `password` on the `User` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "Connection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'ssh',
    "host" TEXT NOT NULL,
    "port" INTEGER DEFAULT 22,
    "workspaceId" TEXT NOT NULL,
    "noteIds" TEXT NOT NULL DEFAULT '[]',
    "snippetIds" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "Connection_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Credential" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "encryptedPassword" TEXT NOT NULL,
    "passwordIv" TEXT NOT NULL,
    "passwordAuthTag" TEXT NOT NULL,
    "keyVersion" INTEGER NOT NULL DEFAULT 1,
    "connectionId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Credential_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "Connection" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Activity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "entityTitle" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    CONSTRAINT "Activity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Activity" ("entityId", "entityTitle", "entityType", "id", "timestamp", "type") SELECT "entityId", "entityTitle", "entityType", "id", "timestamp", "type" FROM "Activity";
DROP TABLE "Activity";
ALTER TABLE "new_Activity" RENAME TO "Activity";
CREATE INDEX "Activity_userId_idx" ON "Activity"("userId");
CREATE INDEX "Activity_timestamp_idx" ON "Activity"("timestamp");
CREATE TABLE "new_Note" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "technologies" TEXT NOT NULL DEFAULT '[]',
    "links" TEXT NOT NULL DEFAULT '[]',
    "snippetIds" TEXT NOT NULL DEFAULT '[]',
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "workspaceId" TEXT NOT NULL,
    "groupId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "Note_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Note_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Note" ("category", "content", "createdAt", "deletedAt", "groupId", "id", "isArchived", "isFavorite", "links", "tags", "technologies", "title", "updatedAt", "workspaceId") SELECT "category", "content", "createdAt", "deletedAt", "groupId", "id", "isArchived", "isFavorite", "links", "tags", "technologies", "title", "updatedAt", "workspaceId" FROM "Note";
DROP TABLE "Note";
ALTER TABLE "new_Note" RENAME TO "Note";
CREATE TABLE "new_Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "link" TEXT,
    "workspaceId" TEXT,
    "userId" TEXT,
    CONSTRAINT "Notification_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Notification" ("id", "link", "message", "read", "timestamp", "title", "type", "workspaceId") SELECT "id", "link", "message", "read", "timestamp", "title", "type", "workspaceId" FROM "Notification";
DROP TABLE "Notification";
ALTER TABLE "new_Notification" RENAME TO "Notification";
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");
CREATE TABLE "new_Snippet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "framework" TEXT,
    "description" TEXT,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "noteIds" TEXT NOT NULL DEFAULT '[]',
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "workspaceId" TEXT NOT NULL,
    "groupId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "Snippet_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Snippet_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Snippet" ("code", "createdAt", "deletedAt", "description", "framework", "groupId", "id", "isFavorite", "language", "tags", "title", "updatedAt", "usageCount", "workspaceId") SELECT "code", "createdAt", "deletedAt", "description", "framework", "groupId", "id", "isFavorite", "language", "tags", "title", "updatedAt", "usageCount", "workspaceId" FROM "Snippet";
DROP TABLE "Snippet";
ALTER TABLE "new_Snippet" RENAME TO "Snippet";
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
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
INSERT INTO "new_User" ("createdAt", "deletedAt", "email", "emailVerified", "googleId", "id", "image", "isActive", "lastLoginAt", "lastLoginIp", "name", "passwordHash", "provider", "role", "storageQuotaBytes", "syncEnabled", "tokenVersion", "updatedAt", "usedStorageBytes") SELECT "createdAt", "deletedAt", "email", "emailVerified", "googleId", "id", "image", "isActive", "lastLoginAt", "lastLoginIp", "name", "passwordHash", "provider", "role", "storageQuotaBytes", "syncEnabled", "tokenVersion", "updatedAt", "usedStorageBytes" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
