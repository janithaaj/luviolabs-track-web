'use client';

import React, { useState } from 'react';
import { Sparkles, ArrowRight, X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface AiPromptBarProps {
  label?: string;
  suggestion: string;
  className?: string;
  onRun?: (text: string) => void;
}

export const AiPromptBar: React.FC<AiPromptBarProps> = ({
  label,
  suggestion,
  className,
  onRun
}) => {
  const [value, setValue] = useState('');
  const [result, setResult] = useState('');

  const run = () => {
    const text = value.trim() || suggestion;
    if (onRun) {
      onRun(text);
      setResult(`Applied: “${text}”`);
    } else {
      setResult(`Got it — I’ll use “${text}” as a filter/suggestion on this page.`);
    }
    setValue('');
  };

  return (
    <div className={cn('space-y-1.5', className)}>
      {label && <p className="text-[13px] font-medium text-[#1E293B]">{label}</p>}
      <div className="flex max-w-xl items-center gap-2 rounded-full border border-[#E2E8F0] bg-white py-1.5 pl-4 pr-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <Sparkles className="h-3.5 w-3.5 shrink-0 text-[#9333EA]" />
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && run()}
          placeholder={`Try: ${suggestion}`}
          className="min-w-0 flex-1 bg-transparent text-[13px] text-[#0C2A43] outline-none placeholder:text-[#475569]"
        />
        <button
          type="button"
          onClick={run}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#9333EA] text-white hover:bg-[#7e22ce] cursor-pointer"
          aria-label="Run suggestion"
        >
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
      {result && (
        <div className="flex max-w-xl items-start justify-between gap-2 rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 text-[12px] text-[#1E293B]">
          <span>{result}</span>
          <button type="button" onClick={() => setResult('')} className="cursor-pointer text-[#64748B]">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
