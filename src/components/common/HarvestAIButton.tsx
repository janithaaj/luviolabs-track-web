'use client';

import React, { useState } from 'react';
import { Sparkles, X } from 'lucide-react';

export const HarvestAIButton: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<string[]>([
    'Hi! Ask me to filter invoices, sum hours, or suggest a timesheet entry.'
  ]);

  const send = () => {
    const q = input.trim();
    if (!q) return;
    setMessages((m) => [
      ...m,
      `You: ${q}`,
      `Assistant: Based on your workspace data, I'd handle “${q}” once connected to full AI. For now, use Teams, Timesheets, or Reports to take that action.`
    ]);
    setInput('');
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full border border-[#E2E8F0] bg-white px-3.5 py-2 text-[13px] font-semibold text-[#1E293B] shadow-[0_2px_12px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)] transition-shadow cursor-pointer"
      >
        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#9333EA] text-white">
          <Sparkles className="h-3 w-3" />
        </span>
        Harvest AI
      </button>

      {open && (
        <div className="fixed bottom-20 right-5 z-50 flex h-[380px] w-[340px] flex-col overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] bg-[#F8F5FF] px-3 py-2.5">
            <span className="text-[13px] font-bold text-[#0C2A43]">Harvest AI</span>
            <button type="button" onClick={() => setOpen(false)} className="cursor-pointer text-[#475569]">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto p-3 text-[12px] text-[#1E293B]">
            {messages.map((msg, i) => (
              <p key={i} className="rounded-lg bg-[#F8FAFC] px-2.5 py-2">
                {msg}
              </p>
            ))}
          </div>
          <div className="flex gap-2 border-t border-[#E2E8F0] p-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder="Ask anything…"
              className="flex-1 rounded-md border border-[#E2E8F0] px-2 py-1.5 text-[13px] outline-none focus:border-[#9333EA]"
            />
            <button
              type="button"
              onClick={send}
              className="rounded-md bg-[#9333EA] px-3 py-1.5 text-[12px] font-bold text-white cursor-pointer"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
};
