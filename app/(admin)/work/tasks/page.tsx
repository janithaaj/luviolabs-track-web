'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Plus, Search, X } from 'lucide-react';
import { Button } from '../../../../src/components/ui/button';
import { Badge } from '../../../../src/components/ui/badge';
import { Input } from '../../../../src/components/ui/input';
import { Drawer } from '../../../../src/components/ui/drawer';
import { ActionMenu } from '../../../../src/components/ui/action-menu';
import { GettingStartedPayrollBar } from '../../../../src/components/common/GettingStartedPayrollBar';
import { AiPromptBar } from '../../../../src/components/common/AiPromptBar';
import { HandBuildingBlocksGraphic } from '../../../../src/components/common/EmptyStateGraphics';
import { Task } from '../../../../src/types';
import { formatCurrency } from '../../../../src/lib/utils';
import { taskService } from '../../../../src/services/task-service';

export default function AdminTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('Engineering');
  const [formIsBillable, setFormIsBillable] = useState(true);
  const [formRate, setFormRate] = useState('0');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const list = await taskService.getTasks();
      setTasks(list);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const filtered = tasks.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );
  const commonTasks = filtered.filter((t) => t.isCommon !== false && t.category !== 'Other');
  const otherTasks = filtered.filter((t) => t.isCommon === false || t.category === 'Other');

  const toggleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const openNew = () => {
    setEditingId(null);
    setFormName('');
    setFormCategory('Engineering');
    setFormIsBillable(true);
    setFormRate('0');
    setIsDrawerOpen(true);
  };

  const openEdit = (t: Task) => {
    setEditingId(t.id);
    setFormName(t.name);
    setFormCategory(t.category);
    setFormIsBillable(t.isBillableDefault);
    setFormRate(String(t.defaultRate || 0));
    setIsDrawerOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      if (editingId) {
        await taskService.updateTask({
          id: editingId,
          name: formName,
          category: formCategory,
          isBillableDefault: formIsBillable,
          defaultRate: parseFloat(formRate) || 0,
          isCommon: formCategory !== 'Other',
        });
        setMessage('Task updated.');
      } else {
        await taskService.createTask({
          name: formName || 'New Task',
          category: formCategory,
          isBillableDefault: formIsBillable,
          defaultRate: parseFloat(formRate) || 0,
          isCommon: formCategory !== 'Other',
        });
        setMessage('Task created.');
      }
      setIsDrawerOpen(false);
      await loadTasks();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to save task');
    } finally {
      setSaving(false);
    }
  };

  const toggleBillable = async (t: Task) => {
    try {
      await taskService.updateTask({
        id: t.id,
        isBillableDefault: !t.isBillableDefault,
      });
      await loadTasks();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to update task');
    }
  };

  const deleteOne = async (id: string) => {
    try {
      await taskService.deleteTask(id);
      setSelected((prev) => prev.filter((x) => x !== id));
      await loadTasks();
      setMessage('Task deleted.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to delete task');
    }
  };

  const deleteSelected = async () => {
    try {
      await Promise.all(selected.map((id) => taskService.deleteTask(id)));
      setSelected([]);
      await loadTasks();
      setMessage('Selected tasks deleted.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to delete tasks');
    }
  };

  const markSelectedBillable = async () => {
    try {
      await Promise.all(
        selected.map((id) => taskService.updateTask({ id, isBillableDefault: true }))
      );
      await loadTasks();
      setMessage('Marked billable.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to update tasks');
    }
  };

  const TaskSection = ({
    title,
    subtitle,
    list,
  }: {
    title: string;
    subtitle: string;
    list: Task[];
  }) => (
    <div className="harvest-card overflow-hidden p-0">
      <div className="flex items-start justify-between gap-4 border-b border-[#E2E8F0] px-4 py-3.5">
        <div>
          <h3 className="text-[14px] font-bold text-[#0C2A43]">{title}</h3>
          <p className="mt-0.5 text-[12px] text-[#475569]">{subtitle}</p>
        </div>
        <span className="shrink-0 text-[12px] font-semibold text-[#475569]">
          Default billable rate
        </span>
      </div>
      <div className="divide-y divide-[#F1F5F9]">
        {list.map((t) => (
          <div
            key={t.id}
            className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-[#F8FAFC]"
          >
            <div className="flex min-w-0 items-center gap-3">
              <input
                type="checkbox"
                checked={selected.includes(t.id)}
                onChange={() => toggleSelect(t.id)}
                className="h-4 w-4 rounded border-[#E2E8F0] text-[#9333EA]"
              />
              <span className="truncate text-[13px] font-semibold text-[#0C2A43]">{t.name}</span>
              {t.isBillableDefault && <Badge variant="billable">Billable</Badge>}
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <span className="tabular-nums text-[13px] font-semibold text-[#475569]">
                {formatCurrency(t.defaultRate || 0, 'LKR')}
              </span>
              <ActionMenu
                items={[
                  { label: 'Edit', onClick: () => openEdit(t) },
                  {
                    label: t.isBillableDefault ? 'Make non-billable' : 'Make billable',
                    onClick: () => toggleBillable(t),
                  },
                  {
                    label: 'Delete',
                    danger: true,
                    onClick: () => deleteOne(t.id),
                  },
                ]}
              />
            </div>
          </div>
        ))}
        {list.length === 0 && (
          <div className="px-4 py-6 text-center text-[12px] text-[#475569]">
            {loading ? 'Loading…' : 'No tasks'}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-[28px] font-bold tracking-tight text-[#0C2A43]">Tasks</h1>
        <div className="flex items-center gap-2">
          <Button variant="primary" onClick={openNew} leftIcon={<Plus className="h-3.5 w-3.5" />}>
            New task
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              const rows = [
                'Name,Category,Billable,Rate',
                ...tasks.map(
                  (t) =>
                    `${t.name},${t.category},${t.isBillableDefault},${t.defaultRate || 0}`
                ),
              ];
              const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
              const a = document.createElement('a');
              a.href = URL.createObjectURL(blob);
              a.download = 'tasks.csv';
              a.click();
              setMessage('Exported tasks.csv');
            }}
          >
            Export
          </Button>
        </div>
      </div>

      {message && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-[13px] text-emerald-800">
          {message}
        </div>
      )}

      <GettingStartedPayrollBar />
      <AiPromptBar
        suggestion="Assign existing tasks to a project"
        onRun={() => setMessage('Open a project and update its task list to assign tasks.')}
      />

      {selected.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 text-[13px]">
          <span className="font-semibold">{selected.length} selected</span>
          <Button size="sm" variant="outline" onClick={markSelectedBillable}>
            Mark billable
          </Button>
          <Button size="sm" variant="danger" onClick={deleteSelected}>
            Delete selected
          </Button>
        </div>
      )}

      <div className="w-full sm:w-72">
        <Input
          placeholder="Filter by task name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search className="h-4 w-4" />}
        />
      </div>

      <TaskSection
        title="Common tasks"
        subtitle="These tasks are automatically added to all new projects."
        list={commonTasks}
      />
      <TaskSection
        title="Other tasks"
        subtitle="These tasks must be manually added to projects."
        list={otherTasks}
      />

      {showOnboarding && !loading && tasks.length === 0 && (
        <div className="harvest-card relative flex flex-col items-center px-6 py-10 text-center">
          <button
            type="button"
            onClick={() => setShowOnboarding(false)}
            className="absolute right-3 top-3 text-[#64748B] cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
          <HandBuildingBlocksGraphic className="mb-4 h-20 w-20" />
          <h3 className="text-[16px] font-bold">Add once, use forever</h3>
          <p className="mt-1 max-w-sm text-[13px] text-[#475569]">
            Create common tasks that appear on every new project.
          </p>
          <Button variant="primary" className="mt-4" onClick={openNew}>
            Add your first task
          </Button>
        </div>
      )}

      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={editingId ? 'Edit task' : 'Add New Task'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Task Name"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            required
          />
          <Input
            label="Category"
            value={formCategory}
            onChange={(e) => setFormCategory(e.target.value)}
          />
          <Input
            label="Default rate"
            value={formRate}
            onChange={(e) => setFormRate(e.target.value)}
          />
          <label className="flex items-center gap-2 text-[13px] cursor-pointer">
            <input
              type="checkbox"
              checked={formIsBillable}
              onChange={(e) => setFormIsBillable(e.target.checked)}
              className="rounded border-[#E2E8F0] text-[#9333EA]"
            />
            Billable by default
          </label>
          <div className="flex justify-end gap-2 border-t border-[#E2E8F0] pt-4">
            <Button type="button" variant="ghost" onClick={() => setIsDrawerOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={saving}>
              Save Task
            </Button>
          </div>
        </form>
      </Drawer>
    </div>
  );
}
