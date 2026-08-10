import React from 'react';
import { cn } from '../../lib/utils';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  showPercent?: boolean;
}

export const Progress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  showPercent = false,
  className,
  ...props
}) => {
  const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100)));

  let barColor = 'bg-[#3B82F6]';
  if (percentage >= 100) barColor = 'bg-[#dc2626]';
  else if (percentage >= 90) barColor = 'bg-[#9333EA]';
  else if (percentage >= 80) barColor = 'bg-[#6A4BFF]';
  else if (percentage >= 70) barColor = 'bg-[#2C79FF]';

  return (
    <div className={cn('w-full flex flex-col gap-1', className)} {...props}>
      <div className="h-2 w-full overflow-hidden rounded-full bg-[#F1F5F9]">
        <div
          className={cn('h-full rounded-full transition-all duration-300', barColor)}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showPercent && (
        <span className="self-end text-[10px] font-semibold text-[#475569]">{percentage}%</span>
      )}
    </div>
  );
};
