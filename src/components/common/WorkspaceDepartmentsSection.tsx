'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Building2, Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Drawer } from '../ui/drawer';
import {
  departmentService,
  Department,
} from '../../services/department-service';
import { teamService } from '../../services/team-service';

export const WorkspaceDepartmentsSection: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [headcount, setHeadcount] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [depts, users] = await Promise.all([
        departmentService.getDepartments(),
        teamService.getEmployees().catch(() => []),
      ]);
      setDepartments(depts);
      const counts: Record<string, number> = {};
      for (const u of users) {
        const key = (u.department || '').trim();
        if (!key) continue;
        counts[key] = (counts[key] || 0) + 1;
      }
      setHeadcount(counts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load departments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openNew = () => {
    setEditingId(null);
    setFormName('');
    setFormDescription('');
    setIsDrawerOpen(true);
  };

  const openEdit = (d: Department) => {
    setEditingId(d.id);
    setFormName(d.name);
    setFormDescription(d.description || '');
    setIsDrawerOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setError('Department name is required');
      return;
    }
    setSaving(true);
    setError('');
    setMessage('');
    try {
      if (editingId) {
        await departmentService.updateDepartment({
          id: editingId,
          name: formName,
          description: formDescription,
        });
        setMessage('Department updated.');
      } else {
        await departmentService.createDepartment({
          name: formName,
          description: formDescription,
        });
        setMessage('Department created.');
      }
      setIsDrawerOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save department');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (d: Department) => {
    const count = headcount[d.name] || 0;
    const ok = window.confirm(
      count > 0
        ? `Delete “${d.name}”? ${count} team member(s) still use this department name.`
        : `Delete department “${d.name}”?`
    );
    if (!ok) return;
    setError('');
    setMessage('');
    try {
      await departmentService.deleteDepartment(d.id);
      setMessage('Department deleted.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete department');
    }
  };

  return (
    <section id="departments" className="harvest-card max-w-3xl space-y-4 p-5 scroll-mt-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[16px] font-bold text-[#0C2A43]">Departments</h2>
          <p className="mt-0.5 text-[13px] text-[#475569]">
            Define departments for team invites and member profiles.
          </p>
        </div>
        <Button
          type="button"
          variant="primary"
          size="sm"
          leftIcon={<Plus className="h-3.5 w-3.5" />}
          onClick={openNew}
        >
          New department
        </Button>
      </div>

      {message ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-[13px] text-emerald-800">
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <p className="text-[13px] text-[#475569]">Loading departments…</p>
      ) : departments.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[#E2E8F0] px-4 py-8 text-center">
          <Building2 className="mx-auto h-7 w-7 text-[#9333EA]" />
          <p className="mt-2 text-[14px] font-semibold text-[#0C2A43]">No departments yet</p>
          <p className="mt-1 text-[12px] text-[#475569]">Add departments used across the workspace.</p>
        </div>
      ) : (
        <div className="divide-y divide-[#F1F5F9] rounded-lg border border-[#E2E8F0]">
          {departments.map((dept) => {
            const count = headcount[dept.name] || 0;
            return (
              <div key={dept.id} className="flex items-start gap-3 px-3 py-3">
                <div className="mt-0.5 rounded-lg border border-[#9333EA]/30 bg-[#9333EA]/10 p-2 text-[#9333EA]">
                  <Building2 className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px] font-semibold text-[#0C2A43]">{dept.name}</div>
                  <div className="text-[12px] text-[#475569]">
                    {count} team member{count === 1 ? '' : 's'}
                  </div>
                  {dept.description ? (
                    <p className="mt-1 line-clamp-2 text-[12px] text-[#64748B]">{dept.description}</p>
                  ) : null}
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => openEdit(dept)}
                    className="rounded-md border border-[#E2E8F0] p-1.5 text-[#475569] hover:text-[#0C2A43]"
                    title="Edit"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDelete(dept)}
                    className="rounded-md border border-[#E2E8F0] p-1.5 text-[#475569] hover:text-red-600"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={editingId ? 'Edit department' : 'New department'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Name"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder="e.g. Engineering"
            required
          />
          <Textarea
            label="Description (optional)"
            value={formDescription}
            onChange={(e) => setFormDescription(e.target.value)}
            rows={3}
            placeholder="What this department covers"
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setIsDrawerOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={saving}>
              {editingId ? 'Save changes' : 'Create department'}
            </Button>
          </div>
        </form>
      </Drawer>
    </section>
  );
};
