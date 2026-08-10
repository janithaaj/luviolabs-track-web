'use client';

import React from 'react';
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
  LogOut
} from 'lucide-react';
import { useAuthStore } from '../../store/use-auth-store';
import { useTimerStore } from '../../store/use-timer-store';
import { projectService } from '../../services/project-service';
import { useRouter } from 'next/navigation';
import { LuvioLogoBadge } from './LuvioLogo';

export const AdminSidebar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, logout } = useAuthStore();
  const { startTimer } = useTimerStore();

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  const handleStartDefaultTimer = async () => {
    try {
      const projects = await projectService.getProjects();
      const project = projects.find((p) => p.status === 'ACTIVE') || projects[0];
      if (!project) {
        alert('No projects available. Create a project first.');
        return;
      }
      const taskId = project.taskIds?.[0] || 'task-4';
      await startTimer(project.id, taskId, {
        projectName: project.name,
        projectCode: project.code,
      });
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Could not start timer');
    }
  };

  const navSections = [
    {
      title: 'Track',
      items: [
        { name: 'Timesheet', href: '/work/timesheets', icon: Clock },
        { name: 'Timer', href: '/work/timesheets?open=timer', icon: Play },
        { name: 'Expenses', href: '/finance/expenses', icon: Receipt }
      ]
    },
    {
      title: 'Organize',
      items: [
        { name: 'Team', href: '/people/team', icon: Users },
        { name: 'Clients', href: '/work/clients', icon: Users2 },
        { name: 'Projects', href: '/work/projects', icon: Briefcase },
        { name: 'Tasks', href: '/work/tasks', icon: ListTodo }
      ]
    },
    {
      title: 'Bill',
      items: [
        { name: 'Invoices', href: '/finance/invoices', icon: FileText },
        { name: 'Estimates', href: '/finance/estimates', icon: FileSpreadsheet }
      ]
    },
    {
      title: 'Review',
      items: [
        { name: 'Approvals', href: '/work/approvals', icon: CheckSquare },
        { name: 'Reports', href: '/analytics/reports', icon: BarChart3 }
      ]
    }
  ];

  const isActive = (href: string) => {
    const pathOnly = href.split('?')[0];
    // Timer deep-link should not stay highlighted; Timesheet owns the route
    if (href.includes('open=timer')) return false;
    return pathname === href || (pathOnly !== '/' && pathname.startsWith(pathOnly));
  };

  return (
    <aside className="flex h-screen w-[220px] shrink-0 flex-col border-r border-[#EBE4FF] bg-[#F8F5FF] select-none">
      <div className="flex flex-1 flex-col overflow-y-auto px-3 pt-4 pb-2">
        {/* Logo */}
        <Link href="/work/timesheets" className="mb-4 flex items-center gap-2 px-1">
          <LuvioLogoBadge size={28} />
          <span className="font-title text-[17px] font-bold tracking-tight text-[#0C2A43] lowercase">
            luvio
          </span>
        </Link>

        {/* Timer controls */}
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
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Navigation */}
        <nav className="space-y-4">
          {navSections.map((section) => (
            <div key={section.title}>
              <div className="mb-1 px-2.5 text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">
                {section.title}
              </div>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`relative flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors ${
                        active
                          ? 'bg-[#F5F0FF] font-semibold text-[#9333EA]'
                          : 'text-[#1E293B] hover:bg-[#F5F0FF]'
                      }`}
                    >
                      {active && (
                        <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r bg-[#9333EA]" />
                      )}
                      <Icon className={`h-4 w-4 ${active ? 'text-[#9333EA]' : 'text-[#475569]'}`} />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Footer */}
      <div className="border-t border-[#EBE4FF] px-3 py-3 space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <Link
            href="/system/settings"
            className="flex items-center gap-2 text-[13px] font-medium text-[#1E293B] hover:text-[#0C2A43]"
          >
            <Plug className="h-3.5 w-3.5 text-[#475569]" />
            Integrations
          </Link>
          <Link
            href="/system/settings"
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
      </div>
    </aside>
  );
};
