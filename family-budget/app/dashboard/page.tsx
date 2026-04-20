"use client";

import Link from "next/link";
import { useMemo } from "react";

import { toRub, toUsd } from "@/lib/currency";
import {
  calculateIncomeTotals,
  calculatePlannedExpenseTotals,
  calculatePocketTotals,
} from "@/lib/summary";
import { Currency } from "@/lib/types";
import { useBudget } from "@/components/BudgetProvider";
import { cn } from "@/lib/utils";

type IconKind = "rent" | "groceries" | "transport" | "entertainment" | "phone";

const numberFormatter = new Intl.NumberFormat("en-US", {
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

function formatNumber(value: number): string {
  return numberFormatter.format(Math.abs(Math.round(value)));
}

function DualAmount({
  amount,
  currency,
  exchangeRate,
  primaryClassName = "text-[16px] font-semibold tracking-[-0.4px] text-[var(--ink)]",
  secondaryClassName = "mt-0.5 text-[11px] text-[var(--ink3)]",
  primarySymbolClassName = "",
  negative,
}: {
  amount: number;
  currency: Currency;
  exchangeRate: number;
  primaryClassName?: string;
  secondaryClassName?: string;
  primarySymbolClassName?: string;
  negative?: boolean;
}) {
  const signed = negative ? -Math.abs(amount) : amount;
  const primarySign = signed < 0 ? "−" : "";
  const converted = currency === "USD" ? toRub(signed, "USD", exchangeRate) : toUsd(signed, "RUB", exchangeRate);
  const secondarySign = converted < 0 ? "−" : "";
  const secondaryCurrency = currency === "USD" ? "RUB" : "USD";
  const primarySymbol = currency === "USD" ? "$" : "₽";
  const secondarySymbol = secondaryCurrency === "USD" ? "$" : "₽";

  return (
    <div className="text-right">
      <p className={primaryClassName}>
        {primarySign}
        {formatNumber(signed)}
        <span className={cn("ml-1 text-[13px] font-normal", primarySymbolClassName)}>
          {primarySymbol}
        </span>
      </p>
      <p className={secondaryClassName}>
        {secondarySign}
        {formatNumber(converted)}
        <span className="ml-1">{secondarySymbol}</span>
      </p>
    </div>
  );
}

function BigValue({ value, className }: { value: string; className: string }) {
  return (
    <span className={className}>
      {Array.from(value).map((char, index) =>
        /\d/.test(char) ? (
          <b key={`${char}-${index}`} className="font-semibold">
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
  const spent = useMemo(
    () =>
      monthData.transactions.reduce(
        (accumulator, transaction) => ({
          rub: accumulator.rub + toRub(transaction.amount, transaction.currency, monthData.exchangeRate),
          usd: accumulator.usd + toUsd(transaction.amount, transaction.currency, monthData.exchangeRate),
        }),
        { rub: 0, usd: 0 },
      ),
    [monthData.exchangeRate, monthData.transactions],
  );
  const plannedExpenses = useMemo(() => calculatePlannedExpenseTotals(monthData), [monthData]);
  const pockets = useMemo(() => calculatePocketTotals(monthData), [monthData]);
  const available = useMemo(
    () => ({
      rub: income.rub - spent.rub - pockets.rub,
      usd: income.usd - spent.usd - pockets.usd,
    }),
    [income, spent, pockets],
  );
  const totalIncome = income.rub;
  const actualSpent = spent.rub;
  const totalPlanned = plannedExpenses.rub;
  const pocketTotal = pockets.rub;
  const rate = monthData.exchangeRate;

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
      <section className="mb-3 rounded-[20px] bg-[var(--white)] px-5 py-6">
        <p className="mb-1.5 text-[12px] font-medium text-[var(--ink3)]">Available</p>
        <div className="flex items-end gap-1.5">
          <BigValue
            value={formatNumber(available.rub)}
            className={cn(
              "text-[40px] font-light leading-none tracking-[-1.5px]",
              available.rub < 0 ? "text-[var(--red)]" : "text-[var(--ink)]",
            )}
          />
          <span className="mb-1 ml-1 text-[20px] font-light text-[var(--ink3)]">₽</span>
        </div>
        <p className="mt-[5px] text-[13px] text-[var(--ink3)]">
          {formatNumber(available.usd)} $
        </p>
        <div
          style={{
            display: "flex",
            gap: 0,
            marginTop: "18px",
            paddingTop: "18px",
            borderTop: "0.5px solid rgba(0,0,0,0.06)",
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "11px", fontWeight: 500, color: "#AEAEB2", marginBottom: "4px" }}>
              Income
            </div>
            <div style={{ fontSize: "17px", fontWeight: 600, letterSpacing: "-0.4px", color: "#1A9A44" }}>
              {totalIncome.toLocaleString("en-US", { maximumFractionDigits: 0 })}
              <span style={{ fontSize: "12px", fontWeight: 400, marginLeft: "2px" }}>₽</span>
            </div>
            <div style={{ fontSize: "11px", color: "#AEAEB2", marginTop: "2px" }}>
              {(totalIncome / rate).toLocaleString("en-US", { maximumFractionDigits: 0 })} $
            </div>
          </div>

          <div style={{ flex: 1, borderLeft: "0.5px solid rgba(0,0,0,0.06)", paddingLeft: "16px" }}>
            <div style={{ fontSize: "11px", fontWeight: 500, color: "#AEAEB2", marginBottom: "4px" }}>
              Spent
            </div>
            <div style={{ fontSize: "17px", fontWeight: 600, letterSpacing: "-0.4px", color: "#C7372F" }}>
              {actualSpent.toLocaleString("en-US", { maximumFractionDigits: 0 })}
              <span style={{ fontSize: "12px", fontWeight: 400, marginLeft: "2px" }}>₽</span>
            </div>
            <div style={{ fontSize: "11px", color: "#AEAEB2", marginTop: "2px" }}>
              {(actualSpent / rate).toLocaleString("en-US", { maximumFractionDigits: 0 })} $
            </div>
            <div style={{ fontSize: "10px", color: "#AEAEB2", marginTop: "3px", whiteSpace: "nowrap" }}>
              of {totalPlanned.toLocaleString("en-US", { maximumFractionDigits: 0 })} ₽ planned
            </div>
          </div>

          <div style={{ flex: 1, borderLeft: "0.5px solid rgba(0,0,0,0.06)", paddingLeft: "16px" }}>
            <div style={{ fontSize: "11px", fontWeight: 500, color: "#AEAEB2", marginBottom: "4px" }}>
              Pockets
            </div>
            <div style={{ fontSize: "17px", fontWeight: 600, letterSpacing: "-0.4px", color: "#0071E3" }}>
              {pocketTotal.toLocaleString("en-US", { maximumFractionDigits: 0 })}
              <span style={{ fontSize: "12px", fontWeight: 400, marginLeft: "2px" }}>₽</span>
            </div>
            <div style={{ fontSize: "11px", color: "#AEAEB2", marginTop: "2px" }}>
              {(pocketTotal / rate).toLocaleString("en-US", { maximumFractionDigits: 0 })} $
            </div>
          </div>
        </div>
      </section>

      <section>
        <p className="mb-[10px] mt-5 px-1 text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--ink3)]">
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
        <p className="mb-[10px] mt-5 px-1 text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--ink3)]">
          Pockets
        </p>
        <div className="overflow-hidden rounded-2xl bg-[var(--white)]">
          {monthData.pockets.length === 0 ? (
            <div className="px-4 py-4 text-[13px] text-[var(--ink3)]">No pockets yet.</div>
          ) : (
            monthData.pockets.map((pocket, index) => {
              const target = pocket.targetAmount ?? 0;
              const progress = target > 0 ? Math.min((pocket.savedAmount / target) * 100, 100) : 0;
              const primaryNumber = formatNumber(pocket.savedAmount);
              const primarySymbol = pocket.currency === "USD" ? "$" : "₽";
              const secondaryNumber = formatNumber(
                pocket.currency === "USD"
                  ? toRub(pocket.savedAmount, "USD", monthData.exchangeRate)
                  : toUsd(pocket.savedAmount, "RUB", monthData.exchangeRate),
              );
              const secondarySymbol = pocket.currency === "USD" ? "₽" : "$";

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
                        {primaryNumber} <span className="font-light">{primarySymbol}</span> · {Math.round(progress)}%
                      </p>
                      <p className="mt-0.5 text-[11px] text-[var(--ink3)]">
                        {secondaryNumber} {secondarySymbol}
                      </p>
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
