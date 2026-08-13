'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { cn, parseDurationToMinutes } from '../../lib/utils';
import { Project, Task } from '../../types';

export function formatMinutesAsColon(minutes: number): string {
  const total = Math.max(0, Math.round(minutes || 0));
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${h}:${String(m).padStart(2, '0')}`;
}

export interface TimeEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  projects: Project[];
  tasks: Task[];
  projectId: string;
  taskId: string;
  date: string;
  durationInput: string;
  notes: string;
  error?: string;
  onProjectChange: (id: string) => void;
  onTaskChange: (id: string) => void;
  onDateChange: (value: string) => void;
  onDurationChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onSave: () => void | Promise<void>;
  onStartTimer?: () => void | Promise<void>;
  /**
   * log = Save hours (default for + Add)
   * timer = Start timer when duration is empty
   */
  intent?: 'log' | 'timer';
  /** Extra fields above project (e.g. employee select for admin). */
  children?: React.ReactNode;
  isSaving?: boolean;
}

export const TimeEntryModal: React.FC<TimeEntryModalProps> = ({
  isOpen,
  onClose,
  mode,
  projects,
  tasks,
  projectId,
  taskId,
  date,
  durationInput,
  notes,
  error,
  onProjectChange,
  onTaskChange,
  onDateChange,
  onDurationChange,
  onNotesChange,
  onSave,
  onStartTimer,
  intent = 'log',
  children,
  isSaving,
}) => {
  const titleId = useId();
  const selectedProject = projects.find((p) => p.id === projectId);
  const durationMinutes = parseDurationToMinutes(durationInput);
  const canSave = durationMinutes > 0;
  const showStartTimer =
    intent === 'timer' && mode === 'create' && !!onStartTimer && !canSave;

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handlePrimary = async () => {
    if (showStartTimer) {
      await onStartTimer?.();
      return;
    }
    await onSave();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6">
      <div className="fixed inset-0 bg-black/45" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 max-h-[92dvh] w-full max-w-[520px] overflow-y-auto rounded-t-xl border border-[#d6d6d6] bg-white shadow-[0_12px_40px_rgba(0,0,0,0.22)] sm:rounded-md"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#ebebeb] px-4 py-4 sm:px-5">
          <h2 id={titleId} className="text-[20px] font-bold leading-tight text-[#1d1d1d]">
            {mode === 'edit'
              ? 'Edit time entry'
              : intent === 'timer'
                ? 'Start timer'
                : 'New time entry'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-[#6b6b6b] hover:bg-[#f3f3f3] hover:text-[#1d1d1d] cursor-pointer"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          className="px-4 py-4 sm:px-5"
          onSubmit={(e) => {
            e.preventDefault();
            void handlePrimary();
          }}
        >
          <div className="space-y-4">
            {children}

            {error && (
              <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label htmlFor="time-entry-date" className="text-[13px] font-bold text-[#1d1d1d]">
                Date
              </label>
              <input
                id="time-entry-date"
                type="date"
                value={date}
                onChange={(e) => onDateChange(e.target.value)}
                className="h-10 w-full rounded border border-[#cfcfcf] bg-white px-3 text-[14px] text-[#1d1d1d] outline-none focus:border-[#8a8a8a] focus:ring-1 focus:ring-[#8a8a8a]/40"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-[13px] font-bold text-[#1d1d1d]">Project / Task</span>
              <ProjectPicker
                projects={projects}
                value={projectId}
                onChange={onProjectChange}
              />
              <div className="relative">
                <select
                  aria-label="Task"
                  value={taskId}
                  onChange={(e) => onTaskChange(e.target.value)}
                  className="h-10 w-full appearance-none rounded border border-[#cfcfcf] bg-white px-3 pr-9 text-[14px] text-[#1d1d1d] outline-none focus:border-[#8a8a8a] focus:ring-1 focus:ring-[#8a8a8a]/40 cursor-pointer"
                >
                  {tasks.length === 0 ? (
                    <option value="">No tasks available</option>
                  ) : (
                    tasks.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))
                  )}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b6b6b]" />
              </div>
            </div>

            <div className="flex gap-3">
              <textarea
                aria-label="Notes"
                placeholder="Notes (optional)"
                value={notes}
                onChange={(e) => onNotesChange(e.target.value)}
                rows={3}
                className="min-h-[72px] flex-1 resize-y rounded border border-[#cfcfcf] bg-white px-3 py-2.5 text-[14px] text-[#1d1d1d] placeholder:text-[#9a9a9a] outline-none focus:border-[#8a8a8a] focus:ring-1 focus:ring-[#8a8a8a]/40"
              />
              <input
                aria-label="Duration"
                value={durationInput}
                onChange={(e) => onDurationChange(e.target.value)}
                placeholder="0:00"
                className="h-[72px] w-[104px] shrink-0 rounded border border-[#cfcfcf] bg-white text-center text-[28px] font-semibold tabular-nums text-[#1d1d1d] outline-none focus:border-[#8a8a8a] focus:ring-1 focus:ring-[#8a8a8a]/40"
              />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2.5 border-t border-[#ebebeb] pt-4">
            <button
              type="submit"
              disabled={isSaving || (showStartTimer ? !projectId || !taskId : !canSave)}
              className={cn(
                'inline-flex h-9 items-center justify-center rounded px-3.5 text-[14px] font-semibold text-white cursor-pointer disabled:cursor-not-allowed disabled:opacity-50',
                'bg-[#9333EA] hover:bg-[#7e22ce]'
              )}
            >
              {showStartTimer ? 'Start timer' : mode === 'edit' ? 'Save' : 'Save'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 items-center justify-center rounded border border-[#cfcfcf] bg-white px-3.5 text-[14px] font-semibold text-[#1d1d1d] hover:bg-[#f7f7f7] cursor-pointer"
            >
              Cancel
            </button>
            {selectedProject?.type === 'NON_BILLABLE' && (
              <span className="ml-auto text-[12px] font-medium text-[#6b6b6b]">Non-billable</span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

function ProjectPicker({
  projects,
  value,
  onChange,
}: {
  projects: Project[];
  value: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = projects.find((p) => p.id === value);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-[52px] w-full items-center justify-between rounded border border-[#cfcfcf] bg-white px-3 text-left hover:border-[#b5b5b5] cursor-pointer"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="min-w-0">
          {selected ? (
            <>
              <span className="block truncate text-[12px] leading-tight text-[#6b6b6b]">
                {selected.clientName || 'Client'}
              </span>
              <span className="block truncate text-[14px] font-medium leading-tight text-[#1d1d1d]">
                {selected.name}
              </span>
            </>
          ) : (
            <span className="text-[14px] text-[#9a9a9a]">Select a project</span>
          )}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-[#6b6b6b]" />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded border border-[#cfcfcf] bg-white py-1 shadow-lg"
        >
          {projects.length === 0 ? (
            <li className="px-3 py-2 text-[13px] text-[#6b6b6b]">No projects assigned</li>
          ) : (
            projects.map((p) => (
              <li key={p.id} role="option" aria-selected={p.id === value}>
                <button
                  type="button"
                  className={cn(
                    'flex w-full flex-col px-3 py-2 text-left hover:bg-[#f5f5f5] cursor-pointer',
                    p.id === value && 'bg-[#F5F0FF]'
                  )}
                  onClick={() => {
                    onChange(p.id);
                    setOpen(false);
                  }}
                >
                  <span className="truncate text-[12px] text-[#6b6b6b]">
                    {p.clientName || 'Client'}
                  </span>
                  <span className="truncate text-[14px] font-medium text-[#1d1d1d]">{p.name}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
