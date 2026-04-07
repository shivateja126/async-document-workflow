"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  ArrowUpRight,
  ChevronRight,
  Clock3,
  FileUp,
  LayoutDashboard,
  Rows3,
  Sparkles
} from "lucide-react";
import { ReactNode } from "react";
import { clsx } from "clsx";
import { buttonClassName } from "@/components/ui/button";
import { SurfaceCard } from "@/components/ui/surface-card";

const navItems = [
  {
    href: "/upload",
    label: "Upload",
    icon: FileUp
  },
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard
  },
  {
    href: "/jobs",
    label: "Jobs",
    icon: Rows3
  }
];

export function WorkflowShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const page = resolvePage(pathname);

  return (
    <div className="min-h-screen bg-transparent">
      <div className="pointer-events-none fixed inset-0 bg-appGlow opacity-90" />

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-white/10 bg-[#0B0F19]/80 px-5 py-6 backdrop-blur-2xl lg:flex lg:flex-col">
        <div className="flex items-center gap-3 px-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-base font-bold text-white shadow-button">
            P
          </div>
          <div>
            <p className="text-sm font-semibold text-appText">Pulseflow</p>
            <p className="text-xs text-appTextMuted">Document operations</p>
          </div>
        </div>

        <nav className="mt-10 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = isPathActive(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-appTextMuted transition duration-300",
                  isActive
                    ? "border border-white/10 bg-white/[0.08] text-appText shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                    : "hover:bg-white/[0.05] hover:text-appText"
                )}
              >
                <span
                  className={clsx(
                    "flex h-10 w-10 items-center justify-center rounded-xl border transition duration-300",
                    isActive
                      ? "border-indigo-400/30 bg-indigo-500/15 text-indigo-200"
                      : "border-white/10 bg-white/[0.03] text-appTextMuted group-hover:border-white/20 group-hover:text-appText"
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="flex-1">{item.label}</span>
                {isActive ? <ChevronRight className="h-4 w-4 text-indigo-200" /> : null}
              </Link>
            );
          })}
        </nav>

        <SurfaceCard glow className="mt-8 overflow-hidden p-5">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-500/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-indigo-200">
              <Sparkles className="h-3.5 w-3.5" />
              Realtime pipeline
            </div>
            <h2 className="mt-4 font-display text-2xl font-semibold text-white">
              Review the queue, not the chaos.
            </h2>
            <p className="mt-3 text-sm leading-6 text-appTextMuted">
              Upload documents, watch workers progress live, and keep reviews moving with a clean
              operations surface.
            </p>
            <Link href="/upload" className={buttonClassName({ className: "mt-5 w-full" })}>
              New upload
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </SurfaceCard>

        <SurfaceCard className="mt-auto p-4">
          <div className="flex items-center gap-3">
            <span className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/12 text-emerald-200">
              <Activity className="h-4 w-4" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            <div>
              <p className="text-sm font-medium text-appText">Workers online</p>
              <p className="text-xs text-appTextMuted">Streaming progress and queue health</p>
            </div>
          </div>
        </SurfaceCard>
      </aside>

      <div className="relative z-10 lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0B0F19]/70 backdrop-blur-2xl">
          <div className="px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.26em] text-appTextMuted">
                  <span>Workspace</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                  <span>{page.eyebrow}</span>
                </div>
                <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-white">
                  {page.title}
                </h1>
                <p className="mt-1 text-sm text-appTextMuted">{page.description}</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-3 py-2 text-sm text-appTextMuted md:flex">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/60" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  </span>
                  System healthy
                </div>

                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] px-3 py-2">
                  <div className="hidden text-right sm:block">
                    <p className="text-sm font-medium text-appText">Salvatore</p>
                    <p className="text-xs text-appTextMuted">Product preview</p>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-sm font-semibold text-white shadow-button">
                    SA
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 flex gap-2 overflow-x-auto pb-1 lg:hidden">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = isPathActive(pathname, item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={clsx(
                      "inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm transition duration-300",
                      isActive
                        ? "border-indigo-400/20 bg-indigo-500/10 text-indigo-100"
                        : "border-white/10 bg-white/[0.04] text-appTextMuted"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

function isPathActive(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname.startsWith("/dashboard");
  }

  if (href === "/jobs") {
    return pathname === "/jobs" || pathname.startsWith("/jobs/");
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function resolvePage(pathname: string) {
  if (pathname === "/upload") {
    return {
      eyebrow: "Intake",
      title: "Upload center",
      description: "Dispatch new documents into the async pipeline with live job visibility."
    };
  }

  if (pathname === "/dashboard") {
    return {
      eyebrow: "Overview",
      title: "Workflow dashboard",
      description: "Track queue depth, review readiness, and recent processing outcomes."
    };
  }

  if (pathname === "/jobs") {
    return {
      eyebrow: "Queue",
      title: "Jobs monitor",
      description: "Follow the latest processing attempts and jump straight into active work."
    };
  }

  if (pathname.startsWith("/jobs/")) {
    return {
      eyebrow: "Queue",
      title: "Live job stream",
      description: "Watch the worker pipeline progress in real time."
    };
  }

  if (pathname.startsWith("/documents/")) {
    return {
      eyebrow: "Review",
      title: "Document detail",
      description: "Refine extracted data, finalize records, and export clean outputs."
    };
  }

  return {
    eyebrow: "Workspace",
    title: "Operations",
    description: "Monitor the document workflow from a single control surface."
  };
}
