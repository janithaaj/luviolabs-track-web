const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

const TOKEN_KEY = 'luvio_track_token_v2';
const REFRESH_KEY = 'luvio_track_refresh_v2';
const SESSION_COOKIE = 'luvio_session';

function sessionStore(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function setSessionCookie(on: boolean) {
  if (typeof document === 'undefined') return;
  if (on) {
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${SESSION_COOKIE}=1; Path=/; Max-Age=3600; SameSite=Lax${secure}`;
  } else {
    document.cookie = `${SESSION_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
  }
}

/** Token + small client prefs helpers (no domain mock data). */
export const apiStorage = {
  getToken(): string | null {
    const s = sessionStore();
    if (!s) return null;
    return s.getItem(TOKEN_KEY);
  },

  setToken(token: string | null): void {
    const s = sessionStore();
    if (!s) return;
    if (token) {
      s.setItem(TOKEN_KEY, token);
      try {
        localStorage.removeItem(TOKEN_KEY);
      } catch {
        /* ignore */
      }
      setSessionCookie(true);
    } else {
      s.removeItem(TOKEN_KEY);
      try {
        localStorage.removeItem(TOKEN_KEY);
      } catch {
        /* ignore */
      }
      setSessionCookie(false);
    }
  },

  getRefreshToken(): string | null {
    // Refresh tokens are not kept in the browser until a refresh endpoint exists.
    return null;
  },

  setRefreshToken(_token: string | null): void {
    const s = sessionStore();
    s?.removeItem(REFRESH_KEY);
    try {
      localStorage.removeItem(REFRESH_KEY);
    } catch {
      /* ignore */
    }
  },

  /** Generic prefs (settings, saved reports) — never seeds business/mock data. */
  getJson<T>(key: string, fallback: T): T {
    if (typeof window === 'undefined') return fallback;
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  },

  setJson<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('Failed to write localStorage', e);
    }
  },

  /** Aliases for callers/bundlers that still expect getItem/setItem */
  getItem<T>(key: string, fallback: T): T {
    return apiStorage.getJson(key, fallback);
  },

  setItem<T>(key: string, value: T): void {
    apiStorage.setJson(key, value);
  },
};

export { API_BASE_URL };

const AUTH_PERSIST_KEY = 'luvio-track-auth-v4';

let unauthorizedHandler: (() => void) | null = null;
let loggingOut = false;

/** Register a callback (e.g. zustand logout) for session expiry. */
export function setUnauthorizedHandler(handler: (() => void) | null): void {
  unauthorizedHandler = handler;
}

function isAuthLoginEndpoint(endpoint: string): boolean {
  const path = endpoint.split('?')[0];
  return path === '/auth/login' || path.endsWith('/auth/login');
}

/** Clear session and send user to login when the API rejects the token. */
function forceLogoutOnUnauthorized(): void {
  if (typeof window === 'undefined' || loggingOut) return;
  loggingOut = true;
  try {
    apiStorage.setToken(null);
    apiStorage.setRefreshToken(null);
    try {
      localStorage.removeItem(AUTH_PERSIST_KEY);
    } catch {
      /* ignore */
    }
    unauthorizedHandler?.();
    const path = window.location.pathname + window.location.search;
    if (!path.startsWith('/login')) {
      const next = encodeURIComponent(path);
      window.location.assign(`/login?next=${next}&reason=session`);
    }
  } finally {
    // Allow future 401s after a full navigation / re-login
    window.setTimeout(() => {
      loggingOut = false;
    }, 1500);
  }
}

function formatErrorMessage(errorData: unknown, status: number): string {
  if (!errorData || typeof errorData !== 'object') {
    return `HTTP ${status}`;
  }
  const data = errorData as Record<string, unknown>;
  const msg = data.message ?? data.error;
  if (Array.isArray(msg)) return msg.join(', ');
  if (typeof msg === 'string') return msg;
  if (msg && typeof msg === 'object') return JSON.stringify(msg);
  return `HTTP ${status}`;
}

export async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data: T | null; error: string | null; status?: number }> {
  try {
    const token = apiStorage.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 204) {
      return { data: null, error: null, status: 204 };
    }

    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
      // Expired / invalid JWT — end the session (skip login failures)
      if (response.status === 401 && !isAuthLoginEndpoint(endpoint)) {
        forceLogoutOnUnauthorized();
      }
      return {
        data: null,
        error: formatErrorMessage(body, response.status),
        status: response.status,
      };
    }

    return { data: body as T, error: null, status: response.status };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Network connection error';
    return { data: null, error: message || 'Network connection error' };
  }
}
