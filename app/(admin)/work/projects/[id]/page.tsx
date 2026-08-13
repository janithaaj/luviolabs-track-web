'use client';

import React, { useState, useEffect, use, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { projectService } from '../../../../../src/services/project-service';
import { teamService } from '../../../../../src/services/team-service';
import { clientService } from '../../../../../src/services/client-service';
import { Project, User, Client, ProjectType, ProjectStatus } from '../../../../../src/types';
import { Card } from '../../../../../src/components/ui/card';
import { Button } from '../../../../../src/components/ui/button';
import { Badge } from '../../../../../src/components/ui/badge';
import { Progress } from '../../../../../src/components/ui/progress';
import { Input } from '../../../../../src/components/ui/input';
import { Select } from '../../../../../src/components/ui/select';
import { Textarea } from '../../../../../src/components/ui/textarea';
import { useAuthStore } from '../../../../../src/store/use-auth-store';
import { ArrowLeft, Check, Save, Pencil, Trash2, X } from 'lucide-react';
import Link from 'next/link';

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUser } = useAuthStore();
  const isAdmin = currentUser?.role === 'ADMIN';

  const [project, setProject] = useState<Project | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Edit form fields
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [clientId, setClientId] = useState('');
  const [type, setType] = useState<ProjectType>('TIME_AND_MATERIALS');
  const [status, setStatus] = useState<ProjectStatus>('ACTIVE');
  const [startDate, setStartDate] = useState('');
  const [deadline, setDeadline] = useState('');
  const [currency, setCurrency] = useState('LKR');
  const [budgetHours, setBudgetHours] = useState('200');
  const [fixedFeeAmount, setFixedFeeAmount] = useState('');

  const openEditByDefault = searchParams.get('edit') === '1';

  const fillForm = (proj: Project) => {
    setName(proj.name);
    setCode(proj.code);
    setDescription(proj.description || '');
    setClientId(proj.clientId);
    setType(proj.type);
    setStatus(proj.status);
    setStartDate(proj.startDate || '');
    setDeadline(proj.deadline || '');
    setCurrency(proj.currency || 'LKR');
    setBudgetHours(String(proj.budget?.totalHours ?? 200));
    setFixedFeeAmount(
      proj.budget?.totalAmount != null ? String(proj.budget.totalAmount) : ''
    );
  };

  useEffect(() => {
    const loadProject = async () => {
      const [proj, employees, clientList] = await Promise.all([
        projectService.getProjectById(projectId),
        teamService.getEmployees(),
        clientService.getClients(),
      ]);
      setProject(proj);
      setAllUsers(employees);
      setClients(clientList);
      if (proj) {
        setSelectedMemberIds(proj.teamMemberIds);
        fillForm(proj);
        if (openEditByDefault && currentUser?.role === 'ADMIN') {
          setIsEditing(true);
        }
      }
    };
    loadProject();
  }, [projectId, openEditByDefault, currentUser?.role]);

  const clientOptions = useMemo(
    () => clients.map((c) => ({ value: c.id, label: c.companyName })),
    [clients]
  );

  if (!project) {
    return <div className="p-8 text-center text-[#475569]">Loading project details...</div>;
  }

  const toggleMember = (id: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const handleSaveTeam = async () => {
    if (!isAdmin) return;
    setIsSaving(true);
    setError('');
    try {
      const updated = await projectService.updateProjectTeam(projectId, selectedMemberIds);
      if (updated) setProject(updated);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save team');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    setIsSaving(true);
    setError('');
    setMessage('');
    try {
      const client = clients.find((c) => c.id === clientId);
      const updated = await projectService.saveProject({
        id: projectId,
        name: name.trim(),
        code: code.trim(),
        description,
        clientId,
        clientName: client?.companyName || project.clientName,
        type,
        status,
        startDate,
        deadline: deadline || undefined,
        currency,
        teamMemberIds: selectedMemberIds,
        taskIds: project.taskIds,
        budget:
          type === 'FIXED_FEE' || type === 'MONTHLY'
            ? {
                type: 'TOTAL_AMOUNT',
                totalAmount: parseFloat(fixedFeeAmount) || 0,
                totalHours: parseFloat(budgetHours) || undefined,
                warnThresholds: project.budget?.warnThresholds || [70, 80, 90, 100],
              }
            : {
                type: 'TOTAL_HOURS',
                totalHours: parseFloat(budgetHours) || 200,
                totalAmount: project.budget?.totalAmount,
                warnThresholds: project.budget?.warnThresholds || [70, 80, 90, 100],
              },
      });
      setProject(updated);
      fillForm(updated);
      setIsEditing(false);
      setMessage('Project updated.');
      // clear ?edit=1 from URL without full navigation noise
      router.replace(`/work/projects/${projectId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update project');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!isAdmin) return;
    const ok = window.confirm(
      `Delete project “${project.name}”? This cannot be undone.`
    );
    if (!ok) return;
    setIsDeleting(true);
    setError('');
    try {
      await projectService.deleteProject(projectId);
      router.push('/work/projects');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete project');
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/work/projects"
            className="rounded-xl border border-[#E2E8F0] bg-white p-2 text-[#475569] hover:text-[#0C2A43]"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <span className="font-mono text-xs text-[#9333EA]">{project.clientName}</span>
            <h1 className="text-2xl font-bold tracking-tight text-[#0C2A43]">{project.name}</h1>
          </div>
        </div>

        {isAdmin ? (
          <div className="flex flex-wrap items-center gap-2">
            {!isEditing ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                leftIcon={<Pencil className="h-3.5 w-3.5" />}
                onClick={() => {
                  fillForm(project);
                  setIsEditing(true);
                  setError('');
                }}
              >
                Edit project
              </Button>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                leftIcon={<X className="h-3.5 w-3.5" />}
                onClick={() => {
                  fillForm(project);
                  setIsEditing(false);
                  setError('');
                }}
              >
                Cancel edit
              </Button>
            )}
            <Button
              type="button"
              variant="danger"
              size="sm"
              leftIcon={<Trash2 className="h-3.5 w-3.5" />}
              onClick={handleDelete}
              isLoading={isDeleting}
            >
              Delete
            </Button>
          </div>
        ) : null}
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

      {isEditing && isAdmin ? (
        <Card className="space-y-4 p-5">
          <h3 className="border-b border-[#E2E8F0] pb-3 text-base font-bold text-[#0C2A43]">
            Edit project
          </h3>
          <form onSubmit={handleSaveProject} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Project name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input label="Project code" value={code} onChange={(e) => setCode(e.target.value)} />
            <Select
              label="Client"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              options={clientOptions}
            />
            <Select
              label="Type"
              value={type}
              onChange={(e) => setType(e.target.value as ProjectType)}
              options={[
                { value: 'TIME_AND_MATERIALS', label: 'Time & Materials' },
                { value: 'FIXED_FEE', label: 'Fixed Fee' },
                { value: 'MONTHLY', label: 'Monthly' },
                { value: 'NON_BILLABLE', label: 'Non-Billable' },
              ]}
            />
            <Select
              label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value as ProjectStatus)}
              options={[
                { value: 'ACTIVE', label: 'Active' },
                { value: 'ON_HOLD', label: 'On hold' },
                { value: 'COMPLETED', label: 'Completed' },
                { value: 'ARCHIVED', label: 'Archived' },
              ]}
            />
            <Select
              label="Currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              options={[
                { value: 'LKR', label: 'LKR' },
                { value: 'USD', label: 'USD' },
              ]}
            />
            <Input
              label="Start date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <Input
              label="Deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
            <Input
              label="Budget hours"
              value={budgetHours}
              onChange={(e) => setBudgetHours(e.target.value)}
            />
            {type === 'FIXED_FEE' || type === 'MONTHLY' ? (
              <Input
                label={
                  type === 'MONTHLY'
                    ? `Monthly fee (${currency})`
                    : `Fixed fee (${currency})`
                }
                type="number"
                min="0"
                step="0.01"
                value={fixedFeeAmount}
                onChange={(e) => setFixedFeeAmount(e.target.value)}
                required
              />
            ) : null}
            <div className="sm:col-span-2">
              <Textarea
                label="Notes / description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2 sm:col-span-2">
              <Button type="button" variant="ghost" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={isSaving} leftIcon={<Save className="h-3.5 w-3.5" />}>
                Save changes
              </Button>
            </div>
          </form>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="space-y-4">
          <h3 className="border-b border-[#E2E8F0] pb-3 text-base font-bold text-[#0C2A43]">
            Project Summary
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1">
              <span className="text-[#475569]">Code:</span>
              <span className="font-mono text-[#0C2A43]">{project.code}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[#475569]">Manager:</span>
              <span className="font-semibold text-[#0C2A43]">{project.managerName}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[#475569]">Type:</span>
              <Badge variant="billable">{project.type.replaceAll('_', ' ')}</Badge>
            </div>
            {project.type === 'FIXED_FEE' || project.type === 'MONTHLY' ? (
              <div className="flex justify-between py-1">
                <span className="text-[#475569]">
                  {project.type === 'MONTHLY' ? 'Monthly fee:' : 'Fixed fee:'}
                </span>
                <span className="font-semibold tabular-nums text-[#0C2A43]">
                  {project.currency}{' '}
                  {(project.budget.totalAmount ?? 0).toLocaleString(undefined, {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                  })}
                  {project.type === 'MONTHLY' ? ' / mo' : ''}
                </span>
              </div>
            ) : null}
            <div className="flex justify-between py-1">
              <span className="text-[#475569]">Status:</span>
              <Badge variant="draft">{project.status}</Badge>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[#475569]">Start Date:</span>
              <span className="text-[#0C2A43]">{project.startDate || '—'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[#475569]">Deadline:</span>
              <span className="text-[#0C2A43]">{project.deadline || 'Ongoing'}</span>
            </div>
            {project.description ? (
              <div className="border-t border-[#E2E8F0] pt-2">
                <span className="mb-1 block text-[#475569]">Notes</span>
                <p className="text-[12px] leading-relaxed text-[#1E293B]">{project.description}</p>
              </div>
            ) : null}
          </div>

          <div className="space-y-2 border-t border-[#E2E8F0] pt-3">
            <span className="text-xs font-bold uppercase text-[#475569]">Budget Status</span>
            {(project.type === 'FIXED_FEE' || project.type === 'MONTHLY') &&
            project.budget.totalAmount != null ? (
              <>
                <div className="flex justify-between pt-1 text-xs">
                  <span className="text-[#475569]">
                    {project.type === 'MONTHLY' ? 'Monthly fee' : 'Fixed fee'}
                  </span>
                  <span className="font-semibold tabular-nums text-[#0C2A43]">
                    {project.currency}{' '}
                    {project.budget.totalAmount.toLocaleString(undefined, {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2,
                    })}
                    {project.type === 'MONTHLY' ? ' / mo' : ''}
                  </span>
                </div>
                {project.budget.totalHours ? (
                  <>
                    <Progress
                      value={Math.round(
                        (project.usedHours / (project.budget.totalHours || 1)) * 100
                      )}
                      showPercent
                    />
                    <div className="flex justify-between pt-1 text-xs">
                      <span className="text-[#475569]">
                        Hours used: <strong>{project.usedHours}h</strong>
                      </span>
                      <span className="text-[#475569]">
                        Budget: <strong>{project.budget.totalHours}h</strong>
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="pt-1 text-xs text-[#475569]">
                    Hours used: <strong>{project.usedHours}h</strong>
                  </div>
                )}
              </>
            ) : project.budget.totalHours != null && project.budget.totalHours > 0 ? (
              <>
                <Progress
                  value={Math.min(
                    100,
                    Math.round((project.usedHours / project.budget.totalHours) * 100),
                  )}
                  showPercent
                />
                <div className="flex justify-between pt-1 text-xs">
                  <span className="text-[#475569]">
                    Used: <strong>{project.usedHours}h</strong>
                  </span>
                  <span className="text-[#475569]">
                    Total: <strong>{project.budget.totalHours}h</strong>
                  </span>
                </div>
              </>
            ) : (
              <div className="pt-1 text-xs text-[#475569]">
                Hours used: <strong>{project.usedHours}h</strong>
                {project.budget.totalHours == null ? ' · no hours budget' : null}
              </div>
            )}
          </div>
        </Card>

        <Card className="space-y-4 md:col-span-2">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
            <div>
              <h3 className="text-base font-bold text-[#0C2A43]">Project Team Assignment</h3>
              <p className="text-xs text-[#475569]">
                Choose which employees can record time against this project
              </p>
            </div>
            {isAdmin ? (
              <Button
                variant="success"
                size="sm"
                onClick={handleSaveTeam}
                isLoading={isSaving}
                leftIcon={<Save className="h-3.5 w-3.5" />}
              >
                {savedSuccess ? 'Saved!' : 'Save Team Changes'}
              </Button>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {allUsers.map((user) => {
              const isAssigned = selectedMemberIds.includes(user.id);

              return (
                <div
                  key={user.id}
                  onClick={() => {
                    if (isAdmin) toggleMember(user.id);
                  }}
                  className={`flex items-center justify-between rounded-xl border p-3.5 transition-all ${
                    isAdmin ? 'cursor-pointer' : 'cursor-default'
                  } ${
                    isAssigned
                      ? 'border-[#9333EA] bg-[#F5F0FF] text-[#0C2A43]'
                      : 'border-[#E2E8F0] bg-[#F8FAFC] text-[#475569] hover:border-[#E2E8F0]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F5F0FF] text-[11px] font-bold text-[#9333EA]">
                      {user.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)}
                    </div>
                    <div>
                      <span className="block text-xs font-bold">{user.name}</span>
                      <span className="text-[10px] text-[#475569]">{user.email}</span>
                    </div>
                  </div>
                  <div
                    className={`flex h-5 w-5 items-center justify-center rounded-md border ${
                      isAssigned
                        ? 'border-[#9333EA] bg-[#9333EA] text-white'
                        : 'border-[#E2E8F0]'
                    }`}
                  >
                    {isAssigned && <Check className="h-3.5 w-3.5" />}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
