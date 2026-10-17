import { describe, it, expect } from 'vitest';
import { formatCurrency, formatPercentage, formatDate } from '../src/lib/formatters';

describe('Formatters', () => {
  it('formats IDR currency with standard formatting without decimal cents', () => {
    const formatted = formatCurrency(1500000, 'IDR');
    expect(formatted).toContain('1.500.000');
  });

  it('formats USD currency with standard dollar symbol and 2 decimals', () => {
    const formatted = formatCurrency(1500, 'USD');
    expect(formatted).toBe('$1,500.00');
  });

  it('formats compact representation for charts and cards', () => {
    const compactIDR = formatCurrency(2500000, 'IDR', { compact: true });
    expect(compactIDR).toBe('Rp2.5jt');

    const compactUSD = formatCurrency(2500, 'USD', { compact: true });
    expect(compactUSD).toBe('$2.5k');
  });

  it('formats percentages correctly', () => {
    expect(formatPercentage(25.467, 1)).toBe('25.5%');
    expect(formatPercentage(100, 0)).toBe('100%');
  });
});
