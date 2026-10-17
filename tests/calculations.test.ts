import { describe, it, expect } from 'vitest';
import {
  calculateTotals,
  calculateBudgetStatuses,
  calculateFinancialSummary,
  filterTransactionsByPeriod,
} from '../src/lib/calculations';
import { Transaction, Budget } from '../src/types';

describe('Financial Calculations', () => {
  const sampleTransactions: Transaction[] = [
    {
      id: 'tx-1',
      description: 'Salary',
      amount: 10000000,
      type: 'income',
      category: 'Salary',
      date: '2026-10-01',
      createdAt: '2026-10-01T00:00:00Z',
      updatedAt: '2026-10-01T00:00:00Z',
    },
    {
      id: 'tx-2',
      description: 'Groceries',
      amount: 2500000,
      type: 'expense',
      category: 'Food & Dining',
      date: '2026-10-05',
      createdAt: '2026-10-05T00:00:00Z',
      updatedAt: '2026-10-05T00:00:00Z',
    },
    {
      id: 'tx-3',
      description: 'Rent',
      amount: 3500000,
      type: 'expense',
      category: 'Housing',
      date: '2026-10-10',
      createdAt: '2026-10-10T00:00:00Z',
      updatedAt: '2026-10-10T00:00:00Z',
    },
  ];

  it('correctly calculates total income, expenses, net savings, and savings rate', () => {
    const res = calculateTotals(sampleTransactions);
    expect(res.income).toBe(10000000);
    expect(res.expenses).toBe(6000000);
    expect(res.netSavings).toBe(4000000);
    // (10M - 6M) / 10M * 100 = 40%
    expect(res.savingsRate).toBe(40);
  });

  it('handles zero income edge case without division by zero errors', () => {
    const expensesOnly: Transaction[] = [
      {
        id: 'tx-e',
        description: 'Snack',
        amount: 50000,
        type: 'expense',
        category: 'Food & Dining',
        date: '2026-10-02',
        createdAt: '2026-10-02T00:00:00Z',
        updatedAt: '2026-10-02T00:00:00Z',
      },
    ];
    const res = calculateTotals(expensesOnly);
    expect(res.income).toBe(0);
    expect(res.expenses).toBe(50000);
    expect(res.savingsRate).toBe(-100);
  });

  it('evaluates budget statuses correctly: normal, warning, exceeded', () => {
    const budgets: Budget[] = [
      {
        id: 'b-1',
        category: 'Food & Dining',
        monthlyLimit: 3000000,
        period: 'monthly',
        createdAt: '',
        updatedAt: '',
      },
      {
        id: 'b-2',
        category: 'Housing',
        monthlyLimit: 3000000, // spent 3.5M -> exceeded
        period: 'monthly',
        createdAt: '',
        updatedAt: '',
      },
      {
        id: 'b-3',
        category: 'Transportation',
        monthlyLimit: 1000000, // spent 0 -> normal
        period: 'monthly',
        createdAt: '',
        updatedAt: '',
      },
    ];

    const statuses = calculateBudgetStatuses(budgets, sampleTransactions);

    const foodStatus = statuses.find((s) => s.budget.category === 'Food & Dining');
    expect(foodStatus?.spent).toBe(2500000);
    expect(foodStatus?.remaining).toBe(500000);
    // 2.5 / 3 = 83.3% -> warning (>= 80%)
    expect(foodStatus?.status).toBe('warning');

    const housingStatus = statuses.find((s) => s.budget.category === 'Housing');
    expect(housingStatus?.spent).toBe(3500000);
    expect(housingStatus?.status).toBe('exceeded');

    const transportStatus = statuses.find((s) => s.budget.category === 'Transportation');
    expect(transportStatus?.spent).toBe(0);
    expect(transportStatus?.status).toBe('normal');
  });

  it('computes financial summary and balance from starting capital', () => {
    const summary = calculateFinancialSummary(
      sampleTransactions,
      sampleTransactions,
      [],
      [],
      5000000 // 5M starting
    );
    // 5M + 4M net = 9M total balance
    expect(summary.totalBalance).toBe(9000000);
    expect(summary.hasPreviousPeriod).toBe(false);
  });

  it('gracefully calculates financial summary when starting clean from 0 transactions', () => {
    const emptySummary = calculateFinancialSummary([], [], [], [], 0);
    expect(emptySummary.totalBalance).toBe(0);
    expect(emptySummary.totalIncome).toBe(0);
    expect(emptySummary.totalExpenses).toBe(0);
    expect(emptySummary.netSavings).toBe(0);
    expect(emptySummary.savingsRate).toBe(0);
    expect(emptySummary.totalBudgetLimit).toBe(0);
    expect(emptySummary.totalBudgetSpent).toBe(0);
    expect(emptySummary.budgetUtilizationRate).toBe(0);
  });
});
