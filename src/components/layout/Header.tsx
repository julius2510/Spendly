'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import {
  Plus,
  Calendar,
  Menu,
  Sparkles,
  Info,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { useFinanceStore } from '@/store/useFinanceStore';
import { TimeRangeFilter } from '@/types';

interface HeaderProps {
  onOpenMobileMenu: () => void;
}

export function Header({ onOpenMobileMenu }: HeaderProps) {
  const pathname = usePathname();
  const {
    openAddTransactionModal,
    openResetModal,
    selectedPeriod,
    setSelectedPeriod,
    settings,
    resetToDemoData,
    clearAllData,
  } = useFinanceStore();

  const getPageInfo = () => {
    if (pathname === '/') {
      return {
        title: 'Financial Dashboard',
        subtitle: 'Overview of your net worth, cash flow, and monthly progress',
      };
    }
    if (pathname.startsWith('/transactions')) {
      return {
        title: 'Transactions',
        subtitle: 'Track, categorize, and filter every income and expense record',
      };
    }
    if (pathname.startsWith('/budgets')) {
      return {
        title: 'Monthly Budgets',
        subtitle: 'Set spending guardrails and monitor category consumption',
      };
    }
    if (pathname.startsWith('/goals')) {
      return {
        title: 'Savings Goals',
        subtitle: 'Define financial targets and track contribution progress',
      };
    }
    if (pathname.startsWith('/simulator')) {
      return {
        title: 'Financial Simulator',
        subtitle: 'Model future compound growth, recurring contributions, and scenarios',
      };
    }
    if (pathname.startsWith('/analytics')) {
      return {
        title: 'Reports & Analytics',
        subtitle: 'Deep-dive into income trends, category distributions, and metrics',
      };
    }
    if (pathname.startsWith('/settings')) {
      return {
        title: 'Preferences & Storage',
        subtitle: 'Configure currency, theme, demo datasets, and browser data',
      };
    }
    return {
      title: 'Spendly',
      subtitle: 'Personal Finance and Simulator',
    };
  };

  const pageInfo = getPageInfo();

  return (
    <header className="sticky top-0 z-20 bg-white/90 dark:bg-[#090d16]/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-4 sm:px-6 py-3.5 transition-colors">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile hamburger + Page Title */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none"
            aria-label="Open mobile menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              {pageInfo.title}
            </h1>
            <p className="hidden md:block text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {pageInfo.subtitle}
            </p>
          </div>
        </div>

        {/* Right: Actions, Period selector, Theme, Add Tx button */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Period selector (shown on relevant pages) */}
          {(pathname === '/' || pathname.startsWith('/analytics') || pathname.startsWith('/budgets')) && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value as TimeRangeFilter)}
                className="bg-transparent border-none text-xs font-medium focus:outline-none cursor-pointer"
                aria-label="Select reporting period"
              >
                <option value="this_month">This Month</option>
                <option value="last_month">Last Month</option>
                <option value="last_3_months">Last 3 Months</option>
                <option value="last_6_months">Last 6 Months</option>
                <option value="this_year">This Year</option>
                <option value="all">All Time</option>
              </select>
            </div>
          )}

          {/* Theme switcher */}
          <ThemeToggle variant="segmented" />

          {/* Refresh / Start from 0 button */}
          <Button
            onClick={openResetModal}
            variant="outline"
            size="md"
            className="text-xs font-semibold text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 shrink-0"
            title="Refresh and start from 0"
          >
            <RotateCcw className="w-3.5 h-3.5 sm:mr-1" />
            <span className="hidden md:inline">Start from 0</span>
          </Button>

          {/* Prominent Add Transaction Action */}
          <Button
            onClick={() => openAddTransactionModal(null)}
            variant="primary"
            size="md"
            className="shadow-sm shadow-indigo-500/25 shrink-0"
          >
            <Plus className="w-4 h-4 sm:mr-1 stroke-[2.5]" />
            <span className="hidden sm:inline">Add Transaction</span>
          </Button>
        </div>
      </div>

      {/* Demo Data Banner if in demo mode */}
      {settings.isDemoData && (
        <div className="mt-2.5 -mb-1 px-3 py-1.5 rounded-lg bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/70 dark:border-indigo-900/60 flex items-center justify-between text-xs text-indigo-900 dark:text-indigo-200">
          <div className="flex items-center gap-2 truncate">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span className="truncate">
              Exploring demo dataset with preloaded sample finances. All interactions and calculations are active.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-3">
            <button
              onClick={clearAllData}
              className="text-[11px] underline font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700"
            >
              Clear & Start Fresh
            </button>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <button
              onClick={resetToDemoData}
              className="text-[11px] underline font-medium hover:text-indigo-700 dark:hover:text-indigo-300"
            >
              Reload Demo
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
