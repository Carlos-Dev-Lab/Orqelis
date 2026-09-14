// @ts-nocheck
import { Router, Request, Response } from 'express';
import prisma from '../../shared/services/prisma';
import { AuthRequest, authenticate, requireWorkspace } from '../../shared/middleware/auth';
import { encrypt, decrypt } from '../../shared/services/crypto';

const router = Router();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const safeParseJson = (val: string, fallback: any[] = []) => {
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
};

const parseConnection = (c: any) => ({
  ...c,
  noteIds: safeParseJson(c.noteIds),
  snippetIds: safeParseJson(c.snippetIds),
  credentials: c.credentials?.map((cred: any) => {
    let password = '';
    try {
      if (cred.encryptedPassword && cred.passwordIv && cred.passwordAuthTag) {
        password = decrypt(cred.encryptedPassword, cred.passwordIv, cred.passwordAuthTag);
      }
    } catch (e) {
      console.error('Error decrypting password for credential', cred.id, e);
    }
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { encryptedPassword, passwordIv, passwordAuthTag, ...rest } = cred;
    return { ...rest, password };
  })
});

// ---------------------------------------------------------------------------
// Auth middleware applied to all routes
// ---------------------------------------------------------------------------

router.use(authenticate);
router.use(requireWorkspace);

// ---------------------------------------------------------------------------
// GET / — List connections for a workspace
// ---------------------------------------------------------------------------

router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).user.id;
    const { workspaceId } = req.query as { workspaceId: string };

    if (!workspaceId) {
      return res.status(400).json({ error: 'workspaceId query param is required' });
    }

    // Verify workspace ownership
    const workspace = await prisma.workspace.findFirst({
      where: { id: workspaceId, userId, deletedAt: null },
    });

    if (!workspace) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const connections = await prisma.connection.findMany({
      where: { workspaceId, deletedAt: null },
      include: { credentials: true },
      orderBy: { createdAt: 'asc' },
    });

    return res.json(connections.map(parseConnection));
  } catch (error) {
    console.error('[GET /connections]', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// GET /:id — Get a single connection
// ---------------------------------------------------------------------------

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).user.id;
    const { id } = req.params;

    const connection = await prisma.connection.findFirst({
      where: { id, deletedAt: null },
      include: { credentials: true, workspace: true },
    });

    if (!connection || connection.workspace.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    return res.json(parseConnection(connection));
  } catch (error) {
    console.error('[GET /connections/:id]', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// POST / — Create a new connection
// ---------------------------------------------------------------------------

router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).user.id;
    const {
      id,
      name,
      type,
      host,
      port,
      workspaceId,
      noteIds = [],
      snippetIds = [],
      credentials = [],
    } = req.body as {
      id?: string;
      name: string;
      type: string;
      host: string;
      port?: number;
      workspaceId: string;
      noteIds?: string[];
      snippetIds?: string[];
      credentials?: Array<{ id?: string; username: string; password: string }>;
    };

    if (!workspaceId) {
      return res.status(400).json({ error: 'workspaceId is required' });
    }

    // Verify workspace ownership
    const workspace = await prisma.workspace.findFirst({
      where: { id: workspaceId, userId, deletedAt: null },
    });

    if (!workspace) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Create connection + credentials in a single transaction
    const connection = await prisma.$transaction(async (tx) => {
      const newConnection = await tx.connection.create({
        data: {
          ...(id ? { id } : {}),
          name,
          type: type || 'ssh',
          host,
          port: port || 22,
          workspaceId,
          noteIds: JSON.stringify(noteIds),
          snippetIds: JSON.stringify(snippetIds),
        },
      });

      if (credentials.length > 0) {
        await tx.credential.createMany({
          data: credentials.map((cred) => {
            const { encrypted, iv, authTag } = encrypt(cred.password);
            return {
              ...(cred.id ? { id: cred.id } : {}),
              username: cred.username,
              encryptedPassword: encrypted,
              passwordIv: iv,
              passwordAuthTag: authTag,
              connectionId: newConnection.id,
            };
          }),
        });
      }

      // Re-fetch to include credentials
      return tx.connection.findUnique({
        where: { id: newConnection.id },
        include: { credentials: true },
      });
    });

    return res.status(201).json(parseConnection(connection));
  } catch (error) {
    console.error('[POST /connections]', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// PATCH /:id — Update an existing connection
// ---------------------------------------------------------------------------

router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).user.id;
    const { id } = req.params;
    const {
      name,
      type,
      host,
      port,
      noteIds,
      snippetIds,
      credentials,
    } = req.body as {
      name?: string;
      type?: string;
      host?: string;
      port?: number;
      noteIds?: string[];
      snippetIds?: string[];
      credentials?: Array<{ id?: string; username: string; password: string }>;
    };

    // Verify ownership via connection → workspace
    const existing = await prisma.connection.findFirst({
      where: { id, deletedAt: null },
      include: { workspace: true },
    });

    if (!existing || existing.workspace.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.connection.update({
        where: { id },
        data: {
          ...(name !== undefined ? { name } : {}),
          ...(type !== undefined ? { type } : {}),
          ...(host !== undefined ? { host } : {}),
          ...(port !== undefined ? { port } : {}),
          ...(noteIds !== undefined ? { noteIds: JSON.stringify(noteIds) } : {}),
          ...(snippetIds !== undefined ? { snippetIds: JSON.stringify(snippetIds) } : {}),
          updatedAt: new Date(),
        },
      });

      if (credentials !== undefined) {
        // Replace credentials: delete old ones, insert new ones
        await tx.credential.deleteMany({ where: { connectionId: id } });

        if (credentials.length > 0) {
          await tx.credential.createMany({
            data: credentials.map((cred) => {
              const { encrypted, iv, authTag } = encrypt(cred.password);
              return {
                ...(cred.id ? { id: cred.id } : {}),
                username: cred.username,
                encryptedPassword: encrypted,
                passwordIv: iv,
                passwordAuthTag: authTag,
                connectionId: id,
              };
            }),
          });
        }
      }

      return tx.connection.findFirst({
        where: { id, deletedAt: null },
        include: { credentials: true },
      });
    });

    return res.json(parseConnection(updated));
  } catch (error) {
    console.error('[PATCH /connections/:id]', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// DELETE /:id — Hard-delete connection (credentials cascade)
// ---------------------------------------------------------------------------

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).user.id;
    const { id } = req.params;

    // Verify ownership via workspace.userId
    const existing = await prisma.connection.findFirst({
      where: { id, deletedAt: null },
      include: { workspace: true },
    });

    if (!existing || existing.workspace.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Soft delete it
    await prisma.connection.update({ 
      where: { id },
      data: { deletedAt: new Date() }
    });

    return res.json({ message: 'Connection deleted' });
  } catch (error) {
    console.error('[DELETE /connections/:id]', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
