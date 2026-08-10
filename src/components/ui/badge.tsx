import React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | 'draft'
    | 'submitted'
    | 'pending'
    | 'approved'
    | 'rejected'
    | 'billable'
    | 'nonbillable'
    | 'active'
    | 'warning'
    | 'danger'
    | 'info'
    | 'owner'
    | 'member';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  children,
  variant = 'draft',
  size = 'md',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center font-medium rounded border';

  const variants = {
    draft: 'bg-[#F1F5F9] text-[#475569] border-[#E2E8F0]',
    submitted: 'bg-[#eef2ff] text-[#4338ca] border-[#c7d2fe]',
    pending: 'bg-[#F5F0FF] text-[#7e22ce] border-[#D8B4FE]',
    approved: 'bg-[#eff6ff] text-[#1d4ed8] border-[#bfdbfe]',
    rejected: 'bg-[#fef2f2] text-[#b91c1c] border-[#fecaca]',
    billable: 'bg-[#eff6ff] text-[#2C79FF] border-[#bfdbfe]',
    nonbillable: 'bg-[#F8FAFC] text-[#475569] border-[#E2E8F0]',
    active: 'bg-[#F5F0FF] text-[#9333EA] border-[#D8B4FE]',
    warning: 'bg-[#fffbeb] text-[#b45309] border-[#fde68a]',
    danger: 'bg-[#fef2f2] text-[#b91c1c] border-[#fecaca]',
    info: 'bg-[#eff6ff] text-[#1d4ed8] border-[#bfdbfe]',
    owner: 'bg-[#F5F0FF] text-[#6A4BFF] border-[#ddd6fe]',
    member: 'bg-[#F1F5F9] text-[#475569] border-[#E2E8F0]'
  };

  const sizes = {
    sm: 'px-1.5 py-0.5 text-[10px]',
    md: 'px-2 py-0.5 text-[11px]'
  };

  return (
    <span className={cn(baseStyles, variants[variant], sizes[size], className)} {...props}>
      {children}
    </span>
  );
};
