'use client';

import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { useFinanceStore } from '@/store/useFinanceStore';
import { filterTransactionsByPeriod } from '@/lib/calculations';
import { formatCurrency, formatPercentage } from '@/lib/formatters';
import { useTheme } from '@/components/theme/ThemeProvider';
import { Modal } from '@/components/ui/Modal';
import { formatDate } from '@/lib/formatters';

const CATEGORY_COLORS = [
  '#6366f1', // Indigo
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#8b5cf6', // Purple
  '#f43f5e', // Rose
  '#3b82f6', // Blue
  '#14b8a6', // Teal
  '#f97316', // Orange
  '#84cc16', // Lime
  '#64748b', // Slate
];

export function SpendingBreakdownChart() {
  const router = useRouter();
  const { transactions, settings, selectedPeriod } = useFinanceStore();
  const { resolvedTheme } = useTheme();

  const [selectedCategoryModal, setSelectedCategoryModal] = useState<string | null>(null);

  const { current } = filterTransactionsByPeriod(transactions, selectedPeriod);

  const { data, totalExpenses } = useMemo(() => {
    const totals: Record<string, number> = {};
    let total = 0;

    for (const t of current) {
      if (t.type === 'expense') {
        const cat = t.category || 'Other Expenses';
        const amt = Number(t.amount) || 0;
        totals[cat] = (totals[cat] || 0) + amt;
        total += amt;
      }
    }

    const items = Object.entries(totals)
      .map(([name, value], idx) => ({
        name,
        value: Math.round(value),
        percentage: total > 0 ? (value / total) * 100 : 0,
        color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
      }))
      .sort((a, b) => b.value - a.value);

    return { data: items, totalExpenses: total };
  }, [current]);

  const categoryTransactions = useMemo(() => {
    if (!selectedCategoryModal) return [];
    return current.filter(
      (t) => t.type === 'expense' && t.category === selectedCategoryModal
    );
  }, [current, selectedCategoryModal]);

  return (
    <>
      <Card className="flex flex-col">
        <CardHeader className="flex-row items-center justify-between pb-3">
          <div>
            <CardTitle>Spending by Category</CardTitle>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Click a slice to view itemized category expenses
            </p>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            {data.length} Categories
          </span>
        </CardHeader>

        <CardContent className="pt-2">
          {data.length === 0 ? (
            <div className="h-[280px] sm:h-[320px] flex flex-col items-center justify-center text-center p-6 text-slate-400 dark:text-slate-500">
              <p className="text-sm font-medium">No expense records found</p>
              <p className="text-xs mt-1">
                Add an expense transaction to view category distribution
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              {/* Donut Chart */}
              <div className="md:col-span-6 h-[220px] sm:h-[240px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={3}
                      dataKey="value"
                      onClick={(entry) => setSelectedCategoryModal(entry?.name || null)}
                      cursor="pointer"
                    >
                      {data.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          stroke={resolvedTheme === 'dark' ? '#0f172a' : '#ffffff'}
                          strokeWidth={2}
                          className="transition-opacity hover:opacity-80"
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const item = payload[0].payload;
                          return (
                            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl text-xs space-y-1">
                              <p className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                                <span
                                  className="w-2.5 h-2.5 rounded-full"
                                  style={{ backgroundColor: item.color }}
                                />
                                {item.name}
                              </p>
                              <p className="text-slate-600 dark:text-slate-300 font-bold">
                                {formatCurrency(item.value, settings.currency)}
                              </p>
                              <p className="text-[11px] text-slate-400">
                                {formatPercentage(item.percentage)} of total expenses
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                {/* Center metric */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Total
                  </span>
                  <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
                    {formatCurrency(totalExpenses, settings.currency, { compact: true })}
                  </span>
                </div>
              </div>

              {/* Legend & List */}
              <div className="md:col-span-6 max-h-[220px] sm:max-h-[240px] overflow-y-auto space-y-1.5 pr-2">
                {data.map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setSelectedCategoryModal(item.name)}
                    className="w-full flex items-center justify-between p-2 rounded-xl text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-xs group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="font-medium text-slate-700 dark:text-slate-300 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                        {item.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 text-right">
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {formatCurrency(item.value, settings.currency)}
                      </span>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 w-10 text-right">
                        {formatPercentage(item.percentage, 0)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Itemized Category Breakdown Modal */}
      <Modal
        isOpen={!!selectedCategoryModal}
        onClose={() => setSelectedCategoryModal(null)}
        title={selectedCategoryModal || 'Category Details'}
        description={`Itemized transactions for ${selectedCategoryModal} during selected period.`}
        maxWidth="lg"
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs">
            <span className="text-slate-500 dark:text-slate-400">Category Spending Total</span>
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              {formatCurrency(
                categoryTransactions.reduce((acc, t) => acc + (Number(t.amount) || 0), 0),
                settings.currency
              )}
            </span>
          </div>

          <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {categoryTransactions.length === 0 ? (
              <p className="text-center py-6 text-xs text-slate-400">
                No individual records found in this category.
              </p>
            ) : (
              categoryTransactions.map((tx) => (
                <div key={tx.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      {tx.description}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {formatDate(tx.date)} • {tx.paymentMethod || 'Other'}
                    </p>
                  </div>
                  <span className="font-bold text-rose-600 dark:text-rose-400">
                    -{formatCurrency(tx.amount, settings.currency)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>
    </>
  );
}
