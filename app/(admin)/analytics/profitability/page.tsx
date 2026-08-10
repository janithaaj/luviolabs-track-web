'use client';

import React, { useState, useEffect } from 'react';
import { reportService, ProfitabilityMetric } from '../../../../src/services/report-service';
import { Card } from '../../../../src/components/ui/card';
import { Badge } from '../../../../src/components/ui/badge';
import { formatCurrency } from '../../../../src/lib/utils';
import { DollarSign, TrendingUp, ShieldAlert } from 'lucide-react';

export default function AdminProfitabilityPage() {
  const [metrics, setMetrics] = useState<ProfitabilityMetric[]>([]);

  useEffect(() => {
    reportService.getProfitabilityMetrics().then(setMetrics);
  }, []);

  const totalRevenue = metrics.reduce((acc, m) => acc + m.revenue, 0);
  const totalLaborCost = metrics.reduce((acc, m) => acc + m.laborCost, 0);
  const totalExpenses = metrics.reduce((acc, m) => acc + m.expenses, 0);
  const totalProfit = Math.max(0, totalRevenue - totalLaborCost - totalExpenses);
  const overallMarginPct = totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-title text-2xl font-bold text-[#0C2A43] tracking-tight flex items-center gap-2">
            Project Profitability
          </h1>
          <p className="text-xs text-[#475569] mt-1">
            Client revenue vs delivery cost (labor + expenses) — admin only
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-rose-400 bg-rose-500/10 px-3 py-1.5 rounded-xl border border-rose-500/30">
          <ShieldAlert className="w-4 h-4" />
          Restricted to Admin / Finance Roles
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="flex flex-col justify-between">
          <span className="text-xs text-[#475569] font-bold uppercase">Total Client Revenue</span>
          <h3 className="text-2xl font-extrabold font-mono text-[#3B82F6] mt-1">
            {formatCurrency(totalRevenue)}
          </h3>
        </Card>

        <Card className="flex flex-col justify-between">
          <span className="text-xs text-[#475569] font-bold uppercase">Total Labor Cost</span>
          <h3 className="text-2xl font-extrabold font-mono text-[#7e22ce] mt-1">
            {formatCurrency(totalLaborCost)}
          </h3>
        </Card>

        <Card className="flex flex-col justify-between">
          <span className="text-xs text-[#475569] font-bold uppercase">Net Operating Profit</span>
          <h3 className="text-2xl font-extrabold font-mono text-[#9333EA] mt-1">
            {formatCurrency(totalProfit)}
          </h3>
        </Card>

        <Card className="flex flex-col justify-between">
          <span className="text-xs text-[#475569] font-bold uppercase">Average Margin %</span>
          <h3 className="text-2xl font-extrabold font-mono text-[#3B82F6] mt-1">
            {overallMarginPct}% Margin
          </h3>
        </Card>
      </div>

      {/* Project Profitability Table */}
      <Card className="p-0 overflow-hidden border border-[#E2E8F0]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-white border-b border-[#E2E8F0] text-[#475569] uppercase tracking-wider">
                <th className="py-3.5 px-4 font-bold">Project Name</th>
                <th className="py-3.5 px-4 font-bold">Client Name</th>
                <th className="py-3.5 px-4 font-bold">Client Revenue</th>
                <th className="py-3.5 px-4 font-bold">Labor Cost (Internal)</th>
                <th className="py-3.5 px-4 font-bold">Expenses</th>
                <th className="py-3.5 px-4 font-bold">Net Profit</th>
                <th className="py-3.5 px-4 font-bold">Margin %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {metrics.map((m) => (
                <tr key={m.projectId} className="hover:bg-white/40">
                  <td className="py-3 px-4 font-extrabold text-[#0C2A43]">{m.projectName}</td>
                  <td className="py-3 px-4 text-indigo-300 font-semibold">{m.clientName}</td>
                  <td className="py-3 px-4 font-mono font-bold text-[#3B82F6]">
                    {formatCurrency(m.revenue)}
                  </td>
                  <td className="py-3 px-4 font-mono text-[#7e22ce] font-semibold">
                    {formatCurrency(m.laborCost)}
                  </td>
                  <td className="py-3 px-4 font-mono text-[#1E293B]">
                    {formatCurrency(m.expenses)}
                  </td>
                  <td className="py-3 px-4 font-mono font-extrabold text-indigo-300">
                    {formatCurrency(m.profit)}
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant={m.marginPercent >= 50 ? 'approved' : 'warning'}>
                      {m.marginPercent}% Margin
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
