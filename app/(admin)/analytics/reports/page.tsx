'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { reportService } from '../../../../src/services/report-service';
import { TimeEntry } from '../../../../src/types';
import { formatMinutesToHoursString, formatDateString, getWeekDays } from '../../../../src/lib/utils';
import { Button } from '../../../../src/components/ui/button';
import { Select } from '../../../../src/components/ui/select';
import { GettingStartedPayrollBar } from '../../../../src/components/common/GettingStartedPayrollBar';
import { DocumentMagnifierGraphic } from '../../../../src/components/common/EmptyStateGraphics';
import { WeekNavigator } from '../../../../src/components/common/WeekNavigator';
import { useUIStore } from '../../../../src/store/use-ui-store';
import { ActionMenu } from '../../../../src/components/ui/action-menu';
import { parseISO } from 'date-fns';
import { apiStorage } from '../../../../src/services/api-client';

const REPORT_TABS = [
  'Time',
  'Profitability',
  'Activity log',
  'Contractor',
  'Invoicing',
  'Saved reports'
] as const;

const SAVED_KEY = 'luvio_track_saved_reports_v2';

export default function AdminReportsPage() {
  const { activeWeekMonday, nextWeek, previousWeek, jumpToToday } = useUIStore();
  const [activeTab, setActiveTab] = useState<(typeof REPORT_TABS)[number]>('Time');
  const [period, setPeriod] = useState('Week');
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [saved, setSaved] = useState<{ name: string; tab: string; week: string }[]>([]);
  const [message, setMessage] = useState('');

  const weekDays = getWeekDays(parseISO(activeWeekMonday));
  const startDate = formatDateString(weekDays[0]);
  const endDate = formatDateString(weekDays[6]);

  useEffect(() => {
    reportService
      .getFilteredTimeEntries({ startDate, endDate })
      .then(setEntries);
    setSaved(apiStorage.getJson(SAVED_KEY, []));
  }, [activeWeekMonday]);

  const saveReport = () => {
    const name = `${activeTab} ${startDate}`;
    const next = [{ name, tab: activeTab, week: startDate }, ...saved];
    apiStorage.setJson(SAVED_KEY, next);
    setSaved(next);
    setMessage(`Saved report “${name}”.`);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-[28px] font-bold tracking-tight text-[#0C2A43]">Reports</h1>
        <ActionMenu
          label="New report"
          size="md"
          items={REPORT_TABS.map((tab) => ({
            label: tab,
            onClick: () => {
              setActiveTab(tab);
              setMessage(`Opened ${tab} report view.`);
            }
          }))}
        />
      </div>

      <div className="flex flex-wrap items-center gap-5 border-b border-[#E2E8F0]">
        {REPORT_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`pb-2.5 text-[13px] font-semibold cursor-pointer ${
              activeTab === tab
                ? 'border-b-2 border-[#9333EA] text-[#9333EA]'
                : 'text-[#475569] hover:text-[#0C2A43]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {message && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-[13px] text-emerald-800">
          {message}
        </div>
      )}

      <GettingStartedPayrollBar />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="w-28">
            <Select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              options={[
                { value: 'Week', label: 'Week' },
                { value: 'Month', label: 'Month' },
                { value: 'Quarter', label: 'Quarter' }
              ]}
            />
          </div>
          <WeekNavigator
            weekStart={activeWeekMonday}
            onPrev={previousWeek}
            onNext={nextWeek}
            onJumpToday={jumpToToday}
            showCalendarIcon
          />
        </div>
        <Button variant="outline" onClick={saveReport}>
          Save report
        </Button>
      </div>

      {activeTab === 'Time' && (
        entries.length > 0 ? (
          <div className="harvest-card overflow-hidden p-0">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-[#E2E8F0] text-[12px] font-semibold text-[#475569]">
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Project</th>
                  <th className="px-4 py-3">Task</th>
                  <th className="px-4 py-3">Hours</th>
                  <th className="px-4 py-3">Billable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {entries.map((e) => (
                  <tr key={e.id} className="hover:bg-[#F8FAFC]">
                    <td className="px-4 py-3 font-semibold">{e.userName}</td>
                    <td className="px-4 py-3 text-[#475569]">{e.date}</td>
                    <td className="px-4 py-3 text-[#9333EA] font-semibold">{e.projectName}</td>
                    <td className="px-4 py-3 text-[#475569]">{e.taskName}</td>
                    <td className="px-4 py-3 font-bold">
                      {formatMinutesToHoursString(e.durationMinutes)}
                    </td>
                    <td className="px-4 py-3">{e.isBillable ? 'Yes' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="harvest-empty flex flex-col items-center justify-center px-6 py-20 text-center">
            <DocumentMagnifierGraphic className="mb-4 h-20 w-20" />
            <p className="text-[14px] font-medium text-[#1E293B]">
              There are no hours recorded for this time period.
            </p>
            <p className="mt-1 text-[13px] text-[#475569]">
              Track time under{' '}
              <Link href="/work/timesheets" className="font-semibold text-[#2d5bff] underline">
                Timesheets
              </Link>
              .
            </p>
          </div>
        )
      )}

      {activeTab === 'Profitability' && (
        <div className="harvest-card p-5">
          <h3 className="text-[14px] font-bold">Profitability</h3>
          <p className="mt-1 text-[13px] text-[#475569]">
            Open the dedicated profitability report for budget vs billable amount analysis.
          </p>
          <Link href="/analytics/profitability">
            <Button className="mt-3" variant="primary" leftIcon={<Plus className="h-3.5 w-3.5" />}>
              Open profitability
            </Button>
          </Link>
        </div>
      )}

      {activeTab === 'Activity log' && (
        <div className="harvest-card p-5 text-[13px] text-[#475569]">
          Recent account activity is available under{' '}
          <Link href="/system/audit-logs" className="font-semibold text-[#9333EA] hover:underline">
            System → Audit logs
          </Link>
          .
        </div>
      )}

      {activeTab === 'Contractor' && (
        <div className="harvest-empty px-6 py-12 text-center text-[13px] text-[#475569]">
          No contractor hours in this period.
        </div>
      )}

      {activeTab === 'Invoicing' && (
        <div className="harvest-card p-5">
          <p className="text-[13px] text-[#475569]">Review issued invoices and open balances.</p>
          <Link href="/finance/invoices">
            <Button className="mt-3" variant="primary">
              Go to invoices
            </Button>
          </Link>
        </div>
      )}

      {activeTab === 'Saved reports' && (
        <div className="space-y-2">
          {saved.length === 0 ? (
            <div className="harvest-empty px-6 py-12 text-center text-[13px] text-[#475569]">
              No saved reports. Click Save report to keep a view.
            </div>
          ) : (
            saved.map((r, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setActiveTab(r.tab as any);
                  setMessage(`Loaded ${r.name}`);
                }}
                className="harvest-card flex w-full items-center justify-between p-4 text-left hover:border-[#9333EA]/40 cursor-pointer"
              >
                <span className="font-semibold text-[14px]">{r.name}</span>
                <span className="text-[12px] text-[#475569]">{r.tab}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
