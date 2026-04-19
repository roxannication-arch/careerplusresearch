"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useEffect,
  useContext,
  useMemo,
  useState,
} from "react";

import { convertCurrency } from "@/lib/currency";
import { createId } from "@/lib/id";
import {
  buildMonthOptions,
  getMonthData,
  loadStorageState,
  saveStorageState,
  setSelectedMonth as selectMonthInState,
  upsertMonthData,
} from "@/lib/storage";
import { BudgetStorageState, Currency, ExpenseItem, IncomeItem, Pocket, Transaction } from "@/lib/types";

interface BudgetContextValue {
  state: BudgetStorageState;
  selectedMonth: string;
  monthOptions: string[];
  monthData: ReturnType<typeof getMonthData>;
  setSelectedMonth: (monthKey: string) => void;
  updateExchangeRate: (exchangeRate: number) => void;
  updateIncome: (id: string, patch: Partial<IncomeItem>) => void;
  addIncome: () => void;
  deleteIncome: (id: string) => void;
  updateExpense: (id: string, patch: Partial<ExpenseItem>) => void;
  addExpense: () => void;
  deleteExpense: (id: string) => void;
  addPocket: (input: Omit<Pocket, "id" | "savedAmount"> & { savedAmount?: number }) => void;
  updatePocket: (id: string, patch: Partial<Pocket>) => void;
  deletePocket: (id: string) => void;
  addFundsToPocket: (id: string, amount: number, currency: Currency) => void;
  addTransaction: (input: Omit<Transaction, "id">) => void;
  deleteTransaction: (id: string) => void;
}

const BudgetContext = createContext<BudgetContextValue | null>(null);

function sanitizeNullableAmount(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function sanitizePositiveNumber(value: unknown, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return fallback;
  }

  return value;
}

export function BudgetProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<BudgetStorageState>(() => loadStorageState());

  useEffect(() => {
    const sync = () => {
      setState(loadStorageState());
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  useEffect(() => {
    saveStorageState(state);
  }, [state]);

  const selectedMonth = state.selectedMonth;
  const monthData = useMemo(() => getMonthData(state, selectedMonth), [state, selectedMonth]);
  const monthOptions = useMemo(() => buildMonthOptions(selectedMonth, 24), [selectedMonth]);

  const updateCurrentMonth = useCallback(
    (updater: (month: typeof monthData) => typeof monthData) => {
      setState((previous) => upsertMonthData(previous, previous.selectedMonth, updater));
    },
    [],
  );

  const setSelectedMonth = useCallback((monthKey: string) => {
    setState((previous) => selectMonthInState(previous, monthKey));
  }, []);

  const updateExchangeRate = useCallback(
    (exchangeRate: number) => {
      updateCurrentMonth((month) => ({
        ...month,
        exchangeRate: sanitizePositiveNumber(exchangeRate, month.exchangeRate),
      }));
    },
    [updateCurrentMonth],
  );

  const updateIncome = useCallback(
    (id: string, patch: Partial<IncomeItem>) => {
      updateCurrentMonth((month) => ({
        ...month,
        incomes: month.incomes.map((income) =>
          income.id === id
            ? {
                ...income,
                ...patch,
                amount:
                  patch.amount === undefined ? income.amount : sanitizeNullableAmount(patch.amount),
                currency: patch.currency ?? income.currency,
              }
            : income,
        ),
      }));
    },
    [updateCurrentMonth],
  );

  const addIncome = useCallback(() => {
    updateCurrentMonth((month) => ({
      ...month,
      incomes: [
        ...month.incomes,
        { id: createId(), name: "", amount: null, currency: "RUB" },
      ],
    }));
  }, [updateCurrentMonth]);

  const deleteIncome = useCallback(
    (id: string) => {
      updateCurrentMonth((month) => {
        if (month.incomes.length <= 2) {
          return month;
        }

        return {
          ...month,
          incomes: month.incomes.filter((income) => income.id !== id),
        };
      });
    },
    [updateCurrentMonth],
  );

  const updateExpense = useCallback(
    (id: string, patch: Partial<ExpenseItem>) => {
      updateCurrentMonth((month) => ({
        ...month,
        expenses: month.expenses.map((expense) =>
          expense.id === id
            ? {
                ...expense,
                ...patch,
                amount:
                  patch.amount === undefined
                    ? expense.amount
                    : sanitizeNullableAmount(patch.amount),
                currency: patch.currency ?? expense.currency,
              }
            : expense,
        ),
      }));
    },
    [updateCurrentMonth],
  );

  const addExpense = useCallback(() => {
    updateCurrentMonth((month) => ({
      ...month,
      expenses: [
        ...month.expenses,
        { id: createId(), name: "", amount: null, currency: "RUB" },
      ],
    }));
  }, [updateCurrentMonth]);

  const deleteExpense = useCallback(
    (id: string) => {
      updateCurrentMonth((month) => {
        const next = month.expenses.filter((expense) => expense.id !== id);
        return {
          ...month,
          expenses:
            next.length > 0 ? next : [{ id: createId(), name: "", amount: null, currency: "RUB" }],
        };
      });
    },
    [updateCurrentMonth],
  );

  const addPocket = useCallback(
    (input: Omit<Pocket, "id" | "savedAmount"> & { savedAmount?: number }) => {
      updateCurrentMonth((month) => ({
        ...month,
        pockets: [
          ...month.pockets,
          {
            id: createId(),
            name: input.name,
            targetAmount: sanitizeNullableAmount(input.targetAmount),
            currency: input.currency,
            color: input.color,
            savedAmount:
              typeof input.savedAmount === "number" && Number.isFinite(input.savedAmount)
                ? input.savedAmount
                : 0,
          },
        ],
      }));
    },
    [updateCurrentMonth],
  );

  const updatePocket = useCallback(
    (id: string, patch: Partial<Pocket>) => {
      updateCurrentMonth((month) => ({
        ...month,
        pockets: month.pockets.map((pocket) =>
          pocket.id === id
            ? {
                ...pocket,
                ...patch,
                targetAmount:
                  patch.targetAmount === undefined
                    ? pocket.targetAmount
                    : sanitizeNullableAmount(patch.targetAmount),
                savedAmount:
                  patch.savedAmount === undefined
                    ? pocket.savedAmount
                    : typeof patch.savedAmount === "number" && Number.isFinite(patch.savedAmount)
                      ? patch.savedAmount
                      : pocket.savedAmount,
              }
            : pocket,
        ),
      }));
    },
    [updateCurrentMonth],
  );

  const deletePocket = useCallback(
    (id: string) => {
      updateCurrentMonth((month) => ({
        ...month,
        pockets: month.pockets.filter((pocket) => pocket.id !== id),
      }));
    },
    [updateCurrentMonth],
  );

  const addFundsToPocket = useCallback(
    (id: string, amount: number, currency: Currency) => {
      if (!Number.isFinite(amount) || amount <= 0) {
        return;
      }

      updateCurrentMonth((month) => ({
        ...month,
        pockets: month.pockets.map((pocket) => {
          if (pocket.id !== id) {
            return pocket;
          }

          const convertedAmount = convertCurrency(
            amount,
            currency,
            pocket.currency,
            month.exchangeRate,
          );
          return {
            ...pocket,
            savedAmount: pocket.savedAmount + convertedAmount,
          };
        }),
      }));
    },
    [updateCurrentMonth],
  );

  const addTransaction = useCallback(
    (input: Omit<Transaction, "id">) => {
      if (!Number.isFinite(input.amount) || input.amount <= 0 || !input.categoryId) {
        return;
      }

      updateCurrentMonth((month) => ({
        ...month,
        transactions: [
          {
            ...input,
            id: createId(),
          },
          ...month.transactions,
        ],
      }));
    },
    [updateCurrentMonth],
  );

  const deleteTransaction = useCallback(
    (id: string) => {
      updateCurrentMonth((month) => ({
        ...month,
        transactions: month.transactions.filter((transaction) => transaction.id !== id),
      }));
    },
    [updateCurrentMonth],
  );

  const value = useMemo<BudgetContextValue>(
    () => ({
      state,
      selectedMonth,
      monthOptions,
      monthData,
      setSelectedMonth,
      updateExchangeRate,
      updateIncome,
      addIncome,
      deleteIncome,
      updateExpense,
      addExpense,
      deleteExpense,
      addPocket,
      updatePocket,
      deletePocket,
      addFundsToPocket,
      addTransaction,
      deleteTransaction,
    }),
    [
      state,
      selectedMonth,
      monthOptions,
      monthData,
      setSelectedMonth,
      updateExchangeRate,
      updateIncome,
      addIncome,
      deleteIncome,
      updateExpense,
      addExpense,
      deleteExpense,
      addPocket,
      updatePocket,
      deletePocket,
      addFundsToPocket,
      addTransaction,
      deleteTransaction,
    ],
  );

  return <BudgetContext.Provider value={value}>{children}</BudgetContext.Provider>;
}

export function useBudget() {
  const context = useContext(BudgetContext);
  if (!context) {
    throw new Error("useBudget must be used inside BudgetProvider");
  }

  return context;
}
