'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Receipt } from 'lucide-react';
import { Button } from '../../../../src/components/ui/button';
import { Drawer } from '../../../../src/components/ui/drawer';
import { Input } from '../../../../src/components/ui/input';
import { Select } from '../../../../src/components/ui/select';
import { Badge } from '../../../../src/components/ui/badge';
import { ActionMenu } from '../../../../src/components/ui/action-menu';
import { GettingStartedPayrollBar } from '../../../../src/components/common/GettingStartedPayrollBar';
import { formatCurrency } from '../../../../src/lib/utils';
import { projectService } from '../../../../src/services/project-service';
import { expenseService } from '../../../../src/services/expense-service';
import { Expense, Project } from '../../../../src/types';
import { DEFAULT_CURRENCY } from '../../../../src/lib/constants';
import { resolveBillingCurrency } from '../../../../src/lib/utils';

const CATEGORIES = [
  'General',
  'Travel',
  'Software',
  'Materials',
  'Meals',
  'Hosting',
  'Other',
];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [projectId, setProjectId] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState('General');
  const [billable, setBillable] = useState(true);
  const [notes, setNotes] = useState('');
  const [filterProject, setFilterProject] = useState('ALL');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [projs, exps] = await Promise.all([
      projectService.getProjects(),
      expenseService.getExpenses(
        filterProject !== 'ALL' ? { projectId: filterProject } : undefined
      ),
    ]);
    setProjects(projs);
    setExpenses(exps);
    if (projs[0] && !projectId) setProjectId(projs[0].id);
  };

  useEffect(() => {
    load();
  }, [filterProject]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const project = projects.find((p) => p.id === projectId);
      const currency = resolveBillingCurrency(project?.currency, DEFAULT_CURRENCY);
      await expenseService.createExpense({
        name: name || 'Expense',
        projectId,
        amount: parseFloat(amount) || 0,
        currency,
        billable,
        date,
        category,
        notes: notes || undefined,
      });
      setIsOpen(false);
      setName('');
      setAmount('');
      setNotes('');
      setBillable(true);
      setMessage('Expense saved.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save expense');
    } finally {
      setSaving(false);
    }
  };

  const total = expenses.reduce((a, x) => a + x.amount, 0);
  const billableTotal = expenses.filter((x) => x.billable).reduce((a, x) => a + x.amount, 0);
  const totalCurrency = resolveBillingCurrency(
    filterProject !== 'ALL'
      ? projects.find((p) => p.id === filterProject)?.currency
      : undefined,
    expenses[0]?.currency,
    projects[0]?.currency,
    DEFAULT_CURRENCY
  );
  const selectedProject = projects.find((p) => p.id === projectId);
  const formCurrency = resolveBillingCurrency(selectedProject?.currency, DEFAULT_CURRENCY);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-[28px] font-bold tracking-tight text-[#0C2A43]">Expenses</h1>
        <Button
          variant="primary"
          leftIcon={<Plus className="h-3.5 w-3.5" />}
          onClick={() => {
            setError('');
            setIsOpen(true);
          }}
        >
          New expense
        </Button>
      </div>
      <GettingStartedPayrollBar />

      {message && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-[13px] text-emerald-800">
          {message}
          <button type="button" className="ml-2 underline cursor-pointer" onClick={() => setMessage('')}>
            Dismiss
          </button>
        </div>
      )}
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
          {error}
        </div>
      )}

      <div className="flex flex-wrap items-end gap-4">
        <div className="w-56">
          <Select
            label="Project filter"
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            options={[
              { value: 'ALL', label: 'All projects' },
              ...projects.map((p) => ({ value: p.id, label: p.name })),
            ]}
          />
        </div>
        <div className="text-[13px] text-[#475569]">
          Total{' '}
          <strong className="text-[#0C2A43] tabular-nums">
            {formatCurrency(total, totalCurrency)}
          </strong>
          {' · '}
          Billable{' '}
          <strong className="text-[#3B82F6] tabular-nums">
            {formatCurrency(billableTotal, totalCurrency)}
          </strong>
        </div>
      </div>

      <div className="space-y-2">
        {expenses.map((exp) => (
          <div key={exp.id} className="harvest-card flex flex-wrap items-center gap-3 p-4 sm:flex-nowrap">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F5F0FF] text-[#9333EA]">
              <Receipt className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[14px] font-bold text-[#0C2A43]">{exp.name}</span>
                <Badge variant={exp.billable ? 'billable' : 'nonbillable'} size="sm">
                  {exp.billable ? 'Billable' : 'Non-billable'}
                </Badge>
                {exp.invoiceId ? (
                  <Badge variant="draft" size="sm">
                    Invoiced
                  </Badge>
                ) : null}
              </div>
              <div className="text-[12px] text-[#475569]">
                {exp.projectName} · {exp.date} · {exp.category}
              </div>
            </div>
            <span className="tabular-nums text-[14px] font-bold">
              {formatCurrency(exp.amount, exp.currency)}
            </span>
            <ActionMenu
              items={[
                {
                  label: exp.billable ? 'Mark non-billable' : 'Mark billable',
                  onClick: async () => {
                    try {
                      await expenseService.updateExpense(exp.id, {
                        billable: !exp.billable,
                      });
                      await load();
                    } catch (err) {
                      setError(err instanceof Error ? err.message : 'Update failed');
                    }
                  },
                },
                {
                  label: 'Delete',
                  danger: true,
                  onClick: async () => {
                    try {
                      await expenseService.deleteExpense(exp.id);
                      await load();
                    } catch (err) {
                      setError(err instanceof Error ? err.message : 'Delete failed');
                    }
                  },
                },
              ]}
            />
          </div>
        ))}
        {expenses.length === 0 && (
          <div className="harvest-empty px-6 py-12 text-center text-[13px] text-[#475569]">
            No expenses yet. Add travel, tools, or materials and mark which are billable to the
            client.
          </div>
        )}
      </div>

      <Drawer isOpen={isOpen} onClose={() => setIsOpen(false)} title="New expense">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Description"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="e.g. Client travel, Figma seat"
          />
          <Select
            label="Project"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            options={projects.map((p) => ({
              value: p.id,
              label: `${p.name} (${resolveBillingCurrency(p.currency, DEFAULT_CURRENCY)})`,
            }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label={`Amount (${formCurrency})`}
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              helperText={`Saved in project currency ${formCurrency}`}
            />
            <Input
              label="Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <Select
            label="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            options={CATEGORIES.map((c) => ({ value: c, label: c }))}
          />
          <Input
            label="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <label className="flex items-center gap-2 text-[13px] cursor-pointer">
            <input
              type="checkbox"
              checked={billable}
              onChange={(e) => setBillable(e.target.checked)}
              className="rounded border-[#E2E8F0] text-[#9333EA]"
            />
            Billable to client (pass-through on invoice)
          </label>
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
              {error}
            </div>
          )}
          <div className="flex justify-end gap-2 border-t border-[#E2E8F0] pt-4">
            <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={saving}>
              Save expense
            </Button>
          </div>
        </form>
      </Drawer>
    </div>
  );
}
