"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { useBudget } from "@/components/BudgetProvider";
import { getMonthLabel } from "@/lib/storage";
import { cn } from "@/lib/utils";

const navTabs = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/budget", label: "Plan" },
  { href: "/transactions", label: "Actual" },
  { href: "/planfact", label: "Compare" },
  { href: "/pockets", label: "Pockets" },
];

export function TopBar() {
  const { selectedMonth, monthOptions, setSelectedMonth, monthData, updateExchangeRate } = useBudget();
  const pathname = usePathname();
  const [isRateEditing, setIsRateEditing] = useState(false);
  const [rateDraft, setRateDraft] = useState(String(Math.round(monthData.exchangeRate)));

  const commitRate = () => {
    const parsed = Number.parseFloat(rateDraft);
    if (Number.isFinite(parsed) && parsed > 0) {
      updateExchangeRate(parsed);
    }
    setIsRateEditing(false);
  };

  return (
    <header className="sticky top-0 z-[100] border-b border-[0.5px] border-[var(--line2)] bg-[var(--glass)] [backdrop-filter:saturate(180%)_blur(20px)]">
      <div className="mx-auto w-full max-w-[480px] px-[20px] pt-[16px]">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-[22px] font-bold tracking-[-0.6px] text-[var(--ink)]">Budget</h1>
          <div className="flex items-center gap-2">
            <select
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(event.target.value)}
              className="max-w-[132px] appearance-none bg-transparent text-right text-[13px] font-medium text-[var(--ink2)] outline-none"
            >
              {monthOptions.map((month) => (
                <option key={month} value={month}>
                  {getMonthLabel(month)}
                </option>
              ))}
            </select>
            {isRateEditing ? (
              <input
                autoFocus
                value={rateDraft}
                onChange={(event) => setRateDraft(event.target.value)}
                onBlur={commitRate}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    commitRate();
                  }
                }}
                className="w-[102px] rounded-[20px] border-[1.5px] border-[var(--blue)] bg-[var(--surface)] px-[11px] py-[6px] text-[12px] font-semibold text-[var(--blue)] outline-none shadow-[var(--soft-shadow)]"
              />
            ) : (
              <button
                type="button"
                onClick={() => {
                  setRateDraft(String(Math.round(monthData.exchangeRate)));
                  setIsRateEditing(true);
                }}
                className="rounded-[20px] bg-[var(--surface-2)] px-[11px] py-[6px] text-[12px] font-semibold text-[var(--blue)] shadow-[var(--soft-shadow)]"
              >
                $1 = ₽{Math.round(monthData.exchangeRate)}
              </button>
            )}
          </div>
        </div>

        <nav className="mt-[14px] flex gap-2 overflow-x-auto pb-[10px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {navTabs.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "rounded-[10px] px-3 py-[7px] text-[12px] font-semibold whitespace-nowrap transition-all",
                pathname === tab.href
                  ? "bg-[var(--surface)] text-[var(--ink)] shadow-[var(--soft-shadow)]"
                  : "text-[var(--ink2)]",
              )}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
