import { FinancialRecord } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { GlassCard } from "../ui/glass-card";

export function RecentTransactions({ items }: { items: FinancialRecord[] }) {
  return (
    <GlassCard>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="font-display text-2xl font-semibold text-foreground">Recent activity</h3>
          <p className="mt-1 text-sm text-foreground/55">Latest recorded transactions across the platform.</p>
        </div>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex flex-col gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-4 md:flex-row md:items-center md:justify-between dark:bg-white/5"
          >
            <div>
              <div className="font-medium text-foreground">{item.category}</div>
              <div className="text-sm text-foreground/55">
                {item.description || "No description"} · {formatDate(item.date)}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="rounded-full border border-white/15 px-3 py-1 text-xs tracking-[0.18em] text-foreground/55">
                {item.type}
              </span>
              <span
                className={
                  item.type === "INCOME"
                    ? "font-semibold text-emerald-400"
                    : "font-semibold text-rose-400"
                }
              >
                {formatCurrency(Number(item.amount))}
              </span>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
