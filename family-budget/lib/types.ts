export type Currency = "RUB" | "USD";

export interface BudgetItem {
  id: string;
  name: string;
  amount: number | null;
  currency: Currency;
}

export type IncomeItem = BudgetItem;

export type ExpenseItem = BudgetItem;

export interface Pocket {
  id: string;
  name: string;
  savedAmount: number;
  targetAmount: number | null;
  currency: Currency;
  color: string;
}

export interface Transaction {
  id: string;
  amount: number;
  currency: Currency;
  categoryId: string;
  date: string;
  note: string;
}

export interface MonthBudgetData {
  exchangeRate: number;
  incomes: IncomeItem[];
  expenses: ExpenseItem[];
  pockets: Pocket[];
  transactions: Transaction[];
}

export interface BudgetStorageState {
  selectedMonth: string;
  months: Record<string, MonthBudgetData>;
}
