/**
 * AlignOps API Client
 * Central HTTP client for all backend requests.
 * Automatically attaches Bearer tokens and handles 401 token refresh.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

// ─── Token Storage ────────────────────────────────────────────────────────────

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("alignops_access_token");
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("alignops_refresh_token");
}

export function setTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem("alignops_access_token", accessToken);
  localStorage.setItem("alignops_refresh_token", refreshToken);
}

export function clearTokens(): void {
  localStorage.removeItem("alignops_access_token");
  localStorage.removeItem("alignops_refresh_token");
  localStorage.removeItem("alignops_user");
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("alignops_user");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setStoredUser(user: AuthUser): void {
  localStorage.setItem("alignops_user", JSON.stringify(user));
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "EMPLOYEE" | "MANAGER" | "ADMIN";
  department: string;
  managerId: string | null;
}

export interface ApiErrorDetail {
  field?: string;
  message: string;
}

export interface ApiError {
  code: string;
  message: string;
  details: ApiErrorDetail[];
}

export class AlignOpsApiError extends Error {
  constructor(
    public status: number,
    public apiError: ApiError
  ) {
    super(apiError.message);
    this.name = "AlignOpsApiError";
  }

  /** True when this is a 422 Unprocessable Entity (server-side validation) */
  get isValidationError(): boolean {
    return this.status === 422;
  }

  /** True when the backend signals a cycle window is closed */
  get isWindowClosed(): boolean {
    return this.apiError.code === "WINDOW_CLOSED";
  }

  /** Extract per-field error map for inline form rendering, e.g. { weightage: "Minimum...", title: "..." } */
  get fieldErrors(): Record<string, string> {
    const map: Record<string, string> = {};
    for (const d of this.apiError.details) {
      if (d.field) map[d.field] = d.message;
    }
    return map;
  }
}

// ─── Core Fetch Wrapper ───────────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  retried = false
): Promise<T> {
  const accessToken = getAccessToken();

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...options.headers,
    },
  });

  // Try refreshing the token on 401
  if (response.status === 401 && !retried) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      return apiFetch<T>(path, options, true);
    }
    // Refresh failed — clear tokens and redirect to login
    clearTokens();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new AlignOpsApiError(401, {
      code: "UNAUTHORIZED",
      message: "Session expired. Please log in again.",
      details: [],
    });
  }

  if (!response.ok) {
    let errorPayload: ApiError = {
      code: "UNKNOWN_ERROR",
      message: `Request failed with status ${response.status}`,
      details: [],
    };
    try {
      const body = await response.json();
      // Backend wraps errors in { error: { code, message, details } }
      if (body.error) {
        errorPayload = {
          code: body.error.code || "UNKNOWN_ERROR",
          message: body.error.message || errorPayload.message,
          details: Array.isArray(body.error.details) ? body.error.details : [],
        };
      }
    } catch {
      // ignore parse errors
    }
    throw new AlignOpsApiError(response.status, errorPayload);
  }

  // 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

async function tryRefreshToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const response = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) return false;

    const data: { accessToken: string } = await response.json();
    const storedRefresh = getRefreshToken()!;
    setTokens(data.accessToken, storedRefresh);
    return true;
  } catch {
    return false;
  }
}

// ─── Convenience Methods ──────────────────────────────────────────────────────

export const api = {
  get: <T>(path: string) => apiFetch<T>(path),

  post: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, {
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, {
      method: "PATCH",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  put: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, {
      method: "PUT",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(path: string) =>
    apiFetch<T>(path, { method: "DELETE" }),
};
