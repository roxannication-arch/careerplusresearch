"use client";

import Link from "next/link";
import { useMemo } from "react";

import { useBudget } from "@/components/BudgetProvider";
import { fmt, toRub, toUsd } from "@/lib/currency";
import { getActualIncome, getPlannedIncome } from "@/lib/storage";
import { calculatePlannedExpenseTotals, calculateTransactionTotals } from "@/lib/summary";
import { cn } from "@/lib/utils";

type IconKind = "rent" | "groceries" | "transport" | "entertainment" | "phone";

function formatRounded(value: number): string {
  const normalized = Number.isFinite(value) ? value : 0;
  return Math.round(normalized).toLocaleString("en-US");
}

function rub(value: number): string {
  return `₽${formatRounded(value)}`;
}

function usd(value: number): string {
  return `$${formatRounded(value)}`;
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
  const { state, selectedMonth, monthData } = useBudget();
  const rate = Number.isFinite(monthData.exchangeRate) && monthData.exchangeRate > 0 ? monthData.exchangeRate : 1;
  const selectedMonthData = state.months[selectedMonth] ?? monthData;

  const actualIncomeTotal = useMemo(
    () => getActualIncome(state, selectedMonth, rate),
    [rate, selectedMonth, state],
  );
  const plannedIncomeTotal = useMemo(
    () => getPlannedIncome(state, selectedMonth, rate),
    [rate, selectedMonth, state],
  );

  const ownerIncome = useMemo(() => {
    const plannedMe = selectedMonthData.incomes
      .filter((income) => income.owner === "me")
      .reduce((sum, income) => sum + (income.amount ?? 0) * (income.currency === "USD" ? rate : 1), 0);

    const actualMe = selectedMonthData.transactions
      .filter((transaction) => transaction.type === "income" && transaction.owner === "me")
      .reduce((sum, transaction) => sum + transaction.amount * (transaction.currency === "USD" ? rate : 1), 0);

    const plannedMilena = selectedMonthData.incomes
      .filter((income) => income.owner === "milena")
      .reduce((sum, income) => sum + (income.amount ?? 0) * (income.currency === "USD" ? rate : 1), 0);

    const actualMilena = selectedMonthData.transactions
      .filter((transaction) => transaction.type === "income" && transaction.owner === "milena")
      .reduce((sum, transaction) => sum + transaction.amount * (transaction.currency === "USD" ? rate : 1), 0);

    return { plannedMe, actualMe, plannedMilena, actualMilena };
  }, [rate, selectedMonthData.incomes, selectedMonthData.transactions]);

  const plannedTotals = useMemo(() => calculatePlannedExpenseTotals(monthData), [monthData]);
  const actualTotals = useMemo(() => calculateTransactionTotals(monthData), [monthData]);

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
        const badgeText =
          diffRub > 0
            ? `+${fmt(diffRub, "RUB")}`
            : diffRub < 0
              ? `−${fmt(Math.abs(diffRub), "RUB")}`
              : "On track";
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
          badgeText,
          progressColor,
          actualPrimaryClassName,
        };
      }),
    [actualByCategory, monthData.exchangeRate, monthData.expenses],
  );

  const incomeOwnerCards = [
    { key: "me" as const, label: "Roksana", planned: ownerIncome.plannedMe, actual: ownerIncome.actualMe },
    {
      key: "milena" as const,
      label: "Milena",
      planned: ownerIncome.plannedMilena,
      actual: ownerIncome.actualMilena,
    },
  ];
  const hasExpenseTransactions = monthData.transactions.some((transaction) => transaction.type === "expense");

  return (
    <div className="-mx-4 -mt-6 bg-[var(--bg)] px-4 pt-6 pb-4">
      <section className="mb-3 rounded-[16px] bg-[var(--white)] p-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[11px] text-[#AEAEB2]">Earned</p>
            <p className="mt-1 text-[17px] font-semibold text-[var(--ink)]">{rub(actualIncomeTotal)}</p>
            <p className="mt-0.5 text-[11px] text-[#AEAEB2]">{usd(actualIncomeTotal / rate)}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-[#AEAEB2]">Planned</p>
            <p className="mt-1 text-[17px] font-semibold text-[var(--ink)]">{rub(plannedIncomeTotal)}</p>
            <p className="mt-0.5 text-[11px] text-[#AEAEB2]">{usd(plannedIncomeTotal / rate)}</p>
          </div>
        </div>
        {actualIncomeTotal < plannedIncomeTotal ? (
          <p className="mt-3 text-[12px] text-[#AEAEB2]">
            {rub(plannedIncomeTotal - actualIncomeTotal)} still to earn
          </p>
        ) : (
          <p className="mt-3 text-[12px] text-[#1A9A44]">Goal reached ✓</p>
        )}
      </section>

      {incomeOwnerCards.map((ownerCard) => {
        const remaining = Math.max(ownerCard.planned - ownerCard.actual, 0);
        const progress = ownerCard.planned > 0 ? Math.min((ownerCard.actual / ownerCard.planned) * 100, 100) : 0;
        const progressColor = progress >= 80 ? "#1A9A44" : progress >= 50 ? "#B8730A" : "#C7372F";
        const earnedClass = ownerCard.actual >= ownerCard.planned ? "text-[#1A9A44]" : "text-[#C7372F]";
        const badgeClass =
          ownerCard.actual > ownerCard.planned
            ? "bg-[#F0FAF4] text-[#1A9A44]"
            : ownerCard.actual < ownerCard.planned
              ? "bg-[#FFF0EF] text-[#C7372F]"
              : "bg-[#F5F5F7] text-[#8E8E93]";
        const badgeText =
          ownerCard.actual > ownerCard.planned
            ? `+₽${formatRounded(ownerCard.actual - ownerCard.planned)}`
            : ownerCard.actual < ownerCard.planned
              ? `−₽${formatRounded(ownerCard.planned - ownerCard.actual)}`
              : "On track";

        return (
          <article key={ownerCard.key} className="mb-[10px] rounded-[16px] bg-[var(--white)] p-4">
            <div className="flex items-center justify-between">
              <p className="text-[15px] font-semibold tracking-[-0.3px] text-[var(--ink)]">{ownerCard.label}</p>
              <span className={cn("rounded-[20px] px-[9px] py-1 text-[11px] font-semibold", badgeClass)}>
                {badgeText}
              </span>
            </div>

            <div className="mb-3 mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-[10px] bg-[#F5F5F7] px-[13px] py-[11px]">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-[#AEAEB2]">PLANNED</p>
                <p className="text-[16px] font-bold tracking-[-0.4px] text-[#1D1D1F]">{rub(ownerCard.planned)}</p>
                <p className="mt-0.5 text-[11px] text-[#AEAEB2]">{usd(ownerCard.planned / rate)}</p>
              </div>
              <div className="rounded-[10px] bg-[#F5F5F7] px-[13px] py-[11px]">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-[#AEAEB2]">EARNED</p>
                <p className={cn("text-[16px] font-bold tracking-[-0.4px]", earnedClass)}>{rub(ownerCard.actual)}</p>
                <p className="mt-0.5 text-[11px] text-[#AEAEB2]">{usd(ownerCard.actual / rate)}</p>
              </div>
            </div>

            {ownerCard.actual >= ownerCard.planned ? (
              <p className="text-[11px] text-[#1A9A44]">Done ✓</p>
            ) : (
              <p className="text-[11px] text-[#AEAEB2]">
                Still to earn: {rub(remaining)} ({usd(remaining / rate)})
              </p>
            )}

            <div className="mt-3 h-[3px] overflow-hidden rounded-[2px] bg-[#F5F5F7]">
              <div className="h-full rounded-[2px]" style={{ width: `${progress}%`, backgroundColor: progressColor }} />
            </div>
          </article>
        );
      })}

      <section className="mb-3 rounded-[20px] bg-[var(--white)] px-5 py-[18px]">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="mb-1.5 text-[12px] font-medium text-[var(--ink3)]">Spent so far</p>
            <BoldDigits
              value={fmt(actualTotals.rub, "RUB")}
              className="text-[32px] font-light leading-none tracking-[-1px] text-[var(--ink)]"
            />
            <p className="mt-1 text-[12px] text-[var(--ink3)]">{fmt(actualTotals.usd, "USD")}</p>
            <p className="mt-2 text-[12px] text-[var(--ink3)]">
              {fmt(Math.abs(remainingRub), "RUB")} remaining of plan
            </p>
          </div>

          <div className="text-right">
            <p className="mb-1.5 text-[12px] font-medium text-[var(--ink3)]">Budget used</p>
            <p className={cn("text-[28px] font-bold tracking-[-0.5px]", budgetUsedTone)}>
              {Math.max(0, Math.round(budgetUsed))}%
            </p>
            <p className="mt-1 text-[12px] text-[var(--ink3)]">of {fmt(plannedTotals.rub, "RUB")} plan</p>
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
                <span
                  className={cn(
                    "shrink-0 rounded-[20px] px-[9px] py-1 text-[11px] font-semibold",
                    card.badgeClassName,
                  )}
                >
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
