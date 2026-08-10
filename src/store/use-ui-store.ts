import { create } from 'zustand';
import { startOfWeek, addWeeks, subWeeks, format } from 'date-fns';
import { TimeEntry } from '../types';

export type TimesheetViewMode = 'week' | 'day' | 'calendar';

interface UIState {
  activeWeekMonday: string; // YYYY-MM-DD
  timesheetViewMode: TimesheetViewMode;
  sidebarCollapsed: boolean;
  isEntryDrawerOpen: boolean;
  editingEntry: TimeEntry | null;
  selectedDateForEntry: string | null;

  setTimesheetViewMode: (mode: TimesheetViewMode) => void;
  toggleSidebar: () => void;
  nextWeek: () => void;
  previousWeek: () => void;
  jumpToToday: () => void;
  setActiveWeekMonday: (dateStr: string) => void;
  openEntryDrawer: (entry?: TimeEntry, dateStr?: string) => void;
  closeEntryDrawer: () => void;
}

const getInitialMonday = () => {
  const monday = startOfWeek(new Date(), { weekStartsOn: 1 });
  return format(monday, 'yyyy-MM-dd');
};

export const useUIStore = create<UIState>((set) => ({
  activeWeekMonday: getInitialMonday(),
  timesheetViewMode: 'week',
  sidebarCollapsed: false,
  isEntryDrawerOpen: false,
  editingEntry: null,
  selectedDateForEntry: null,

  setTimesheetViewMode: (mode: TimesheetViewMode) => set({ timesheetViewMode: mode }),

  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  nextWeek: () =>
    set((state) => {
      const current = new Date(state.activeWeekMonday);
      const next = addWeeks(current, 1);
      return { activeWeekMonday: format(next, 'yyyy-MM-dd') };
    }),

  previousWeek: () =>
    set((state) => {
      const current = new Date(state.activeWeekMonday);
      const prev = subWeeks(current, 1);
      return { activeWeekMonday: format(prev, 'yyyy-MM-dd') };
    }),

  jumpToToday: () => {
    const todayMonday = startOfWeek(new Date(), { weekStartsOn: 1 });
    set({ activeWeekMonday: format(todayMonday, 'yyyy-MM-dd') });
  },

  setActiveWeekMonday: (dateStr: string) => set({ activeWeekMonday: dateStr }),

  openEntryDrawer: (entry?: TimeEntry, dateStr?: string) =>
    set({
      isEntryDrawerOpen: true,
      editingEntry: entry || null,
      selectedDateForEntry: dateStr || null
    }),

  closeEntryDrawer: () =>
    set({
      isEntryDrawerOpen: false,
      editingEntry: null,
      selectedDateForEntry: null
    })
}));
