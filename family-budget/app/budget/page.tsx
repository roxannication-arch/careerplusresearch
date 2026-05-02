"use client";

import { useMemo, useState } from "react";

import { useBudget } from "@/components/BudgetProvider";
import { convertCurrency, formatRub, formatUsd, toRub, toUsd } from "@/lib/currency";
import { getMonthLabel } from "@/lib/storage";
import { Currency } from "@/lib/types";
import { cn } from "@/lib/utils";

type IconKind = "income" | "rent" | "groceries" | "transport" | "entertainment" | "phone";

function hasNumber(value: number | null): value is number {
  return typeof value === "number" && Number.isFinite(value);
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
  if (kind === "income") return { background: "var(--green-bg)", color: "var(--green)" };
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

  if (kind === "entertainment") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    );
  }

  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 4v16M4 12h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
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

function EditableName({
  value,
  placeholder,
  onCommit,
}: {
  value: string;
  placeholder: string;
  onCommit: (next: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  if (isEditing) {
    return (
      <input
        autoFocus
        type="text"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => {
          onCommit(draft.trim());
          setIsEditing(false);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            onCommit(draft.trim());
            setIsEditing(false);
          }
        }}
        className="w-full border-0 bg-transparent text-[14px] font-medium tracking-[-0.2px] text-[var(--ink)] outline-none"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setDraft(value);
        setIsEditing(true);
      }}
      className="w-full truncate text-left text-[14px] font-medium tracking-[-0.2px] text-[var(--ink)] outline-none"
    >
      {value.trim() || placeholder}
    </button>
  );
}

function DualAmount({
  amount,
  currency,
  exchangeRate,
}: {
  amount: number | null;
  currency: Currency;
  exchangeRate: number;
}) {
  if (!hasNumber(amount)) {
    return (
      <div className="text-right">
        <p className="text-[14px] font-semibold tracking-[-0.3px] text-[var(--ink)]">—</p>
        <p className="mt-0.5 text-[11px] text-[var(--ink3)]">—</p>
      </div>
    );
  }

  const primary = currency === "USD" ? formatUsd(amount) : formatRub(amount);
  const secondary =
    currency === "USD"
      ? formatRub(toRub(amount, "USD", exchangeRate))
      : formatUsd(toUsd(amount, "RUB", exchangeRate));

  return (
    <div className="text-right">
      <p className="text-[14px] font-semibold tracking-[-0.3px] text-[var(--ink)]">{primary}</p>
      <p className="mt-0.5 text-[11px] text-[var(--ink3)]">{secondary}</p>
    </div>
  );
}

function EditableAmount({
  amount,
  currency,
  exchangeRate,
  onCommit,
}: {
  amount: number | null;
  currency: Currency;
  exchangeRate: number;
  onCommit: (next: number | null) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(amount === null ? "" : String(amount));

  if (isEditing) {
    return (
      <input
        autoFocus
        type="number"
        inputMode="decimal"
        step="0.01"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => {
          if (draft.trim() === "") {
            onCommit(null);
          } else {
            const parsed = Number.parseFloat(draft);
            onCommit(Number.isFinite(parsed) ? parsed : amount);
          }
          setIsEditing(false);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            if (draft.trim() === "") {
              onCommit(null);
            } else {
              const parsed = Number.parseFloat(draft);
              onCommit(Number.isFinite(parsed) ? parsed : amount);
            }
            setIsEditing(false);
          }
        }}
        className="w-[112px] border-0 bg-transparent text-right text-[14px] font-semibold tracking-[-0.3px] text-[var(--ink)] outline-none"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setDraft(amount === null ? "" : String(amount));
        setIsEditing(true);
      }}
      className="outline-none"
    >
      <DualAmount amount={amount} currency={currency} exchangeRate={exchangeRate} />
    </button>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="mb-[10px] mt-5 px-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--ink3)]">
      {children}
    </p>
  );
}

function SectionTotal({
  label,
  rub,
  usd,
  tone,
}: {
  label: string;
  rub: number;
  usd: number;
  tone: "income" | "expense";
}) {
  return (
    <div className="flex items-center justify-between border-t border-[0.5px] border-[var(--line)] px-4 py-[13px]">
      <p className="text-[13px] font-medium text-[var(--ink)]">{label}</p>
      <div className="text-right">
        <p
          className={cn(
            "text-[15px] font-bold tracking-[-0.3px]",
            tone === "income" ? "text-[var(--green)]" : "text-[var(--ink)]",
          )}
        >
          {formatRub(rub)}
        </p>
        <p className="mt-0.5 text-[11px] text-[var(--ink3)]">{formatUsd(usd)}</p>
      </div>
    </div>
  );
}

export default function BudgetPage() {
  const {
    previousMonth,
    hasPlanData,
    monthData,
    copyPlanFromMonth,
    updateIncome,
    addIncome,
    deleteIncome,
    updateExpense,
    addExpense,
  } = useBudget();

  const myIncomes = monthData.incomes.filter((income) => income.owner === "me");
  const milenaIncomes = monthData.incomes.filter((income) => income.owner === "milena");
  const previousMonthLabel = previousMonth ? getMonthLabel(previousMonth) : "";

  const roksanaTotals = useMemo(
    () =>
      myIncomes.reduce(
        (accumulator, income) => {
          const amount = hasNumber(income.amount) ? income.amount : 0;
          accumulator.rub += toRub(amount, income.currency, monthData.exchangeRate);
          accumulator.usd += toUsd(amount, income.currency, monthData.exchangeRate);
          return accumulator;
        },
        { rub: 0, usd: 0 },
      ),
    [monthData.exchangeRate, myIncomes],
  );

  const milenaTotals = useMemo(
    () =>
      milenaIncomes.reduce(
        (accumulator, income) => {
          const amount = hasNumber(income.amount) ? income.amount : 0;
          accumulator.rub += toRub(amount, income.currency, monthData.exchangeRate);
          accumulator.usd += toUsd(amount, income.currency, monthData.exchangeRate);
          return accumulator;
        },
        { rub: 0, usd: 0 },
      ),
    [milenaIncomes, monthData.exchangeRate],
  );

  const expenseTotals = useMemo(
    () =>
      monthData.expenses.reduce(
        (accumulator, expense) => {
          const amount = hasNumber(expense.amount) ? expense.amount : 0;
          accumulator.rub += toRub(amount, expense.currency, monthData.exchangeRate);
          accumulator.usd += toUsd(amount, expense.currency, monthData.exchangeRate);
          return accumulator;
        },
        { rub: 0, usd: 0 },
      ),
    [monthData.exchangeRate, monthData.expenses],
  );

  return (
    <div className="-mx-4 -mt-6 bg-[var(--bg)] px-4 pt-6 pb-4">
      {previousMonth && hasPlanData ? (
        <div className="mb-2 flex justify-end">
          <button
            type="button"
            onClick={() => {
              const approved = window.confirm(
                `Copy plan from ${previousMonthLabel}? Current month plan will be overwritten.`,
              );
              if (approved) {
                copyPlanFromMonth(previousMonth, { force: true });
              }
            }}
            className="text-[13px] text-[var(--blue)]"
          >
            ↓ Copy plan from last month
          </button>
        </div>
      ) : previousMonth && !hasPlanData ? (
        <div className="mb-3 rounded-2xl bg-[var(--white)] p-4">
          <p className="text-[14px] font-medium text-[var(--ink)]">Copy plan from {previousMonthLabel}?</p>
          <p className="mt-1 text-[12px] text-[var(--ink3)]">
            Income and planned expenses will be copied. Transactions won&apos;t.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => copyPlanFromMonth(previousMonth)}
              className="rounded-[10px] bg-[var(--blue)] px-5 py-2.5 text-[13px] font-semibold text-white"
            >
              Copy
            </button>
            <button
              type="button"
              className="rounded-[10px] border border-[0.5px] border-[var(--line2)] px-5 py-2.5 text-[13px] font-semibold text-[var(--ink2)]"
            >
              Start fresh
            </button>
          </div>
        </div>
      ) : null}

      <div className="rounded-xl bg-[var(--blue-bg)] px-[14px] py-3 text-[12px] font-medium text-[var(--blue)]">
        All amounts shown at $1 = ₽{monthData.exchangeRate}
      </div>

      <SectionLabel>Roksana income</SectionLabel>
      <div className="mb-3 overflow-hidden rounded-2xl bg-[var(--white)]">
        {myIncomes.map((income, index) => (
          <div
            key={income.id}
            className={cn(
              "flex min-h-[52px] items-center gap-3 px-4 py-[13px]",
              index > 0 && "border-t border-[0.5px] border-[var(--line)]",
            )}
          >
            <IconWrap kind="income" />
            <div className="min-w-0 flex-1">
              <EditableName
                value={income.name}
                placeholder="Income source"
                onCommit={(next) => updateIncome(income.id, { name: next })}
              />
            </div>
            <EditableAmount
              amount={income.amount}
              currency={income.currency}
              exchangeRate={monthData.exchangeRate}
              onCommit={(next) => updateIncome(income.id, { amount: next })}
            />
            <button
              type="button"
              onClick={() => {
                const nextCurrency: Currency = income.currency === "USD" ? "RUB" : "USD";
                const nextAmount = hasNumber(income.amount)
                  ? convertCurrency(
                      income.amount,
                      income.currency,
                      nextCurrency,
                      monthData.exchangeRate,
                    )
                  : income.amount;
                updateIncome(income.id, { currency: nextCurrency, amount: nextAmount });
              }}
              className="ml-[6px] rounded-[5px] border border-[0.5px] border-[var(--line2)] bg-[var(--bg)] px-[7px] py-[3px] text-[10px] font-semibold text-[var(--ink2)]"
            >
              {income.currency}
            </button>
            <button
              type="button"
              onClick={() => deleteIncome(income.id)}
              className="ml-1 text-[12px] text-[var(--ink3)]"
              aria-label="Delete income row"
            >
              ×
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => {
            console.log("[Budget] Add income clicked", { owner: "me" });
            addIncome("me");
          }}
          className="w-full border-t border-[0.5px] border-[var(--line)] bg-transparent px-4 py-3 text-left text-[13px] font-medium text-[var(--blue)]"
        >
          + Add income
        </button>
        <SectionTotal
          label="Total income"
          rub={roksanaTotals.rub}
          usd={roksanaTotals.usd}
          tone="income"
        />
      </div>

      <SectionLabel>Milena income</SectionLabel>
      <div className="mb-3 overflow-hidden rounded-2xl bg-[var(--white)]">
        {milenaIncomes.map((income, index) => (
          <div
            key={income.id}
            className={cn(
              "flex min-h-[52px] items-center gap-3 px-4 py-[13px]",
              index > 0 && "border-t border-[0.5px] border-[var(--line)]",
            )}
          >
            <IconWrap kind="income" />
            <div className="min-w-0 flex-1">
              <EditableName
                value={income.name}
                placeholder="Income source"
                onCommit={(next) => updateIncome(income.id, { name: next })}
              />
            </div>
            <EditableAmount
              amount={income.amount}
              currency={income.currency}
              exchangeRate={monthData.exchangeRate}
              onCommit={(next) => updateIncome(income.id, { amount: next })}
            />
            <button
              type="button"
              onClick={() => {
                const nextCurrency: Currency = income.currency === "USD" ? "RUB" : "USD";
                const nextAmount = hasNumber(income.amount)
                  ? convertCurrency(
                      income.amount,
                      income.currency,
                      nextCurrency,
                      monthData.exchangeRate,
                    )
                  : income.amount;
                updateIncome(income.id, { currency: nextCurrency, amount: nextAmount });
              }}
              className="ml-[6px] rounded-[5px] border border-[0.5px] border-[var(--line2)] bg-[var(--bg)] px-[7px] py-[3px] text-[10px] font-semibold text-[var(--ink2)]"
            >
              {income.currency}
            </button>
            <button
              type="button"
              onClick={() => deleteIncome(income.id)}
              className="ml-1 text-[12px] text-[var(--ink3)]"
              aria-label="Delete income row"
            >
              ×
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => {
            console.log("[Budget] Add income clicked", { owner: "milena" });
            addIncome("milena");
          }}
          className="w-full border-t border-[0.5px] border-[var(--line)] bg-transparent px-4 py-3 text-left text-[13px] font-medium text-[var(--blue)]"
        >
          + Add income
        </button>
        <SectionTotal
          label="Total income"
          rub={milenaTotals.rub}
          usd={milenaTotals.usd}
          tone="income"
        />
      </div>

      <SectionLabel>Expense categories</SectionLabel>
      <div className="mb-3 overflow-hidden rounded-2xl bg-[var(--white)]">
        {monthData.expenses.map((expense, index) => (
          <div
            key={expense.id}
            className={cn(
              "flex min-h-[52px] items-center gap-3 px-4 py-[13px]",
              index > 0 && "border-t border-[0.5px] border-[var(--line)]",
            )}
          >
            <IconWrap kind={detectExpenseKind(expense.name)} />
            <div className="min-w-0 flex-1">
              <EditableName
                value={expense.name}
                placeholder="Category name"
                onCommit={(next) => updateExpense(expense.id, { name: next })}
              />
            </div>
            <EditableAmount
              amount={expense.amount}
              currency={expense.currency}
              exchangeRate={monthData.exchangeRate}
              onCommit={(next) => updateExpense(expense.id, { amount: next })}
            />
            <button
              type="button"
              onClick={() => {
                const nextCurrency: Currency = expense.currency === "USD" ? "RUB" : "USD";
                const nextAmount = hasNumber(expense.amount)
                  ? convertCurrency(
                      expense.amount,
                      expense.currency,
                      nextCurrency,
                      monthData.exchangeRate,
                    )
                  : expense.amount;
                updateExpense(expense.id, { currency: nextCurrency, amount: nextAmount });
              }}
              className="ml-[6px] rounded-[5px] border border-[0.5px] border-[var(--line2)] bg-[var(--bg)] px-[7px] py-[3px] text-[10px] font-semibold text-[var(--ink2)]"
            >
              {expense.currency}
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addExpense}
          className="w-full border-t border-[0.5px] border-[var(--line)] bg-transparent px-4 py-3 text-left text-[13px] font-medium text-[var(--blue)]"
        >
          + Add category
        </button>
        <SectionTotal
          label="Total expenses"
          rub={expenseTotals.rub}
          usd={expenseTotals.usd}
          tone="expense"
        />
      </div>
    </div>
  );
}
