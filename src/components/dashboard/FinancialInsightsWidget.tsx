'use client';

import React from 'react';
import { Sparkles, TrendingUp, AlertCircle, Lightbulb, Info } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { useFinanceStore } from '@/store/useFinanceStore';
import {
  filterTransactionsByPeriod,
  generateDeterministicInsights,
} from '@/lib/calculations';
import { cn } from '@/lib/utils';

export function FinancialInsightsWidget() {
  const { transactions, budgets, savingsGoals, settings, selectedPeriod } = useFinanceStore();

  const { current } = filterTransactionsByPeriod(transactions, selectedPeriod);

  const insights = generateDeterministicInsights(
    current,
    budgets,
    savingsGoals,
    settings.currency
  );

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <CardTitle>Financial Insights</CardTitle>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Deterministic observations calculated from your real transactions
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {insights.map((insight) => {
            const icons = {
              positive: TrendingUp,
              warning: AlertCircle,
              tip: Lightbulb,
              info: Info,
            };
            const Icon = icons[insight.type] || Info;

            return (
              <div
                key={insight.id}
                className={cn(
                  'p-3.5 rounded-xl border transition-all text-xs flex flex-col justify-between space-y-2',
                  insight.type === 'positive' &&
                    'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-200/70 dark:border-emerald-800/60 text-emerald-950 dark:text-emerald-100',
                  insight.type === 'warning' &&
                    'bg-amber-50/50 dark:bg-amber-950/30 border-amber-200/70 dark:border-amber-800/60 text-amber-950 dark:text-amber-100',
                  insight.type === 'tip' &&
                    'bg-indigo-50/50 dark:bg-indigo-950/30 border-indigo-200/70 dark:border-indigo-800/60 text-indigo-950 dark:text-indigo-100',
                  insight.type === 'info' &&
                    'bg-slate-50 dark:bg-slate-800/40 border-slate-200/70 dark:border-slate-800 text-slate-900 dark:text-slate-100'
                )}
              >
                <div>
                  <div className="flex items-center justify-between font-semibold mb-1">
                    <span className="flex items-center gap-1.5">
                      <Icon className="w-4 h-4 shrink-0" />
                      {insight.title}
                    </span>
                    {insight.metric && (
                      <span className="px-1.5 py-0.5 rounded bg-white/70 dark:bg-black/40 text-[10px] font-bold">
                        {insight.metric}
                      </span>
                    )}
                  </div>
                  <p className="opacity-90 leading-relaxed">{insight.message}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
