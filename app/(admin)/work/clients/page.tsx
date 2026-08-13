'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Search, Mail, Phone } from 'lucide-react';
import { clientService } from '../../../../src/services/client-service';
import { Client } from '../../../../src/types';
import { Button } from '../../../../src/components/ui/button';
import { Input } from '../../../../src/components/ui/input';
import { Drawer } from '../../../../src/components/ui/drawer';
import { ActionMenu } from '../../../../src/components/ui/action-menu';
import { GettingStartedPayrollBar } from '../../../../src/components/common/GettingStartedPayrollBar';
import { formatCurrency } from '../../../../src/lib/utils';

export default function AdminClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formCompany, setFormCompany] = useState('');
  const [formContact, setFormContact] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadClients = async () => {
    setClients(await clientService.getClients());
  };

  useEffect(() => {
    loadClients();
  }, []);

  const resetForm = () => {
    setEditingClient(null);
    setFormCompany('');
    setFormContact('');
    setFormEmail('');
    setFormPhone('');
    setFormAddress('');
    setError('');
  };

  const openCreate = () => {
    resetForm();
    setIsDrawerOpen(true);
  };

  const openEdit = (c: Client) => {
    setEditingClient(c);
    setFormCompany(c.companyName);
    setFormContact(c.contactPerson || '');
    setFormEmail(c.email || '');
    setFormPhone(c.phone || '');
    setFormAddress(c.address || '');
    setError('');
    setIsDrawerOpen(true);
  };

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsSaving(true);
    try {
      await clientService.saveClient({
        id: editingClient?.id,
        companyName: formCompany,
        contactPerson: formContact,
        email: formEmail,
        phone: formPhone,
        address: formAddress,
        currency: editingClient?.currency || 'LKR',
      });
      setIsDrawerOpen(false);
      resetForm();
      setMessage(editingClient ? 'Client updated.' : 'Client created.');
      await loadClients();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save client');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (c: Client) => {
    if (!window.confirm(`Delete client “${c.companyName}”? This cannot be undone.`)) return;
    setDeletingId(c.id);
    setMessage('');
    setError('');
    try {
      await clientService.deleteClient(c.id);
      setMessage(`Deleted ${c.companyName}.`);
      await loadClients();
    } catch (err) {
      setMessage('');
      setError(err instanceof Error ? err.message : 'Failed to delete client');
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = clients.filter(
    (c) =>
      c.companyName.toLowerCase().includes(search.toLowerCase()) ||
      c.contactPerson.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-[28px] font-bold tracking-tight text-[#0C2A43]">Clients</h1>
        <Button
          variant="primary"
          onClick={openCreate}
          leftIcon={<Plus className="h-3.5 w-3.5" />}
        >
          New client
        </Button>
      </div>

      <GettingStartedPayrollBar />

      {message ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-[13px] text-emerald-800">
          {message}
        </div>
      ) : null}
      {error && !isDrawerOpen ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
          {error}
        </div>
      ) : null}

      <div className="w-full sm:w-72">
        <Input
          placeholder="Filter by client name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search className="h-4 w-4" />}
        />
      </div>

      <div className="harvest-card harvest-table-wrap p-0">
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="border-b border-[#E2E8F0] text-[12px] font-semibold text-[#475569]">
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Projects</th>
              <th className="px-4 py-3 text-right">Outstanding</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1F5F9]">
            {filtered.map((c) => (
              <tr key={c.id} className="hover:bg-[#F8FAFC]">
                <td className="px-4 py-3">
                  <div className="font-bold text-[#0C2A43]">{c.companyName}</div>
                  <div className="mt-0.5 flex items-center gap-1 text-[12px] text-[#475569]">
                    <Mail className="h-3 w-3" />
                    {c.email || '—'}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-[#0C2A43]">{c.contactPerson || '—'}</div>
                  <div className="mt-0.5 flex items-center gap-1 text-[12px] text-[#475569]">
                    <Phone className="h-3 w-3" />
                    {c.phone || '—'}
                  </div>
                </td>
                <td className="px-4 py-3 tabular-nums text-[#475569]">{c.activeProjectsCount}</td>
                <td className="px-4 py-3 text-right font-semibold tabular-nums text-[#0C2A43]">
                  {formatCurrency(c.outstandingBalance, c.currency)}
                </td>
                <td className="px-4 py-3 text-right">
                  <ActionMenu
                    items={[
                      { label: 'Edit', onClick: () => openEdit(c) },
                      {
                        label: deletingId === c.id ? 'Deleting…' : 'Delete',
                        danger: true,
                        disabled: deletingId === c.id,
                        onClick: () => handleDelete(c),
                      },
                    ]}
                  />
                </td>
              </tr>
            ))}
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-[13px] text-[#475569]">
                  No clients yet. Create one to get started.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          resetForm();
        }}
        title={editingClient ? 'Edit client' : 'New client'}
        description={
          editingClient ? 'Update client details' : 'Add a client to your account'
        }
      >
        <form onSubmit={handleSaveClient} className="space-y-4">
          <Input
            label="Company name"
            value={formCompany}
            onChange={(e) => setFormCompany(e.target.value)}
            required
          />
          <Input
            label="Contact person"
            value={formContact}
            onChange={(e) => setFormContact(e.target.value)}
          />
          <Input
            label="Email"
            type="email"
            value={formEmail}
            onChange={(e) => setFormEmail(e.target.value)}
          />
          <Input label="Phone" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} />
          <Input
            label="Address"
            value={formAddress}
            onChange={(e) => setFormAddress(e.target.value)}
          />
          {error ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
              {error}
            </div>
          ) : null}
          <div className="flex justify-end gap-2 border-t border-[#E2E8F0] pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setIsDrawerOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSaving}>
              {editingClient ? 'Save changes' : 'Save client'}
            </Button>
          </div>
        </form>
      </Drawer>
    </div>
  );
}
