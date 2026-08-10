import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { format } from 'date-fns';
import { DEFAULT_GLOBAL_TASKS } from '../lib/constants';
import { apiCall } from '../services/api-client';

export interface ActiveTimer {
  id: string;
  projectId: string;
  projectName: string;
  projectCode: string;
  taskId: string;
  taskName: string;
  elapsedSeconds: number;
  isRunning: boolean;
  startTime: string;
  workCompleted: string;
}

interface TimerState {
  activeTimer: ActiveTimer | null;
  isStopModalOpen: boolean;
  lastLoggedAt: number | null;
  fetchActiveTimer: () => Promise<void>;
  startTimer: (
    projectId: string,
    taskId: string,
    options?: {
      description?: string;
      projectName?: string;
      projectCode?: string;
      taskName?: string;
    }
  ) => Promise<void>;
  pauseTimer: () => Promise<void>;
  resumeTimer: () => Promise<void>;
  stopTimer: () => void;
  confirmStopTimer: (description: string) => Promise<void>;
  discardTimer: () => Promise<void>;
  resetTimer: () => void;
  tick: () => void;
  updateWorkDescription: (text: string) => void;
  setStopModalOpen: (open: boolean) => void;
}

function isValidApiTimer(t: Record<string, unknown> | null | undefined): t is Record<string, unknown> {
  if (!t || typeof t !== 'object') return false;
  const id = t.id || t._id;
  const projectId = (t.projectId as { _id?: string })?._id || t.projectId;
  return Boolean(id && projectId);
}

function mapApiTimer(t: Record<string, unknown>): ActiveTimer {
  return {
    id: String(t.id || t._id || ''),
    projectId: String((t.projectId as any)?._id || t.projectId || ''),
    projectName: String((t.projectId as any)?.name || t.projectName || 'Project'),
    projectCode: String((t.projectId as any)?.code || t.projectCode || ''),
    taskId: String((t.taskId as any)?._id || t.taskId || ''),
    taskName: String((t.taskId as any)?.name || t.taskName || 'Task'),
    elapsedSeconds: Number(t.elapsedSeconds ?? t.accumulatedSeconds ?? 0),
    isRunning: t.isRunning != null ? Boolean(t.isRunning) : t.status === 'RUNNING',
    startTime: String(t.startTime || t.startedAt || new Date().toISOString()),
    workCompleted: String(t.description || t.workCompleted || ''),
  };
}

function localTodayYmd() {
  return format(new Date(), 'yyyy-MM-dd');
}

export const useTimerStore = create<TimerState>()(
  persist(
    (set, get) => ({
      activeTimer: null,
      isStopModalOpen: false,
      lastLoggedAt: null,

      fetchActiveTimer: async () => {
        const res = await apiCall<Record<string, unknown> | null>('/timers/active');
        if (isValidApiTimer(res.data)) {
          set({ activeTimer: mapApiTimer(res.data) });
        } else if (!get().isStopModalOpen) {
          set({ activeTimer: null });
        }
      },

      startTimer: async (projectId, taskId, options = {}) => {
        const task =
          DEFAULT_GLOBAL_TASKS.find((t) => t.id === taskId) ||
          ({ id: taskId, name: options.taskName || 'Task' } as { id: string; name: string });

        const res = await apiCall<Record<string, unknown>>('/timers/start', {
          method: 'POST',
          body: JSON.stringify({
            projectId,
            taskId,
            description: options.description,
            projectName: options.projectName,
            projectCode: options.projectCode,
            taskName: options.taskName || task.name,
          }),
        });
        if (res.error || !isValidApiTimer(res.data)) {
          throw new Error(res.error || 'Failed to start timer');
        }
        set({ activeTimer: mapApiTimer(res.data) });
      },

      pauseTimer: async () => {
        const { activeTimer } = get();
        if (!activeTimer) return;
        const res = await apiCall<Record<string, unknown>>('/timers/pause', {
          method: 'POST',
        });
        if (isValidApiTimer(res.data)) {
          set({ activeTimer: mapApiTimer(res.data) });
        } else {
          set({ activeTimer: { ...activeTimer, isRunning: false } });
        }
      },

      resumeTimer: async () => {
        const { activeTimer } = get();
        if (!activeTimer) return;
        const res = await apiCall<Record<string, unknown>>('/timers/resume', {
          method: 'POST',
        });
        if (isValidApiTimer(res.data)) {
          set({ activeTimer: mapApiTimer(res.data) });
        } else {
          set({ activeTimer: { ...activeTimer, isRunning: true } });
        }
      },

      stopTimer: () => {
        const { activeTimer } = get();
        if (activeTimer) {
          set({
            activeTimer: { ...activeTimer, isRunning: false },
            isStopModalOpen: true,
          });
        }
      },

      confirmStopTimer: async (description: string) => {
        const { activeTimer } = get();
        if (!activeTimer) return;

        const res = await apiCall<{ timeEntry?: unknown }>('/timers/stop', {
          method: 'POST',
          body: JSON.stringify({ description, date: localTodayYmd() }),
        });
        if (res.error) {
          throw new Error(res.error);
        }
        set({
          activeTimer: null,
          isStopModalOpen: false,
          lastLoggedAt: Date.now(),
        });
      },

      discardTimer: async () => {
        await apiCall('/timers/discard', { method: 'POST' });
        set({ activeTimer: null, isStopModalOpen: false });
      },

      resetTimer: () => {
        set({ activeTimer: null, isStopModalOpen: false });
      },

      tick: () => {
        const { activeTimer } = get();
        if (activeTimer && activeTimer.isRunning) {
          set({
            activeTimer: {
              ...activeTimer,
              elapsedSeconds: activeTimer.elapsedSeconds + 1,
            },
          });
        }
      },

      updateWorkDescription: (text: string) => {
        const { activeTimer } = get();
        if (activeTimer) {
          set({ activeTimer: { ...activeTimer, workCompleted: text } });
        }
      },

      setStopModalOpen: (open: boolean) => {
        set({ isStopModalOpen: open });
      },
    }),
    {
      name: 'luvio-track-running-timer-v2',
      partialize: (state) => ({
        activeTimer: state.activeTimer,
      }),
    }
  )
);
