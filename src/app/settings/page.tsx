'use client';

import React, { useState, useRef } from 'react';
import {
  Settings as SettingsIcon,
  DollarSign,
  SunMoon,
  Calendar,
  Download,
  Upload,
  RotateCcw,
  Trash2,
  ShieldCheck,
  AlertTriangle,
  Info,
  Check,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useFinanceStore } from '@/store/useFinanceStore';
import { useTheme } from '@/components/theme/ThemeProvider';
import { useToast } from '@/components/ui/Toast';
import { CurrencyCode } from '@/types';
import { formatCurrency } from '@/lib/formatters';

export default function SettingsPage() {
  const {
    settings,
    transactions,
    budgets,
    savingsGoals,
    setCurrency,
    updateSettings,
    resetToDemoData,
    clearAllData,
    openResetModal,
    importFinancialData,
  } = useFinanceStore();

  const { theme, setTheme } = useTheme();
  const { toast } = useToast();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [startingBalStr, setStartingBalStr] = useState(
    (settings.startingBalance || 0).toString()
  );
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

  const handleCurrencyChange = (curr: CurrencyCode) => {
    setCurrency(curr);
    toast({
      title: 'Currency Updated',
      message: `Active display currency changed to ${curr}.`,
      type: 'info',
    });
  };

  const handleSaveStartingBalance = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = parseFloat(startingBalStr.replace(/[^0-9.]/g, '') || '0');
    updateSettings({ startingBalance: clean });
    toast({
      title: 'Starting Balance Saved',
      message: `Updated starting net worth to ${formatCurrency(clean, settings.currency)}.`,
      type: 'success',
    });
  };

  const handleExportJSON = () => {
    const backupData = {
      app: 'Spendly',
      version: 1,
      exportedAt: new Date().toISOString(),
      settings,
      transactions,
      budgets,
      savingsGoals,
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `spendly_financial_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Backup Downloaded',
      message: 'All records and configuration exported to JSON.',
      type: 'success',
    });
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const success = importFinancialData(json);
        if (success) {
          toast({
            title: 'Data Restored',
            message: 'Successfully imported backup records into Spendly.',
            type: 'success',
          });
        } else {
          toast({
            title: 'Import Failed',
            message: 'Invalid backup file structure.',
            type: 'error',
          });
        }
      } catch {
        toast({
          title: 'Import Error',
          message: 'Could not read or parse JSON file.',
          type: 'error',
        });
      }
    };
    reader.readAsText(file);
  };

  const handleResetDemo = () => {
    resetToDemoData();
    toast({
      title: 'Demo Dataset Loaded',
      message: 'Restored preloaded sample transactions and budgets.',
      type: 'info',
    });
  };

  const handleClearAll = () => {
    clearAllData();
    setConfirmClearOpen(false);
    toast({
      title: 'Workspace Cleared',
      message: 'All personal records removed. Started fresh workspace.',
      type: 'info',
    });
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Currency & Locale Settings */}
        <Card className="p-5">
          <CardHeader className="p-0 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <div>
                <CardTitle className="text-sm">Currency Preference</CardTitle>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Select your primary currency representation for all balances, charts, and budgets
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* IDR Option */}
              <div
                onClick={() => handleCurrencyChange('IDR')}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  settings.currency === 'IDR'
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 ring-1 ring-indigo-500'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">
                    Indonesian Rupiah (IDR)
                  </span>
                  {settings.currency === 'IDR' && (
                    <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">Default fintech locale</p>
                <p className="text-xs font-mono font-semibold text-indigo-600 dark:text-indigo-400 mt-2">
                  Sample: Rp1.500.000
                </p>
              </div>

              {/* USD Option */}
              <div
                onClick={() => handleCurrencyChange('USD')}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  settings.currency === 'USD'
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 ring-1 ring-indigo-500'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">
                    US Dollar (USD)
                  </span>
                  {settings.currency === 'USD' && (
                    <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">International standard</p>
                <p className="text-xs font-mono font-semibold text-indigo-600 dark:text-indigo-400 mt-2">
                  Sample: $1,500.00
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-500 flex items-start gap-2">
              <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
              <span>
                <strong>Notice:</strong> Changing the currency adjusts display formatting and entry labels. In keeping with privacy and zero external server reliance, Spendly does not perform live foreign exchange rate conversions on historical records.
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Starting Net Worth Balance */}
        <Card className="p-5">
          <CardHeader className="p-0 pb-3 mb-4">
            <div>
              <CardTitle className="text-sm">Initial Baseline Net Worth</CardTitle>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Starting liquid balance before recorded transaction additions and deductions
              </p>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <form onSubmit={handleSaveStartingBalance} className="flex items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  {settings.currency}
                </span>
                <input
                  type="number"
                  step={settings.currency === 'IDR' ? '100000' : '10'}
                  min="0"
                  value={startingBalStr}
                  onChange={(e) => setStartingBalStr(e.target.value)}
                  className="w-full pl-12 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <Button type="submit" variant="primary" size="sm">
                Save Starting Balance
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Theme & Display Preferences */}
        <Card className="p-5">
          <CardHeader className="p-0 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <SunMoon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <div>
                <CardTitle className="text-sm">Theme Appearance</CardTitle>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Switch between deep dark mode, crisp light mode, or system automatic detection
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="grid grid-cols-3 gap-3">
              {(['light', 'dark', 'system'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTheme(t)}
                  className={`p-3.5 rounded-xl border text-xs font-semibold capitalize text-center transition-all ${
                    theme === t
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 ring-1 ring-indigo-500'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {t} Mode
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Backup, Import & Reset */}
        <Card className="p-5">
          <CardHeader className="p-0 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Download className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <div>
                <CardTitle className="text-sm">Data Backup & Migration</CardTitle>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Export or import your complete financial state as a JSON backup file
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={handleExportJSON} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-1.5" />
                Export Full Backup (JSON)
              </Button>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImportFile}
                accept=".json"
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                size="sm"
              >
                <Upload className="w-4 h-4 mr-1.5" />
                Import JSON Backup
              </Button>

              <Button onClick={handleResetDemo} variant="secondary" size="sm">
                <RotateCcw className="w-4 h-4 mr-1.5" />
                Reload Demo Dataset
              </Button>
            </div>

            {/* Danger Zone: Refresh & Start from 0 */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-rose-600 dark:text-rose-400">
                    Refresh & Start from 0
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Wipe all recorded transactions, custom budgets, and goals to start fresh from zero
                  </p>
                </div>

                <Button
                  onClick={openResetModal}
                  variant="outline"
                  size="sm"
                  className="text-xs text-rose-600 border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1" />
                  Reset to 0
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Privacy & Browser Storage Policy */}
        <div className="p-5 rounded-2xl bg-slate-100/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 text-xs text-slate-600 dark:text-slate-400 space-y-2">
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>100% Client-Side Privacy Guarantee</span>
          </div>
          <p className="leading-relaxed">
            Spendly stores your transactions, budgets, goals, and simulation settings strictly inside your browser’s <code className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-[11px] text-slate-800 dark:text-slate-200">localStorage</code>. No telemetry, database logging, or remote sync occurs.
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 pt-1 border-t border-slate-200/60 dark:border-slate-800">
            <strong>Important Privacy Note:</strong> Because data is stored in the local browser profile, it does not synchronize across separate devices. Browser localStorage is unencrypted storage on your device; Spendly never requests bank credentials, passwords, or payment cards.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
