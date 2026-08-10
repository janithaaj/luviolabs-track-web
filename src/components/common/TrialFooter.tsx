'use client';

import React, { useState } from 'react';

export const TrialFooter: React.FC = () => {
  const [msg, setMsg] = useState(false);
  return (
    <div className="flex flex-col items-center gap-2 py-8 text-[13px] text-[#475569]">
      <div className="flex items-center justify-center gap-2">
        <span>You have 30 days left in your free trial.</span>
        <button
          type="button"
          onClick={() => setMsg(true)}
          className="inline-flex items-center rounded border border-[#E2E8F0] bg-white px-2.5 py-0.5 text-[12px] font-semibold text-[#1E293B] hover:bg-[#F8FAFC] cursor-pointer"
        >
          Upgrade
        </button>
      </div>
      {msg && (
        <p className="text-[12px] text-[#9333EA]">
          Billing upgrade isn’t connected yet — reach out to upgrade your workspace.
        </p>
      )}
    </div>
  );
};
