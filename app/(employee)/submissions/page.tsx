'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../../src/store/use-auth-store';
import { timesheetService } from '../../../src/services/timesheet-service';
import { WeeklySubmission } from '../../../src/types';
import { Badge } from '../../../src/components/ui/badge';
import { Send } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function SubmissionsPage() {
  const { currentUser } = useAuthStore();
  const [submissions, setSubmissions] = useState<WeeklySubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!currentUser) return;
      setIsLoading(true);
      try {
        const list = await timesheetService.getMySubmissions();
        setSubmissions(list);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [currentUser?.id]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[28px] font-bold tracking-tight text-[#0C2A43]">My Submissions</h1>
        <p className="mt-1 text-[13px] text-[#475569]">
          Weeks you submitted for admin approval.
        </p>
      </div>

      {isLoading && <p className="text-[13px] text-[#475569]">Loading…</p>}

      {!isLoading && submissions.length === 0 && (
        <div className="rounded-2xl bg-[#f5f1ea] px-6 py-12 text-center text-[13px] text-[#475569]">
          No submitted weeks yet. Submit from your timesheet when ready.
        </div>
      )}

      <div className="space-y-3">
        {submissions.map((sub) => (
          <div
            key={sub.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-[#E2E8F0] bg-white p-4"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F5F0FF] text-[#9333EA]">
                <Send className="h-4 w-4" />
              </div>
              <div>
                <div className="text-[14px] font-bold text-[#0C2A43]">
                  Week of{' '}
                  {sub.weekStartDate
                    ? format(parseISO(sub.weekStartDate), 'MMM d, yyyy')
                    : '—'}
                </div>
                <div className="text-[12px] text-[#475569]">
                  {sub.totalHours}h total · {sub.billableHours}h billable
                  {sub.rejectionComment ? ` · “${sub.rejectionComment}”` : ''}
                </div>
              </div>
            </div>
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
          </div>
        ))}
      </div>
    </div>
  );
}
