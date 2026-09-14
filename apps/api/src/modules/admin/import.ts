// @ts-nocheck
import { Router, Request, Response } from 'express';
import { AuthUser, authenticate } from '../../shared/middleware/auth';
import prisma from '../../shared/services/prisma';
import { z } from 'zod';
import { encrypt } from '../../shared/services/crypto';
import { randomUUID } from 'crypto';

const router = Router();

router.use(authenticate);

const dateSchema = z.preprocess((arg) => {
  if (arg === null || arg === "") return null;
  if (typeof arg === "string" || arg instanceof Date) {
    const d = new Date(arg);
    return isNaN(d.getTime()) ? undefined : d;
  }
  return arg;
}, z.date().nullable().optional());

const workspaceSchema = z.preprocess((val: any) => {
  if (typeof val === 'object' && val !== null) {
    if (!val.id) val.id = randomUUID();
    if (!val.name && val.title) val.name = val.title;
    if (!val.name && val.label) val.name = val.label;
  }
  return val;
}, z.object({
  id: z.string().min(1),
  name: z.string().nullish().transform(v => v || 'Sin nombre'),
  description: z.string().nullish().transform(v => v || ''),
  color: z.string().nullish().transform(v => v || '#4f46e5'),
  icon: z.string().nullish().transform(v => v || 'Layout'),
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: dateSchema,
}));

const groupSchema = z.preprocess((val: any) => {
  if (typeof val === 'object' && val !== null) {
    if (!val.id) val.id = randomUUID();
    if (!val.name && val.title) val.name = val.title;
  }
  return val;
}, z.object({
  id: z.string().min(1),
  name: z.string().nullish().transform(v => v || 'Sin nombre'),
  description: z.string().nullish().transform(v => v || ''),
  color: z.string().nullish().transform(v => v || '#4f46e5'),
  icon: z.string().nullish().transform(v => v || 'Folder'),
  workspaceId: z.string().min(1),
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: dateSchema,
}));

const noteSchema = z.preprocess((val: any) => {
  if (typeof val === 'object' && val !== null) {
    if (!val.id) val.id = randomUUID();
    if (!val.title && val.name) val.title = val.name;
    if (!val.content && val.body) val.content = val.body;
    if (!val.content && val.text) val.content = val.text;
    if (!val.category && val.type) val.category = val.type;
  }
  return val;
}, z.object({
  id: z.string().min(1),
  title: z.string().nullish().transform(v => v || 'Sin título'),
  content: z.string().nullish().transform(v => v || ''),
  category: z.string().nullish().transform(v => v || 'General'),
  tags: z.any().optional(),
  technologies: z.any().optional(),
  links: z.any().optional(),
  snippetIds: z.any().optional(),
  isFavorite: z.boolean().nullish().transform(v => v || false),
  isArchived: z.boolean().nullish().transform(v => v || false),
  workspaceId: z.string().min(1),
  groupId: z.string().nullable().optional(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: dateSchema,
}));

const snippetSchema = z.preprocess((val: any) => {
  if (typeof val === 'object' && val !== null) {
    if (!val.id) val.id = randomUUID();
    if (!val.title && val.name) val.title = val.name;
    if (!val.code && val.content) val.code = val.content;
    if (!val.code && val.snippet) val.code = val.snippet;
  }
  return val;
}, z.object({
  id: z.string().min(1),
  title: z.string().nullish().transform(v => v || 'Sin título'),
  code: z.string().nullish().transform(v => v || ''),
  language: z.string().nullish().transform(v => v || 'plaintext'),
  framework: z.string().nullish().transform(v => v || ''),
  description: z.string().nullish().transform(v => v || ''),
  tags: z.any().optional(),
  noteIds: z.any().optional(),
  isFavorite: z.boolean().nullish().transform(v => v || false),
  usageCount: z.number().nullish().transform(v => v || 0),
  workspaceId: z.string().min(1),
  groupId: z.string().nullable().optional(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: dateSchema,
}));

const connectionSchema = z.preprocess((val: any) => {
  if (typeof val === 'object' && val !== null) {
    if (!val.id) val.id = randomUUID();
    if (!val.name && val.title) val.name = val.title;
    if (!val.host && val.address) val.host = val.address;
    if (!val.host && val.url) val.host = val.url;
  }
  return val;
}, z.object({
  id: z.string().min(1),
  name: z.string().nullish().transform(v => v || 'Nueva conexión'),
  type: z.enum(['ssh', 'web', 'database']).nullish().transform(v => v || 'ssh'),
  host: z.string().nullish().transform(v => v || 'localhost'),
  port: z.number().nullish().transform(v => v || 22),
  workspaceId: z.string().min(1),
  noteIds: z.any().optional(),
  snippetIds: z.any().optional(),
  // Permitir incluir credenciales anidadas en la conexión exportada
  credentials: z.array(z.any()).optional().default([]),
  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: dateSchema,
}));

// Esquema para credenciales importadas. Acepta tanto password en claro
// como la tripleta ya cifrada (encryptedPassword/passwordIv/passwordAuthTag)
const credentialSchema = z.preprocess((val: any) => {
  if (typeof val === 'object' && val !== null) {
    if (!val.id) val.id = randomUUID();
  }
  return val;
}, z.object({
  id: z.string().min(1),
  username: z.string().nullish().transform(v => v || ''),
  password: z.string().nullish().transform(v => v ?? ''),
  keyVersion: z.number().nullish().transform(v => v || 1),
  connectionId: z.string().nullish(),
  encryptedPassword: z.string().nullish(),
  passwordIv: z.string().nullish(),
  passwordAuthTag: z.string().nullish(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
}));

const notificationSchema = z.preprocess((val: any) => {
  if (typeof val === 'object' && val !== null) {
    if (!val.id) val.id = randomUUID();
    if (!val.message && val.content) val.message = val.content;
    if (!val.message && val.text) val.message = val.text;
  }
  return val;
}, z.object({
  id: z.string().min(1),
  title: z.string().nullish().transform(v => v || 'Notificación'),
  message: z.string().nullish().transform(v => v || ''),
  type: z.string().nullish().transform(v => v || 'info'),
  read: z.boolean().nullish().transform(v => v || false),
  timestamp: dateSchema,
  link: z.string().nullable().optional(),
  workspaceId: z.string().nullable().optional(),
}));

const importSchema = z.object({
  workspaces: z.array(z.any()).optional().default([]),
  groups: z.array(z.any()).optional().default([]),
  notes: z.array(z.any()).optional().default([]),
  snippets: z.array(z.any()).optional().default([]),
  connections: z.array(z.any()).optional().default([]),
  notifications: z.array(z.any()).optional().default([]),
  activities: z.array(z.any()).optional().default([]),
});

interface ImportResult {
  success: boolean;
  type: string;
  id: string;
  name: string;
  error?: string;
}

router.post('/', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as AuthUser;
    const userId = user.id;

    const parsed = importSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Formato de importación inválido', details: parsed.error.flatten() });
    }

    const { workspaces, groups, notes, snippets, connections, notifications, activities } = parsed.data;
    const results: ImportResult[] = [];
    
    // ID mapping to resolve conflicts and maintain relationships
    const idMap = new Map<string, string>();
    
    // Helper to validate and collect IDs
    const validateAndMap = (items: any[], schema: z.ZodSchema, type: string) => {
      const validItems: any[] = [];
      for (const item of items) {
        const v = schema.safeParse(item);
        if (v.success) {
          const validated = v.data;
          idMap.set(validated.id, randomUUID());
          validItems.push(validated);
        } else {
          results.push({ 
            success: false, 
            type, 
            id: item.id || 'unknown', 
            name: item.name || item.title || 'Sin nombre', 
            error: 'Formato incompatible o faltan datos esenciales' 
          });
        }
      }
      return validItems;
    };

    const validWorkspaces = validateAndMap(workspaces, workspaceSchema, 'Workspace');
    const validGroups = validateAndMap(groups, groupSchema, 'Group');
    const validNotes = validateAndMap(notes, noteSchema, 'Note');
    const validSnippets = validateAndMap(snippets, snippetSchema, 'Snippet');
    const validConnections = validateAndMap(connections, connectionSchema, 'Connection');
    const validNotifications = validateAndMap(notifications, notificationSchema, 'Notification');
    const validActivities = activities.filter(a => a && typeof a === 'object'); // Activities are more loose

    const translateIds = (ids: any) => {
      let idArray = [];
      if (typeof ids === 'string') {
        try { idArray = JSON.parse(ids); } catch { idArray = []; }
      } else if (Array.isArray(ids)) {
        idArray = ids;
      } else {
        return "[]";
      }
      return JSON.stringify(idArray.map(id => idMap.get(id) || id));
    };

    // 2. Process Workspaces
    for (const ws of validWorkspaces) {
      try {
        const newId = idMap.get(ws.id);
        await prisma.workspace.create({
          data: {
            id: newId,
            name: ws.name,
            description: ws.description,
            color: ws.color,
            icon: ws.icon,
            userId: userId,
            createdAt: ws.createdAt || new Date(),
            updatedAt: ws.updatedAt || new Date(),
            deletedAt: null,
          },
        });
        results.push({ success: true, type: 'Workspace', id: ws.id, name: ws.name });
      } catch (err: any) {
        results.push({ success: false, type: 'Workspace', id: ws.id, name: ws.name, error: `Error DB: ${err.message}` });
      }
    }

    // 3. Process Groups
    for (const group of validGroups) {
      try {
        const newWsId = idMap.get(group.workspaceId);
        if (!newWsId) throw new Error(`El workspace asociado no se encontró o falló al importarse`);
        
        const newId = idMap.get(group.id);
        await prisma.group.create({
          data: {
            id: newId,
            name: group.name,
            description: group.description,
            color: group.color,
            icon: group.icon,
            workspaceId: newWsId,
            createdAt: group.createdAt || new Date(),
            updatedAt: group.updatedAt || new Date(),
            deletedAt: null,
          },
        });
        results.push({ success: true, type: 'Group', id: group.id, name: group.name });
      } catch (err: any) {
        results.push({ success: false, type: 'Group', id: group.id, name: group.name, error: `Error DB: ${err.message}` });
      }
    }

    // 4. Process Connections
    for (const conn of validConnections) {
      try {
        const newWsId = idMap.get(conn.workspaceId);
        if (!newWsId) throw new Error(`El workspace asociado no se encontró o falló al importarse`);

        const newId = idMap.get(conn.id);
        await prisma.connection.create({
          data: {
            id: newId,
            name: conn.name,
            type: conn.type,
            host: conn.host,
            port: conn.port,
            workspaceId: newWsId,
            noteIds: translateIds(conn.noteIds),
            snippetIds: translateIds(conn.snippetIds),
            createdAt: conn.createdAt || new Date(),
            updatedAt: conn.updatedAt || new Date(),
            deletedAt: null,
          },
        });

        // Si vienen credenciales anidadas, importarlas
        const rawCreds: any[] = Array.isArray(conn.credentials) ? conn.credentials : [];
        if (rawCreds.length > 0) {
          const validCreds: any[] = [];
          for (const c of rawCreds) {
            const parsed = credentialSchema.safeParse(c);
            if (!parsed.success) continue; // ignorar credenciales inválidas
            const cred = parsed.data as any;

            // Determinar si usamos password plano o ya cifrado
            let encryptedPassword = cred.encryptedPassword as string | undefined;
            let passwordIv = cred.passwordIv as string | undefined;
            let passwordAuthTag = cred.passwordAuthTag as string | undefined;

            if ((cred.password ?? '') !== '') {
              const { encrypted, iv, authTag } = encrypt(cred.password);
              encryptedPassword = encrypted;
              passwordIv = iv;
              passwordAuthTag = authTag;
            }

            if (encryptedPassword && passwordIv && passwordAuthTag) {
              validCreds.push({
                id: randomUUID(),
                username: cred.username || '',
                encryptedPassword,
                passwordIv,
                passwordAuthTag,
                keyVersion: cred.keyVersion || 1,
                connectionId: newId,
                createdAt: cred.createdAt || new Date(),
              });
            }
          }

          if (validCreds.length > 0) {
            await prisma.credential.createMany({ data: validCreds });
          }
        }
        results.push({ success: true, type: 'Connection', id: conn.id, name: conn.name });
      } catch (err: any) {
        results.push({ success: false, type: 'Connection', id: conn.id, name: conn.name, error: `Error DB: ${err.message}` });
      }
    }

    // 5. Process Notes
    for (const note of validNotes) {
      try {
        const newWsId = idMap.get(note.workspaceId);
        if (!newWsId) throw new Error(`El workspace asociado no se encontró o falló al importarse`);

        const newId = idMap.get(note.id);
        await prisma.note.create({
          data: {
            id: newId,
            title: note.title,
            content: note.content,
            category: note.category,
            tags: typeof note.tags === 'string' ? note.tags : JSON.stringify(note.tags || []),
            technologies: typeof note.technologies === 'string' ? note.technologies : JSON.stringify(note.technologies || []),
            links: typeof note.links === 'string' ? note.links : JSON.stringify(note.links || []),
            snippetIds: translateIds(note.snippetIds),
            isFavorite: note.isFavorite,
            isArchived: note.isArchived,
            workspaceId: newWsId,
            groupId: note.groupId ? idMap.get(note.groupId) : null,
            createdAt: note.createdAt || new Date(),
            updatedAt: note.updatedAt || new Date(),
            deletedAt: null,
          },
        });
        results.push({ success: true, type: 'Note', id: note.id, name: note.title });
      } catch (err: any) {
        results.push({ success: false, type: 'Note', id: note.id, name: note.title, error: `Error DB: ${err.message}` });
      }
    }

    // 6. Process Snippets
    for (const snippet of validSnippets) {
      try {
        const newWsId = idMap.get(snippet.workspaceId);
        if (!newWsId) throw new Error(`El workspace asociado no se encontró o falló al importarse`);

        const newId = idMap.get(snippet.id);
        await prisma.snippet.create({
          data: {
            id: newId,
            title: snippet.title,
            code: snippet.code,
            language: snippet.language,
            framework: snippet.framework,
            description: snippet.description,
            tags: typeof snippet.tags === 'string' ? snippet.tags : JSON.stringify(snippet.tags || []),
            noteIds: translateIds(snippet.noteIds),
            isFavorite: snippet.isFavorite,
            usageCount: snippet.usageCount,
            workspaceId: newWsId,
            groupId: snippet.groupId ? idMap.get(snippet.groupId) : null,
            createdAt: snippet.createdAt || new Date(),
            updatedAt: snippet.updatedAt || new Date(),
            deletedAt: null,
          },
        });
        results.push({ success: true, type: 'Snippet', id: snippet.id, name: snippet.title });
      } catch (err: any) {
        results.push({ success: false, type: 'Snippet', id: snippet.id, name: snippet.title, error: `Error DB: ${err.message}` });
      }
    }

    // 7. Process Notifications
    for (const notif of validNotifications) {
      try {
        const newId = idMap.get(notif.id);
        const newWsId = notif.workspaceId ? idMap.get(notif.workspaceId) : null;
        
        await prisma.notification.create({
          data: {
            id: newId,
            title: notif.title,
            message: notif.message,
            type: notif.type,
            read: notif.read,
            timestamp: notif.timestamp || new Date(),
            link: notif.link,
            workspaceId: newWsId,
            userId: userId,
          },
        });
        results.push({ success: true, type: 'Notification', id: notif.id, name: notif.title });
      } catch (err: any) {
        results.push({ success: false, type: 'Notification', id: notif.id, name: notif.title, error: `Error DB: ${err.message}` });
      }
    }

    // 8. Process Activities
    for (const act of validActivities) {
      try {
        const newId = randomUUID(); 
        const newEntityId = idMap.get(act.entityId) || act.entityId || 'unknown';
        
        await prisma.activity.create({
          data: {
            id: newId,
            type: act.type || 'unknown',
            entityType: act.entityType || 'unknown',
            entityId: newEntityId,
            entityTitle: act.entityTitle || 'Sin título',
            timestamp: act.timestamp ? new Date(act.timestamp) : new Date(),
            userId: userId,
          },
        });
      } catch (err: any) {
        console.warn(`Failed to import activity: ${err.message}`);
      }
    }

    const summary = {
      total: results.length,
      successCount: results.filter(r => r.success).length,
      errorCount: results.filter(r => !r.success).length,
      details: results
    };

    res.json(summary);
  } catch (error: any) {
    console.error('Import error:', error);
    res.status(500).json({ error: 'Error al procesar la importación', details: error.message });
  }
});

export default router;
