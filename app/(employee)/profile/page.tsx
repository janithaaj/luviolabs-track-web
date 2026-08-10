'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../../src/store/use-auth-store';
import { projectService } from '../../../src/services/project-service';
import { Project } from '../../../src/types';
import { Badge } from '../../../src/components/ui/badge';
import { Mail, Building2, Gauge } from 'lucide-react';

export default function ProfilePage() {
  const { currentUser } = useAuthStore();
  const [assignedProjects, setAssignedProjects] = useState<Project[]>([]);

  useEffect(() => {
    if (!currentUser) return;
    projectService.getProjectsForUser(currentUser.id).then(setAssignedProjects);
  }, [currentUser?.id]);

  if (!currentUser) return null;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[28px] font-bold tracking-tight text-[#0C2A43]">My Profile</h1>
        <p className="mt-1 text-[13px] text-[#475569]">
          Your account and projects assigned by your admin.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="harvest-card flex flex-col items-center p-6 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#F5F0FF] text-xl font-bold text-[#9333EA]">
            {currentUser.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase()}
          </div>
          <h2 className="mt-3 text-[16px] font-bold text-[#0C2A43]">{currentUser.name}</h2>
          <p className="mt-0.5 text-[12px] text-[#475569]">Employee</p>
          <Badge variant="active" className="mt-2">
            {currentUser.status}
          </Badge>
        </div>

        <div className="harvest-card space-y-4 p-5 md:col-span-2">
          <h3 className="border-b border-[#E2E8F0] pb-3 text-[14px] font-bold text-[#0C2A43]">
            Details
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-[13px]">
            <div className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-3">
              <span className="flex items-center gap-1.5 text-[12px] text-[#475569]">
                <Mail className="h-3.5 w-3.5" /> Email
              </span>
              <p className="mt-1 font-semibold text-[#0C2A43]">{currentUser.email}</p>
            </div>
            <div className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-3">
              <span className="flex items-center gap-1.5 text-[12px] text-[#475569]">
                <Building2 className="h-3.5 w-3.5" /> Department
              </span>
              <p className="mt-1 font-semibold text-[#0C2A43]">{currentUser.department}</p>
            </div>
            <div className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-3">
              <span className="flex items-center gap-1.5 text-[12px] text-[#475569]">
                <Gauge className="h-3.5 w-3.5" /> Weekly capacity
              </span>
              <p className="mt-1 font-semibold text-[#0C2A43]">
                {currentUser.capacityHours} hours / week
              </p>
            </div>
          </div>

          <div>
            <h4 className="mb-2 text-[12px] font-bold uppercase tracking-wider text-[#475569]">
              Assigned projects ({assignedProjects.length})
            </h4>
            {assignedProjects.length === 0 ? (
              <p className="text-[13px] text-[#475569]">
                No projects yet. Your admin must assign you to a project before you can log time.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {assignedProjects.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-lg border border-[#E2E8F0] px-3 py-2.5"
                  >
                    <div>
                      <div className="text-[13px] font-bold text-[#0C2A43]">{p.name}</div>
                      <div className="text-[11px] text-[#475569]">{p.code}</div>
                    </div>
                    <Badge variant="billable">{p.type.replaceAll('_', ' ')}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
