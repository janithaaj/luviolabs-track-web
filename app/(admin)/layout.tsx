'use client';

import React from 'react';
import { AdminSidebar } from '../../src/components/common/AdminSidebar';
import { HarvestAIButton } from '../../src/components/common/HarvestAIButton';
import { TimerWidget } from '../../src/components/common/TimerWidget';
import { AuthGuard } from '../../src/components/common/AuthGuard';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={['ADMIN']}>
      <div className="flex h-screen overflow-hidden bg-white text-[#0C2A43]">
        <AdminSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="border-b border-[#E2E8F0] bg-white px-6 py-2 empty:hidden">
            <TimerWidget />
          </div>
          <main className="relative flex-1 overflow-y-auto bg-white">
            <div className="harvest-page px-6 py-6 sm:px-8">{children}</div>
          </main>
        </div>
        <HarvestAIButton />
      </div>
    </AuthGuard>
  );
}
