'use client';

import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { invoiceService } from '../../../../src/services/invoice-service';
import { clientService } from '../../../../src/services/client-service';
import { Estimate, Client } from '../../../../src/types';
import { Button } from '../../../../src/components/ui/button';
import { Badge } from '../../../../src/components/ui/badge';
import { Drawer } from '../../../../src/components/ui/drawer';
import { Input } from '../../../../src/components/ui/input';
import { Select } from '../../../../src/components/ui/select';
import { ActionMenu } from '../../../../src/components/ui/action-menu';
import { GettingStartedPayrollBar } from '../../../../src/components/common/GettingStartedPayrollBar';
import { formatCurrency } from '../../../../src/lib/utils';

export default function AdminEstimatesPage() {
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [clientId, setClientId] = useState('');
  const [amount, setAmount] = useState('500');
  const [message, setMessage] = useState('');

  const load = async () => {
    const [e, c] = await Promise.all([
      invoiceService.getEstimates(),
      clientService.getClients()
    ]);
    setEstimates(e);
    setClients(c);
    if (c[0] && !clientId) setClientId(c[0].id);
  };

  useEffect(() => {
    load();
  }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    const client = clients.find((c) => c.id === clientId);
    const total = parseFloat(amount) || 0;
    await invoiceService.saveEstimate({
      clientId,
      clientName: client?.companyName || 'Client',
      totalAmount: total,
      currency: client?.currency || 'LKR',
      items: [
        {
          id: `ei-${Date.now()}`,
          description: 'Estimated services',
          hoursOrQty: 1,
          unitPrice: total,
          amount: total
        }
      ]
    });
    setIsOpen(false);
    setMessage('Estimate created.');
    load();
  };

  const setStatus = async (est: Estimate, status: Estimate['status']) => {
    await invoiceService.saveEstimate({ ...est, status });
    load();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-[28px] font-bold tracking-tight text-[#0C2A43]">Estimates</h1>
        <Button variant="primary" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setIsOpen(true)}>
          New estimate
        </Button>
      </div>
      <GettingStartedPayrollBar />
      {message && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-[13px] text-emerald-800">
          {message}
        </div>
      )}

      <div className="harvest-card overflow-hidden p-0">
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="border-b border-[#E2E8F0] text-[12px] font-semibold text-[#475569]">
              <th className="px-4 py-3">Estimate</th>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1F5F9]">
            {estimates.map((est) => (
              <tr key={est.id} className="hover:bg-[#F8FAFC]">
                <td className="px-4 py-3 font-semibold">{est.estimateNumber}</td>
                <td className="px-4 py-3">{est.clientName}</td>
                <td className="px-4 py-3">
                  <Badge variant={est.status === 'ACCEPTED' ? 'approved' : 'draft'}>
                    {est.status}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right font-bold">
                  {formatCurrency(est.totalAmount, est.currency)}
                </td>
                <td className="px-4 py-3 text-right">
                  <ActionMenu
                    items={[
                      { label: 'Mark Sent', onClick: () => setStatus(est, 'SENT') },
                      { label: 'Mark Accepted', onClick: () => setStatus(est, 'ACCEPTED') },
                      {
                        label: 'Reject',
                        danger: true,
                        onClick: () => setStatus(est, 'REJECTED')
                      }
                    ]}
                  />
                </td>
              </tr>
            ))}
            {estimates.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-[#475569]">
                  No estimates yet. Click New estimate to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Drawer isOpen={isOpen} onClose={() => setIsOpen(false)} title="New estimate">
        <form onSubmit={create} className="space-y-4">
          <Select
            label="Client"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            options={clients.map((c) => ({ value: c.id, label: c.companyName }))}
          />
          <Input label="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <div className="flex justify-end gap-2 border-t border-[#E2E8F0] pt-4">
            <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save estimate
            </Button>
          </div>
        </form>
      </Drawer>
    </div>
  );
}
