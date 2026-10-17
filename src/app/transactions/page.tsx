'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  Plus,
  Download,
  RotateCcw,
  Receipt,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Trash2,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useFinanceStore } from '@/store/useFinanceStore';
import { formatCurrency, formatDate } from '@/lib/formatters';
import {
  DEFAULT_INCOME_CATEGORIES,
  DEFAULT_EXPENSE_CATEGORIES,
} from '@/data/demoData';
import { cn } from '@/lib/utils';
import { Transaction } from '@/types';
import { useToast } from '@/components/ui/Toast';

export default function TransactionsPage() {
  const {
    transactions,
    settings,
    openAddTransactionModal,
    openResetModal,
    deleteTransaction,
  } = useFinanceStore();
  const { toast } = useToast();

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>(
    'date-desc'
  );

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Selected for viewing / details
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  // All distinct categories present
  const allCategories = useMemo(() => {
    const set = new Set<string>();
    [...DEFAULT_INCOME_CATEGORIES, ...DEFAULT_EXPENSE_CATEGORIES].forEach((c) => set.add(c));
    transactions.forEach((t) => set.add(t.category));
    return Array.from(set).sort();
  }, [transactions]);

  // Filtered & sorted transactions
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((tx) => {
        // Search term
        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          const descMatch = tx.description.toLowerCase().includes(term);
          const catMatch = tx.category.toLowerCase().includes(term);
          const notesMatch = tx.notes?.toLowerCase().includes(term);
          const methodMatch = tx.paymentMethod?.toLowerCase().includes(term);
          if (!descMatch && !catMatch && !notesMatch && !methodMatch) return false;
        }

        // Type filter
        if (typeFilter !== 'all' && tx.type !== typeFilter) {
          return false;
        }

        // Category filter
        if (categoryFilter !== 'all' && tx.category !== categoryFilter) {
          return false;
        }

        // Date range
        if (startDate && tx.date < startDate) return false;
        if (endDate && tx.date > endDate) return false;

        // Amount range
        const amt = Number(tx.amount) || 0;
        if (minAmount && amt < parseFloat(minAmount)) return false;
        if (maxAmount && amt > parseFloat(maxAmount)) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'date-desc') {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        }
        if (sortBy === 'date-asc') {
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        }
        if (sortBy === 'amount-desc') {
          return b.amount - a.amount;
        }
        if (sortBy === 'amount-asc') {
          return a.amount - b.amount;
        }
        return 0;
      });
  }, [
    transactions,
    searchTerm,
    typeFilter,
    categoryFilter,
    startDate,
    endDate,
    minAmount,
    maxAmount,
    sortBy,
  ]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / pageSize));
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTransactions.slice(start, start + pageSize);
  }, [filteredTransactions, currentPage, pageSize]);

  // Filter totals
  const filterTotals = useMemo(() => {
    let inc = 0;
    let exp = 0;
    filteredTransactions.forEach((t) => {
      if (t.type === 'income') inc += t.amount;
      if (t.type === 'expense') exp += t.amount;
    });
    return { income: inc, expenses: exp, net: inc - exp };
  }, [filteredTransactions]);

  const clearAllFilters = () => {
    setSearchTerm('');
    setTypeFilter('all');
    setCategoryFilter('all');
    setStartDate('');
    setEndDate('');
    setMinAmount('');
    setMaxAmount('');
    setSortBy('date-desc');
    setCurrentPage(1);
  };

  const hasActiveFilters =
    searchTerm ||
    typeFilter !== 'all' ||
    categoryFilter !== 'all' ||
    startDate ||
    endDate ||
    minAmount ||
    maxAmount ||
    sortBy !== 'date-desc';

  const exportFilteredToCSV = () => {
    if (filteredTransactions.length === 0) {
      toast({
        title: 'Export Failed',
        message: 'No transactions match the selected filters.',
        type: 'error',
      });
      return;
    }

    const headers = ['ID', 'Date', 'Type', 'Category', 'Description', 'Amount', 'Currency', 'Payment Method', 'Notes'];
    const rows = filteredTransactions.map((t) => [
      t.id,
      t.date,
      t.type,
      `"${t.category.replace(/"/g, '""')}"`,
      `"${t.description.replace(/"/g, '""')}"`,
      t.amount,
      settings.currency,
      `"${(t.paymentMethod || '').replace(/"/g, '""')}"`,
      `"${(t.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `spendly_transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'CSV Exported',
      message: `Exported ${filteredTransactions.length} records.`,
      type: 'success',
    });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Top Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="p-4">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Total Records
            </span>
            <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
              {filteredTransactions.length}
            </div>
          </Card>
          <Card className="p-4">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Filtered Inflow
            </span>
            <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 truncate">
              +{formatCurrency(filterTotals.income, settings.currency)}
            </div>
          </Card>
          <Card className="p-4">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Filtered Outflow
            </span>
            <div className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-1 truncate">
              -{formatCurrency(filterTotals.expenses, settings.currency)}
            </div>
          </Card>
          <Card className="p-4">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Net Difference
            </span>
            <div
              className={cn(
                'text-xl font-bold mt-1 truncate',
                filterTotals.net >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              )}
            >
              {formatCurrency(filterTotals.net, settings.currency, { showSign: true })}
            </div>
          </Card>
        </div>

        {/* Filter Controls Card */}
        <Card className="p-4 sm:p-5">
          <div className="space-y-4">
            {/* Search & Actions Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by description, category, payment method..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={exportFilteredToCSV}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  <Download className="w-3.5 h-3.5 mr-1" />
                  Export CSV
                </Button>
                {transactions.length > 0 && (
                  <Button
                    onClick={openResetModal}
                    variant="outline"
                    size="sm"
                    className="text-xs text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    title="Clear all records and start from 0"
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-1" />
                    Start from 0
                  </Button>
                )}
                {hasActiveFilters && (
                  <Button
                    onClick={clearAllFilters}
                    variant="ghost"
                    size="sm"
                    className="text-xs text-slate-600 dark:text-slate-400"
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-1" />
                    Reset Filters
                  </Button>
                )}
                <Button
                  onClick={() => openAddTransactionModal(null)}
                  variant="primary"
                  size="sm"
                  className="text-xs"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  New Record
                </Button>
              </div>
            </div>

            {/* Filter Pills / Dropdowns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/60 text-xs">
              {/* Type Select */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Transaction Type
                </label>
                <select
                  value={typeFilter}
                  onChange={(e) => {
                    setTypeFilter(e.target.value as 'all' | 'income' | 'expense');
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All Types (Income & Expense)</option>
                  <option value="income">Income Only</option>
                  <option value="expense">Expense Only</option>
                </select>
              </div>

              {/* Category Select */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Category
                </label>
                <select
                  value={categoryFilter}
                  onChange={(e) => {
                    setCategoryFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All Categories</option>
                  {allCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Start */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  From Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Sort Order */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="date-desc">Date: Newest First</option>
                  <option value="date-asc">Date: Oldest First</option>
                  <option value="amount-desc">Amount: Highest First</option>
                  <option value="amount-asc">Amount: Lowest First</option>
                </select>
              </div>
            </div>
          </div>
        </Card>

        {/* Transactions Table & List */}
        <Card className="overflow-hidden">
          {filteredTransactions.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <Receipt className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                No matching transactions found
              </p>
              <p className="text-xs mt-1 text-slate-400">
                Try adjusting your search query or reset active filters.
              </p>
              {hasActiveFilters && (
                <Button onClick={clearAllFilters} variant="outline" size="sm" className="mt-4">
                  Clear All Filters
                </Button>
              )}
            </div>
          ) : (
            <div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Description</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4 hidden md:table-cell">Payment Method</th>
                      <th className="py-3 px-4 text-right">Amount</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {paginatedTransactions.map((tx) => {
                      const isIncome = tx.type === 'income';

                      return (
                        <tr
                          key={tx.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group cursor-pointer"
                          onClick={() => openAddTransactionModal(tx)}
                        >
                          <td className="py-3.5 px-4 font-medium text-slate-500 whitespace-nowrap">
                            {formatDate(tx.date)}
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white max-w-[200px] truncate">
                            {tx.description}
                            {tx.notes && (
                              <p className="text-[11px] font-normal text-slate-400 truncate mt-0.5">
                                {tx.notes}
                              </p>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <Badge variant={isIncome ? 'success' : 'neutral'}>
                              {tx.category}
                            </Badge>
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 hidden md:table-cell">
                            {tx.paymentMethod || '—'}
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold whitespace-nowrap">
                            <span
                              className={cn(
                                isIncome
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-rose-600 dark:text-rose-400'
                              )}
                            >
                              {isIncome ? '+' : '-'}
                              {formatCurrency(tx.amount, settings.currency)}
                            </span>
                          </td>
                          <td
                            className="py-3.5 px-4 text-right whitespace-nowrap"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => openAddTransactionModal(tx)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                                title="Edit transaction"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  deleteTransaction(tx.id);
                                  toast({
                                    title: 'Deleted',
                                    message: `Removed ${tx.description}`,
                                    type: 'info',
                                  });
                                }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                                title="Delete transaction"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination Bar */}
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                <div>
                  Showing{' '}
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {(currentPage - 1) * pageSize + 1}
                  </span>{' '}
                  to{' '}
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {Math.min(currentPage * pageSize, filteredTransactions.length)}
                  </span>{' '}
                  of{' '}
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {filteredTransactions.length}
                  </span>{' '}
                  records
                </div>

                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="p-1.5 h-8 w-8"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="px-2 font-medium">
                    {currentPage} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="p-1.5 h-8 w-8"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}
