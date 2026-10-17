import { format, parseISO, isValid } from 'date-fns';
import { CurrencyCode } from '@/types';

/**
 * Format currency with locale-aware representations.
 * IDR: Rp1.500.000
 * USD: $1,500.00
 */
export function formatCurrency(
  amount: number,
  currency: CurrencyCode = 'IDR',
  options?: {
    compact?: boolean;
    showSign?: boolean;
    type?: 'income' | 'expense';
  }
): string {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  const absAmount = Math.abs(safeAmount);

  let formatted = '';

  if (options?.compact) {
    if (currency === 'IDR') {
      if (absAmount >= 1_000_000_000) {
        formatted = `Rp${(absAmount / 1_000_000_000).toFixed(1)}M`;
      } else if (absAmount >= 1_000_000) {
        formatted = `Rp${(absAmount / 1_000_000).toFixed(1)}jt`;
      } else if (absAmount >= 1_000) {
        formatted = `Rp${(absAmount / 1_000).toFixed(0)}rb`;
      } else {
        formatted = `Rp${absAmount}`;
      }
    } else {
      if (absAmount >= 1_000_000) {
        formatted = `$${(absAmount / 1_000_000).toFixed(1)}M`;
      } else if (absAmount >= 1_000) {
        formatted = `$${(absAmount / 1_000).toFixed(1)}k`;
      } else {
        formatted = `$${absAmount.toFixed(0)}`;
      }
    }
  } else {
    if (currency === 'IDR') {
      // Indonesian Rupiah standard format (no decimals needed for everyday IDR)
      formatted = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
        minimumFractionDigits: 0,
      }).format(absAmount);
    } else {
      // US Dollar standard format
      formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(absAmount);
    }
  }

  if (options?.showSign) {
    if (options.type === 'expense' || safeAmount < 0) {
      return `-${formatted}`;
    }
    if (options.type === 'income' || safeAmount > 0) {
      return `+${formatted}`;
    }
  }

  return safeAmount < 0 ? `-${formatted}` : formatted;
}

/**
 * Format percentage with customizable decimal places.
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  if (!Number.isFinite(value)) return '0%';
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format date string safely.
 */
export function formatDate(
  dateString: string | Date | undefined,
  formatPattern: string = 'dd MMM yyyy'
): string {
  if (!dateString) return '—';
  try {
    const d = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    if (!isValid(d)) return '—';
    return format(d, formatPattern);
  } catch {
    return '—';
  }
}
