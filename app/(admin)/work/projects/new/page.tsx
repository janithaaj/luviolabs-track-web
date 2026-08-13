'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { projectService } from '../../../../../src/services/project-service';
import { clientService } from '../../../../../src/services/client-service';
import { teamService } from '../../../../../src/services/team-service';
import { taskService } from '../../../../../src/services/task-service';
import { Client, User, ProjectType, Task } from '../../../../../src/types';
import { Button } from '../../../../../src/components/ui/button';
import { Input } from '../../../../../src/components/ui/input';
import { Select } from '../../../../../src/components/ui/select';
import { Textarea } from '../../../../../src/components/ui/textarea';
import { Drawer } from '../../../../../src/components/ui/drawer';
import { GettingStartedPayrollBar } from '../../../../../src/components/common/GettingStartedPayrollBar';
import { useAuthStore } from '../../../../../src/store/use-auth-store';

type ProjectTaskRow = { id: string; name: string; billable: boolean };

function toProjectTaskRows(list: Task[]): ProjectTaskRow[] {
  return list.map((t) => ({
    id: t.id,
    name: t.name,
    billable: t.isBillableDefault,
  }));
}

function commonCatalogTasks(catalog: Task[]): Task[] {
  return catalog.filter((t) => t.isCommon !== false && t.category !== 'Other');
}

function FormRow({
  label,
  children,
  helper,
}: {
  label: string;
  children: React.ReactNode;
  helper?: string;
}) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-[160px_1fr] sm:items-start">
      <label className="pt-2 text-[13px] font-bold text-[#0C2A43]">{label}</label>
      <div>
        {children}
        {helper && <p className="mt-1.5 text-[12px] leading-relaxed text-[#475569]">{helper}</p>}
      </div>
    </div>
  );
}

export default function NewProjectPage() {
  const router = useRouter();
  const { currentUser } = useAuthStore();
  const [clients, setClients] = useState<Client[]>([]);
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

  const [clientId, setClientId] = useState('');
  const [projectName, setProjectName] = useState('');
  const [projectCode, setProjectCode] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currency, setCurrency] = useState('LKR');
  const [notes, setNotes] = useState('');
  const [permission, setPermission] = useState('ADMINS');
  const [projectType, setProjectType] = useState<ProjectType>('TIME_AND_MATERIALS');
  const [billableRate, setBillableRate] = useState('');
  const [fixedFeeAmount, setFixedFeeAmount] = useState('');
  const [budgetHours, setBudgetHours] = useState('');
  const [budgetResetMonthly, setBudgetResetMonthly] = useState(false);
  const [sendAlerts, setSendAlerts] = useState(true);
  const [alertThreshold, setAlertThreshold] = useState('80.00');
  const [catalogTasks, setCatalogTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [tasks, setTasks] = useState<ProjectTaskRow[]>([]);
  const [newTaskName, setNewTaskName] = useState('');
  const [addingTask, setAddingTask] = useState(false);
  const [taskError, setTaskError] = useState('');
  const [dueDateType, setDueDateType] = useState('Upon receipt');
  const [poNumber, setPoNumber] = useState('');
  const [taxPercent, setTaxPercent] = useState('');
  const [tax2Percent, setTax2Percent] = useState('');
  const [showSecondTax, setShowSecondTax] = useState(false);
  const [discountPercent, setDiscountPercent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClientOpen, setIsClientOpen] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [clientError, setClientError] = useState('');

  const loadCatalogTasks = async () => {
    setTasksLoading(true);
    setTaskError('');
    try {
      const catalog = await taskService.getTasks();
      setCatalogTasks(catalog);
      setTasks((prev) => {
        if (prev.length > 0) {
          const ids = new Set(catalog.map((t) => t.id));
          return prev.filter((t) => ids.has(t.id));
        }
        const commons = commonCatalogTasks(catalog);
        return toProjectTaskRows(commons.length ? commons : catalog);
      });
      if (!catalog.length) {
        setTaskError('No tasks found. Create one below or add tasks from the Tasks tab.');
      }
    } catch (err) {
      setCatalogTasks([]);
      setTaskError(err instanceof Error ? err.message : 'Failed to load tasks');
    } finally {
      setTasksLoading(false);
    }
  };

  useEffect(() => {
    Promise.all([
      clientService.getClients(),
      teamService.getEmployees(),
      loadCatalogTasks(),
    ]).then(([c, employees]) => {
      setClients(c);
      setTeamMembers(employees);
      if (employees.length > 0) {
        setSelectedMemberIds(employees.map((e) => e.id));
      }
    });
  }, []);

  const isTaskSelected = (id: string) => tasks.some((t) => t.id === id);

  const toggleTaskSelected = (task: Task) => {
    setTasks((prev) => {
      if (prev.some((t) => t.id === task.id)) {
        return prev.filter((t) => t.id !== task.id);
      }
      return [...prev, { id: task.id, name: task.name, billable: task.isBillableDefault }];
    });
  };

  const setTaskBillable = (id: string, billable: boolean) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, billable } : t)));
  };

  const handleAddTask = async () => {
    const name = newTaskName.trim();
    if (!name) {
      setTaskError('Enter a task name');
      return;
    }
    setAddingTask(true);
    setTaskError('');
    try {
      const created = await taskService.createTask({
        name,
        category: 'Engineering',
        isBillableDefault: true,
        isCommon: true,
      });
      setCatalogTasks((prev) => {
        if (prev.some((t) => t.id === created.id)) return prev;
        return [...prev, created].sort((a, b) => a.name.localeCompare(b.name));
      });
      setTasks((prev) => {
        if (prev.some((t) => t.id === created.id)) return prev;
        return [...prev, { id: created.id, name: created.name, billable: created.isBillableDefault }];
      });
      setNewTaskName('');
    } catch (err) {
      setTaskError(err instanceof Error ? err.message : 'Failed to create task');
    } finally {
      setAddingTask(false);
    }
  };

  const toggleMember = (id: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsSubmitting(true);
    const client = clients.find((c) => c.id === clientId);

    try {
      await projectService.saveProject({
        name: projectName || 'New Project',
        code: projectCode || `PRJ-${Math.floor(10 + Math.random() * 90)}`,
        clientId: clientId || 'client-1',
        clientName: client ? client.companyName : 'Client',
        description: notes,
        startDate: startDate || new Date().toISOString().split('T')[0],
        deadline: endDate,
        managerId: currentUser.id,
        managerName: currentUser.name,
        teamMemberIds: selectedMemberIds,
        taskIds: tasks.map((t) => t.id),
        type: projectType,
        budget:
          projectType === 'FIXED_FEE' || projectType === 'MONTHLY'
            ? {
                type: 'TOTAL_AMOUNT',
                totalAmount: parseFloat(fixedFeeAmount) || 0,
                totalHours: parseFloat(budgetHours) || undefined,
                warnThresholds: [70, parseFloat(alertThreshold) || 80, 90, 100],
              }
            : {
                type: 'TOTAL_HOURS',
                totalHours: parseFloat(budgetHours) || 200,
                warnThresholds: [70, parseFloat(alertThreshold) || 80, 90, 100],
              },
        currency
      });
      router.push('/work/projects');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5 pb-10">
      <div className="text-[13px] font-semibold text-[#475569]">Projects</div>
      <GettingStartedPayrollBar />
      <h1 className="text-[28px] font-bold tracking-tight text-[#0C2A43]">New project</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <FormRow label="Client">
          <div className="flex flex-wrap items-center gap-2">
            <div className="min-w-[240px] flex-1">
              <Select
                value={clientId}
                onChange={(e) => {
                  const id = e.target.value;
                  setClientId(id);
                  const c = clients.find((x) => x.id === id);
                  if (c?.currency) setCurrency(c.currency);
                  else setCurrency('LKR');
                }}
                options={[
                  { value: '', label: 'Choose a client...' },
                  ...clients.map((c) => ({ value: c.id, label: c.companyName }))
                ]}
              />
            </div>
            <span className="text-[12px] text-[#64748B]">or</span>
            <Button type="button" variant="outline" size="sm" onClick={() => setIsClientOpen(true)}>
              + New client
            </Button>
          </div>
        </FormRow>

        <FormRow label="Project name">
          <Input value={projectName} onChange={(e) => setProjectName(e.target.value)} required />
        </FormRow>

        <FormRow
          label="Project code"
          helper="Optional. A code can help identify your project. You can use any combination of numbers or letters."
        >
          <Input value={projectCode} onChange={(e) => setProjectCode(e.target.value)} className="max-w-xs" />
        </FormRow>

        <FormRow
          label="Dates"
          helper="Optional. You'll still be able to track time outside of this date range."
        >
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-40">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                placeholder="Starts on"
              />
            </div>
            <span className="text-[13px] text-[#475569]">to</span>
            <div className="w-40">
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
        </FormRow>

        <FormRow
          label="Billing currency"
          helper="Optional. Sets the currency for this project's billable rates, fees, and budgets. Costs always use your account currency."
        >
          <div className="max-w-xs">
            <Select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              options={[
                { value: 'LKR', label: 'LKR — Sri Lankan Rupee' },
                { value: 'USD', label: 'USD — US Dollar' },
              ]}
            />
          </div>
        </FormRow>

        <FormRow
          label="Notes"
          helper="Optional. Notes are great for anything you need to reference later, like invoice schedules, which you can see when creating an Invoice for Fixed Fee projects. Currently, notes can only be seen by Administrators."
        >
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
        </FormRow>

        <FormRow label="Permissions">
          <div className="space-y-2 text-[13px] text-[#1E293B]">
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="radio"
                name="perm"
                checked={permission === 'ADMINS'}
                onChange={() => setPermission('ADMINS')}
                className="mt-0.5 text-[#9333EA] focus:ring-[#9333EA]"
              />
              <span>
                Show project report to Administrators and people who manage this project.{' '}
                <button type="button" className="text-[#2d5bff] hover:underline">
                  What will people see?
                </button>
              </span>
            </label>
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="radio"
                name="perm"
                checked={permission === 'EVERYONE'}
                onChange={() => setPermission('EVERYONE')}
                className="mt-0.5 text-[#9333EA] focus:ring-[#9333EA]"
              />
              <span>
                Show project report to everyone on this project.{' '}
                <button type="button" className="text-[#2d5bff] hover:underline">
                  What will people see?
                </button>
              </span>
            </label>
          </div>
        </FormRow>

        <FormRow label="Project type">
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {(
                [
                  {
                    type: 'TIME_AND_MATERIALS' as const,
                    title: 'Time & Materials',
                    desc: 'Bill by the hour, with billable rates'
                  },
                  {
                    type: 'FIXED_FEE' as const,
                    title: 'Fixed Fee',
                    desc: 'Bill a set price, regardless of time tracked'
                  },
                  {
                    type: 'MONTHLY' as const,
                    title: 'Monthly',
                    desc: 'Bill a set amount every month (retainer)'
                  },
                  {
                    type: 'NON_BILLABLE' as const,
                    title: 'Non-Billable',
                    desc: 'Not billed to a client'
                  }
                ] as const
              ).map((opt) => (
                <button
                  key={opt.type}
                  type="button"
                  onClick={() => setProjectType(opt.type)}
                  className={`rounded-lg border px-3 py-3 text-left cursor-pointer transition-colors ${
                    projectType === opt.type
                      ? 'border-[#9333EA] bg-[#F5F0FF] text-[#9333EA]'
                      : 'border-[#E2E8F0] bg-white text-[#1E293B] hover:border-[#b8b2ab]'
                  }`}
                >
                  <div className="text-[13px] font-bold">{opt.title}</div>
                  <div className="mt-0.5 text-[11px] opacity-80">{opt.desc}</div>
                </button>
              ))}
            </div>

            {projectType === 'TIME_AND_MATERIALS' && (
              <div className="space-y-4 rounded-lg border border-[#E9D5FF] bg-[#F8F5FF] p-4">
                <div>
                  <div className="text-[13px] font-bold text-[#0C2A43]">Billable rates</div>
                  <p className="mt-0.5 text-[12px] text-[#475569]">
                    We need billable rates to track your project&apos;s billable amount.
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <div className="w-48">
                      <Select
                        value="PROJECT_RATE"
                        onChange={() => {}}
                        options={[{ value: 'PROJECT_RATE', label: 'Project billable rate' }]}
                      />
                    </div>
                    <span className="font-bold text-[#1E293B]">$</span>
                    <div className="w-24">
                      <Input
                        value={billableRate}
                        onChange={(e) => setBillableRate(e.target.value)}
                      />
                    </div>
                    <span className="text-[13px] text-[#475569]">per hour</span>
                  </div>
                </div>

                <div className="border-t border-[#E9D5FF] pt-4">
                  <div className="text-[13px] font-bold text-[#0C2A43]">Budget</div>
                  <p className="mt-0.5 text-[12px] text-[#475569]">
                    Set a budget to track project progress.
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <div className="w-48">
                      <Select
                        value="TOTAL_HOURS"
                        onChange={() => {}}
                        options={[{ value: 'TOTAL_HOURS', label: 'Total project hours' }]}
                      />
                    </div>
                    <div className="w-28">
                      <Input
                        value={budgetHours}
                        onChange={(e) => setBudgetHours(e.target.value)}
                      />
                    </div>
                    <span className="text-[13px] text-[#475569]">hours</span>
                  </div>
                  <div className="mt-3 space-y-2 text-[13px] text-[#1E293B]">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={budgetResetMonthly}
                        onChange={(e) => setBudgetResetMonthly(e.target.checked)}
                        className="rounded border-[#E2E8F0] text-[#9333EA]"
                      />
                      Budget resets every month
                    </label>
                    <label className="flex flex-wrap items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sendAlerts}
                        onChange={(e) => setSendAlerts(e.target.checked)}
                        className="rounded border-[#E2E8F0] text-[#9333EA]"
                      />
                      Send email alerts if project exceeds
                      <div className="w-20">
                        <Input
                          value={alertThreshold}
                          onChange={(e) => setAlertThreshold(e.target.value)}
                          className="py-1 text-center text-xs"
                        />
                      </div>
                      % of budget
                    </label>
                  </div>
                </div>
              </div>
            )}

            {projectType === 'FIXED_FEE' && (
              <div className="space-y-4 rounded-lg border border-[#E9D5FF] bg-[#F8F5FF] p-4">
                <div>
                  <div className="text-[13px] font-bold text-[#0C2A43]">Fixed fee</div>
                  <p className="mt-0.5 text-[12px] text-[#475569]">
                    Set the project price billed regardless of hours tracked.
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="font-bold text-[#1E293B]">
                      {currency === 'LKR' ? 'Rs' : '$'}
                    </span>
                    <div className="w-36">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={fixedFeeAmount}
                        onChange={(e) => setFixedFeeAmount(e.target.value)}
                        required
                      />
                    </div>
                    <span className="text-[13px] text-[#475569]">{currency}</span>
                  </div>
                </div>
                <div className="border-t border-[#E9D5FF] pt-4">
                  <div className="text-[13px] font-bold text-[#0C2A43]">Optional hours budget</div>
                  <p className="mt-0.5 text-[12px] text-[#475569]">
                    Track internal effort against hours even on fixed-fee work.
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <div className="w-28">
                      <Input
                        value={budgetHours}
                        onChange={(e) => setBudgetHours(e.target.value)}
                        placeholder="e.g. 120"
                      />
                    </div>
                    <span className="text-[13px] text-[#475569]">hours</span>
                  </div>
                </div>
              </div>
            )}

            {projectType === 'MONTHLY' && (
              <div className="space-y-4 rounded-lg border border-[#E9D5FF] bg-[#F8F5FF] p-4">
                <div>
                  <div className="text-[13px] font-bold text-[#0C2A43]">Monthly fee</div>
                  <p className="mt-0.5 text-[12px] text-[#475569]">
                    Set the amount billed each month (retainer), regardless of hours tracked.
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="font-bold text-[#1E293B]">
                      {currency === 'LKR' ? 'Rs' : '$'}
                    </span>
                    <div className="w-36">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={fixedFeeAmount}
                        onChange={(e) => setFixedFeeAmount(e.target.value)}
                        required
                      />
                    </div>
                    <span className="text-[13px] text-[#475569]">{currency} / month</span>
                  </div>
                </div>
                <div className="border-t border-[#E9D5FF] pt-4">
                  <div className="text-[13px] font-bold text-[#0C2A43]">Optional monthly hours budget</div>
                  <p className="mt-0.5 text-[12px] text-[#475569]">
                    Track internal effort against hours each month.
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <div className="w-28">
                      <Input
                        value={budgetHours}
                        onChange={(e) => setBudgetHours(e.target.value)}
                        placeholder="e.g. 40"
                      />
                    </div>
                    <span className="text-[13px] text-[#475569]">hours / month</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </FormRow>

        {/* Tasks */}
        <div className="border-t border-[#E2E8F0] pt-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-[16px] font-bold text-[#0C2A43]">Tasks</h3>
              <p className="text-[12px] text-[#475569]">
                All tasks from your Tasks catalog. Check the ones for this project.
              </p>
            </div>
            <span className="text-[12px] text-[#475569]">
              Select:{' '}
              <button
                type="button"
                onClick={() => setTasks(toProjectTaskRows(catalogTasks))}
                className="font-semibold text-[#2d5bff] hover:underline"
                disabled={tasksLoading || catalogTasks.length === 0}
              >
                All
              </button>{' '}
              /{' '}
              <button
                type="button"
                onClick={() => setTasks([])}
                className="font-semibold text-[#2d5bff] hover:underline"
                disabled={tasksLoading}
              >
                None
              </button>
              {' · '}
              <button
                type="button"
                onClick={() => void loadCatalogTasks()}
                className="font-semibold text-[#2d5bff] hover:underline"
                disabled={tasksLoading}
              >
                Refresh
              </button>
            </span>
          </div>

          <div className="max-h-72 overflow-y-auto rounded-lg border border-[#E2E8F0] divide-y divide-[#F1F5F9]">
            {tasksLoading ? (
              <div className="px-3 py-6 text-center text-[12px] text-[#475569]">Loading tasks…</div>
            ) : catalogTasks.length === 0 ? (
              <div className="px-3 py-6 text-center text-[12px] text-[#475569]">
                No catalog tasks yet. Create one below.
              </div>
            ) : (
              catalogTasks.map((t) => {
                const selected = isTaskSelected(t.id);
                const row = tasks.find((x) => x.id === t.id);
                return (
                  <div
                    key={t.id}
                    className="flex items-center justify-between gap-3 px-3 py-2.5 hover:bg-[#F8FAFC]"
                  >
                    <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleTaskSelected(t)}
                        className="rounded border-[#E2E8F0] text-[#9333EA]"
                      />
                      <span className="truncate text-[13px] font-medium text-[#0C2A43]">
                        {t.name}
                      </span>
                      {t.category === 'Other' ? (
                        <span className="shrink-0 text-[11px] text-[#64748B]">Other</span>
                      ) : null}
                    </label>
                    <label
                      className={`flex shrink-0 items-center gap-2 text-[12px] cursor-pointer ${
                        selected ? 'text-[#475569]' : 'text-[#94A3B8]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={row?.billable ?? t.isBillableDefault}
                        disabled={!selected}
                        onChange={(e) => setTaskBillable(t.id, e.target.checked)}
                        className="rounded border-[#E2E8F0] text-[#9333EA]"
                      />
                      Billable
                    </label>
                  </div>
                );
              })
            )}
          </div>

          <p className="mt-2 text-[12px] text-[#64748B]">
            {tasks.length} of {catalogTasks.length} selected
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <div className="min-w-[200px] flex-1">
              <Input
                placeholder="Create a new task…"
                value={newTaskName}
                onChange={(e) => setNewTaskName(e.target.value)}
                disabled={addingTask}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    void handleAddTask();
                  }
                }}
              />
            </div>
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={addingTask || !newTaskName.trim()}
              isLoading={addingTask}
              onClick={() => void handleAddTask()}
            >
              Create task
            </Button>
          </div>
          {taskError ? (
            <p className="mt-1.5 text-[12px] text-red-600">{taskError}</p>
          ) : null}
        </div>

        {/* Team */}
        <div className="border-t border-[#E2E8F0] pt-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-[16px] font-bold text-[#0C2A43]">Team</h3>
              <p className="text-[12px] text-[#475569]">
                Assigned employees can track time on this project only.
              </p>
            </div>
            <span className="text-[12px] text-[#475569]">
              Select:{' '}
              <button
                type="button"
                onClick={() => setSelectedMemberIds(teamMembers.map((m) => m.id))}
                className="font-semibold text-[#2d5bff] hover:underline"
              >
                All
              </button>{' '}
              /{' '}
              <button
                type="button"
                onClick={() => setSelectedMemberIds([])}
                className="font-semibold text-[#2d5bff] hover:underline"
              >
                None
              </button>
            </span>
          </div>

          {teamMembers.length === 0 ? (
            <div className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-[13px] text-[#475569]">
              No employees yet. Create people from{' '}
              <a href="/people/team" className="font-semibold text-[#9333EA] hover:underline">
                Team → Invite person
              </a>
              .
            </div>
          ) : (
            <div className="divide-y divide-[#F1F5F9]">
              {teamMembers.map((member) => {
                const assigned = selectedMemberIds.includes(member.id);
                return (
                  <label
                    key={member.id}
                    className="flex cursor-pointer items-center justify-between py-2.5"
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={assigned}
                        onChange={() => toggleMember(member.id)}
                        className="rounded border-[#E2E8F0] text-[#9333EA]"
                      />
                      <div>
                        <div className="text-[13px] font-medium text-[#0C2A43]">{member.name}</div>
                        <div className="text-[11px] text-[#475569]">{member.email}</div>
                      </div>
                    </div>
                    <span className="text-[12px] text-[#475569]">{member.department}</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* Invoice values */}
        <div className="space-y-4 border-t border-[#E2E8F0] pt-5">
          <h3 className="text-[16px] font-bold text-[#0C2A43]">Invoice values</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              label="Invoice due date"
              value={dueDateType}
              onChange={(e) => setDueDateType(e.target.value)}
              options={[{ value: 'Upon receipt', label: 'Upon receipt' }]}
            />
            <Input
              label="PO Number"
              value={poNumber}
              onChange={(e) => setPoNumber(e.target.value)}
            />
            <div>
              <Input
                label="Tax"
                placeholder="%"
                value={taxPercent}
                onChange={(e) => setTaxPercent(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowSecondTax(true)}
                className="mt-1 text-[12px] font-semibold text-[#2d5bff] hover:underline"
              >
                Enable second tax
              </button>
              {showSecondTax && (
                <div className="mt-2">
                  <Input
                    label="Second tax %"
                    value={tax2Percent}
                    onChange={(e) => setTax2Percent(e.target.value)}
                  />
                </div>
              )}
            </div>
            <Input
              label="Discount"
              placeholder="%"
              value={discountPercent}
              onChange={(e) => setDiscountPercent(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            Save project
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push('/work/projects')}>
            Cancel
          </Button>
        </div>
      </form>

      <Drawer
        isOpen={isClientOpen}
        onClose={() => setIsClientOpen(false)}
        title="New client"
      >
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setClientError('');
            if (!newClientName.trim()) {
              setClientError('Company name required');
              return;
            }
            const created = await clientService.saveClient({
              companyName: newClientName,
              contactPerson: newClientName,
              email: newClientEmail || 'client@example.com',
              currency: 'LKR',
            });
            const list = await clientService.getClients();
            setClients(list);
            setClientId(created.id);
            setCurrency('LKR');
            setIsClientOpen(false);
            setNewClientName('');
            setNewClientEmail('');
          }}
        >
          <Input
            label="Company name"
            value={newClientName}
            onChange={(e) => setNewClientName(e.target.value)}
            required
          />
          <Input
            label="Email"
            value={newClientEmail}
            onChange={(e) => setNewClientEmail(e.target.value)}
          />
          {clientError && <p className="text-[13px] text-red-600">{clientError}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setIsClientOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save client
            </Button>
          </div>
        </form>
      </Drawer>
    </div>
  );
}
