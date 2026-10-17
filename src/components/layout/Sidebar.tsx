'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ArrowLeftRight,
  PiggyBank,
  Target,
  Sparkles,
  BarChart3,
  Settings,
  ShieldCheck,
  TrendingUp,
  RotateCcw,
} from 'lucide-react';
import { useFinanceStore } from '@/store/useFinanceStore';
import { calculateTotals } from '@/lib/calculations';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const pathname = usePathname();
  const { transactions, settings, openResetModal } = useFinanceStore();

  const { income, expenses } = calculateTotals(transactions);
  const currentBalance = (settings.startingBalance || 0) + (income - expenses);

  const navigation = [
    {
      name: 'Dashboard',
      href: '/',
      icon: LayoutDashboard,
      active: pathname === '/',
    },
    {
      name: 'Transactions',
      href: '/transactions',
      icon: ArrowLeftRight,
      badge: transactions.length > 0 ? transactions.length.toString() : undefined,
      active: pathname.startsWith('/transactions'),
    },
    {
      name: 'Budgets',
      href: '/budgets',
      icon: PiggyBank,
      active: pathname.startsWith('/budgets'),
    },
    {
      name: 'Savings Goals',
      href: '/goals',
      icon: Target,
      active: pathname.startsWith('/goals'),
    },
    {
      name: 'Simulator',
      href: '/simulator',
      icon: Sparkles,
      highlight: true,
      active: pathname.startsWith('/simulator'),
    },
    {
      name: 'Reports & Analytics',
      href: '/analytics',
      icon: BarChart3,
      active: pathname.startsWith('/analytics'),
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Settings,
      active: pathname.startsWith('/settings'),
    },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0c1220] h-screen sticky top-0 shrink-0 select-none z-30">
      {/* Brand Header */}
      <div className="p-6 pb-5 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800/60">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/25">
          <TrendingUp className="w-5 h-5 stroke-[2.5]" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">
              Spendly
            </span>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold tracking-wide uppercase bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60">
              Pro
            </span>
          </div>
          <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
            Finance & Simulator
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Main Menu
        </div>
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                item.active
                  ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              )}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    'w-4 h-4 transition-colors',
                    item.active
                      ? 'text-indigo-600 dark:text-indigo-400'
                      : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                  )}
                />
                <span>{item.name}</span>
              </div>

              {item.highlight && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 animate-pulse">
                  SIM
                </span>
              )}

              {item.badge && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Balance Widget & Privacy Footer */}
      <div className="p-4 m-3 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800/80 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Total Net Balance
            </div>
            <div className="text-base font-bold text-slate-900 dark:text-white mt-0.5 tracking-tight truncate">
              {formatCurrency(currentBalance, settings.currency)}
            </div>
          </div>
          <button
            type="button"
            onClick={openResetModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            title="Refresh and start from 0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Local & Private</span>
          </span>
          <span className="font-semibold text-indigo-600 dark:text-indigo-400">
            {settings.currency}
          </span>
        </div>
      </div>
    </aside>
  );
}
