"use client";

import Link from "next/link";
import { useMemo } from "react";

import { useBudget } from "@/components/BudgetProvider";
import { fmt, toRub, toUsd } from "@/lib/currency";
import {
  calculatePlannedExpenseTotals,
  calculateTransactionTotals,
} from "@/lib/summary";
import { IncomeOwner } from "@/lib/types";
import { cn } from "@/lib/utils";

type IconKind = "rent" | "groceries" | "transport" | "entertainment" | "phone";

function formatSignedRubDiff(value: number): string {
  if (value > 0) {
    return `+${fmt(value, "RUB")}`;
  }
  if (value < 0) {
    return `−${fmt(Math.abs(value), "RUB")}`;
  }
  return "On track";
}

function BoldDigits({ value, className }: { value: string; className: string }) {
  return (
    <p className={className}>
      {Array.from(value).map((char, index) =>
        /\d/.test(char) ? (
          <b key={`${char}-${index}`} className="font-bold">
            {char}
          </b>
        ) : (
          <span key={`${char}-${index}`}>{char}</span>
        ),
      )}
    </p>
  );
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
        <path
          d="M4 10.2 12 4l8 6.2v8.3a1 1 0 0 1-1 1h-5.1v-5.9h-3.8v5.9H5a1 1 0 0 1-1-1v-8.3Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (kind === "groceries") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="4" y="5" width="16" height="15" rx="2.5" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M8 3.5v3M16 3.5v3M4 9h16M8 12.5h3M13 12.5h3M8 16h3M13 16h3"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  if (kind === "transport") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M6.5 15.5h11l-.8-4.2a2 2 0 0 0-2-1.6H9.3a2 2 0 0 0-2 1.6l-.8 4.2Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
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

function AmountPair({
  primary,
  secondary,
  primaryClassName,
}: {
  primary: string;
  secondary: string;
  primaryClassName: string;
}) {
  return (
    <div>
      <p className={primaryClassName}>{primary}</p>
      <p className="mt-0.5 text-[11px] text-[var(--ink3)]">{secondary}</p>
    </div>
  );
}

export default function PlanFactPage() {
  const { monthData } = useBudget();
  const plannedIncomeTotals = useMemo(
    () =>
      monthData.incomes.reduce(
        (accumulator, income) => {
          const amount = typeof income.amount === "number" && Number.isFinite(income.amount) ? income.amount : 0;
          accumulator.rub += toRub(amount, income.currency, monthData.exchangeRate);
          accumulator.usd += toUsd(amount, income.currency, monthData.exchangeRate);
          return accumulator;
        },
        { rub: 0, usd: 0 },
      ),
    [monthData.exchangeRate, monthData.incomes],
  );
  const actualIncomeTotals = useMemo(
    () =>
      monthData.transactions
        .filter((transaction) => transaction.type === "income")
        .reduce(
          (accumulator, transaction) => ({
            rub: accumulator.rub + toRub(transaction.amount, transaction.currency, monthData.exchangeRate),
            usd: accumulator.usd + toUsd(transaction.amount, transaction.currency, monthData.exchangeRate),
          }),
          { rub: 0, usd: 0 },
        ),
    [monthData.exchangeRate, monthData.transactions],
  );
  const plannedTotals = useMemo(() => calculatePlannedExpenseTotals(monthData), [monthData]);
  const actualTotals = useMemo(() => calculateTransactionTotals(monthData), [monthData]);

  const incomeAchieved = plannedIncomeTotals.rub > 0
    ? (actualIncomeTotals.rub / plannedIncomeTotals.rub) * 100
    : 0;
  const incomeTone =
    incomeAchieved >= 100
      ? "text-[var(--green)]"
      : incomeAchieved >= 50
        ? "text-[var(--amber)]"
        : "text-[var(--red)]";

  const remainingRub = plannedTotals.rub - actualTotals.rub;
  const budgetUsed = plannedTotals.rub > 0 ? (actualTotals.rub / plannedTotals.rub) * 100 : 0;
  const budgetUsedTone =
    budgetUsed < 80 ? "text-[var(--green)]" : budgetUsed <= 100 ? "text-[var(--amber)]" : "text-[var(--red)]";

  const actualByCategory = useMemo(() => {
    const grouped = new Map<string, { rub: number; usd: number }>();
    for (const transaction of monthData.transactions) {
      if (transaction.type !== "expense") {
        continue;
      }
      const existing = grouped.get(transaction.categoryId) ?? { rub: 0, usd: 0 };
      existing.rub += toRub(transaction.amount, transaction.currency, monthData.exchangeRate);
      existing.usd += toUsd(transaction.amount, transaction.currency, monthData.exchangeRate);
      grouped.set(transaction.categoryId, existing);
    }
    return grouped;
  }, [monthData.exchangeRate, monthData.transactions]);

  const categoryCards = useMemo(
    () =>
      monthData.expenses.map((expense, index) => {
        const label = expense.name.trim() || `Category ${index + 1}`;
        const plannedAmount = typeof expense.amount === "number" && Number.isFinite(expense.amount) ? expense.amount : 0;
        const plannedRub = toRub(plannedAmount, expense.currency, monthData.exchangeRate);
        const plannedUsd = toUsd(plannedAmount, expense.currency, monthData.exchangeRate);
        const actual = actualByCategory.get(expense.id) ?? { rub: 0, usd: 0 };
        const actualRub = actual.rub;
        const actualUsd = actual.usd;
        const diffRub = actualRub - plannedRub;
        const progress = plannedRub > 0 ? Math.min((actualRub / plannedRub) * 100, 100) : 0;

        const badgeClassName =
          diffRub > 0
            ? "bg-[var(--red-bg)] text-[var(--red)]"
            : diffRub < 0
              ? "bg-[var(--green-bg)] text-[var(--green)]"
              : "bg-[var(--bg)] text-[var(--ink3)]";
        const progressColor =
          actualRub > plannedRub
            ? "var(--red)"
            : actualRub < plannedRub
              ? "var(--green)"
              : "var(--blue)";
        const actualPrimaryClassName =
          actualRub > plannedRub
            ? "text-[16px] font-bold tracking-[-0.4px] text-[var(--red)]"
            : "text-[16px] font-bold tracking-[-0.4px] text-[var(--ink)]";

        return {
          id: expense.id,
          label,
          kind: detectExpenseKind(label),
          plannedRub,
          plannedUsd,
          actualRub,
          actualUsd,
          diffRub,
          progress,
          badgeClassName,
          progressColor,
          actualPrimaryClassName,
        };
      }),
    [actualByCategory, monthData.exchangeRate, monthData.expenses],
  );

  const incomeCards = useMemo(() => {
    const ownerNameMap: Record<IncomeOwner, string> = {
      me: "Roksana",
      milena: "Milena",
    };
    const ownerSourceAliases: Record<IncomeOwner, string[]> = {
      me: ["roksana", "roxana", "роксана", "рокс"],
      milena: ["milena", "милена", "милен"],
    };
    const normalize = (value: string) => value.trim().toLowerCase();
    const incomeTransactions = monthData.transactions.filter((transaction) => transaction.type === "income");
    return (["me", "milena"] as const).map((owner) => {
      const ownerRows = monthData.incomes.filter((income) => income.owner === owner);
      const ownerName = ownerNameMap[owner];
      const plannedSourceNames = ownerRows
        .map((row) => row.name.trim())
        .filter(Boolean)
        .map(normalize);
      const plannedRub = ownerRows.reduce(
        (sum, row) =>
          sum +
          toRub(
            typeof row.amount === "number" && Number.isFinite(row.amount) ? row.amount : 0,
            row.currency,
            monthData.exchangeRate,
          ),
        0,
      );
      const plannedUsd = ownerRows.reduce(
        (sum, row) =>
          sum +
          toUsd(
            typeof row.amount === "number" && Number.isFinite(row.amount) ? row.amount : 0,
            row.currency,
            monthData.exchangeRate,
          ),
        0,
      );
      const aliases = [...ownerSourceAliases[owner], ...plannedSourceNames];
      const actual = incomeTransactions
        .filter((transaction) => {
          const source = normalize(transaction.categoryId);
          return aliases.some((alias) => source.includes(alias) || alias.includes(source));
        })
        .reduce(
          (accumulator, transaction) => ({
            rub: accumulator.rub + toRub(transaction.amount, transaction.currency, monthData.exchangeRate),
            usd: accumulator.usd + toUsd(transaction.amount, transaction.currency, monthData.exchangeRate),
          }),
          { rub: 0, usd: 0 },
        );

      const diff = actual.rub - plannedRub;
      const progress = plannedRub > 0 ? Math.min((actual.rub / plannedRub) * 100, 100) : 0;
      const badgeClass =
        diff > 0
          ? "bg-[var(--green-bg)] text-[var(--green)]"
          : diff < 0
            ? "bg-[var(--red-bg)] text-[var(--red)]"
            : "bg-[var(--bg)] text-[var(--ink3)]";
      const badgeText =
        diff > 0
          ? `+${fmt(diff, "RUB")} ahead`
          : diff < 0
            ? `−${fmt(Math.abs(diff), "RUB")} behind`
            : "On track";

      return {
        id: owner,
        label: ownerName,
        plannedRub,
        plannedUsd,
        actualRub: actual.rub,
        actualUsd: actual.usd,
        badgeClass,
        badgeText,
        progress,
      };
    });
  }, [monthData.exchangeRate, monthData.incomes, monthData.transactions]);

  const hasExpenseTransactions = monthData.transactions.some((transaction) => transaction.type === "expense");

  return (
    <div className="-mx-4 -mt-6 bg-[var(--bg)] px-4 pt-6 pb-4">
      <section className="mb-3 rounded-[20px] bg-[var(--white)] px-5 py-[18px]">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="mb-1.5 text-[12px] font-medium text-[var(--ink3)]">Earned so far</p>
            <BoldDigits
              value={fmt(actualIncomeTotals.rub, "RUB")}
              className="text-[32px] font-light leading-none tracking-[-1px] text-[var(--ink)]"
            />
            <p className="mt-1 text-[12px] text-[var(--ink3)]">
              {fmt(actualIncomeTotals.usd, "USD")}
            </p>
          </div>
          <div className="text-right">
            <p className="mb-1.5 text-[12px] font-medium text-[var(--ink3)]">Income goal</p>
            <p className={cn("text-[28px] font-bold tracking-[-0.5px]", incomeTone)}>
              {Math.max(0, Math.round(incomeAchieved))}%
            </p>
            <p className="mt-1 text-[12px] text-[var(--ink3)]">
              of {fmt(plannedIncomeTotals.rub, "RUB")} plan
            </p>
          </div>
        </div>
      </section>

      <p className="mb-[10px] mt-5 px-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--ink3)]">
        Income by source
      </p>
      {incomeCards.length === 0 ? (
        <div className="mb-3 rounded-2xl bg-[var(--white)] px-4 py-4 text-[13px] text-[var(--ink3)]">
          No income sources yet.
        </div>
      ) : (
        incomeCards.map((card) => (
          <article key={card.id} className="mb-[10px] rounded-2xl bg-[var(--white)] p-4">
            <div className="mb-[14px] flex items-center gap-3">
              <IconWrap kind="groceries" />
              <p className="min-w-0 flex-1 truncate text-[15px] font-semibold tracking-[-0.3px] text-[var(--ink)]">
                {card.label}
              </p>
              <span className={cn("shrink-0 rounded-[20px] px-[9px] py-1 text-[11px] font-semibold", card.badgeClass)}>
                {card.badgeText}
              </span>
            </div>

            <div className="mb-3 grid grid-cols-2 gap-2">
              <div className="rounded-[10px] bg-[var(--bg)] px-[13px] py-[11px]">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--ink3)]">
                  Planned
                </p>
                <AmountPair
                  primary={fmt(card.plannedRub, "RUB")}
                  secondary={fmt(card.plannedUsd, "USD")}
                  primaryClassName="text-[16px] font-bold tracking-[-0.4px] text-[var(--ink)]"
                />
              </div>
              <div className="rounded-[10px] bg-[var(--bg)] px-[13px] py-[11px]">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--ink3)]">
                  Actual
                </p>
                <AmountPair
                  primary={fmt(card.actualRub, "RUB")}
                  secondary={fmt(card.actualUsd, "USD")}
                  primaryClassName="text-[16px] font-bold tracking-[-0.4px] text-[var(--ink)]"
                />
              </div>
            </div>

            <div className="h-[3px] overflow-hidden rounded-[2px] bg-[var(--bg)]">
              <div
                className="h-full rounded-[2px] bg-[var(--green)]"
                style={{ width: `${card.progress}%` }}
              />
            </div>
          </article>
        ))
      )}

      <section className="mb-3 rounded-[20px] bg-[var(--white)] px-5 py-[18px]">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="mb-1.5 text-[12px] font-medium text-[var(--ink3)]">Spent so far</p>
            <BoldDigits
              value={fmt(actualTotals.rub, "RUB")}
              className="text-[32px] font-light leading-none tracking-[-1px] text-[var(--ink)]"
            />
            <p className="mt-1 text-[12px] text-[var(--ink3)]">
              {fmt(actualTotals.usd, "USD")}
            </p>
            <p className="mt-2 text-[12px] text-[var(--ink3)]">
              {fmt(Math.abs(remainingRub), "RUB")} remaining of plan
            </p>
          </div>

          <div className="text-right">
            <p className="mb-1.5 text-[12px] font-medium text-[var(--ink3)]">Budget used</p>
            <p className={cn("text-[28px] font-bold tracking-[-0.5px]", budgetUsedTone)}>
              {Math.max(0, Math.round(budgetUsed))}%
            </p>
            <p className="mt-1 text-[12px] text-[var(--ink3)]">
              of {fmt(plannedTotals.rub, "RUB")} plan
            </p>
          </div>
        </div>
      </section>

      {hasExpenseTransactions ? (
        <>
          <p className="mb-[10px] mt-5 px-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--ink3)]">
            By category
          </p>

          {categoryCards.map((card) => (
            <article key={card.id} className="mb-[10px] rounded-2xl bg-[var(--white)] p-4">
              <div className="mb-[14px] flex items-center gap-3">
                <IconWrap kind={card.kind} />
                <p className="min-w-0 flex-1 truncate text-[15px] font-semibold tracking-[-0.3px] text-[var(--ink)]">
                  {card.label}
                </p>
                <span className={cn("shrink-0 rounded-[20px] px-[9px] py-1 text-[11px] font-semibold", card.badgeClassName)}>
                  {formatSignedRubDiff(card.diffRub)}
                </span>
              </div>

              <div className="mb-3 grid grid-cols-2 gap-2">
                <div className="rounded-[10px] bg-[var(--bg)] px-[13px] py-[11px]">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--ink3)]">
                    Planned
                  </p>
                  <AmountPair
                    primary={fmt(card.plannedRub, "RUB")}
                    secondary={fmt(card.plannedUsd, "USD")}
                    primaryClassName="text-[16px] font-bold tracking-[-0.4px] text-[var(--ink)]"
                  />
                </div>
                <div className="rounded-[10px] bg-[var(--bg)] px-[13px] py-[11px]">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--ink3)]">
                    Actual
                  </p>
                  <AmountPair
                    primary={fmt(card.actualRub, "RUB")}
                    secondary={fmt(card.actualUsd, "USD")}
                    primaryClassName={card.actualPrimaryClassName}
                  />
                </div>
              </div>

              <div className="h-[3px] overflow-hidden rounded-[2px] bg-[var(--bg)]">
                <div
                  className="h-full rounded-[2px]"
                  style={{ width: `${card.progress}%`, backgroundColor: card.progressColor }}
                />
              </div>
            </article>
          ))}
        </>
      ) : (
        <div className="mt-10 text-center">
          <div className="mx-auto inline-flex h-8 w-8 items-center justify-center text-[var(--ink3)]">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.5" />
              <path d="M8.5 12h7M8.5 15h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <p className="mt-3 text-[14px] text-[var(--ink2)]">No spending logged yet</p>
          <Link href="/transactions" className="mt-2 inline-block text-[13px] text-[var(--blue)]">
            Add your first expense →
          </Link>
        </div>
      )}
    </div>
  );
}
