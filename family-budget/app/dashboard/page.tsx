"use client";

import Link from "next/link";
import { useMemo } from "react";

import { formatRub, formatUsd, toRub, toUsd } from "@/lib/currency";
import {
  calculateIncomeTotals,
  calculatePlannedExpenseTotals,
  calculatePocketTotals,
} from "@/lib/summary";
import { Currency } from "@/lib/types";
import { useBudget } from "@/components/BudgetProvider";
import { cn } from "@/lib/utils";

type IconKind = "rent" | "groceries" | "transport" | "entertainment" | "phone";

const rubCompactFormatter = new Intl.NumberFormat("ru-RU", {
  maximumFractionDigits: 0,
});
const usdCompactFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

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

function formatCompactAmount(value: number, currency: Currency): string {
  if (currency === "USD") {
    return `$${usdCompactFormatter.format(Math.abs(value))}`;
  }
  return `₽${rubCompactFormatter.format(Math.abs(value))}`;
}

function DualAmount({
  amount,
  currency,
  exchangeRate,
  primaryClassName = "text-[16px] font-semibold tracking-[-0.4px] text-[var(--ink)]",
  secondaryClassName = "mt-0.5 text-[11px] text-[var(--ink3)]",
  negative,
}: {
  amount: number;
  currency: Currency;
  exchangeRate: number;
  primaryClassName?: string;
  secondaryClassName?: string;
  negative?: boolean;
}) {
  const signed = negative ? -Math.abs(amount) : amount;
  const sign = signed < 0 ? "−" : "";
  const primary = `${sign}${formatCompactAmount(signed, currency)}`;
  const converted = currency === "USD" ? toRub(signed, "USD", exchangeRate) : toUsd(signed, "RUB", exchangeRate);
  const secondary = `${sign}${formatCompactAmount(converted, currency === "USD" ? "RUB" : "USD")}`;

  return (
    <div className="text-right">
      <p className={primaryClassName}>{primary}</p>
      <p className={secondaryClassName}>{secondary}</p>
    </div>
  );
}

function BigValue({ value, className }: { value: string; className: string }) {
  return (
    <span className={className}>
      {Array.from(value).map((char, index) =>
        /\d/.test(char) ? (
          <b key={`${char}-${index}`} className="font-bold">
            {char}
          </b>
        ) : (
          <span key={`${char}-${index}`}>{char}</span>
        ),
      )}
    </span>
  );
}

function formatDateTime(dateValue: string): string {
  const parsed = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return `${dateValue} · 00:00`;
  }

  const datePart = parsed.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "short",
  });
  const timePart = parsed.toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${datePart} · ${timePart}`;
}

export default function DashboardPage() {
  const { monthData } = useBudget();
  const income = useMemo(() => calculateIncomeTotals(monthData), [monthData]);
  const plannedExpenses = useMemo(() => calculatePlannedExpenseTotals(monthData), [monthData]);
  const pockets = useMemo(() => calculatePocketTotals(monthData), [monthData]);
  const available = useMemo(
    () => ({
      rub: income.rub - plannedExpenses.rub - pockets.rub,
      usd: income.usd - plannedExpenses.usd - pockets.usd,
    }),
    [income, plannedExpenses, pockets],
  );

  const categoryNameById = useMemo(
    () =>
      monthData.expenses.reduce<Record<string, string>>((accumulator, expense) => {
        accumulator[expense.id] = expense.name.trim() || "Без категории";
        return accumulator;
      }, {}),
    [monthData.expenses],
  );

  const recentTransactions = useMemo(() => {
    return [...monthData.transactions]
      .sort((left, right) => {
        const leftTs = new Date(`${left.date}T00:00:00`).getTime();
        const rightTs = new Date(`${right.date}T00:00:00`).getTime();
        return rightTs - leftTs;
      })
      .slice(0, 3);
  }, [monthData.transactions]);

  return (
    <div className="-mx-4 -mt-6 bg-[var(--bg)] px-4 pt-6 pb-4">
      <section className="mb-3 rounded-[20px] bg-[var(--white)] px-5 py-[22px]">
        <p className="mb-1.5 text-[12px] font-medium text-[var(--ink3)]">Total income</p>
        <div className="flex items-end gap-1.5">
          <BigValue
            value={rubCompactFormatter.format(income.rub)}
            className="text-[38px] font-bold leading-none tracking-[-1.5px] text-[var(--green)]"
          />
          <span className="pb-1 text-[22px] font-light text-[var(--ink3)]">₽</span>
        </div>
        <p className="mt-[5px] text-[13px] text-[var(--ink3)]">
          ${usdCompactFormatter.format(income.usd)}
        </p>
        <div className="my-[18px] h-[0.5px] bg-[var(--line)]" />
        <div className="grid grid-cols-3 gap-0">
          <div>
            <p className="mb-1 text-[11px] font-medium text-[var(--ink3)]">Available</p>
            <DualAmount
              amount={available.rub}
              currency="RUB"
              exchangeRate={monthData.exchangeRate}
              primaryClassName="text-[16px] font-semibold tracking-[-0.4px] text-[var(--green)]"
              secondaryClassName="mt-0.5 text-[11px] text-[var(--ink3)]"
            />
          </div>
          <div className="border-l border-[0.5px] border-[var(--line)] pl-4">
            <p className="mb-1 text-[11px] font-medium text-[var(--ink3)]">Spent</p>
            <DualAmount
              amount={plannedExpenses.rub}
              currency="RUB"
              exchangeRate={monthData.exchangeRate}
              primaryClassName="text-[16px] font-semibold tracking-[-0.4px] text-[var(--red)]"
              secondaryClassName="mt-0.5 text-[11px] text-[var(--ink3)]"
            />
          </div>
          <div className="border-l border-[0.5px] border-[var(--line)] pl-4">
            <p className="mb-1 text-[11px] font-medium text-[var(--ink3)]">Pockets</p>
            <DualAmount
              amount={pockets.rub}
              currency="RUB"
              exchangeRate={monthData.exchangeRate}
              primaryClassName="text-[16px] font-semibold tracking-[-0.4px] text-[var(--blue)]"
              secondaryClassName="mt-0.5 text-[11px] text-[var(--ink3)]"
            />
          </div>
        </div>
      </section>

      <section>
        <p className="mb-[10px] mt-5 px-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--ink3)]">
          Recent spending
        </p>
        <div className="overflow-hidden rounded-2xl bg-[var(--white)]">
          {recentTransactions.length === 0 ? (
            <div className="px-4 py-4 text-[13px] text-[var(--ink3)]">No transactions yet.</div>
          ) : (
            recentTransactions.map((transaction, index) => {
              const categoryName =
                categoryNameById[transaction.categoryId] || transaction.note.trim() || "Без категории";
              const kind = detectExpenseKind(categoryName);
              return (
                <div
                  key={transaction.id}
                  className={cn(
                    "flex min-h-[52px] items-center gap-3 px-4 py-[13px]",
                    index > 0 && "border-t border-[0.5px] border-[var(--line)]",
                  )}
                >
                  <IconWrap kind={kind} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-medium tracking-[-0.2px] text-[var(--ink)]">
                      {categoryName}
                    </p>
                    <p className="mt-[2px] truncate text-[11px] text-[var(--ink3)]">
                      {transaction.note.trim()
                        ? `${formatDateTime(transaction.date)} · ${transaction.note.trim()}`
                        : formatDateTime(transaction.date)}
                    </p>
                  </div>
                  <DualAmount
                    amount={transaction.amount}
                    currency={transaction.currency}
                    exchangeRate={monthData.exchangeRate}
                    primaryClassName="text-[14px] font-semibold tracking-[-0.3px] text-[var(--red)]"
                    secondaryClassName="mt-0.5 text-[11px] text-[var(--ink3)]"
                    negative
                  />
                </div>
              );
            })
          )}
          <Link
            href="/transactions"
            className="block w-full border-t border-[0.5px] border-[var(--line)] px-4 py-3 text-[13px] font-medium text-[var(--blue)]"
          >
            View all →
          </Link>
        </div>
      </section>

      <section>
        <p className="mb-[10px] mt-5 px-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--ink3)]">
          Pockets
        </p>
        <div className="overflow-hidden rounded-2xl bg-[var(--white)]">
          {monthData.pockets.length === 0 ? (
            <div className="px-4 py-4 text-[13px] text-[var(--ink3)]">No pockets yet.</div>
          ) : (
            monthData.pockets.map((pocket, index) => {
              const target = pocket.targetAmount ?? 0;
              const progress = target > 0 ? Math.min((pocket.savedAmount / target) * 100, 100) : 0;
              const primary =
                pocket.currency === "USD"
                  ? formatUsd(pocket.savedAmount)
                  : formatRub(pocket.savedAmount);
              const secondary =
                pocket.currency === "USD"
                  ? formatRub(toRub(pocket.savedAmount, "USD", monthData.exchangeRate))
                  : formatUsd(toUsd(pocket.savedAmount, "RUB", monthData.exchangeRate));

              return (
                <div
                  key={pocket.id}
                  className={cn(
                    "px-4 py-4",
                    index > 0 && "border-t border-[0.5px] border-[var(--line)]",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="truncate text-[14px] font-medium text-[var(--ink)]">{pocket.name || "Pocket"}</p>
                    <div className="text-right">
                      <p className="text-[13px] font-semibold" style={{ color: pocket.color }}>
                        {primary} · {Math.round(progress)}%
                      </p>
                      <p className="mt-0.5 text-[11px] text-[var(--ink3)]">{secondary}</p>
                    </div>
                  </div>
                  <div className="mt-2 h-[3px] overflow-hidden rounded-[2px] bg-[var(--bg)]">
                    <div
                      className="h-full rounded-[2px]"
                      style={{ width: `${progress}%`, backgroundColor: pocket.color }}
                    />
                  </div>
                </div>
              );
            })
          )}
          <Link
            href="/pockets"
            className="block w-full border-t border-[0.5px] border-[var(--line)] px-4 py-3 text-[13px] font-medium text-[var(--blue)]"
          >
            View all →
          </Link>
        </div>
      </section>
    </div>
  );
}
