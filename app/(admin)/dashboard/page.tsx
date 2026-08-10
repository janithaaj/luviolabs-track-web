'use client';

import React from 'react';
import Link from 'next/link';
import { Plus, Clock, Users, Briefcase, FileText, CheckSquare, ArrowRight } from 'lucide-react';
import { Button } from '../../../src/components/ui/button';
import { GettingStartedPayrollBar } from '../../../src/components/common/GettingStartedPayrollBar';
import { useAuthStore } from '../../../src/store/use-auth-store';

const links = [
  { href: '/work/timesheets', label: 'Timesheet', icon: Clock, desc: 'Track time this week' },
  { href: '/people/team', label: 'Team', icon: Users, desc: 'People & capacity' },
  { href: '/work/projects', label: 'Projects', icon: Briefcase, desc: 'Active client work' },
  { href: '/finance/invoices', label: 'Invoices', icon: FileText, desc: 'Billing overview' },
  { href: '/work/approvals', label: 'Approvals', icon: CheckSquare, desc: 'Review submissions' }
];

export default function AdminDashboardPage() {
  const { currentUser } = useAuthStore();
  const firstName = currentUser?.name?.split(' ')[0] || 'Admin';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight text-[#0C2A43]">
            Good morning, {firstName}
          </h1>
          <p className="mt-1 text-[13px] text-[#475569]">
            Admin workspace. Create employees on Team, projects under Projects, then employees track
            time only on assigned work.
          </p>
        </div>
        <Link href="/work/projects/new">
          <Button variant="primary" leftIcon={<Plus className="h-3.5 w-3.5" />}>
            New project
          </Button>
        </Link>
      </div>

      <GettingStartedPayrollBar variant="expanded" />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {links.map(({ href, label, icon: Icon, desc }) => (
          <Link
            key={href}
            href={href}
            className="harvest-card group flex items-start gap-3 p-4 transition-colors hover:border-[#9333EA]/40"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F5F0FF] text-[#9333EA]">
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[14px] font-bold text-[#0C2A43]">{label}</span>
                <ArrowRight className="h-4 w-4 text-[#64748B] transition-transform group-hover:translate-x-0.5 group-hover:text-[#9333EA]" />
              </div>
              <p className="mt-0.5 text-[12px] text-[#475569]">{desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
