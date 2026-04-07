"use client";

import { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

export function buttonClassName({
  variant = "primary",
  className
}: {
  variant?: ButtonVariant;
  className?: string;
}) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 disabled:pointer-events-none disabled:opacity-60",
    variant === "primary" &&
      "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-button hover:scale-[1.01] hover:shadow-[0_18px_44px_rgba(99,102,241,0.34)] active:scale-[0.99]",
    variant === "secondary" &&
      "border border-white/10 bg-white/[0.05] text-appText backdrop-blur-xl hover:border-white/20 hover:bg-white/[0.08]",
    variant === "ghost" && "text-appTextMuted hover:bg-white/[0.05] hover:text-appText",
    variant === "danger" &&
      "border border-red-400/30 bg-red-500/15 text-red-100 hover:border-red-300/50 hover:bg-red-500/25 hover:shadow-[0_18px_44px_rgba(239,68,68,0.2)]",
    className
  );
}

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={buttonClassName({ variant, className })}
      {...props}
    />
  );
}
