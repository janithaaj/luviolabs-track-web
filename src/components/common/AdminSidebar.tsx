'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Clock,
  Receipt,
  Users,
  Users2,
  Briefcase,
  ListTodo,
  FileText,
  FileSpreadsheet,
  CheckSquare,
  BarChart3,
  Settings,
  Plug,
  RotateCcw,
  MoreHorizontal,
  Bell,
  History,
  Play,
  LogOut,
  PanelLeftClose,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '../../store/use-auth-store';
import { useTimerStore } from '../../store/use-timer-store';
import { useRouter } from 'next/navigation';
import { LuvioLogoBadge } from './LuvioLogo';

const COLLAPSE_KEY = 'luvio_sidebar_collapsed';

interface AdminSidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ mobileOpen = false, onClose }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, logout } = useAuthStore();
  const { activeTimer } = useTimerStore();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(COLLAPSE_KEY) === '1');
    } catch {
      /* ignore */
    }
  }, []);

  const setCollapsedPersist = (next: boolean) => {
    setCollapsed(next);
    try {
      window.localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0');
    } catch {
      /* ignore */
    }
  };

  /** Mobile drawer is always expanded; compact icons-only is desktop. */
  const compact = collapsed && !mobileOpen;

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  const handleStartDefaultTimer = async () => {
    if (activeTimer) {
      router.push('/work/timesheets');
      window.setTimeout(() => {
        document.getElementById('luvio-active-timer')?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }, 100);
      return;
    }
    router.push('/work/timesheets?open=timer');
  };

  const navSections = [
    {
      title: 'Track',
      items: [
        { name: 'Timesheet', href: '/work/timesheets', icon: Clock },
        { name: 'Timer', href: '/work/timesheets?open=timer', icon: Play },
        { name: 'Expenses', href: '/finance/expenses', icon: Receipt },
      ],
    },
    {
      title: 'Organize',
      items: [
        { name: 'Team', href: '/people/team', icon: Users },
        { name: 'Clients', href: '/work/clients', icon: Users2 },
        { name: 'Projects', href: '/work/projects', icon: Briefcase },
        { name: 'Tasks', href: '/work/tasks', icon: ListTodo },
      ],
    },
    {
      title: 'Bill',
      items: [
        { name: 'Invoices', href: '/finance/invoices', icon: FileText },
        { name: 'Estimates', href: '/finance/estimates', icon: FileSpreadsheet },
      ],
    },
    {
      title: 'Review',
      items: [
        { name: 'Approvals', href: '/work/approvals', icon: CheckSquare },
        { name: 'Reports', href: '/analytics/reports', icon: BarChart3 },
      ],
    },
  ];

  const isActive = (href: string) => {
    const pathOnly = href.split('?')[0];
    if (href.includes('open=timer')) return false;
    return pathname === href || (pathOnly !== '/' && pathname.startsWith(pathOnly));
  };

  return (
    <>
      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          aria-label="Close menu"
          onClick={onClose}
        />
      ) : null}
      <aside
        className={`relative flex h-dvh shrink-0 flex-col border-r border-[#EBE4FF] bg-[#F8F5FF] select-none transition-[width] duration-200 max-lg:fixed max-lg:inset-y-0 max-lg:left-0 max-lg:z-50 max-lg:shadow-xl max-lg:transition-transform ${
          compact ? 'w-16' : 'w-[min(220px,86vw)]'
        } ${mobileOpen ? 'max-lg:translate-x-0' : 'max-lg:-translate-x-full'} lg:relative lg:translate-x-0`}
      >
        <button
          type="button"
          onClick={() => setCollapsedPersist(!collapsed)}
          className="absolute top-20 -right-3 z-20 hidden h-6 w-6 items-center justify-center rounded-full border border-[#EBE4FF] bg-white text-[#475569] shadow-sm hover:text-[#0C2A43] cursor-pointer lg:flex"
          title={compact ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={compact ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-pressed={compact}
        >
          {compact ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>

        <div className={`flex flex-1 flex-col overflow-y-auto overflow-x-hidden pt-4 pb-2 ${compact ? 'px-1.5' : 'px-3'}`}>
          <div className={`mb-3 flex items-center ${compact ? 'justify-center' : 'justify-between gap-1 px-1'}`}>
            <Link href="/work/timesheets" className="flex min-w-0 items-center gap-2" onClick={onClose}>
              <LuvioLogoBadge size={28} />
              {!compact ? (
                <span className="font-title text-[17px] font-bold tracking-tight text-[#0C2A43] lowercase">
                  luvio <span className="brand-gradient-text">harvest</span>
                </span>
              ) : null}
            </Link>
            {!compact ? (
              <button
                type="button"
                onClick={() => setCollapsedPersist(true)}
                className="hidden rounded-md p-1.5 text-[#475569] hover:bg-white hover:text-[#0C2A43] cursor-pointer lg:inline-flex"
                title="Collapse sidebar"
                aria-label="Collapse sidebar"
              >
                <PanelLeftClose className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          {compact ? (
            <div className="mb-4 flex flex-col items-center gap-1">
              <button
                type="button"
                onClick={handleStartDefaultTimer}
                className="flex h-9 w-9 items-center justify-center rounded-md brand-gradient text-white hover:opacity-95 cursor-pointer"
                title="Start timer"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
              </button>
              <Link
                href="/work/timesheets"
                className="flex h-9 w-9 items-center justify-center rounded-md border border-[#E2E8F0] bg-white text-[#475569] hover:text-[#0C2A43]"
                title="Timesheet"
                onClick={onClose}
              >
                <History className="h-3.5 w-3.5" />
              </Link>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="flex h-9 w-9 items-center justify-center rounded-md border border-[#E2E8F0] bg-white text-[#475569] hover:text-[#0C2A43] cursor-pointer"
                title="Refresh"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="mb-5 flex items-center gap-1">
              <button
                type="button"
                onClick={handleStartDefaultTimer}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-md brand-gradient px-3 py-2 text-[13px] font-bold text-white hover:opacity-95 transition-opacity cursor-pointer"
                title="Start timer on default project"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                Timer
              </button>
              <Link
                href="/work/timesheets"
                className="rounded-md border border-[#E2E8F0] bg-white p-2 text-[#475569] hover:text-[#0C2A43]"
                aria-label="Timesheet history"
                title="Open timesheet"
                onClick={onClose}
              >
                <History className="h-3.5 w-3.5" />
              </Link>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="rounded-md border border-[#E2E8F0] bg-white p-2 text-[#475569] hover:text-[#0C2A43] cursor-pointer"
                aria-label="Refresh"
                title="Refresh"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
              <Link
                href="/system/settings"
                className="rounded-md border border-[#E2E8F0] bg-white p-2 text-[#475569] hover:text-[#0C2A43]"
                aria-label="More"
                title="Settings"
                onClick={onClose}
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}

          <nav className="space-y-3">
            {navSections.map((section) => (
              <div key={section.title}>
                {!compact ? (
                  <div className="mb-1 px-2.5 text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">
                    {section.title}
                  </div>
                ) : (
                  <div className="mx-auto mb-1 h-px w-6 bg-[#EBE4FF]" />
                )}
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onClose}
                        title={item.name}
                        className={`relative flex items-center rounded-md text-[13px] font-medium transition-colors ${
                          compact ? 'justify-center px-0 py-2' : 'gap-2.5 px-2.5 py-1.5'
                        } ${
                          active
                            ? 'bg-[#F5F0FF] font-semibold text-[#9333EA]'
                            : 'text-[#1E293B] hover:bg-[#F5F0FF]'
                        }`}
                      >
                        {active && !compact ? (
                          <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r bg-[#9333EA]" />
                        ) : null}
                        <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-[#9333EA]' : 'text-[#475569]'}`} />
                        {!compact ? item.name : null}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        <div className={`border-t border-[#EBE4FF] py-3 space-y-2.5 ${compact ? 'px-1.5' : 'px-3'}`}>
          {compact ? (
            <div className="flex flex-col items-center gap-1">
              <Link
                href="/system/settings"
                onClick={onClose}
                title="Settings"
                className="flex h-9 w-9 items-center justify-center rounded-md text-[#475569] hover:bg-white hover:text-[#0C2A43]"
              >
                <Settings className="h-4 w-4" />
              </Link>
              <Link
                href="/work/approvals"
                title="Approvals"
                className="flex h-9 w-9 items-center justify-center rounded-md text-[#475569] hover:bg-white hover:text-[#0C2A43]"
                onClick={onClose}
              >
                <Bell className="h-4 w-4" />
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                title="Log out"
                className="flex h-9 w-9 items-center justify-center rounded-md text-[#475569] hover:bg-white hover:text-[#0C2A43] cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
              </button>
              <img
                src={
                  currentUser?.avatar ||
                  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
                }
                alt={currentUser?.name || 'Admin'}
                title={currentUser?.name || 'Admin'}
                className="mt-1 h-7 w-7 rounded-full object-cover"
              />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between px-1">
                <Link
                  href="/system/settings"
                  onClick={onClose}
                  className="flex items-center gap-2 text-[13px] font-medium text-[#1E293B] hover:text-[#0C2A43]"
                >
                  <Plug className="h-3.5 w-3.5 text-[#475569]" />
                  Integrations
                </Link>
                <Link
                  href="/system/settings"
                  onClick={onClose}
                  className="flex items-center gap-2 text-[13px] font-medium text-[#1E293B] hover:text-[#0C2A43]"
                >
                  <Settings className="h-3.5 w-3.5 text-[#475569]" />
                  Settings
                </Link>
              </div>

              <button
                type="button"
                onClick={() => alert('Contact sales to upgrade your Luvio workspace.')}
                className="w-full rounded-md brand-gradient py-2 text-[13px] font-bold text-white hover:opacity-95 transition-opacity cursor-pointer"
              >
                Upgrade
              </button>

              <div className="flex items-center justify-between border-t border-[#EBE4FF] pt-2.5">
                <div className="flex min-w-0 items-center gap-2">
                  <img
                    src={
                      currentUser?.avatar ||
                      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
                    }
                    alt={currentUser?.name || 'Admin'}
                    className="h-7 w-7 rounded-full object-cover"
                  />
                  <div className="min-w-0">
                    <div className="truncate text-[12px] font-bold text-[#0C2A43]">
                      {currentUser?.name || 'Admin'}
                    </div>
                    <div className="text-[11px] text-[#475569]">Admin · Luvio</div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Link
                    href="/work/approvals"
                    className="text-[#475569] hover:text-[#0C2A43] p-1"
                    aria-label="Notifications"
                    title="Approvals"
                    onClick={onClose}
                  >
                    <Bell className="h-4 w-4" />
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="text-[#475569] hover:text-[#0C2A43] cursor-pointer p-1"
                    aria-label="Log out"
                    title="Log out"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </aside>
    </>
  );
};
