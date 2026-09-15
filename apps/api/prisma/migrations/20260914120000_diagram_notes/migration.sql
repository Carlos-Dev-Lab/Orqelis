-- AlterTable
ALTER TABLE "Note" ADD COLUMN "type" TEXT NOT NULL DEFAULT 'markdown';
ALTER TABLE "Note" ADD COLUMN "diagramData" TEXT;

-- CreateTable
CREATE TABLE "NoteFile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "noteId" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "path" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NoteFile_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "Note" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "NoteFile_noteId_idx" ON "NoteFile"("noteId");

-- CreateIndex
CREATE UNIQUE INDEX "NoteFile_noteId_fileId_key" ON "NoteFile"("noteId", "fileId");
