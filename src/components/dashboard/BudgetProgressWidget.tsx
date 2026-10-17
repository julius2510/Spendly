'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { useFinanceStore } from '@/store/useFinanceStore';
import { filterTransactionsByPeriod, calculateBudgetStatuses } from '@/lib/calculations';
import { formatCurrency, formatPercentage } from '@/lib/formatters';
import { cn } from '@/lib/utils';

export function BudgetProgressWidget() {
  const { budgets, transactions, settings, selectedPeriod } = useFinanceStore();

  const { current } = filterTransactionsByPeriod(transactions, selectedPeriod);
  const statuses = calculateBudgetStatuses(budgets, current);

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex-row items-center justify-between pb-3">
        <div>
          <CardTitle>Budget Health</CardTitle>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Spending progress against category limits
          </p>
        </div>
        <Link
          href="/budgets"
          className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 group"
        >
          <span>Manage</span>
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </CardHeader>

      <CardContent className="pt-2 space-y-4">
        {statuses.length === 0 ? (
          <div className="py-8 text-center text-slate-400">
            <p className="text-sm font-medium">No budgets created yet</p>
            <p className="text-xs mt-1">Set monthly limits to keep spending within targets.</p>
            <Link
              href="/budgets"
              className="inline-block mt-3 text-xs font-semibold text-indigo-600 dark:text-indigo-400 underline"
            >
              Set up first budget
            </Link>
          </div>
        ) : (
          statuses.slice(0, 4).map((item) => {
            const isExceeded = item.status === 'exceeded';
            const isWarning = item.status === 'warning';
            const cappedPercentage = Math.min(100, Math.max(0, item.percentage));

            return (
              <div key={item.budget.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {item.budget.category}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {isExceeded && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900">
                        <ShieldAlert className="w-3 h-3" />
                        Exceeded
                      </span>
                    )}
                    {isWarning && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900">
                        <AlertTriangle className="w-3 h-3" />
                        Nearing Limit
                      </span>
                    )}
                    {!isExceeded && !isWarning && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
                        <CheckCircle2 className="w-3 h-3" />
                        On Track
                      </span>
                    )}
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      {formatPercentage(item.percentage, 0)}
                    </span>
                  </div>
                </div>

                {/* Progress bar container */}
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-300',
                      isExceeded && 'bg-rose-500 dark:bg-rose-500',
                      isWarning && 'bg-amber-500 dark:bg-amber-400',
                      !isExceeded && !isWarning && 'bg-indigo-600 dark:bg-indigo-500'
                    )}
                    style={{ width: `${cappedPercentage}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
                  <span>
                    Spent: {formatCurrency(item.spent, settings.currency)}
                  </span>
                  <span>
                    Cap: {formatCurrency(item.budget.monthlyLimit, settings.currency)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
