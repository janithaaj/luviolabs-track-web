'use client';

import React, { useState } from 'react';
import { Clock, ChevronsUp } from 'lucide-react';

export const Header: React.FC = () => {
  const [msg, setMsg] = useState('');

  return (
    <div className="flex w-full flex-col">
      <div className="flex w-full items-center justify-between gap-3 bg-[#0C2A43] px-5 py-2 text-white">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#9333EA]/20 px-2 py-0.5 text-[11px] font-bold text-[#ff8c4a]">
            <Clock className="h-3 w-3" />
            30 days
          </span>
          <span className="text-[13px] font-medium text-white/90">
            left before your free trial expires.
          </span>
        </div>

        <button
          type="button"
          onClick={() => setMsg('Upgrade options open in a real billing portal. Contact sales to upgrade.')}
          className="inline-flex items-center gap-1.5 rounded-md bg-[#9333EA] px-3 py-1.5 text-[12px] font-bold text-white hover:bg-[#7e22ce] cursor-pointer"
        >
          Upgrade now
          <ChevronsUp className="h-3.5 w-3.5" />
        </button>
      </div>
      {msg && (
        <div className="flex items-center justify-between bg-[#F5F0FF] px-5 py-1.5 text-[12px] text-[#7e22ce]">
          <span>{msg}</span>
          <button type="button" className="font-semibold underline cursor-pointer" onClick={() => setMsg('')}>
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
};
