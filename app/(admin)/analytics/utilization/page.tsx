'use client';

import React, { useState, useEffect } from 'react';
import { reportService, UtilizationMetric } from '../../../../src/services/report-service';
import { Card } from '../../../../src/components/ui/card';
import { Badge } from '../../../../src/components/ui/badge';
import { Progress } from '../../../../src/components/ui/progress';

export default function AdminUtilizationPage() {
  const [metrics, setMetrics] = useState<UtilizationMetric[]>([]);

  useEffect(() => {
    reportService.getUtilizationMetrics().then(setMetrics);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0C2A43] tracking-tight">Team Utilization Analytics</h1>
        <p className="text-xs text-[#475569] mt-1">
          Billable vs non-billable ratio breakdown across team members and departments
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {metrics.map((m) => (
          <Card key={m.userId} className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] text-[#9333EA] font-mono uppercase">{m.department}</span>
                <h3 className="text-base font-bold text-[#0C2A43]">{m.userName}</h3>
              </div>
              <Badge variant={m.utilizationPercent >= 75 ? 'approved' : 'warning'}>
                {m.utilizationPercent}% Utilization
              </Badge>
            </div>
            <Progress value={m.utilizationPercent} showPercent />
            <div className="flex justify-between text-xs pt-1 border-t border-[#E2E8F0] text-[#475569]">
              <span>Billable: <strong className="text-[#3B82F6]">{m.billableHours}h</strong></span>
              <span>Logged: <strong className="text-[#0C2A43]">{m.loggedHours}h</strong></span>
              <span>Capacity: <strong className="text-slate-200">{m.capacityHours}h</strong></span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
