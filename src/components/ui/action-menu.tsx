'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface ActionMenuItem {
  label: string;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}

interface ActionMenuProps {
  label?: string;
  items: ActionMenuItem[];
  size?: 'sm' | 'md';
  variant?: 'outline' | 'primary' | 'ghost';
  className?: string;
  align?: 'left' | 'right';
}

export const ActionMenu: React.FC<ActionMenuProps> = ({
  label = 'Actions',
  items,
  size = 'sm',
  className,
  align = 'right'
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  return (
    <div className={cn('relative inline-block', className)} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-md border border-[#E2E8F0] bg-white font-semibold text-[#1E293B] hover:bg-[#F8FAFC] cursor-pointer',
          size === 'sm' ? 'px-2.5 py-1 text-[12px]' : 'px-3.5 py-1.5 text-[13px]'
        )}
      >
        {label}
        <ChevronDown className="h-3.5 w-3.5" />
      </button>
      {open && (
        <div
          className={cn(
            'absolute z-50 mt-1 min-w-[180px] rounded-md border border-[#E2E8F0] bg-white py-1 shadow-lg',
            align === 'right' ? 'right-0' : 'left-0'
          )}
        >
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              disabled={item.disabled}
              onClick={() => {
                if (item.disabled) return;
                item.onClick();
                setOpen(false);
              }}
              className={cn(
                'block w-full px-3 py-2 text-left text-[13px] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed',
                item.danger
                  ? 'text-red-600 hover:bg-red-50'
                  : 'text-[#0C2A43] hover:bg-[#F8FAFC]'
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
