'use client';

import React, { useMemo, useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  PieChart as PieIcon,
  Download,
  Calendar,
  Layers,
  FileSpreadsheet,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  Activity,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  format,
  subMonths,
  startOfMonth,
  endOfMonth,
  parseISO,
  isWithinInterval,
  isValid,
} from 'date-fns';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useFinanceStore } from '@/store/useFinanceStore';
import { filterTransactionsByPeriod, calculateTotals } from '@/lib/calculations';
import { formatCurrency, formatPercentage } from '@/lib/formatters';
import { useTheme } from '@/components/theme/ThemeProvider';
import { useToast } from '@/components/ui/Toast';
import { TimeRangeFilter } from '@/types';

const CATEGORY_COLORS = [
  '#6366f1',
  '#ec4899',
  '#06b6d4',
  '#f59e0b',
  '#10b981',
  '#8b5cf6',
  '#f43f5e',
  '#3b82f6',
  '#14b8a6',
];

export default function AnalyticsPage() {
  const { transactions, settings, selectedPeriod, setSelectedPeriod } = useFinanceStore();
  const { resolvedTheme } = useTheme();
  const { toast } = useToast();

  const { current, previous } = filterTransactionsByPeriod(transactions, selectedPeriod);

  // Core metrics
  const currentTotals = calculateTotals(current);
  const previousTotals = calculateTotals(previous);

  const expenseTx = current.filter((t) => t.type === 'expense');
  const avgExpenseTx =
    expenseTx.length > 0
      ? Math.round(currentTotals.expenses / expenseTx.length)
      : 0;

  // Monthly trends (Last 6 months)
  const monthlyTrends = useMemo(() => {
    const points = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const refMonth = subMonths(now, i);
      const mStart = startOfMonth(refMonth);
      const mEnd = endOfMonth(refMonth);
      const monthLabel = format(refMonth, 'MMM yyyy');

      let income = 0;
      let expenses = 0;

      for (const t of transactions) {
        try {
          const d = parseISO(t.date);
          if (isValid(d) && isWithinInterval(d, { start: mStart, end: mEnd })) {
            if (t.type === 'income') income += Number(t.amount) || 0;
            if (t.type === 'expense') expenses += Number(t.amount) || 0;
          }
        } catch {
          // ignore
        }
      }

      const savingsRate = income > 0 ? Math.round(((income - expenses) / income) * 100) : 0;

      points.push({
        month: monthLabel,
        income: Math.round(income),
        expenses: Math.round(expenses),
        savings: Math.round(income - expenses),
        savingsRate: Math.max(-100, Math.min(100, savingsRate)),
      });
    }
    return points;
  }, [transactions]);

  // Category breakdown
  const categoryData = useMemo(() => {
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

    return Object.entries(totals)
      .map(([name, value], idx) => ({
        name,
        value: Math.round(value),
        percentage: total > 0 ? (value / total) * 100 : 0,
        color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
      }))
      .sort((a, b) => b.value - a.value);
  }, [current]);

  const isDark = resolvedTheme === 'dark';
  const gridColor = isDark ? '#1e293b' : '#f1f5f9';
  const textColor = isDark ? '#94a3b8' : '#64748b';

  const exportAnalyticsCSV = () => {
    if (current.length === 0) {
      toast({
        title: 'Export Failed',
        message: 'No data to export for selected timeframe.',
        type: 'error',
      });
      return;
    }

    const headers = ['Category', 'Spent Amount', 'Percentage of Total'];
    const rows = categoryData.map((c) => [
      `"${c.name}"`,
      c.value,
      `"${c.percentage.toFixed(1)}%"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `spendly_category_breakdown_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Report Downloaded',
      message: 'Category analysis exported to CSV.',
      type: 'success',
    });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Reports & Financial Analytics
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Deep-dive metrics, historical savings rates, and category distribution
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as TimeRangeFilter)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="last_3_months">Last 3 Months</option>
              <option value="last_6_months">Last 6 Months</option>
              <option value="this_year">This Year</option>
              <option value="all">All Time</option>
            </select>

            <Button onClick={exportAnalyticsCSV} variant="outline" size="sm" className="text-xs">
              <Download className="w-3.5 h-3.5 mr-1" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Analytics Key Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="p-4">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Recorded Transactions
            </span>
            <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
              {current.length}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {expenseTx.length} expenses • {current.length - expenseTx.length} income
            </p>
          </Card>

          <Card className="p-4">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Avg. Expense per Transaction
            </span>
            <div className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-1 truncate">
              {formatCurrency(avgExpenseTx, settings.currency)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Based on active period
            </p>
          </Card>

          <Card className="p-4">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Savings Rate
            </span>
            <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {formatPercentage(currentTotals.savingsRate)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Benchmark: &gt; 20%
            </p>
          </Card>

          <Card className="p-4">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Top Category
            </span>
            <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-1 truncate">
              {categoryData.length > 0 ? categoryData[0].name : '—'}
            </div>
            <p className="text-[11px] text-slate-400 mt-1 truncate">
              {categoryData.length > 0
                ? `${formatCurrency(categoryData[0].value, settings.currency)} (${formatPercentage(
                    categoryData[0].percentage,
                    0
                  )})`
                : 'No expense records'}
            </p>
          </Card>
        </div>

        {/* 6-Month Income vs Expense Trend Bar Chart */}
        <Card className="p-5">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <CardTitle className="text-sm">Monthly Income vs. Spending Trends</CardTitle>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Side-by-side historical performance across the last 6 months
              </p>
            </div>
          </div>

          <div className="h-[280px] sm:h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTrends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fill: textColor, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: textColor, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) =>
                    formatCurrency(val, settings.currency, { compact: true })
                  }
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const inc = Number(payload.find((p) => p.dataKey === 'income')?.value || 0);
                      const exp = Number(payload.find((p) => p.dataKey === 'expenses')?.value || 0);
                      return (
                        <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl text-xs space-y-1">
                          <p className="font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-1">
                            {label}
                          </p>
                          <p className="text-emerald-600 font-semibold">
                            Income: {formatCurrency(inc, settings.currency)}
                          </p>
                          <p className="text-rose-600 font-semibold">
                            Expenses: {formatCurrency(exp, settings.currency)}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ paddingBottom: '12px', fontSize: '11px' }}
                />
                <Bar name="Income" dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={36} />
                <Bar name="Expenses" dataKey="expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Savings Rate History Line Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6">
            <Card className="p-5 h-full flex flex-col justify-between">
              <div>
                <CardTitle className="text-sm">Savings Rate History</CardTitle>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Percentage of monthly income saved over time
                </p>
                <div className="h-[220px] sm:h-[240px] w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyTrends}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                      <XAxis
                        dataKey="month"
                        tick={{ fill: textColor, fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: textColor, fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                        unit="%"
                      />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl text-xs">
                                <p className="font-bold text-slate-900 dark:text-white">{label}</p>
                                <p className="text-indigo-600 font-bold mt-1">
                                  Savings Rate: {payload[0].value}%
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="savingsRate"
                        stroke="#6366f1"
                        strokeWidth={2.5}
                        dot={{ r: 4, fill: '#6366f1' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-6">
            <Card className="p-5 h-full flex flex-col">
              <CardTitle className="text-sm">Highest Spending Categories</CardTitle>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Itemized ranking for {selectedPeriod.replace(/_/g, ' ')}
              </p>

              <div className="mt-4 flex-1 overflow-y-auto space-y-2 max-h-[240px]">
                {categoryData.length === 0 ? (
                  <p className="text-xs text-slate-400 py-8 text-center">
                    No expense records found.
                  </p>
                ) : (
                  categoryData.map((item, idx) => (
                    <div
                      key={item.name}
                      className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-white dark:bg-slate-700 flex items-center justify-center font-bold text-[10px] text-slate-500">
                          #{idx + 1}
                        </span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {item.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {formatCurrency(item.value, settings.currency)}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-400 w-12 text-right">
                          {formatPercentage(item.percentage, 0)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
