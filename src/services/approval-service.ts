import { apiCall } from './api-client';
import { WeeklySubmission } from '../types';

function mapSubmission(s: Record<string, unknown>): WeeklySubmission {
  return {
    id: String(s.id || s._id || ''),
    userId: String(s.userId || ''),
    userName: String(s.userName || 'Employee'),
    userAvatar: s.userAvatar ? String(s.userAvatar) : undefined,
    department: String(s.department || 'General'),
    weekStartDate: String(s.weekStartDate || s.weekStart || ''),
    weekEndDate: String(s.weekEndDate || s.weekEnd || ''),
    totalHours: Number(s.totalHours ?? 0),
    expectedHours: Number(s.expectedHours ?? 40),
    billableHours: Number(s.billableHours ?? 0),
    nonBillableHours: Number(s.nonBillableHours ?? 0),
    projectBreakdown: (s.projectBreakdown as WeeklySubmission['projectBreakdown']) || [],
    status: (s.status as WeeklySubmission['status']) || 'SUBMITTED',
    submittedAt: s.submittedAt ? String(s.submittedAt) : undefined,
    approvedAt: s.approvedAt ? String(s.approvedAt) : undefined,
    approvedBy: s.approvedBy ? String(s.approvedBy) : undefined,
    rejectionComment:
      s.rejectionComment || s.rejectionReason
        ? String(s.rejectionComment || s.rejectionReason)
        : undefined,
  };
}

export const approvalService = {
  async getSubmissionsForApproval(weekStartDate?: string): Promise<WeeklySubmission[]> {
    const qs = new URLSearchParams();
    qs.set('status', 'ALL');
    if (weekStartDate) qs.set('weekStart', weekStartDate);
    const res = await apiCall<Record<string, unknown>[]>(`/approvals?${qs.toString()}`);
    if (res.data && Array.isArray(res.data)) {
      return res.data.map(mapSubmission);
    }
    console.warn('getSubmissionsForApproval failed:', res.error);
    return [];
  },

  async approveSubmission(
    submissionId: string,
    _adminName = 'Admin User'
  ): Promise<WeeklySubmission | null> {
    const res = await apiCall<Record<string, unknown>>(`/approvals/${submissionId}/approve`, {
      method: 'POST',
    });
    if (res.error || !res.data) {
      throw new Error(res.error || 'Failed to approve');
    }
    return mapSubmission(res.data);
  },

  async rejectSubmission(
    submissionId: string,
    rejectionComment: string,
    _adminName = 'Admin User'
  ): Promise<WeeklySubmission | null> {
    const res = await apiCall<Record<string, unknown>>(`/approvals/${submissionId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason: rejectionComment }),
    });
    if (res.error || !res.data) {
      throw new Error(res.error || 'Failed to reject');
    }
    return mapSubmission(res.data);
  },

  async bulkApproveSubmissions(
    submissionIds: string[],
    adminName = 'Admin User'
  ): Promise<boolean> {
    const res = await apiCall('/approvals/bulk-approve', {
      method: 'POST',
      body: JSON.stringify({ timesheetIds: submissionIds }),
    });
    if (res.error) {
      for (const id of submissionIds) {
        await this.approveSubmission(id, adminName);
      }
    }
    return true;
  },
};
