// @ts-nocheck
import { Router, Request, Response } from 'express';
import { AuthRequest, authenticate, requireWorkspace } from '../../shared/middleware/auth';
import prisma from '../../shared/services/prisma';

const router = Router();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const safeParseJson = (val: string, fallback: any[] = []) => {
  try { return JSON.parse(val); } catch { return fallback; }
};

const parseNote = (note: any) => ({
  ...note,
  tags: safeParseJson(note.tags),
  technologies: safeParseJson(note.technologies),
  links: safeParseJson(note.links),
  snippetIds: safeParseJson(note.snippetIds),
});

// ---------------------------------------------------------------------------
// Auth middleware applied to all routes
// ---------------------------------------------------------------------------

router.use(authenticate);
router.use(requireWorkspace);

// ---------------------------------------------------------------------------
// GET / — List notes for a workspace
// ---------------------------------------------------------------------------

router.get('/', async (req: Request, res: Response) => {
  try {
    const { workspaceId } = req.query as { workspaceId?: string };

    if (!workspaceId) {
      return res.status(400).json({ error: 'workspaceId query param is required' });
    }

    // Verify workspace ownership
    const workspace = await prisma.workspace.findFirst({
      where: { id: workspaceId, userId: (req as AuthRequest).user.id, deletedAt: null },
    });

    if (!workspace) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const notes = await prisma.note.findMany({
      where: { workspaceId, deletedAt: null },
      orderBy: { updatedAt: 'desc' },
    });

    return res.json(notes.map(parseNote));
  } catch (error) {
    console.error('GET /notes error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// GET /:id — Get a single note
// ---------------------------------------------------------------------------

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const note = await prisma.note.findFirst({
      where: { id, deletedAt: null },
      include: { workspace: true },
    });

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    if ((note.workspace as any).userId !== (req as AuthRequest).user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    return res.json(parseNote(note));
  } catch (error) {
    console.error('GET /notes/:id error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// POST / — Create a note
// ---------------------------------------------------------------------------

router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      id,
      title,
      content,
      category,
      tags,
      technologies,
      links,
      snippetIds,
      isFavorite,
      isArchived,
      workspaceId,
      groupId,
    } = req.body;

    if (!workspaceId) {
      return res.status(400).json({ error: 'workspaceId is required' });
    }

    // Verify workspace ownership
    const workspace = await prisma.workspace.findFirst({
      where: { id: workspaceId, userId: (req as AuthRequest).user.id, deletedAt: null },
    });

    if (!workspace) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // If groupId provided, verify the group belongs to the workspace
    if (groupId != null) {
      const group = await prisma.group.findFirst({
        where: { id: groupId, workspaceId },
      });

      if (!group) {
        return res.status(400).json({ error: 'Group does not belong to the specified workspace' });
      }
    }

    const createdNote = await prisma.note.create({
      data: {
        ...(id ? { id } : {}),
        title,
        content,
        category,
        tags: JSON.stringify(tags ?? []),
        technologies: JSON.stringify(technologies ?? []),
        links: JSON.stringify(links ?? []),
        snippetIds: JSON.stringify(snippetIds ?? []),
        isFavorite: isFavorite ?? false,
        isArchived: isArchived ?? false,
        workspaceId,
        groupId: groupId ?? null,
      },
    });

    return res.status(201).json(parseNote(createdNote));
  } catch (error) {
    console.error('POST /notes error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// PATCH /:id — Update a note
// ---------------------------------------------------------------------------

router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const note = await prisma.note.findFirst({
      where: { id, deletedAt: null },
      include: { workspace: true },
    });

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    if ((note.workspace as any).userId !== (req as AuthRequest).user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const {
      title,
      content,
      category,
      tags,
      technologies,
      links,
      snippetIds,
      isFavorite,
      isArchived,
      groupId,
    } = req.body;

    const updateData: Record<string, any> = { updatedAt: new Date() };

    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (category !== undefined) updateData.category = category;
    if (isFavorite !== undefined) updateData.isFavorite = isFavorite;
    if (isArchived !== undefined) updateData.isArchived = isArchived;
    if (groupId !== undefined) updateData.groupId = groupId;

    if (tags !== undefined) updateData.tags = JSON.stringify(tags);
    if (technologies !== undefined) updateData.technologies = JSON.stringify(technologies);
    if (links !== undefined) updateData.links = JSON.stringify(links);
    if (snippetIds !== undefined) updateData.snippetIds = JSON.stringify(snippetIds);

    const updatedNote = await prisma.note.update({
      where: { id },
      data: updateData,
    });

    return res.json(parseNote(updatedNote));
  } catch (error) {
    console.error('PATCH /notes/:id error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// DELETE /:id — Soft-delete a note
// ---------------------------------------------------------------------------

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const note = await prisma.note.findFirst({
      where: { id, deletedAt: null },
      include: { workspace: true },
    });

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    if ((note.workspace as any).userId !== (req as AuthRequest).user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await prisma.note.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return res.json({ message: 'Note deleted' });
  } catch (error) {
    console.error('DELETE /notes/:id error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// PATCH /:id/group — Assign or unassign a group from a note
// ---------------------------------------------------------------------------

router.patch('/:id/group', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { groupId } = req.body;

    const note = await prisma.note.findFirst({
      where: { id, deletedAt: null },
      include: { workspace: true },
    });

    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    if ((note.workspace as any).userId !== (req as AuthRequest).user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // If groupId provided (not null), verify the group belongs to the same workspace
    if (groupId != null) {
      const group = await prisma.group.findFirst({
        where: { id: groupId, workspaceId: note.workspaceId },
      });

      if (!group) {
        return res.status(400).json({ error: 'Group does not belong to this note\'s workspace' });
      }
    }

    const updatedNote = await prisma.note.update({
      where: { id },
      data: { groupId: groupId ?? null, updatedAt: new Date() },
    });

    return res.json(parseNote(updatedNote));
  } catch (error) {
    console.error('PATCH /notes/:id/group error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------

export default router;
