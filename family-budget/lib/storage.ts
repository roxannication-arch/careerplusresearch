"use client";

import { createId } from "@/lib/id";
import {
  BudgetStorageState,
  Currency,
  ExpenseItem,
  IncomeItem,
  IncomeOwner,
  MonthBudgetData,
  Pocket,
  Transaction,
} from "@/lib/types";

const STORAGE_KEY = "family-budget-storage-v1";
const LEGACY_STORAGE_KEYS = ["family-budget-storage"];
const MONTH_KEY_PATTERN = /^(\d{4})-(\d{1,2})$/;

export const DEFAULT_EXCHANGE_RATE = 92;

function createDefaultIncomes(): IncomeItem[] {
  return [
    { id: createId(), owner: "me", name: "", amount: null, currency: "RUB" },
    { id: createId(), owner: "milena", name: "", amount: null, currency: "RUB" },
  ];
}

function createDefaultExpenses(): ExpenseItem[] {
  return [{ id: createId(), name: "", amount: null, currency: "RUB" }];
}

function createDefaultMonthData(): MonthBudgetData {
  return {
    exchangeRate: DEFAULT_EXCHANGE_RATE,
    incomes: createDefaultIncomes(),
    expenses: createDefaultExpenses(),
    pockets: [],
    transactions: [],
  };
}

function currentMonthKey(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${now.getFullYear()}-${month}`;
}

function normalizeMonthKey(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const match = value.match(MONTH_KEY_PATTERN);
  if (!match) {
    return null;
  }

  const year = Number.parseInt(match[1], 10);
  const month = Number.parseInt(match[2], 10);
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
    return null;
  }

  return `${year}-${String(month).padStart(2, "0")}`;
}

function ensureCurrency(value: unknown): Currency {
  return value === "USD" ? "USD" : "RUB";
}

function ensureIncomeOwner(value: unknown, fallback: IncomeOwner): IncomeOwner {
  return value === "milena" ? "milena" : fallback;
}

function normalizeId(value: unknown): string {
  return typeof value === "string" && value.trim().length > 0 ? value : createId();
}

function normalizeName(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function normalizeAmount(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function normalizeNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function normalizeDate(value: unknown): string {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  return new Date().toISOString().slice(0, 10);
}

function normalizeIncome(item: unknown, index: number): IncomeItem {
  const source = (item ?? {}) as Partial<IncomeItem>;
  const fallback = createDefaultIncomes()[index] ?? {
    id: createId(),
    owner: index === 1 ? "milena" : "me",
    name: "",
    amount: null,
    currency: "RUB" as const,
  };

  let owner = ensureIncomeOwner((source as { owner?: unknown }).owner, fallback.owner);
  // Migrate old data format where first income was me and second was milena.
  if ((source as { owner?: unknown }).owner === undefined) {
    owner = index === 1 ? "milena" : "me";
  }

  return {
    id: normalizeId(source.id ?? fallback.id),
    owner,
    name: normalizeName(source.name ?? fallback.name),
    amount: normalizeAmount(source.amount),
    currency: ensureCurrency(source.currency ?? fallback.currency),
  };
}

function normalizeExpense(item: unknown): ExpenseItem {
  const source = (item ?? {}) as Partial<ExpenseItem>;
  return {
    id: normalizeId(source.id),
    name: normalizeName(source.name),
    amount: normalizeAmount(source.amount),
    currency: ensureCurrency(source.currency),
  };
}

function normalizePocket(item: unknown): Pocket {
  const source = (item ?? {}) as Partial<Pocket>;
  return {
    id: normalizeId(source.id),
    name: normalizeName(source.name),
    savedAmount: normalizeNumber(source.savedAmount),
    targetAmount: normalizeAmount(source.targetAmount),
    currency: ensureCurrency(source.currency),
    color: typeof source.color === "string" && source.color.trim().length > 0 ? source.color : "#4f46e5",
  };
}

function normalizeTransaction(item: unknown): Transaction {
  const source = (item ?? {}) as Partial<Transaction>;
  const rawType = (source as { type?: unknown }).type;
  const normalizedType = rawType === "income" ? "income" : "expense";
  return {
    id: normalizeId(source.id),
    amount: normalizeNumber(source.amount),
    currency: ensureCurrency(source.currency),
    type: normalizedType,
    categoryId: normalizeName(source.categoryId),
    date: normalizeDate(source.date),
    note: normalizeName(source.note),
  };
}

function normalizeMonthData(month: unknown): MonthBudgetData {
  const source = (month ?? {}) as Partial<MonthBudgetData>;
  const incomesRaw = Array.isArray(source.incomes) ? source.incomes : [];
  const expensesRaw = Array.isArray(source.expenses) ? source.expenses : [];
  const pocketsRaw = Array.isArray(source.pockets) ? source.pockets : [];
  const transactionsRaw = Array.isArray(source.transactions) ? source.transactions : [];

  const incomes =
    incomesRaw.length > 0
      ? incomesRaw.map((income, index) => normalizeIncome(income, index))
      : createDefaultIncomes();
  const hasMe = incomes.some((income) => income.owner === "me");
  const hasMilena = incomes.some((income) => income.owner === "milena");
  if (!hasMe) {
    incomes.unshift({ id: createId(), owner: "me", name: "", amount: null, currency: "RUB" });
  }
  if (!hasMilena) {
    incomes.push({ id: createId(), owner: "milena", name: "", amount: null, currency: "RUB" });
  }
  const expenses = expensesRaw.length > 0 ? expensesRaw.map(normalizeExpense) : createDefaultExpenses();

  return {
    exchangeRate:
      typeof source.exchangeRate === "number" && Number.isFinite(source.exchangeRate) && source.exchangeRate > 0
        ? source.exchangeRate
        : DEFAULT_EXCHANGE_RATE,
    incomes,
    expenses,
    pockets: pocketsRaw.map(normalizePocket),
    transactions: transactionsRaw.map(normalizeTransaction),
  };
}

function monthHasMeaningfulData(monthData: MonthBudgetData): boolean {
  const hasIncomeData = monthData.incomes.some(
    (income) =>
      (typeof income.amount === "number" && Number.isFinite(income.amount) && income.amount !== 0) ||
      income.name.trim().length > 0,
  );
  const hasExpenseData = monthData.expenses.some(
    (expense) =>
      (typeof expense.amount === "number" && Number.isFinite(expense.amount) && expense.amount !== 0) ||
      expense.name.trim().length > 0,
  );

  return hasIncomeData || hasExpenseData || monthData.pockets.length > 0 || monthData.transactions.length > 0;
}

function isMonthDataLike(value: unknown): value is Partial<MonthBudgetData> {
  if (!value || typeof value !== "object") {
    return false;
  }

  const source = value as Record<string, unknown>;
  return (
    Array.isArray(source.incomes) ||
    Array.isArray(source.expenses) ||
    Array.isArray(source.pockets) ||
    Array.isArray(source.transactions) ||
    typeof source.exchangeRate === "number"
  );
}

function normalizeState(input: unknown): BudgetStorageState {
  const source = (input ?? {}) as Partial<BudgetStorageState>;
  const selectedMonthCandidate = normalizeMonthKey(source.selectedMonth);
  let selectedMonth = selectedMonthCandidate ?? currentMonthKey();

  const monthContainerCandidates = [
    source.months,
    (source as { dataByMonth?: unknown }).dataByMonth,
    (source as { byMonth?: unknown }).byMonth,
    (source as { monthlyData?: unknown }).monthlyData,
  ];
  const normalizedMonths: Record<string, MonthBudgetData> = {};

  for (const container of monthContainerCandidates) {
    if (!container || typeof container !== "object") {
      continue;
    }

    for (const [monthKey, monthValue] of Object.entries(container as Record<string, unknown>)) {
      const normalizedMonthKey = normalizeMonthKey(monthKey);
      if (normalizedMonthKey) {
        normalizedMonths[normalizedMonthKey] = normalizeMonthData(monthValue);
      }
    }
  }

  // Migrate legacy format where month payload was stored at root.
  if (Object.keys(normalizedMonths).length === 0 && isMonthDataLike(source)) {
    normalizedMonths[selectedMonth] = normalizeMonthData(source);
  }

  if (!normalizedMonths[selectedMonth]) {
    normalizedMonths[selectedMonth] = createDefaultMonthData();
  }

  if (!monthHasMeaningfulData(normalizedMonths[selectedMonth])) {
    const monthWithData = Object.keys(normalizedMonths)
      .filter((monthKey) => monthHasMeaningfulData(normalizedMonths[monthKey]))
      .sort((left, right) => right.localeCompare(left))[0];
    if (monthWithData) {
      selectedMonth = monthWithData;
    }
  }

  return {
    selectedMonth,
    months: normalizedMonths,
  };
}

export function buildMonthOptions(centerMonth: string, range = 24): string[] {
  const normalizedCenterMonth = normalizeMonthKey(centerMonth);
  if (!normalizedCenterMonth) {
    return [currentMonthKey()];
  }
  const [yearString, monthString] = normalizedCenterMonth.split("-");
  const baseYear = Number.parseInt(yearString, 10);
  const baseMonth = Number.parseInt(monthString, 10);

  const baseDate = new Date(baseYear, baseMonth - 1, 1);
  const options: string[] = [];
  const half = Math.floor(range / 2);

  for (let offset = -half; offset <= half; offset += 1) {
    const date = new Date(baseDate.getFullYear(), baseDate.getMonth() + offset, 1);
    const month = String(date.getMonth() + 1).padStart(2, "0");
    options.push(`${date.getFullYear()}-${month}`);
  }

  return Array.from(new Set(options));
}

export function getMonthLabel(monthKey: string): string {
  const normalizedKey = normalizeMonthKey(monthKey);
  if (!normalizedKey) {
    return monthKey;
  }
  const [yearString, monthString] = normalizedKey.split("-");
  const year = Number.parseInt(yearString, 10);
  const month = Number.parseInt(monthString, 10);

  return new Date(year, month - 1, 1).toLocaleDateString("ru-RU", {
    month: "long",
    year: "numeric",
  });
}

export function loadStorageState(): BudgetStorageState {
  if (typeof window === "undefined") {
    const month = currentMonthKey();
    return {
      selectedMonth: month,
      months: { [month]: createDefaultMonthData() },
    };
  }

  const raw =
    window.localStorage.getItem(STORAGE_KEY) ??
    LEGACY_STORAGE_KEYS.map((key) => window.localStorage.getItem(key)).find((value) => Boolean(value)) ??
    null;
  if (!raw) {
    const month = currentMonthKey();
    return {
      selectedMonth: month,
      months: { [month]: createDefaultMonthData() },
    };
  }

  try {
    return normalizeState(JSON.parse(raw));
  } catch {
    const month = currentMonthKey();
    return {
      selectedMonth: month,
      months: { [month]: createDefaultMonthData() },
    };
  }
}

export function saveStorageState(state: BudgetStorageState): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function getMonthData(state: BudgetStorageState, monthKey: string): MonthBudgetData {
  return state.months[monthKey] ?? createDefaultMonthData();
}

export function hasMonthPlanData(monthData: MonthBudgetData): boolean {
  const hasIncomeData = monthData.incomes.some(
    (income) =>
      (typeof income.amount === "number" && Number.isFinite(income.amount) && income.amount !== 0) ||
      income.name.trim().length > 0,
  );
  const hasExpenseData = monthData.expenses.some(
    (expense) =>
      (typeof expense.amount === "number" && Number.isFinite(expense.amount) && expense.amount !== 0) ||
      expense.name.trim().length > 0,
  );

  return hasIncomeData || hasExpenseData;
}

export function getPreviousMonthKey(monthKey: string): string | null {
  const normalizedMonthKey = normalizeMonthKey(monthKey);
  if (!normalizedMonthKey) {
    return null;
  }

  const [yearString, monthString] = normalizedMonthKey.split("-");
  const year = Number.parseInt(yearString, 10);
  const month = Number.parseInt(monthString, 10);
  const previous = new Date(year, month - 2, 1);

  return `${previous.getFullYear()}-${String(previous.getMonth() + 1).padStart(2, "0")}`;
}

export function copyMonthPlan(
  state: BudgetStorageState,
  fromMonth: string,
  toMonth: string,
  options?: { force?: boolean },
): { state: BudgetStorageState; didCopy: boolean; requiresConfirmation: boolean } {
  const normalizedFromMonth = normalizeMonthKey(fromMonth);
  const normalizedToMonth = normalizeMonthKey(toMonth);
  if (!normalizedFromMonth || !normalizedToMonth || normalizedFromMonth === normalizedToMonth) {
    return { state, didCopy: false, requiresConfirmation: false };
  }

  const fromData = getMonthData(state, normalizedFromMonth);
  const toData = getMonthData(state, normalizedToMonth);
  if (hasMonthPlanData(toData) && !options?.force) {
    return { state, didCopy: false, requiresConfirmation: true };
  }

  const copiedIncomes = fromData.incomes.map((income) => ({ ...income, id: createId() }));
  const copiedExpenses = fromData.expenses.map((expense) => ({ ...expense, id: createId() }));
  const nextMonthData = normalizeMonthData({
    ...toData,
    incomes: copiedIncomes,
    expenses: copiedExpenses,
  });

  return {
    state: {
      ...state,
      months: {
        ...state.months,
        [normalizedToMonth]: nextMonthData,
      },
    },
    didCopy: true,
    requiresConfirmation: false,
  };
}

export function upsertMonthData(
  state: BudgetStorageState,
  monthKey: string,
  updater: (monthData: MonthBudgetData) => MonthBudgetData,
): BudgetStorageState {
  const previous = getMonthData(state, monthKey);
  const next = normalizeMonthData(updater(previous));

  return {
    ...state,
    months: {
      ...state.months,
      [monthKey]: next,
    },
  };
}

export function setSelectedMonth(state: BudgetStorageState, monthKey: string): BudgetStorageState {
  const normalizedMonthKey = normalizeMonthKey(monthKey);
  if (!normalizedMonthKey) {
    return state;
  }

  if (state.months[normalizedMonthKey]) {
    return { ...state, selectedMonth: normalizedMonthKey };
  }

  return {
    ...state,
    selectedMonth: normalizedMonthKey,
    months: {
      ...state.months,
      [normalizedMonthKey]: createDefaultMonthData(),
    },
  };
}
