import { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        "w-full rounded-2xl border border-line/60 bg-white/10 px-4 py-3 text-sm text-foreground outline-none transition focus:border-accent dark:bg-white/5",
        props.className
      )}
    />
  );
}
