import { apiCall } from './api-client';
import { Project, ProjectType, ProjectStatus } from '../types';
import { DEFAULT_CURRENCY } from '../lib/constants';
import { resolveBillingCurrency } from '../lib/utils';

function mapProject(p: Record<string, unknown>): Project {
  const budget = (p.budget || {}) as Project['budget'];
  return {
    id: String(p.id || p._id || ''),
    name: String(p.name || ''),
    code: String(p.code || ''),
    clientId: String(p.clientId || ''),
    clientName: String(p.clientName || ''),
    description: p.description ? String(p.description) : undefined,
    startDate: String(p.startDate || ''),
    deadline: p.deadline ? String(p.deadline) : undefined,
    managerId: String(p.managerId || ''),
    managerName: String(p.managerName || ''),
    teamMemberIds: ((p.teamMemberIds as unknown[]) || []).map(String),
    taskIds: ((p.taskIds as unknown[]) || []).map(String),
    type: String(p.type || p.projectType || 'TIME_AND_MATERIALS') as ProjectType,
    budget: {
      type: (budget.type as Project['budget']['type']) || 'TOTAL_HOURS',
      totalHours: budget.totalHours,
      totalAmount: budget.totalAmount,
      warnThresholds: budget.warnThresholds || [70, 80, 90, 100],
    },
    usedHours: Number(p.usedHours ?? 0),
    currency: resolveBillingCurrency(p.currency as string, DEFAULT_CURRENCY),
    status: String(p.status || 'ACTIVE') as ProjectStatus,
  };
}

function compactBody(body: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body)) {
    if (value === undefined || value === null) continue;
    if (typeof value === 'number' && Number.isNaN(value)) continue;
    out[key] = value;
  }
  return out;
}

/**
 * Build project create/update body.
 * Never sends top-level `budgetAmount` (ValidationPipe forbidNonWhitelisted rejects it).
 * Fixed-fee price uses nested `budget.totalAmount` when the API supports `budget` on the DTO.
 */
function toProjectBody(projectData: Partial<Project>, forCreate = false) {
  const hours =
    projectData.budget?.totalHours !== undefined && projectData.budget.totalHours !== null
      ? Number(projectData.budget.totalHours)
      : undefined;

  const amount =
    projectData.budget?.totalAmount !== undefined && projectData.budget.totalAmount !== null
      ? Number(projectData.budget.totalAmount)
      : undefined;

  let budget: Record<string, unknown> | undefined;
  if (projectData.type === 'FIXED_FEE' || amount !== undefined) {
    budget = compactBody({
      type:
        projectData.budget?.type ||
        (projectData.type === 'FIXED_FEE' ? 'TOTAL_AMOUNT' : undefined),
      totalHours: hours,
      totalAmount: amount ?? (projectData.type === 'FIXED_FEE' ? 0 : undefined),
      warnThresholds: projectData.budget?.warnThresholds,
    });
    if (Object.keys(budget).length === 0) budget = undefined;
  }

  return compactBody({
    name: projectData.name,
    code: projectData.code,
    description: projectData.description,
    clientId: projectData.clientId,
    clientName: projectData.clientName,
    type: projectData.type,
    startDate: projectData.startDate,
    deadline: projectData.deadline,
    currency: resolveBillingCurrency(projectData.currency, DEFAULT_CURRENCY),
    status: projectData.status,
    teamMemberIds: projectData.teamMemberIds,
    taskIds: projectData.taskIds,
    managerId: forCreate ? projectData.managerId : undefined,
    managerName: forCreate ? projectData.managerName : undefined,
    budgetHours: hours,
    budget,
  });
}

function isUnknownPropError(error?: string) {
  if (!error) return false;
  return /should not exist|property \w+|whitelist|forbidden/i.test(error);
}

export const projectService = {
  async getProjects(): Promise<Project[]> {
    const res = await apiCall<Record<string, unknown>[]>('/projects');
    if (res.data && Array.isArray(res.data)) {
      return res.data.map(mapProject);
    }
    console.warn('getProjects API failed:', res.error);
    return [];
  },

  async getProjectById(id: string): Promise<Project | null> {
    const res = await apiCall<Record<string, unknown>>(`/projects/${id}`);
    if (res.data) return mapProject(res.data);
    return null;
  },

  async getProjectsForUser(userId: string): Promise<Project[]> {
    const projects = await this.getProjects();
    return projects.filter(
      (p) => p.teamMemberIds.includes(userId) || p.managerId === userId
    );
  },

  async saveProject(projectData: Partial<Project>): Promise<Project> {
    if (projectData.id) {
      // Start with legacy-safe body (no nested budget) so existing projects always save
      const full = toProjectBody(projectData, false);
      const legacy = { ...full };
      delete legacy.budget;

      let res = await apiCall<Record<string, unknown>>(`/projects/${projectData.id}`, {
        method: 'PUT',
        body: JSON.stringify(legacy),
      });

      // Apply fixed-fee amount when API accepts nested `budget`
      if (!res.error && full.budget) {
        const withBudget = await apiCall<Record<string, unknown>>(`/projects/${projectData.id}`, {
          method: 'PUT',
          body: JSON.stringify(full),
        });
        if (!withBudget.error && withBudget.data) {
          return mapProject(withBudget.data);
        }
        // nested budget not supported — keep successful legacy save
      }

      if (res.error || !res.data) {
        throw new Error(res.error || 'Failed to update project');
      }
      return mapProject(res.data);
    }

    const body = toProjectBody(projectData, true);
    let res = await apiCall<Record<string, unknown>>('/projects', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    if (res.error && isUnknownPropError(res.error) && body.budget) {
      const legacy = { ...body };
      delete legacy.budget;
      res = await apiCall<Record<string, unknown>>('/projects', {
        method: 'POST',
        body: JSON.stringify(legacy),
      });
    }

    if (res.error || !res.data) {
      throw new Error(res.error || 'Failed to create project');
    }
    return mapProject(res.data);
  },

  async deleteProject(id: string): Promise<void> {
    const res = await apiCall(`/projects/${id}`, { method: 'DELETE' });
    if (res.error && res.status !== 204) {
      throw new Error(res.error || 'Failed to delete project');
    }
  },

  async updateProjectTeam(projectId: string, teamMemberIds: string[]): Promise<Project | null> {
    const res = await apiCall<Record<string, unknown>>(`/projects/${projectId}/members`, {
      method: 'PUT',
      body: JSON.stringify({ teamMemberIds }),
    });
    if (res.error || !res.data) {
      console.warn('updateProjectTeam failed:', res.error);
      return null;
    }
    return mapProject(res.data);
  },
};
