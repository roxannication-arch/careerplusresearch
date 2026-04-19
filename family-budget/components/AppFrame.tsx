"use client";

import { ReactNode } from "react";

import { MonthSelector } from "@/components/MonthSelector";
import { Sidebar } from "@/components/Sidebar";
import { useBudget } from "@/components/BudgetProvider";

export function AppFrame({ children }: { children: ReactNode }) {
  const { selectedMonth, monthOptions, setSelectedMonth } = useBudget();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-indigo-50 text-slate-900">
      <Sidebar />
      <main className="flex-1 md:pl-72">
        <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 px-4 py-4 backdrop-blur md:px-10">
          <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-indigo-500">
                Планирование и учет
              </p>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">Семейный бюджет</h2>
              <p className="text-xs text-slate-500">UI v3</p>
            </div>
            <MonthSelector
              selectedMonth={selectedMonth}
              monthOptions={monthOptions}
              onChange={setSelectedMonth}
            />
          </div>
        </header>
        <section className="mx-auto w-full max-w-7xl px-4 py-5 md:px-10 md:py-8">{children}</section>
      </main>
    </div>
  );
}
