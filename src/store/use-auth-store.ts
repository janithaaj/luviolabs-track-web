import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, CreateEmployeeInput } from '../types';
import { authService } from '../services/auth-service';
import { apiStorage, setUnauthorizedHandler } from '../services/api-client';

interface AuthState {
  currentUser: User | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  setHydrated: (v: boolean) => void;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  createEmployee: (
    input: CreateEmployeeInput
  ) => Promise<{ success: boolean; error?: string; user?: User }>;
  refreshCurrentUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      isAuthenticated: false,
      isHydrated: false,

      setHydrated: (v) => set({ isHydrated: v }),

      login: async (email, password) => {
        const result = await authService.login(email, password);
        if (!result.success) {
          return { success: false, error: result.error };
        }
        apiStorage.setToken(result.token);
        set({
          currentUser: result.user,
          isAuthenticated: true,
        });
        return { success: true };
      },

      logout: () => {
        authService.logout();
        apiStorage.setToken(null);
        set({
          currentUser: null,
          isAuthenticated: false,
        });
      },

      createEmployee: async (input) => {
        const admin = get().currentUser;
        if (!admin || admin.role !== 'ADMIN') {
          return { success: false, error: 'Only admins can create employees.' };
        }
        const result = await authService.createEmployee(input, admin.id);
        if (!result.success) {
          return { success: false, error: result.error };
        }
        return { success: true, user: result.user };
      },

      refreshCurrentUser: async () => {
        const user = get().currentUser;
        if (!user) return;
        const fresh = await authService.me();
        if (fresh) {
          set({ currentUser: fresh });
        } else {
          // Token invalid / user inactive
          get().logout();
        }
      },
    }),
    {
      name: 'luvio-track-auth-v4',
      // Do not persist access tokens — keep only non-secret session hints.
      partialize: (state) => ({
        currentUser: state.currentUser
          ? {
              ...state.currentUser,
              // Avoid keeping pay rates in long-lived localStorage
              monthlySalary: undefined,
              costRate: undefined,
              billableRate: undefined,
            }
          : null,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
        const token = apiStorage.getToken();
        if (!token) {
          // Session ended (tab closed) — clear persisted auth hints
          state?.logout();
        }
      },
    }
  )
);

// When any API call returns 401, clear zustand auth (api-client also redirects).
if (typeof window !== 'undefined') {
  setUnauthorizedHandler(() => {
    useAuthStore.getState().logout();
  });
}
