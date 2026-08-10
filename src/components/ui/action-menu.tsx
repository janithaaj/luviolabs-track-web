'use client';

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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

interface MenuCoords {
  top: number;
  left: number;
  minWidth: number;
  openUp: boolean;
}

export const ActionMenu: React.FC<ActionMenuProps> = ({
  label = 'Actions',
  items,
  size = 'sm',
  className,
  align = 'right',
}) => {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<MenuCoords | null>(null);
  const [mounted, setMounted] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = () => {
    const btn = buttonRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const menuHeight = menuRef.current?.offsetHeight ?? items.length * 40 + 8;
    const menuWidth = Math.max(menuRef.current?.offsetWidth ?? 180, 180);
    const gap = 4;
    const spaceBelow = window.innerHeight - rect.bottom - gap;
    const spaceAbove = rect.top - gap;
    const openUp = spaceBelow < menuHeight && spaceAbove > spaceBelow;

    let left =
      align === 'right' ? rect.right - menuWidth : rect.left;
    left = Math.min(Math.max(8, left), window.innerWidth - menuWidth - 8);

    const top = openUp
      ? Math.max(8, rect.top - gap - menuHeight)
      : Math.min(rect.bottom + gap, window.innerHeight - menuHeight - 8);

    setCoords({
      top,
      left,
      minWidth: Math.max(rect.width, 180),
      openUp,
    });
  };

  useLayoutEffect(() => {
    if (!open) {
      setCoords(null);
      return;
    }
    updatePosition();
    // Re-measure after menu mounts so height is accurate
    const id = requestAnimationFrame(updatePosition);
    return () => cancelAnimationFrame(id);
  }, [open, align, items.length]);

  useEffect(() => {
    if (!open) return;

    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (buttonRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onReposition = () => updatePosition();

    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', onReposition);
    window.addEventListener('scroll', onReposition, true);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onReposition);
      window.removeEventListener('scroll', onReposition, true);
    };
  }, [open, align, items.length]);

  const menu =
    open && mounted && coords
      ? createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{
              position: 'fixed',
              top: coords.top,
              left: coords.left,
              minWidth: coords.minWidth,
              zIndex: 9999,
            }}
            className="rounded-md border border-[#E2E8F0] bg-white py-1 shadow-lg"
          >
            {items.map((item) => (
              <button
                key={item.label}
                type="button"
                role="menuitem"
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
          </div>,
          document.body
        )
      : null;

  return (
    <div className={cn('inline-block', className)}>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-md border border-[#E2E8F0] bg-white font-semibold text-[#1E293B] hover:bg-[#F8FAFC] cursor-pointer',
          size === 'sm' ? 'px-2.5 py-1 text-[12px]' : 'px-3.5 py-1.5 text-[13px]'
        )}
      >
        {label}
        <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} />
      </button>
      {menu}
    </div>
  );
};
