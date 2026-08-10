'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Search, ChevronRight, Pencil, Trash2 } from 'lucide-react';
import { projectService } from '../../../../src/services/project-service';
import { Project } from '../../../../src/types';
import { Button } from '../../../../src/components/ui/button';
import { Badge } from '../../../../src/components/ui/badge';
import { Input } from '../../../../src/components/ui/input';
import { Progress } from '../../../../src/components/ui/progress';
import { GettingStartedPayrollBar } from '../../../../src/components/common/GettingStartedPayrollBar';
import { useAuthStore } from '../../../../src/store/use-auth-store';

export default function AdminProjectsPage() {
  const router = useRouter();
  const { currentUser } = useAuthStore();
  const isAdmin = currentUser?.role === 'ADMIN';
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = () => projectService.getProjects().then(setProjects);

  useEffect(() => {
    load();
  }, []);

  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      p.clientName.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (p: Project) => {
    if (!isAdmin) return;
    const ok = window.confirm(
      `Delete project “${p.name}”? This cannot be undone. Employees will no longer see it on timesheets.`
    );
    if (!ok) return;
    setDeletingId(p.id);
    setMessage('');
    try {
      await projectService.deleteProject(p.id);
      setProjects((prev) => prev.filter((x) => x.id !== p.id));
      setMessage(`Deleted “${p.name}”.`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Failed to delete project');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-[28px] font-bold tracking-tight text-[#0C2A43]">Projects</h1>
        {isAdmin ? (
          <Link href="/work/projects/new">
            <Button variant="primary" leftIcon={<Plus className="h-3.5 w-3.5" />}>
              New Project
            </Button>
          </Link>
        ) : null}
      </div>

      <GettingStartedPayrollBar />

      {message ? (
        <div className="rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 text-[13px] text-[#1E293B]">
          {message}
        </div>
      ) : null}

      <div className="w-full sm:w-72">
        <Input
          placeholder="Filter by project name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search className="h-4 w-4" />}
        />
      </div>

      <div className="space-y-3">
        {filteredProjects.map((p) => {
          const isFixedFee = p.type === 'FIXED_FEE';
          const budgetHours =
            p.budget?.totalHours != null && p.budget.totalHours > 0
              ? p.budget.totalHours
              : null;
          const usedHours = Math.max(0, Number(p.usedHours) || 0);
          const usedPercent =
            budgetHours != null
              ? Math.round((usedHours / budgetHours) * 100)
              : null;
          const barPercent =
            usedPercent != null ? Math.min(100, Math.max(0, usedPercent)) : 0;
          const feeLabel =
            isFixedFee && p.budget.totalAmount != null
              ? `${p.currency} ${p.budget.totalAmount.toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })}`
              : null;

          return (
            <div
              key={p.id}
              className="harvest-card flex flex-col gap-3 p-4 transition-colors hover:border-[#9333EA]/40 sm:flex-row sm:items-center sm:justify-between"
            >
              <Link href={`/work/projects/${p.id}`} className="min-w-0 flex-1">
                <div className="text-[12px] font-semibold text-[#9333EA]">{p.clientName}</div>
                <div className="mt-0.5 flex flex-wrap items-center gap-2">
                  <h3 className="text-[16px] font-bold text-[#0C2A43]">{p.name}</h3>
                  <Badge variant="draft">{p.code}</Badge>
                  <Badge variant={p.type === 'NON_BILLABLE' ? 'nonbillable' : 'billable'}>
                    {p.type.replaceAll('_', ' ')}
                  </Badge>
                  {feeLabel ? <Badge variant="active">{feeLabel}</Badge> : null}
                  {p.status !== 'ACTIVE' ? <Badge variant="draft">{p.status}</Badge> : null}
                </div>
              </Link>

              <div className="flex items-center gap-3 sm:min-w-[280px]">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex justify-between text-[11px] text-[#475569]">
                    <span>
                      {budgetHours != null
                        ? `${usedHours}h / ${budgetHours}h`
                        : feeLabel
                          ? `${usedHours}h logged · ${feeLabel}`
                          : `${usedHours}h logged`}
                    </span>
                    <span>
                      {usedPercent != null
                        ? `${usedPercent}%`
                        : usedHours > 0
                          ? 'no hours budget'
                          : '—'}
                    </span>
                  </div>
                  <Progress value={barPercent} max={100} />
                </div>

                {isAdmin ? (
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      title="Edit project"
                      onClick={() => router.push(`/work/projects/${p.id}?edit=1`)}
                      className="rounded-md border border-[#E2E8F0] bg-white p-2 text-[#1E293B] hover:bg-[#F8FAFC] cursor-pointer"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      title="Delete project"
                      disabled={deletingId === p.id}
                      onClick={() => handleDelete(p)}
                      className="rounded-md border border-red-200 bg-white p-2 text-red-600 hover:bg-red-50 cursor-pointer disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    <Link
                      href={`/work/projects/${p.id}`}
                      className="rounded-md p-2 text-[#64748B] hover:text-[#0C2A43]"
                      aria-label="Open project"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                ) : (
                  <Link href={`/work/projects/${p.id}`} className="shrink-0 text-[#64748B]">
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                )}
              </div>
            </div>
          );
        })}

        {filteredProjects.length === 0 && (
          <div className="harvest-empty px-6 py-16 text-center text-[13px] text-[#475569]">
            No projects yet.{' '}
            {isAdmin ? (
              <Link
                href="/work/projects/new"
                className="font-semibold text-[#9333EA] hover:underline"
              >
                Create your first project →
              </Link>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
