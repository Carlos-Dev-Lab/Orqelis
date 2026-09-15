import path from 'path';
import fs from 'fs/promises';

// ---------------------------------------------------------------------------
// Disk storage for note files (diagram images).
// Files live under UPLOADS_DIR/<userId>/<workspaceId>/<noteId>/<fileId>.<ext>
// and only the path relative to UPLOADS_DIR is persisted in the database.
// ---------------------------------------------------------------------------

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export const ALLOWED_MIME_TYPES: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
};

// Excalidraw file ids are hex hashes / nanoids; ids reach the filesystem so keep them strict
const SAFE_SEGMENT = /^[A-Za-z0-9_-]{1,128}$/;

export const isSafeSegment = (value: unknown): value is string =>
  typeof value === 'string' && SAFE_SEGMENT.test(value);

export const getUploadsDir = (): string => {
  const configured = process.env.UPLOADS_DIR;
  if (configured) return path.resolve(configured);

  // Default: apps/api/uploads (works when started from apps/api or from the monorepo root)
  const cwd = process.cwd();
  const apiDir = path.basename(cwd) === 'api' ? cwd : path.join(cwd, 'apps', 'api');
  return path.join(apiDir, 'uploads');
};

/** Resolves a stored relative path and guarantees it stays inside UPLOADS_DIR. */
export const resolveStoredPath = (relativePath: string): string => {
  const root = getUploadsDir();
  const absolute = path.resolve(root, relativePath);
  if (absolute !== root && !absolute.startsWith(root + path.sep)) {
    throw new Error('Invalid file path');
  }
  return absolute;
};

export const buildRelativePath = (
  userId: string,
  workspaceId: string,
  noteId: string,
  fileId: string,
  mimeType: string,
): string => {
  const ext = ALLOWED_MIME_TYPES[mimeType];
  if (!ext) throw new Error('Unsupported file type');
  for (const segment of [userId, workspaceId, noteId, fileId]) {
    if (!isSafeSegment(segment)) throw new Error('Invalid path segment');
  }
  // Always use forward slashes in the database so paths are portable across OSes
  return [userId, workspaceId, noteId, `${fileId}.${ext}`].join('/');
};

export const saveFile = async (relativePath: string, data: Buffer): Promise<void> => {
  const absolute = resolveStoredPath(relativePath);
  await fs.mkdir(path.dirname(absolute), { recursive: true });
  await fs.writeFile(absolute, data);
};

export const deleteFile = async (relativePath: string): Promise<void> => {
  try {
    await fs.unlink(resolveStoredPath(relativePath));
  } catch (error: any) {
    if (error?.code !== 'ENOENT') throw error;
  }
};
