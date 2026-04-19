"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, PiggyBank, ReceiptText, Wallet } from "lucide-react";

import { cn } from "@/lib/utils";

const navItems = [
  {
    href: "/dashboard",
    label: "Обзор",
    icon: LayoutDashboard,
  },
  {
    href: "/budget",
    label: "Бюджет",
    icon: Wallet,
  },
  {
    href: "/transactions",
    label: "Траты",
    icon: ReceiptText,
  },
  {
    href: "/pockets",
    label: "Покеты",
    icon: PiggyBank,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full border-b border-slate-700 bg-slate-950 px-4 py-4 md:fixed md:inset-y-0 md:left-0 md:w-72 md:border-r md:border-b-0 md:px-6 md:py-8">
      <div className="mb-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-300">
          Family Budget
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-50">Семейный бюджет</h1>
      </div>

      <nav className="grid grid-cols-4 gap-2 overflow-x-auto pb-1 md:flex md:flex-col md:gap-2 md:overflow-visible">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition md:justify-start",
                "border border-transparent text-slate-300 hover:bg-slate-800 hover:text-white",
                isActive &&
                  "border-sky-300/30 bg-sky-400/15 text-sky-100 shadow-[0_6px_18px_rgba(56,189,248,0.22)]",
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
