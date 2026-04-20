"use client";

import { ReactNode } from "react";

import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";

export function AppFrame({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <div className="mx-auto max-w-[480px]">
        <TopBar />
        <main className="animate-in fade-in-0 px-4 pt-6 pb-20 duration-150">{children}</main>
      </div>
      <Sidebar />
    </div>
  );
}
