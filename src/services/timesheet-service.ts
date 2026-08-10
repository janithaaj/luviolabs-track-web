import { apiCall } from './api-client';
import { TimeEntry, WeeklySubmission, ProjectHoursSummary } from '../types';
import { addDays, subDays, subWeeks, format, parseISO } from 'date-fns';

function mapEntry(e: Record<string, unknown>): TimeEntry {
  return {
    id: String(e.id || e._id || ''),
    userId: String(e.userId || ''),
    userName: String(e.userName || 'User'),
    projectId: String(e.projectId || ''),
    projectName: String(e.projectName || 'Project'),
    projectCode: String(e.projectCode || ''),
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

function mapSubmission(s: Record<string, unknown>, fallbackUserId?: string): WeeklySubmission {
  return {
    id: String(s.id || s._id || `sub-${s.weekStartDate || s.weekStart}`),
    userId: String(s.userId || fallbackUserId || ''),
    userName: String(s.userName || 'Employee'),
    department: String(s.department || 'Engineering'),
    weekStartDate: String(s.weekStartDate || s.weekStart || ''),
    weekEndDate: String(s.weekEndDate || s.weekEnd || ''),
    totalHours: Number(s.totalHours ?? 0),
    expectedHours: Number(s.expectedHours ?? 40),
    billableHours: Number(s.billableHours ?? 0),
    nonBillableHours: Number(s.nonBillableHours ?? 0),
    projectBreakdown: (s.projectBreakdown as ProjectHoursSummary[]) || [],
    status: (s.status as WeeklySubmission['status']) || 'DRAFT',
    submittedAt: s.submittedAt ? String(s.submittedAt) : undefined,
    approvedAt: s.approvedAt ? String(s.approvedAt) : undefined,
    rejectionComment:
      s.rejectionComment || s.rejectionReason
        ? String(s.rejectionComment || s.rejectionReason)
        : undefined,
  };
}

export const timesheetService = {
  async getEntriesForUserAndRange(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<TimeEntry[]> {
    const res = await apiCall<Record<string, unknown>[]>(
      `/time-entries?from=${startDate}&to=${endDate}&userId=${userId}`
    );
    if (res.data && Array.isArray(res.data)) {
      return res.data.map(mapEntry);
    }
    const self = await apiCall<Record<string, unknown>[]>(
      `/time-entries?from=${startDate}&to=${endDate}`
    );
    if (self.data && Array.isArray(self.data)) {
      return self.data.map(mapEntry).filter((e) => e.userId === userId || !userId);
    }
    console.warn('getEntriesForUserAndRange failed:', res.error || self.error);
    return [];
  },

  async getAllEntries(filters?: {
    from?: string;
    to?: string;
    projectId?: string;
    uninvoiced?: boolean;
    billable?: boolean;
  }): Promise<TimeEntry[]> {
    const params = new URLSearchParams();
    if (filters?.from) params.set('from', filters.from);
    if (filters?.to) params.set('to', filters.to);
    if (filters?.projectId) params.set('projectId', filters.projectId);
    if (filters?.uninvoiced) params.set('uninvoiced', 'true');
    if (filters?.billable === true) params.set('billable', 'true');
    if (filters?.billable === false) params.set('billable', 'false');
    const q = params.toString();
    const res = await apiCall<Record<string, unknown>[]>(
      q ? `/time-entries?${q}` : '/time-entries'
    );
    if (res.data && Array.isArray(res.data)) {
      return res.data.map(mapEntry);
    }
    console.warn('getAllEntries failed:', res.error);
    return [];
  },

  async markEntriesInvoiced(entryIds: string[], invoiceId: string): Promise<void> {
    if (!entryIds.length) return;
    const res = await apiCall<{ updated: number }>('/time-entries/mark-invoiced', {
      method: 'POST',
      body: JSON.stringify({ entryIds, invoiceId }),
    });
    if (res.error) {
      console.warn('markEntriesInvoiced failed:', res.error);
    }
  },

  async saveEntry(entryData: Partial<TimeEntry>): Promise<TimeEntry> {
    if (entryData.id) {
      const res = await apiCall<Record<string, unknown>>(`/time-entries/${entryData.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          projectId: entryData.projectId,
          taskId: entryData.taskId,
          taskName: entryData.taskName,
          durationMinutes: entryData.durationMinutes,
          description: entryData.workCompleted,
          billable: entryData.isBillable,
          date: entryData.date,
        }),
      });
      if (res.error || !res.data) {
        throw new Error(res.error || 'Failed to update time entry');
      }
      return mapEntry(res.data);
    }

    const res = await apiCall<Record<string, unknown>>('/time-entries', {
      method: 'POST',
      body: JSON.stringify({
        projectId: entryData.projectId,
        taskId: entryData.taskId,
        taskName: entryData.taskName,
        date: entryData.date,
        durationMinutes: entryData.durationMinutes || 60,
        description: entryData.workCompleted || '',
        billable: entryData.isBillable ?? true,
        userId: entryData.userId,
        userName: entryData.userName,
      }),
    });
    if (res.error || !res.data) {
      throw new Error(res.error || 'Failed to create time entry');
    }
    return mapEntry(res.data);
  },

  async deleteEntry(id: string): Promise<boolean> {
    const res = await apiCall(`/time-entries/${id}`, { method: 'DELETE' });
    if (res.error && res.status !== 204) {
      throw new Error(res.error);
    }
    return true;
  },

  async duplicateEntry(id: string): Promise<TimeEntry | null> {
    const entries = await this.getAllEntries();
    const target = entries.find((e) => e.id === id);
    if (!target) return null;
    return this.saveEntry({
      userId: target.userId,
      userName: target.userName,
      projectId: target.projectId,
      taskId: target.taskId,
      taskName: target.taskName,
      date: target.date,
      durationMinutes: target.durationMinutes,
      workCompleted: target.workCompleted,
      isBillable: target.isBillable,
    });
  },

  async copyPreviousDay(userId: string, targetDateStr: string): Promise<TimeEntry[]> {
    const targetDate = parseISO(targetDateStr);
    const prevDateStr = format(subDays(targetDate, 1), 'yyyy-MM-dd');
    const prevDayEntries = await this.getEntriesForUserAndRange(userId, prevDateStr, prevDateStr);

    const created: TimeEntry[] = [];
    for (const item of prevDayEntries) {
      const copy = await this.saveEntry({
        userId: item.userId,
        userName: item.userName,
        projectId: item.projectId,
        taskId: item.taskId,
        taskName: item.taskName,
        date: targetDateStr,
        durationMinutes: item.durationMinutes,
        workCompleted: item.workCompleted,
        isBillable: item.isBillable,
      });
      created.push(copy);
    }
    return created;
  },

  async copyPreviousWeek(userId: string, currentMondayStr: string): Promise<TimeEntry[]> {
    const currentMonday = parseISO(currentMondayStr);
    const prevMondayStr = format(subWeeks(currentMonday, 1), 'yyyy-MM-dd');
    const prevSundayStr = format(addDays(subWeeks(currentMonday, 1), 6), 'yyyy-MM-dd');
    const prevWeekEntries = await this.getEntriesForUserAndRange(
      userId,
      prevMondayStr,
      prevSundayStr
    );

    const created: TimeEntry[] = [];
    for (const item of prevWeekEntries) {
      const itemDate = parseISO(item.date);
      const prevMondayDate = parseISO(prevMondayStr);
      const dayDiff = Math.round(
        (itemDate.getTime() - prevMondayDate.getTime()) / (1000 * 3600 * 24)
      );
      const targetDateStr = format(addDays(currentMonday, dayDiff), 'yyyy-MM-dd');

      const copy = await this.saveEntry({
        userId: item.userId,
        userName: item.userName,
        projectId: item.projectId,
        taskId: item.taskId,
        taskName: item.taskName,
        date: targetDateStr,
        durationMinutes: item.durationMinutes,
        workCompleted: item.workCompleted,
        isBillable: item.isBillable,
      });
      created.push(copy);
    }
    return created;
  },

  async getMySubmissions(): Promise<WeeklySubmission[]> {
    const res = await apiCall<Record<string, unknown>[]>('/timesheets/my-submissions');
    if (res.data && Array.isArray(res.data)) {
      return res.data.map((s) => mapSubmission(s));
    }
    return [];
  },

  async getWeeklySubmission(
    userId: string,
    weekStartDate: string
  ): Promise<WeeklySubmission | null> {
    const res = await apiCall<Record<string, unknown>>(
      `/timesheets/week?weekStart=${weekStartDate}&userId=${userId}`
    );
    if (res.data) {
      return mapSubmission(res.data, userId);
    }
    return null;
  },

  async submitWeekForApproval(
    userId: string,
    weekStartDate: string,
    weekEndDate: string
  ): Promise<WeeklySubmission> {
    const res = await apiCall<Record<string, unknown>>('/timesheets/submit', {
      method: 'POST',
      body: JSON.stringify({
        weekStart: weekStartDate,
        weekEnd: weekEndDate,
        userId,
      }),
    });
    if (res.error || !res.data) {
      throw new Error(res.error || 'Failed to submit week');
    }
    return mapSubmission(res.data, userId);
  },
};
