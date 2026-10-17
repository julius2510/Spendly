'use client';

import React, { useState } from 'react';
import {
  Plus,
  PiggyBank,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Edit2,
  Trash2,
  TrendingDown,
  Sparkles,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useFinanceStore } from '@/store/useFinanceStore';
import { filterTransactionsByPeriod, calculateBudgetStatuses } from '@/lib/calculations';
import { formatCurrency, formatPercentage } from '@/lib/formatters';
import { DEFAULT_EXPENSE_CATEGORIES } from '@/data/demoData';
import { useToast } from '@/components/ui/Toast';
import { Budget } from '@/types';
import { cn } from '@/lib/utils';

export default function BudgetsPage() {
  const {
    budgets,
    transactions,
    settings,
    selectedPeriod,
    addBudget,
    updateBudget,
    deleteBudget,
  } = useFinanceStore();
  const { toast } = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [category, setCategory] = useState(DEFAULT_EXPENSE_CATEGORIES[0]);
  const [limitStr, setLimitStr] = useState('');
  const [error, setError] = useState('');

  const { current } = filterTransactionsByPeriod(transactions, selectedPeriod);
  const budgetStatuses = calculateBudgetStatuses(budgets, current);

  // Overall totals
  const totalLimit = budgets.reduce((acc, b) => acc + (Number(b.monthlyLimit) || 0), 0);
  const totalSpent = budgetStatuses.reduce((acc, s) => acc + s.spent, 0);
  const totalRemaining = Math.max(0, totalLimit - totalSpent);
  const overallUtilization = totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0;

  const openCreateModal = () => {
    // Select first unused category
    const usedCats = new Set(budgets.map((b) => b.category));
    const firstAvailable =
      DEFAULT_EXPENSE_CATEGORIES.find((c) => !usedCats.has(c)) ||
      DEFAULT_EXPENSE_CATEGORIES[0];

    setEditingBudget(null);
    setCategory(firstAvailable);
    setLimitStr('');
    setError('');
    setModalOpen(true);
  };

  const openEditModal = (b: Budget) => {
    setEditingBudget(b);
    setCategory(b.category);
    setLimitStr(b.monthlyLimit.toString());
    setError('');
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanLimit = parseFloat(limitStr.replace(/[^0-9.]/g, ''));

    if (isNaN(cleanLimit) || cleanLimit <= 0) {
      setError('Please enter a valid monthly limit greater than 0.');
      return;
    }

    if (editingBudget) {
      updateBudget(editingBudget.id, {
        category,
        monthlyLimit: cleanLimit,
      });
      toast({
        title: 'Budget Updated',
        message: `Updated ${category} budget to ${formatCurrency(cleanLimit, settings.currency)}.`,
        type: 'success',
      });
    } else {
      // Check if already exists
      const existing = budgets.find((b) => b.category === category);
      if (existing) {
        setError(`A budget for ${category} already exists. Please edit it instead.`);
        return;
      }

      addBudget({
        category,
        monthlyLimit: cleanLimit,
        period: 'monthly',
      });
      toast({
        title: 'Budget Created',
        message: `Created monthly limit for ${category}.`,
        type: 'success',
      });
    }

    setModalOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    deleteBudget(id);
    toast({
      title: 'Budget Removed',
      message: `Deleted ${name} budget.`,
      type: 'info',
    });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Top Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 sm:p-5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Total Monthly Budget
            </span>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {formatCurrency(totalLimit, settings.currency)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Allocated across {budgets.length} categories
            </p>
          </Card>

          <Card className="p-4 sm:p-5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Total Budget Spent
            </span>
            <div className="text-xl sm:text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">
              {formatCurrency(totalSpent, settings.currency)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              During active period
            </p>
          </Card>

          <Card className="p-4 sm:p-5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Remaining Budget
            </span>
            <div className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {formatCurrency(totalRemaining, settings.currency)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {totalRemaining > 0 ? 'Available buffer' : 'Cap exhausted'}
            </p>
          </Card>

          <Card className="p-4 sm:p-5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Overall Utilization
            </span>
            <div
              className={cn(
                'text-xl sm:text-2xl font-bold mt-1',
                overallUtilization > 100
                  ? 'text-rose-600 dark:text-rose-400'
                  : overallUtilization >= 80
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-indigo-600 dark:text-indigo-400'
              )}
            >
              {formatPercentage(overallUtilization)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {overallUtilization > 100
                ? 'Total budget exceeded'
                : overallUtilization >= 80
                ? 'Nearing total budget limit'
                : 'Safe spending pace'}
            </p>
          </Card>
        </div>

        {/* Action Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Category Budgets ({budgets.length})
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Spending calculated from actual expense records in the selected period
            </p>
          </div>
          <Button onClick={openCreateModal} variant="primary" size="sm">
            <Plus className="w-4 h-4 mr-1" />
            Add Category Budget
          </Button>
        </div>

        {/* Budget Cards Grid */}
        {budgetStatuses.length === 0 ? (
          <Card className="p-12 text-center text-slate-400">
            <PiggyBank className="w-12 h-12 mx-auto mb-3 opacity-40 text-indigo-500" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              No budgets established yet
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
              Set spending limits on key categories like Food, Housing, and Shopping to build discipline and prevent overspending.
            </p>
            <Button onClick={openCreateModal} variant="primary" size="md">
              <Plus className="w-4 h-4 mr-1.5" />
              Create First Budget
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {budgetStatuses.map((item) => {
              const isExceeded = item.status === 'exceeded';
              const isWarning = item.status === 'warning';
              const cappedPct = Math.min(100, Math.max(0, item.percentage));

              return (
                <Card key={item.budget.id} className="p-5 flex flex-col justify-between space-y-4 hoverEffect">
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-base">
                          {item.budget.category}
                        </h3>
                        <div className="mt-1 flex items-center gap-1.5">
                          {isExceeded && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900">
                              <ShieldAlert className="w-3 h-3" />
                              Exceeded by {formatCurrency(item.spent - item.budget.monthlyLimit, settings.currency)}
                            </span>
                          )}
                          {isWarning && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900">
                              <AlertTriangle className="w-3 h-3" />
                              Nearing Limit ({formatPercentage(item.percentage, 0)})
                            </span>
                          )}
                          {!isExceeded && !isWarning && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900">
                              <CheckCircle2 className="w-3 h-3" />
                              On Track
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditModal(item.budget)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Edit budget limit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.budget.id, item.budget.category)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          title="Delete budget"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4 space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-slate-500">Utilization</span>
                        <span
                          className={cn(
                            isExceeded
                              ? 'text-rose-600 dark:text-rose-400'
                              : isWarning
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-indigo-600 dark:text-indigo-400'
                          )}
                        >
                          {formatPercentage(item.percentage)}
                        </span>
                      </div>

                      <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all duration-300',
                            isExceeded && 'bg-rose-500',
                            isWarning && 'bg-amber-500',
                            !isExceeded && !isWarning && 'bg-indigo-600'
                          )}
                          style={{ width: `${cappedPct}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Financial Metrics footer */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-3 gap-2 text-center text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">
                        Spent
                      </span>
                      <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 truncate">
                        {formatCurrency(item.spent, settings.currency)}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">
                        Limit
                      </span>
                      <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 truncate">
                        {formatCurrency(item.budget.monthlyLimit, settings.currency)}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">
                        Remaining
                      </span>
                      <p
                        className={cn(
                          'font-bold mt-0.5 truncate',
                          item.remaining > 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        )}
                      >
                        {formatCurrency(item.remaining, settings.currency)}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Add/Edit Budget Modal */}
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editingBudget ? 'Edit Monthly Budget' : 'Set Category Budget'}
          description="Establish monthly spending boundaries to keep your finances disciplined."
          maxWidth="sm"
        >
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Category
              </label>
              <select
                value={category}
                disabled={!!editingBudget}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {DEFAULT_EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Monthly Spending Limit ({settings.currency})
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                  {settings.currency === 'IDR' ? 'Rp' : '$'}
                </span>
                <input
                  type="number"
                  step={settings.currency === 'IDR' ? '50000' : '5'}
                  min="0"
                  placeholder={settings.currency === 'IDR' ? '2500000' : '250.00'}
                  value={limitStr}
                  onChange={(e) => setLimitStr(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              {error && <p className="text-xs text-rose-500 mt-1">{error}</p>}
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                {editingBudget ? 'Save Changes' : 'Create Budget'}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </AppLayout>
  );
}
