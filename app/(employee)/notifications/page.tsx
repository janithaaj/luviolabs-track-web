'use client';

import React from 'react';
import { Bell } from 'lucide-react';

export default function NotificationsPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[28px] font-bold tracking-tight text-[#0C2A43]">Notifications</h1>
        <p className="mt-1 text-[13px] text-[#475569]">
          Project assignments and timesheet updates.
        </p>
      </div>

      <div className="harvest-empty flex flex-col items-center px-6 py-12 text-center">
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#F5F0FF] text-[#9333EA]">
          <Bell className="h-5 w-5" />
        </div>
        <p className="text-[13px] font-semibold text-[#0C2A43]">No notifications yet</p>
        <p className="mt-1 max-w-sm text-[12px] text-[#475569]">
          Notifications will show here when the notifications API is available.
        </p>
      </div>
    </div>
  );
}
