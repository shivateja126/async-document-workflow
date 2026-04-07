"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { MobileNav, Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { AmbientScene } from "@/components/three/ambient-scene";
import { Role } from "@/lib/types";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";

export function ProtectedShell({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        Loading workspace...
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-hidden bg-mesh px-4 py-4 md:px-6">
      <AmbientScene />
      <div className="relative mx-auto flex max-w-[1600px] gap-6">
        <Sidebar role={user.role as Role} />
        <main className="min-h-[calc(100vh-2rem)] flex-1 rounded-[32px] border border-white/20 bg-white/10 p-6 shadow-glass backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/30">
          <Topbar />
          <MobileNav role={user.role as Role} />
          {children}
        </main>
      </div>
    </div>
  );
}
