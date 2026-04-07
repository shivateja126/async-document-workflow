"use client";

import { motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, Landmark } from "lucide-react";
import { GlassCard } from "../ui/glass-card";
import { formatCurrency } from "@/lib/utils";

const iconMap = {
  income: ArrowUpRight,
  expense: ArrowDownRight,
  balance: Landmark
} as const;

type StatCardProps = {
  title: string;
  value: number;
  tone: "income" | "expense" | "balance";
  subtitle: string;
};

export function StatCard({ title, value, tone, subtitle }: StatCardProps) {
  const Icon = iconMap[tone];

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
    >
      <GlassCard className="overflow-hidden">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.22em] text-foreground/40">{title}</p>
            <h3 className="mt-4 font-display text-4xl font-semibold text-foreground">
              {formatCurrency(value)}
            </h3>
            <p className="mt-3 text-sm text-foreground/55">{subtitle}</p>
          </div>

          <div className="rounded-2xl border border-white/20 bg-white/15 p-3 dark:bg-white/8">
            <Icon
              size={22}
              className={
                tone === "income"
                  ? "text-emerald-400"
                  : tone === "expense"
                    ? "text-rose-400"
                    : "text-sky-400"
              }
            />
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}
