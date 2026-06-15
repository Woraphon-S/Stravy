import { API_BASE } from './config';
import { clearTokens, loadTokens, saveTokens, StoredTokens } from './storage';
import { AuthResult } from './types';

let tokens: StoredTokens | null = null;
let refreshing: Promise<boolean> | null = null;
let onSignOut: (() => void) | null = null;

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

export async function initApi(): Promise<StoredTokens | null> {
  tokens = await loadTokens();
  return tokens;
}

export function setOnSignOut(cb: (() => void) | null): void {
  onSignOut = cb;
}

export async function setSession(result: AuthResult): Promise<void> {
  tokens = { accessToken: result.accessToken, refreshToken: result.refreshToken };
  await saveTokens(tokens);
}

export async function clearSession(): Promise<void> {
  tokens = null;
  await clearTokens();
}

export function getRefreshToken(): string | null {
  return tokens?.refreshToken ?? null;
}

async function doRefresh(): Promise<boolean> {
  if (!tokens) return false;
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: tokens.refreshToken }),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as AuthResult;
    tokens = { accessToken: data.accessToken, refreshToken: data.refreshToken };
    await saveTokens(tokens);
    return true;
  } catch {
    return false;
  }
}

function refreshOnce(): Promise<boolean> {
  if (!refreshing) {
    refreshing = doRefresh().finally(() => {
      refreshing = null;
    });
  }
  return refreshing;
}

export interface RequestOptions {
  method?: string;
  body?: unknown;
  auth?: boolean;
  raw?: boolean;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true, raw = false } = options;

  const exec = (): Promise<Response> => {
    const headers: Record<string, string> = {};
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (auth && tokens) headers['Authorization'] = `Bearer ${tokens.accessToken}`;
    return fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  };

  let res = await exec();

  if (res.status === 401 && auth && tokens) {
    const refreshed = await refreshOnce();
    if (refreshed) {
      res = await exec();
    }
    if (!refreshed || res.status === 401) {
      await clearSession();
      if (onSignOut) onSignOut();
    }
  }

  if (!res.ok) {
    throw new ApiError(res.status, await extractError(res));
  }

  if (raw) return (await res.text()) as unknown as T;
  if (res.status === 204) return undefined as unknown as T;
  return (await res.json()) as T;
}

async function extractError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    if (data && typeof data.message === 'string') return data.message;
    if (data && Array.isArray(data.message)) return data.message.join(', ');
  } catch {
    return `Request failed (${res.status})`;
  }
  return `Request failed (${res.status})`;
}
