import { AuthTokens } from '../types/auth';

/**
 * In-memory bridge between the AuthContext (React state) and the plain HTTP
 * client (non-React module). The client reads the current access token from
 * here and notifies the context when tokens are refreshed or invalidated.
 */
let accessToken: string | null = null;
let refreshToken: string | null = null;

let onTokensRefreshed: ((tokens: AuthTokens) => void) | null = null;
let onUnauthorized: (() => void) | null = null;

export function setSessionTokens(tokens: AuthTokens | null): void {
  accessToken = tokens?.accessToken ?? null;
  refreshToken = tokens?.refreshToken ?? null;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function getRefreshToken(): string | null {
  return refreshToken;
}

export function registerSessionCallbacks(callbacks: {
  onTokensRefreshed: (tokens: AuthTokens) => void;
  onUnauthorized: () => void;
}): void {
  onTokensRefreshed = callbacks.onTokensRefreshed;
  onUnauthorized = callbacks.onUnauthorized;
}

export function emitTokensRefreshed(tokens: AuthTokens): void {
  setSessionTokens(tokens);
  onTokensRefreshed?.(tokens);
}

export function emitUnauthorized(): void {
  setSessionTokens(null);
  onUnauthorized?.();
}
