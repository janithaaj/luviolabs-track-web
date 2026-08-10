'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../../src/store/use-auth-store';
import { useUIStore, TimesheetViewMode } from '../../../src/store/use-ui-store';
import { useTimerStore } from '../../../src/store/use-timer-store';
import { timesheetService } from '../../../src/services/timesheet-service';
import { projectService } from '../../../src/services/project-service';
import { taskService } from '../../../src/services/task-service';
import { TimeEntry, WeeklySubmission, Project, Task } from '../../../src/types';
import {
  getWeekDays,
  formatWeekRangeString,
  formatDateString,
  formatMinutesToHoursString,
  parseDurationToMinutes,
  cn,
} from '../../../src/lib/utils';
import { Button } from '../../../src/components/ui/button';
import { Modal } from '../../../src/components/ui/modal';
import { Badge } from '../../../src/components/ui/badge';
import { WeekNavigator } from '../../../src/components/common/WeekNavigator';
import { CalendarClocksGraphic } from '../../../src/components/common/EmptyStateGraphics';
import {
  TimeEntryModal,
  formatMinutesAsColon,
} from '../../../src/components/common/TimeEntryModal';
import {
  Plus,
  Copy,
  Send,
  Trash2,
  Edit2,
  AlertTriangle,
  Lock,
  ChevronDown,
} from 'lucide-react';
import { format, parseISO, isSameDay } from 'date-fns';

type ViewTab = 'Day' | 'Week' | 'Calendar';

const viewTabFromMode = (mode: TimesheetViewMode): ViewTab => {
  if (mode === 'day') return 'Day';
  if (mode === 'calendar') return 'Calendar';
  return 'Week';
};

const modeFromTab = (tab: ViewTab): TimesheetViewMode => {
  if (tab === 'Day') return 'day';
  if (tab === 'Calendar') return 'calendar';
  return 'week';
};

export default function TimesheetPage() {
  const { currentUser } = useAuthStore();
  const {
    activeWeekMonday,
    nextWeek,
    previousWeek,
    jumpToToday,
    timesheetViewMode,
    setTimesheetViewMode,
    isEntryDrawerOpen,
    openEntryDrawer,
    closeEntryDrawer,
    editingEntry,
    selectedDateForEntry,
  } = useUIStore();

  const { startTimer, lastLoggedAt } = useTimerStore();

  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [submission, setSubmission] = useState<WeeklySubmission | null>(null);
  const [assignedProjects, setAssignedProjects] = useState<Project[]>([]);
  const [catalogTasks, setCatalogTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');

  const [formProjectId, setFormProjectId] = useState('');
  const [formTaskId, setFormTaskId] = useState('');
  const [formDurationInput, setFormDurationInput] = useState('0:00');
  const [formWorkCompleted, setFormWorkCompleted] = useState('');
  const [formDate, setFormDate] = useState(activeWeekMonday);
  const [formError, setFormError] = useState('');
  const [isSavingEntry, setIsSavingEntry] = useState(false);

  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const mondayDate = parseISO(activeWeekMonday);
  const weekDays = getWeekDays(mondayDate);
  const startDateStr = formatDateString(weekDays[0]);
  const endDateStr = formatDateString(weekDays[6]);
  const userId = currentUser?.id || '';
  const viewTab = viewTabFromMode(timesheetViewMode);

  const loadData = async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const [fetchedEntries, fetchedSub, fetchedProjects, fetchedTasks] = await Promise.all([
        timesheetService.getEntriesForUserAndRange(userId, startDateStr, endDateStr),
        timesheetService.getWeeklySubmission(userId, startDateStr),
        projectService.getProjectsForUser(userId),
        taskService.getTasks(),
      ]);
      setEntries(fetchedEntries);
      setSubmission(fetchedSub);
      setAssignedProjects(fetchedProjects);
      setCatalogTasks(fetchedTasks);
      if (fetchedProjects.length > 0 && !formProjectId) {
        setFormProjectId(fetchedProjects[0].id);
      }
    } catch (e) {
      console.error('Failed to load timesheet data', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [userId, activeWeekMonday]);

  // Reload entries after timer stop → time entry created
  useEffect(() => {
    if (!lastLoggedAt || !userId) return;
    loadData();
    setMessage('Timer saved to today\'s timesheet.');
  }, [lastLoggedAt]);

  useEffect(() => {
    if (editingEntry) {
      setFormProjectId(editingEntry.projectId);
      setFormTaskId(editingEntry.taskId);
      setFormDurationInput(formatMinutesAsColon(editingEntry.durationMinutes));
      setFormWorkCompleted(editingEntry.workCompleted);
      setFormDate(editingEntry.date);
      setFormError('');
    } else if (isEntryDrawerOpen) {
      setFormDurationInput('0:00');
      setFormWorkCompleted('');
      setFormDate(selectedDateForEntry || formatDateString(weekDays[0]));
      setFormError('');
      if (assignedProjects.length > 0) {
        setFormProjectId(assignedProjects[0].id);
      }
    }
  }, [editingEntry, selectedDateForEntry, assignedProjects, isEntryDrawerOpen]);

  const selectedProject = assignedProjects.find((p) => p.id === formProjectId);
  const availableTasks = catalogTasks.filter((t) =>
    selectedProject
      ? !selectedProject.taskIds?.length || selectedProject.taskIds.includes(t.id)
      : true
  );

  useEffect(() => {
    if (
      availableTasks.length > 0 &&
      (!formTaskId || !availableTasks.some((t) => t.id === formTaskId))
    ) {
      setFormTaskId(availableTasks[0].id);
    }
  }, [formProjectId, availableTasks]);

  const isLocked = submission?.status === 'SUBMITTED' || submission?.status === 'APPROVED';
  const totalWeeklyMinutes = entries.reduce((acc, curr) => acc + curr.durationMinutes, 0);

  const projectMap = new Map<
    string,
    { project: Project | { id: string; name: string; code: string }; days: TimeEntry[][] }
  >();

  for (const proj of assignedProjects) {
    projectMap.set(proj.id, {
      project: proj,
      days: Array.from({ length: 7 }, () => []),
    });
  }
  for (const entry of entries) {
    if (!projectMap.has(entry.projectId)) {
      projectMap.set(entry.projectId, {
        project: { id: entry.projectId, name: entry.projectName, code: entry.projectCode },
        days: Array.from({ length: 7 }, () => []),
      });
    }
    const dayIndex = weekDays.findIndex((d) => formatDateString(d) === entry.date);
    if (dayIndex >= 0) {
      projectMap.get(entry.projectId)!.days[dayIndex].push(entry);
    }
  }

  const dailyTotalsMinutes = weekDays.map((day) => {
    const dayStr = formatDateString(day);
    return entries
      .filter((e) => e.date === dayStr)
      .reduce((acc, curr) => acc + curr.durationMinutes, 0);
  });

  const openAdd = (dateStr?: string) => {
    if (isLocked) return;
    openEntryDrawer(undefined, dateStr || startDateStr);
  };

  const handleSaveEntry = async () => {
    setFormError('');
    const parsedMins = parseDurationToMinutes(formDurationInput);
    if (parsedMins <= 0) {
      setFormError('Please enter a valid duration (e.g. 0:30, 1:00, 2.5).');
      return;
    }
    if (!formProjectId) {
      setFormError('Select a project.');
      return;
    }
    setIsSavingEntry(true);
    try {
      if (!currentUser) {
        setFormError('You must be signed in.');
        return;
      }
      const task = availableTasks.find((t) => t.id === formTaskId);
      await timesheetService.saveEntry({
        id: editingEntry?.id,
        userId: currentUser.id,
        userName: currentUser.name,
        projectId: formProjectId,
        taskId: formTaskId,
        taskName: task?.name,
        date: formDate,
        durationMinutes: parsedMins,
        workCompleted: formWorkCompleted || 'Time entry',
      });
      closeEntryDrawer();
      setMessage('Time entry saved.');
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save entry.';
      setFormError(msg);
    } finally {
      setIsSavingEntry(false);
    }
  };

  const handleStartTimerFromModal = async () => {
    if (!formProjectId || !formTaskId) {
      setFormError('Select a project and task.');
      return;
    }
    const project = assignedProjects.find((p) => p.id === formProjectId);
    const task = availableTasks.find((t) => t.id === formTaskId);
    try {
      await startTimer(formProjectId, formTaskId, {
        projectName: project?.name,
        projectCode: project?.code,
        taskName: task?.name,
        description: formWorkCompleted || undefined,
      });
      closeEntryDrawer();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Could not start timer');
    }
  };

  const handleDeleteEntry = async (id: string) => {
    if (!confirm('Delete this time entry?')) return;
    await timesheetService.deleteEntry(id);
    loadData();
  };

  const handleCopyPreviousWeek = async () => {
    if (!currentUser || isLocked) return;
    await timesheetService.copyPreviousWeek(currentUser.id, activeWeekMonday);
    setMessage('Copied projects from last week.');
    loadData();
  };

  const handleSubmitWeek = async () => {
    if (!currentUser) return;
    setIsSubmitting(true);
    try {
      await timesheetService.submitWeekForApproval(currentUser.id, startDateStr, endDateStr);
      setIsSubmitModalOpen(false);
      setMessage('Week submitted for approval.');
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to submit week.';
      setMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openTimer = () => {
    if (isLocked) return;
    setFormDurationInput('0:00');
    setFormWorkCompleted('');
    setFormError('');
    openAdd(formatDateString(new Date()));
  };

  const statusBadge = () => {
    if (!submission || submission.status === 'DRAFT') return null;
    const s = submission.status;
    const styles =
      s === 'APPROVED'
        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
        : s === 'REJECTED'
          ? 'bg-rose-50 text-rose-800 border-rose-200'
          : 'bg-amber-50 text-amber-900 border-amber-200';
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide',
          styles
        )}
      >
        {(s === 'SUBMITTED' || s === 'PENDING_APPROVAL') && <Lock className="h-3 w-3" />}
        {s.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div className="space-y-5">
      {/* Header: Timesheet / Timer (opens entry modal on same page) */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-1">
            <h1 className="text-[28px] font-bold tracking-tight text-[#0C2A43]">Timesheet</h1>
            <span className="text-[28px] font-bold text-[#E2E8F0]" aria-hidden>
              /
            </span>
            <button
              type="button"
              onClick={openTimer}
              disabled={isLocked || assignedProjects.length === 0}
              className="text-[28px] font-bold tracking-tight text-[#94A3B8] hover:text-[#9333EA] disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer transition-colors"
            >
              Timer
            </button>
          </div>
          {statusBadge()}
        </div>
        <div className="inline-flex rounded-md border border-[#E2E8F0] bg-white p-0.5">
          {(['Day', 'Week', 'Calendar'] as ViewTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setTimesheetViewMode(modeFromTab(tab))}
              className={cn(
                'rounded px-3.5 py-1.5 text-[13px] font-semibold cursor-pointer transition-colors',
                viewTab === tab
                  ? 'border border-[#9333EA] bg-white text-[#9333EA] shadow-sm'
                  : 'text-[#475569] hover:text-[#0C2A43]'
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {assignedProjects.length === 0 && !isLoading && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-900">
          No projects assigned yet. Ask your admin to add you to a project before logging time.
        </div>
      )}

      {submission?.status === 'REJECTED' && (
        <div className="flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
          <div className="text-[13px] text-rose-900">
            <p className="font-semibold">Timesheet rejected</p>
            {submission.rejectionComment && (
              <p className="mt-0.5 text-rose-800">Reason: {submission.rejectionComment}</p>
            )}
            <p className="mt-1 text-[12px] text-rose-700">
              Entries are unlocked. Fix them and submit again.
            </p>
          </div>
        </div>
      )}

      {/* Toolbar: + week nav total */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => openAdd()}
          disabled={isLocked || assignedProjects.length === 0}
          className="flex h-8 w-8 items-center justify-center rounded-md bg-[#3B82F6] text-white hover:bg-[#2563EB] disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
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
        <span className="text-[13px] font-semibold tabular-nums text-[#475569]">
          Total: {formatMinutesToHoursString(totalWeeklyMinutes)}
        </span>
      </div>

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

      {/* WEEK VIEW */}
      {viewTab === 'Week' && (
        <>
          {!isLoading && entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl bg-[#f5f1ea] px-6 py-16 text-center">
              <CalendarClocksGraphic className="mb-5 h-28 w-28" />
              <p className="max-w-md text-[14px] leading-relaxed text-[#1E293B]">
                This is the Week view of your timesheet, perfect for speedily entering a lot of time
                at once!
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-[#E2E8F0] bg-white">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] border-collapse text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                      <th className="w-48 px-4 py-3 text-[12px] font-semibold text-[#475569]">
                        Project
                      </th>
                      {weekDays.map((day, idx) => {
                        const isToday = isSameDay(day, new Date());
                        return (
                          <th
                            key={idx}
                            className={cn(
                              'px-2 py-3 text-center text-[12px] font-semibold text-[#475569]',
                              isToday && 'bg-[#F5F0FF]'
                            )}
                          >
                            <div className="text-[11px] uppercase tracking-wide">
                              {format(day, 'EEE')}
                            </div>
                            <div
                              className={cn(
                                'mt-0.5 text-[14px] font-bold tabular-nums',
                                isToday ? 'text-[#9333EA]' : 'text-[#0C2A43]'
                              )}
                            >
                              {format(day, 'd')}
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F1F5F9]">
                    {Array.from(projectMap.values()).map(({ project, days }) => (
                      <tr key={project.id} className="hover:bg-[#F8FAFC]/80">
                        <td className="px-4 py-3 align-top">
                          <div className="font-semibold text-[#0C2A43]">{project.name}</div>
                          <div className="text-[11px] font-mono text-[#64748B]">
                            {'code' in project ? project.code : ''}
                          </div>
                        </td>
                        {days.map((dayEntries, idx) => {
                          const dayDateStr = formatDateString(weekDays[idx]);
                          const cellMins = dayEntries.reduce((s, e) => s + e.durationMinutes, 0);
                          const isToday = isSameDay(weekDays[idx], new Date());
                          return (
                            <td
                              key={idx}
                              className={cn(
                                'px-1.5 py-2 text-center align-top',
                                isToday && 'bg-[#F8F5FF]/60'
                              )}
                            >
                              {dayEntries.length > 0 ? (
                                <div className="space-y-1">
                                  {dayEntries.map((entry) => (
                                    <button
                                      key={entry.id}
                                      type="button"
                                      disabled={isLocked}
                                      onClick={() => !isLocked && openEntryDrawer(entry)}
                                      className={cn(
                                        'w-full rounded-md border border-[#E2E8F0] bg-white px-1.5 py-1.5 text-left shadow-sm',
                                        !isLocked && 'hover:border-[#9333EA]/50 cursor-pointer'
                                      )}
                                    >
                                      <div className="text-center text-[12px] font-bold tabular-nums text-[#0C2A43]">
                                        {formatMinutesToHoursString(entry.durationMinutes)}
                                      </div>
                                      <div className="truncate text-center text-[10px] text-[#475569]">
                                        {entry.taskName}
                                      </div>
                                    </button>
                                  ))}
                                  {cellMins > 0 && dayEntries.length > 1 && (
                                    <div className="text-[10px] font-semibold text-[#64748B]">
                                      {formatMinutesToHoursString(cellMins)}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  disabled={isLocked}
                                  onClick={() => openAdd(dayDateStr)}
                                  className={cn(
                                    'mx-auto flex h-9 w-full max-w-[72px] items-center justify-center rounded-md text-[#c4bfb8]',
                                    !isLocked &&
                                      'hover:bg-[#F5F0FF] hover:text-[#9333EA] cursor-pointer'
                                  )}
                                  aria-label={`Add time on ${dayDateStr}`}
                                >
                                  {!isLocked ? <Plus className="h-3.5 w-3.5" /> : '—'}
                                </button>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-[#E2E8F0] bg-[#F8FAFC]">
                      <td className="px-4 py-3 text-[12px] font-bold uppercase text-[#475569]">
                        Total
                      </td>
                      {dailyTotalsMinutes.map((mins, idx) => (
                        <td
                          key={idx}
                          className="px-2 py-3 text-center text-[12px] font-bold tabular-nums text-[#0C2A43]"
                        >
                          {formatMinutesToHoursString(mins)}
                        </td>
                      ))}
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* DAY VIEW */}
      {viewTab === 'Day' && (
        <div className="space-y-3">
          {weekDays.map((day) => {
            const dayStr = formatDateString(day);
            const dayEntries = entries.filter((e) => e.date === dayStr);
            const dayMins = dayEntries.reduce((a, e) => a + e.durationMinutes, 0);
            const isToday = isSameDay(day, new Date());
            return (
              <div
                key={dayStr}
                className={cn(
                  'rounded-lg border border-[#E2E8F0] bg-white p-4',
                  isToday && 'border-[#9333EA]/35'
                )}
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div>
                    <h3 className="text-[14px] font-bold text-[#0C2A43]">
                      {format(day, 'EEEE, MMM d')}
                    </h3>
                    <p className="text-[12px] text-[#475569] tabular-nums">
                      {formatMinutesToHoursString(dayMins)}
                    </p>
                  </div>
                  {!isLocked && (
                    <Button size="sm" variant="primary" onClick={() => openAdd(dayStr)}>
                      Add
                    </Button>
                  )}
                </div>
                {dayEntries.length === 0 ? (
                  <p className="text-[13px] text-[#64748B]">No entries</p>
                ) : (
                  <ul className="divide-y divide-[#F1F5F9]">
                    {dayEntries.map((entry) => (
                      <li
                        key={entry.id}
                        className="flex items-start justify-between gap-3 py-2.5"
                      >
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-[#9333EA]">
                            {entry.projectName}
                          </p>
                          <p className="text-[12px] text-[#475569]">{entry.taskName}</p>
                          {entry.workCompleted && (
                            <p className="mt-0.5 truncate text-[12px] text-[#1E293B]">
                              {entry.workCompleted}
                            </p>
                          )}
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <span className="text-[13px] font-bold tabular-nums text-[#0C2A43]">
                            {formatMinutesToHoursString(entry.durationMinutes)}
                          </span>
                          {!isLocked && (
                            <>
                              <button
                                type="button"
                                onClick={() => openEntryDrawer(entry)}
                                className="rounded p-1 text-[#475569] hover:bg-[#f5f3f0] hover:text-[#0C2A43] cursor-pointer"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteEntry(entry.id)}
                                className="rounded p-1 text-[#475569] hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* CALENDAR VIEW */}
      {viewTab === 'Calendar' && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-7">
          {weekDays.map((day) => {
            const dayStr = formatDateString(day);
            const dayEntries = entries.filter((e) => e.date === dayStr);
            const mins = dayEntries.reduce((a, e) => a + e.durationMinutes, 0);
            const isToday = isSameDay(day, new Date());
            return (
              <button
                key={dayStr}
                type="button"
                onClick={() => openAdd(dayStr)}
                disabled={isLocked}
                className={cn(
                  'min-h-[110px] rounded-lg border border-[#E2E8F0] bg-white p-2.5 text-left transition-colors',
                  isToday && 'border-[#9333EA]/40 bg-[#F8F5FF]',
                  !isLocked && 'hover:border-[#9333EA]/50 cursor-pointer'
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase text-[#475569]">
                    {format(day, 'EEE')}
                  </span>
                  <span
                    className={cn(
                      'text-[13px] font-bold tabular-nums',
                      isToday ? 'text-[#9333EA]' : 'text-[#0C2A43]'
                    )}
                  >
                    {format(day, 'd')}
                  </span>
                </div>
                <div className="mt-2 text-[11px] text-[#64748B]">
                  {dayEntries.length} {dayEntries.length === 1 ? 'entry' : 'entries'}
                </div>
                <div className="mt-1 text-[13px] font-bold tabular-nums text-[#9333EA]">
                  {formatMinutesToHoursString(mins)}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Bottom actions (Harvest style) */}
      <div className="flex flex-col gap-3 border-t border-[#E2E8F0] pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="primary"
            leftIcon={<Plus className="h-3.5 w-3.5" />}
            onClick={() => openAdd()}
            disabled={isLocked || assignedProjects.length === 0}
          >
            Add row
          </Button>
          <Button
            variant="outline"
            leftIcon={<Copy className="h-3.5 w-3.5" />}
            onClick={handleCopyPreviousWeek}
            disabled={isLocked}
          >
            Copy from last week
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isLocked ? (
            <div className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-[13px] font-semibold text-emerald-800">
              <Lock className="h-3.5 w-3.5" />
              Week locked & submitted
            </div>
          ) : (
            <Button
              variant="outline"
              onClick={() => setIsSubmitModalOpen(true)}
              disabled={entries.length === 0}
              rightIcon={<ChevronDown className="h-3.5 w-3.5" />}
              leftIcon={<Send className="h-3.5 w-3.5" />}
            >
              Submit week for approval
            </Button>
          )}
        </div>
      </div>

      <TimeEntryModal
        isOpen={isEntryDrawerOpen}
        onClose={closeEntryDrawer}
        mode={editingEntry ? 'edit' : 'create'}
        projects={assignedProjects}
        tasks={availableTasks}
        projectId={formProjectId}
        taskId={formTaskId}
        date={formDate}
        durationInput={formDurationInput}
        notes={formWorkCompleted}
        error={formError}
        isSaving={isSavingEntry}
        onProjectChange={setFormProjectId}
        onTaskChange={setFormTaskId}
        onDateChange={setFormDate}
        onDurationChange={setFormDurationInput}
        onNotesChange={setFormWorkCompleted}
        onSave={handleSaveEntry}
        onStartTimer={handleStartTimerFromModal}
      />

      <Modal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        title="Submit week for approval"
        description={`Submit ${formatMinutesToHoursString(totalWeeklyMinutes)} for ${formatWeekRangeString(mondayDate)}`}
      >
        <div className="space-y-4">
          <div className="space-y-2 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-3 text-[13px]">
            <div className="flex justify-between">
              <span className="text-[#475569]">Total hours</span>
              <span className="font-bold tabular-nums">
                {formatMinutesToHoursString(totalWeeklyMinutes)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#475569]">Capacity</span>
              <span className="tabular-nums text-[#1E293B]">
                {currentUser?.capacityHours ?? 40}h
              </span>
            </div>
          </div>
          <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-900">
            After you submit, entries are locked until an admin approves or rejects the week.
          </p>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" onClick={() => setIsSubmitModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmitWeek}
              isLoading={isSubmitting}
              leftIcon={<Send className="h-4 w-4" />}
            >
              Submit timesheet
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
