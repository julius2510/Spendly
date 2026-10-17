export type CurrencyCode = 'IDR' | 'USD';

export type TransactionType = 'income' | 'expense';

export type IncomeCategory =
  | 'Salary'
  | 'Freelance'
  | 'Business'
  | 'Investment Income'
  | 'Bonus & Gifts'
  | 'Other Income';

export type ExpenseCategory =
  | 'Housing'
  | 'Food & Dining'
  | 'Transportation'
  | 'Utilities'
  | 'Shopping'
  | 'Entertainment'
  | 'Healthcare'
  | 'Education'
  | 'Subscriptions'
  | 'Personal Care'
  | 'Travel'
  | 'Other Expenses';

export type TransactionCategory = IncomeCategory | ExpenseCategory | string;

export interface Transaction {
  id: string;
  description: string;
  amount: number; // Stored as a positive number in currency base unit (e.g. 150000 IDR or 45.50 USD)
  type: TransactionType;
  category: TransactionCategory;
  date: string; // ISO 'YYYY-MM-DD'
  paymentMethod?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  id: string;
  category: string;
  monthlyLimit: number;
  period: 'monthly';
  createdAt: string;
  updatedAt: string;
}

export interface GoalContribution {
  id: string;
  amount: number;
  date: string;
  note?: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string; // ISO 'YYYY-MM-DD'
  category?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  contributions: GoalContribution[];
}

export interface SimulatorScenario {
  id: string;
  name: string;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlySavings: number;
  initialSavings: number;
  annualInterestRate: number; // percentage (e.g., 6.5 for 6.5%)
  durationYears: number;
  incomeGrowthRate: number; // % annual growth
  expenseGrowthRate: number; // % annual growth
}

export interface UserSettings {
  currency: CurrencyCode;
  firstDayOfWeek: 0 | 1; // 0: Sunday, 1: Monday
  themePreference: 'light' | 'dark' | 'system';
  isDemoData: boolean;
  startingBalance: number;
}

export interface FinancialInsight {
  id: string;
  type: 'info' | 'positive' | 'warning' | 'tip';
  title: string;
  message: string;
  metric?: string;
}

export type TimeRangeFilter =
  | 'this_month'
  | 'last_month'
  | 'last_3_months'
  | 'last_6_months'
  | 'this_year'
  | 'all';
