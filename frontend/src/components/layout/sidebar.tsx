"use client";

import { cn } from "@/lib/utils";
import { Role } from "@/lib/types";
import {
  BarChart3,
  LayoutDashboard,
  ShieldCheck,
  WalletCards
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles: Role[];
};

export const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["VIEWER", "ANALYST", "ADMIN"] },
  { href: "/transactions", label: "Transactions", icon: WalletCards, roles: ["ANALYST", "ADMIN"] },
  { href: "/analytics", label: "Analytics", icon: BarChart3, roles: ["ANALYST", "ADMIN"] },
  { href: "/admin", label: "Admin Panel", icon: ShieldCheck, roles: ["ADMIN"] }
];

export function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-[280px] shrink-0 rounded-[32px] border border-white/20 bg-white/12 p-5 shadow-glass backdrop-blur-2xl lg:block dark:border-white/10 dark:bg-white/5">
      <div className="mb-10">
        <div className="text-xs uppercase tracking-[0.35em] text-foreground/45">Finance OS</div>
        <h1 className="mt-3 font-display text-3xl font-bold text-foreground">
          Flow<span className="text-accent">Control</span>
        </h1>
        <p className="mt-3 text-sm text-foreground/55">
          Secure finance operations with role-aware analytics.
        </p>
      </div>

      <nav className="space-y-2">
        {navItems
          .filter((item) => item.roles.includes(role))
          .map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
                  active
                    ? "bg-white/20 text-foreground shadow-glow dark:bg-white/10"
                    : "text-foreground/60 hover:bg-white/10 hover:text-foreground"
                )}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
      </nav>
    </aside>
  );
}

export function MobileNav({ role }: { role: Role }) {
  const pathname = usePathname();

  return (
    <div className="mb-6 flex gap-3 overflow-x-auto rounded-[24px] border border-white/20 bg-white/10 p-3 backdrop-blur-2xl lg:hidden dark:border-white/10 dark:bg-white/5">
      {navItems
        .filter((item) => item.roles.includes(role))
        .map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "inline-flex shrink-0 items-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium transition",
                active
                  ? "bg-white/20 text-foreground shadow-glow dark:bg-white/10"
                  : "text-foreground/60 hover:bg-white/10 hover:text-foreground"
              )}
            >
              <Icon size={16} />
              {item.label}
            </Link>
          );
        })}
    </div>
  );
}
