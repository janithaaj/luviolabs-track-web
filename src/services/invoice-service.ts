import { apiCall } from './api-client';
import {
  Invoice,
  InvoiceItem,
  InvoiceStatus,
  Estimate,
  InvoiceCostSummary,
  TimeEntry,
  User,
  Project,
  Expense,
} from '../types';
import { DEFAULT_CURRENCY } from '../lib/constants';
import { resolveBillingCurrency } from '../lib/utils';
import { timesheetService } from './timesheet-service';
import { teamService } from './team-service';
import { projectService } from './project-service';
import { clientService } from './client-service';
import { expenseService } from './expense-service';

function mapInvoice(inv: Record<string, unknown>): Invoice {
  return {
    id: String(inv.id || inv._id || ''),
    invoiceNumber: String(inv.invoiceNumber || ''),
    clientId: String(inv.clientId || ''),
    clientName: String(inv.clientName || 'Client'),
    projectId: inv.projectId ? String(inv.projectId) : undefined,
    projectName: inv.projectName ? String(inv.projectName) : undefined,
    poNumber: inv.poNumber ? String(inv.poNumber) : undefined,
    issueDate: String(inv.issueDate || '').slice(0, 10),
    dueDate: String(inv.dueDate || '').slice(0, 10),
    status: (inv.status as InvoiceStatus) || 'DRAFT',
    items: ((inv.items as any[]) || []).map((item: any, i: number) => ({
      id: String(item.id || `item-${i}`),
      description: String(item.description || ''),
      hoursOrQty: Number(item.hoursOrQty ?? item.quantity ?? 0),
      unitPrice: Number(item.unitPrice ?? 0),
      amount: Number(item.amount ?? 0),
      taskId: item.taskId ? String(item.taskId) : undefined,
    })),
    subtotal: Number(inv.subtotal ?? 0),
    taxPercent: Number(inv.taxPercent ?? 0),
    taxAmount: Number(inv.taxAmount ?? inv.tax ?? 0),
    discountAmount: Number(inv.discountAmount ?? inv.discount ?? 0),
    totalAmount: Number(inv.totalAmount ?? inv.total ?? 0),
    notes: inv.notes ? String(inv.notes) : undefined,
    currency: resolveBillingCurrency(inv.currency as string, DEFAULT_CURRENCY),
  };
}

function toApiPayload(invoiceData: Partial<Invoice>) {
  return {
    clientId: invoiceData.clientId,
    clientName: invoiceData.clientName,
    projectId: invoiceData.projectId,
    projectName: invoiceData.projectName,
    issueDate: invoiceData.issueDate,
    dueDate: invoiceData.dueDate,
    currency: resolveBillingCurrency(invoiceData.currency, DEFAULT_CURRENCY),
    poNumber: invoiceData.poNumber,
    items: (invoiceData.items || []).map((i) => ({
      description: i.description,
      quantity: i.hoursOrQty,
      unitPrice: i.unitPrice,
      amount: i.amount,
    })),
    taxPercent: invoiceData.taxPercent || 0,
    discountAmount: invoiceData.discountAmount || 0,
    notes: invoiceData.notes,
    status: invoiceData.status,
  };
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function hoursOf(minutes: number) {
  return round2(minutes / 60);
}

export interface InvoiceDraftFromTime {
  draft: Partial<Invoice>;
  cost: InvoiceCostSummary;
  entryCount: number;
  entries: TimeEntry[];
}

/**
 * Build invoice line items (client) + labor/expense cost summary (internal) from time.
 * Groups billable hours by person × task for readable lines.
 */
export function buildInvoiceDraftFromEntries(params: {
  entries: TimeEntry[];
  users: User[];
  expenses?: Expense[];
  includeBillableExpenses?: boolean;
  clientId: string;
  clientName: string;
  projectId?: string;
  projectName?: string;
  currency: string;
  startDate: string;
  endDate: string;
  groupBy: 'person' | 'task' | 'person_task';
}): InvoiceDraftFromTime {
  const {
    entries,
    users,
    expenses = [],
    includeBillableExpenses = true,
    clientId,
    clientName,
    projectId,
    projectName,
    currency,
    startDate,
    endDate,
    groupBy,
  } = params;

  const userMap = new Map(users.map((u) => [u.id, u]));

  type LineKey = string;
  const lines = new Map<
    LineKey,
    { description: string; minutes: number; unitPrice: number; taskId?: string }
  >();

  const byPerson = new Map<
    string,
    {
      userId: string;
      userName: string;
      minutes: number;
      billableMinutes: number;
      costRate: number;
      billableRate: number;
    }
  >();

  let totalMinutes = 0;
  let billableMinutes = 0;

  for (const e of entries) {
    const user = userMap.get(e.userId);
    const billableRate = user?.billableRate ?? 0;
    const costRate = user?.costRate ?? 0;
    totalMinutes += e.durationMinutes;
    if (e.isBillable) billableMinutes += e.durationMinutes;

    const p = byPerson.get(e.userId) || {
      userId: e.userId,
      userName: e.userName || user?.name || 'Person',
      minutes: 0,
      billableMinutes: 0,
      costRate,
      billableRate,
    };
    p.minutes += e.durationMinutes;
    if (e.isBillable) p.billableMinutes += e.durationMinutes;
    p.costRate = costRate;
    p.billableRate = billableRate;
    byPerson.set(e.userId, p);

    if (!e.isBillable) continue;

    let key: string;
    let description: string;
    if (groupBy === 'person') {
      key = `person:${e.userId}`;
      description = `${e.userName} — professional services (${startDate} → ${endDate})`;
    } else if (groupBy === 'task') {
      key = `task:${e.taskId || e.taskName}`;
      description = `${e.taskName}${projectName ? ` · ${projectName}` : ''}`;
    } else {
      key = `pt:${e.userId}:${e.taskId || e.taskName}`;
      description = `${e.userName} · ${e.taskName}`;
    }

    const existing = lines.get(key);
    if (existing) {
      existing.minutes += e.durationMinutes;
    } else {
      lines.set(key, {
        description,
        minutes: e.durationMinutes,
        unitPrice: billableRate,
        taskId: e.taskId,
      });
    }
  }

  const items: InvoiceItem[] = Array.from(lines.values()).map((line, i) => {
    const qty = hoursOf(line.minutes);
    const amount = round2(qty * line.unitPrice);
    return {
      id: `item-${i}-${Date.now()}`,
      description: line.description,
      hoursOrQty: qty,
      unitPrice: line.unitPrice,
      amount,
      taskId: line.taskId,
    };
  });

  const timeSubtotal = round2(items.reduce((a, i) => a + i.amount, 0));

  const expenseTotal = round2(expenses.reduce((a, x) => a + x.amount, 0));
  const billableExpenseList = expenses.filter((x) => x.billable);
  const billableExpenses = round2(billableExpenseList.reduce((a, x) => a + x.amount, 0));

  if (includeBillableExpenses) {
    for (const exp of billableExpenseList) {
      items.push({
        id: `exp-${exp.id}`,
        description: `Expense: ${exp.name}${exp.date ? ` (${exp.date})` : ''}`,
        hoursOrQty: 1,
        unitPrice: exp.amount,
        amount: exp.amount,
      });
    }
  }

  const subtotal = round2(items.reduce((a, i) => a + i.amount, 0));

  const personRows = Array.from(byPerson.values()).map((p) => {
    const hours = hoursOf(p.minutes);
    const billableH = hoursOf(p.billableMinutes);
    const laborCost = round2(hours * p.costRate);
    const clientAmount = round2(billableH * p.billableRate);
    return {
      userId: p.userId,
      userName: p.userName,
      hours,
      billableHours: billableH,
      costRate: p.costRate,
      billableRate: p.billableRate,
      laborCost,
      clientAmount,
    };
  });

  const laborCost = round2(personRows.reduce((a, r) => a + r.laborCost, 0));
  const deliveryCost = round2(laborCost + expenseTotal);
  const clientBillable = subtotal;
  const margin = round2(clientBillable - deliveryCost);
  const marginPercent =
    clientBillable > 0 ? Math.round((margin / clientBillable) * 100) : 0;

  const due = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

  return {
    entryCount: entries.length,
    entries,
    draft: {
      clientId,
      clientName,
      projectId,
      projectName,
      currency,
      issueDate: endDate || new Date().toISOString().slice(0, 10),
      dueDate: due,
      status: 'DRAFT',
      items,
      subtotal,
      taxPercent: 0,
      taxAmount: 0,
      discountAmount: 0,
      totalAmount: subtotal,
      notes: `Time${includeBillableExpenses && billableExpenses > 0 ? ' & expenses' : ''} for ${startDate} – ${endDate}`,
    },
    cost: {
      billableHours: hoursOf(billableMinutes),
      totalHours: hoursOf(totalMinutes),
      laborCost,
      expenses: expenseTotal,
      billableExpenses,
      deliveryCost,
      clientBillable,
      margin,
      marginPercent,
      currency,
      byPerson: personRows,
      expenseLines: expenses.map((x) => ({
        id: x.id,
        name: x.name,
        amount: x.amount,
        billable: x.billable,
        date: x.date,
      })),
    },
  };
}

export const invoiceService = {
  async getInvoices(): Promise<Invoice[]> {
    const res = await apiCall<Record<string, unknown>[]>('/invoices');
    if (res.data && Array.isArray(res.data)) {
      return res.data.map(mapInvoice);
    }
    console.warn('getInvoices failed:', res.error);
    return [];
  },

  async getInvoiceById(id: string): Promise<Invoice | null> {
    const res = await apiCall<Record<string, unknown>>(`/invoices/${id}`);
    if (res.data) return mapInvoice(res.data);
    return null;
  },

  async updateStatus(id: string, status: InvoiceStatus): Promise<Invoice> {
    const res = await apiCall<Record<string, unknown>>(`/invoices/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
    if (res.error || !res.data) throw new Error(res.error || 'Failed to update status');
    return mapInvoice(res.data);
  },

  async saveInvoice(invoiceData: Partial<Invoice>): Promise<Invoice> {
    if (invoiceData.id) {
      const res = await apiCall<Record<string, unknown>>(`/invoices/${invoiceData.id}`, {
        method: 'PUT',
        body: JSON.stringify(toApiPayload(invoiceData)),
      });
      if (res.error || !res.data) {
        throw new Error(res.error || 'Failed to update invoice');
      }
      return mapInvoice(res.data);
    }

    const res = await apiCall<Record<string, unknown>>('/invoices', {
      method: 'POST',
      body: JSON.stringify(toApiPayload(invoiceData)),
    });
    if (res.error || !res.data) {
      throw new Error(res.error || 'Failed to create invoice');
    }
    return mapInvoice(res.data);
  },

  /**
   * Draft invoice lines from billable time + internal labor cost panel data.
   * Does not save until caller calls saveInvoice(draft).
   */
  async previewInvoiceFromBillableTime(options: {
    clientId: string;
    projectId?: string;
    startDate: string;
    endDate: string;
    approvedOnly?: boolean;
    groupBy?: 'person' | 'task' | 'person_task';
    includeBillableExpenses?: boolean;
  }): Promise<InvoiceDraftFromTime> {
    const {
      clientId,
      projectId,
      startDate,
      endDate,
      approvedOnly = false,
      groupBy = 'person_task',
      includeBillableExpenses = true,
    } = options;

    const [allEntries, users, projects, client, expenses] = await Promise.all([
      timesheetService.getAllEntries({
        from: startDate,
        to: endDate,
        projectId,
        uninvoiced: true,
      }),
      teamService.getUsers(),
      projectService.getProjects(),
      clientService.getClientById(clientId).catch(() => null),
      expenseService.getExpenses({
        clientId,
        projectId,
        from: startDate,
        to: endDate,
        uninvoiced: true,
      }),
    ]);

    const clientProjects = projects.filter((p) => p.clientId === clientId);
    const projectIds = projectId
      ? [projectId]
      : clientProjects.map((p) => p.id);

    const projectMap = new Map(projects.map((p) => [p.id, p] as [string, Project]));

    const filtered = allEntries.filter((e) => {
      if (e.date < startDate || e.date > endDate) return false;
      if (!projectIds.includes(e.projectId)) return false;
      if (e.invoiceId) return false;
      if (approvedOnly && e.status !== 'APPROVED') return false;
      return true;
    });

    const projectExpenses = expenses.filter(
      (x) => projectIds.includes(x.projectId) && !x.invoiceId
    );

    const proj = projectId ? projectMap.get(projectId) : undefined;
    const singleProject =
      projectId || (clientProjects.length === 1 ? clientProjects[0]?.id : undefined);
    const singleProj = singleProject ? projectMap.get(singleProject) : undefined;

    const draftBuilt = buildInvoiceDraftFromEntries({
      entries: filtered,
      users,
      expenses: projectExpenses,
      includeBillableExpenses,
      clientId,
      clientName: client?.companyName || singleProj?.clientName || 'Client',
      projectId: singleProj?.id || projectId,
      projectName: singleProj?.name || proj?.name,
      currency: resolveBillingCurrency(
        singleProj?.currency,
        proj?.currency,
        client?.currency,
        clientProjects[0]?.currency,
        DEFAULT_CURRENCY
      ),
      startDate,
      endDate,
      groupBy,
    });

    // Fixed fee: client bill is the project price (not hourly rollup). Cost stays labor + expenses.
    if (
      singleProj?.type === 'FIXED_FEE' &&
      (singleProj.budget?.totalAmount ?? 0) > 0
    ) {
      const fee = singleProj.budget.totalAmount || 0;
      const feeItem = {
        id: `fee-${Date.now()}`,
        description: `${singleProj.name} — fixed fee (${startDate} → ${endDate})`,
        hoursOrQty: 1,
        unitPrice: fee,
        amount: fee,
      };
      const expenseItems = (draftBuilt.draft.items || []).filter((i) =>
        String(i.id).startsWith('exp-')
      );
      draftBuilt.draft.items = [feeItem, ...expenseItems];
      const subtotal = round2(
        (draftBuilt.draft.items || []).reduce((a, i) => a + i.amount, 0)
      );
      draftBuilt.draft.subtotal = subtotal;
      draftBuilt.draft.totalAmount = subtotal;
      draftBuilt.draft.notes = `Fixed fee + expenses for ${startDate} – ${endDate}`;
      draftBuilt.cost.clientBillable = subtotal;
      draftBuilt.cost.margin = round2(subtotal - draftBuilt.cost.deliveryCost);
      draftBuilt.cost.marginPercent =
        subtotal > 0 ? Math.round((draftBuilt.cost.margin / subtotal) * 100) : 0;
    }

    return draftBuilt;
  },

  async generateInvoiceFromBillableTime(
    clientId: string,
    projectId?: string,
    startDate?: string,
    endDate?: string
  ): Promise<Invoice> {
    const end = endDate || new Date().toISOString().slice(0, 10);
    const start =
      startDate ||
      new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);

    const preview = await this.previewInvoiceFromBillableTime({
      clientId,
      projectId,
      startDate: start,
      endDate: end,
      approvedOnly: false,
      groupBy: 'person_task',
    });

    if (!preview.draft.items?.length) {
      throw new Error(
        'No billable time or billable expenses found for this range. Set rates, log hours, or add expenses first.'
      );
    }

    const saved = await this.saveInvoice(preview.draft);

    const billableExpIds = preview.cost.expenseLines
      .filter((x) => x.billable)
      .map((x) => x.id);
    await Promise.all([
      ...billableExpIds.map((id) =>
        expenseService.updateExpense(id, { invoiceId: saved.id }).catch(() => null)
      ),
      timesheetService.markEntriesInvoiced(
        preview.entries.map((e) => e.id),
        saved.id
      ),
    ]);

    return saved;
  },

  async getEstimates(): Promise<Estimate[]> {
    return [];
  },

  async saveEstimate(_estimateData: Partial<Estimate>): Promise<Estimate> {
    throw new Error('Estimates are not available yet. Contact support when the API ships.');
  },
};
