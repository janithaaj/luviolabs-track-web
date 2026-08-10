const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

const TOKEN_KEY = 'luvio_track_token_v2';
const REFRESH_KEY = 'luvio_track_refresh_v2';

/** Token + small client prefs helpers (no domain mock data). */
export const apiStorage = {
  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken(token: string | null): void {
    if (typeof window === 'undefined') return;
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  },

  getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(REFRESH_KEY);
  },

  setRefreshToken(token: string | null): void {
    if (typeof window === 'undefined') return;
    if (token) localStorage.setItem(REFRESH_KEY, token);
    else localStorage.removeItem(REFRESH_KEY);
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
