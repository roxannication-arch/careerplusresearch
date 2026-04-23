import { toRub, toUsd } from "@/lib/currency";
import { ExpenseItem, MonthBudgetData } from "@/lib/types";

export interface Totals {
  rub: number;
  usd: number;
}

export interface CategorySummaryItem {
  categoryId: string;
  categoryName: string;
  plannedRub: number;
  plannedUsd: number;
  actualRub: number;
  actualUsd: number;
  diffRub: number;
  diffUsd: number;
}

function sumRubUsd(values: Array<{ amount: number; currency: "RUB" | "USD" }>, exchangeRate: number): Totals {
  return values.reduce(
    (accumulator, item) => {
      accumulator.rub += toRub(item.amount, item.currency, exchangeRate);
      accumulator.usd += toUsd(item.amount, item.currency, exchangeRate);
      return accumulator;
    },
    { rub: 0, usd: 0 },
  );
}

function amountOrZero(value: number | null | undefined): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export function calculateIncomeTotals(monthData: MonthBudgetData): Totals {
  return sumRubUsd(
    monthData.incomes.map((income) => ({
      amount: amountOrZero(income.amount),
      currency: income.currency,
    })),
    monthData.exchangeRate,
  );
}

export function calculatePlannedExpenseTotals(monthData: MonthBudgetData): Totals {
  return sumRubUsd(
    monthData.expenses.map((expense) => ({
      amount: amountOrZero(expense.amount),
      currency: expense.currency,
    })),
    monthData.exchangeRate,
  );
}

export function calculateTransactionTotals(monthData: MonthBudgetData): Totals {
  return sumRubUsd(
    monthData.transactions
      .filter((transaction) => transaction.type === "expense")
      .map((transaction) => ({
        amount: amountOrZero(transaction.amount),
        currency: transaction.currency,
      })),
    monthData.exchangeRate,
  );
}

export function calculateIncomeTransactionTotals(monthData: MonthBudgetData): Totals {
  return sumRubUsd(
    monthData.transactions
      .filter((transaction) => transaction.type === "income")
      .map((transaction) => ({
        amount: amountOrZero(transaction.amount),
        currency: transaction.currency,
      })),
    monthData.exchangeRate,
  );
}

export function calculatePocketTotals(monthData: MonthBudgetData): Totals {
  return sumRubUsd(
    monthData.pockets.map((pocket) => ({
      amount: amountOrZero(pocket.savedAmount),
      currency: pocket.currency,
    })),
    monthData.exchangeRate,
  );
}

export function calculateTotalExpenses(monthData: MonthBudgetData): Totals {
  const planned = calculatePlannedExpenseTotals(monthData);
  const transactions = calculateTransactionTotals(monthData);

  return {
    rub: planned.rub + transactions.rub,
    usd: planned.usd + transactions.usd,
  };
}

export function calculateRunningBalance(monthData: MonthBudgetData): Totals {
  const income = calculateIncomeTotals(monthData);
  const planned = calculatePlannedExpenseTotals(monthData);
  const pockets = calculatePocketTotals(monthData);
  const transactions = calculateTransactionTotals(monthData);

  return {
    rub: income.rub - planned.rub - pockets.rub - transactions.rub,
    usd: income.usd - planned.usd - pockets.usd - transactions.usd,
  };
}

export function calculateCategorySummary(monthData: MonthBudgetData): CategorySummaryItem[] {
  const byCategory = new Map<string, CategorySummaryItem>();

  const ensureCategory = (category: ExpenseItem) => {
    const categoryId = category.id;
    const categoryName = category.name.trim() || "Без категории";
    const existing = byCategory.get(categoryId);
    if (existing) {
      return existing;
    }

    const created: CategorySummaryItem = {
      categoryId,
      categoryName,
      plannedRub: 0,
      plannedUsd: 0,
      actualRub: 0,
      actualUsd: 0,
      diffRub: 0,
      diffUsd: 0,
    };
    byCategory.set(categoryId, created);
    return created;
  };

  for (const expense of monthData.expenses) {
    const summary = ensureCategory(expense);
    const amount = amountOrZero(expense.amount);
    summary.plannedRub += toRub(amount, expense.currency, monthData.exchangeRate);
    summary.plannedUsd += toUsd(amount, expense.currency, monthData.exchangeRate);
  }

  for (const transaction of monthData.transactions) {
    if (transaction.type !== "expense") {
      continue;
    }
    const category = monthData.expenses.find((item) => item.id === transaction.categoryId);
    if (!category) {
      continue;
    }

    const summary = ensureCategory(category);
    const amount = amountOrZero(transaction.amount);
    summary.actualRub += toRub(amount, transaction.currency, monthData.exchangeRate);
    summary.actualUsd += toUsd(amount, transaction.currency, monthData.exchangeRate);
  }

  for (const summary of byCategory.values()) {
    summary.diffRub = summary.plannedRub - summary.actualRub;
    summary.diffUsd = summary.plannedUsd - summary.actualUsd;
  }

  return Array.from(byCategory.values()).sort((left, right) =>
    left.categoryName.localeCompare(right.categoryName, "ru-RU"),
  );
}
