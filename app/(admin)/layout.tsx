'use client';

import React, { useEffect, useState } from 'react';
import { Menu } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { AdminSidebar } from '../../src/components/common/AdminSidebar';
import { HarvestAIButton } from '../../src/components/common/HarvestAIButton';
import { TimerWidget } from '../../src/components/common/TimerWidget';
import { AuthGuard } from '../../src/components/common/AuthGuard';
import { LuvioLogoBadge } from '../../src/components/common/LuvioLogo';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = navOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [navOpen]);

  return (
    <AuthGuard allowedRoles={['ADMIN']}>
      <div className="flex h-dvh overflow-hidden bg-white text-[#0C2A43]">
        <AdminSidebar mobileOpen={navOpen} onClose={() => setNavOpen(false)} />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center gap-2 border-b border-[#E2E8F0] bg-[#F8F5FF] px-3 py-2 lg:hidden">
            <button
              type="button"
              onClick={() => setNavOpen(true)}
              className="rounded-md border border-[#E2E8F0] bg-white p-2 text-[#0C2A43]"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <LuvioLogoBadge size={24} />
            <span className="min-w-0 truncate font-title text-[14px] font-bold text-[#0C2A43]">
              luvio <span className="brand-gradient-text">harvest</span>
            </span>
          </header>
          <div className="overflow-x-auto border-b border-[#E2E8F0] bg-white px-6 py-2 empty:hidden sm:px-8">
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
