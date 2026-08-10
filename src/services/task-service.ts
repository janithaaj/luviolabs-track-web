import { apiCall } from './api-client';
import { Task } from '../types';

function mapTask(t: Record<string, unknown>): Task {
  const category = String(t.category || 'Engineering');
  const isBillableDefault =
    t.isBillableDefault != null
      ? Boolean(t.isBillableDefault)
      : Boolean(t.isBillable);
  return {
    id: String(t.id || t._id || ''),
    name: String(t.name || ''),
    category,
    isBillableDefault,
    defaultRate: Number(t.defaultRate ?? 0),
    isCommon: t.isCommon != null ? Boolean(t.isCommon) : category !== 'Other',
    isActive: t.isActive !== false,
  };
}

export interface CreateTaskInput {
  name: string;
  category?: string;
  isBillableDefault?: boolean;
  defaultRate?: number;
  isCommon?: boolean;
}

export interface UpdateTaskInput {
  id: string;
  name?: string;
  category?: string;
  isBillableDefault?: boolean;
  defaultRate?: number;
  isCommon?: boolean;
  isActive?: boolean;
}

export const taskService = {
  async getTasks(): Promise<Task[]> {
    const res = await apiCall<Record<string, unknown>[]>('/tasks');
    if (res.error) {
      throw new Error(res.error);
    }
    if (res.data && Array.isArray(res.data)) {
      return res.data.map(mapTask);
    }
    return [];
  },

  async createTask(input: CreateTaskInput): Promise<Task> {
    const res = await apiCall<Record<string, unknown>>('/tasks', {
      method: 'POST',
      body: JSON.stringify({
        name: input.name.trim(),
        category: input.category || 'Engineering',
        isBillableDefault: input.isBillableDefault ?? true,
        defaultRate: input.defaultRate ?? 0,
        isCommon: input.isCommon,
      }),
    });
    if (res.error || !res.data) {
      throw new Error(res.error || 'Failed to create task');
    }
    return mapTask(res.data);
  },

  async updateTask(input: UpdateTaskInput): Promise<Task> {
    const { id, ...body } = input;
    const res = await apiCall<Record<string, unknown>>(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
    if (res.error || !res.data) {
      throw new Error(res.error || 'Failed to update task');
    }
    return mapTask(res.data);
  },

  async deleteTask(id: string): Promise<void> {
    const res = await apiCall<{ ok: true }>(`/tasks/${id}`, { method: 'DELETE' });
    if (res.error) {
      throw new Error(res.error || 'Failed to delete task');
    }
  },
};
