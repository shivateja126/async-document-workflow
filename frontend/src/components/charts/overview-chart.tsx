"use client";

import { DashboardSummary } from "@/lib/types";
import { formatCompactCurrency, formatCurrency } from "@/lib/utils";
import { GlassCard } from "../ui/glass-card";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

type TrendPoint =
  | DashboardSummary["monthlyTrends"][number]
  | DashboardSummary["weeklyTrends"][number];

function buildTrendRows(
  series: TrendPoint[],
  keyField: "month" | "week"
) {
  const grouped = new Map<string, { label: string; income: number; expense: number }>();

  for (const point of series) {
    const label =
      keyField === "month" && "month" in point
        ? point.month
        : keyField === "week" && "week" in point
          ? point.week
          : "";
    const current = grouped.get(label) ?? {
      label,
      income: 0,
      expense: 0
    };

    if (point.type === "INCOME") current.income = point.total;
    if (point.type === "EXPENSE") current.expense = point.total;
    grouped.set(label, current);
  }

  return [...grouped.values()];
}

export function OverviewChart({ summary }: { summary: DashboardSummary }) {
  const monthly = buildTrendRows(summary.monthlyTrends, "month");
  const categories = summary.categoryBreakdown.reduce<Record<string, number>>((acc, item) => {
    acc[item.category] = (acc[item.category] ?? 0) + item.total;
    return acc;
  }, {});

  const categoryRows = Object.entries(categories).map(([category, total]) => ({
    category,
    total
  }));

  return (
    <div className="grid gap-6 xl:grid-cols-[1.8fr_1fr]">
      <GlassCard>
        <div className="mb-5">
          <h3 className="font-display text-2xl font-semibold text-foreground">Monthly cashflow</h3>
          <p className="mt-1 text-sm text-foreground/55">Income and expense movement across billing cycles.</p>
        </div>
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthly}>
              <defs>
                <linearGradient id="incomeGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor="#39D1C9" stopOpacity={0.7} />
                  <stop offset="95%" stopColor="#39D1C9" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expenseGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor="#FF8C5C" stopOpacity={0.7} />
                  <stop offset="95%" stopColor="#FF8C5C" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(148, 163, 184, 0.16)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: "currentColor", opacity: 0.6 }} />
              <YAxis
                tickFormatter={(value) => formatCompactCurrency(Number(value))}
                tick={{ fill: "currentColor", opacity: 0.6 }}
              />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Area type="monotone" dataKey="income" stroke="#39D1C9" fill="url(#incomeGradient)" strokeWidth={2.5} />
              <Area type="monotone" dataKey="expense" stroke="#FF8C5C" fill="url(#expenseGradient)" strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      <GlassCard>
        <div className="mb-5">
          <h3 className="font-display text-2xl font-semibold text-foreground">Category mix</h3>
          <p className="mt-1 text-sm text-foreground/55">Top categories shaping spend and revenue.</p>
        </div>
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryRows}>
              <CartesianGrid stroke="rgba(148, 163, 184, 0.16)" vertical={false} />
              <XAxis dataKey="category" tick={{ fill: "currentColor", opacity: 0.6 }} />
              <YAxis
                tickFormatter={(value) => formatCompactCurrency(Number(value))}
                tick={{ fill: "currentColor", opacity: 0.6 }}
              />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Bar dataKey="total" fill="#5D87FF" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>
    </div>
  );
}
