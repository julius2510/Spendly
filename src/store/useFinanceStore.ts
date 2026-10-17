import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  Transaction,
  Budget,
  SavingsGoal,
  UserSettings,
  CurrencyCode,
  TimeRangeFilter,
} from '@/types';
import { generateDemoData } from '@/data/demoData';
import { generateId } from '@/lib/utils';

interface FinanceState {
  transactions: Transaction[];
  budgets: Budget[];
  savingsGoals: SavingsGoal[];
  settings: UserSettings;
  selectedPeriod: TimeRangeFilter;
  isAddTransactionOpen: boolean;
  editingTransaction: Transaction | null;
  isResetModalOpen: boolean;
  isHydrated: boolean;

  // Actions
  addTransaction: (data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTransaction: (id: string, data: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;

  addBudget: (data: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateBudget: (id: string, data: Partial<Budget>) => void;
  deleteBudget: (id: string) => void;

  addSavingsGoal: (
    data: Omit<SavingsGoal, 'id' | 'createdAt' | 'updatedAt' | 'contributions'>
  ) => void;
  updateSavingsGoal: (id: string, data: Partial<SavingsGoal>) => void;
  deleteSavingsGoal: (id: string) => void;
  contributeToGoal: (goalId: string, amount: number, note?: string) => void;

  setSelectedPeriod: (period: TimeRangeFilter) => void;
  setCurrency: (currency: CurrencyCode) => void;
  updateSettings: (updates: Partial<UserSettings>) => void;

  openAddTransactionModal: (editing?: Transaction | null) => void;
  closeAddTransactionModal: () => void;

  openResetModal: () => void;
  closeResetModal: () => void;

  resetToDemoData: () => void;
  clearAllData: () => void;
  importFinancialData: (imported: Partial<FinanceState>) => boolean;
  setHydrated: (val: boolean) => void;
}

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set, get) => ({
      transactions: [],
      budgets: [],
      savingsGoals: [],
      settings: {
        currency: 'IDR',
        firstDayOfWeek: 1,
        themePreference: 'system',
        isDemoData: false,
        startingBalance: 0,
      },
      selectedPeriod: 'this_month',
      isAddTransactionOpen: false,
      editingTransaction: null,
      isResetModalOpen: false,
      isHydrated: false,

      setHydrated: (val: boolean) => set({ isHydrated: val }),

      addTransaction: (data) => {
        const newTx: Transaction = {
          ...data,
          id: generateId(),
          amount: Math.abs(Number(data.amount) || 0),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({
          transactions: [newTx, ...state.transactions],
          settings: {
            ...state.settings,
            isDemoData: false, // Adding personal record marks it as user data
          },
        }));
      },

      updateTransaction: (id, data) => {
        set((state) => ({
          transactions: state.transactions.map((tx) =>
            tx.id === id
              ? {
                  ...tx,
                  ...data,
                  amount:
                    data.amount !== undefined
                      ? Math.abs(Number(data.amount) || 0)
                      : tx.amount,
                  updatedAt: new Date().toISOString(),
                }
              : tx
          ),
        }));
      },

      deleteTransaction: (id) => {
        set((state) => ({
          transactions: state.transactions.filter((tx) => tx.id !== id),
        }));
      },

      addBudget: (data) => {
        const newBudget: Budget = {
          ...data,
          id: generateId(),
          monthlyLimit: Math.abs(Number(data.monthlyLimit) || 0),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({
          budgets: [...state.budgets, newBudget],
        }));
      },

      updateBudget: (id, data) => {
        set((state) => ({
          budgets: state.budgets.map((b) =>
            b.id === id
              ? {
                  ...b,
                  ...data,
                  monthlyLimit:
                    data.monthlyLimit !== undefined
                      ? Math.abs(Number(data.monthlyLimit) || 0)
                      : b.monthlyLimit,
                  updatedAt: new Date().toISOString(),
                }
              : b
          ),
        }));
      },

      deleteBudget: (id) => {
        set((state) => ({
          budgets: state.budgets.filter((b) => b.id !== id),
        }));
      },

      addSavingsGoal: (data) => {
        const newGoal: SavingsGoal = {
          ...data,
          id: generateId(),
          targetAmount: Math.abs(Number(data.targetAmount) || 0),
          currentAmount: Math.abs(Number(data.currentAmount) || 0),
          contributions: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({
          savingsGoals: [...state.savingsGoals, newGoal],
        }));
      },

      updateSavingsGoal: (id, data) => {
        set((state) => ({
          savingsGoals: state.savingsGoals.map((g) =>
            g.id === id
              ? {
                  ...g,
                  ...data,
                  targetAmount:
                    data.targetAmount !== undefined
                      ? Math.abs(Number(data.targetAmount) || 0)
                      : g.targetAmount,
                  currentAmount:
                    data.currentAmount !== undefined
                      ? Math.abs(Number(data.currentAmount) || 0)
                      : g.currentAmount,
                  updatedAt: new Date().toISOString(),
                }
              : g
          ),
        }));
      },

      deleteSavingsGoal: (id) => {
        set((state) => ({
          savingsGoals: state.savingsGoals.filter((g) => g.id !== id),
        }));
      },

      contributeToGoal: (goalId, amount, note) => {
        const validAmt = Math.abs(Number(amount) || 0);
        if (validAmt <= 0) return;

        set((state) => ({
          savingsGoals: state.savingsGoals.map((g) => {
            if (g.id !== goalId) return g;
            const newCont = {
              id: generateId(),
              amount: validAmt,
              date: new Date().toISOString().split('T')[0],
              note: note || 'Goal contribution',
            };
            return {
              ...g,
              currentAmount: g.currentAmount + validAmt,
              contributions: [newCont, ...g.contributions],
              updatedAt: new Date().toISOString(),
            };
          }),
        }));
      },

      setSelectedPeriod: (period) => set({ selectedPeriod: period }),

      setCurrency: (currency) =>
        set((state) => ({
          settings: { ...state.settings, currency },
        })),

      updateSettings: (updates) =>
        set((state) => ({
          settings: { ...state.settings, ...updates },
        })),

      openAddTransactionModal: (editing = null) =>
        set({ isAddTransactionOpen: true, editingTransaction: editing }),

      closeAddTransactionModal: () =>
        set({ isAddTransactionOpen: false, editingTransaction: null }),

      openResetModal: () => set({ isResetModalOpen: true }),
      closeResetModal: () => set({ isResetModalOpen: false }),

      resetToDemoData: () => {
        const fresh = generateDemoData();
        set((state) => ({
          transactions: fresh.transactions,
          budgets: fresh.budgets,
          savingsGoals: fresh.savingsGoals,
          settings: {
            ...state.settings,
            isDemoData: true,
            startingBalance: fresh.startingBalance,
          },
          selectedPeriod: 'this_month',
          isResetModalOpen: false,
        }));
      },

      clearAllData: () => {
        set((state) => ({
          transactions: [],
          budgets: [],
          savingsGoals: [],
          settings: {
            ...state.settings,
            isDemoData: false,
            startingBalance: 0,
          },
          selectedPeriod: 'this_month',
          isResetModalOpen: false,
        }));
      },

      importFinancialData: (imported) => {
        try {
          if (!imported || typeof imported !== 'object') return false;
          set((state) => ({
            transactions: Array.isArray(imported.transactions)
              ? imported.transactions
              : state.transactions,
            budgets: Array.isArray(imported.budgets) ? imported.budgets : state.budgets,
            savingsGoals: Array.isArray(imported.savingsGoals)
              ? imported.savingsGoals
              : state.savingsGoals,
            settings: imported.settings ? { ...state.settings, ...imported.settings } : state.settings,
          }));
          return true;
        } catch {
          return false;
        }
      },
    }),
    {
      name: 'spendly_financial_data_v2',
      storage: createJSONStorage(() => {
        if (typeof window !== 'undefined') {
          return localStorage;
        }
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        };
      }),
      version: 2,
      migrate: (persistedState: any, version: number) => {
        if (version < 2) {
          return {
            ...persistedState,
            transactions: [],
            budgets: [],
            savingsGoals: [],
            settings: {
              ...(persistedState?.settings || {}),
              isDemoData: false,
              startingBalance: 0,
            },
          };
        }
        return persistedState;
      },
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHydrated(true);
        }
      },
    }
  )
);
