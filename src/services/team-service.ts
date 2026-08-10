import { apiCall } from './api-client';
import { CreateEmployeeInput, UpdateUserInput, User } from '../types';
import { authService, mapApiUser } from './auth-service';

export const teamService = {
  async getUsers(): Promise<User[]> {
    return authService.listUsers();
  },

  async getEmployees(): Promise<User[]> {
    const users = await this.getUsers();
    return users.filter((u) => u.role === 'EMPLOYEE');
  },

  async getUserById(id: string): Promise<User | null> {
    const res = await apiCall<Record<string, unknown>>(`/users/${id}`);
    if (res.data && typeof res.data === 'object') {
      const mapped = mapApiUser(res.data);
      // Prefer GET by id; if salary missing (stale API), merge from list
      if ((mapped.monthlySalary ?? 0) > 0 || res.error) {
        return mapped;
      }
      const fromList = (await this.getUsers()).find((u) => u.id === id);
      if (fromList && (fromList.monthlySalary ?? 0) > 0) {
        return { ...mapped, monthlySalary: fromList.monthlySalary, costRate: fromList.costRate || mapped.costRate };
      }
      return mapped;
    }
    const users = await this.getUsers();
    return users.find((u) => u.id === id) || null;
  },

  async createEmployee(
    input: CreateEmployeeInput,
    adminId: string
  ): Promise<{ success: true; user: User } | { success: false; error: string }> {
    return authService.createEmployee(input, adminId);
  },

  async updateUser(id: string, input: UpdateUserInput): Promise<User> {
    const body: Record<string, unknown> = {};
    if (input.name !== undefined) body.name = input.name;
    if (input.department !== undefined) body.department = input.department;
    if (input.capacityHours !== undefined) body.capacityHours = Number(input.capacityHours);
    if (input.monthlySalary !== undefined) body.monthlySalary = Number(input.monthlySalary);
    if (input.costRate !== undefined) body.costRate = Number(input.costRate);
    if (input.billableRate !== undefined) body.billableRate = Number(input.billableRate);
    if (input.status !== undefined) body.status = input.status;

    const res = await apiCall<Record<string, unknown>>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
    if (res.error || !res.data) {
      throw new Error(res.error || 'Failed to update user');
    }
    let mapped = mapApiUser(res.data);
    // Re-fetch so salary always reflects DB (avoid lost field after map)
    const fresh = await this.getUserById(id);
    if (fresh) {
      mapped = {
        ...mapped,
        ...fresh,
        monthlySalary:
          (fresh.monthlySalary ?? 0) > 0
            ? fresh.monthlySalary
            : mapped.monthlySalary ?? input.monthlySalary ?? 0,
      };
    } else if ((mapped.monthlySalary ?? 0) === 0 && input.monthlySalary !== undefined) {
      mapped = { ...mapped, monthlySalary: Number(input.monthlySalary) || 0 };
    }
    return mapped;
  },

  /** Project membership is updated via projectService.updateProjectTeam (API). */
  async syncProjectAssignments(_projectId: string, _teamMemberIds: string[]): Promise<void> {
    // No-op: backend syncs user.assignedProjectIds on PUT /projects/:id/members
  },
};
