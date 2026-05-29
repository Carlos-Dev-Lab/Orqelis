// @ts-nocheck
import { Router, Request, Response } from 'express';
import { AuthRequest, authenticate, requireWorkspace } from '../../shared/middleware/auth';
import prisma from '../../shared/services/prisma';
import { z } from 'zod';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);
router.use(requireWorkspace);

// ─── Validation Schemas ────────────────────────────────────────────────────────

const createGroupSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  description: z.string().optional(),
  color: z.string(),
  icon: z.string(),
  workspaceId: z.string(),
});

const updateGroupSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
});

// ─── Helper: verify workspace ownership ───────────────────────────────────────

async function verifyWorkspaceOwnership(workspaceId: string, userId: string) {
  return prisma.workspace.findFirst({
    where: { id: workspaceId, userId, deletedAt: null },
  });
}

// ─── GET / — List groups in a workspace ───────────────────────────────────────

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { workspaceId } = req.query as { workspaceId?: string };

    if (!workspaceId) {
      return res.status(400).json({ error: 'workspaceId query param is required' });
    }

    const workspace = await verifyWorkspaceOwnership(workspaceId, req.user!.id);
    if (!workspace) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const groups = await prisma.group.findMany({
      where: { workspaceId, deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });

    return res.json(groups);
  } catch (error) {
    console.error('[GET /groups]', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── GET /:id — Get a single group ──────────────────────────────────────────
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const group = await prisma.group.findFirst({
      where: { id, deletedAt: null },
      include: { workspace: true },
    });

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    if (group.workspace.userId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Don't include workspace in response to keep it consistent with other groups
    const { workspace, ...groupData } = group;
    return res.json(groupData);
  } catch (error) {
    console.error('[GET /groups/:id]', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── POST / — Create a group ───────────────────────────────────────────────────

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const parsed = createGroupSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    const { id, name, description, color, icon, workspaceId } = parsed.data;

    const workspace = await verifyWorkspaceOwnership(workspaceId, req.user!.id);
    if (!workspace) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const group = await prisma.group.create({
      data: {
        ...(id ? { id } : {}),
        name,
        description,
        color,
        icon,
        workspaceId,
      },
    });

    return res.status(201).json(group);
  } catch (error) {
    console.error('[POST /groups]', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── PATCH /:id — Update a group ──────────────────────────────────────────────

router.patch('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const group = await prisma.group.findFirst({
      where: { id, deletedAt: null },
      include: { workspace: true },
    });

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    if (group.workspace.userId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const parsed = updateGroupSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    const updatedGroup = await prisma.group.update({
      where: { id },
      data: { ...parsed.data, updatedAt: new Date() },
    });

    return res.json(updatedGroup);
  } catch (error) {
    console.error('[PATCH /groups/:id]', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── DELETE /:id — Soft-delete a group ────────────────────────────────────────

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const group = await prisma.group.findFirst({
      where: { id, deletedAt: null },
      include: { workspace: true },
    });

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    if (group.workspace.userId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await prisma.group.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return res.json({ message: 'Group deleted' });
  } catch (error) {
    console.error('[DELETE /groups/:id]', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
