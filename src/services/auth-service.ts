import { apiCall, apiStorage } from './api-client';
import { CreateEmployeeInput, Role, User } from '../types';

function normalizeRole(role: unknown): Role {
  const r = String(role || '').toUpperCase();
  return r === 'ADMIN' ? 'ADMIN' : 'EMPLOYEE';
}

/** Map API user document to frontend User. */
export function mapApiUser(raw: Record<string, unknown> | User): User {
  const id = String((raw as any).id || (raw as any)._id || '');
  const firstName = String((raw as any).firstName || '');
  const lastName = String((raw as any).lastName || '');
  const name =
    String((raw as any).name || '').trim() ||
    `${firstName} ${lastName}`.trim() ||
    String((raw as any).email || '');

  const readNum = (...vals: unknown[]): number => {
    for (const v of vals) {
      if (v === null || v === undefined || v === '') continue;
      const n =
        typeof v === 'number'
          ? v
          : parseFloat(String(v).replace(/,/g, '').trim());
      if (Number.isFinite(n)) return n;
    }
    return 0;
  };

  return {
    id,
    name,
    email: String((raw as any).email || ''),
    role: normalizeRole((raw as any).role),
    avatar: (raw as any).avatar || '',
    department: String((raw as any).department || 'General'),
    capacityHours: readNum((raw as any).capacityHours, 40) || 40,
    monthlySalary: readNum(
      (raw as any).monthlySalary,
      (raw as any).monthly_salary,
      (raw as any).salary
    ),
    costRate: readNum((raw as any).costRate, (raw as any).cost_rate),
    billableRate: readNum(
      (raw as any).billableRate,
      (raw as any).defaultBillableRate,
      (raw as any).billable_rate
    ),
    assignedProjectIds: ((raw as any).assignedProjectIds || []).map(String),
    status: ((raw as any).status as User['status']) || 'ACTIVE',
    createdAt: (raw as any).createdAt ? String((raw as any).createdAt) : undefined,
    createdBy: (raw as any).createdBy ? String((raw as any).createdBy) : undefined,
  };
}

export const authService = {
  async login(
    email: string,
    password: string
  ): Promise<{ success: true; user: User; token: string } | { success: false; error: string }> {
    const { data, error } = await apiCall<{
      accessToken?: string;
      token?: string;
      refreshToken?: string;
      user: Record<string, unknown>;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (error || !data) {
      return {
        success: false,
        error: error || 'Login failed. Is the API running on port 4000?',
      };
    }

    const token = data.accessToken || data.token;
    if (!token || !data.user) {
      return { success: false, error: 'Invalid login response from server.' };
    }

    apiStorage.setToken(token);
    if (data.refreshToken) {
      apiStorage.setRefreshToken(data.refreshToken);
    }

    return {
      success: true,
      user: mapApiUser(data.user),
      token,
    };
  },

  async logout(): Promise<void> {
    apiStorage.setToken(null);
    apiStorage.setRefreshToken(null);
  },

  async me(): Promise<User | null> {
    const { data, error } = await apiCall<Record<string, unknown>>('/auth/me');
    if (error || !data) {
      const fallback = await apiCall<Record<string, unknown>>('/users/me');
      if (fallback.error || !fallback.data) return null;
      return mapApiUser(fallback.data);
    }
    if ((data as any).userId && !(data as any).email && !(data as any).name) {
      const profile = await apiCall<Record<string, unknown>>('/users/me');
      if (profile.data) return mapApiUser(profile.data);
    }
    return mapApiUser(data);
  },

  /** Admin creates employee accounts. */
  async createEmployee(
    input: CreateEmployeeInput,
    _createdByAdminId: string
  ): Promise<{ success: true; user: User } | { success: false; error: string }> {
    const { data, error } = await apiCall<Record<string, unknown>>('/users', {
      method: 'POST',
      body: JSON.stringify({
        name: input.name,
        email: input.email,
        password: input.password,
        department: input.department,
        capacityHours: input.capacityHours ?? 40,
        monthlySalary: input.monthlySalary ?? 0,
        costRate: input.costRate ?? 0,
        billableRate: input.billableRate ?? 0,
      }),
    });
    if (error || !data) {
      return { success: false, error: error || 'Failed to create employee' };
    }
    return { success: true, user: mapApiUser(data) };
  },

  async listUsers(): Promise<User[]> {
    const { data, error } = await apiCall<Record<string, unknown>[]>('/users');
    if (error || !data) {
      console.warn('listUsers API failed:', error);
      return [];
    }
    return data.map((u) => mapApiUser(u));
  },

  isAdmin(role: Role | undefined | null): boolean {
    return role === 'ADMIN';
  },

  isEmployee(role: Role | undefined | null): boolean {
    return role === 'EMPLOYEE';
  },
};
