'use client';

import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  TrendingUp,
  Percent,
  Calendar,
  DollarSign,
  ArrowRight,
  ShieldAlert,
  Info,
  Sliders,
  RotateCcw,
  Target,
  Clock,
  Layers,
  HelpCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useFinanceStore } from '@/store/useFinanceStore';
import { runFinancialSimulation, SimulationInput } from '@/lib/simulator';
import { formatCurrency, formatPercentage } from '@/lib/formatters';
import { calculateTotals } from '@/lib/calculations';
import { useTheme } from '@/components/theme/ThemeProvider';
import { cn } from '@/lib/utils';

export default function SimulatorPage() {
  const { transactions, savingsGoals, settings } = useFinanceStore();
  const { resolvedTheme } = useTheme();

  // Calculate actual averages from user's current transaction history
  const totals = calculateTotals(transactions);
  const derivedMonthlyIncome = totals.income > 0 ? totals.income : 15000000;
  const derivedMonthlyExpenses = totals.expenses > 0 ? totals.expenses : 9500000;

  // Simulator Inputs
  const [initialSavings, setInitialSavings] = useState(
    settings.startingBalance > 0 ? settings.startingBalance : 0
  );
  const [monthlyIncome, setMonthlyIncome] = useState(derivedMonthlyIncome);
  const [monthlyExpenses, setMonthlyExpenses] = useState(derivedMonthlyExpenses);
  const [customMonthlySavings, setCustomMonthlySavings] = useState<number | null>(null);
  const [annualInterestRate, setAnnualInterestRate] = useState(6.0); // 6% compound return
  const [durationYears, setDurationYears] = useState(5);
  const [annualIncomeGrowth, setAnnualIncomeGrowth] = useState(3.0); // 3% yearly raise
  const [annualExpenseGrowth, setAnnualExpenseGrowth] = useState(2.0); // 2% inflation
  const [contributionTiming, setContributionTiming] = useState<'end' | 'beginning'>('end');
  const [selectedGoalId, setSelectedGoalId] = useState<string>(
    savingsGoals.length > 0 ? savingsGoals[0].id : ''
  );
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Derived or custom monthly savings
  const effectiveMonthlySavings =
    customMonthlySavings !== null
      ? customMonthlySavings
      : Math.max(0, monthlyIncome - monthlyExpenses);

  // Run primary simulation
  const simulationInput: SimulationInput = {
    initialSavings,
    monthlyIncome,
    monthlyExpenses,
    monthlySavings: effectiveMonthlySavings,
    annualInterestRate,
    durationYears,
    annualIncomeGrowth,
    annualExpenseGrowth,
    contributionTiming,
  };

  const primaryResult = useMemo(() => {
    return runFinancialSimulation(simulationInput);
  }, [
    initialSavings,
    monthlyIncome,
    monthlyExpenses,
    effectiveMonthlySavings,
    annualInterestRate,
    durationYears,
    annualIncomeGrowth,
    annualExpenseGrowth,
    contributionTiming,
  ]);

  // Scenario 1: Save More (+25% contribution)
  const saveMoreResult = useMemo(() => {
    return runFinancialSimulation({
      ...simulationInput,
      monthlySavings: Math.round(effectiveMonthlySavings * 1.25),
    });
  }, [simulationInput, effectiveMonthlySavings]);

  // Scenario 2: Reduce Expenses (-15% expenses)
  const reduceExpensesResult = useMemo(() => {
    const reducedExp = Math.round(monthlyExpenses * 0.85);
    return runFinancialSimulation({
      ...simulationInput,
      monthlyExpenses: reducedExp,
      monthlySavings: Math.max(0, monthlyIncome - reducedExp),
    });
  }, [simulationInput, monthlyIncome, monthlyExpenses]);

  // Scenario 3: Increase Income (+15% income)
  const increaseIncomeResult = useMemo(() => {
    const increasedInc = Math.round(monthlyIncome * 1.15);
    return runFinancialSimulation({
      ...simulationInput,
      monthlyIncome: increasedInc,
      monthlySavings: Math.max(0, increasedInc - monthlyExpenses),
    });
  }, [simulationInput, monthlyIncome, monthlyExpenses]);

  // Goal milestone check
  const selectedGoal = savingsGoals.find((g) => g.id === selectedGoalId);
  const goalTargetAmount = selectedGoal ? selectedGoal.targetAmount : 0;
  const monthsToGoal = goalTargetAmount > 0 ? primaryResult.timeToReachGoalMonths(goalTargetAmount) : null;

  // Preset loaders
  const loadPreset = (preset: 'balanced' | 'aggressive' | 'frugal' | 'passive') => {
    if (preset === 'balanced') {
      setAnnualInterestRate(6.0);
      setDurationYears(5);
      setAnnualIncomeGrowth(3.0);
      setAnnualExpenseGrowth(2.0);
      setCustomMonthlySavings(null);
    } else if (preset === 'aggressive') {
      setAnnualInterestRate(8.5);
      setDurationYears(10);
      setAnnualIncomeGrowth(5.0);
      setAnnualExpenseGrowth(1.5);
      setCustomMonthlySavings(Math.round(derivedMonthlyIncome * 0.5));
    } else if (preset === 'frugal') {
      setAnnualInterestRate(4.5);
      setDurationYears(5);
      setMonthlyExpenses(Math.round(derivedMonthlyExpenses * 0.75));
      setCustomMonthlySavings(null);
    } else if (preset === 'passive') {
      setAnnualInterestRate(2.0); // simple low-risk deposit
      setAnnualIncomeGrowth(0);
      setAnnualExpenseGrowth(0);
    }
  };

  const isDark = resolvedTheme === 'dark';
  const gridColor = isDark ? '#1e293b' : '#f1f5f9';
  const textColor = isDark ? '#94a3b8' : '#64748b';

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Preset Selector Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-200/50 dark:border-indigo-800/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                Interactive Financial Simulator & Wealth Projector
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Explore hypothetical compound interest scenarios, growth rates, and target milestones
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-semibold text-slate-400 mr-1">Presets:</span>
            <button
              onClick={() => loadPreset('balanced')}
              className="px-2.5 py-1 text-xs rounded-lg font-medium border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-700 dark:text-slate-300"
            >
              Balanced 6%
            </button>
            <button
              onClick={() => loadPreset('aggressive')}
              className="px-2.5 py-1 text-xs rounded-lg font-medium border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300"
            >
              Aggressive 8.5%
            </button>
            <button
              onClick={() => loadPreset('frugal')}
              className="px-2.5 py-1 text-xs rounded-lg font-medium border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-700 dark:text-slate-300"
            >
              Frugal Living
            </button>
          </div>
        </div>

        {/* Metric Projections Summary Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 sm:p-5 border-indigo-200/70 dark:border-indigo-900/60 bg-gradient-to-br from-indigo-500/5 to-transparent">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Projected Future Balance
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1 tracking-tight">
              {formatCurrency(primaryResult.finalBalance, settings.currency)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              After {durationYears} year{durationYears > 1 ? 's' : ''} ({durationYears * 12} months)
            </p>
          </Card>

          <Card className="p-4 sm:p-5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Total Contributed Capital
            </span>
            <div className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-200 mt-1">
              {formatCurrency(primaryResult.totalContributions, settings.currency)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Initial savings + monthly deposits
            </p>
          </Card>

          <Card className="p-4 sm:p-5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Compound Interest / Returns
            </span>
            <div className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              +{formatCurrency(primaryResult.totalInterestEarned, settings.currency)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {primaryResult.totalContributions > 0
                ? `${formatPercentage(
                    (primaryResult.totalInterestEarned / primaryResult.totalContributions) * 100
                  )} yield on capital`
                : 'Zero contributions'}
            </p>
          </Card>

          <Card className="p-4 sm:p-5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Monthly Savings Allocation
            </span>
            <div className="text-xl sm:text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
              {formatCurrency(effectiveMonthlySavings, settings.currency)}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {monthlyIncome > 0
                ? `${formatPercentage((effectiveMonthlySavings / monthlyIncome) * 100)} of monthly income`
                : 'Custom contribution'}
            </p>
          </Card>
        </div>

        {/* Simulator Main Workspace: Controls + Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls Column (Col 5) */}
          <div className="lg:col-span-5 space-y-5">
            <Card className="p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <CardTitle className="text-sm">Simulation Parameters</CardTitle>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setInitialSavings(settings.startingBalance || 0);
                    setMonthlyIncome(derivedMonthlyIncome);
                    setMonthlyExpenses(derivedMonthlyExpenses);
                    setAnnualInterestRate(6.0);
                    setDurationYears(5);
                    setCustomMonthlySavings(null);
                  }}
                  className="text-[11px] text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset
                </button>
              </div>

              {/* Initial Savings */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Initial Savings
                  </label>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">
                    {formatCurrency(initialSavings, settings.currency)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={settings.currency === 'IDR' ? 100000000 : 10000}
                  step={settings.currency === 'IDR' ? 1000000 : 100}
                  value={initialSavings}
                  onChange={(e) => setInitialSavings(parseFloat(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              {/* Monthly Income & Expenses Grid */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Monthly Income
                  </label>
                  <input
                    type="number"
                    step={settings.currency === 'IDR' ? '500000' : '50'}
                    value={monthlyIncome}
                    onChange={(e) => {
                      setMonthlyIncome(parseFloat(e.target.value) || 0);
                      setCustomMonthlySavings(null);
                    }}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Monthly Expenses
                  </label>
                  <input
                    type="number"
                    step={settings.currency === 'IDR' ? '500000' : '50'}
                    value={monthlyExpenses}
                    onChange={(e) => {
                      setMonthlyExpenses(parseFloat(e.target.value) || 0);
                      setCustomMonthlySavings(null);
                    }}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Monthly Contribution */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Monthly Contribution
                  </label>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">
                    {formatCurrency(effectiveMonthlySavings, settings.currency)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={settings.currency === 'IDR' ? 30000000 : 3000}
                  step={settings.currency === 'IDR' ? 250000 : 25}
                  value={effectiveMonthlySavings}
                  onChange={(e) => setCustomMonthlySavings(parseFloat(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              {/* Annual Interest Rate */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Annual Interest / Return Rate
                  </label>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {formatPercentage(annualInterestRate)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="15"
                  step="0.5"
                  value={annualInterestRate}
                  onChange={(e) => setAnnualInterestRate(parseFloat(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                  <span>0% (Cash mattress)</span>
                  <span>6% (Index bond/stock)</span>
                  <span>12%+ (Equities)</span>
                </div>
              </div>

              {/* Time Duration */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Simulation Horizon
                  </label>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {durationYears} Year{durationYears > 1 ? 's' : ''} ({durationYears * 12} mo)
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="30"
                  step="1"
                  value={durationYears}
                  onChange={(e) => setDurationYears(parseInt(e.target.value, 10))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              {/* Advanced Assumptions Toggle */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="w-full flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600"
                >
                  <span>Advanced Assumptions & Growth</span>
                  <span>{showAdvanced ? '▲ Hide' : '▼ Expand'}</span>
                </button>

                {showAdvanced && (
                  <div className="space-y-3 pt-3 text-xs animate-in fade-in">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-slate-600 dark:text-slate-400">
                          Annual Income Growth:
                        </span>
                        <span className="font-bold">{formatPercentage(annualIncomeGrowth)}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="10"
                        step="0.5"
                        value={annualIncomeGrowth}
                        onChange={(e) => setAnnualIncomeGrowth(parseFloat(e.target.value))}
                        className="w-full accent-indigo-600 cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-slate-600 dark:text-slate-400">
                          Annual Expense Growth (Inflation):
                        </span>
                        <span className="font-bold">{formatPercentage(annualExpenseGrowth)}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="8"
                        step="0.5"
                        value={annualExpenseGrowth}
                        onChange={(e) => setAnnualExpenseGrowth(parseFloat(e.target.value))}
                        className="w-full accent-indigo-600 cursor-pointer"
                      />
                    </div>

                    <div>
                      <span className="block text-slate-600 dark:text-slate-400 mb-1">
                        Contribution Timing:
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setContributionTiming('end')}
                          className={cn(
                            'py-1.5 px-2 rounded-lg text-xs font-medium border text-center transition-all',
                            contributionTiming === 'end'
                              ? 'bg-indigo-50 dark:bg-indigo-950 border-indigo-500 text-indigo-600 dark:text-indigo-400 font-semibold'
                              : 'border-slate-200 dark:border-slate-800 text-slate-600'
                          )}
                        >
                          End of Month (Ordinary)
                        </button>
                        <button
                          type="button"
                          onClick={() => setContributionTiming('beginning')}
                          className={cn(
                            'py-1.5 px-2 rounded-lg text-xs font-medium border text-center transition-all',
                            contributionTiming === 'beginning'
                              ? 'bg-indigo-50 dark:bg-indigo-950 border-indigo-500 text-indigo-600 dark:text-indigo-400 font-semibold'
                              : 'border-slate-200 dark:border-slate-800 text-slate-600'
                          )}
                        >
                          Start of Month (Due)
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Goal Milestone Tracker in Simulator */}
            {savingsGoals.length > 0 && (
              <Card className="p-4 bg-slate-50/60 dark:bg-slate-900/60">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Simulated Goal Milestone
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <select
                    value={selectedGoalId}
                    onChange={(e) => setSelectedGoalId(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-medium focus:ring-2 focus:ring-indigo-500"
                  >
                    {savingsGoals.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} ({formatCurrency(g.targetAmount, settings.currency)})
                      </option>
                    ))}
                  </select>

                  {selectedGoal && (
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Target Amount:</span>
                        <span className="font-bold">
                          {formatCurrency(selectedGoal.targetAmount, settings.currency)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Projected Time to Hit:</span>
                        <span className="font-extrabold text-indigo-600 dark:text-indigo-400">
                          {monthsToGoal !== null ? (
                            monthsToGoal === 0 ? (
                              'Already achieved'
                            ) : (
                              `${monthsToGoal} month${monthsToGoal > 1 ? 's' : ''} (~${(
                                monthsToGoal / 12
                              ).toFixed(1)} yrs)`
                            )
                          ) : (
                            <span className="text-rose-500 font-semibold">
                              Beyond {durationYears} yr window
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>

          {/* Projection Area Chart (Col 7) */}
          <div className="lg:col-span-7 space-y-5">
            <Card className="flex flex-col">
              <CardHeader className="flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle>Wealth Accumulation Trajectory</CardTitle>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Growth of contributed capital plus compound interest
                  </p>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                  {annualInterestRate}% Annual Yield
                </span>
              </CardHeader>

              <CardContent className="pt-2">
                <div className="h-[320px] sm:h-[380px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={primaryResult.yearlyData}
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="contribGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
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
                        tickFormatter={(val) =>
                          formatCurrency(val, settings.currency, { compact: true })
                        }
                      />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            const point = payload[0].payload;
                            return (
                              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl text-xs space-y-1.5 min-w-[200px]">
                                <p className="font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-1">
                                  {label} (Month {point.month})
                                </p>
                                <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400">
                                  <span>Total Wealth:</span>
                                  <span className="font-bold">
                                    {formatCurrency(point.balance, settings.currency)}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
                                  <span>Contributed:</span>
                                  <span className="font-bold">
                                    {formatCurrency(point.contributions, settings.currency)}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-amber-600 dark:text-amber-400">
                                  <span>Interest Earned:</span>
                                  <span className="font-bold">
                                    {formatCurrency(point.totalInterest, settings.currency)}
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
                      />
                      <Area
                        type="monotone"
                        name="Total Wealth"
                        dataKey="balance"
                        stroke="#6366f1"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#balanceGrad)"
                      />
                      <Area
                        type="monotone"
                        name="Contributed Capital"
                        dataKey="contributions"
                        stroke="#10b981"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#contribGrad)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Scenario Comparisons Grid */}
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <CardTitle className="text-sm">Strategic Scenario Projections</CardTitle>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                {/* Scenario 1 */}
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-1.5">
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">
                    Save +25% More
                  </span>
                  <p className="text-[11px] text-slate-400">
                    Monthly deposit: {formatCurrency(Math.round(effectiveMonthlySavings * 1.25), settings.currency)}
                  </p>
                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 text-sm font-bold text-indigo-600 dark:text-indigo-400">
                    {formatCurrency(saveMoreResult.finalBalance, settings.currency)}
                  </div>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block">
                    +{formatCurrency(saveMoreResult.finalBalance - primaryResult.finalBalance, settings.currency)} vs baseline
                  </span>
                </div>

                {/* Scenario 2 */}
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-1.5">
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">
                    Cut Expenses 15%
                  </span>
                  <p className="text-[11px] text-slate-400">
                    Monthly expense: {formatCurrency(Math.round(monthlyExpenses * 0.85), settings.currency)}
                  </p>
                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 text-sm font-bold text-indigo-600 dark:text-indigo-400">
                    {formatCurrency(reduceExpensesResult.finalBalance, settings.currency)}
                  </div>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block">
                    +{formatCurrency(reduceExpensesResult.finalBalance - primaryResult.finalBalance, settings.currency)} vs baseline
                  </span>
                </div>

                {/* Scenario 3 */}
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-1.5">
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">
                    Increase Income 15%
                  </span>
                  <p className="text-[11px] text-slate-400">
                    Monthly income: {formatCurrency(Math.round(monthlyIncome * 1.15), settings.currency)}
                  </p>
                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 text-sm font-bold text-indigo-600 dark:text-indigo-400">
                    {formatCurrency(increaseIncomeResult.finalBalance, settings.currency)}
                  </div>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block">
                    +{formatCurrency(increaseIncomeResult.finalBalance - primaryResult.finalBalance, settings.currency)} vs baseline
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Calculation Transparency & Disclaimer Box */}
        <div className="p-4 rounded-2xl bg-slate-100/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
            <Info className="w-4 h-4 text-indigo-500" />
            <span>Mathematical Model & Calculation Transparency</span>
          </div>
          <p className="leading-relaxed">
            Projections implement monthly compound interest using the standard annuity formula: 
            <code className="mx-1 px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-[11px] text-slate-800 dark:text-slate-200">
              Balance(m) = Balance(m-1) × (1 + r) + Contribution
            </code>
            where <code className="font-mono">r = annualInterestRate / 12</code>. Ordinary annuity deposits are calculated at period close.
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 pt-1 border-t border-slate-200/60 dark:border-slate-800">
            <strong>Disclaimer:</strong> Simulated results are mathematical projections for planning purposes only and do not guarantee actual investment performance or represent a specific financial product. Simulation parameters remain separate from your recorded ledger.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
