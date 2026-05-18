"use client";

/**
 * AlignOps Auth Context
 * Provides login/logout and the current authenticated user throughout the app.
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import {
  api,
  AuthUser,
  AlignOpsApiError,
  setTokens,
  setStoredUser,
  clearTokens,
  getStoredUser,
  getAccessToken,
} from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: string | null;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTokenState, setRefreshTokenState] = useState<string | null>(null);

  // Rehydrate user from localStorage on first mount
  useEffect(() => {
    const storedUser = getStoredUser();
    const token = getAccessToken();
    if (storedUser && token) {
      setUser(storedUser);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await api.post<LoginResult>("/auth/login", { email, password });
    setTokens(result.accessToken, result.refreshToken);
    setStoredUser(result.user);
    setUser(result.user);
    setRefreshTokenState(result.refreshToken);
  }, []);

  const logout = useCallback(async () => {
    try {
      const stored = localStorage.getItem("alignops_refresh_token");
      if (stored) {
        await api.post("/auth/logout", { refreshToken: stored });
      }
    } catch {
      // ignore — clear tokens regardless
    } finally {
      clearTokens();
      setUser(null);
      setRefreshTokenState(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isLoading, login, logout, refreshToken: refreshTokenState }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
