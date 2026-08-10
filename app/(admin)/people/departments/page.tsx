'use client';

import React from 'react';
import { DEPARTMENTS } from '../../../../src/lib/constants';
import { Card } from '../../../../src/components/ui/card';
import { Building2 } from 'lucide-react';

export default function DepartmentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0C2A43] tracking-tight">Organization Departments</h1>
        <p className="text-xs text-[#475569] mt-1">
          Departmental hierarchy and headcount allocation across Engineering, Design, PM, and HR
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {DEPARTMENTS.map((dept) => (
          <Card key={dept} className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-[#9333EA]/20 text-[#9333EA] border border-[#9333EA]/30">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#0C2A43]">{dept}</h3>
              <p className="text-xs text-[#475569] mt-0.5">Active Luvio Labs Team</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
