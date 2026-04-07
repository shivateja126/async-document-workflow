"use client";

import { useAuth } from "../providers/auth-provider";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "../ui/button";

export function Topbar() {
  const { user, logout } = useAuth();

  return (
    <header className="mb-8 flex items-center justify-between gap-4">
      <div>
        <p className="text-sm uppercase tracking-[0.28em] text-foreground/40">Control center</p>
        <h2 className="mt-2 font-display text-3xl font-semibold text-foreground">
          Welcome back, {user?.name?.split(" ")[0] ?? "Team"}
        </h2>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden rounded-full border border-white/20 bg-white/12 px-4 py-2 text-sm text-foreground/70 backdrop-blur-xl md:block dark:border-white/10 dark:bg-white/5">
          {user?.role}
        </div>
        <ThemeToggle />
        <Button variant="secondary" onClick={logout}>
          Sign out
        </Button>
      </div>
    </header>
  );
}
