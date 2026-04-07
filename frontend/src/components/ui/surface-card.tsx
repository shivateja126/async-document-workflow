"use client";

import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type SurfaceCardProps = HTMLAttributes<HTMLDivElement> & {
  glow?: boolean;
};

export function SurfaceCard({ className, glow = false, ...props }: SurfaceCardProps) {
  return (
    <div
      className={cn(
        "relative rounded-2xl border border-white/10 bg-white/[0.045] shadow-panel backdrop-blur-xl",
        glow && "shadow-[0_20px_80px_rgba(79,70,229,0.16)]",
        className
      )}
      {...props}
    />
  );
}
