'use client';

import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Target,
  Plus,
  Calendar,
  CheckCircle2,
  TrendingUp,
  DollarSign,
  Edit2,
  Trash2,
  Sparkles,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { differenceInMonths, differenceInDays, parseISO, isValid } from 'date-fns';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useFinanceStore } from '@/store/useFinanceStore';
import { formatCurrency, formatPercentage, formatDate } from '@/lib/formatters';
import { useToast } from '@/components/ui/Toast';
import { SavingsGoal } from '@/types';
import { cn } from '@/lib/utils';

export default function GoalsPage() {
  const {
    savingsGoals,
    settings,
    addSavingsGoal,
    updateSavingsGoal,
    deleteSavingsGoal,
    contributeToGoal,
  } = useFinanceStore();
  const { toast } = useToast();

  // Modal states
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [contributionModalOpen, setContributionModalOpen] = useState(false);
  const [selectedGoalForContrib, setSelectedGoalForContrib] = useState<SavingsGoal | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [targetAmountStr, setTargetAmountStr] = useState('');
  const [currentAmountStr, setCurrentAmountStr] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [category, setCategory] = useState('Personal');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState('');

  // Contribution form states
  const [contribAmountStr, setContribAmountStr] = useState('');
  const [contribNote, setContribNote] = useState('');
  const [contribError, setContribError] = useState('');

  // Totals
  const totalTarget = savingsGoals.reduce((acc, g) => acc + (Number(g.targetAmount) || 0), 0);
  const totalSaved = savingsGoals.reduce((acc, g) => acc + (Number(g.currentAmount) || 0), 0);
  const totalRemaining = Math.max(0, totalTarget - totalSaved);
  const overallProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

  const openCreateGoalModal = () => {
    setEditingGoal(null);
    setName('');
    setTargetAmountStr('');
    setCurrentAmountStr('0');
    setTargetDate('');
    setCategory('General');
    setDescription('');
    setFormError('');
    setGoalModalOpen(true);
  };

  const openEditGoalModal = (g: SavingsGoal) => {
    setEditingGoal(g);
    setName(g.name);
    setTargetAmountStr(g.targetAmount.toString());
    setCurrentAmountStr(g.currentAmount.toString());
    setTargetDate(g.targetDate || '');
    setCategory(g.category || 'General');
    setDescription(g.description || '');
    setFormError('');
    setGoalModalOpen(true);
  };

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTarget = parseFloat(targetAmountStr.replace(/[^0-9.]/g, ''));
    const cleanCurrent = parseFloat(currentAmountStr.replace(/[^0-9.]/g, '') || '0');

    if (!name.trim()) {
      setFormError('Goal name is required.');
      return;
    }
    if (isNaN(cleanTarget) || cleanTarget <= 0) {
      setFormError('Target amount must be greater than 0.');
      return;
    }
    if (isNaN(cleanCurrent) || cleanCurrent < 0) {
      setFormError('Current saved amount cannot be negative.');
      return;
    }

    if (editingGoal) {
      updateSavingsGoal(editingGoal.id, {
        name: name.trim(),
        targetAmount: cleanTarget,
        currentAmount: cleanCurrent,
        targetDate: targetDate || undefined,
        category: category.trim() || undefined,
        description: description.trim() || undefined,
      });
      toast({
        title: 'Goal Updated',
        message: `Saved changes to "${name}".`,
        type: 'success',
      });
    } else {
      addSavingsGoal({
        name: name.trim(),
        targetAmount: cleanTarget,
        currentAmount: cleanCurrent,
        targetDate: targetDate || undefined,
        category: category.trim() || undefined,
        description: description.trim() || undefined,
      });
      toast({
        title: 'Goal Created',
        message: `Added new savings goal: "${name}".`,
        type: 'success',
      });
    }

    setGoalModalOpen(false);
  };

  const openContributeModal = (g: SavingsGoal) => {
    setSelectedGoalForContrib(g);
    setContribAmountStr('');
    setContribNote('');
    setContribError('');
    setContributionModalOpen(true);
  };

  const handleSaveContribution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoalForContrib) return;

    const cleanAmt = parseFloat(contribAmountStr.replace(/[^0-9.]/g, ''));
    if (isNaN(cleanAmt) || cleanAmt <= 0) {
      setContribError('Contribution amount must be greater than 0.');
      return;
    }

    contributeToGoal(selectedGoalForContrib.id, cleanAmt, contribNote);

    const willBeCompleted =
      selectedGoalForContrib.currentAmount + cleanAmt >= selectedGoalForContrib.targetAmount;

    if (willBeCompleted) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
      toast({
        title: '🎉 Goal Achieved!',
        message: `Congratulations! You have reached 100% of your "${selectedGoalForContrib.name}" target!`,
        type: 'success',
      });
    } else {
      toast({
        title: 'Contribution Recorded',
        message: `Added ${formatCurrency(cleanAmt, settings.currency)} to "${selectedGoalForContrib.name}".`,
        type: 'success',
      });
    }

    setContributionModalOpen(false);
  };

  const handleDeleteGoal = (id: string, name: string) => {
    deleteSavingsGoal(id);
    toast({
      title: 'Goal Removed',
      message: `Deleted "${name}".`,
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
              Total Target Value
            </span>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {formatCurrency(totalTarget, settings.currency)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Across {savingsGoals.length} savings goals
            </p>
          </Card>

          <Card className="p-4 sm:p-5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Total Amount Saved
            </span>
            <div className="text-xl sm:text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
              {formatCurrency(totalSaved, settings.currency)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Accumulated reserve
            </p>
          </Card>

          <Card className="p-4 sm:p-5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Remaining to Reach Targets
            </span>
            <div className="text-xl sm:text-2xl font-bold text-slate-700 dark:text-slate-300 mt-1">
              {formatCurrency(totalRemaining, settings.currency)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Required future allocations
            </p>
          </Card>

          <Card className="p-4 sm:p-5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Overall Goal Completion
            </span>
            <div className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {formatPercentage(overallProgress)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {savingsGoals.filter((g) => g.currentAmount >= g.targetAmount).length} of{' '}
              {savingsGoals.length} completed
            </p>
          </Card>
        </div>

        {/* Action Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Your Goals ({savingsGoals.length})
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Track progress, make planning contributions, and view estimated monthly required savings
            </p>
          </div>
          <Button onClick={openCreateGoalModal} variant="primary" size="sm">
            <Plus className="w-4 h-4 mr-1" />
            New Savings Target
          </Button>
        </div>

        {/* Goals Grid */}
        {savingsGoals.length === 0 ? (
          <Card className="p-12 text-center text-slate-400">
            <Target className="w-12 h-12 mx-auto mb-3 opacity-40 text-indigo-500" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              No financial goals yet
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
              Set clear targets for vacations, emergency cushions, equipment, or investments to keep your financial journey on track.
            </p>
            <Button onClick={openCreateGoalModal} variant="primary" size="md">
              <Plus className="w-4 h-4 mr-1.5" />
              Create First Goal
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {savingsGoals.map((goal) => {
              const progressPct =
                goal.targetAmount > 0
                  ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100))
                  : 0;
              const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
              const isCompleted = goal.currentAmount >= goal.targetAmount;

              // Calculate required monthly contribution if target date is set
              let monthlyNeeded: number | null = null;
              let monthsRemaining: number | null = null;
              if (goal.targetDate && !isCompleted) {
                try {
                  const tDate = parseISO(goal.targetDate);
                  if (isValid(tDate)) {
                    const diffM = differenceInMonths(tDate, new Date());
                    const diffD = differenceInDays(tDate, new Date());
                    if (diffD > 0) {
                      monthsRemaining = Math.max(1, diffM > 0 ? diffM : 1);
                      monthlyNeeded = Math.round(remaining / monthsRemaining);
                    }
                  }
                } catch {
                  // ignore
                }
              }

              return (
                <Card
                  key={goal.id}
                  className={cn(
                    'p-5 flex flex-col justify-between space-y-4 hoverEffect',
                    isCompleted &&
                      'border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/20 dark:bg-emerald-950/20'
                  )}
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-bold text-slate-900 dark:text-white text-base">
                            {goal.name}
                          </h3>
                          {isCompleted && (
                            <span className="p-1 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>
                        {goal.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                            {goal.description}
                          </p>
                        )}
                        {goal.category && (
                          <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {goal.category}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditGoalModal(goal)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Edit target"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteGoal(goal.id, goal.name)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          title="Delete goal"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4 space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-slate-500">
                          {isCompleted ? 'Goal Completed!' : 'Progress'}
                        </span>
                        <span
                          className={cn(
                            isCompleted
                              ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                              : 'text-indigo-600 dark:text-indigo-400'
                          )}
                        >
                          {progressPct}%
                        </span>
                      </div>

                      <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all duration-300',
                            isCompleted ? 'bg-emerald-500' : 'bg-indigo-600'
                          )}
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Target Date & Estimation */}
                    <div className="mt-3 text-xs space-y-1">
                      {goal.targetDate && (
                        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px]">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            Target Date:
                          </span>
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {formatDate(goal.targetDate)}
                          </span>
                        </div>
                      )}

                      {monthlyNeeded !== null && monthsRemaining !== null && (
                        <div className="p-2 rounded-lg bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 text-[11px] text-indigo-900 dark:text-indigo-200 flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-indigo-500" />
                            Need per month (~{monthsRemaining} mo):
                          </span>
                          <span className="font-bold">
                            {formatCurrency(monthlyNeeded, settings.currency)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer & Contribution Button */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">
                          Saved
                        </span>
                        <p className="font-bold text-slate-900 dark:text-white truncate">
                          {formatCurrency(goal.currentAmount, settings.currency)}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">
                          Target
                        </span>
                        <p className="font-bold text-slate-900 dark:text-white truncate">
                          {formatCurrency(goal.targetAmount, settings.currency)}
                        </p>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant={isCompleted ? 'outline' : 'primary'}
                      size="sm"
                      className="w-full text-xs"
                      onClick={() => openContributeModal(goal)}
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      Add Contribution
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Add/Edit Goal Modal */}
        <Modal
          isOpen={goalModalOpen}
          onClose={() => setGoalModalOpen(false)}
          title={editingGoal ? 'Edit Savings Goal' : 'Create Savings Goal'}
          description="Define a target amount and optional timeframe to stay focused."
          maxWidth="md"
        >
          <form onSubmit={handleSaveGoal} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Goal Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Emergency Fund, Japan Trip, M4 Mac"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Target Amount ({settings.currency}) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step={settings.currency === 'IDR' ? '100000' : '10'}
                  min="0"
                  placeholder={settings.currency === 'IDR' ? '25000000' : '2000.00'}
                  value={targetAmountStr}
                  onChange={(e) => setTargetAmountStr(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Currently Saved ({settings.currency})
                </label>
                <input
                  type="number"
                  step={settings.currency === 'IDR' ? '100000' : '10'}
                  min="0"
                  placeholder="0"
                  value={currentAmountStr}
                  onChange={(e) => setCurrentAmountStr(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Target Date (Optional)
                </label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Category Tag (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Travel, Tech, Emergency"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Description / Motivation
              </label>
              <textarea
                rows={2}
                placeholder="What will this goal unlock for you?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>

            {formError && <p className="text-xs text-rose-500">{formError}</p>}

            <div className="pt-2 flex items-center justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setGoalModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                {editingGoal ? 'Save Changes' : 'Create Target'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Contribution Modal */}
        <Modal
          isOpen={contributionModalOpen}
          onClose={() => setContributionModalOpen(false)}
          title={`Add Contribution: ${selectedGoalForContrib?.name}`}
          description="Record an addition towards your goal. Note: This updates your planning progress only."
          maxWidth="sm"
        >
          <form onSubmit={handleSaveContribution} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Contribution Amount ({settings.currency}) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                  {settings.currency === 'IDR' ? 'Rp' : '$'}
                </span>
                <input
                  type="number"
                  step={settings.currency === 'IDR' ? '50000' : '5'}
                  min="0"
                  placeholder={settings.currency === 'IDR' ? '1000000' : '100.00'}
                  value={contribAmountStr}
                  onChange={(e) => setContribAmountStr(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              {contribError && <p className="text-xs text-rose-500 mt-1">{contribError}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Contribution Note (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Freelance bonus, side project deposit"
                value={contribNote}
                onChange={(e) => setContribNote(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setContributionModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Record Contribution
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </AppLayout>
  );
}
