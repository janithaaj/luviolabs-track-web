import { apiCall } from './api-client';
import { Client } from '../types';
import { DEFAULT_CURRENCY } from '../lib/constants';
import { resolveBillingCurrency } from '../lib/utils';

function mapClient(c: Record<string, unknown>): Client {
  return {
    id: String(c.id || c._id || ''),
    companyName: String(c.companyName || ''),
    contactPerson: String(c.contactPerson || c.contactName || ''),
    email: String(c.email || ''),
    phone: String(c.phone || ''),
    address: String(c.address || c.billingAddress || ''),
    currency: resolveBillingCurrency(c.currency as string, DEFAULT_CURRENCY),
    taxDetails: (c.taxDetails || c.taxNumber) as string | undefined,
    paymentTerms:
      typeof c.paymentTerms === 'number'
        ? `Net ${c.paymentTerms}`
        : String(c.paymentTerms || 'Net 30'),
    notes: c.notes as string | undefined,
    activeProjectsCount: Number(c.activeProjectsCount ?? 0),
    outstandingBalance: Number(c.outstandingBalance ?? 0),
    totalBilled: Number(c.totalBilled ?? 0),
  };
}

function compactPayload(data: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    if (v === undefined || v === null) continue;
    if (typeof v === 'string' && v.trim() === '') continue;
    out[k] = typeof v === 'string' ? v.trim() : v;
  }
  return out;
}

export const clientService = {
  async getClients(): Promise<Client[]> {
    const res = await apiCall<Record<string, unknown>[]>('/clients');
    if (res.data && Array.isArray(res.data)) {
      return res.data.map(mapClient);
    }
    console.warn('getClients API failed:', res.error);
    return [];
  },

  async getClientById(id: string): Promise<Client | null> {
    const res = await apiCall<Record<string, unknown>>(`/clients/${id}`);
    if (res.data) return mapClient(res.data);
    return null;
  },

  async saveClient(clientData: Partial<Client>): Promise<Client> {
    if (!clientData.companyName?.trim()) {
      throw new Error('Company name is required');
    }

    const body = compactPayload({
      companyName: clientData.companyName,
      contactName: clientData.contactPerson,
      email: clientData.email,
      phone: clientData.phone,
      billingAddress: clientData.address,
      currency: resolveBillingCurrency(clientData.currency, DEFAULT_CURRENCY),
      taxNumber: clientData.taxDetails,
      notes: clientData.notes,
    });

    const path = clientData.id ? `/clients/${clientData.id}` : '/clients';
    const method = clientData.id ? 'PUT' : 'POST';
    const res = await apiCall<Record<string, unknown>>(path, {
      method,
      body: JSON.stringify(body),
    });

    if (res.error || !res.data) {
      const msg = res.error || 'Failed to save client';
      if (/failed to fetch|network|connection/i.test(msg)) {
        throw new Error(
          'Cannot reach the API. Is it running on http://localhost:4000?'
        );
      }
      throw new Error(msg);
    }
    return mapClient(res.data);
  },

  async deleteClient(id: string): Promise<void> {
    const res = await apiCall(`/clients/${id}`, { method: 'DELETE' });
    if (res.error && res.status !== 204) {
      throw new Error(res.error || 'Failed to delete client');
    }
  },
};
