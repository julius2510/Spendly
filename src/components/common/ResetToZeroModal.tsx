'use client';

import React from 'react';
import { RotateCcw, AlertTriangle, Trash2, ArrowRight } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useFinanceStore } from '@/store/useFinanceStore';
import { formatCurrency } from '@/lib/formatters';
import { calculateTotals } from '@/lib/calculations';
import { useToast } from '@/components/ui/Toast';

export function ResetToZeroModal() {
  const {
    isResetModalOpen,
    closeResetModal,
    clearAllData,
    transactions,
    budgets,
    savingsGoals,
    settings,
  } = useFinanceStore();

  const { toast } = useToast();

  const { income, expenses } = calculateTotals(transactions);
  const currentBalance = (settings.startingBalance || 0) + (income - expenses);

  const handleConfirmReset = () => {
    clearAllData();
    toast({
      title: 'Ledger Reset to 0',
      message: 'All transactions, budgets, and goals have been cleared. Ready for fresh input.',
      type: 'info',
    });
  };

  return (
    <Modal
      isOpen={isResetModalOpen}
      onClose={closeResetModal}
      title="Refresh & Start from 0"
      description="Reset your financial workspace to zero to start fresh with clean records."
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Warning Badge */}
        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold">Are you sure you want to start from 0?</span>
            <p className="mt-0.5 opacity-90">
              This action will clear all current transaction history, custom budgets, and savings goals from this browser. Your display theme and currency preferences will be preserved.
            </p>
          </div>
        </div>

        {/* Current State Summary that will be reset */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-2.5 text-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Current Records to be Cleared
          </span>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 font-medium">Recorded Transactions</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-bold text-slate-900 dark:text-white">
                  {transactions.length}
                </span>
                <ArrowRight className="w-3 h-3 text-slate-400" />
                <span className="font-bold text-rose-600 dark:text-rose-400">0</span>
              </div>
            </div>

            <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 font-medium">Current Net Balance</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-bold text-slate-900 dark:text-white truncate">
                  {formatCurrency(currentBalance, settings.currency, { compact: true })}
                </span>
                <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="font-bold text-rose-600 dark:text-rose-400">
                  {formatCurrency(0, settings.currency)}
                </span>
              </div>
            </div>

            <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 font-medium">Active Budgets</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-bold text-slate-900 dark:text-white">
                  {budgets.length}
                </span>
                <ArrowRight className="w-3 h-3 text-slate-400" />
                <span className="font-bold text-rose-600 dark:text-rose-400">0</span>
              </div>
            </div>

            <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 font-medium">Savings Goals</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-bold text-slate-900 dark:text-white">
                  {savingsGoals.length}
                </span>
                <ArrowRight className="w-3 h-3 text-slate-400" />
                <span className="font-bold text-rose-600 dark:text-rose-400">0</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="pt-2 flex items-center justify-end gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={closeResetModal}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            size="md"
            onClick={handleConfirmReset}
            className="shadow-sm shadow-rose-500/20"
          >
            <RotateCcw className="w-4 h-4 mr-1.5" />
            Confirm & Start from 0
          </Button>
        </div>
      </div>
    </Modal>
  );
}
