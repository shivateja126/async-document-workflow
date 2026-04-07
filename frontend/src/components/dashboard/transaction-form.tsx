"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Select } from "../ui/select";
import { GlassCard } from "../ui/glass-card";

type Props = {
  onSubmit: (payload: {
    amount: number;
    type: "INCOME" | "EXPENSE";
    category: string;
    date: string;
    description?: string;
  }) => Promise<void>;
};

export function TransactionForm({ onSubmit }: Props) {
  const [form, setForm] = useState({
    amount: "",
    type: "INCOME" as "INCOME" | "EXPENSE",
    category: "",
    date: new Date().toISOString().slice(0, 10),
    description: ""
  });
  const [submitting, setSubmitting] = useState(false);

  return (
    <GlassCard>
      <div className="mb-5">
        <h3 className="font-display text-2xl font-semibold text-foreground">Create record</h3>
        <p className="mt-1 text-sm text-foreground/55">Admin-only write access with validated API persistence.</p>
      </div>
      <form
        className="grid gap-3 md:grid-cols-2"
        onSubmit={async (event) => {
          event.preventDefault();
          setSubmitting(true);
          await onSubmit({
            amount: Number(form.amount),
            type: form.type,
            category: form.category,
            date: new Date(form.date).toISOString(),
            description: form.description
          });
          setSubmitting(false);
          setForm({
            amount: "",
            type: "INCOME",
            category: "",
            date: new Date().toISOString().slice(0, 10),
            description: ""
          });
        }}
      >
        <Input
          placeholder="Amount"
          value={form.amount}
          onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
        />
        <Select
          value={form.type}
          onChange={(event) =>
            setForm((current) => ({ ...current, type: event.target.value as "INCOME" | "EXPENSE" }))
          }
        >
          <option value="INCOME">Income</option>
          <option value="EXPENSE">Expense</option>
        </Select>
        <Input
          placeholder="Category"
          value={form.category}
          onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
        />
        <Input
          type="date"
          value={form.date}
          onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
        />
        <Input
          placeholder="Description"
          className="md:col-span-2"
          value={form.description}
          onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
        />
        <Button type="submit" className="md:col-span-2" disabled={submitting}>
          {submitting ? "Saving..." : "Create transaction"}
        </Button>
      </form>
    </GlassCard>
  );
}
