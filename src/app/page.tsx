'use client';

import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { SummaryCards } from '@/components/dashboard/SummaryCards';
import { CashFlowChart } from '@/components/dashboard/CashFlowChart';
import { SpendingBreakdownChart } from '@/components/dashboard/SpendingBreakdownChart';
import { RecentTransactionsList } from '@/components/dashboard/RecentTransactionsList';
import { BudgetProgressWidget } from '@/components/dashboard/BudgetProgressWidget';
import { FinancialInsightsWidget } from '@/components/dashboard/FinancialInsightsWidget';

import { Plus, Sparkles, Wallet } from 'lucide-react';
import { useFinanceStore } from '@/store/useFinanceStore';
import { Button } from '@/components/ui/Button';

export default function DashboardPage() {
  const { transactions, openAddTransactionModal, resetToDemoData } = useFinanceStore();

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Clean Start Welcome Banner when 0 transactions */}
        {transactions.length === 0 && (
          <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-emerald-500/10 border border-indigo-200/60 dark:border-indigo-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-indigo-500/25">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  Welcome to Spendly! You are starting with 0 transactions.
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Record your income and expenses to unlock live cash flow charts, budget health, and insights.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto">
              <Button
                onClick={() => openAddTransactionModal(null)}
                variant="primary"
                size="sm"
                className="text-xs flex-1 sm:flex-none shadow-sm shadow-indigo-500/20"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add First Transaction
              </Button>
              <Button
                onClick={resetToDemoData}
                variant="outline"
                size="sm"
                className="text-xs flex-1 sm:flex-none"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1" />
                Preview Sample Data
              </Button>
            </div>
          </div>
        )}

        {/* Top 5 Summary Metrics */}
        <SummaryCards />

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7">
            <CashFlowChart />
          </div>
          <div className="lg:col-span-5">
            <SpendingBreakdownChart />
          </div>
        </div>

        {/* Recent Transactions & Budget Progress Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7">
            <RecentTransactionsList />
          </div>
          <div className="lg:col-span-5">
            <BudgetProgressWidget />
          </div>
        </div>

        {/* Deterministic Financial Insights */}
        <FinancialInsightsWidget />
      </div>
    </AppLayout>
  );
}
