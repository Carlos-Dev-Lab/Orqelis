// @ts-nocheck
import { Router, Request, Response } from 'express';
import { authenticate, AuthRequest, requireWorkspace } from '../../shared/middleware/auth';
import prisma from '../../shared/services/prisma';

const router = Router();

// ─── Helpers ────────────────────────────────────────────────────────────────

const safeParseJson = (val: string, fallback: any[] = []) => {
  try { return JSON.parse(val); } catch { return fallback; }
};

const parseSnippet = (s: any) => ({
  ...s,
  tags: safeParseJson(s.tags),
  noteIds: safeParseJson(s.noteIds),
});

// ─── Auth middleware (all routes) ────────────────────────────────────────────

router.use(authenticate);
router.use(requireWorkspace);

// ─── GET / — List snippets for a workspace ───────────────────────────────────

router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).user.id;
    const { workspaceId } = req.query as { workspaceId: string };

    if (!workspaceId) {
      return res.status(400).json({ error: 'workspaceId is required' });
    }

    const workspace = await prisma.workspace.findFirst({
      where: { id: workspaceId, userId, deletedAt: null },
    });

    if (!workspace) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const snippets = await prisma.snippet.findMany({
      where: { workspaceId, deletedAt: null },
      orderBy: { updatedAt: 'desc' },
    });

    return res.json(snippets.map(parseSnippet));
  } catch (error) {
    console.error('[GET /snippets]', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── GET /:id — Get single snippet ───────────────────────────────────────────
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).user.id;
    const { id } = req.params;

    const snippet = await prisma.snippet.findFirst({
      where: { id, deletedAt: null },
      include: { workspace: true },
    });

    if (!snippet || snippet.workspace.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    return res.json(parseSnippet(snippet));
  } catch (error) {
    console.error('[GET /snippets/:id]', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── POST / — Create snippet ─────────────────────────────────────────────────

router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).user.id;
    const {
      id, title, code, language, framework, description,
      tags, noteIds, isFavorite, usageCount, workspaceId, groupId,
    } = req.body;

    if (!workspaceId || !title || !code || !language) {
      return res.status(400).json({ error: 'workspaceId, title, code, and language are required' });
    }

    const workspace = await prisma.workspace.findFirst({
      where: { id: workspaceId, userId, deletedAt: null },
    });

    if (!workspace) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const created = await prisma.snippet.create({
      data: {
        ...(id && { id }),
        title,
        code,
        language,
        framework: framework ?? null,
        description: description ?? '',
        tags: JSON.stringify(tags ?? []),
        noteIds: JSON.stringify(noteIds ?? []),
        isFavorite: isFavorite ?? false,
        usageCount: usageCount ?? 0,
        workspaceId,
        groupId: groupId ?? null,
      },
    });

    return res.status(201).json(parseSnippet(created));
  } catch (error) {
    console.error('[POST /snippets]', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── PATCH /:id — Update snippet ─────────────────────────────────────────────

router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).user.id;
    const { id } = req.params;

    const snippet = await prisma.snippet.findFirst({
      where: { id, deletedAt: null },
      include: { workspace: true },
    });

    if (!snippet || snippet.workspace.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const {
      title, code, language, framework, description,
      tags, noteIds, isFavorite, usageCount, groupId,
    } = req.body;

    const updateData: Record<string, any> = { updatedAt: new Date() };

    if (title !== undefined)       updateData.title       = title;
    if (code !== undefined)        updateData.code        = code;
    if (language !== undefined)    updateData.language    = language;
    if (framework !== undefined)   updateData.framework   = framework;
    if (description !== undefined) updateData.description = description;
    if (isFavorite !== undefined)  updateData.isFavorite  = isFavorite;
    if (usageCount !== undefined)  updateData.usageCount  = usageCount;
    if (groupId !== undefined)     updateData.groupId     = groupId;
    if (tags !== undefined)        updateData.tags        = JSON.stringify(tags);
    if (noteIds !== undefined)     updateData.noteIds     = JSON.stringify(noteIds);

    const updated = await prisma.snippet.update({ where: { id }, data: updateData });

    return res.json(parseSnippet(updated));
  } catch (error) {
    console.error('[PATCH /snippets/:id]', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── DELETE /:id — Soft-delete snippet ───────────────────────────────────────

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).user.id;
    const { id } = req.params;

    const snippet = await prisma.snippet.findFirst({
      where: { id, deletedAt: null },
      include: { workspace: true },
    });

    if (!snippet || snippet.workspace.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await prisma.snippet.update({ where: { id }, data: { deletedAt: new Date() } });

    return res.json({ message: 'Snippet deleted' });
  } catch (error) {
    console.error('[DELETE /snippets/:id]', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── PATCH /:id/group — Assign / unassign group ──────────────────────────────

router.patch('/:id/group', async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).user.id;
    const { id } = req.params;
    const { groupId } = req.body;

    const snippet = await prisma.snippet.findFirst({
      where: { id, deletedAt: null },
      include: { workspace: true },
    });

    if (!snippet || snippet.workspace.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // If assigning a group, verify it belongs to the same workspace
    if (groupId !== null && groupId !== undefined) {
      const group = await prisma.group.findFirst({
        where: { id: groupId, workspaceId: snippet.workspaceId, deletedAt: null },
      });

      if (!group) {
        return res.status(400).json({ error: 'Group does not belong to this workspace' });
      }
    }

    const updated = await prisma.snippet.update({
      where: { id },
      data: { groupId: groupId ?? null, updatedAt: new Date() },
    });

    return res.json(parseSnippet(updated));
  } catch (error) {
    console.error('[PATCH /snippets/:id/group]', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── PATCH /:id/usage — Increment usage counter ──────────────────────────────

router.patch('/:id/usage', async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).user.id;
    const { id } = req.params;

    const snippet = await prisma.snippet.findFirst({
      where: { id, deletedAt: null },
      include: { workspace: true },
    });

    if (!snippet || snippet.workspace.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updated = await prisma.snippet.update({
      where: { id },
      data: { usageCount: { increment: 1 }, updatedAt: new Date() },
    });

    return res.json(parseSnippet(updated));
  } catch (error) {
    console.error('[PATCH /snippets/:id/usage]', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
