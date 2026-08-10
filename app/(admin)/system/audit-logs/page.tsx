'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '../../../../src/components/ui/card';
import { ShieldAlert, Clock } from 'lucide-react';

export default function AuditLogsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0C2A43] tracking-tight">System Audit Logs</h1>
        <p className="text-xs text-[#475569] mt-1">
          Complete security & operational activity trail for compliance and governance
        </p>
      </div>

      <Card className="p-8 border border-[#E2E8F0] text-center">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#F5F0FF] text-[#9333EA]">
          <ShieldAlert className="h-5 w-5" />
        </div>
        <p className="text-[14px] font-semibold text-[#0C2A43]">No audit logs yet</p>
        <p className="mt-1 text-[12px] text-[#475569]">
          The audit log API is not connected. Activity will appear here once that endpoint is
          available.
        </p>
        <div className="mt-4 inline-flex items-center gap-1.5 text-[11px] text-[#64748B]">
          <Clock className="h-3.5 w-3.5" />
          Live from API when ready
        </div>
      </Card>
    </div>
  );
}
