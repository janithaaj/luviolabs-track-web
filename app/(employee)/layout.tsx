'use client';

import React from 'react';
import { EmployeeNav } from '../../src/components/common/EmployeeNav';
import { AuthGuard } from '../../src/components/common/AuthGuard';
import { TimerWidget } from '../../src/components/common/TimerWidget';
import { useAuthStore } from '../../src/store/use-auth-store';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { LuvioLogoBadge } from '../../src/components/common/LuvioLogo';

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const { currentUser, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  return (
    <AuthGuard allowedRoles={['EMPLOYEE']}>
      <div className="flex min-h-screen flex-col bg-white text-[#0C2A43]">
        <div className="border-b border-[#E2E8F0] bg-[#F8F5FF]">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-8">
            <div className="flex items-center gap-2">
              <LuvioLogoBadge size={28} />
              <span className="font-title text-[15px] font-bold text-[#0C2A43]">
                luvio <span className="brand-gradient-text">harvest</span>
              </span>
              <span className="ml-2 rounded border border-[#E2E8F0] bg-white px-1.5 py-0.5 text-[10px] font-semibold uppercase text-[#475569]">
                Employee
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden text-[13px] text-[#475569] sm:inline">
                {currentUser?.name}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 rounded-md border border-[#E2E8F0] bg-white px-2.5 py-1.5 text-[12px] font-semibold text-[#1E293B] hover:bg-[#F8FAFC] cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
                Log out
              </button>
            </div>
          </div>
          <EmployeeNav />
        </div>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-8">
          <div className="mb-4 empty:hidden">
            <TimerWidget />
          </div>
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
