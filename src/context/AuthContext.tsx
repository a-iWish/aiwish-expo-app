import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  loginRequest,
  registerRequest,
  fetchMe,
  updateProfileRequest,
  changePasswordRequest,
  resendVerificationRequest,
  LoginParams,
  RegisterParams,
  UpdateProfileParams,
} from '../services/auth';
import {
  registerSessionCallbacks,
  setSessionTokens,
} from '../services/session';
import { ApiError } from '../services/httpClient';
import { saveTokens, loadTokens, clearTokens } from '../lib/tokenStorage';
import { AuthResponse, AuthTokens, User } from '../types/auth';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  status: AuthStatus;
  user: User | null;
  isAuthenticated: boolean;
  login: (params: LoginParams) => Promise<void>;
  register: (params: RegisterParams) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (params: UpdateProfileParams) => Promise<void>;
  changePassword: (params: {
    currentPassword: string;
    newPassword: string;
  }) => Promise<void>;
  resendVerification: () => Promise<string>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<User | null>(null);

  const persistSession = useCallback(async (tokens: AuthTokens, nextUser: User) => {
    setSessionTokens(tokens);
    await saveTokens(tokens);
    setUser(nextUser);
    setStatus('authenticated');
  }, []);

  const applyAuthResponse = useCallback(
    async (res: AuthResponse) => {
      await persistSession(
        { accessToken: res.access_token, refreshToken: res.refresh_token },
        res.user,
      );
    },
    [persistSession],
  );

  const logout = useCallback(async () => {
    setSessionTokens(null);
    await clearTokens();
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  // Bridge token refresh / forced-logout events from the HTTP client.
  useEffect(() => {
    registerSessionCallbacks({
      onTokensRefreshed: (tokens) => {
        saveTokens(tokens).catch(() => undefined);
      },
      onUnauthorized: () => {
        clearTokens().catch(() => undefined);
        setUser(null);
        setStatus('unauthenticated');
      },
    });
  }, []);

  // Hydrate from secure storage on startup.
  useEffect(() => {
    (async () => {
      const tokens = await loadTokens();
      if (!tokens) {
        setStatus('unauthenticated');
        return;
      }
      setSessionTokens(tokens);
      try {
        const me = await fetchMe();
        setUser(me);
        setStatus('authenticated');
      } catch (err) {
        const rejected =
          err instanceof ApiError && (err.status === 401 || err.status === 403);
        if (rejected) {
          await clearTokens();
          setSessionTokens(null);
          setStatus('unauthenticated');
        } else {
          setStatus('authenticated');
        }
      }
    })();
  }, []);

  const login = useCallback(
    async (params: LoginParams) => {
      const res = await loginRequest(params);
      await applyAuthResponse(res);
    },
    [applyAuthResponse],
  );

  const register = useCallback(
    async (params: RegisterParams) => {
      const res = await registerRequest(params);
      await applyAuthResponse(res);
    },
    [applyAuthResponse],
  );

  const updateProfile = useCallback(async (params: UpdateProfileParams) => {
    const updated = await updateProfileRequest(params);
    setUser(updated);
  }, []);

  const changePassword = useCallback(
    async (params: { currentPassword: string; newPassword: string }) => {
      await changePasswordRequest(params);
    },
    [],
  );

  const resendVerification = useCallback(async () => {
    const res = await resendVerificationRequest();
    return res.detail;
  }, []);

  const refreshUser = useCallback(async () => {
    const me = await fetchMe();
    setUser(me);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      isAuthenticated: status === 'authenticated',
      login,
      register,
      logout,
      updateProfile,
      changePassword,
      resendVerification,
      refreshUser,
    }),
    [
      status,
      user,
      login,
      register,
      logout,
      updateProfile,
      changePassword,
      resendVerification,
      refreshUser,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};
