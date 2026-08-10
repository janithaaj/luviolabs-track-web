import React from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'orange' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-semibold transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#6A4BFF]/35 rounded-md disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer';

    const variants = {
      primary:
        'bg-[#9333EA] hover:bg-[#7e22ce] text-white border border-[#9333EA]',
      orange:
        'bg-gradient-to-br from-[#9333EA] via-[#6D4DFF] to-[#2C79FF] hover:opacity-95 text-white border-0',
      secondary:
        'bg-white hover:bg-[#F8FAFC] text-[#1E293B] border border-[#E2E8F0]',
      outline: 'bg-white hover:bg-[#F5F0FF] text-[#1E293B] border border-[#E2E8F0]',
      ghost: 'bg-transparent hover:bg-[#F5F0FF] text-[#1E293B]',
      danger: 'bg-[#dc2626] hover:bg-[#b91c1c] text-white border border-[#dc2626]',
      success: 'bg-[#3B82F6] hover:bg-[#2563EB] text-white border border-[#3B82F6]',
    };

    const sizes = {
      sm: 'px-2.5 py-1 text-[12px] gap-1.5 font-label',
      md: 'px-3.5 py-1.5 text-[13px] gap-2',
      lg: 'px-5 py-2.5 text-[14px] gap-2',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin text-current" /> : leftIcon}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
