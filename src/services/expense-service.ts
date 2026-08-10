import { apiCall } from './api-client';
import { CreateExpenseInput, Expense } from '../types';
import { DEFAULT_CURRENCY } from '../lib/constants';
import { resolveBillingCurrency } from '../lib/utils';

function mapExpense(e: Record<string, unknown>): Expense {
  return {
    id: String(e.id || e._id || ''),
    name: String(e.name || ''),
    projectId: String(e.projectId || ''),
    projectName: String(e.projectName || ''),
    clientId: e.clientId ? String(e.clientId) : undefined,
    clientName: e.clientName ? String(e.clientName) : undefined,
    amount: Number(e.amount ?? 0),
    currency: resolveBillingCurrency(e.currency as string, DEFAULT_CURRENCY),
    billable: Boolean(e.billable ?? true),
    date: String(e.date || '').slice(0, 10),
    category: String(e.category || 'General'),
    notes: e.notes ? String(e.notes) : undefined,
    invoiceId: e.invoiceId ? String(e.invoiceId) : undefined,
    createdAt: e.createdAt ? String(e.createdAt) : undefined,
  };
}

export const expenseService = {
  async getExpenses(filters?: {
    projectId?: string;
    clientId?: string;
    from?: string;
    to?: string;
    billable?: boolean;
    uninvoiced?: boolean;
  }): Promise<Expense[]> {
    const params = new URLSearchParams();
    if (filters?.projectId) params.set('projectId', filters.projectId);
    if (filters?.clientId) params.set('clientId', filters.clientId);
    if (filters?.from) params.set('from', filters.from);
    if (filters?.to) params.set('to', filters.to);
    if (filters?.billable !== undefined) params.set('billable', String(filters.billable));
    if (filters?.uninvoiced) params.set('uninvoiced', 'true');
    const q = params.toString();
    const res = await apiCall<Record<string, unknown>[]>(`/expenses${q ? `?${q}` : ''}`);
    if (res.data && Array.isArray(res.data)) {
      return res.data.map(mapExpense);
    }
    console.warn('getExpenses failed:', res.error);
    return [];
  },

  async createExpense(input: CreateExpenseInput): Promise<Expense> {
    const res = await apiCall<Record<string, unknown>>('/expenses', {
      method: 'POST',
      body: JSON.stringify({
        name: input.name,
        projectId: input.projectId,
        amount: input.amount,
        currency: resolveBillingCurrency(input.currency, DEFAULT_CURRENCY),
        billable: input.billable ?? true,
        date: input.date,
        category: input.category || 'General',
        notes: input.notes,
      }),
    });
    if (res.error || !res.data) {
      throw new Error(res.error || 'Failed to create expense');
    }
    return mapExpense(res.data);
  },

  async updateExpense(id: string, patch: Partial<CreateExpenseInput> & { billable?: boolean; invoiceId?: string | null }): Promise<Expense> {
    const res = await apiCall<Record<string, unknown>>(`/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(patch),
    });
    if (res.error || !res.data) {
      throw new Error(res.error || 'Failed to update expense');
    }
    return mapExpense(res.data);
  },

  async deleteExpense(id: string): Promise<void> {
    const res = await apiCall(`/expenses/${id}`, { method: 'DELETE' });
    if (res.error && res.status !== 204) {
      throw new Error(res.error || 'Failed to delete expense');
    }
  },
};
