import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, CreateEmployeeInput } from '../types';
import { authService } from '../services/auth-service';
import { apiStorage } from '../services/api-client';

interface AuthState {
  currentUser: User | null;
  isAuthenticated: boolean;
  accessToken: string | null;
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
      accessToken: null,
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
          accessToken: result.token
        });
        return { success: true };
      },

      logout: () => {
        authService.logout();
        apiStorage.setToken(null);
        set({
          currentUser: null,
          isAuthenticated: false,
          accessToken: null
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
        }
      }
    }),
    {
      name: 'luvio-track-auth-v3',
      partialize: (state) => ({
        currentUser: state.currentUser,
        isAuthenticated: state.isAuthenticated,
        accessToken: state.accessToken
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
        if (state?.accessToken) {
          apiStorage.setToken(state.accessToken);
        }
      }
    }
  )
);
