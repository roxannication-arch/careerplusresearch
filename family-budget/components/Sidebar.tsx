"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/budget", label: "Plan" },
  { href: "/transactions", label: "Actual" },
  { href: "/planfact", label: "Compare" },
  { href: "/pockets", label: "Pockets" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="fixed right-1/2 bottom-3 z-[100] w-[calc(100%-20px)] max-w-[456px] translate-x-1/2 rounded-3xl border border-[var(--line2)] bg-[rgba(18,21,28,0.78)] p-2 shadow-[0_24px_56px_rgba(0,0,0,0.4)] [backdrop-filter:saturate(180%)_blur(24px)]">
      <div className="grid grid-cols-5 gap-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={isActive
                ? "inline-flex flex-col items-center justify-center gap-1 rounded-2xl bg-white/12 px-1 py-1 text-[10px] font-semibold text-white"
                : "inline-flex flex-col items-center justify-center gap-1 rounded-2xl px-1 py-1 text-[10px] font-medium text-white/70 hover:bg-white/6"}
            >
              <span className="inline-flex h-[22px] w-[22px] items-center justify-center">
                {item.href === "/dashboard" && (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M3.5 12.2L12 5l8.5 7.2v7.3a1 1 0 0 1-1 1h-5.2v-5.7h-4.6v5.7H4.5a1 1 0 0 1-1-1v-7.3Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
                {item.href === "/budget" && (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M4 7.5a2 2 0 0 1 2-2h12.5a1.5 1.5 0 0 1 0 3H6a2 2 0 0 0-2 2v5a3 3 0 0 0 3 3h11.5a1.5 1.5 0 0 0 0-3H7a1 1 0 0 1-1-1v-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M15.5 13.5h2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                  </svg>
                )}
                {item.href === "/transactions" && (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M6 3.5h9l4 4v12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-15a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M14.5 3.5v4h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M8.5 12h7M8.5 15.5h7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                  </svg>
                )}
                {item.href === "/planfact" && (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M4.5 18.5h15" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                    <path d="M7.5 16.5v-5M12 16.5V8M16.5 16.5V5.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                  </svg>
                )}
                {item.href === "/pockets" && (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M4 9.5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M7 7.5V6a2 2 0 0 1 2-2h6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                    <path d="M15.8 13h2.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                  </svg>
                )}
              </span>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
