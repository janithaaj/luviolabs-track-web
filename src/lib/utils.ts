import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, startOfWeek, endOfWeek, addDays, parseISO, isValid } from 'date-fns';
import { DEFAULT_CURRENCY } from './constants';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Prefer project → client → org → account default (LKR).
 * Empty / missing values fall through.
 */
export function resolveBillingCurrency(
  ...candidates: Array<string | null | undefined>
): string {
  for (const c of candidates) {
    const code = String(c || '')
      .trim()
      .toUpperCase();
    if (code && code !== 'UNDEFINED' && code !== 'NULL') return code;
  }
  return DEFAULT_CURRENCY;
}

/**
 * Normalizes user duration input into total minutes.
 * Accepts: "2", "2.5", "2:30", "150", "150m", "1h 30m", "1h30m"
 */
export function parseDurationToMinutes(input: string | number): number {
  if (typeof input === 'number') {
    return Math.round(input * 60);
  }

  const clean = input.trim().toLowerCase();
  if (!clean) return 0;

  // Format: "2:30" or "02:30"
  if (clean.includes(':')) {
    const parts = clean.split(':');
    const hours = parseInt(parts[0], 10) || 0;
    const mins = parseInt(parts[1], 10) || 0;
    return hours * 60 + mins;
  }

  // Format: "1h 30m" or "1h30m" or "2h"
  if (clean.includes('h') || clean.includes('m')) {
    let hours = 0;
    let mins = 0;
    const hMatch = clean.match(/(\d+(?:\.\d+)?)h/);
    const mMatch = clean.match(/(\d+)m/);
    if (hMatch) hours = parseFloat(hMatch[1]);
    if (mMatch) mins = parseInt(mMatch[1], 10);
    return Math.round(hours * 60 + mins);
  }

  // Plain number e.g. "2.5" or "150"
  const val = parseFloat(clean);
  if (isNaN(val)) return 0;

  // If value is small (e.g. <= 24), treat as decimal hours (2.5 -> 150 mins)
  // If value is > 24 (e.g. 150), treat as minutes
  if (val <= 24 && clean.includes('.')) {
    return Math.round(val * 60);
  } else if (val <= 24) {
    return Math.round(val * 60);
  } else {
    return Math.round(val);
  }
}

/**
 * Formats minutes into standard human hours format.
 * 150 -> "2h 30m"
 * 180 -> "3h"
 */
export function formatMinutesToHoursString(minutes: number): string {
  if (!minutes || minutes <= 0) return '0h';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours > 0 && mins > 0) {
    return `${hours}h ${mins}m`;
  } else if (hours > 0) {
    return `${hours}h`;
  } else {
    return `${mins}m`;
  }
}

/**
 * Formats minutes into decimal hours string (e.g. 150 -> "2.5h")
 */
export function formatMinutesToDecimal(minutes: number): string {
  const hours = minutes / 60;
  return `${hours % 1 === 0 ? hours.toFixed(0) : hours.toFixed(1)}h`;
}

/**
 * Formats seconds into HH:MM:SS for the running timer
 */
export function formatSecondsToTimer(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

/**
 * Currency Formatter (e.g. LKR 420K or LKR 420,000)
 */
export function formatCurrency(amount: number, currency = DEFAULT_CURRENCY, compact = false): string {
  const code = resolveBillingCurrency(currency);
  if (compact) {
    if (amount >= 1000000) {
      return `${code} ${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `${code} ${(amount / 1000).toFixed(0)}K`;
    }
  }
  return `${code} ${amount.toLocaleString('en-US')}`;
}

/**
 * Gets array of 7 dates for Monday to Sunday for the given reference date
 */
export function getWeekDays(referenceDate: Date = new Date()): Date[] {
  const monday = startOfWeek(referenceDate, { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

/**
 * Date to YYYY-MM-DD
 */
export function formatDateString(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/**
 * Week range display string e.g. "Aug 03 – Aug 09"
 */
export function formatWeekRangeString(mondayDate: Date): string {
  const sundayDate = addDays(mondayDate, 6);
  return `${format(mondayDate, 'MMM dd')} – ${format(sundayDate, 'MMM dd')}`;
}

/** Expected paid hours in a month from weekly capacity (52 weeks ÷ 12). */
export function monthlyHoursFromWeeklyCapacity(weeklyHours: number): number {
  return (weeklyHours || 40) * (52 / 12);
}

/** Internal hourly cost from monthly salary. Project cost ≈ hours × this rate. */
export function costRateFromMonthlySalary(
  monthlySalary: number,
  weeklyCapacityHours: number
): number {
  const monthlyHours = monthlyHoursFromWeeklyCapacity(weeklyCapacityHours);
  if (monthlyHours <= 0 || !monthlySalary || monthlySalary <= 0) return 0;
  return Math.round((monthlySalary / monthlyHours) * 100) / 100;
}

/** Cost to deliver N minutes of work at an hourly cost rate. */
export function laborCostForMinutes(durationMinutes: number, costRatePerHour: number): number {
  return Math.round(((durationMinutes / 60) * (costRatePerHour || 0)) * 100) / 100;
}
