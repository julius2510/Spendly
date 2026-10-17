'use client';

import React from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { useFinanceStore } from '@/store/useFinanceStore';
import {
  filterTransactionsByPeriod,
  calculateFinancialSummary,
} from '@/lib/calculations';
import { formatCurrency, formatPercentage } from '@/lib/formatters';
import { cn } from '@/lib/utils';

export function SummaryCards() {
  const { transactions, budgets, settings, selectedPeriod } = useFinanceStore();

  const { current, previous } = filterTransactionsByPeriod(
    transactions,
    selectedPeriod
  );

  const summary = calculateFinancialSummary(
    transactions,
    current,
    previous,
    budgets,
    settings.startingBalance
  );

  const cards = [
    {
      title: 'Total Balance',
      value: formatCurrency(summary.totalBalance, settings.currency),
      description: 'Starting balance + all net transactions',
      icon: Wallet,
      iconColor: 'text-indigo-600 dark:text-indigo-400',
      iconBg: 'bg-indigo-50 dark:bg-indigo-950/60',
      change: null, // Total balance is cumulative
      periodLabel: 'Net Worth',
    },
    {
      title: 'Total Income',
      value: formatCurrency(summary.totalIncome, settings.currency),
      description: 'Inflow during selected period',
      icon: TrendingUp,
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/60',
      change: summary.hasPreviousPeriod ? summary.incomeChangePercentage : null,
      periodLabel: 'vs previous period',
    },
    {
      title: 'Total Expenses',
      value: formatCurrency(summary.totalExpenses, settings.currency),
      description: 'Outflow during selected period',
      icon: TrendingDown,
      iconColor: 'text-rose-600 dark:text-rose-400',
      iconBg: 'bg-rose-50 dark:bg-rose-950/60',
      change: summary.hasPreviousPeriod ? summary.expenseChangePercentage : null,
      isExpenseChange: true, // For expenses, a decrease is good (green)
      periodLabel: 'vs previous period',
    },
    {
      title: 'Savings Rate',
      value: formatPercentage(summary.savingsRate),
      description: 'Portion of income saved',
      icon: PiggyBank,
      iconColor: 'text-violet-600 dark:text-violet-400',
      iconBg: 'bg-violet-50 dark:bg-violet-950/60',
      change: summary.hasPreviousPeriod ? summary.savingsRateChange : null,
      isRateChange: true,
      periodLabel: 'vs previous rate',
    },
    {
      title: 'Budget Utilization',
      value:
        summary.totalBudgetLimit > 0
          ? formatPercentage(summary.budgetUtilizationRate)
          : 'No Budget',
      description:
        summary.totalBudgetLimit > 0
          ? `${formatCurrency(summary.totalBudgetSpent, settings.currency)} of ${formatCurrency(summary.totalBudgetLimit, settings.currency)}`
          : 'Create a budget to track limits',
      icon: PieChart,
      iconColor:
        summary.budgetUtilizationRate > 100
          ? 'text-rose-600 dark:text-rose-400'
          : summary.budgetUtilizationRate >= 80
          ? 'text-amber-600 dark:text-amber-400'
          : 'text-indigo-600 dark:text-indigo-400',
      iconBg:
        summary.budgetUtilizationRate > 100
          ? 'bg-rose-50 dark:bg-rose-950/60'
          : summary.budgetUtilizationRate >= 80
          ? 'bg-amber-50 dark:bg-amber-950/60'
          : 'bg-indigo-50 dark:bg-indigo-950/60',
      change: null,
      periodLabel:
        summary.budgetUtilizationRate > 100
          ? 'Limit exceeded'
          : summary.budgetUtilizationRate >= 80
          ? 'Nearing limit'
          : 'On track',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {cards.map((card, i) => {
        const Icon = card.icon;
        let isPositive = false;
        let isNegative = false;

        if (card.change !== null && card.change !== undefined) {
          if (card.isExpenseChange) {
            // Lower expense is good (positive)
            isPositive = card.change < 0;
            isNegative = card.change > 0;
          } else {
            isPositive = card.change > 0;
            isNegative = card.change < 0;
          }
        }

        return (
          <Card key={card.title} className="p-5 flex flex-col justify-between relative overflow-hidden">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {card.title}
                </span>
                <div className={cn('p-2 rounded-xl shrink-0', card.iconBg, card.iconColor)}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white truncate">
                {card.value}
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
              {card.change !== null && card.change !== undefined ? (
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      'inline-flex items-center font-semibold text-[11px] px-1.5 py-0.5 rounded-md',
                      isPositive &&
                        'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400',
                      isNegative &&
                        'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400',
                      !isPositive &&
                        !isNegative &&
                        'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    )}
                  >
                    {card.change > 0 ? (
                      <ArrowUpRight className="w-3 h-3 mr-0.5" />
                    ) : card.change < 0 ? (
                      <ArrowDownRight className="w-3 h-3 mr-0.5" />
                    ) : (
                      <Minus className="w-3 h-3 mr-0.5" />
                    )}
                    {Math.abs(card.change)}%
                  </span>
                  <span className="text-slate-400 dark:text-slate-500 text-[11px] truncate">
                    {card.periodLabel}
                  </span>
                </div>
              ) : (
                <span className="text-slate-400 dark:text-slate-500 text-[11px] truncate">
                  {card.description}
                </span>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
