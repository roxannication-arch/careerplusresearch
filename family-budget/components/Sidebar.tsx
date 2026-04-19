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
    <aside className="w-full border-b border-white/70 bg-white/80 px-4 py-4 backdrop-blur md:w-72 md:border-r md:border-b-0 md:px-6 md:py-7">
      <div className="mb-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          Family Budget
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Семейный бюджет</h1>
      </div>

      <nav className="flex gap-2 overflow-x-auto pb-1 md:flex-col md:gap-1.5 md:overflow-visible">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                "border border-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                isActive && "border-indigo-100 bg-indigo-50 text-indigo-700 shadow-sm",
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
