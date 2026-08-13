'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  ChevronDown,
  Users
} from 'lucide-react';
import { teamService } from '../../../../src/services/team-service';
import { projectService } from '../../../../src/services/project-service';
import { User, UserStatus } from '../../../../src/types';
import { Project } from '../../../../src/types';
import { Button } from '../../../../src/components/ui/button';
import { Input } from '../../../../src/components/ui/input';
import { Select } from '../../../../src/components/ui/select';
import { Badge } from '../../../../src/components/ui/badge';
import { Drawer } from '../../../../src/components/ui/drawer';
import { ActionMenu } from '../../../../src/components/ui/action-menu';
import { GettingStartedPayrollBar } from '../../../../src/components/common/GettingStartedPayrollBar';
import { WeekNavigator } from '../../../../src/components/common/WeekNavigator';
import { useAuthStore } from '../../../../src/store/use-auth-store';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DEPARTMENTS } from '../../../../src/lib/constants';
import { departmentService } from '../../../../src/services/department-service';
import { costRateFromMonthlySalary, formatCurrency } from '../../../../src/lib/utils';

export default function AdminTeamPage() {
  const router = useRouter();
  const { currentUser, createEmployee } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [departmentOptions, setDepartmentOptions] = useState<string[]>(DEPARTMENTS);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('EVERYONE');
  const [activeTab, setActiveTab] = useState<'Members' | 'Assignments'>('Members');
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePassword, setInvitePassword] = useState('');
  const [inviteDepartment, setInviteDepartment] = useState(DEPARTMENTS[0] || 'Engineering');
  const [inviteMonthlySalary, setInviteMonthlySalary] = useState('120000');
  const [inviteCostRate, setInviteCostRate] = useState(
    String(costRateFromMonthlySalary(120000, 40))
  );
  const [inviteBillableRate, setInviteBillableRate] = useState('110');
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [assignmentMsg, setAssignmentMsg] = useState('');
  const [listMessage, setListMessage] = useState('');
  const [listError, setListError] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [editStatus, setEditStatus] = useState<UserStatus>('ACTIVE');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadUsers = async () => {
    const [u, p, depts] = await Promise.all([
      teamService.getUsers(),
      projectService.getProjects(),
      departmentService.getDepartments().catch(() => []),
    ]);
    setUsers(u);
    setProjects(p);
    const names = depts.map((d) => d.name).filter(Boolean);
    if (names.length > 0) {
      setDepartmentOptions(names);
      setInviteDepartment((prev) => (names.includes(prev) ? prev : names[0]));
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filtered = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (filter === 'ACTIVE') return u.status === 'ACTIVE';
    if (filter === 'EMPLOYEE') return u.role === 'EMPLOYEE';
    if (filter === 'ADMIN') return u.role === 'ADMIN';
    return true;
  });

  const employees = users.filter((u) => u.role === 'EMPLOYEE');
  const totalCapacity = employees.reduce((acc, u) => acc + (u.capacityHours || 35), 0);

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError('');
    setInviteSuccess('');
    setIsCreating(true);
    const salary = parseFloat(inviteMonthlySalary) || 0;
    const cost =
      parseFloat(inviteCostRate) ||
      costRateFromMonthlySalary(salary, 40) ||
      0;
    const result = await createEmployee({
      name: inviteName,
      email: inviteEmail,
      password: invitePassword,
      department: inviteDepartment,
      capacityHours: 40,
      monthlySalary: salary,
      costRate: cost,
      billableRate: parseFloat(inviteBillableRate) || 0,
    });
    setIsCreating(false);
    if (!result.success) {
      setInviteError(result.error || 'Failed to create employee');
      return;
    }
    setInviteSuccess(`Created ${result.user?.name}. They can sign in with the password you set.`);
    setInviteName('');
    setInviteEmail('');
    setInvitePassword('');
    await loadUsers();
  };

  const openEdit = (user: User) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditDepartment(user.department || departmentOptions[0] || 'Engineering');
    setEditStatus(user.status || 'ACTIVE');
    setListError('');
    setIsEditOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsSavingEdit(true);
    setListError('');
    setListMessage('');
    try {
      await teamService.updateUser(editingUser.id, {
        name: editName.trim(),
        department: editDepartment,
        status: editStatus,
      });
      setIsEditOpen(false);
      setEditingUser(null);
      setListMessage('Team member updated.');
      await loadUsers();
    } catch (err) {
      setListError(err instanceof Error ? err.message : 'Failed to update team member');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (user.id === currentUser?.id) {
      setListError('You cannot delete your own account.');
      return;
    }
    if (!window.confirm(`Remove ${user.name} from the team? This cannot be undone.`)) return;
    setDeletingId(user.id);
    setListError('');
    setListMessage('');
    try {
      await teamService.deleteUser(user.id);
      setListMessage(`Removed ${user.name}.`);
      await loadUsers();
    } catch (err) {
      setListError(err instanceof Error ? err.message : 'Failed to remove team member');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight text-[#0C2A43]">Team</h1>
          <div className="mt-3 flex items-center gap-5 border-b border-[#E2E8F0]">
            {(['Members', 'Assignments'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`pb-2 text-[13px] font-semibold cursor-pointer ${
                  activeTab === tab
                    ? 'border-b-2 border-[#9333EA] text-[#9333EA]'
                    : 'text-[#475569] hover:text-[#0C2A43]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="primary"
            leftIcon={<Plus className="h-3.5 w-3.5" />}
            onClick={() => {
              setInviteError('');
              setInviteSuccess('');
              setIsInviteOpen(true);
            }}
          >
            Invite person
          </Button>
        </div>
      </div>

      <div className="harvest-card p-4 text-[13px] text-[#1E293B]">
        <p className="font-semibold text-[#0C2A43]">Create employees from admin</p>
        <p className="mt-1 text-[#475569]">
          Only the system admin can create employee accounts. Employees sign in with the email and
          password you set, and can only track time on projects you assign them to.
        </p>
      </div>

      <GettingStartedPayrollBar variant="expanded" />

      {listMessage ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-[13px] text-emerald-800">
          {listMessage}
        </div>
      ) : null}
      {listError ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
          {listError}
        </div>
      ) : null}

      {activeTab === 'Members' && (
        <>
      <div className="space-y-3">
        <WeekNavigator />
        <div className="flex flex-wrap items-end gap-8">
          <div>
            <div className="text-[13px] text-[#475569]">Employees</div>
            <div className="text-[28px] font-bold tabular-nums text-[#0C2A43]">{employees.length}</div>
          </div>
          <div>
            <div className="text-[13px] text-[#475569]">Team capacity</div>
            <div className="text-[28px] font-bold tabular-nums text-[#0C2A43]">
              {totalCapacity.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="w-full sm:w-64">
          <Input
            placeholder="Filter by name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
          />
        </div>
        <div className="w-full sm:w-40">
          <Select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            options={[
              { value: 'EVERYONE', label: 'Everyone' },
              { value: 'EMPLOYEE', label: 'Employees' },
              { value: 'ADMIN', label: 'Admins' },
              { value: 'ACTIVE', label: 'Active' }
            ]}
          />
        </div>
      </div>

      <div className="harvest-card harvest-table-wrap p-0">
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="border-b border-[#E2E8F0] text-[12px] font-semibold text-[#475569]">
              <th className="px-4 py-3">
                People <span className="text-[#64748B]">({filtered.length})</span>
              </th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">Salary /mo</th>
              <th className="px-4 py-3">Cost /h</th>
              <th className="px-4 py-3">Billable /h</th>
              <th className="px-4 py-3">Projects</th>
              <th className="px-4 py-3">Capacity</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1F5F9]">
            {filtered.map((user) => (
              <tr key={user.id} className="hover:bg-[#F8FAFC]">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F5F0FF] text-[11px] font-bold text-[#9333EA]">
                      {user.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <Link
                      href={`/people/team/${user.id}`}
                      className="font-semibold text-[#0C2A43] hover:underline"
                    >
                      {user.name}
                    </Link>
                  </div>
                </td>
                <td className="px-4 py-3 text-[#475569]">{user.email}</td>
                <td className="px-4 py-3">
                  <Badge variant={user.role === 'ADMIN' ? 'owner' : 'member'} size="sm">
                    {user.role === 'ADMIN' ? 'Admin' : 'Employee'}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-[#475569]">{user.department}</td>
                <td className="px-4 py-3 tabular-nums text-[#0C2A43]">
                  {(user.monthlySalary ?? 0) > 0
                    ? formatCurrency(user.monthlySalary || 0).replace(/^LKR\s/, '')
                    : '—'}
                </td>
                <td className="px-4 py-3 tabular-nums text-[#7e22ce]">
                  {(user.costRate ?? 0).toFixed(0)}
                </td>
                <td className="px-4 py-3 tabular-nums font-semibold text-[#3B82F6]">
                  {(user.billableRate ?? 0).toFixed(0)}
                </td>
                <td className="px-4 py-3 tabular-nums text-[#0C2A43]">
                  {user.assignedProjectIds?.length || 0}
                </td>
                <td className="px-4 py-3 tabular-nums text-[#0C2A43]">
                  {(user.capacityHours || 40).toFixed(2)}
                </td>
                <td className="px-4 py-3 text-right">
                  <ActionMenu
                    items={[
                      { label: 'Edit', onClick: () => openEdit(user) },
                      {
                        label: 'Open profile',
                        onClick: () => router.push(`/people/team/${user.id}`),
                      },
                      {
                        label: deletingId === user.id ? 'Removing…' : 'Remove',
                        danger: true,
                        disabled: deletingId === user.id || user.id === currentUser?.id,
                        onClick: () => handleDeleteUser(user),
                      },
                    ]}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
        </>
      )}

      {activeTab === 'Assignments' && (
        <div className="space-y-3">
          {assignmentMsg && (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-[13px] text-emerald-800">
              {assignmentMsg}
            </div>
          )}
          <p className="text-[13px] text-[#475569]">
            Toggle checkboxes to assign employees to projects. They can only log time on assigned
            work.
          </p>
          <div className="harvest-card overflow-x-auto p-0">
            <table className="w-full min-w-[640px] text-left text-[13px]">
              <thead>
                <tr className="border-b border-[#E2E8F0] text-[12px] font-semibold text-[#475569]">
                  <th className="px-4 py-3 sticky left-0 bg-white">Employee</th>
                  {projects.map((p) => (
                    <th key={p.id} className="px-3 py-3 font-semibold max-w-[120px] truncate" title={p.name}>
                      {p.code}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-[#F8FAFC]">
                    <td className="px-4 py-3 font-semibold sticky left-0 bg-white">{emp.name}</td>
                    {projects.map((p) => {
                      const checked = p.teamMemberIds.includes(emp.id);
                      return (
                        <td key={p.id} className="px-3 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={checked}
                            className="h-4 w-4 rounded border-[#E2E8F0] text-[#9333EA] cursor-pointer"
                            onChange={async () => {
                              const next = checked
                                ? p.teamMemberIds.filter((id) => id !== emp.id)
                                : [...p.teamMemberIds, emp.id];
                              await projectService.updateProjectTeam(p.id, next);
                              setAssignmentMsg(`Updated ${emp.name} on ${p.name}`);
                              loadUsers();
                            }}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {employees.length === 0 && (
                  <tr>
                    <td colSpan={projects.length + 1} className="px-4 py-8 text-center text-[#475569]">
                      Create employees first, then assign them to projects.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Drawer
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        title="Create employee"
        description="Employees can sign in and track time only on projects you assign."
      >
        <form onSubmit={handleCreateEmployee} className="space-y-4">
          <Input
            label="Full name"
            value={inviteName}
            onChange={(e) => setInviteName(e.target.value)}
            placeholder="Jane Doe"
            required
          />
          <Input
            label="Email"
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="jane@company.com"
            required
          />
          <Input
            label="Temporary password"
            type="password"
            value={invitePassword}
            onChange={(e) => setInvitePassword(e.target.value)}
            placeholder="Min. 6 characters"
            required
            helperText="Share this with the employee so they can sign in."
          />
          <Select
            label="Department"
            value={inviteDepartment}
            onChange={(e) => setInviteDepartment(e.target.value)}
            options={departmentOptions.map((d) => ({ value: d, label: d }))}
          />
          <Input
            label="Monthly salary"
            type="number"
            min="0"
            step="1"
            value={inviteMonthlySalary}
            onChange={(e) => {
              setInviteMonthlySalary(e.target.value);
              const rate = costRateFromMonthlySalary(parseFloat(e.target.value) || 0, 40);
              if (rate > 0 || (parseFloat(e.target.value) || 0) === 0) {
                setInviteCostRate(String(rate));
              }
            }}
            helperText="Hourly cost = salary ÷ (40h × 52/12). Used for project delivery cost."
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Cost rate /h"
              type="number"
              min="0"
              step="0.01"
              value={inviteCostRate}
              onChange={(e) => setInviteCostRate(e.target.value)}
              helperText="1 hour work = this cost on projects"
            />
            <Input
              label="Billable rate /h"
              type="number"
              min="0"
              step="0.01"
              value={inviteBillableRate}
              onChange={(e) => setInviteBillableRate(e.target.value)}
            />
          </div>

          {inviteError && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
              {inviteError}
            </div>
          )}
          {inviteSuccess && (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-[13px] text-emerald-800">
              {inviteSuccess}
            </div>
          )}

          <div className="flex justify-end gap-2 border-t border-[#E2E8F0] pt-4">
            <Button type="button" variant="ghost" onClick={() => setIsInviteOpen(false)}>
              Close
            </Button>
            <Button type="submit" variant="primary" isLoading={isCreating}>
              Create employee
            </Button>
          </div>
          <p className="text-[11px] text-[#64748B]">
            Signed in as {currentUser?.email}. Only admins can create accounts.
          </p>
        </form>
      </Drawer>

      <Drawer
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setEditingUser(null);
        }}
        title="Edit team member"
        description={editingUser?.email}
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <Input
            label="Full name"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            required
          />
          <Select
            label="Department"
            value={editDepartment}
            onChange={(e) => setEditDepartment(e.target.value)}
            options={departmentOptions.map((d) => ({ value: d, label: d }))}
          />
          <Select
            label="Status"
            value={editStatus}
            onChange={(e) => setEditStatus(e.target.value as UserStatus)}
            options={[
              { value: 'ACTIVE', label: 'Active' },
              { value: 'INACTIVE', label: 'Inactive' },
              { value: 'ON_LEAVE', label: 'On leave' },
              { value: 'INVITED', label: 'Invited' },
            ]}
          />
          {listError && isEditOpen ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
              {listError}
            </div>
          ) : null}
          <div className="flex justify-end gap-2 border-t border-[#E2E8F0] pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setIsEditOpen(false);
                setEditingUser(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSavingEdit}>
              Save changes
            </Button>
          </div>
        </form>
      </Drawer>
    </div>
  );
}
