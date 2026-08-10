import { apiCall } from './api-client';
import { TimeEntry, ReportFilter } from '../types';
import { timesheetService } from './timesheet-service';
import { teamService } from './team-service';
import { projectService } from './project-service';
import { invoiceService } from './invoice-service';
import { expenseService } from './expense-service';

export interface UtilizationMetric {
  userId: string;
  userName: string;
  department: string;
  capacityHours: number;
  loggedHours: number;
  billableHours: number;
  utilizationPercent: number;
}

export interface ProfitabilityMetric {
  projectId: string;
  projectName: string;
  clientName: string;
  revenue: number;
  laborCost: number;
  expenses: number;
  profit: number;
  marginPercent: number;
}

function mapTimeEntry(e: Record<string, unknown>): TimeEntry {
  return {
    id: String(e.id || e._id || ''),
    userId: String((e.userId as any)?._id || e.userId || ''),
    userName: String(
      e.userName ||
        ((e.userId as any)?.firstName
          ? `${(e.userId as any).firstName} ${(e.userId as any).lastName || ''}`.trim()
          : 'User')
    ),
    projectId: String((e.projectId as any)?._id || e.projectId || ''),
    projectName: String(e.projectName || (e.projectId as any)?.name || 'Project'),
    projectCode: String(e.projectCode || (e.projectId as any)?.code || ''),
    taskId: String(e.taskId || ''),
    taskName: String(e.taskName || 'Task'),
    date: String(e.date || ''),
    durationMinutes: Number(e.durationMinutes ?? 0),
    workCompleted: String(e.workCompleted || e.description || ''),
    isBillable: Boolean(e.isBillable ?? e.billable ?? true),
    status: (e.status as TimeEntry['status']) || 'DRAFT',
    invoiceId: e.invoiceId ? String(e.invoiceId) : undefined,
    createdAt: e.createdAt ? String(e.createdAt) : new Date().toISOString(),
    updatedAt: e.updatedAt ? String(e.updatedAt) : new Date().toISOString(),
  };
}

export const reportService = {
  async getFilteredTimeEntries(filter: ReportFilter): Promise<TimeEntry[]> {
    const params = new URLSearchParams();
    if (filter.startDate) params.set('from', filter.startDate);
    if (filter.endDate) params.set('to', filter.endDate);

    const res = await apiCall<Record<string, unknown>[]>(`/time-entries?${params.toString()}`);
    let entries: TimeEntry[] = [];
    if (res.data && Array.isArray(res.data)) {
      entries = res.data.map(mapTimeEntry);
    } else {
      entries = await timesheetService.getAllEntries();
    }

    return entries.filter((e) => {
      if (filter.startDate && e.date < filter.startDate) return false;
      if (filter.endDate && e.date > filter.endDate) return false;
      if (filter.userIds?.length && !filter.userIds.includes(e.userId)) return false;
      if (filter.projectIds?.length && !filter.projectIds.includes(e.projectId)) return false;
      if (filter.isBillable !== undefined && e.isBillable !== filter.isBillable) return false;
      if (filter.status && e.status !== filter.status) return false;
      return true;
    });
  },

  async getUtilizationMetrics(): Promise<UtilizationMetric[]> {
    const res = await apiCall<any[]>('/reports/utilization');
    if (res.data && Array.isArray(res.data) && res.data.length > 0) {
      return res.data.map((u) => ({
        userId: String(u.user?.id || u.user?._id || u.userId || ''),
        userName:
          `${u.user?.firstName || ''} ${u.user?.lastName || ''}`.trim() ||
          u.userName ||
          'User',
        department: u.department || 'Engineering',
        capacityHours: Math.round(
          Number(u.capacityMinutes || (u.capacityHours || 40) * 60) / 60
        ),
        loggedHours: Math.round(((u.totalTrackedMinutes || 0) / 60) * 10) / 10,
        billableHours: Math.round(((u.billableMinutes || 0) / 60) * 10) / 10,
        utilizationPercent: u.billableUtilizationPct || u.utilizationPercent || 0,
      }));
    }

    // Derive from live API data when reports endpoint missing
    const users = await teamService.getUsers();
    const entries = await timesheetService.getAllEntries();

    return users.map((user) => {
      const userEntries = entries.filter((e) => e.userId === user.id);
      let totalMins = 0;
      let billableMins = 0;
      for (const e of userEntries) {
        totalMins += e.durationMinutes;
        if (e.isBillable) billableMins += e.durationMinutes;
      }
      const loggedHours = Math.round((totalMins / 60) * 10) / 10;
      const billableHours = Math.round((billableMins / 60) * 10) / 10;
      const capacity = user.capacityHours || 40;
      const utilizationPercent = Math.min(
        150,
        Math.round((billableHours / Math.max(capacity, 1)) * 100)
      );

      return {
        userId: user.id,
        userName: user.name,
        department: user.department,
        capacityHours: capacity,
        loggedHours,
        billableHours,
        utilizationPercent,
      };
    });
  },

  async getProfitabilityMetrics(): Promise<ProfitabilityMetric[]> {
    const res = await apiCall<any[]>('/reports/profitability');
    if (res.data && Array.isArray(res.data) && res.data.length > 0) {
      return res.data.map((p) => ({
        projectId: String(p.project?.id || p.project?._id || p.projectId || ''),
        projectName: p.project?.name || p.projectName || 'Project',
        clientName: p.clientName || 'Client',
        revenue: p.revenue || 0,
        laborCost: p.laborCost || 0,
        expenses: p.expenses || 0,
        profit: p.netProfit ?? p.profit ?? 0,
        marginPercent: p.marginPct ?? p.marginPercent ?? 0,
      }));
    }

    const projects = await projectService.getProjects();
    const entries = await timesheetService.getAllEntries();
    const users = await teamService.getUsers();
    const invoices = await invoiceService.getInvoices();
    const expenses = await expenseService.getExpenses();

    return projects.map((proj) => {
      const projEntries = entries.filter((e) => e.projectId === proj.id);
      const projInvoices = invoices.filter((inv) => inv.projectId === proj.id);
      let revenue = projInvoices.reduce((acc, inv) => acc + inv.totalAmount, 0);

      if (revenue === 0 && proj.type !== 'NON_BILLABLE') {
        revenue = projEntries.reduce((acc, e) => {
          if (!e.isBillable) return acc;
          const user = users.find((u) => u.id === e.userId);
          const rate = user?.billableRate || 0;
          return acc + (e.durationMinutes / 60) * rate;
        }, 0);
      }

      const laborCost = projEntries.reduce((acc, e) => {
        const user = users.find((u) => u.id === e.userId);
        const costRate = user?.costRate || 0;
        return acc + (e.durationMinutes / 60) * costRate;
      }, 0);

      const expensesTotal = expenses
        .filter((x) => x.projectId === proj.id)
        .reduce((acc, x) => acc + x.amount, 0);
      const profit = revenue - laborCost - expensesTotal;
      const marginPercent = revenue > 0 ? Math.round((profit / revenue) * 100) : 0;

      return {
        projectId: proj.id,
        projectName: proj.name,
        clientName: proj.clientName,
        revenue,
        laborCost,
        expenses: expensesTotal,
        profit,
        marginPercent,
      };
    });
  },
};
