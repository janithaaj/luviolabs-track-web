'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Printer, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Button } from '../../../../src/components/ui/button';
import { Badge } from '../../../../src/components/ui/badge';
import { Input } from '../../../../src/components/ui/input';
import { Select } from '../../../../src/components/ui/select';
import { Modal } from '../../../../src/components/ui/modal';
import { Drawer } from '../../../../src/components/ui/drawer';
import { ActionMenu } from '../../../../src/components/ui/action-menu';
import { GettingStartedPayrollBar } from '../../../../src/components/common/GettingStartedPayrollBar';
import { AiPromptBar } from '../../../../src/components/common/AiPromptBar';
import { Invoice, InvoiceCostSummary, Project, Client, TimeEntry, Expense } from '../../../../src/types';
import { formatCurrency, formatMinutesToDecimal, resolveBillingCurrency } from '../../../../src/lib/utils';
import { DEFAULT_CURRENCY } from '../../../../src/lib/constants';
import {
  invoiceService,
  InvoiceDraftFromTime,
} from '../../../../src/services/invoice-service';
import { clientService } from '../../../../src/services/client-service';
import { projectService } from '../../../../src/services/project-service';
import { expenseService } from '../../../../src/services/expense-service';
import { timesheetService } from '../../../../src/services/timesheet-service';

const TABS = ['Overview', 'Recurring', 'Retainers', 'Uninvoiced', 'Configure'] as const;

function defaultDateRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 30);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

function CostPanel({
  cost,
  title = 'Cost to deliver (admin)',
}: {
  cost: InvoiceCostSummary;
  title?: string;
}) {
  return (
    <div className="space-y-3 rounded-lg border border-[#E9D5FF] bg-[#F8F5FF] p-4">
      <div>
        <div className="text-[13px] font-bold text-[#0C2A43]">{title}</div>
        <p className="mt-0.5 text-[11px] text-[#475569]">
          Internal only — not shown on the client invoice. Includes labor + all expenses.
        </p>
      </div>
      <dl className="space-y-2 text-[12px]">
        <div className="flex justify-between gap-2">
          <dt className="text-[#475569]">Billable hours</dt>
          <dd className="font-semibold tabular-nums">{cost.billableHours}h</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-[#475569]">Total hours (all)</dt>
          <dd className="tabular-nums">{cost.totalHours}h</dd>
        </div>
        <div className="flex justify-between gap-2 border-t border-[#E9D5FF] pt-2">
          <dt className="text-[#475569]">Labor cost</dt>
          <dd className="font-bold tabular-nums text-[#7e22ce]">
            {formatCurrency(cost.laborCost, cost.currency)}
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-[#475569]">Expenses (all)</dt>
          <dd className="font-bold tabular-nums text-[#7e22ce]">
            {formatCurrency(cost.expenses ?? 0, cost.currency)}
          </dd>
        </div>
        {(cost.billableExpenses ?? 0) > 0 ? (
          <div className="flex justify-between gap-2">
            <dt className="text-[#475569]">of which billable pass-through</dt>
            <dd className="tabular-nums text-[#3B82F6]">
              {formatCurrency(cost.billableExpenses, cost.currency)}
            </dd>
          </div>
        ) : null}
        <div className="flex justify-between gap-2">
          <dt className="font-semibold text-[#0C2A43]">Delivery cost</dt>
          <dd className="font-bold tabular-nums text-[#7e22ce]">
            {formatCurrency(cost.deliveryCost ?? cost.laborCost + (cost.expenses || 0), cost.currency)}
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-[#475569]">Client billable</dt>
          <dd className="font-bold tabular-nums text-[#3B82F6]">
            {formatCurrency(cost.clientBillable, cost.currency)}
          </dd>
        </div>
        <div className="flex justify-between gap-2 border-t border-[#E9D5FF] pt-2">
          <dt className="font-semibold text-[#0C2A43]">Margin</dt>
          <dd
            className={`font-bold tabular-nums ${
              cost.margin >= 0 ? 'text-[#3B82F6]' : 'text-red-600'
            }`}
          >
            {formatCurrency(cost.margin, cost.currency)} ({cost.marginPercent}%)
          </dd>
        </div>
      </dl>
      {cost.byPerson?.length > 0 && (
        <div className="border-t border-[#E9D5FF] pt-2">
          <div className="mb-1.5 text-[11px] font-bold uppercase text-[#475569]">By person</div>
          <ul className="max-h-32 space-y-1.5 overflow-y-auto text-[11px]">
            {cost.byPerson.map((p) => (
              <li key={p.userId} className="flex justify-between gap-2">
                <span className="truncate text-[#1E293B]">
                  {p.userName}{' '}
                  <span className="text-[#64748B]">
                    ({p.hours}h · cost {p.costRate}/h)
                  </span>
                </span>
                <span className="shrink-0 tabular-nums text-[#7e22ce]">
                  {formatCurrency(p.laborCost, cost.currency)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {cost.expenseLines?.length > 0 && (
        <div className="border-t border-[#E9D5FF] pt-2">
          <div className="mb-1.5 text-[11px] font-bold uppercase text-[#475569]">Expenses</div>
          <ul className="max-h-32 space-y-1.5 overflow-y-auto text-[11px]">
            {cost.expenseLines.map((x) => (
              <li key={x.id} className="flex justify-between gap-2">
                <span className="truncate text-[#1E293B]">
                  {x.name}{' '}
                  <span className="text-[#64748B]">
                    ({x.date} · {x.billable ? 'billable' : 'non-bill'})
                  </span>
                </span>
                <span className="shrink-0 tabular-nums">{formatCurrency(x.amount, cost.currency)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function AdminInvoicesPage() {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>('Overview');
  const [search, setSearch] = useState('');
  const [listTab, setListTab] = useState<'open' | 'all'>('open');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [clientFilter, setClientFilter] = useState('ALL');
  const [preview, setPreview] = useState<Invoice | null>(null);
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [formClientId, setFormClientId] = useState('');
  const [formAmount, setFormAmount] = useState('100');
  const [formDesc, setFormDesc] = useState('Professional services');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // From-time draft
  const range = defaultDateRange();
  const [isFromTimeOpen, setIsFromTimeOpen] = useState(false);
  const [ftClientId, setFtClientId] = useState('');
  const [ftProjectId, setFtProjectId] = useState('');
  const [ftStart, setFtStart] = useState(range.start);
  const [ftEnd, setFtEnd] = useState(range.end);
  const [ftGroupBy, setFtGroupBy] = useState<'person_task' | 'person' | 'task'>('person_task');
  const [ftPreview, setFtPreview] = useState<InvoiceDraftFromTime | null>(null);
  const [ftLoading, setFtLoading] = useState(false);
  const [ftSaving, setFtSaving] = useState(false);
  const [unbilledEntries, setUnbilledEntries] = useState<TimeEntry[]>([]);
  const [unbilledExpenses, setUnbilledExpenses] = useState<Expense[]>([]);
  const [unbilledLoading, setUnbilledLoading] = useState(false);

  const load = async () => {
    const [inv, c, p] = await Promise.all([
      invoiceService.getInvoices(),
      clientService.getClients(),
      projectService.getProjects(),
    ]);
    setInvoices(inv);
    setClients(c);
    setProjects(p);
    if (c[0] && !formClientId) setFormClientId(c[0].id);
    if (c[0] && !ftClientId) setFtClientId(c[0].id);
  };

  const loadUnbilled = async () => {
    setUnbilledLoading(true);
    try {
      const [entries, expenses] = await Promise.all([
        timesheetService.getAllEntries({ uninvoiced: true, billable: true }),
        expenseService.getExpenses({ uninvoiced: true, billable: true }),
      ]);
      setUnbilledEntries(entries.filter((e) => !e.invoiceId));
      setUnbilledExpenses(expenses.filter((x) => !x.invoiceId));
    } catch {
      setUnbilledEntries([]);
      setUnbilledExpenses([]);
    } finally {
      setUnbilledLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (activeTab === 'Uninvoiced') loadUnbilled();
  }, [activeTab]);

  const clientProjects = useMemo(
    () => projects.filter((p) => !ftClientId || p.clientId === ftClientId),
    [projects, ftClientId]
  );

  const filtered = useMemo(() => {
    return invoices.filter((inv) => {
      if (search) {
        const q = search.toLowerCase();
        if (
          !inv.clientName.toLowerCase().includes(q) &&
          !inv.invoiceNumber.toLowerCase().includes(q)
        )
          return false;
      }
      if (clientFilter !== 'ALL' && inv.clientId !== clientFilter) return false;
      if (listTab === 'open' && inv.status === 'PAID') return false;
      return true;
    });
  }, [invoices, search, clientFilter, listTab]);

  const displayCurrency = useMemo(() => {
    const codes = filtered.map((i) => resolveBillingCurrency(i.currency, DEFAULT_CURRENCY));
    const first = codes[0];
    if (first && codes.every((c) => c === first)) return first;
    // Prefer project/client chain for current filters, else workspace default
    if (clientFilter !== 'ALL') {
      const client = clients.find((c) => c.id === clientFilter);
      const clientProj = projects.find((p) => p.clientId === clientFilter);
      return resolveBillingCurrency(clientProj?.currency, client?.currency, DEFAULT_CURRENCY);
    }
    return resolveBillingCurrency(invoices[0]?.currency, projects[0]?.currency, DEFAULT_CURRENCY);
  }, [filtered, invoices, clients, projects, clientFilter]);

  const totalOpen = invoices
    .filter((i) => i.status !== 'PAID' && i.status !== 'CANCELLED')
    .reduce((a, i) => a + i.totalAmount, 0);
  const totalPaid = invoices
    .filter((i) => i.status === 'PAID')
    .reduce((a, i) => a + i.totalAmount, 0);

  const chartData = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ].map((month, i) => ({
    month,
    open: i === 7 ? totalOpen : 0,
    paid: i === 7 ? totalPaid : 0,
  }));

  const handleCreateManual = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const client = clients.find((c) => c.id === formClientId);
    const amount = parseFloat(formAmount) || 0;
    const clientProj = projects.find((p) => p.clientId === formClientId);
    try {
      await invoiceService.saveInvoice({
        clientId: formClientId,
        clientName: client?.companyName || 'Client',
        currency: resolveBillingCurrency(
          clientProj?.currency,
          client?.currency,
          DEFAULT_CURRENCY
        ),
        status: 'DRAFT',
        items: [
          {
            id: `item-${Date.now()}`,
            description: formDesc,
            hoursOrQty: 1,
            unitPrice: amount,
            amount,
          },
        ],
        subtotal: amount,
        taxPercent: 0,
        taxAmount: 0,
        discountAmount: 0,
        totalAmount: amount,
      });
      setIsNewOpen(false);
      setMessage('Invoice created as Draft.');
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create invoice');
    }
  };

  const runTimePreview = async () => {
    if (!ftClientId) return;
    setFtLoading(true);
    setError('');
    setFtPreview(null);
    try {
      const preview = await invoiceService.previewInvoiceFromBillableTime({
        clientId: ftClientId,
        projectId: ftProjectId || undefined,
        startDate: ftStart,
        endDate: ftEnd,
        approvedOnly: false,
        groupBy: ftGroupBy,
      });
      setFtPreview(preview);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to build draft');
    } finally {
      setFtLoading(false);
    }
  };

  const saveTimeDraft = async () => {
    if (!ftPreview?.draft.items?.length) {
      setError('No billable lines to save. Check rates, time, or billable expenses.');
      return;
    }
    setFtSaving(true);
    setError('');
    try {
      const saved = await invoiceService.saveInvoice(ftPreview.draft);
      const billableExpIds = ftPreview.cost.expenseLines
        .filter((x) => x.billable)
        .map((x) => x.id);
      await Promise.all([
        ...billableExpIds.map((id) =>
          expenseService.updateExpense(id, { invoiceId: saved.id }).catch(() => null)
        ),
        timesheetService.markEntriesInvoiced(
          ftPreview.entries.map((e) => e.id),
          saved.id
        ),
      ]);
      setIsFromTimeOpen(false);
      setFtPreview(null);
      if (activeTab === 'Uninvoiced') loadUnbilled();
      setMessage(
        `Draft invoice created · billable ${formatCurrency(
          ftPreview.cost.clientBillable,
          ftPreview.cost.currency
        )} · delivery cost ${formatCurrency(
          ftPreview.cost.deliveryCost ?? ftPreview.cost.laborCost,
          ftPreview.cost.currency
        )} · margin ${ftPreview.cost.marginPercent}%`
      );
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save invoice');
    } finally {
      setFtSaving(false);
    }
  };

  const updateStatus = async (inv: Invoice, status: Invoice['status']) => {
    await invoiceService.updateStatus(inv.id, status);
    setMessage(`Invoice ${inv.invoiceNumber} marked ${status}.`);
    setPreview(null);
    load();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="text-[28px] font-bold tracking-tight text-[#0C2A43]">Invoices</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="primary"
            leftIcon={<Clock className="h-3.5 w-3.5" />}
            onClick={() => {
              setError('');
              setFtPreview(null);
              setIsFromTimeOpen(true);
            }}
          >
            From time
          </Button>
          <Button
            variant="outline"
            leftIcon={<Plus className="h-3.5 w-3.5" />}
            onClick={() => setIsNewOpen(true)}
          >
            Manual
          </Button>
          <div className="w-48">
            <Input
              placeholder="Search invoices"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="h-3.5 w-3.5" />}
            />
          </div>
          <ActionMenu
            label="Actions"
            items={[
              {
                label: 'Export CSV',
                onClick: () => {
                  const rows = [
                    'Number,Client,Status,Total',
                    ...invoices.map(
                      (i) => `${i.invoiceNumber},${i.clientName},${i.status},${i.totalAmount}`
                    ),
                  ];
                  const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'invoices.csv';
                  a.click();
                  setMessage('Exported invoices.csv');
                },
              },
              {
                label: 'Mark open drafts as Sent',
                onClick: async () => {
                  for (const inv of filtered.filter((i) => i.status === 'DRAFT')) {
                    await invoiceService.updateStatus(inv.id, 'SENT');
                  }
                  load();
                  setMessage('Draft invoices marked Sent.');
                },
              },
            ]}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-5 border-b border-[#E2E8F0]">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`cursor-pointer pb-2.5 text-[13px] font-semibold ${
              activeTab === tab
                ? 'border-b-2 border-[#9333EA] text-[#9333EA]'
                : 'text-[#475569] hover:text-[#0C2A43]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {message && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-[13px] text-emerald-800">
          {message}
          <button className="ml-2 cursor-pointer underline" onClick={() => setMessage('')}>
            Dismiss
          </button>
        </div>
      )}
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
          {error}
          <button className="ml-2 cursor-pointer underline" onClick={() => setError('')}>
            Dismiss
          </button>
        </div>
      )}

      <GettingStartedPayrollBar />
      <AiPromptBar
        label="What would you like to do with your invoices?"
        suggestion="Invoice billable time this month"
        onRun={() => {
          setIsFromTimeOpen(true);
        }}
      />

      {activeTab === 'Overview' && (
        <>
          <div className="harvest-card grid grid-cols-1 gap-0 overflow-hidden p-0 md:grid-cols-3">
            <div className="space-y-5 border-b border-[#E2E8F0] p-5 md:border-b-0 md:border-r">
              <div>
                <div className="text-[13px] text-[#475569]">Total open</div>
                <div className="text-[28px] font-bold tabular-nums">
                  {formatCurrency(totalOpen, displayCurrency)}
                </div>
              </div>
              <div>
                <div className="text-[13px] text-[#475569]">Total paid amount</div>
                <div className="text-[28px] font-bold tabular-nums">
                  {formatCurrency(totalPaid, displayCurrency)}
                </div>
              </div>
            </div>
            <div className="col-span-1 p-5 md:col-span-2">
              <h3 className="mb-3 text-[14px] font-bold">Invoices issued in 2026</h3>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis dataKey="month" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Bar dataKey="open" fill="#34d399" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="paid" fill="#047857" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4 text-[13px] font-semibold">
              <button
                type="button"
                onClick={() => setListTab('open')}
                className={`cursor-pointer pb-1 ${
                  listTab === 'open' ? 'border-b-2 border-[#0C2A43]' : 'text-[#475569]'
                }`}
              >
                Open{' '}
                <span className="ml-1 rounded bg-[#F1F5F9] px-1.5 py-0.5 text-[11px]">
                  {invoices.filter((i) => i.status !== 'PAID').length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setListTab('all')}
                className={`cursor-pointer pb-1 ${
                  listTab === 'all' ? 'border-b-2 border-[#0C2A43]' : 'text-[#475569]'
                }`}
              >
                All invoices
              </button>
            </div>
            <div className="w-36">
              <Select
                value={clientFilter}
                onChange={(e) => setClientFilter(e.target.value)}
                options={[
                  { value: 'ALL', label: 'All clients' },
                  ...clients.map((c) => ({ value: c.id, label: c.companyName })),
                ]}
              />
            </div>
          </div>

          <div className="harvest-card harvest-table-wrap p-0">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-[#E2E8F0] text-[12px] font-semibold text-[#475569]">
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Issue date</th>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3 text-right">Balance</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {filtered.map((inv) => (
                  <tr key={inv.id} className="hover:bg-[#F8FAFC]">
                    <td className="px-4 py-3">
                      <Badge variant="draft">{inv.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-[#475569]">{inv.issueDate}</td>
                    <td className="px-4 py-3 font-semibold">{inv.invoiceNumber}</td>
                    <td className="px-4 py-3 font-bold">{inv.clientName}</td>
                    <td className="px-4 py-3 text-right font-bold tabular-nums">
                      {formatCurrency(inv.totalAmount, inv.currency)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <ActionMenu
                        items={[
                          { label: 'View', onClick: () => setPreview(inv) },
                          {
                            label: 'Mark Sent',
                            onClick: () => updateStatus(inv, 'SENT'),
                          },
                          {
                            label: 'Mark Paid',
                            onClick: () => updateStatus(inv, 'PAID'),
                          },
                          {
                            label: 'Cancel',
                            danger: true,
                            onClick: () => updateStatus(inv, 'CANCELLED'),
                          },
                        ]}
                      />
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-[#475569]">
                      No invoices match your filters. Use <strong>From time</strong> to bill
                      hours.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === 'Recurring' && (
        <div className="harvest-empty px-6 py-12 text-center text-[13px] text-[#475569]">
          No recurring invoices yet.
        </div>
      )}
      {activeTab === 'Retainers' && (
        <div className="harvest-empty px-6 py-12 text-center text-[13px] text-[#475569]">
          No retainers configured.
        </div>
      )}
      {activeTab === 'Uninvoiced' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[13px] text-[#475569]">
              Billable time and expenses not linked to an invoice. Creating a draft marks them
              invoiced so they cannot be double-billed.
            </p>
            <Button variant="primary" onClick={() => setIsFromTimeOpen(true)}>
              Invoice from time
            </Button>
          </div>
          {unbilledLoading ? (
            <div className="harvest-empty px-6 py-10 text-center text-[13px] text-[#475569]">
              Loading uninvoiced work…
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="harvest-card overflow-hidden">
                <div className="border-b border-[#E2E8F0] px-4 py-3">
                  <h3 className="font-title text-[14px] font-bold text-[#0C2A43]">
                    Uninvoiced time
                  </h3>
                  <p className="text-[11px] text-[#64748B]">
                    {unbilledEntries.length} entries ·{' '}
                    {formatMinutesToDecimal(
                      unbilledEntries.reduce((a, e) => a + e.durationMinutes, 0)
                    )}
                    h
                  </p>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  <table className="w-full text-left text-[12px]">
                    <thead className="sticky top-0 bg-[#F8FAFC] font-label text-[10px] uppercase text-[#64748B]">
                      <tr>
                        <th className="px-3 py-2">Date</th>
                        <th className="px-3 py-2">Person</th>
                        <th className="px-3 py-2">Project</th>
                        <th className="px-3 py-2 text-right">Hours</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F1F5F9]">
                      {unbilledEntries.slice(0, 80).map((e) => (
                        <tr key={e.id} className="hover:bg-[#F8FAFC]">
                          <td className="px-3 py-2 text-[#475569]">{e.date}</td>
                          <td className="px-3 py-2 font-medium text-[#1E293B]">{e.userName}</td>
                          <td className="px-3 py-2 text-[#1E293B]">{e.projectName}</td>
                          <td className="px-3 py-2 text-right tabular-nums">
                            {formatMinutesToDecimal(e.durationMinutes)}
                          </td>
                        </tr>
                      ))}
                      {unbilledEntries.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-3 py-8 text-center text-[#64748B]">
                            No uninvoiced billable time.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="harvest-card overflow-hidden">
                <div className="border-b border-[#E2E8F0] px-4 py-3">
                  <h3 className="font-title text-[14px] font-bold text-[#0C2A43]">
                    Uninvoiced expenses
                  </h3>
                  <p className="text-[11px] text-[#64748B]">
                    {unbilledExpenses.length} ·{' '}
                    {formatCurrency(
                      unbilledExpenses.reduce((a, x) => a + x.amount, 0)
                    )}
                  </p>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  <table className="w-full text-left text-[12px]">
                    <thead className="sticky top-0 bg-[#F8FAFC] font-label text-[10px] uppercase text-[#64748B]">
                      <tr>
                        <th className="px-3 py-2">Date</th>
                        <th className="px-3 py-2">Name</th>
                        <th className="px-3 py-2">Project</th>
                        <th className="px-3 py-2 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F1F5F9]">
                      {unbilledExpenses.slice(0, 80).map((x) => (
                        <tr key={x.id} className="hover:bg-[#F8FAFC]">
                          <td className="px-3 py-2 text-[#475569]">{x.date}</td>
                          <td className="px-3 py-2 font-medium text-[#1E293B]">{x.name}</td>
                          <td className="px-3 py-2 text-[#1E293B]">{x.projectName}</td>
                          <td className="px-3 py-2 text-right tabular-nums font-semibold">
                            {formatCurrency(x.amount, x.currency)}
                          </td>
                        </tr>
                      ))}
                      {unbilledExpenses.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-3 py-8 text-center text-[#64748B]">
                            No uninvoiced billable expenses.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      {activeTab === 'Configure' && (
        <div className="harvest-card max-w-lg space-y-3 p-5 text-[13px]">
          <h3 className="text-[14px] font-bold">Invoice defaults</h3>
          <p className="text-[#475569]">
            Due date: +30 days · Rates from Team profiles · Tax: set per invoice
          </p>
        </div>
      )}

      {/* Manual invoice */}
      <Drawer isOpen={isNewOpen} onClose={() => setIsNewOpen(false)} title="Manual invoice">
        <form onSubmit={handleCreateManual} className="space-y-4">
          <Select
            label="Client"
            value={formClientId}
            onChange={(e) => setFormClientId(e.target.value)}
            options={clients.map((c) => ({ value: c.id, label: c.companyName }))}
          />
          <Input
            label="Description"
            value={formDesc}
            onChange={(e) => setFormDesc(e.target.value)}
          />
          <Input
            label="Amount"
            value={formAmount}
            onChange={(e) => setFormAmount(e.target.value)}
          />
          <div className="flex justify-end gap-2 border-t border-[#E2E8F0] pt-4">
            <Button type="button" variant="ghost" onClick={() => setIsNewOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Create draft
            </Button>
          </div>
        </form>
      </Drawer>

      {/* From time + cost panel */}
      <Drawer
        isOpen={isFromTimeOpen}
        onClose={() => setIsFromTimeOpen(false)}
        title="Invoice from time"
        description="Billable hours × billable rate → client lines. Labor cost uses cost rate (admin)."
        width="xl"
      >
        <div className="space-y-4">
          <Select
            label="Client"
            value={ftClientId}
            onChange={(e) => {
              setFtClientId(e.target.value);
              setFtProjectId('');
              setFtPreview(null);
            }}
            options={clients.map((c) => ({ value: c.id, label: c.companyName }))}
          />
          <Select
            label="Project"
            value={ftProjectId}
            onChange={(e) => {
              setFtProjectId(e.target.value);
              setFtPreview(null);
            }}
            options={[
              { value: '', label: 'All projects for client' },
              ...clientProjects.map((p) => ({ value: p.id, label: p.name })),
            ]}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="From"
              type="date"
              value={ftStart}
              onChange={(e) => setFtStart(e.target.value)}
            />
            <Input
              label="To"
              type="date"
              value={ftEnd}
              onChange={(e) => setFtEnd(e.target.value)}
            />
          </div>
          <Select
            label="Group line items by"
            value={ftGroupBy}
            onChange={(e) => setFtGroupBy(e.target.value as typeof ftGroupBy)}
            options={[
              { value: 'person_task', label: 'Person + task' },
              { value: 'person', label: 'Person' },
              { value: 'task', label: 'Task' },
            ]}
          />
          <Button
            type="button"
            variant="primary"
            isLoading={ftLoading}
            onClick={runTimePreview}
            className="w-full"
          >
            Preview draft & cost
          </Button>

          {ftPreview && (
            <div className="grid gap-4 border-t border-[#E2E8F0] pt-4 lg:grid-cols-2">
              <div className="space-y-3">
                <div className="text-[13px] font-bold text-[#0C2A43]">Client invoice lines</div>
                {ftPreview.draft.items && ftPreview.draft.items.length > 0 ? (
                  <ul className="space-y-2 text-[12px]">
                    {ftPreview.draft.items.map((item) => (
                      <li
                        key={item.id}
                        className="flex justify-between gap-2 rounded border border-[#E2E8F0] bg-white px-2.5 py-2"
                      >
                        <span className="min-w-0">
                          <span className="block font-semibold text-[#0C2A43]">
                            {item.description}
                          </span>
                          <span className="text-[#475569]">
                            {item.hoursOrQty}h × {formatCurrency(item.unitPrice, ftPreview.cost.currency)}
                          </span>
                        </span>
                        <span className="shrink-0 font-bold tabular-nums">
                          {formatCurrency(item.amount, ftPreview.cost.currency)}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[12px] text-[#475569]">
                    No billable lines. Set billable rates on Team and ensure hours are marked
                    billable.
                  </p>
                )}
                <div className="flex justify-between text-[13px] font-bold">
                  <span>Subtotal</span>
                  <span>
                    {formatCurrency(
                      ftPreview.draft.subtotal || 0,
                      ftPreview.cost.currency
                    )}
                  </span>
                </div>
              </div>
              <CostPanel cost={ftPreview.cost} />
            </div>
          )}

          <div className="flex justify-end gap-2 border-t border-[#E2E8F0] pt-4">
            <Button type="button" variant="ghost" onClick={() => setIsFromTimeOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              isLoading={ftSaving}
              disabled={!ftPreview?.draft.items?.length}
              onClick={saveTimeDraft}
            >
              Save as draft invoice
            </Button>
          </div>
        </div>
      </Drawer>

      <Modal
        isOpen={!!preview}
        onClose={() => setPreview(null)}
        title={`Invoice ${preview?.invoiceNumber}`}
      >
        {preview && (
          <div className="space-y-4">
            <div className="flex justify-between text-[14px] font-bold">
              <span>{preview.clientName}</span>
              <span className="text-[#3B82F6]">
                {formatCurrency(preview.totalAmount, preview.currency)}
              </span>
            </div>
            {preview.projectName && (
              <p className="text-[12px] text-[#475569]">Project: {preview.projectName}</p>
            )}
            <ul className="space-y-1 text-[12px]">
              {preview.items.map((item) => (
                <li key={item.id} className="flex justify-between border-b border-[#F1F5F9] py-1">
                  <span>
                    {item.description} ({item.hoursOrQty})
                  </span>
                  <span className="tabular-nums">
                    {formatCurrency(item.amount, preview.currency)}
                  </span>
                </li>
              ))}
            </ul>
            <Badge variant="draft">{preview.status}</Badge>
            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="outline" onClick={() => updateStatus(preview, 'SENT')}>
                Mark Sent
              </Button>
              <Button variant="primary" onClick={() => updateStatus(preview, 'PAID')}>
                Mark Paid
              </Button>
              <Button
                variant="secondary"
                leftIcon={<Printer className="h-4 w-4" />}
                onClick={() => window.print()}
              >
                Print
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
