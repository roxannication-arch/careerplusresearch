"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useEffect,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

import { convertCurrency } from "@/lib/currency";
import { createId } from "@/lib/id";
import {
  buildMonthOptions,
  clearCloudSyncSession,
  copyMonthPlan as copyMonthPlanInState,
  getCloudStorageState,
  getCloudSyncSession,
  getDefaultCloudSyncId,
  getMonthData,
  getPreviousMonthKey,
  hasMonthPlanData,
  loadStorageState,
  saveCloudStorageState,
  saveStorageState,
  setCloudSyncSession,
  subscribeToCloudStorageState,
  setSelectedMonth as selectMonthInState,
  upsertMonthData,
} from "@/lib/storage";
import {
  BudgetStorageState,
  Currency,
  ExpenseItem,
  IncomeItem,
  IncomeOwner,
  Pocket,
  Transaction,
} from "@/lib/types";

interface BudgetContextValue {
  state: BudgetStorageState;
  selectedMonth: string;
  monthOptions: string[];
  monthData: ReturnType<typeof getMonthData>;
  cloudSyncId: string;
  setSelectedMonth: (monthKey: string) => void;
  setCloudSyncId: (syncId: string) => void;
  updateExchangeRate: (exchangeRate: number) => void;
  convertIncomeCurrency: (id: string) => void;
  convertExpenseCurrency: (id: string) => void;
  updateIncome: (id: string, patch: Partial<IncomeItem>) => void;
  addIncome: (owner: IncomeOwner) => void;
  deleteIncome: (id: string) => void;
  updateExpense: (id: string, patch: Partial<ExpenseItem>) => void;
  addExpense: () => void;
  addExpenseCategory: (name: string) => void;
  deleteExpense: (id: string) => void;
  addPocket: (input: Omit<Pocket, "id" | "savedAmount"> & { savedAmount?: number }) => void;
  updatePocket: (id: string, patch: Partial<Pocket>) => void;
  deletePocket: (id: string) => void;
  addFundsToPocket: (id: string, amount: number, currency: Currency) => void;
  addTransaction: (input: Omit<Transaction, "id">) => void;
  updateTransaction: (id: string, input: Omit<Transaction, "id">) => void;
  deleteTransaction: (id: string) => void;
  previousMonth: string | null;
  hasPlanData: boolean;
  copyPlanFromMonth: (fromMonth: string, options?: { force?: boolean }) => boolean;
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
  const [cloudSyncId, setCloudSyncIdState] = useState<string>(
    () => getCloudSyncSession() || getDefaultCloudSyncId(),
  );
  const cloudReadyRef = useRef(false);
  const remoteStateHashRef = useRef<string | null>(null);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    const sync = () => {
      setState(loadStorageState());
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  useEffect(() => {
    saveStorageState(state);
    if (!cloudSyncId || !cloudReadyRef.current) {
      return;
    }

    const serializedState = JSON.stringify(state);
    if (remoteStateHashRef.current === serializedState) {
      remoteStateHashRef.current = null;
      return;
    }

    void saveCloudStorageState(cloudSyncId, state);
  }, [cloudSyncId, state]);

  useEffect(() => {
    if (!cloudSyncId) {
      cloudReadyRef.current = false;
      remoteStateHashRef.current = null;
      return;
    }

    let isActive = true;
    let unsubscribe: (() => void) | undefined;
    cloudReadyRef.current = false;
    setCloudSyncSession(cloudSyncId);

    void (async () => {
      const cloudState = await getCloudStorageState(cloudSyncId);
      if (!isActive) {
        return;
      }

      if (cloudState) {
        const cloudHash = JSON.stringify(cloudState);
        remoteStateHashRef.current = cloudHash;
        setState((previous) => (JSON.stringify(previous) === cloudHash ? previous : cloudState));
      } else {
        await saveCloudStorageState(cloudSyncId, stateRef.current);
      }

      if (!isActive) {
        return;
      }

      unsubscribe = subscribeToCloudStorageState(cloudSyncId, (nextState) => {
        if (!isActive) {
          return;
        }
        const nextHash = JSON.stringify(nextState);
        remoteStateHashRef.current = nextHash;
        setState((previous) => (JSON.stringify(previous) === nextHash ? previous : nextState));
      });
      cloudReadyRef.current = true;
    })();

    return () => {
      isActive = false;
      cloudReadyRef.current = false;
      unsubscribe?.();
    };
  }, [cloudSyncId]);

  const selectedMonth = state.selectedMonth;
  const monthData = useMemo(() => getMonthData(state, selectedMonth), [state, selectedMonth]);
  const monthOptions = useMemo(() => buildMonthOptions(selectedMonth, 24), [selectedMonth]);
  const previousMonth = useMemo(() => getPreviousMonthKey(selectedMonth), [selectedMonth]);
  const hasPlanData = useMemo(() => hasMonthPlanData(monthData), [monthData]);

  const updateCurrentMonth = useCallback(
    (updater: (month: typeof monthData) => typeof monthData) => {
      setState((previous) => upsertMonthData(previous, previous.selectedMonth, updater));
    },
    [],
  );

  const setSelectedMonth = useCallback((monthKey: string) => {
    setState((previous) => selectMonthInState(previous, monthKey));
  }, []);

  const setCloudSyncId = useCallback((syncId: string) => {
    const trimmed = syncId.trim();
    if (!trimmed) {
      setCloudSyncIdState("");
      clearCloudSyncSession();
      cloudReadyRef.current = false;
      remoteStateHashRef.current = null;
      return;
    }

    setCloudSyncIdState(trimmed);
    setCloudSyncSession(trimmed);
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

  const convertIncomeCurrency = useCallback(
    (id: string) => {
      updateCurrentMonth((month) => ({
        ...month,
        incomes: month.incomes.map((income) => {
          if (income.id !== id || typeof income.amount !== "number" || !Number.isFinite(income.amount)) {
            return income;
          }

          if (income.currency === "RUB") {
            return {
              ...income,
              amount: convertCurrency(income.amount, "RUB", "USD", month.exchangeRate),
              currency: "USD",
            };
          }

          return {
            ...income,
            amount: convertCurrency(income.amount, "USD", "RUB", month.exchangeRate),
            currency: "RUB",
          };
        }),
      }));
    },
    [updateCurrentMonth],
  );

  const convertExpenseCurrency = useCallback(
    (id: string) => {
      updateCurrentMonth((month) => ({
        ...month,
        expenses: month.expenses.map((expense) => {
          if (expense.id !== id || typeof expense.amount !== "number" || !Number.isFinite(expense.amount)) {
            return expense;
          }

          if (expense.currency === "RUB") {
            return {
              ...expense,
              amount: convertCurrency(expense.amount, "RUB", "USD", month.exchangeRate),
              currency: "USD",
            };
          }

          return {
            ...expense,
            amount: convertCurrency(expense.amount, "USD", "RUB", month.exchangeRate),
            currency: "RUB",
          };
        }),
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

  const addIncome = useCallback(
    (owner: IncomeOwner) => {
      updateCurrentMonth((month) => ({
        ...month,
        incomes: [
          ...month.incomes,
          { id: createId(), owner, name: "", amount: null, currency: "RUB" },
        ],
      }));
    },
    [updateCurrentMonth],
  );

  const deleteIncome = useCallback(
    (id: string) => {
      updateCurrentMonth((month) => {
        const nextIncomes = month.incomes.filter((income) => income.id !== id);
        const hasMe = nextIncomes.some((income) => income.owner === "me");
        const hasMilena = nextIncomes.some((income) => income.owner === "milena");
        return {
          ...month,
          incomes: [
            ...nextIncomes,
            ...(hasMe ? [] : [{ id: createId(), owner: "me" as const, name: "", amount: null, currency: "RUB" as const }]),
            ...(hasMilena
              ? []
              : [{ id: createId(), owner: "milena" as const, name: "", amount: null, currency: "RUB" as const }]),
          ],
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

  const addExpenseCategory = useCallback(
    (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) {
        return;
      }

      updateCurrentMonth((month) => ({
        ...month,
        expenses: [
          ...month.expenses,
          { id: createId(), name: trimmed, amount: null, currency: "RUB" },
        ],
      }));
    },
    [updateCurrentMonth],
  );

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
      if (!Number.isFinite(input.amount) || input.amount <= 0) {
        return;
      }
      if (!input.categoryId.trim()) {
        return;
      }
      if (input.type === "income" && input.owner !== "me" && input.owner !== "milena") {
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

  const updateTransaction = useCallback(
    (id: string, input: Omit<Transaction, "id">) => {
      if (!Number.isFinite(input.amount) || input.amount <= 0) {
        return;
      }
      if (!input.categoryId.trim()) {
        return;
      }
      if (input.type === "income" && input.owner !== "me" && input.owner !== "milena") {
        return;
      }

      updateCurrentMonth((month) => ({
        ...month,
        transactions: month.transactions.map((transaction) =>
          transaction.id === id
            ? {
                ...input,
                id,
              }
            : transaction,
        ),
      }));
    },
    [updateCurrentMonth],
  );

  const copyPlanFromMonth = useCallback(
    (fromMonth: string, options?: { force?: boolean }) => {
      if (!fromMonth) {
        return false;
      }

      let copied = false;
      setState((previous) => {
        const fromData = previous.months[fromMonth];
        if (!fromData) {
          return previous;
        }

        const result = copyMonthPlanInState(previous, fromMonth, previous.selectedMonth, options);
        if (!result.didCopy) {
          return previous;
        }
        copied = true;
        return result.state;
      });

      return copied;
    },
    [],
  );

  const value = useMemo<BudgetContextValue>(
    () => ({
      state,
      selectedMonth,
      monthOptions,
      monthData,
      cloudSyncId,
      setSelectedMonth,
      setCloudSyncId,
      updateExchangeRate,
      convertIncomeCurrency,
      convertExpenseCurrency,
      updateIncome,
      addIncome,
      deleteIncome,
      updateExpense,
      addExpense,
      addExpenseCategory,
      deleteExpense,
      addPocket,
      updatePocket,
      deletePocket,
      addFundsToPocket,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      previousMonth,
      hasPlanData,
      copyPlanFromMonth,
    }),
    [
      state,
      selectedMonth,
      monthOptions,
      monthData,
      cloudSyncId,
      setSelectedMonth,
      setCloudSyncId,
      updateExchangeRate,
      convertIncomeCurrency,
      convertExpenseCurrency,
      updateIncome,
      addIncome,
      deleteIncome,
      updateExpense,
      addExpense,
      addExpenseCategory,
      deleteExpense,
      addPocket,
      updatePocket,
      deletePocket,
      addFundsToPocket,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      previousMonth,
      hasPlanData,
      copyPlanFromMonth,
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
