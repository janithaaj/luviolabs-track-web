'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { format, parseISO, addDays } from 'date-fns';
import { cn, formatWeekRangeString } from '../../lib/utils';
import { useUIStore } from '../../store/use-ui-store';

interface WeekNavigatorProps {
  /** Override store: controlled Monday YYYY-MM-DD */
  weekStart?: string;
  onPrev?: () => void;
  onNext?: () => void;
  onJumpToday?: () => void;
  className?: string;
  showCalendarIcon?: boolean;
  useStore?: boolean;
}

export const WeekNavigator: React.FC<WeekNavigatorProps> = ({
  weekStart,
  onPrev,
  onNext,
  onJumpToday,
  className,
  showCalendarIcon = false,
  useStore = true
}) => {
  const store = useUIStore();
  const monday = weekStart || store.activeWeekMonday;
  const mondayDate = parseISO(monday);
  const label = `This week ${formatWeekRangeString(mondayDate)} ${format(addDays(mondayDate, 6), 'yyyy')}`;

  const handlePrev = () => {
    if (onPrev) onPrev();
    else if (useStore) store.previousWeek();
  };
  const handleNext = () => {
    if (onNext) onNext();
    else if (useStore) store.nextWeek();
  };

  return (
    <div
      className={cn(
        'inline-flex items-center gap-0.5 rounded-md border border-[#E2E8F0] bg-white text-[13px] font-semibold text-[#0C2A43]',
        className
      )}
    >
      <button
        type="button"
        onClick={handlePrev}
        className="px-2 py-1.5 text-[#475569] hover:text-[#0C2A43] cursor-pointer"
        aria-label="Previous period"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => {
          if (onJumpToday) onJumpToday();
          else if (useStore) store.jumpToToday();
        }}
        className="min-w-[180px] px-1 text-center hover:text-[#9333EA] cursor-pointer"
        title="Jump to this week"
      >
        {label}
      </button>
      {showCalendarIcon && <Calendar className="mx-0.5 h-3.5 w-3.5 text-[#475569]" />}
      <button
        type="button"
        onClick={handleNext}
        className="px-2 py-1.5 text-[#475569] hover:text-[#0C2A43] cursor-pointer"
        aria-label="Next period"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
};
