import { apiCall } from './api-client';

export interface OrganizationSettings {
  id: string;
  name: string;
  currency: string;
  timezone: string;
  weeklyCapacityHours: number;
  logoUrl?: string;
  isActive: boolean;
}

function mapOrg(o: Record<string, unknown>): OrganizationSettings {
  return {
    id: String(o.id || o._id || ''),
    name: String(o.name || ''),
    currency: String(o.currency || 'LKR'),
    timezone: String(o.timezone || 'America/New_York'),
    weeklyCapacityHours: Number(o.weeklyCapacityHours ?? 40),
    logoUrl: o.logoUrl ? String(o.logoUrl) : undefined,
    isActive: o.isActive !== false,
  };
}

export const organizationService = {
  async getCurrent(): Promise<OrganizationSettings> {
    const res = await apiCall<Record<string, unknown>>('/organizations/current');
    if (res.error || !res.data) {
      throw new Error(res.error || 'Failed to load workspace settings');
    }
    return mapOrg(res.data);
  },

  async updateCurrent(input: {
    name?: string;
    currency?: string;
    weeklyCapacityHours?: number;
    timezone?: string;
  }): Promise<OrganizationSettings> {
    const res = await apiCall<Record<string, unknown>>('/organizations/current', {
      method: 'PUT',
      body: JSON.stringify(input),
    });
    if (res.error || !res.data) {
      throw new Error(res.error || 'Failed to save workspace settings');
    }
    return mapOrg(res.data);
  },
};
