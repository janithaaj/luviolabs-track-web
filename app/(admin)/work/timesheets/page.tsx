'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Eye, Plus } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '../../../../src/components/ui/button';
import { Select } from '../../../../src/components/ui/select';
import { Drawer } from '../../../../src/components/ui/drawer';
import { Badge } from '../../../../src/components/ui/badge';
import { GettingStartedPayrollBar } from '../../../../src/components/common/GettingStartedPayrollBar';
import { AiPromptBar } from '../../../../src/components/common/AiPromptBar';
import { WeekNavigator } from '../../../../src/components/common/WeekNavigator';
import { CalendarClocksGraphic } from '../../../../src/components/common/EmptyStateGraphics';
import { TimeEntryModal } from '../../../../src/components/common/TimeEntryModal';
import { useUIStore } from '../../../../src/store/use-ui-store';
import { useTimerStore } from '../../../../src/store/use-timer-store';
import { teamService } from '../../../../src/services/team-service';
import { projectService } from '../../../../src/services/project-service';
import { timesheetService } from '../../../../src/services/timesheet-service';
import { taskService } from '../../../../src/services/task-service';
import { TimeEntry, User, Project, Task } from '../../../../src/types';
import {
  formatDateString,
  formatMinutesToHoursString,
  formatWeekRangeString,
  getWeekDays,
  parseDurationToMinutes,
} from '../../../../src/lib/utils';
import { format, parseISO } from 'date-fns';
import { ActionMenu } from '../../../../src/components/ui/action-menu';

type ViewMode = 'Day' | 'Week' | 'Calendar';

function statusBadgeVariant(
  status: string
): 'draft' | 'submitted' | 'approved' | 'rejected' | 'pending' {
  const s = status.toUpperCase();
  if (s === 'APPROVED') return 'approved';
  if (s === 'REJECTED') return 'rejected';
  if (s === 'SUBMITTED' || s === 'PENDING_APPROVAL') return 'submitted';
  return 'draft';
}

export default function AdminTimesheetsPage() {
  const { activeWeekMonday, nextWeek, previousWeek, jumpToToday } = useUIStore();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { startTimer } = useTimerStore();

  const [view, setView] = useState<ViewMode>('Week');
  const [employees, setEmployees] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('ALL');
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [catalogTasks, setCatalogTasks] = useState<Task[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [formUserId, setFormUserId] = useState('');
  const [formProjectId, setFormProjectId] = useState('');
  const [formTaskId, setFormTaskId] = useState('');
  const [formDuration, setFormDuration] = useState('0:00');
  const [formDate, setFormDate] = useState(activeWeekMonday);
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [viewEntryId, setViewEntryId] = useState<string | null>(null);

  const weekDays = getWeekDays(parseISO(activeWeekMonday));
  const startDate = formatDateString(weekDays[0]);
  const endDate = formatDateString(weekDays[6]);

  const sortedEntries = useMemo(() => {
    return [...entries].sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.userName.localeCompare(b.userName);
    });
  }, [entries]);

  const viewIndex = viewEntryId
    ? sortedEntries.findIndex((e) => e.id === viewEntryId)
    : -1;
  const viewingEntry = viewIndex >= 0 ? sortedEntries[viewIndex] : null;

  const load = async () => {
    const [emps, allEntries, projs, catalog] = await Promise.all([
      teamService.getEmployees(),
      timesheetService.getAllEntries(),
      projectService.getProjects(),
      taskService.getTasks(),
    ]);
    setEmployees(emps);
    setProjects(projs);
    setCatalogTasks(catalog);
    const inWeek = allEntries.filter((e) => e.date >= startDate && e.date <= endDate);
    setEntries(
      selectedUserId === 'ALL' ? inWeek : inWeek.filter((e) => e.userId === selectedUserId)
    );
    if (!formUserId && emps[0]) setFormUserId(emps[0].id);
    if (!formProjectId && projs[0]) setFormProjectId(projs[0].id);
  };

  useEffect(() => {
    load();
  }, [activeWeekMonday, selectedUserId]);

  const selectedProject = projects.find((p) => p.id === formProjectId);
  const tasks = catalogTasks.filter((t) =>
    selectedProject
      ? !selectedProject.taskIds?.length || selectedProject.taskIds.includes(t.id)
      : true
  );

  useEffect(() => {
    if (tasks[0] && !tasks.some((t) => t.id === formTaskId)) {
      setFormTaskId(tasks[0].id);
    }
  }, [formProjectId, tasks]);

  const totalMins = entries.reduce((a, e) => a + e.durationMinutes, 0);

  const openAdd = (dateStr?: string) => {
    setFormDate(dateStr || startDate);
    setFormDuration('0:00');
    setFormNotes('');
    setFormError('');
    setIsDrawerOpen(true);
  };

  const openTimer = () => {
    setFormDate(formatDateString(new Date()));
    setFormDuration('0:00');
    setFormNotes('');
    setFormError('');
    setIsDrawerOpen(true);
  };

  useEffect(() => {
    if (searchParams.get('open') === 'timer') {
      openTimer();
      router.replace('/work/timesheets');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openView = (entry: TimeEntry) => {
    setViewEntryId(entry.id);
  };

  const closeView = () => setViewEntryId(null);

  const viewPrev = () => {
    if (viewIndex > 0) setViewEntryId(sortedEntries[viewIndex - 1].id);
  };

  const viewNext = () => {
    if (viewIndex >= 0 && viewIndex < sortedEntries.length - 1) {
      setViewEntryId(sortedEntries[viewIndex + 1].id);
    }
  };

  const handleSave = async () => {
    setFormError('');
    const mins = parseDurationToMinutes(formDuration);
    if (mins <= 0) {
      setFormError('Enter a valid duration (e.g. 0:30, 1:00).');
      return;
    }
    const user = employees.find((u) => u.id === formUserId);
    if (!user) {
      setFormError('Select an employee.');
      return;
    }
    setIsSaving(true);
    try {
      await timesheetService.saveEntry({
        userId: user.id,
        userName: user.name,
        projectId: formProjectId,
        taskId: formTaskId,
        date: formDate,
        durationMinutes: mins,
        workCompleted: formNotes || 'Admin-entered time',
      });
      setIsDrawerOpen(false);
      setMessage('Time entry saved.');
      load();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyLastWeek = async () => {
    if (selectedUserId === 'ALL') {
      setMessage('Select a teammate to copy last week.');
      return;
    }
    await timesheetService.copyPreviousWeek(selectedUserId, activeWeekMonday);
    setMessage('Copied projects from last week.');
    load();
  };

  const handleSubmitWeek = async () => {
    if (selectedUserId === 'ALL') {
      setMessage('Select a teammate to submit their week.');
      return;
    }
    await timesheetService.submitWeekForApproval(selectedUserId, startDate, endDate);
    setMessage('Week submitted for approval.');
    load();
  };

  const handleDeleteEntry = async (id: string) => {
    await timesheetService.deleteEntry(id);
    if (viewEntryId === id) closeView();
    setMessage('Entry deleted.');
    load();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex items-center gap-1">
          <h1 className="text-[28px] font-bold tracking-tight text-[#0C2A43]">Timesheet</h1>
          <span className="text-[28px] font-bold text-[#E2E8F0]" aria-hidden>
            /
          </span>
          <button
            type="button"
            onClick={openTimer}
            className="text-[28px] font-bold tracking-tight text-[#94A3B8] hover:text-[#9333EA] cursor-pointer transition-colors"
          >
            Timer
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-md border border-[#E2E8F0] bg-white p-0.5">
            {(['Day', 'Week', 'Calendar'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setView(mode)}
                className={`rounded px-3 py-1.5 text-[13px] font-semibold cursor-pointer ${
                  view === mode
                    ? 'border border-[#E2E8F0] bg-white text-[#0C2A43] shadow-sm'
                    : 'text-[#475569] hover:text-[#0C2A43]'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
          <div className="w-48">
            <Select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              options={[
                { value: 'ALL', label: 'All teammates' },
                ...employees.map((u) => ({ value: u.id, label: u.name })),
              ]}
            />
          </div>
        </div>
      </div>

      <GettingStartedPayrollBar />

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => openAdd()}
          className="flex h-8 w-8 items-center justify-center rounded-md bg-[#3B82F6] text-white hover:bg-[#2563EB] cursor-pointer"
          aria-label="Add entry"
        >
          <Plus className="h-4 w-4" />
        </button>
        <WeekNavigator
          weekStart={activeWeekMonday}
          onPrev={previousWeek}
          onNext={nextWeek}
          onJumpToday={jumpToToday}
        />
        <span className="text-[13px] font-semibold text-[#475569]">
          Total: {formatMinutesToHoursString(totalMins)}
          {sortedEntries.length > 0 ? ` · ${sortedEntries.length} entries` : ''}
        </span>
      </div>

      <AiPromptBar
        label="What would you like to add to your timesheet?"
        suggestion="2 hours today on project work"
        onRun={(text) => {
          setFormNotes(text);
          openAdd();
        }}
      />

      {message && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-[13px] text-emerald-800">
          {message}
          <button
            type="button"
            className="ml-3 underline cursor-pointer"
            onClick={() => setMessage('')}
          >
            Dismiss
          </button>
        </div>
      )}

      {view === 'Week' && (
        <>
          {entries.length === 0 ? (
            <div className="harvest-empty flex flex-col items-center justify-center px-6 py-16 text-center">
              <CalendarClocksGraphic className="mb-5 h-28 w-28" />
              <p className="max-w-md text-[14px] leading-relaxed text-[#1E293B]">
                No hours for {formatWeekRangeString(parseISO(activeWeekMonday))}. Add a row or
                switch teammate.
              </p>
            </div>
          ) : (
            <div className="harvest-card overflow-hidden p-0">
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="border-b border-[#E2E8F0] text-[12px] font-semibold text-[#475569]">
                    <th className="px-4 py-3">Person</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Project</th>
                    <th className="px-4 py-3">Task</th>
                    <th className="px-4 py-3">Hours</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {sortedEntries.map((e) => (
                    <tr
                      key={e.id}
                      className="cursor-pointer hover:bg-[#F8FAFC]"
                      onClick={() => openView(e)}
                    >
                      <td className="px-4 py-3 font-semibold">{e.userName}</td>
                      <td className="px-4 py-3 tabular-nums text-[#475569]">{e.date}</td>
                      <td className="px-4 py-3 font-semibold text-[#9333EA]">{e.projectName}</td>
                      <td className="px-4 py-3 text-[#475569]">{e.taskName}</td>
                      <td className="px-4 py-3 font-bold tabular-nums">
                        {formatMinutesToHoursString(e.durationMinutes)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={statusBadgeVariant(e.status)} size="sm">
                          {e.status}
                        </Badge>
                      </td>
                      <td
                        className="px-4 py-3 text-right"
                        onClick={(ev) => ev.stopPropagation()}
                      >
                        <ActionMenu
                          items={[
                            {
                              label: 'View entry',
                              onClick: () => openView(e),
                            },
                            {
                              label: 'Delete entry',
                              danger: true,
                              onClick: () => handleDeleteEntry(e.id),
                            },
                          ]}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {view === 'Day' && (
        <div className="space-y-3">
          {weekDays.map((day) => {
            const dayStr = formatDateString(day);
            const dayEntries = sortedEntries.filter((e) => e.date === dayStr);
            return (
              <div key={dayStr} className="harvest-card p-4">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-[14px] font-bold text-[#0C2A43]">
                    {day.toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </h3>
                  <Button size="sm" variant="primary" onClick={() => openAdd(dayStr)}>
                    Add
                  </Button>
                </div>
                {dayEntries.length === 0 ? (
                  <p className="text-[12px] text-[#475569]">No entries</p>
                ) : (
                  <ul className="space-y-1 text-[13px]">
                    {dayEntries.map((e) => (
                      <li key={e.id}>
                        <button
                          type="button"
                          onClick={() => openView(e)}
                          className="flex w-full items-center justify-between border-b border-[#F1F5F9] py-2 text-left hover:bg-[#F8FAFC] cursor-pointer"
                        >
                          <span>
                            <span className="font-semibold text-[#0C2A43]">{e.userName}</span>
                            <span className="text-[#64748B]"> · </span>
                            <span className="text-[#9333EA]">{e.projectName}</span>
                            <span className="text-[#64748B]"> · {e.taskName}</span>
                          </span>
                          <span className="flex items-center gap-2">
                            <span className="font-bold tabular-nums">
                              {formatMinutesToHoursString(e.durationMinutes)}
                            </span>
                            <Eye className="h-3.5 w-3.5 text-[#64748B]" />
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}

      {view === 'Calendar' && (
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day) => {
            const dayStr = formatDateString(day);
            const dayEntries = sortedEntries.filter((e) => e.date === dayStr);
            const mins = dayEntries.reduce((a, e) => a + e.durationMinutes, 0);
            return (
              <div
                key={dayStr}
                className="harvest-card flex min-h-[120px] flex-col p-2 text-left"
              >
                <div className="text-[12px] font-bold text-[#0C2A43]">{day.getDate()}</div>
                <div className="mt-1 text-[11px] text-[#475569]">
                  {dayEntries.length} {dayEntries.length === 1 ? 'entry' : 'entries'}
                </div>
                <div className="mt-0.5 text-[12px] font-bold text-[#9333EA]">
                  {formatMinutesToHoursString(mins)}
                </div>
                <div className="mt-auto space-y-1 pt-2">
                  {dayEntries.slice(0, 3).map((e) => (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => openView(e)}
                      className="block w-full truncate rounded bg-[#F5F0FF] px-1.5 py-0.5 text-left text-[10px] font-medium text-[#9333EA] hover:bg-[#ffe4d4] cursor-pointer"
                      title={`${e.userName} · ${e.projectName}`}
                    >
                      {e.userName.split(' ')[0]} · {formatMinutesToHoursString(e.durationMinutes)}
                    </button>
                  ))}
                  {dayEntries.length > 3 ? (
                    <button
                      type="button"
                      onClick={() => openView(dayEntries[3])}
                      className="text-[10px] font-semibold text-[#2d5bff] cursor-pointer"
                    >
                      +{dayEntries.length - 3} more
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="primary"
            leftIcon={<Plus className="h-3.5 w-3.5" />}
            onClick={() => openAdd()}
          >
            Add row
          </Button>
          <Button
            variant="outline"
            onClick={handleCopyLastWeek}
            disabled={selectedUserId === 'ALL'}
          >
            Copy from last week
          </Button>
        </div>
        <Button
          variant="outline"
          onClick={handleSubmitWeek}
          disabled={selectedUserId === 'ALL'}
        >
          Submit week for approval
        </Button>
      </div>

      <Drawer
        isOpen={!!viewingEntry}
        onClose={closeView}
        title="Time entry"
        description={
          viewingEntry && sortedEntries.length > 0
            ? `Entry ${viewIndex + 1} of ${sortedEntries.length} this week`
            : undefined
        }
        width="md"
      >
        {viewingEntry ? (
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                leftIcon={<ChevronLeft className="h-3.5 w-3.5" />}
                onClick={viewPrev}
                disabled={viewIndex <= 0}
              >
                Previous
              </Button>
              <span className="text-[12px] tabular-nums text-[#475569]">
                {viewIndex + 1} / {sortedEntries.length}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                rightIcon={<ChevronRight className="h-3.5 w-3.5" />}
                onClick={viewNext}
                disabled={viewIndex < 0 || viewIndex >= sortedEntries.length - 1}
              >
                Next
              </Button>
            </div>

            <dl className="space-y-3 text-[13px]">
              <div className="flex justify-between gap-4 border-b border-[#F1F5F9] pb-2">
                <dt className="text-[#475569]">Person</dt>
                <dd className="font-semibold text-[#0C2A43]">{viewingEntry.userName}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-[#F1F5F9] pb-2">
                <dt className="text-[#475569]">Date</dt>
                <dd className="tabular-nums text-[#0C2A43]">
                  {(() => {
                    try {
                      return format(parseISO(viewingEntry.date), 'EEE, MMM d, yyyy');
                    } catch {
                      return viewingEntry.date;
                    }
                  })()}
                </dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-[#F1F5F9] pb-2">
                <dt className="text-[#475569]">Project</dt>
                <dd className="text-right font-semibold text-[#9333EA]">
                  {viewingEntry.projectName}
                  {viewingEntry.projectCode ? (
                    <span className="ml-1 font-mono text-[11px] text-[#475569]">
                      ({viewingEntry.projectCode})
                    </span>
                  ) : null}
                </dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-[#F1F5F9] pb-2">
                <dt className="text-[#475569]">Task</dt>
                <dd className="text-[#0C2A43]">{viewingEntry.taskName}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-[#F1F5F9] pb-2">
                <dt className="text-[#475569]">Duration</dt>
                <dd className="text-[15px] font-bold tabular-nums text-[#0C2A43]">
                  {formatMinutesToHoursString(viewingEntry.durationMinutes)}
                  <span className="ml-1 text-[12px] font-normal text-[#475569]">
                    ({viewingEntry.durationMinutes} min)
                  </span>
                </dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-[#F1F5F9] pb-2">
                <dt className="text-[#475569]">Status</dt>
                <dd>
                  <Badge variant={statusBadgeVariant(viewingEntry.status)}>
                    {viewingEntry.status}
                  </Badge>
                </dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-[#F1F5F9] pb-2">
                <dt className="text-[#475569]">Billable</dt>
                <dd>
                  <Badge variant={viewingEntry.isBillable ? 'billable' : 'nonbillable'}>
                    {viewingEntry.isBillable ? 'Billable' : 'Non-billable'}
                  </Badge>
                </dd>
              </div>
              <div>
                <dt className="mb-1.5 text-[#475569]">Notes</dt>
                <dd className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2.5 text-[13px] leading-relaxed text-[#1E293B]">
                  {viewingEntry.workCompleted || (
                    <span className="text-[#64748B]">No notes</span>
                  )}
                </dd>
              </div>
            </dl>

            <div className="flex flex-wrap justify-between gap-2 border-t border-[#E2E8F0] pt-4">
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={() => handleDeleteEntry(viewingEntry.id)}
              >
                Delete
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={closeView}>
                Close
              </Button>
            </div>
          </div>
        ) : null}
      </Drawer>

      <TimeEntryModal
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        mode="create"
        projects={projects}
        tasks={tasks}
        projectId={formProjectId}
        taskId={formTaskId}
        date={formDate}
        durationInput={formDuration}
        notes={formNotes}
        error={formError}
        isSaving={isSaving}
        onProjectChange={setFormProjectId}
        onTaskChange={setFormTaskId}
        onDateChange={setFormDate}
        onDurationChange={setFormDuration}
        onNotesChange={setFormNotes}
        onSave={handleSave}
        onStartTimer={async () => {
          if (!formProjectId || !formTaskId) {
            setFormError('Select a project and task.');
            return;
          }
          const project = projects.find((p) => p.id === formProjectId);
          const task = tasks.find((t) => t.id === formTaskId);
          try {
            await startTimer(formProjectId, formTaskId, {
              projectName: project?.name,
              projectCode: project?.code,
              taskName: task?.name,
              description: formNotes || undefined,
            });
            setIsDrawerOpen(false);
          } catch (e) {
            setFormError(e instanceof Error ? e.message : 'Could not start timer');
          }
        }}
      >
        <div className="flex flex-col gap-1.5">
          <label htmlFor="admin-entry-employee" className="text-[13px] font-bold text-[#1d1d1d]">
            Employee
          </label>
          <select
            id="admin-entry-employee"
            value={formUserId}
            onChange={(e) => setFormUserId(e.target.value)}
            className="h-10 w-full appearance-none rounded border border-[#cfcfcf] bg-white px-3 text-[14px] text-[#1d1d1d] outline-none focus:border-[#8a8a8a] focus:ring-1 focus:ring-[#8a8a8a]/40 cursor-pointer"
          >
            {employees.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>
      </TimeEntryModal>
    </div>
  );
}
