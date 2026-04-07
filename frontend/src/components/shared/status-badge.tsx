import { clsx } from "clsx";
import { titleCase } from "@/services/format";
import { DocumentStatus, JobStatus } from "@/services/types";

type StatusBadgeProps = {
  status: DocumentStatus | JobStatus;
};

const styles: Record<DocumentStatus | JobStatus, string> = {
  queued: "border-amber-400/20 bg-amber-500/10 text-amber-200",
  processing: "border-indigo-400/20 bg-indigo-500/10 text-indigo-200",
  completed: "border-emerald-400/20 bg-emerald-500/10 text-emerald-200",
  failed: "border-red-400/20 bg-red-500/10 text-red-200"
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em]",
        styles[status]
      )}
    >
      {titleCase(status)}
    </span>
  );
}
