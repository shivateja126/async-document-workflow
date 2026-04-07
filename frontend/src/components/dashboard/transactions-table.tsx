import { FinancialRecord, Role } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { GlassCard } from "../ui/glass-card";
import { Button } from "../ui/button";

type Props = {
  items: FinancialRecord[];
  role: Role;
  onDelete?: (id: string) => void;
};

export function TransactionsTable({ items, role, onDelete }: Props) {
  return (
    <GlassCard className="overflow-hidden">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="font-display text-2xl font-semibold text-foreground">Transactions</h3>
          <p className="mt-1 text-sm text-foreground/55">Filterable transaction ledger with user attribution.</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="text-foreground/45">
            <tr className="border-b border-white/10">
              <th className="pb-3 pr-4 font-medium">Category</th>
              <th className="pb-3 pr-4 font-medium">Type</th>
              <th className="pb-3 pr-4 font-medium">Amount</th>
              <th className="pb-3 pr-4 font-medium">Date</th>
              <th className="pb-3 pr-4 font-medium">Created by</th>
              <th className="pb-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-white/5 text-foreground/80">
                <td className="py-4 pr-4">
                  <div>{item.category}</div>
                  <div className="text-xs text-foreground/45">{item.description || "No description"}</div>
                </td>
                <td className="py-4 pr-4">{item.type}</td>
                <td className="py-4 pr-4">{formatCurrency(Number(item.amount))}</td>
                <td className="py-4 pr-4">{formatDate(item.date)}</td>
                <td className="py-4 pr-4">{item.createdBy?.name ?? "System"}</td>
                <td className="py-4">
                  {role === "ADMIN" ? (
                    <Button variant="ghost" onClick={() => onDelete?.(item.id)}>
                      Archive
                    </Button>
                  ) : (
                    <span className="text-foreground/35">Read only</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
}
