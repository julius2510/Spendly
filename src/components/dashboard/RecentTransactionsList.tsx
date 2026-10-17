'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowUpRight,
  ArrowDownLeft,
  ChevronRight,
  Receipt,
  Edit2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { useFinanceStore } from '@/store/useFinanceStore';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { cn } from '@/lib/utils';

export function RecentTransactionsList() {
  const { transactions, settings, openAddTransactionModal } = useFinanceStore();

  // Show top 6 latest transactions sorted by date
  const recent = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6);

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex-row items-center justify-between pb-3">
        <div>
          <CardTitle>Recent Transactions</CardTitle>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Click any entry to view details or edit
          </p>
        </div>
        <Link
          href="/transactions"
          className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 group"
        >
          <span>View All</span>
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </CardHeader>

      <CardContent className="pt-1">
        {recent.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center text-slate-400">
            <Receipt className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm font-medium">No recorded transactions yet</p>
            <p className="text-xs mt-1">
              Add your first transaction using the button in the header.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {recent.map((tx) => {
              const isIncome = tx.type === 'income';

              return (
                <div
                  key={tx.id}
                  onClick={() => openAddTransactionModal(tx)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      openAddTransactionModal(tx);
                    }
                  }}
                  className="py-3 px-2 flex items-center justify-between rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={cn(
                        'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105',
                        isIncome
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                          : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                      )}
                    >
                      {isIncome ? (
                        <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                      ) : (
                        <ArrowDownLeft className="w-4 h-4 stroke-[2.5]" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                        {tx.description}
                      </p>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                        <span className="font-medium text-slate-600 dark:text-slate-300">
                          {tx.category}
                        </span>
                        <span>•</span>
                        <span>{formatDate(tx.date)}</span>
                        {tx.paymentMethod && (
                          <>
                            <span>•</span>
                            <span className="hidden sm:inline">{tx.paymentMethod}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={cn(
                        'text-sm font-bold tracking-tight',
                        isIncome
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      )}
                    >
                      {isIncome ? '+' : '-'}
                      {formatCurrency(tx.amount, settings.currency)}
                    </span>
                    <Edit2 className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
