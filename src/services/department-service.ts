import { apiCall } from './api-client';

export interface Department {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
}

function mapDepartment(d: Record<string, unknown>): Department {
  return {
    id: String(d.id || d._id || ''),
    name: String(d.name || ''),
    description: String(d.description || ''),
    isActive: d.isActive !== false,
  };
}

export const departmentService = {
  async getDepartments(): Promise<Department[]> {
    const res = await apiCall<Record<string, unknown>[]>('/departments');
    if (res.error) throw new Error(res.error);
    if (res.data && Array.isArray(res.data)) {
      return res.data.map(mapDepartment);
    }
    return [];
  },

  async createDepartment(input: {
    name: string;
    description?: string;
  }): Promise<Department> {
    const res = await apiCall<Record<string, unknown>>('/departments', {
      method: 'POST',
      body: JSON.stringify({
        name: input.name.trim(),
        description: input.description?.trim() || '',
      }),
    });
    if (res.error || !res.data) throw new Error(res.error || 'Failed to create department');
    return mapDepartment(res.data);
  },

  async updateDepartment(input: {
    id: string;
    name?: string;
    description?: string;
  }): Promise<Department> {
    const body: Record<string, string> = {};
    if (input.name !== undefined) body.name = input.name.trim();
    if (input.description !== undefined) body.description = input.description.trim();

    const res = await apiCall<Record<string, unknown>>(`/departments/${input.id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
    if (res.error || !res.data) throw new Error(res.error || 'Failed to update department');
    return mapDepartment(res.data);
  },

  async deleteDepartment(id: string): Promise<void> {
    const res = await apiCall(`/departments/${id}`, { method: 'DELETE' });
    if (res.error) throw new Error(res.error);
  },
};
