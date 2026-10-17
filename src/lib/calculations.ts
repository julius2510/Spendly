import {
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfYear,
  endOfYear,
  isWithinInterval,
  parseISO,
  isValid,
} from 'date-fns';
import {
  Transaction,
  Budget,
  SavingsGoal,
  FinancialInsight,
  TimeRangeFilter,
  CurrencyCode,
} from '@/types';
import { formatCurrency, formatPercentage } from './formatters';

export interface FinancialSummary {
  startingBalance: number;
  totalBalance: number;
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  savingsRate: number;
  totalBudgetLimit: number;
  totalBudgetSpent: number;
  budgetUtilizationRate: number;
  hasPreviousPeriod: boolean;
  incomeChangePercentage: number | null;
  expenseChangePercentage: number | null;
  savingsRateChange: number | null;
}

export interface BudgetStatusItem {
  budget: Budget;
  spent: number;
  remaining: number;
  percentage: number;
  status: 'normal' | 'warning' | 'exceeded';
}

/**
 * Filter transactions by given time range
 */
export function filterTransactionsByPeriod(
  transactions: Transaction[],
  period: TimeRangeFilter,
  referenceDate: Date = new Date()
): { current: Transaction[]; previous: Transaction[] } {
  let currentStart: Date;
  let currentEnd: Date;
  let prevStart: Date;
  let prevEnd: Date;

  switch (period) {
    case 'this_month':
      currentStart = startOfMonth(referenceDate);
      currentEnd = endOfMonth(referenceDate);
      prevStart = startOfMonth(subMonths(referenceDate, 1));
      prevEnd = endOfMonth(subMonths(referenceDate, 1));
      break;
    case 'last_month': {
      const lastMonth = subMonths(referenceDate, 1);
      currentStart = startOfMonth(lastMonth);
      currentEnd = endOfMonth(lastMonth);
      prevStart = startOfMonth(subMonths(lastMonth, 1));
      prevEnd = endOfMonth(subMonths(lastMonth, 1));
      break;
    }
    case 'last_3_months':
      currentStart = startOfMonth(subMonths(referenceDate, 2));
      currentEnd = endOfMonth(referenceDate);
      prevStart = startOfMonth(subMonths(referenceDate, 5));
      prevEnd = endOfMonth(subMonths(referenceDate, 3));
      break;
    case 'last_6_months':
      currentStart = startOfMonth(subMonths(referenceDate, 5));
      currentEnd = endOfMonth(referenceDate);
      prevStart = startOfMonth(subMonths(referenceDate, 11));
      prevEnd = endOfMonth(subMonths(referenceDate, 6));
      break;
    case 'this_year':
      currentStart = startOfYear(referenceDate);
      currentEnd = endOfYear(referenceDate);
      prevStart = startOfYear(new Date(referenceDate.getFullYear() - 1, 0, 1));
      prevEnd = endOfYear(new Date(referenceDate.getFullYear() - 1, 11, 31));
      break;
    case 'all':
    default:
      return {
        current: transactions,
        previous: [],
      };
  }

  const current = transactions.filter((t) => {
    try {
      const d = parseISO(t.date);
      return isValid(d) && isWithinInterval(d, { start: currentStart, end: currentEnd });
    } catch {
      return false;
    }
  });

  const previous = transactions.filter((t) => {
    try {
      const d = parseISO(t.date);
      return isValid(d) && isWithinInterval(d, { start: prevStart, end: prevEnd });
    } catch {
      return false;
    }
  });

  return { current, previous };
}

/**
 * Calculate totals and savings rate for a transaction list
 */
export function calculateTotals(transactions: Transaction[]) {
  let income = 0;
  let expenses = 0;

  for (const t of transactions) {
    const amt = Number(t.amount) || 0;
    if (t.type === 'income') {
      income += amt;
    } else if (t.type === 'expense') {
      expenses += amt;
    }
  }

  const netSavings = income - expenses;
  // Savings Rate = (Income - Expenses) / Income * 100
  // Handle edge cases: zero income
  let savingsRate = 0;
  if (income > 0) {
    savingsRate = Math.max(-100, Math.min(100, (netSavings / income) * 100));
  } else if (expenses > 0) {
    savingsRate = -100;
  }

  return {
    income: Math.round(income * 100) / 100,
    expenses: Math.round(expenses * 100) / 100,
    netSavings: Math.round(netSavings * 100) / 100,
    savingsRate: Math.round(savingsRate * 10) / 10,
  };
}

/**
 * Calculate overall summary including comparisons with previous period
 */
export function calculateFinancialSummary(
  allTransactions: Transaction[],
  periodTransactions: Transaction[],
  previousPeriodTransactions: Transaction[],
  budgets: Budget[],
  startingBalance: number = 0
): FinancialSummary {
  // Lifetime balance based on starting balance + all transactions
  const lifetime = calculateTotals(allTransactions);
  const totalBalance = startingBalance + lifetime.netSavings;

  // Selected period totals
  const current = calculateTotals(periodTransactions);
  const previous = calculateTotals(previousPeriodTransactions);

  // Budget calculations for the current period
  const budgetStatuses = calculateBudgetStatuses(budgets, periodTransactions);
  const totalBudgetLimit = budgets.reduce((acc, b) => acc + (Number(b.monthlyLimit) || 0), 0);
  const totalBudgetSpent = budgetStatuses.reduce((acc, s) => acc + s.spent, 0);
  const budgetUtilizationRate =
    totalBudgetLimit > 0
      ? Math.round((totalBudgetSpent / totalBudgetLimit) * 1000) / 10
      : 0;

  // Comparison logic - only if previous period has actual transactions
  const hasPreviousPeriod = previousPeriodTransactions.length > 0;
  let incomeChangePercentage: number | null = null;
  let expenseChangePercentage: number | null = null;
  let savingsRateChange: number | null = null;

  if (hasPreviousPeriod) {
    if (previous.income > 0) {
      incomeChangePercentage =
        Math.round(((current.income - previous.income) / previous.income) * 1000) / 10;
    }
    if (previous.expenses > 0) {
      expenseChangePercentage =
        Math.round(((current.expenses - previous.expenses) / previous.expenses) * 1000) / 10;
    }
    savingsRateChange = Math.round((current.savingsRate - previous.savingsRate) * 10) / 10;
  }

  return {
    startingBalance,
    totalBalance,
    totalIncome: current.income,
    totalExpenses: current.expenses,
    netSavings: current.netSavings,
    savingsRate: current.savingsRate,
    totalBudgetLimit,
    totalBudgetSpent,
    budgetUtilizationRate,
    hasPreviousPeriod,
    incomeChangePercentage,
    expenseChangePercentage,
    savingsRateChange,
  };
}

/**
 * Calculate spent vs remaining for each category budget
 */
export function calculateBudgetStatuses(
  budgets: Budget[],
  transactions: Transaction[]
): BudgetStatusItem[] {
  // Sum expenses per category
  const expensesByCategory: Record<string, number> = {};
  for (const t of transactions) {
    if (t.type === 'expense') {
      const cat = t.category || 'Other Expenses';
      expensesByCategory[cat] = (expensesByCategory[cat] || 0) + (Number(t.amount) || 0);
    }
  }

  return budgets.map((b) => {
    const limit = Number(b.monthlyLimit) || 0;
    const spent = expensesByCategory[b.category] || 0;
    const remaining = Math.max(0, limit - spent);
    const percentage = limit > 0 ? Math.round((spent / limit) * 1000) / 10 : 0;

    let status: 'normal' | 'warning' | 'exceeded' = 'normal';
    if (percentage > 100) {
      status = 'exceeded';
    } else if (percentage >= 80) {
      status = 'warning';
    }

    return {
      budget: b,
      spent,
      remaining,
      percentage,
      status,
    };
  });
}

/**
 * Deterministic Financial Insights based on verified real data
 */
export function generateDeterministicInsights(
  transactions: Transaction[],
  budgets: Budget[],
  savingsGoals: SavingsGoal[],
  currency: CurrencyCode
): FinancialInsight[] {
  const insights: FinancialInsight[] = [];

  if (transactions.length < 3) {
    insights.push({
      id: 'welcome-data',
      type: 'info',
      title: 'Building Your Financial Profile',
      message:
        'Spendly generates personalized, real-time insights as you add your income and spending records.',
    });
    return insights;
  }

  const { income, expenses, savingsRate } = calculateTotals(transactions);

  // Category breakdown for expenses
  const categoryTotals: Record<string, number> = {};
  for (const t of transactions) {
    if (t.type === 'expense') {
      const cat = t.category || 'Other Expenses';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + (Number(t.amount) || 0);
    }
  }

  // Top spending category
  const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
  if (sortedCategories.length > 0 && expenses > 0) {
    const [topCat, topAmount] = sortedCategories[0];
    const topPct = Math.round((topAmount / expenses) * 100);
    if (topPct >= 20) {
      insights.push({
        id: 'top-spending-cat',
        type: 'warning',
        title: `${topCat} is Your Largest Expense`,
        message: `${topCat} accounts for ${topPct}% of your total spending (${formatCurrency(topAmount, currency)}).`,
        metric: `${topPct}%`,
      });
    }
  }

  // Savings rate insight
  if (income > 0) {
    if (savingsRate >= 20) {
      insights.push({
        id: 'savings-rate-healthy',
        type: 'positive',
        title: 'Strong Savings Habit',
        message: `Your savings rate is ${formatPercentage(savingsRate)}, exceeding the healthy benchmark of 20%.`,
        metric: formatPercentage(savingsRate),
      });
    } else if (savingsRate > 0) {
      insights.push({
        id: 'savings-rate-modest',
        type: 'info',
        title: 'Positive Net Savings',
        message: `You are saving ${formatPercentage(savingsRate)} of your income. Increasing this by 5% will accelerate your financial goals.`,
        metric: formatPercentage(savingsRate),
      });
    } else {
      insights.push({
        id: 'savings-rate-negative',
        type: 'warning',
        title: 'Expenses Exceeding Income',
        message: `Your expenses are currently outpacing your income by ${formatCurrency(Math.abs(income - expenses), currency)}. Consider reviewing non-essential spending.`,
      });
    }
  }

  // Budget warnings
  const budgetStatuses = calculateBudgetStatuses(budgets, transactions);
  const exceededBudgets = budgetStatuses.filter((s) => s.status === 'exceeded');
  const warningBudgets = budgetStatuses.filter((s) => s.status === 'warning');

  if (exceededBudgets.length > 0) {
    const names = exceededBudgets.map((b) => b.budget.category).join(', ');
    insights.push({
      id: 'budget-exceeded',
      type: 'warning',
      title: 'Budget Limit Exceeded',
      message: `You have exceeded your monthly budget for: ${names}.`,
      metric: `${exceededBudgets.length} exceeded`,
    });
  } else if (warningBudgets.length > 0) {
    const names = warningBudgets.map((b) => b.budget.category).join(', ');
    insights.push({
      id: 'budget-warning',
      type: 'tip',
      title: 'Approaching Budget Limit',
      message: `Categories nearing limit (≥80% used): ${names}.`,
    });
  }

  // Savings goals progress
  if (savingsGoals.length > 0) {
    const activeGoals = savingsGoals.filter((g) => g.currentAmount < g.targetAmount);
    if (activeGoals.length > 0) {
      const closestGoal = [...activeGoals].sort(
        (a, b) => b.currentAmount / b.targetAmount - a.currentAmount / a.targetAmount
      )[0];
      const pct = Math.round((closestGoal.currentAmount / closestGoal.targetAmount) * 100);
      insights.push({
        id: 'goal-progress',
        type: 'positive',
        title: `${closestGoal.name} Goal Progress`,
        message: `You have achieved ${pct}% of your target (${formatCurrency(closestGoal.currentAmount, currency)} of ${formatCurrency(closestGoal.targetAmount, currency)}).`,
        metric: `${pct}%`,
      });
    }
  }

  return insights;
}
