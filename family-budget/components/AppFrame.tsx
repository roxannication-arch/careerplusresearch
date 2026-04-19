"use client";

import { ReactNode } from "react";

import { MonthSelector } from "@/components/MonthSelector";
import { Sidebar } from "@/components/Sidebar";
import { useBudget } from "@/components/BudgetProvider";

export function AppFrame({ children }: { children: ReactNode }) {
  const { selectedMonth, monthOptions, setSelectedMonth } = useBudget();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#f8fbff_0%,_#f1f5f9_42%,_#eef2ff_100%)] text-slate-900 md:flex">
      <Sidebar />
      <main className="flex-1">
        <header className="sticky top-0 z-20 border-b border-white/80 bg-white/85 px-4 py-4 backdrop-blur md:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
                Планирование и учет
              </p>
              <h2 className="text-xl font-semibold tracking-tight">Семейный бюджет</h2>
            </div>
            <MonthSelector
              selectedMonth={selectedMonth}
              monthOptions={monthOptions}
              onChange={setSelectedMonth}
            />
          </div>
        </header>
        <section className="px-4 py-5 md:px-8 md:py-7">{children}</section>
      </main>
    </div>
  );
}
