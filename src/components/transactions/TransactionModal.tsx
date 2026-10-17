'use client';

import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { PlusCircle, Save, Trash2, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useFinanceStore } from '@/store/useFinanceStore';
import { useToast } from '@/components/ui/Toast';
import { DEFAULT_INCOME_CATEGORIES, DEFAULT_EXPENSE_CATEGORIES } from '@/data/demoData';
import { cn } from '@/lib/utils';

const transactionSchema = z.object({
  description: z.string().min(2, 'Description must be at least 2 characters').max(100),
  amount: z
    .number({ invalid_type_error: 'Amount must be a valid number' })
    .positive('Amount must be greater than 0'),
  type: z.enum(['income', 'expense']),
  category: z.string().min(1, 'Please select or enter a category'),
  date: z.string().min(1, 'Please select a date'),
  paymentMethod: z.string().optional(),
  notes: z.string().max(250).optional(),
});

export function TransactionModal() {
  const {
    isAddTransactionOpen,
    closeAddTransactionModal,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    editingTransaction,
    settings,
  } = useFinanceStore();

  const { toast } = useToast();

  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [description, setDescription] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [isCustomCat, setIsCustomCat] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      setDescription(editingTransaction.description);
      setAmountStr(editingTransaction.amount.toString());
      setDate(editingTransaction.date);
      setPaymentMethod(editingTransaction.paymentMethod || '');
      setNotes(editingTransaction.notes || '');

      const availableCats =
        editingTransaction.type === 'income'
          ? DEFAULT_INCOME_CATEGORIES
          : DEFAULT_EXPENSE_CATEGORIES;

      if (availableCats.includes(editingTransaction.category)) {
        setCategory(editingTransaction.category);
        setIsCustomCat(false);
        setCustomCategory('');
      } else {
        setCategory('custom');
        setIsCustomCat(true);
        setCustomCategory(editingTransaction.category);
      }
    } else {
      // Defaults for new transaction
      setType('expense');
      setDescription('');
      setAmountStr('');
      setCategory(DEFAULT_EXPENSE_CATEGORIES[0]);
      setIsCustomCat(false);
      setCustomCategory('');
      setDate(new Date().toISOString().split('T')[0]);
      setPaymentMethod('Bank Transfer');
      setNotes('');
    }
    setErrors({});
    setShowDeleteConfirm(false);
  }, [editingTransaction, isAddTransactionOpen]);

  const handleTypeChange = (newType: 'income' | 'expense') => {
    setType(newType);
    setIsCustomCat(false);
    setCustomCategory('');
    setCategory(
      newType === 'income' ? DEFAULT_INCOME_CATEGORIES[0] : DEFAULT_EXPENSE_CATEGORIES[0]
    );
  };

  const handleCategorySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'custom') {
      setIsCustomCat(true);
      setCategory('custom');
    } else {
      setIsCustomCat(false);
      setCategory(val);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const finalCategory = isCustomCat ? customCategory.trim() : category;
    const cleanAmount = parseFloat(amountStr.replace(/[^0-9.]/g, ''));

    const validation = transactionSchema.safeParse({
      description: description.trim(),
      amount: cleanAmount,
      type,
      category: finalCategory,
      date,
      paymentMethod: paymentMethod.trim() || undefined,
      notes: notes.trim() || undefined,
    });

    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of validation.error.issues) {
        if (issue.path[0]) {
          fieldErrors[issue.path[0].toString()] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    if (editingTransaction) {
      updateTransaction(editingTransaction.id, {
        description: validation.data.description,
        amount: validation.data.amount,
        type: validation.data.type,
        category: validation.data.category,
        date: validation.data.date,
        paymentMethod: validation.data.paymentMethod,
        notes: validation.data.notes,
      });
      toast({
        title: 'Transaction Updated',
        message: `Successfully saved changes to "${validation.data.description}".`,
        type: 'success',
      });
    } else {
      addTransaction({
        description: validation.data.description,
        amount: validation.data.amount,
        type: validation.data.type,
        category: validation.data.category,
        date: validation.data.date,
        paymentMethod: validation.data.paymentMethod,
        notes: validation.data.notes,
      });
      toast({
        title: 'Transaction Added',
        message: `Recorded new ${validation.data.type} of ${validation.data.description}.`,
        type: 'success',
      });
    }

    closeAddTransactionModal();
  };

  const handleDelete = () => {
    if (!editingTransaction) return;
    deleteTransaction(editingTransaction.id);
    toast({
      title: 'Transaction Deleted',
      message: 'The transaction has been removed.',
      type: 'info',
    });
    closeAddTransactionModal();
  };

  const categories =
    type === 'income' ? DEFAULT_INCOME_CATEGORIES : DEFAULT_EXPENSE_CATEGORIES;

  return (
    <Modal
      isOpen={isAddTransactionOpen}
      onClose={closeAddTransactionModal}
      title={editingTransaction ? 'Edit Transaction' : 'Record Transaction'}
      description="Enter transaction details below. All dashboard totals update immediately."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Transaction Type Segmented Toggle */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          <button
            type="button"
            onClick={() => handleTypeChange('expense')}
            className={cn(
              'flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-semibold transition-all',
              type === 'expense'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            )}
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>Expense</span>
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange('income')}
            className={cn(
              'flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-semibold transition-all',
              type === 'income'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            )}
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Income</span>
          </button>
        </div>

        {/* Amount Field */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
            Amount ({settings.currency}) <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
              {settings.currency === 'IDR' ? 'Rp' : '$'}
            </span>
            <input
              type="number"
              step={settings.currency === 'IDR' ? '1000' : '0.01'}
              min="0"
              placeholder={settings.currency === 'IDR' ? '150000' : '50.00'}
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              className={cn(
                'w-full pl-11 pr-4 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white font-medium text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors',
                errors.amount
                  ? 'border-rose-500 focus:ring-rose-500'
                  : 'border-slate-200 dark:border-slate-700'
              )}
            />
          </div>
          {errors.amount && <p className="text-xs text-rose-500 mt-1">{errors.amount}</p>}
        </div>

        {/* Description Field */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
            Description <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Grocery store, Client design, Electric bill"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={cn(
              'w-full px-3.5 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors',
              errors.description
                ? 'border-rose-500 focus:ring-rose-500'
                : 'border-slate-200 dark:border-slate-700'
            )}
          />
          {errors.description && (
            <p className="text-xs text-rose-500 mt-1">{errors.description}</p>
          )}
        </div>

        {/* Category & Date Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Category <span className="text-rose-500">*</span>
            </label>
            <select
              value={isCustomCat ? 'custom' : category}
              onChange={handleCategorySelect}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
              <option value="custom">+ Custom Category...</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {errors.date && <p className="text-xs text-rose-500 mt-1">{errors.date}</p>}
          </div>
        </div>

        {/* Custom Category Input if selected */}
        {isCustomCat && (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Custom Category Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Pet Care, Gardening, Tech Gadgets"
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        )}

        {/* Payment Method */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
            Payment Method (Optional)
          </label>
          <input
            type="text"
            list="payment-methods"
            placeholder="e.g. Bank Transfer, Credit Card, QRIS, Cash"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <datalist id="payment-methods">
            <option value="Bank Transfer" />
            <option value="Credit Card" />
            <option value="Debit Card" />
            <option value="QRIS / E-Wallet" />
            <option value="Cash" />
            <option value="Auto-Debit" />
          </datalist>
        </div>

        {/* Optional Notes */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
            Notes (Optional)
          </label>
          <textarea
            rows={2}
            placeholder="Additional context or memo..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex items-center justify-between gap-3">
          {editingTransaction ? (
            <div>
              {showDeleteConfirm ? (
                <div className="flex items-center gap-1.5 animate-in fade-in">
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={handleDelete}
                  >
                    Confirm Delete
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              )}
            </div>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={closeAddTransactionModal}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md">
              {editingTransaction ? (
                <>
                  <Save className="w-4 h-4 mr-1.5" />
                  Save Changes
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4 mr-1.5" />
                  Save Transaction
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
