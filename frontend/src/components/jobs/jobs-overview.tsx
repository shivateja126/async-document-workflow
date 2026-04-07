"use client";

import Link from "next/link";
import { ArrowUpRight, Clock3, ListChecks, RadioTower, TimerReset } from "lucide-react";
import { useDocuments } from "@/hooks/use-documents";
import { StatusBadge } from "@/components/shared/status-badge";
import { buttonClassName } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SurfaceCard } from "@/components/ui/surface-card";
import { formatDate } from "@/services/format";

export function JobsOverview() {
  const documentsQuery = useDocuments({
    page: 1,
    pageSize: 12,
    sortBy: "updated_at",
    sortOrder: "desc"
  });

  const documents = documentsQuery.data?.items ?? [];
  const jobs = documents.filter((document) => document.latest_job);
  const activeJobs = jobs.filter(
    (document) =>
      document.latest_job?.status === "queued" || document.latest_job?.status === "processing"
  ).length;

  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <SurfaceCard className="p-5 sm:p-6">
        <div className="flex flex-col gap-4 border-b border-white/10 pb-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.26em] text-appTextMuted">
              Job stream
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">
              Latest worker attempts
            </h2>
            <p className="mt-2 text-sm text-appTextMuted">
              Jump into live progress for active jobs or review completed outputs.
            </p>
          </div>
          <Link href="/upload" className={buttonClassName({})}>
            Queue document
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-5 space-y-3">
          {documentsQuery.isLoading
            ? Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-28 rounded-2xl" />
              ))
            : null}

          {!documentsQuery.isLoading && !jobs.length ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-10 text-center">
              <p className="text-sm font-medium text-appText">No job attempts yet.</p>
              <p className="mt-2 text-sm text-appTextMuted">
                Upload a document to create the first queue entry.
              </p>
            </div>
          ) : null}

          {jobs.map((document) => {
            const job = document.latest_job;
            if (!job) return null;

            return (
              <Link
                key={job.id}
                href={`/jobs/${job.id}?documentId=${document.id}`}
                className="group block rounded-2xl border border-white/10 bg-white/[0.035] p-5 transition duration-300 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.06]"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-base font-semibold text-white">{document.filename}</p>
                      <StatusBadge status={job.status} />
                    </div>
                    <p className="mt-2 truncate text-sm text-appTextMuted">{document.file_path}</p>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs text-appTextMuted">
                      <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
                        <Clock3 className="h-3.5 w-3.5" />
                        Attempt {job.attempt_number}
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
                        Updated {formatDate(job.updated_at)}
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
                        {document.extracted_data?.category ?? "Pending extraction"}
                      </span>
                    </div>
                  </div>

                  <div className="w-full lg:w-56">
                    <div className="flex items-center justify-between text-xs text-appTextMuted">
                      <span>Progress</span>
                      <span>{job.progress}%</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-white/[0.08]">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 shadow-[0_0_24px_rgba(99,102,241,0.35)] transition-all duration-500"
                        style={{ width: `${job.progress}%` }}
                      />
                    </div>
                    <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-indigo-200 transition group-hover:text-white">
                      Open live stream
                      <ArrowUpRight className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </SurfaceCard>

      <aside className="space-y-6">
        <SurfaceCard glow className="p-5">
          <p className="text-[11px] font-medium uppercase tracking-[0.26em] text-appTextMuted">
            Queue snapshot
          </p>
          <div className="mt-5 grid gap-3">
            <SnapshotRow icon={ListChecks} label="Visible attempts" value={String(jobs.length)} />
            <SnapshotRow icon={TimerReset} label="Active jobs" value={String(activeJobs)} />
            <SnapshotRow icon={RadioTower} label="Realtime channel" value="Redis Pub/Sub" />
          </div>
        </SurfaceCard>

        <SurfaceCard className="p-5">
          <p className="text-[11px] font-medium uppercase tracking-[0.26em] text-appTextMuted">
            Stage model
          </p>
          <div className="mt-5 space-y-4">
            {["Queued", "Processing", "Completed"].map((step, index) => (
              <div key={step} className="flex items-center gap-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-indigo-400/20 bg-indigo-500/10 text-sm font-semibold text-indigo-100">
                  {index + 1}
                </span>
                <div>
                  <p className="text-sm font-medium text-white">{step}</p>
                  <p className="text-xs text-appTextMuted">
                    {index === 0
                      ? "API accepted the upload"
                      : index === 1
                        ? "Worker is emitting progress"
                        : "Extraction is ready for review"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </SurfaceCard>
      </aside>
    </section>
  );
}

function SnapshotRow({
  icon: Icon,
  label,
  value
}: {
  icon: typeof ListChecks;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-appTextMuted">
          <Icon className="h-4 w-4" />
        </span>
        <span className="text-sm text-appTextMuted">{label}</span>
      </div>
      <span className="text-sm font-semibold text-white">{value}</span>
    </div>
  );
}
