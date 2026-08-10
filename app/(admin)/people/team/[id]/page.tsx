'use client';

import React, { useState, useEffect, use } from 'react';
import { teamService } from '../../../../../src/services/team-service';
import { projectService } from '../../../../../src/services/project-service';
import { timesheetService } from '../../../../../src/services/timesheet-service';
import { User, Project, WeeklySubmission, UserStatus } from '../../../../../src/types';
import { Card } from '../../../../../src/components/ui/card';
import { Badge } from '../../../../../src/components/ui/badge';
import { Button } from '../../../../../src/components/ui/button';
import { Input } from '../../../../../src/components/ui/input';
import {
  formatCurrency,
  formatWeekRangeString,
  costRateFromMonthlySalary,
  monthlyHoursFromWeeklyCapacity,
} from '../../../../../src/lib/utils';
import { parseISO } from 'date-fns';
import { ArrowLeft, History, Save, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../../../src/store/use-auth-store';
import { Select } from '../../../../../src/components/ui/select';
import { DEPARTMENTS } from '../../../../../src/lib/constants';

/** Plain numeric string for <input type="number"> (commas make the field appear empty). */
function toNumberInputValue(n: number | undefined | null): string {
  if (n === undefined || n === null || Number.isNaN(Number(n))) return '';
  return String(n);
}

function applyPayFields(
  u: User,
  setters: {
    setMonthlySalary: (v: string) => void;
    setCostRate: (v: string) => void;
    setBillableRate: (v: string) => void;
    setCapacityHours: (v: string) => void;
    setCostManual: (v: boolean) => void;
  }
) {
  setters.setMonthlySalary(toNumberInputValue(u.monthlySalary ?? 0));
  setters.setCostRate(toNumberInputValue(u.costRate ?? 0));
  setters.setBillableRate(toNumberInputValue(u.billableRate ?? 0));
  setters.setCapacityHours(toNumberInputValue(u.capacityHours ?? 40));
  setters.setCostManual(false);
}

export default function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const userId = resolvedParams.id;
  const router = useRouter();
  const { currentUser, isHydrated } = useAuthStore();
  const isAdmin = currentUser?.role === 'ADMIN';

  const [user, setUser] = useState<User | null>(null);
  const [loadError, setLoadError] = useState('');
  const [assignedProjects, setAssignedProjects] = useState<Project[]>([]);
  const [submission, setSubmission] = useState<WeeklySubmission | null>(null);
  const [profileName, setProfileName] = useState('');
  const [profileDepartment, setProfileDepartment] = useState('');
  const [profileStatus, setProfileStatus] = useState<UserStatus>('ACTIVE');
  const [monthlySalary, setMonthlySalary] = useState('');
  const [costRate, setCostRate] = useState('');
  const [billableRate, setBillableRate] = useState('');
  const [capacityHours, setCapacityHours] = useState('');
  const [costManual, setCostManual] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoadError('');
      try {
        const u = await teamService.getUserById(userId);
        if (cancelled) return;
        if (!u) {
          setUser(null);
          setLoadError('Could not load this team member.');
          return;
        }
        setUser(u);
        setProfileName(u.name);
        setProfileDepartment(u.department || DEPARTMENTS[0] || 'Engineering');
        setProfileStatus((u.status as UserStatus) || 'ACTIVE');
        applyPayFields(u, {
          setMonthlySalary,
          setCostRate,
          setBillableRate,
          setCapacityHours,
          setCostManual,
        });
        const [projects, sub] = await Promise.all([
          projectService.getProjectsForUser(u.id),
          timesheetService.getWeeklySubmission(u.id, new Date().toISOString().slice(0, 10)),
        ]);
        if (cancelled) return;
        setAssignedProjects(projects);
        setSubmission(sub);
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : 'Failed to load team member');
        }
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const weeklyCap = parseFloat(String(capacityHours).replace(/,/g, '')) || 40;
  const salaryNum = parseFloat(String(monthlySalary).replace(/,/g, '')) || 0;
  const derivedCost = costRateFromMonthlySalary(salaryNum, weeklyCap);
  const effectiveCost = costManual
    ? parseFloat(String(costRate).replace(/,/g, '')) || 0
    : derivedCost || parseFloat(String(costRate).replace(/,/g, '')) || 0;
  const monthlyHrs = monthlyHoursFromWeeklyCapacity(weeklyCap);

  const applySalaryDrivenCost = (salary: string, capacity: string) => {
    if (costManual) return;
    const rate = costRateFromMonthlySalary(
      parseFloat(String(salary).replace(/,/g, '')) || 0,
      parseFloat(String(capacity).replace(/,/g, '')) || 40
    );
    if (rate > 0 || (parseFloat(String(salary).replace(/,/g, '')) || 0) === 0) {
      setCostRate(toNumberInputValue(rate));
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !user) return;
    setSavingProfile(true);
    setError('');
    setMessage('');
    try {
      const updated = await teamService.updateUser(user.id, {
        name: profileName.trim(),
        department: profileDepartment,
        status: profileStatus,
      });
      setUser(updated);
      setProfileName(updated.name);
      setProfileDepartment(updated.department);
      setProfileStatus((updated.status as UserStatus) || 'ACTIVE');
      setMessage('Profile updated.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleDelete = async () => {
    if (!isAdmin || !user) return;
    if (user.id === currentUser?.id) {
      setError('You cannot delete your own account.');
      return;
    }
    if (!window.confirm(`Remove ${user.name} from the team? This cannot be undone.`)) return;
    setDeleting(true);
    setError('');
    try {
      await teamService.deleteUser(user.id);
      router.push('/people/team');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove team member');
      setDeleting(false);
    }
  };

  const handleSaveRates = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin || !user) return;
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const cap = parseFloat(String(capacityHours).replace(/,/g, '')) || 40;
      const salary = parseFloat(String(monthlySalary).replace(/,/g, '')) || 0;
      const hourly =
        costManual && parseFloat(String(costRate).replace(/,/g, '')) > 0
          ? parseFloat(String(costRate).replace(/,/g, ''))
          : costRateFromMonthlySalary(salary, cap) ||
            parseFloat(String(costRate).replace(/,/g, '')) ||
            0;
      const updated = await teamService.updateUser(user.id, {
        monthlySalary: salary,
        costRate: hourly,
        billableRate: parseFloat(String(billableRate).replace(/,/g, '')) || 0,
        capacityHours: cap,
      });
      setUser(updated);
      applyPayFields(updated, {
        setMonthlySalary,
        setCostRate,
        setBillableRate,
        setCapacityHours,
        setCostManual,
      });
      setMessage(
        `Pay saved · monthly ${formatCurrency(updated.monthlySalary || salary)} · hourly cost ${formatCurrency(updated.costRate || hourly)}/h`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save rates');
    } finally {
      setSaving(false);
    }
  };

  if (loadError && !user) {
    return (
      <div className="space-y-3 p-8 text-center">
        <p className="text-[#475569]">{loadError}</p>
        <Link href="/people/team" className="text-[13px] font-semibold text-[#9333EA] hover:underline">
          Back to team
        </Link>
      </div>
    );
  }

  if (!user || !isHydrated) {
    return <div className="p-8 text-center text-[#475569]">Loading employee profile...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/people/team"
            className="rounded-xl border border-[#E2E8F0] bg-white p-2 text-[#475569] hover:text-[#0C2A43]"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <span className="font-label text-xs text-[#9333EA]">{user.department}</span>
            <h1 className="font-title text-2xl font-bold tracking-tight text-[#0C2A43]">{user.name}</h1>
          </div>
        </div>
        {isAdmin && user.id !== currentUser?.id ? (
          <Button
            type="button"
            variant="danger"
            size="sm"
            isLoading={deleting}
            leftIcon={<Trash2 className="h-3.5 w-3.5" />}
            onClick={() => void handleDelete()}
          >
            Remove
          </Button>
        ) : null}
      </div>

      {message && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-[13px] text-emerald-800">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
          {error}
        </div>
      )}

      {isAdmin ? (
        <Card className="space-y-4 p-4">
          <h3 className="font-title text-base font-bold text-[#0C2A43]">Profile</h3>
          <form onSubmit={handleSaveProfile} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Input
              label="Full name"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              required
            />
            <Select
              label="Department"
              value={profileDepartment}
              onChange={(e) => setProfileDepartment(e.target.value)}
              options={DEPARTMENTS.map((d) => ({ value: d, label: d }))}
            />
            <Select
              label="Status"
              value={profileStatus}
              onChange={(e) => setProfileStatus(e.target.value as UserStatus)}
              options={[
                { value: 'ACTIVE', label: 'Active' },
                { value: 'INACTIVE', label: 'Inactive' },
                { value: 'ON_LEAVE', label: 'On leave' },
                { value: 'INVITED', label: 'Invited' },
              ]}
            />
            <div className="sm:col-span-3">
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={savingProfile}
                leftIcon={<Save className="h-3.5 w-3.5" />}
              >
                Save profile
              </Button>
            </div>
          </form>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="flex flex-col items-center space-y-4 p-6 text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-[#F5F0FF] text-2xl font-bold text-[#9333EA]">
            {user.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase()}
          </div>
          <div>
            <h2 className="font-title text-lg font-bold text-[#0C2A43]">{user.name}</h2>
            <p className="mt-0.5 font-label text-xs text-[#9333EA]">{user.role}</p>
            <p className="mt-1 text-[12px] text-[#475569]">{user.email}</p>
          </div>
          <Badge variant="active">{user.status}</Badge>

          <div className="w-full rounded-lg border border-[#E9D5FF] bg-[#F8F5FF] px-3 py-2 text-left text-[11px]">
            <div className="font-semibold text-[#0C2A43]">Saved pay (from server)</div>
            <div className="mt-1 flex justify-between gap-2 text-[#475569]">
              <span>Monthly salary</span>
              <span className="font-bold tabular-nums text-[#0C2A43]">
                {formatCurrency(user.monthlySalary || 0)}
              </span>
            </div>
            <div className="flex justify-between gap-2 text-[#475569]">
              <span>Hourly cost</span>
              <span className="font-bold tabular-nums text-[#7e22ce]">
                {formatCurrency(user.costRate || 0)}/h
              </span>
            </div>
          </div>

          <div className="w-full space-y-3 border-t border-[#E2E8F0] pt-4 text-left text-xs">
            <span className="block text-[10px] font-extrabold uppercase tracking-widest text-[#7e22ce]">
              Pay, cost & bill rates (admin)
            </span>

            {isAdmin ? (
              <form
                key={`pay-${user.id}-${user.monthlySalary ?? 0}-${user.costRate ?? 0}`}
                onSubmit={handleSaveRates}
                className="space-y-3"
              >
                <Input
                  id={`monthly-salary-${user.id}`}
                  name="monthlySalary"
                  label="Monthly salary"
                  type="number"
                  min="0"
                  step="1"
                  inputMode="decimal"
                  value={monthlySalary}
                  onChange={(e) => {
                    const v = e.target.value.replace(/,/g, '');
                    setMonthlySalary(v);
                    applySalaryDrivenCost(v, capacityHours);
                  }}
                  helperText={`÷ ${monthlyHrs.toFixed(1)}h/mo (cap × 52/12) → hourly cost`}
                />
                <Input
                  id={`capacity-${user.id}`}
                  name="capacityHours"
                  label="Weekly capacity (hours)"
                  type="number"
                  min="1"
                  step="0.5"
                  value={capacityHours}
                  onChange={(e) => {
                    const v = e.target.value.replace(/,/g, '');
                    setCapacityHours(v);
                    applySalaryDrivenCost(monthlySalary, v);
                  }}
                />
                <Input
                  id={`cost-rate-${user.id}`}
                  name="costRate"
                  label="Internal cost rate / hour"
                  type="number"
                  min="0"
                  step="0.01"
                  value={costRate}
                  onChange={(e) => {
                    setCostManual(true);
                    setCostRate(e.target.value.replace(/,/g, ''));
                  }}
                  helperText={
                    salaryNum > 0 && !costManual
                      ? `Auto from salary · 1 hour project cost = ${formatCurrency(effectiveCost)}`
                      : 'Override hourly cost manually if needed'
                  }
                />
                {salaryNum > 0 && (
                  <div className="rounded-md border border-[#E9D5FF] bg-[#F8F5FF] px-3 py-2 text-[11px] text-[#1E293B]">
                    <div className="font-semibold text-[#0C2A43]">Project cost from time</div>
                    <p className="mt-0.5 text-[#475569]">
                      1h on a project costs{' '}
                      <span className="font-bold tabular-nums text-[#7e22ce]">
                        {formatCurrency(effectiveCost)}
                      </span>
                      . 8h day ≈{' '}
                      <span className="font-bold tabular-nums">
                        {formatCurrency(effectiveCost * 8)}
                      </span>
                      .
                    </p>
                    <button
                      type="button"
                      className="mt-1.5 cursor-pointer text-[11px] font-semibold text-[#9333EA] hover:underline"
                      onClick={() => {
                        setCostManual(false);
                        applySalaryDrivenCost(monthlySalary, capacityHours);
                      }}
                    >
                      Reset hourly from salary
                    </button>
                  </div>
                )}
                <Input
                  id={`billable-rate-${user.id}`}
                  name="billableRate"
                  label="Client billable rate / hour"
                  type="number"
                  min="0"
                  step="0.01"
                  value={billableRate}
                  onChange={(e) => setBillableRate(e.target.value.replace(/,/g, ''))}
                  helperText="What clients pay when their time is invoiced"
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={saving}
                  leftIcon={<Save className="h-3.5 w-3.5" />}
                  className="w-full"
                >
                  Save pay & rates
                </Button>
              </form>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-2.5">
                  <span className="text-[#475569]">Monthly salary</span>
                  <span className="font-mono font-bold text-[#0C2A43]">
                    {formatCurrency(user.monthlySalary || 0)}
                  </span>
                </div>
                <div className="flex justify-between rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-2.5">
                  <span className="text-[#475569]">Cost rate</span>
                  <span className="font-mono font-bold text-[#7e22ce]">
                    {formatCurrency(user.costRate || 0)}/h
                  </span>
                </div>
                <div className="flex justify-between rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-2.5">
                  <span className="text-[#475569]">Billable rate</span>
                  <span className="font-mono font-bold text-[#3B82F6]">
                    {formatCurrency(user.billableRate || 0)}/h
                  </span>
                </div>
              </div>
            )}
          </div>
        </Card>

        <Card className="space-y-4 md:col-span-2">
          <h3 className="font-title border-b border-[#E2E8F0] pb-3 text-base font-bold text-[#0C2A43]">
            Assigned projects & workload
          </h3>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {assignedProjects.length === 0 ? (
              <p className="text-xs text-[#475569]">No projects assigned yet.</p>
            ) : (
              assignedProjects.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3"
                >
                  <div>
                    <span className="block text-xs font-bold text-[#0C2A43]">{p.name}</span>
                    <span className="font-label text-[10px] text-[#475569]">{p.code}</span>
                  </div>
                  <Badge variant="billable">{p.type.replaceAll('_', ' ')}</Badge>
                </div>
              ))
            )}
          </div>

          <div className="space-y-3 border-t border-[#E2E8F0] pt-3">
            <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#475569]">
              <History className="h-4 w-4 text-[#9333EA]" /> Recent weekly timesheet
            </h4>
            {submission ? (
              <div className="flex items-center justify-between rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                <div>
                  <span className="block text-xs font-bold text-[#0C2A43]">
                    Week of {formatWeekRangeString(parseISO(submission.weekStartDate))}
                  </span>
                  <span className="text-[11px] text-[#475569]">
                    Logged {submission.totalHours}h / Expected {submission.expectedHours}h
                    {(user.costRate || 0) > 0 && submission.totalHours > 0 ? (
                      <>
                        {' '}
                        · labor cost ≈ {formatCurrency(submission.totalHours * (user.costRate || 0))}
                      </>
                    ) : null}
                  </span>
                </div>
                <Badge variant={submission.status === 'APPROVED' ? 'approved' : 'submitted'}>
                  {submission.status}
                </Badge>
              </div>
            ) : (
              <p className="text-xs text-[#475569]">No recent submission logged.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
