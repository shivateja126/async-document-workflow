import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function GlassCard({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[28px] border border-white/20 bg-white/12 p-6 shadow-glass backdrop-blur-2xl dark:border-white/10 dark:bg-white/5",
        className
      )}
    >
      {children}
    </div>
  );
}
