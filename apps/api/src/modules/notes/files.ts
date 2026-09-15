import express, { Router, Request, Response } from 'express';
import { AuthRequest } from '../../shared/middleware/auth';
import prisma from '../../shared/services/prisma';
import {
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
  buildRelativePath,
  deleteFile,
  isSafeSegment,
  resolveStoredPath,
  saveFile,
} from '../../shared/services/fileStorage';

// Mounted under /api/notes/:id/files (authentication is applied by the notes router)
const router = Router({ mergeParams: true });

const findOwnedNote = async (req: Request) => {
  const { id } = req.params;
  if (!isSafeSegment(id)) return { status: 400, error: 'Invalid note id' };

  const note = await prisma.note.findFirst({
    where: { id, deletedAt: null },
    include: { workspace: true },
  });

  if (!note) return { status: 404, error: 'Note not found' };
  if ((note.workspace as any).userId !== (req as AuthRequest).user.id) {
    return { status: 403, error: 'Forbidden' };
  }
  return { note };
};

// ---------------------------------------------------------------------------
// POST /:fileId — Upload a file (raw binary body, Content-Type = mime type)
// ---------------------------------------------------------------------------

router.post(
  '/:fileId',
  express.raw({ type: Object.keys(ALLOWED_MIME_TYPES), limit: MAX_FILE_SIZE }),
  async (req: Request, res: Response) => {
    try {
      const { fileId } = req.params;
      if (!isSafeSegment(fileId)) {
        return res.status(400).json({ error: 'Invalid file id' });
      }

      const mimeType = (req.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
      if (!ALLOWED_MIME_TYPES[mimeType]) {
        return res.status(415).json({ error: 'Unsupported file type' });
      }

      if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
        return res.status(400).json({ error: 'Empty file' });
      }

      const result = await findOwnedNote(req);
      if (!result.note) return res.status(result.status).json({ error: result.error });
      const { note } = result;

      const relativePath = buildRelativePath(
        (req as AuthRequest).user.id,
        note.workspaceId,
        note.id,
        fileId,
        mimeType,
      );

      const existing = await prisma.noteFile.findUnique({
        where: { noteId_fileId: { noteId: note.id, fileId } },
      });

      await saveFile(relativePath, req.body);
      if (existing && existing.path !== relativePath) {
        await deleteFile(existing.path);
      }

      const record = await prisma.noteFile.upsert({
        where: { noteId_fileId: { noteId: note.id, fileId } },
        create: {
          noteId: note.id,
          fileId,
          workspaceId: note.workspaceId,
          mimeType,
          size: req.body.length,
          path: relativePath,
        },
        update: { mimeType, size: req.body.length, path: relativePath },
      });

      return res.status(201).json({
        fileId: record.fileId,
        mimeType: record.mimeType,
        size: record.size,
      });
    } catch (error) {
      console.error('POST /notes/:id/files/:fileId error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },
);

// ---------------------------------------------------------------------------
// GET /:fileId — Download a file
// ---------------------------------------------------------------------------

router.get('/:fileId', async (req: Request, res: Response) => {
  try {
    const { fileId } = req.params;
    if (!isSafeSegment(fileId)) {
      return res.status(400).json({ error: 'Invalid file id' });
    }

    const result = await findOwnedNote(req);
    if (!result.note) return res.status(result.status).json({ error: result.error });

    const record = await prisma.noteFile.findUnique({
      where: { noteId_fileId: { noteId: result.note.id, fileId } },
    });
    if (!record) return res.status(404).json({ error: 'File not found' });

    res.setHeader('Content-Type', record.mimeType);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; sandbox");
    res.setHeader('Cache-Control', 'private, max-age=31536000, immutable');

    return res.sendFile(resolveStoredPath(record.path), (err) => {
      if (err && !res.headersSent) {
        res.status(404).json({ error: 'File not found' });
      }
    });
  } catch (error) {
    console.error('GET /notes/:id/files/:fileId error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
