import { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "w-full rounded-[18px] border border-white/10 bg-white/[0.06] px-4 py-3.5 text-sm text-foreground/88 outline-none transition duration-200 ease-out placeholder:text-foreground/34 hover:border-white/14 focus:border-accent/70 focus:bg-white/[0.08] focus:shadow-[0_0_0_3px_rgba(93,135,255,0.14)] dark:bg-white/[0.04]",
        props.className
      )}
    />
  );
}
