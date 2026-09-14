/**
 * API client layer — server-first architecture.
 *
 * All data operations go through the REST API backend.
 * No Dexie/IndexedDB. No local storage for critical data.
 * Zustand store is the only in-memory state layer.
 */

import { useAppStore } from '@/shared/store';

export const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || '/api';

// ─── Online/Offline Tracking ─────────────────────────────────────────────────

let isOffline = false;
let isDbOffline = false;
let lastCheck = 0;
const CHECK_INTERVAL = 60000;

type StatusListener = (online: boolean) => void;
const listeners: StatusListener[] = [];

export const onServerStatusChange = (listener: StatusListener) => {
  listeners.push(listener);
  return () => {
    const index = listeners.indexOf(listener);
    if (index > -1) listeners.splice(index, 1);
  };
};

const notifyListeners = (online: boolean) => {
  listeners.forEach(l => l(online));
};

export const checkServerStatus = async (force = false) => {
  const now = Date.now();
  if (!force && now - lastCheck < CHECK_INTERVAL && isOffline) return false;

  const wasOffline = isOffline;
  const wasDbOffline = isDbOffline;

  try {
    const healthUrl = API_BASE.replace('/api', '') + '/health';
    const res = await fetch(healthUrl, {
      method: 'GET',
      // @ts-ignore
      signal: AbortSignal.timeout(2000),
    });

    if (res.ok) {
      const data = await res.json();
      isOffline = false;
      isDbOffline = data.database !== 'connected';
      useAppStore.getState().setServerOnline(true);
      useAppStore.getState().setDbOnline(data.database === 'connected');
    } else {
      isOffline = true;
      isDbOffline = true;
      useAppStore.getState().setServerOnline(false);
      useAppStore.getState().setDbOnline(false);
    }
  } catch {
    isOffline = true;
    isDbOffline = true;
    useAppStore.getState().setServerOnline(false);
    useAppStore.getState().setDbOnline(false);
  }

  if (wasOffline !== isOffline || wasDbOffline !== isDbOffline) {
    notifyListeners(!isOffline && !isDbOffline);
  }

  lastCheck = now;
  return !isOffline && !isDbOffline;
};

export const getDbStatus = () => !isDbOffline;

// ─── Token Refresh Queue ──────────────────────────────────────────────────────

let isRefreshing = false;
let refreshSubscribers: ((token: string | null) => void)[] = [];

const subscribeTokenRefresh = (cb: (token: string | null) => void) => {
  refreshSubscribers.push(cb);
};

const onTokenRefreshed = (token: string | null) => {
  const subscribers = [...refreshSubscribers];
  refreshSubscribers = [];
  subscribers.forEach(cb => cb(token));
};

function isTokenExpired(token: string): boolean {
  if (!token) return true;
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(jsonPayload);
    return payload.exp * 1000 < Date.now() + 30000;
  } catch {
    return true;
  }
}

// ─── Core HTTP Client ─────────────────────────────────────────────────────────

const fetchWithOfflineCheck = async (url: string, options: RequestInit = {}): Promise<Response> => {
  if (isOffline && !url.includes('/health')) {
    throw new Error('Offline');
  }

  options.credentials = 'include';

  let token = useAppStore.getState().token;

  // Pre-emptively refresh if token is about to expire
  if (token && isTokenExpired(token) && !url.includes('/auth/login') && !url.includes('/auth/refresh')) {
    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const refreshUrl = `${API_BASE}/auth/refresh`.replace(/([^:])\/+/g, '$1/');
        const refreshRes = await fetch(refreshUrl, {
          method: 'POST',
          credentials: 'include',
          // @ts-ignore
          signal: AbortSignal.timeout(10000),
        });

        if (refreshRes.ok) {
          const data = await refreshRes.json();
          if (!data.user?.id) {
            onTokenRefreshed(null);
            useAppStore.getState().logout();
            throw new Error('Session expired');
          }
          const currentUser = useAppStore.getState().user;
          if (currentUser && data.user.id !== currentUser.id) {
            onTokenRefreshed(null);
            useAppStore.getState().logout();
            throw new Error('User mismatch');
          }
          token = data.accessToken;
          if (typeof window !== 'undefined') {
            localStorage.setItem('orqelis-token', data.accessToken);
            localStorage.setItem('orqelis-user', JSON.stringify(data.user));
          }
          useAppStore.setState({ token: data.accessToken, user: data.user, isAuthenticated: true });
          onTokenRefreshed(data.accessToken);
        } else {
          onTokenRefreshed(null);
          useAppStore.getState().logout();
          throw new Error('Session expired');
        }
      } catch (err) {
        onTokenRefreshed(null);
        throw err;
      } finally {
        isRefreshing = false;
      }
    } else {
      const newToken = await new Promise<string | null>(resolve => subscribeTokenRefresh(resolve));
      if (!newToken) throw new Error('Session expired');
      token = newToken;
    }
  }

  const headers = new Headers(options.headers || {});
  if (token) headers.set('Authorization', `Bearer ${token}`);
  options.headers = headers;

  try {
    let res = await fetch(url, options);

    // Retry once after 401 with a fresh token
    if (res.status === 401 && !url.includes('/auth/login') && !url.includes('/auth/refresh')) {
      if (isRefreshing) {
        const newToken = await new Promise<string | null>(resolve => subscribeTokenRefresh(resolve));
        if (!newToken) return res;
        const h = new Headers(options.headers);
        h.set('Authorization', `Bearer ${newToken}`);
        return fetch(url, { ...options, headers: h });
      }

      isRefreshing = true;
      try {
        const refreshUrl = `${API_BASE}/auth/refresh`.replace(/([^:])\/+/g, '$1/');
        const refreshRes = await fetch(refreshUrl, {
          method: 'POST',
          credentials: 'include',
          // @ts-ignore
          signal: AbortSignal.timeout(10000),
        });

        if (refreshRes.ok) {
          const { accessToken, user } = await refreshRes.json();
          if (!user?.id) { onTokenRefreshed(null); useAppStore.getState().logout(); return res; }
          const currentUser = useAppStore.getState().user;
          if (currentUser && user.id !== currentUser.id) {
            onTokenRefreshed(null); useAppStore.getState().logout(); return res;
          }
          if (typeof window !== 'undefined') {
            localStorage.setItem('orqelis-token', accessToken);
            localStorage.setItem('orqelis-user', JSON.stringify(user));
          }
          useAppStore.setState({ token: accessToken, user, isAuthenticated: true });
          onTokenRefreshed(accessToken);
          const h = new Headers(options.headers);
          h.set('Authorization', `Bearer ${accessToken}`);
          res = await fetch(url, { ...options, headers: h });
        } else {
          onTokenRefreshed(null);
          useAppStore.getState().logout();
        }
      } catch {
        onTokenRefreshed(null);
        useAppStore.getState().logout();
      } finally {
        isRefreshing = false;
      }
    }

    if (isOffline) { isOffline = false; notifyListeners(true); }
    return res;
  } catch (err) {
    if (!isOffline) { isOffline = true; notifyListeners(false); }
    throw err;
  }
};

const jsonHeaders = () => ({ 'Content-Type': 'application/json' });

async function handleResponse<T>(res: Response): Promise<T> {
  const contentType = res.headers.get('content-type');
  
  if (res.status === 204) {
    return {} as T;
  }

  if (!res.ok) {
    let errorMessage = `Request failed: ${res.status}`;
    try {
      if (contentType && contentType.includes('application/json')) {
        const err = await res.json();
        // Common patterns: { error: string } or { error: { message, fieldErrors } } (e.g., Zod)
        if (typeof err?.error === 'string') {
          errorMessage = err.error;
        } else if (err?.error && typeof err.error === 'object') {
          const maybeMsg = err.error.message || err.message;
          if (typeof maybeMsg === 'string' && maybeMsg.trim()) {
            errorMessage = maybeMsg;
          } else if (err.error.fieldErrors && typeof err.error.fieldErrors === 'object') {
            // Flatten Zod field errors into a readable message
            const parts: string[] = [];
            for (const [field, msgs] of Object.entries(err.error.fieldErrors as Record<string, string[] | undefined>)) {
              if (Array.isArray(msgs) && msgs.length) {
                parts.push(`${field}: ${msgs.join(', ')}`);
              }
            }
            if (parts.length) errorMessage = parts.join(' | ');
          } else {
            // Last resort: stringify
            errorMessage = JSON.stringify(err.error);
          }
        } else if (typeof err?.message === 'string') {
          errorMessage = err.message;
        }
      }
    } catch (e) {
      // Fallback to status text
    }
    throw new Error(errorMessage);
  }

  if (!contentType || !contentType.includes('application/json')) {
    throw new Error('Invalid server response (not JSON). Please check if the backend is running and correctly configured.');
  }

  return res.json() as Promise<T>;
}

// ─── Auth API ─────────────────────────────────────────────────────────────────

export const authApi = {
  async login(email: string, password?: string) {
    const res = await fetchWithOfflineCheck(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify({ email, password }),
    });
    const data = await handleResponse<any>(res);
    if (data.accessToken) {
      useAppStore.getState().login(data.accessToken, data.user);
    }
    return data;
  },

  async loginWithGoogle(credential: string) {
    const res = await fetchWithOfflineCheck(`${API_BASE}/auth/google`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify({ credential }),
    });
    const data = await handleResponse<any>(res);
    if (data.accessToken) {
      useAppStore.getState().login(data.accessToken, data.user);
    }
    return data;
  },

  async logout() {
    try {
      await fetchWithOfflineCheck(`${API_BASE}/auth/logout`, { method: 'POST' });
    } catch { /* ignore */ }
    useAppStore.getState().logout();
  },

  async getMe() {
    try {
      const res = await fetchWithOfflineCheck(`${API_BASE}/auth/me`);
      if (res.ok) return res.json();
    } catch { /* ignore */ }
    if (!isOffline) useAppStore.getState().logout();
    return null;
  },

  async updateProfile(updates: { name?: string; image?: string }) {
    const res = await fetchWithOfflineCheck(`${API_BASE}/auth/me`, {
      method: 'PATCH',
      headers: jsonHeaders(),
      body: JSON.stringify(updates),
    });
    const user = await handleResponse<any>(res);
    useAppStore.setState({ user });
    return user;
  },
};

// ─── Workspaces API ───────────────────────────────────────────────────────────

export const workspacesApi = {
  async getAll() {
    const res = await fetchWithOfflineCheck(`${API_BASE}/workspaces`);
    return handleResponse<any[]>(res);
  },

  async create(data: any) {
    const res = await fetchWithOfflineCheck(`${API_BASE}/workspaces`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  async update(id: string, updates: any) {
    const res = await fetchWithOfflineCheck(`${API_BASE}/workspaces/${id}`, {
      method: 'PATCH',
      headers: jsonHeaders(),
      body: JSON.stringify(updates),
    });
    return handleResponse<any>(res);
  },

  async remove(id: string) {
    const res = await fetchWithOfflineCheck(`${API_BASE}/workspaces/${id}`, { method: 'DELETE' });
    return handleResponse<any>(res);
  },

  async activate(id: string) {
    const res = await fetchWithOfflineCheck(`${API_BASE}/workspaces/${id}/activate`, { method: 'PATCH' });
    return handleResponse<any>(res);
  },
};

// ─── Groups API ───────────────────────────────────────────────────────────────

export const groupsApi = {
  async getAll(workspaceId: string) {
    const res = await fetchWithOfflineCheck(`${API_BASE}/groups?workspaceId=${encodeURIComponent(workspaceId)}`);
    return handleResponse<any[]>(res);
  },

  async create(data: any) {
    // Ensure required fields expected by the backend exist (icon is required in API schema)
    const payload = { icon: 'FolderOpen', ...data };
    const res = await fetchWithOfflineCheck(`${API_BASE}/groups`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<any>(res);
  },

  async update(id: string, updates: any) {
    const res = await fetchWithOfflineCheck(`${API_BASE}/groups/${id}`, {
      method: 'PATCH',
      headers: jsonHeaders(),
      body: JSON.stringify(updates),
    });
    return handleResponse<any>(res);
  },

  async remove(id: string) {
    const res = await fetchWithOfflineCheck(`${API_BASE}/groups/${id}`, { method: 'DELETE' });
    return handleResponse<any>(res);
  },
};

// ─── Notes API ────────────────────────────────────────────────────────────────

export const notesApi = {
  async getAll(workspaceId: string) {
    const res = await fetchWithOfflineCheck(`${API_BASE}/notes?workspaceId=${encodeURIComponent(workspaceId)}`);
    return handleResponse<any[]>(res);
  },

  async create(data: any) {
    const res = await fetchWithOfflineCheck(`${API_BASE}/notes`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  async update(id: string, updates: any) {
    const res = await fetchWithOfflineCheck(`${API_BASE}/notes/${id}`, {
      method: 'PATCH',
      headers: jsonHeaders(),
      body: JSON.stringify(updates),
    });
    return handleResponse<any>(res);
  },

  async remove(id: string) {
    const res = await fetchWithOfflineCheck(`${API_BASE}/notes/${id}`, { method: 'DELETE' });
    return handleResponse<any>(res);
  },

  async assignGroup(noteId: string, groupId: string | null) {
    const res = await fetchWithOfflineCheck(`${API_BASE}/notes/${noteId}/group`, {
      method: 'PATCH',
      headers: jsonHeaders(),
      body: JSON.stringify({ groupId }),
    });
    return handleResponse<any>(res);
  },
};

// ─── Snippets API ─────────────────────────────────────────────────────────────

export const snippetsApi = {
  async getAll(workspaceId: string) {
    const res = await fetchWithOfflineCheck(`${API_BASE}/snippets?workspaceId=${encodeURIComponent(workspaceId)}`);
    return handleResponse<any[]>(res);
  },

  async create(data: any) {
    const res = await fetchWithOfflineCheck(`${API_BASE}/snippets`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  async update(id: string, updates: any) {
    const res = await fetchWithOfflineCheck(`${API_BASE}/snippets/${id}`, {
      method: 'PATCH',
      headers: jsonHeaders(),
      body: JSON.stringify(updates),
    });
    return handleResponse<any>(res);
  },

  async remove(id: string) {
    const res = await fetchWithOfflineCheck(`${API_BASE}/snippets/${id}`, { method: 'DELETE' });
    return handleResponse<any>(res);
  },

  async assignGroup(snippetId: string, groupId: string | null) {
    const res = await fetchWithOfflineCheck(`${API_BASE}/snippets/${snippetId}/group`, {
      method: 'PATCH',
      headers: jsonHeaders(),
      body: JSON.stringify({ groupId }),
    });
    return handleResponse<any>(res);
  },

  async incrementUsage(id: string) {
    const res = await fetchWithOfflineCheck(`${API_BASE}/snippets/${id}/usage`, { method: 'PATCH' });
    return handleResponse<any>(res);
  },
};

// ─── Connections API ──────────────────────────────────────────────────────────

export const connectionsApi = {
  async getAll(workspaceId: string) {
    const res = await fetchWithOfflineCheck(`${API_BASE}/connections?workspaceId=${encodeURIComponent(workspaceId)}`);
    return handleResponse<any[]>(res);
  },

  async create(data: any) {
    const res = await fetchWithOfflineCheck(`${API_BASE}/connections`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  async update(id: string, updates: any) {
    const res = await fetchWithOfflineCheck(`${API_BASE}/connections/${id}`, {
      method: 'PATCH',
      headers: jsonHeaders(),
      body: JSON.stringify(updates),
    });
    return handleResponse<any>(res);
  },

  async remove(id: string) {
    const res = await fetchWithOfflineCheck(`${API_BASE}/connections/${id}`, { method: 'DELETE' });
    return handleResponse<any>(res);
  },
};

// ─── Notifications API ────────────────────────────────────────────────────────

export const notificationsApi = {
  async getAll() {
    const res = await fetchWithOfflineCheck(`${API_BASE}/notifications`);
    return handleResponse<any[]>(res);
  },

  async create(data: any) {
    const res = await fetchWithOfflineCheck(`${API_BASE}/notifications`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  async markRead(id: string) {
    const res = await fetchWithOfflineCheck(`${API_BASE}/notifications/${id}/read`, { method: 'PATCH' });
    return handleResponse<any>(res);
  },

  async markAllRead() {
    const res = await fetchWithOfflineCheck(`${API_BASE}/notifications/read-all`, { method: 'PATCH' });
    return handleResponse<any>(res);
  },

  async remove(id: string) {
    const res = await fetchWithOfflineCheck(`${API_BASE}/notifications/${id}`, { method: 'DELETE' });
    return handleResponse<any>(res);
  },

  async clear() {
    const res = await fetchWithOfflineCheck(`${API_BASE}/notifications`, { method: 'DELETE' });
    return handleResponse<any>(res);
  },
};

// ─── Activities API ───────────────────────────────────────────────────────────

export const activitiesApi = {
  async getAll() {
    const res = await fetchWithOfflineCheck(`${API_BASE}/activities`);
    return handleResponse<any[]>(res);
  },

  async create(data: { id: string; type: string; entityType: string; entityId: string; entityTitle: string }) {
    const res = await fetchWithOfflineCheck(`${API_BASE}/activities`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },
};

// ─── Admin API ────────────────────────────────────────────────────────────────

export const adminApi = {
  async createUser(userData: any) {
    const res = await fetchWithOfflineCheck(`${API_BASE}/admin/users`, {
      method: 'POST', headers: jsonHeaders(), body: JSON.stringify(userData),
    });
    return handleResponse<any>(res);
  },
  async listUsers() {
    const res = await fetchWithOfflineCheck(`${API_BASE}/admin/users`);
    return handleResponse<any>(res);
  },
  async updateUser(id: string, updates: any) {
    const res = await fetchWithOfflineCheck(`${API_BASE}/admin/users/${id}`, {
      method: 'PATCH', headers: jsonHeaders(), body: JSON.stringify(updates),
    });
    return handleResponse<any>(res);
  },
  async deleteUser(id: string) {
    const res = await fetchWithOfflineCheck(`${API_BASE}/admin/users/${id}`, { method: 'DELETE' });
    return handleResponse<any>(res);
  },
  async listAuditLogs(page = 1, limit = 50) {
    const res = await fetchWithOfflineCheck(`${API_BASE}/admin/audit-logs?page=${page}&limit=${limit}`);
    return handleResponse<any>(res);
  },
  async purgeUserData(id: string) {
    const res = await fetchWithOfflineCheck(`${API_BASE}/admin/users/${id}/purge`, {
      method: 'POST', headers: jsonHeaders(), body: JSON.stringify({ confirmation: 'ELIMINAR DATOS' }),
    });
    return handleResponse<any>(res);
  },
  async getUserStorage(id: string) {
    const res = await fetchWithOfflineCheck(`${API_BASE}/admin/users/${id}/storage`);
    return handleResponse<any>(res);
  },
  async getUserSessions(id: string) {
    const res = await fetchWithOfflineCheck(`${API_BASE}/admin/users/${id}/sessions`);
    return handleResponse<any>(res);
  },
  async revokeAllUserSessions(id: string) {
    const res = await fetchWithOfflineCheck(`${API_BASE}/admin/users/${id}/sessions`, { method: 'DELETE' });
    return handleResponse<any>(res);
  },
};

// ─── DB Config API ────────────────────────────────────────────────────────────

export const dbConfigApi = {
  async getConfig() {
    const res = await fetchWithOfflineCheck(`${API_BASE}/db/config`);
    return handleResponse<any>(res);
  },
  async setConfig(config: { provider: string; url: string }) {
    const res = await fetchWithOfflineCheck(`${API_BASE}/db/config`, {
      method: 'POST', headers: jsonHeaders(), body: JSON.stringify(config),
    });
    return handleResponse<any>(res);
  },
};

// ─── Setup API ────────────────────────────────────────────────────────────────

export const setupApi = {
  async getStatus(refresh = false) {
    try {
      const url = refresh ? `${API_BASE}/setup/status?refresh=true` : `${API_BASE}/setup/status`;
      const res = await fetch(url);
      if (!res.ok) {
        if (res.status === 503) {
          return await res.json();
        }
        // If it's another error, we can't be sure, but let's not block unless necessary
        return { configured: true, ready: true, database: 'unknown' };
      }
      return await res.json();
    } catch (error) {
      console.error('Failed to fetch setup status:', error);
      return { configured: true, ready: true, database: 'unknown', error: true };
    }
  },
  async configure(data: any, setupToken?: string) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (setupToken) {
      headers['x-setup-token'] = setupToken;
    }
    const res = await fetch(`${API_BASE}/setup`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Setup failed');
    }
    return res.json();
  },
};

// ─── Import API ───────────────────────────────────────────────────────────────

export const importApi = {
  async importData(data: any) {
    const res = await fetchWithOfflineCheck(`${API_BASE}/import`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },
};

// ─── Unified export ───────────────────────────────────────────────────────────

export const api = {
  auth: authApi,
  workspaces: workspacesApi,
  groups: groupsApi,
  notes: notesApi,
  snippets: snippetsApi,
  connections: connectionsApi,
  notifications: notificationsApi,
  activities: activitiesApi,
  admin: adminApi,
  dbConfig: dbConfigApi,
  setup: setupApi,
  import: importApi,
  checkServerStatus,
};
