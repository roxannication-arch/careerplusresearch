"use client";

import { ReactNode } from "react";

import { MonthSelector } from "@/components/MonthSelector";
import { Sidebar } from "@/components/Sidebar";
import { useBudget } from "@/components/BudgetProvider";

export function AppFrame({ children }: { children: ReactNode }) {
  const { selectedMonth, monthOptions, setSelectedMonth } = useBudget();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 md:flex">
      <Sidebar />
      <main className="flex-1">
        <header className="border-b border-slate-200 bg-white px-4 py-4 md:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.12em] text-slate-500">
                Планирование и учет
              </p>
              <h2 className="text-lg font-semibold">Семейный бюджет</h2>
            </div>
            <MonthSelector
              selectedMonth={selectedMonth}
              monthOptions={monthOptions}
              onChange={setSelectedMonth}
            />
          </div>
        </header>
        <section className="px-4 py-5 md:px-8 md:py-6">{children}</section>
      </main>
    </div>
  );
}
