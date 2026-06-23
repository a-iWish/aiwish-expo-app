import {
  emitTokensRefreshed,
  emitUnauthorized,
  getAccessToken,
  getRefreshToken,
} from './session';
import { AuthTokens } from '../types/auth';

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, '') ?? 'http://localhost:8000';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function parseError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    if (data?.detail) {
      return typeof data.detail === 'string'
        ? data.detail
        : JSON.stringify(data.detail);
    }
  } catch {
    // not JSON
  }
  return res.statusText || `Request failed (${res.status})`;
}

// Ensures concurrent 401s trigger a single refresh round-trip.
let refreshPromise: Promise<AuthTokens | null> | null = null;

async function refreshTokens(): Promise<AuthTokens | null> {
  const refresh_token = getRefreshToken();
  if (!refresh_token) return null;

  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token }),
        });
        if (!res.ok) return null;
        const data = await res.json();
        const tokens: AuthTokens = {
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
        };
        emitTokensRefreshed(tokens);
        return tokens;
      } catch {
        return null;
      } finally {
        refreshPromise = null;
      }
    })();
  }

  return refreshPromise;
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  auth?: boolean;
}

export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, auth = true, headers, ...rest } = options;

  const buildHeaders = (): Record<string, string> => {
    const h: Record<string, string> = {
      Accept: 'application/json',
      ...(headers as Record<string, string> | undefined),
    };
    if (body !== undefined) h['Content-Type'] = 'application/json';
    const token = getAccessToken();
    if (auth && token) h.Authorization = `Bearer ${token}`;
    return h;
  };

  const doFetch = () =>
    fetch(`${API_BASE_URL}${path}`, {
      ...rest,
      headers: buildHeaders(),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

  let res = await doFetch();

  if (res.status === 401 && auth && getRefreshToken()) {
    const refreshed = await refreshTokens();
    if (refreshed) {
      res = await doFetch();
    } else {
      emitUnauthorized();
    }
  }

  if (!res.ok) {
    throw new ApiError(res.status, await parseError(res));
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
