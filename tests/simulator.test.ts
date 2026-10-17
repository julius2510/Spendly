import { describe, it, expect } from 'vitest';
import { runFinancialSimulation } from '../src/lib/simulator';

describe('Financial Simulator Calculations', () => {
  it('correctly calculates zero interest linear savings', () => {
    // $1,000 initial + $100/mo * 12 months = $2,200
    const res = runFinancialSimulation({
      initialSavings: 1000,
      monthlyIncome: 3000,
      monthlyExpenses: 2900,
      monthlySavings: 100,
      annualInterestRate: 0,
      durationYears: 1,
    });

    expect(res.finalBalance).toBe(2200);
    expect(res.totalContributions).toBe(2200);
    expect(res.totalInterestEarned).toBe(0);
  });

  it('correctly compounds interest over time with positive return', () => {
    const res = runFinancialSimulation({
      initialSavings: 10000,
      monthlyIncome: 5000,
      monthlyExpenses: 4000,
      monthlySavings: 1000,
      annualInterestRate: 6, // 6% annual
      durationYears: 5,
    });

    // 5 years = 60 months.
    // Total contributed = 10,000 + 60 * 1,000 = 70,000
    expect(res.totalContributions).toBe(70000);
    // Compound balance should be greater than flat contributions
    expect(res.finalBalance).toBeGreaterThan(70000);
    expect(res.totalInterestEarned).toBeGreaterThan(0);
    expect(res.finalBalance).toBe(res.totalContributions + res.totalInterestEarned);
  });

  it('accurately projects time to reach financial target goal', () => {
    const res = runFinancialSimulation({
      initialSavings: 5000,
      monthlyIncome: 2000,
      monthlyExpenses: 1000,
      monthlySavings: 1000,
      annualInterestRate: 0,
      durationYears: 2, // 24 months
    });

    // To reach $10,000 with $5,000 initial + $1,000/mo -> 5 months
    const months = res.timeToReachGoalMonths(10000);
    expect(months).toBe(5);

    // Goal already met
    expect(res.timeToReachGoalMonths(3000)).toBe(0);

    // Goal unreachable within window
    expect(res.timeToReachGoalMonths(100000)).toBeNull();
  });
});
