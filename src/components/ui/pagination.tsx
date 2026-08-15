'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

const PAGE_SIZE_OPTIONS = [10, 20, 50];

export function pageWindow(current: number, total: number, span = 5): number[] {
  if (total <= 0) return [];
  if (total <= span) return Array.from({ length: total }, (_, i) => i + 1);
  const half = Math.floor(span / 2);
  let start = Math.max(1, current - half);
  const end = Math.min(total, start + span - 1);
  start = Math.max(1, end - span + 1);
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

export interface PaginationProps {
  page: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  page,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = PAGE_SIZE_OPTIONS,
  className,
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const from = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const to = Math.min(safePage * pageSize, totalItems);
  const pages = pageWindow(safePage, totalPages);

  return (
    <nav
      className={cn(
        'flex flex-col gap-3 border-t border-[#E2E8F0] px-4 py-3 sm:flex-row sm:items-center sm:justify-between',
        className
      )}
      aria-label="Pagination"
    >
      <p className="text-[12px] text-[#475569]">
        {totalItems === 0 ? (
          'No entries'
        ) : (
          <>
            Showing{' '}
            <span className="font-semibold tabular-nums text-[#0C2A43]">{from}</span>
            –
            <span className="font-semibold tabular-nums text-[#0C2A43]">{to}</span>
            {' of '}
            <span className="font-semibold tabular-nums text-[#0C2A43]">{totalItems}</span>
          </>
        )}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        {onPageSizeChange ? (
          <label className="flex items-center gap-1.5 text-[12px] text-[#475569]">
            Per page
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="h-8 rounded-md border border-[#E2E8F0] bg-white px-2 text-[12px] font-semibold text-[#0C2A43] outline-none focus:border-[#6A4BFF] focus:ring-1 focus:ring-[#6A4BFF]/30 cursor-pointer"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <div className="inline-flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => onPageChange(safePage - 1)}
            disabled={safePage <= 1}
            className="inline-flex h-8 items-center gap-1 rounded-md border border-[#E2E8F0] bg-white px-2 text-[12px] font-semibold text-[#1E293B] hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Prev
          </button>

          {pages[0] > 1 ? (
            <>
              <PageButton page={1} current={safePage} onClick={onPageChange} />
              {pages[0] > 2 ? (
                <span className="px-1 text-[12px] text-[#94A3B8]" aria-hidden>
                  …
                </span>
              ) : null}
            </>
          ) : null}

          {pages.map((n) => (
            <PageButton key={n} page={n} current={safePage} onClick={onPageChange} />
          ))}

          {pages[pages.length - 1] < totalPages ? (
            <>
              {pages[pages.length - 1] < totalPages - 1 ? (
                <span className="px-1 text-[12px] text-[#94A3B8]" aria-hidden>
                  …
                </span>
              ) : null}
              <PageButton page={totalPages} current={safePage} onClick={onPageChange} />
            </>
          ) : null}

          <button
            type="button"
            onClick={() => onPageChange(safePage + 1)}
            disabled={safePage >= totalPages}
            className="inline-flex h-8 items-center gap-1 rounded-md border border-[#E2E8F0] bg-white px-2 text-[12px] font-semibold text-[#1E293B] hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
            aria-label="Next page"
          >
            Next
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </nav>
  );
};

function PageButton({
  page,
  current,
  onClick,
}: {
  page: number;
  current: number;
  onClick: (page: number) => void;
}) {
  const active = page === current;
  return (
    <button
      type="button"
      onClick={() => onClick(page)}
      aria-current={active ? 'page' : undefined}
      aria-label={`Page ${page}`}
      className={cn(
        'inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-[12px] font-semibold tabular-nums cursor-pointer',
        active
          ? 'border border-[#9333EA] bg-[#F5F0FF] text-[#9333EA]'
          : 'border border-[#E2E8F0] bg-white text-[#1E293B] hover:bg-[#F8FAFC]'
      )}
    >
      {page}
    </button>
  );
}
