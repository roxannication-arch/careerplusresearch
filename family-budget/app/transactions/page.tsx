"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { useBudget } from "@/components/BudgetProvider";
import { convertCurrency, toRub, toUsd } from "@/lib/currency";
import { encodeIncomeCategoryId, parseIncomeCategoryId } from "@/lib/income";
import { Currency, IncomeOwner } from "@/lib/types";
import { cn } from "@/lib/utils";

type IconKind = "rent" | "groceries" | "transport" | "entertainment" | "phone";

const amountFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

function formatSignedAmount(amount: number, currency: Currency): string {
  const sign = amount < 0 ? "−" : "";
  const symbol = currency === "USD" ? "$" : "₽";
  return `${sign}${symbol}${amountFormatter.format(Math.abs(amount))}`;
}

function formatDateGroupLabel(dateValue: string): string {
  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((today.getTime() - target.getTime()) / 86_400_000);

  if (diffDays === 0) {
    return "Today";
  }
  if (diffDays === 1) {
    return "Yesterday";
  }

  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });
}

function detectExpenseKind(name: string): IconKind {
  const lowered = name.toLowerCase();
  if (/(rent|аренд|кварт|жиль)/.test(lowered)) return "rent";
  if (/(transport|бенз|такси|авто|машин|метро)/.test(lowered)) return "transport";
  if (/(phone|телефон|связ|интернет|mobile)/.test(lowered)) return "phone";
  if (/(entertain|развлеч|досуг|кино|игр)/.test(lowered)) return "entertainment";
  return "groceries";
}

function getIconColors(kind: IconKind): { background: string; color: string } {
  if (kind === "rent") return { background: "var(--red-bg)", color: "var(--red)" };
  if (kind === "transport") return { background: "var(--purple-bg)", color: "var(--purple)" };
  if (kind === "phone") return { background: "var(--amber-bg)", color: "var(--amber)" };
  if (kind === "entertainment") return { background: "var(--blue-bg)", color: "var(--blue)" };
  return { background: "var(--green-bg)", color: "var(--green)" };
}

function IconGlyph({ kind }: { kind: IconKind }) {
  if (kind === "rent") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 10.2 12 4l8 6.2v8.3a1 1 0 0 1-1 1h-5.1v-5.9h-3.8v5.9H5a1 1 0 0 1-1-1v-8.3Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (kind === "groceries") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="4" y="5" width="16" height="15" rx="2.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 3.5v3M16 3.5v3M4 9h16M8 12.5h3M13 12.5h3M8 16h3M13 16h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }
  if (kind === "transport") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M6.5 15.5h11l-.8-4.2a2 2 0 0 0-2-1.6H9.3a2 2 0 0 0-2 1.6l-.8 4.2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M6 15.5v2.2M18 15.5v2.2M8 12h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="8" cy="18" r="1" fill="currentColor" />
        <circle cx="16" cy="18" r="1" fill="currentColor" />
      </svg>
    );
  }
  if (kind === "phone") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M5 8h14M5 12h14M5 16h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function IconWrap({ kind }: { kind: IconKind }) {
  const colors = getIconColors(kind);
  return (
    <span
      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]"
      style={{ backgroundColor: colors.background, color: colors.color }}
    >
      <IconGlyph kind={kind} />
    </span>
  );
}

export default function TransactionsPage() {
  const { monthData, addTransaction, updateTransaction, deleteTransaction } = useBudget();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [entryType, setEntryType] = useState<"expense" | "income">("expense");
  const [transactionTypeFilter, setTransactionTypeFilter] = useState<"all" | "expense" | "income">("all");
  const [currencyQuickFilter, setCurrencyQuickFilter] = useState<"all" | Currency>("all");

  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [draftCategoryFilter, setDraftCategoryFilter] = useState("all");
  const [draftTransactionTypeFilter, setDraftTransactionTypeFilter] = useState<"all" | "expense" | "income">(
    "all",
  );
  const [draftDateFrom, setDraftDateFrom] = useState("");
  const [draftDateTo, setDraftDateTo] = useState("");

  const [amountInput, setAmountInput] = useState("");
  const [currency, setCurrency] = useState<Currency>("RUB");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [categoryId, setCategoryId] = useState(monthData.expenses[0]?.id ?? "");
  const [incomeOwner, setIncomeOwner] = useState<IncomeOwner>("me");
  const [incomePlanSource, setIncomePlanSource] = useState("");
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);
  const filterContainerRef = useRef<HTMLDivElement | null>(null);

  const categoryLabelMap = new Map(
    monthData.expenses.map((expense, index) => [
      expense.id,
      expense.name.trim() || `Категория ${index + 1}`,
    ]),
  );
  const activeCategoryId = monthData.expenses.some((expense) => expense.id === categoryId)
    ? categoryId
    : (monthData.expenses[0]?.id ?? "");
  const incomeSourcesByOwner = useMemo(
    () => ({
      me: Array.from(
        new Set(
          monthData.incomes
            .filter((income) => income.owner === "me")
            .map((income) => income.name.trim())
            .filter(Boolean),
        ),
      ),
      milena: Array.from(
        new Set(
          monthData.incomes
            .filter((income) => income.owner === "milena")
            .map((income) => income.name.trim())
            .filter(Boolean),
        ),
      ),
    }),
    [monthData.incomes],
  );
  const currentOwnerIncomeSources = incomeSourcesByOwner[incomeOwner];

  const parsedAmount = Number.parseFloat(amountInput);
  const hasAmount = Number.isFinite(parsedAmount) && parsedAmount > 0;
  const approxValue = hasAmount
    ? currency === "RUB"
      ? formatSignedAmount(
          convertCurrency(parsedAmount, "RUB", "USD", monthData.exchangeRate),
          "USD",
        ).replace("−", "")
      : formatSignedAmount(
          convertCurrency(parsedAmount, "USD", "RUB", monthData.exchangeRate),
          "RUB",
        ).replace("−", "")
    : null;

  const hasActiveFilters =
    transactionTypeFilter !== "all" ||
    currencyQuickFilter !== "all" ||
    categoryFilter !== "all" ||
    Boolean(dateFrom) ||
    Boolean(dateTo);

  useEffect(() => {
    if (!isFilterOpen) {
      return;
    }

    const handleOutside = (event: MouseEvent) => {
      if (!filterContainerRef.current?.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutside);
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isFilterOpen]);

  const resolvedIncomePlanSource = useMemo(() => {
    const trimmed = incomePlanSource.trim();
    if (trimmed && currentOwnerIncomeSources.includes(trimmed)) {
      return trimmed;
    }
    return currentOwnerIncomeSources[0] ?? "";
  }, [currentOwnerIncomeSources, incomePlanSource]);

  const filteredTransactions = useMemo(
    () =>
      monthData.transactions.filter((transaction) => {
        if (transactionTypeFilter !== "all" && transaction.type !== transactionTypeFilter) {
          return false;
        }
        if (currencyQuickFilter !== "all" && transaction.currency !== currencyQuickFilter) {
          return false;
        }
        if (
          categoryFilter !== "all" &&
          transaction.type === "expense" &&
          transaction.categoryId !== categoryFilter
        ) {
          return false;
        }
        if (dateFrom && transaction.date < dateFrom) {
          return false;
        }
        if (dateTo && transaction.date > dateTo) {
          return false;
        }
        return true;
      }),
    [
      categoryFilter,
      currencyQuickFilter,
      dateFrom,
      dateTo,
      monthData.transactions,
      transactionTypeFilter,
    ],
  );

  const groupedTransactions = useMemo(() => {
    const sorted = [...filteredTransactions].sort((left, right) => right.date.localeCompare(left.date));
    const grouped = new Map<string, typeof filteredTransactions>();
    for (const transaction of sorted) {
      const list = grouped.get(transaction.date) ?? [];
      list.push(transaction);
      grouped.set(transaction.date, list);
    }
    return Array.from(grouped.entries()).map(([dateKey, transactions]) => ({
      dateKey,
      label: formatDateGroupLabel(dateKey),
      transactions,
    }));
  }, [filteredTransactions]);

  return (
    <div className="-mx-4 -mt-6 bg-[var(--bg)] px-4 pt-6 pb-[100px]">
      <div className="relative mb-3 flex justify-end" ref={filterContainerRef}>
        <button
          type="button"
          onClick={() => {
            if (isFilterOpen) {
              setIsFilterOpen(false);
              return;
            }
            setDraftCategoryFilter(categoryFilter);
            setDraftTransactionTypeFilter(transactionTypeFilter);
            setDraftDateFrom(dateFrom);
            setDraftDateTo(dateTo);
            setIsFilterOpen(true);
          }}
          className="relative rounded-[10px] border border-[0.5px] border-[var(--line2)] bg-[var(--white)] p-2 text-[var(--ink3)]"
          aria-label="Open filters"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M4 6.5h16M7.5 12h9M10.5 17.5h3"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
            />
          </svg>
          {hasActiveFilters ? (
            <span className="absolute top-1 right-1 inline-flex h-2 w-2 rounded-full bg-[var(--blue)]" />
          ) : null}
        </button>

        <div
          className={cn(
            "absolute top-[calc(100%+8px)] right-0 z-[115] w-[min(320px,calc(100vw-32px))] rounded-[14px] border border-[0.5px] border-[var(--line2)] bg-[var(--white)] p-4 transition-all duration-150 ease-out",
            isFilterOpen ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none -translate-y-2 opacity-0",
          )}
        >
          <div className="mb-3">
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--ink3)]">
              Type
            </p>
            <select
              value={draftTransactionTypeFilter}
              onChange={(event) =>
                setDraftTransactionTypeFilter(event.target.value as "all" | "expense" | "income")
              }
              className="w-full rounded-[8px] border-0 bg-[var(--bg)] px-[10px] py-[10px] text-[13px] text-[var(--ink)] outline-none"
            >
              <option value="all">All transactions</option>
              <option value="expense">Expenses</option>
              <option value="income">Income</option>
            </select>
          </div>

          <div className="mb-3">
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--ink3)]">
              Category
            </p>
            <select
              value={draftCategoryFilter}
              onChange={(event) => setDraftCategoryFilter(event.target.value)}
              className="w-full rounded-[8px] border-0 bg-[var(--bg)] px-[10px] py-[10px] text-[13px] text-[var(--ink)] outline-none"
            >
              <option value="all">All categories</option>
              {monthData.expenses.map((expense) => (
                <option key={expense.id} value={expense.id}>
                  {categoryLabelMap.get(expense.id)}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--ink3)]">
                Date from
              </p>
              <input
                type="date"
                value={draftDateFrom}
                onChange={(event) => setDraftDateFrom(event.target.value)}
                className="w-full rounded-[8px] border-0 bg-[var(--bg)] px-[10px] py-[10px] text-[13px] text-[var(--ink)] outline-none"
              />
            </div>
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--ink3)]">
                Date to
              </p>
              <input
                type="date"
                value={draftDateTo}
                onChange={(event) => setDraftDateTo(event.target.value)}
                className="w-full rounded-[8px] border-0 bg-[var(--bg)] px-[10px] py-[10px] text-[13px] text-[var(--ink)] outline-none"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setTransactionTypeFilter(draftTransactionTypeFilter);
              setCategoryFilter(draftCategoryFilter);
              setDateFrom(draftDateFrom);
              setDateTo(draftDateTo);
              setIsFilterOpen(false);
            }}
            className="mt-3 w-full rounded-[10px] bg-[var(--blue)] px-4 py-2.5 text-[13px] font-semibold text-white"
          >
            Apply
          </button>

          <button
            type="button"
            onClick={() => {
              setTransactionTypeFilter("all");
              setCurrencyQuickFilter("all");
              setCategoryFilter("all");
              setDateFrom("");
              setDateTo("");
              setDraftTransactionTypeFilter("all");
              setDraftCategoryFilter("all");
              setDraftDateFrom("");
              setDraftDateTo("");
            }}
            className="mt-2 block w-full text-center text-[12px] text-[var(--ink3)]"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="mb-3 flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {([
          { key: "all", label: "All" },
          { key: "expense", label: "Expenses" },
          { key: "income", label: "Income" },
        ] as const).map((chip) => {
          const active = transactionTypeFilter === chip.key;
          return (
            <button
              key={chip.key}
              type="button"
              onClick={() => setTransactionTypeFilter(chip.key)}
              className={cn(
                "shrink-0 rounded-[10px] px-3 py-1.5 text-[12px] transition-colors",
                active ? "bg-[var(--blue-bg)] font-semibold text-[var(--blue)]" : "bg-[var(--white)] text-[var(--ink3)]",
              )}
            >
              {chip.label}
            </button>
          );
        })}

        {(["RUB", "USD"] as const).map((chip) => {
          const active = currencyQuickFilter === chip;
          return (
            <button
              key={chip}
              type="button"
              onClick={() => setCurrencyQuickFilter((previous) => (previous === chip ? "all" : chip))}
              className={cn(
                "shrink-0 rounded-[10px] px-3 py-1.5 text-[12px] transition-colors",
                active ? "bg-[var(--blue-bg)] font-semibold text-[var(--blue)]" : "bg-[var(--white)] text-[var(--ink3)]",
              )}
            >
              {chip}
            </button>
          );
        })}
      </div>

      {groupedTransactions.length === 0 ? (
        <div className="rounded-2xl bg-[var(--white)] px-4 py-4">
          <p className="text-[13px] text-[var(--ink3)]">No transactions yet.</p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => {
                setEditingTransactionId(null);
                setEntryType("expense");
                setIsSheetOpen(true);
              }}
              className="rounded-[10px] bg-[var(--bg)] px-3 py-1.5 text-[12px] font-medium text-[var(--ink2)]"
            >
              Add expense
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingTransactionId(null);
                setEntryType("income");
                setIsSheetOpen(true);
              }}
              className="rounded-[10px] bg-[var(--blue-bg)] px-3 py-1.5 text-[12px] font-semibold text-[var(--blue)]"
            >
              Add income
            </button>
          </div>
        </div>
      ) : (
        groupedTransactions.map((group, groupIndex) => (
          <section key={group.dateKey}>
            <p
              className={cn(
                "mb-[10px] text-[12px] font-semibold tracking-[-0.1px] text-[var(--ink3)]",
                groupIndex === 0 ? "mt-0" : "mt-5",
              )}
            >
              {group.label}
            </p>
            <div className="overflow-hidden rounded-2xl bg-[var(--white)]">
              {group.transactions.map((transaction, index) => {
                const isIncome = transaction.type === "income";
                const incomeMeta = isIncome ? parseIncomeCategoryId(transaction.categoryId) : null;
                const ownerLabel = transaction.owner === "milena" ? "Milena" : "Roksana";
                const categoryName = categoryLabelMap.get(transaction.categoryId) ?? "No category";
                const title = isIncome
                  ? transaction.source?.trim() || incomeMeta?.source || ownerLabel
                  : categoryName;
                const subtitle = isIncome
                  ? `${ownerLabel}${transaction.note.trim() ? ` • ${transaction.note.trim()}` : ""}`
                  : transaction.note.trim() || "No note";
                const kind = isIncome ? "groceries" : detectExpenseKind(categoryName);
                const converted =
                  transaction.currency === "USD"
                    ? toRub(transaction.amount, "USD", monthData.exchangeRate)
                    : toUsd(transaction.amount, "RUB", monthData.exchangeRate);

                return (
                  <div
                    key={transaction.id}
                    className={cn(
                      "flex items-center gap-3 px-4 py-[13px]",
                      index > 0 && "border-t border-[0.5px] border-[var(--line)]",
                    )}
                  >
                    <IconWrap kind={kind} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-medium tracking-[-0.2px] text-[var(--ink)]">
                        {title}
                      </p>
                      <p className="mt-[1px] truncate text-[11px] text-[var(--ink3)]">
                        {subtitle}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p
                        className={cn(
                          "text-[14px] font-semibold tracking-[-0.3px]",
                          isIncome ? "text-[var(--green)]" : "text-[var(--red)]",
                        )}
                      >
                        {formatSignedAmount(isIncome ? Math.abs(transaction.amount) : -Math.abs(transaction.amount), transaction.currency)}
                      </p>
                      <p className="mt-0.5 text-[11px] text-[var(--ink3)]">
                        {formatSignedAmount(
                          isIncome ? Math.abs(converted) : -Math.abs(converted),
                          transaction.currency === "USD" ? "RUB" : "USD",
                        )}
                      </p>
                      <div className="mt-1 flex items-center justify-end gap-2">
                        <button
                          type="button"
                          className="text-[11px] font-medium text-[var(--blue)]"
                          onClick={() => {
                            const parsedIncome = parseIncomeCategoryId(transaction.categoryId);
                            setEditingTransactionId(transaction.id);
                            setEntryType(transaction.type);
                            setAmountInput(String(transaction.amount));
                            setCurrency(transaction.currency);
                            setNote(transaction.note);
                            setDate(transaction.date);
                            if (transaction.type === "income") {
                              const owner: IncomeOwner =
                                transaction.owner === "milena" || parsedIncome.owner === "milena"
                                  ? "milena"
                                  : "me";
                              setIncomeOwner(owner);
                              setIncomePlanSource(transaction.source?.trim() || parsedIncome.source || "");
                            } else {
                              setCategoryId(transaction.categoryId);
                            }
                            setIsSheetOpen(true);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="text-[11px] font-medium text-[var(--red)]"
                          onClick={() => {
                            deleteTransaction(transaction.id);
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))
      )}

      <button
        type="button"
        onClick={() => {
          setEditingTransactionId(null);
          setEntryType("expense");
          setAmountInput("");
          setCurrency("RUB");
          setNote("");
          setDate(new Date().toISOString().slice(0, 10));
          setIncomeOwner("me");
          setIncomePlanSource("");
          setIsSheetOpen(true);
        }}
        className="fixed right-[18px] bottom-[92px] z-[110] inline-flex items-center gap-[7px] rounded-[50px] border-0 bg-[var(--blue)] px-5 py-[13px] text-[13px] font-semibold tracking-[-0.2px] text-white shadow-[0_4px_20px_rgba(0,113,227,0.30)]"
      >
        <span aria-hidden="true">+</span>
        Add transaction
      </button>

      {isSheetOpen ? (
        <div
          className="fixed inset-0 z-[120] bg-[rgba(0,0,0,0.22)]"
          onClick={() => setIsSheetOpen(false)}
        >
          <div
            className="absolute right-0 bottom-0 left-0 mx-auto w-full max-w-[480px] rounded-t-[20px] bg-[var(--white)] px-5 pt-6 pb-5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mx-auto mb-5 h-1 w-9 rounded-[2px] bg-[var(--line2)]" />
            <h2 className="mb-5 text-[17px] font-semibold tracking-[-0.4px] text-[var(--ink)]">
              {editingTransactionId ? "Edit transaction" : "New transaction"}
            </h2>

            <div className="mb-[14px]">
              <div className="flex items-center gap-2">
                {([
                  { key: "expense", label: "Expense" },
                  { key: "income", label: "Income" },
                ] as const).map((item) => {
                  const active = item.key === entryType;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setEntryType(item.key)}
                      className={cn(
                        "rounded-[10px] px-4 py-2 text-[13px] transition-colors",
                        active
                          ? "bg-[#0071E3] font-semibold text-white"
                          : "bg-[#F5F5F7] text-[#AEAEB2]",
                      )}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mb-[14px]">
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--ink3)]">
                Amount
              </p>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min={0}
                value={amountInput}
                onChange={(event) => setAmountInput(event.target.value)}
                className="w-full rounded-[10px] border-0 bg-[var(--bg)] px-[14px] py-3 text-[15px] outline-none"
              />
              <p className="mt-1.5 text-[12px] text-[var(--ink3)]">
                {hasAmount ? `≈ ${approxValue}` : "≈ —"}
              </p>
            </div>

            <div className="mb-[14px]">
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--ink3)]">
                Currency
              </p>
              <div className="flex items-center gap-2">
                {(["RUB", "USD"] as const).map((item) => {
                  const active = item === currency;
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setCurrency(item)}
                      className={cn(
                        "rounded-[10px] px-4 py-2 text-[13px] transition-colors",
                        active
                          ? "bg-[var(--blue-bg)] font-semibold text-[var(--blue)]"
                          : "bg-[var(--bg)] text-[var(--ink3)]",
                      )}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>

            {entryType === "expense" ? (
              <div className="mb-[14px]">
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--ink3)]">
                  Category
                </p>
                <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {monthData.expenses.map((expense, index) => {
                    const label = categoryLabelMap.get(expense.id) ?? `Category ${index + 1}`;
                    const active = expense.id === activeCategoryId;
                    return (
                      <button
                        key={expense.id}
                        type="button"
                        onClick={() => setCategoryId(expense.id)}
                        className={cn(
                          "shrink-0 rounded-[10px] px-4 py-2 text-[13px] transition-colors",
                          active
                            ? "bg-[var(--blue-bg)] font-semibold text-[var(--blue)]"
                            : "bg-[var(--bg)] text-[var(--ink3)]",
                        )}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <>
                <div className="mb-[14px]">
                  <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--ink3)]">
                    Owner
                  </p>
                  <div className="flex items-center gap-2">
                    {([
                      { key: "me" as const, label: "Roksana" },
                      { key: "milena" as const, label: "Milena" },
                    ] as const).map((ownerItem) => {
                      const active = incomeOwner === ownerItem.key;
                      return (
                        <button
                          key={ownerItem.key}
                          type="button"
                          onClick={() => {
                            setIncomeOwner(ownerItem.key);
                          }}
                          className={cn(
                            "rounded-[10px] px-4 py-2 text-[13px] transition-colors",
                            active
                              ? "bg-[var(--blue-bg)] font-semibold text-[var(--blue)]"
                              : "bg-[var(--bg)] text-[var(--ink3)]",
                          )}
                        >
                          {ownerItem.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="mb-[14px]">
                  <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--ink3)]">
                    Income source
                  </p>
                  <select
                    value={resolvedIncomePlanSource}
                    onChange={(event) => setIncomePlanSource(event.target.value)}
                    className="w-full rounded-[10px] border-0 bg-[var(--bg)] px-[14px] py-3 text-[14px] text-[var(--ink)] outline-none"
                  >
                    {currentOwnerIncomeSources.length === 0 ? (
                      <option value="">No sources in Plan</option>
                    ) : null}
                    {currentOwnerIncomeSources.map((sourceName) => (
                      <option key={sourceName} value={sourceName}>
                        {sourceName}
                      </option>
                    ))}
                  </select>
                  {currentOwnerIncomeSources.length === 0 ? (
                    <p className="mt-1.5 text-[11px] text-[var(--ink3)]">
                      Add at least one income source on the Plan page first.
                    </p>
                  ) : null}
                </div>
              </>
            )}

            <div className="mb-[14px]">
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--ink3)]">
                Date
              </p>
              <input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="w-full rounded-[10px] border-0 bg-[var(--bg)] px-[14px] py-3 text-[15px] outline-none"
              />
            </div>

            <div className="mb-[14px]">
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--ink3)]">
                Note
              </p>
              <input
                type="text"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                className="w-full rounded-[10px] border-0 bg-[var(--bg)] px-[14px] py-3 text-[15px] outline-none"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                const parsed = Number.parseFloat(amountInput);
                if (!Number.isFinite(parsed) || parsed <= 0) {
                  return;
                }
                if (entryType === "expense" && !activeCategoryId) {
                  return;
                }
                const selectedIncomeSource = resolvedIncomePlanSource.trim();
                if (entryType === "income" && !selectedIncomeSource) {
                  return;
                }

                const payload = {
                  amount: parsed,
                  currency,
                  categoryId:
                    entryType === "income"
                      ? encodeIncomeCategoryId(incomeOwner, selectedIncomeSource)
                      : activeCategoryId,
                  type: entryType,
                  source: entryType === "income" ? selectedIncomeSource : undefined,
                  owner: entryType === "income" ? incomeOwner : null,
                  date,
                  note,
                } as const;

                if (editingTransactionId) {
                  updateTransaction(editingTransactionId, payload);
                } else {
                  addTransaction({
                    ...payload,
                  });
                }
                setAmountInput("");
                setNote("");
                setIncomeOwner("me");
                setIncomePlanSource("");
                setEntryType("expense");
                setEditingTransactionId(null);
                setDate(new Date().toISOString().slice(0, 10));
                setIsSheetOpen(false);
              }}
              className="mt-2 w-full rounded-xl bg-[var(--blue)] px-4 py-[14px] text-[15px] font-semibold text-white"
            >
              {editingTransactionId ? "Save changes" : "Save transaction"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
