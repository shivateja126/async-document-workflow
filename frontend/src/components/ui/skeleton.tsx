"use client";

import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl border border-white/5 bg-gradient-to-r from-white/[0.04] via-white/[0.08] to-white/[0.04]",
        className
      )}
      {...props}
    />
  );
}
