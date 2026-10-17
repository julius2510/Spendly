'use client';

import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  format,
  subMonths,
  subWeeks,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  isWithinInterval,
  parseISO,
  isValid,
} from 'date-fns';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { useFinanceStore } from '@/store/useFinanceStore';
import { formatCurrency } from '@/lib/formatters';
import { useTheme } from '@/components/theme/ThemeProvider';
import { cn } from '@/lib/utils';

type ChartInterval = 'weekly' | 'monthly' | 'yearly';

export function CashFlowChart() {
  const { transactions, settings } = useFinanceStore();
  const { resolvedTheme } = useTheme();
  const [interval, setInterval] = useState<ChartInterval>('monthly');

  const chartData = useMemo(() => {
    const now = new Date();

    if (interval === 'weekly') {
      // Last 7 weeks
      const points = [];
      for (let i = 6; i >= 0; i--) {
        const refWeek = subWeeks(now, i);
        const wStart = startOfWeek(refWeek, { weekStartsOn: settings.firstDayOfWeek });
        const wEnd = endOfWeek(refWeek, { weekStartsOn: settings.firstDayOfWeek });
        const label = `Wk ${format(wStart, 'd MMM')}`;

        let income = 0;
        let expenses = 0;

        for (const t of transactions) {
          try {
            const d = parseISO(t.date);
            if (isValid(d) && isWithinInterval(d, { start: wStart, end: wEnd })) {
              if (t.type === 'income') income += Number(t.amount) || 0;
              if (t.type === 'expense') expenses += Number(t.amount) || 0;
            }
          } catch {
            // ignore
          }
        }

        points.push({
          label,
          income: Math.round(income),
          expenses: Math.round(expenses),
          net: Math.round(income - expenses),
        });
      }
      return points;
    }

    if (interval === 'monthly') {
      // Last 6 months
      const points = [];
      for (let i = 5; i >= 0; i--) {
        const refMonth = subMonths(now, i);
        const mStart = startOfMonth(refMonth);
        const mEnd = endOfMonth(refMonth);
        const label = format(refMonth, 'MMM yyyy');

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

        points.push({
          label,
          income: Math.round(income),
          expenses: Math.round(expenses),
          net: Math.round(income - expenses),
        });
      }
      return points;
    }

    // Yearly: Last 3 years
    const currentYear = now.getFullYear();
    const years = [currentYear - 2, currentYear - 1, currentYear];
    return years.map((y) => {
      const yStart = startOfYear(new Date(y, 0, 1));
      const yEnd = endOfYear(new Date(y, 11, 31));

      let income = 0;
      let expenses = 0;

      for (const t of transactions) {
        try {
          const d = parseISO(t.date);
          if (isValid(d) && isWithinInterval(d, { start: yStart, end: yEnd })) {
            if (t.type === 'income') income += Number(t.amount) || 0;
            if (t.type === 'expense') expenses += Number(t.amount) || 0;
          }
        } catch {
          // ignore
        }
      }

      return {
        label: y.toString(),
        income: Math.round(income),
        expenses: Math.round(expenses),
        net: Math.round(income - expenses),
      };
    });
  }, [transactions, interval, settings.firstDayOfWeek]);

  const isDark = resolvedTheme === 'dark';
  const gridColor = isDark ? '#1e293b' : '#f1f5f9';
  const textColor = isDark ? '#94a3b8' : '#64748b';

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex-row items-center justify-between pb-3">
        <div>
          <CardTitle>Cash Flow Overview</CardTitle>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Compare incoming vs outgoing transactions over time
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center p-0.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/80 text-xs">
          {(['weekly', 'monthly', 'yearly'] as ChartInterval[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setInterval(mode)}
              className={cn(
                'px-2.5 py-1 rounded-md font-medium capitalize transition-all',
                interval === mode
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              )}
            >
              {mode}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        <div className="h-[280px] sm:h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: textColor, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: textColor, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(val) => formatCurrency(val, settings.currency, { compact: true })}
              />
              <Tooltip
                cursor={{ fill: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }}
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const inc = Number(payload.find((p) => p.dataKey === 'income')?.value || 0);
                    const exp = Number(payload.find((p) => p.dataKey === 'expenses')?.value || 0);
                    const net = inc - exp;

                    return (
                      <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl text-xs space-y-1.5 min-w-[170px]">
                        <p className="font-semibold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-1">
                          {label}
                        </p>
                        <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
                          <span>Income:</span>
                          <span className="font-bold">{formatCurrency(inc, settings.currency)}</span>
                        </div>
                        <div className="flex items-center justify-between text-rose-600 dark:text-rose-400">
                          <span>Expenses:</span>
                          <span className="font-bold">{formatCurrency(exp, settings.currency)}</span>
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800 font-medium text-slate-700 dark:text-slate-300">
                          <span>Net Cash:</span>
                          <span className={net >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                            {formatCurrency(net, settings.currency, { showSign: true })}
                          </span>
                        </div>
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
                iconType="circle"
              />
              <Bar
                name="Income"
                dataKey="income"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
                maxBarSize={32}
              />
              <Bar
                name="Expenses"
                dataKey="expenses"
                fill="#f43f5e"
                radius={[4, 4, 0, 0]}
                maxBarSize={32}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
