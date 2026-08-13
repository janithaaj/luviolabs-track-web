'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Eye } from 'lucide-react';
import { approvalService } from '../../../../src/services/approval-service';
import { timesheetService } from '../../../../src/services/timesheet-service';
import { WeeklySubmission, TimeEntry } from '../../../../src/types';
import { formatMinutesToHoursString } from '../../../../src/lib/utils';
import { Button } from '../../../../src/components/ui/button';
import { Select } from '../../../../src/components/ui/select';
import { Modal } from '../../../../src/components/ui/modal';
import { Textarea } from '../../../../src/components/ui/textarea';
import { Badge } from '../../../../src/components/ui/badge';
import { GettingStartedPayrollBar } from '../../../../src/components/common/GettingStartedPayrollBar';
import { DocumentMagnifierGraphic } from '../../../../src/components/common/EmptyStateGraphics';
import { WeekNavigator } from '../../../../src/components/common/WeekNavigator';
import { useUIStore } from '../../../../src/store/use-ui-store';
import { useAuthStore } from '../../../../src/store/use-auth-store';
import { format, parseISO, addDays } from 'date-fns';

export default function ApprovalsPage() {
  const { activeWeekMonday, nextWeek, previousWeek, jumpToToday } = useUIStore();
  const { currentUser } = useAuthStore();
  const [submissions, setSubmissions] = useState<WeeklySubmission[]>([]);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [groupBy, setGroupBy] = useState('PERSON');
  const [clientFilter, setClientFilter] = useState('ALL');
  const [projectFilter, setProjectFilter] = useState('ALL');
  const [isProcessing, setIsProcessing] = useState(false);
  const [inspecting, setInspecting] = useState<WeeklySubmission | null>(null);
  const [inspectEntries, setInspectEntries] = useState<TimeEntry[]>([]);
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectComment, setRejectComment] = useState('');

  const weekStart = activeWeekMonday;
  const weekEnd = format(addDays(parseISO(activeWeekMonday), 6), 'yyyy-MM-dd');

  const loadData = async () => {
    const data = await approvalService.getSubmissionsForApproval();
    // Include all statuses for filter; also synthesize pending from submissions storage
    setSubmissions(data);
  };

  useEffect(() => {
    loadData();
  }, [activeWeekMonday]);

  const filtered = submissions.filter((s) => {
    const inWeek = s.weekStartDate === weekStart || (s.weekStartDate >= weekStart && s.weekStartDate <= weekEnd);
    // show if week matches OR no week filter strict
    const weekMatch =
      s.weekStartDate === weekStart ||
      (s.weekStartDate <= weekEnd && s.weekEndDate >= weekStart);
    if (!weekMatch && submissions.some((x) => x.weekStartDate === weekStart)) {
      // only filter by week if any match that week; else show all
    }
    if (statusFilter === 'PENDING') {
      return (
        weekMatch &&
        (s.status === 'SUBMITTED' || s.status === 'PENDING_APPROVAL')
      );
    }
    if (statusFilter === 'APPROVED') return weekMatch && s.status === 'APPROVED';
    if (statusFilter === 'REJECTED') return weekMatch && s.status === 'REJECTED';
    return weekMatch;
  });

  // Fallback: if no week-matched, show filtered without week when empty for pending
  const displayList =
    filtered.length > 0
      ? filtered
      : statusFilter === 'PENDING'
      ? submissions.filter(
          (s) => s.status === 'SUBMITTED' || s.status === 'PENDING_APPROVAL'
        )
      : submissions.filter((s) =>
          statusFilter === 'ALL' ? true : s.status === statusFilter
        );

  const totalMins = displayList.reduce((acc, s) => acc + s.totalHours * 60, 0);
  const billableMins = displayList.reduce((acc, s) => acc + s.billableHours * 60, 0);
  const nonBillableMins = totalMins - billableMins;
  const billablePct = totalMins ? Math.round((billableMins / totalMins) * 100) : 0;

  const openInspect = async (sub: WeeklySubmission) => {
    setInspecting(sub);
    setRejectMode(false);
    setRejectComment('');
    const entries = await timesheetService.getEntriesForUserAndRange(
      sub.userId,
      sub.weekStartDate,
      sub.weekEndDate
    );
    setInspectEntries(entries);
  };

  const handleApprove = async (id: string) => {
    setIsProcessing(true);
    await approvalService.approveSubmission(id, currentUser?.name || 'Admin');
    setIsProcessing(false);
    setInspecting(null);
    loadData();
  };

  const handleReject = async (id: string) => {
    if (!rejectComment.trim()) return;
    setIsProcessing(true);
    await approvalService.rejectSubmission(
      id,
      rejectComment,
      currentUser?.name || 'Admin'
    );
    setIsProcessing(false);
    setInspecting(null);
    loadData();
  };

  const handleApproveAllVisible = async () => {
    const visibleIds = displayList
      .filter((s) => s.status === 'SUBMITTED' || s.status === 'PENDING_APPROVAL')
      .map((s) => s.id);
    if (visibleIds.length === 0) return;
    setIsProcessing(true);
    await approvalService.bulkApproveSubmissions(visibleIds, currentUser?.name || 'Admin');
    setIsProcessing(false);
    loadData();
  };

  return (
    <div className="space-y-5">
      <h1 className="text-[28px] font-bold tracking-tight text-[#0C2A43]">Approvals</h1>
      <GettingStartedPayrollBar />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="w-24">
            <Select
              value="Week"
              onChange={() => {}}
              options={[{ value: 'Week', label: 'Week' }]}
            />
          </div>
          <WeekNavigator
            weekStart={activeWeekMonday}
            onPrev={previousWeek}
            onNext={nextWeek}
            onJumpToday={jumpToToday}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="w-52">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'PENDING', label: 'Status: Pending Approval' },
                { value: 'APPROVED', label: 'Status: Approved' },
                { value: 'REJECTED', label: 'Status: Rejected' },
                { value: 'ALL', label: 'Status: All' }
              ]}
            />
          </div>
          <div className="w-44">
            <Select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value)}
              options={[
                { value: 'PERSON', label: 'Group by: Person' },
                { value: 'PROJECT', label: 'Group by: Project' }
              ]}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {[
          { key: 'client', value: clientFilter, set: setClientFilter, label: 'Client', opts: [{ value: 'ALL', label: 'All clients' }] },
          { key: 'project', value: projectFilter, set: setProjectFilter, label: 'Project', opts: [{ value: 'ALL', label: 'All projects' }] }
        ].map((f) => (
          <div key={f.key} className="w-36">
            <Select
              value={f.value}
              onChange={(e) => f.set(e.target.value)}
              options={f.opts}
            />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="harvest-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div>
            <div className="text-[12px] font-semibold text-[#475569]">Total time</div>
            <div className="text-[28px] font-bold tabular-nums">
              {formatMinutesToHoursString(totalMins)}
            </div>
          </div>
          <div className="space-y-1 text-right text-[12px]">
            <div>
              Billable <strong>{formatMinutesToHoursString(billableMins)} ({billablePct}%)</strong>
            </div>
            <div>
              Non-billable{' '}
              <strong>
                {formatMinutesToHoursString(nonBillableMins)} ({totalMins ? 100 - billablePct : 0}%)
              </strong>
            </div>
          </div>
        </div>
        <div className="harvest-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div>
            <div className="text-[12px] font-semibold text-[#475569]">Total expenses</div>
            <div className="text-[28px] font-bold tabular-nums">$0.00</div>
          </div>
        </div>
      </div>

      {displayList.length > 0 ? (
        <div className="harvest-card harvest-table-wrap p-0">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-[#E2E8F0] text-[12px] font-semibold text-[#475569]">
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Week</th>
                <th className="px-4 py-3">Hours</th>
                <th className="px-4 py-3">Billable</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {displayList.map((sub) => (
                <tr key={sub.id} className="hover:bg-[#F8FAFC]">
                  <td className="px-4 py-3 font-semibold">{sub.userName}</td>
                  <td className="px-4 py-3 text-[#475569]">
                    {sub.weekStartDate} → {sub.weekEndDate}
                  </td>
                  <td className="px-4 py-3 font-bold tabular-nums">{sub.totalHours}h</td>
                  <td className="px-4 py-3 text-[#3B82F6]">{sub.billableHours}h</td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={
                        sub.status === 'APPROVED'
                          ? 'approved'
                          : sub.status === 'REJECTED'
                          ? 'rejected'
                          : 'submitted'
                      }
                    >
                      {sub.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        leftIcon={<Eye className="h-3.5 w-3.5" />}
                        onClick={() => openInspect(sub)}
                      >
                        Review
                      </Button>
                      {(sub.status === 'SUBMITTED' || sub.status === 'PENDING_APPROVAL') && (
                        <>
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => handleApprove(sub.id)}
                            isLoading={isProcessing}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => {
                              openInspect(sub).then(() => setRejectMode(true));
                            }}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="harvest-empty flex flex-col items-center justify-center px-6 py-16 text-center">
          <DocumentMagnifierGraphic className="mb-4 h-20 w-20" />
          <p className="max-w-md text-[13px] text-[#475569]">
            No approval data for this week and status. Change filters or wait for employee
            submissions.
          </p>
        </div>
      )}

      <Button
        variant="primary"
        onClick={handleApproveAllVisible}
        isLoading={isProcessing}
        leftIcon={<CheckCircle2 className="h-4 w-4" />}
      >
        Approve visible timesheets and expenses
      </Button>

      <Modal
        isOpen={!!inspecting}
        onClose={() => setInspecting(null)}
        title={inspecting ? `Review ${inspecting.userName}` : 'Review'}
        maxWidth="lg"
      >
        {inspecting && (
          <div className="space-y-4">
            <p className="text-[13px] text-[#475569]">
              Week {inspecting.weekStartDate} – {inspecting.weekEndDate} · {inspecting.totalHours}h
            </p>
            <div className="max-h-48 overflow-y-auto rounded-md border border-[#E2E8F0]">
              <table className="w-full text-left text-[12px]">
                <thead>
                  <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Project</th>
                    <th className="px-3 py-2">Task</th>
                    <th className="px-3 py-2">Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {inspectEntries.map((e) => (
                    <tr key={e.id} className="border-b border-[#F1F5F9]">
                      <td className="px-3 py-2">{e.date}</td>
                      <td className="px-3 py-2">{e.projectName}</td>
                      <td className="px-3 py-2">{e.taskName}</td>
                      <td className="px-3 py-2">
                        {formatMinutesToHoursString(e.durationMinutes)}
                      </td>
                    </tr>
                  ))}
                  {inspectEntries.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-3 py-4 text-center text-[#475569]">
                        No entries found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {rejectMode ? (
              <div className="space-y-3">
                <Textarea
                  label="Rejection reason"
                  value={rejectComment}
                  onChange={(e) => setRejectComment(e.target.value)}
                  rows={3}
                  required
                />
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setRejectMode(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="danger"
                    leftIcon={<XCircle className="h-4 w-4" />}
                    onClick={() => handleReject(inspecting.id)}
                    isLoading={isProcessing}
                  >
                    Reject week
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setRejectMode(true)}>
                  Reject
                </Button>
                <Button
                  variant="primary"
                  onClick={() => handleApprove(inspecting.id)}
                  isLoading={isProcessing}
                >
                  Approve
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
