'use client';

import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface GettingStartedPayrollBarProps {
  variant?: 'compact' | 'expanded';
}

export const GettingStartedPayrollBar: React.FC<GettingStartedPayrollBarProps> = ({
  variant = 'compact'
}) => {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  if (variant === 'expanded') {
    return (
      <div className="harvest-card overflow-hidden">
        <div className="border-b border-[#E2E8F0] px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold tracking-wider text-[#9333EA] uppercase">
                Getting Started - Payroll
              </p>
              <h3 className="mt-1 text-[18px] font-bold text-[#0C2A43]">
                Get your team&apos;s hours ready for payroll.
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="text-[12px] font-semibold text-[#475569] hover:text-[#0C2A43] cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#E2E8F0]">
          <Link href="/people/team" className="flex items-center gap-3 px-5 py-4 hover:bg-[#F8FAFC]">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#3B82F6] text-white text-xs font-bold">
              ✓
            </div>
            <span className="text-[13px] font-semibold text-[#0C2A43]">Invite your team</span>
          </Link>
          <Link href="/work/projects/new" className="flex items-center gap-3 px-5 py-4 hover:bg-[#F8FAFC]">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#9333EA] text-white text-xs font-bold">
              2
            </div>
            <div>
              <span className="block text-[13px] font-semibold text-[#0C2A43]">Set up a project</span>
              <span className="text-[13px] font-semibold text-[#9333EA]">New project →</span>
            </div>
          </Link>
          <Link href="/work/approvals" className="flex items-center gap-3 px-5 py-4 hover:bg-[#F8FAFC]">
            <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#E2E8F0] text-[12px] font-bold text-[#475569]">
              3
            </div>
            <span className="text-[13px] font-semibold text-[#475569]">Approve a timesheet</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="harvest-card flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative flex h-8 w-8 shrink-0 items-center justify-center">
          <svg viewBox="0 0 32 32" className="absolute inset-0 h-8 w-8 -rotate-90">
            <circle cx="16" cy="16" r="13" fill="none" stroke="#EBE4FF" strokeWidth="3" />
            <circle
              cx="16"
              cy="16"
              r="13"
              fill="none"
              stroke="#9333EA"
              strokeWidth="3"
              strokeDasharray={`${(1 / 3) * 81.7} 81.7`}
              strokeLinecap="round"
            />
          </svg>
        </div>
        <div className="min-w-0 text-[13px]">
          <span className="font-bold tracking-wider text-[#9333EA] uppercase text-[11px]">
            Getting Started · Payroll
          </span>
          <span className="mx-2 text-[#c4bfb9]">·</span>
          <span className="text-[#1E293B]">
            Now: <strong className="font-bold text-[#0C2A43]">Set up a project</strong>
          </span>
        </div>
      </div>
      <Link
        href="/work/projects/new"
        className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-[#9333EA] px-3 py-1.5 text-[13px] font-bold text-white hover:bg-[#7e22ce] transition-colors"
      >
        New project
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
};
