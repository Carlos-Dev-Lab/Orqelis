export interface Note {
  id: string;
  title: string;
  content: string;
  category: 'frontend' | 'backend' | 'database' | 'infrastructure' | 'devops' | 'docs';
  tags: string[];
  technologies: string[];
  links: string[]; // Bidirectional links [[Note Title]]
  snippetIds: string[];
  createdAt: string | Date;
  updatedAt: string | Date;
  deletedAt?: string | Date | null;
  isFavorite: boolean;
  isArchived: boolean;
  workspaceId: string;
  groupId?: string | null;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  workspaceId: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  deletedAt?: string | Date | null;
}

export interface Snippet {
  id: string;
  title: string;
  code: string;
  language: string;
  framework?: string;
  description: string;
  tags: string[];
  noteIds: string[];
  createdAt: string | Date;
  updatedAt: string | Date;
  deletedAt?: string | Date | null;
  isFavorite: boolean;
  usageCount: number;
  workspaceId: string;
  groupId?: string | null;
}

export interface Workspace {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  deletedAt?: string | Date | null;
  isActive: boolean;
}

export interface Activity {
  id: string;
  type: 'create' | 'edit' | 'delete' | 'view' | 'favorite' | 'link';
  entityType: 'note' | 'snippet' | 'workspace';
  entityId: string;
  entityTitle: string;
  timestamp: string | Date;
  userId?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  timestamp: string | Date;
  link?: string;
  workspaceId?: string;
  userId?: string;
}

export interface Credential {
  id: string;
  username: string;
  password?: string;
  connectionId: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface Connection {
  id: string;
  name: string;
  type: 'ssh' | 'web' | 'database';
  host: string;
  port?: number | null;
  workspaceId: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  deletedAt?: string | Date | null;
  credentials?: Credential[];
  noteIds: string[];
  snippetIds: string[];
}
