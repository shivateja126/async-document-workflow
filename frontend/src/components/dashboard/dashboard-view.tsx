"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useDeferredValue, useState } from "react";
import {
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  FileCheck2,
  Layers3,
  LoaderCircle,
  Search,
  TimerReset,
  Trash2,
  X
} from "lucide-react";
import { useDocuments } from "@/hooks/use-documents";
import { ApiError, deleteDocument } from "@/services/api";
import { formatBytes, formatDate, titleCase } from "@/services/format";
import { queryKeys } from "@/services/query-client";
import { DocumentDeleteResponse, DocumentStatus, DocumentSummary } from "@/services/types";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button, buttonClassName } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SurfaceCard } from "@/components/ui/surface-card";

const statusFilters: Array<DocumentStatus | "all"> = ["all", "queued", "processing", "completed", "failed"];
type SortField = "updated_at" | "created_at" | "filename" | "status";

export function DashboardView() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<DocumentStatus | "all">("all");
  const [sortBy, setSortBy] = useState<SortField>("updated_at");
  const [page, setPage] = useState(1);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const deferredSearch = useDeferredValue(search);

  const documentsQuery = useDocuments({
    page,
    pageSize: 8,
    search: deferredSearch,
    status,
    sortBy,
    sortOrder: "desc"
  });

  const documents = documentsQuery.data?.items ?? [];
  const inFlightCount = documents.filter((item) => item.status === "queued" || item.status === "processing").length;
  const completedCount = documents.filter((item) => item.status === "completed").length;
  const reviewReadyCount = documents.filter(
    (item) => item.extracted_data && !item.extracted_data.finalized
  ).length;
  const failedCount = documents.filter((item) => item.status === "failed").length;
  const recentJobs = documents.filter((item) => item.latest_job).slice(0, 5);
  const totalItems = documentsQuery.data?.meta.totalItems ?? 0;

  const deleteMutation = useMutation<DocumentDeleteResponse, ApiError, string>({
    mutationFn: deleteDocument,
    onSuccess: (_response, deletedDocumentId) => {
      setPendingDeleteId(null);
      queryClient.removeQueries({ queryKey: queryKeys.document(deletedDocumentId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.documents });
    }
  });

  const requestDelete = (documentId: string) => {
    if (pendingDeleteId === documentId) {
      deleteMutation.mutate(documentId);
      return;
    }
    setPendingDeleteId(documentId);
  };

  return (
    <section className="space-y-6">
      <SurfaceCard className="p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-indigo-200/90">
              Operations control
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">
              Documents, jobs, and review state in one focused queue.
            </h2>
          </div>

          <Link href="/upload" className={buttonClassName({})}>
            Upload document
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-6 grid gap-3 lg:grid-cols-[minmax(0,1.5fr)_220px_220px]">
          <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 transition duration-300 focus-within:border-indigo-400/40 focus-within:bg-white/[0.06]">
            <Search className="h-4 w-4 text-appTextMuted" />
            <input
              value={search}
              onChange={(event) => {
                setPage(1);
                setSearch(event.target.value);
              }}
              placeholder="Search by filename or storage path"
              className="w-full bg-transparent text-sm text-appText outline-none placeholder:text-appTextMuted/70"
            />
          </label>

          <select
            value={status}
            onChange={(event) => {
              setPage(1);
              setStatus(event.target.value as DocumentStatus | "all");
            }}
            className="rounded-2xl border border-white/10 bg-[#111827] px-4 py-3 text-sm text-appText outline-none transition duration-300 hover:border-white/20 focus:border-indigo-400/40"
          >
            {statusFilters.map((item) => (
              <option key={item} value={item}>
                {titleCase(item)}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as SortField)}
            className="rounded-2xl border border-white/10 bg-[#111827] px-4 py-3 text-sm text-appText outline-none transition duration-300 hover:border-white/20 focus:border-indigo-400/40"
          >
            <option value="updated_at">Recently updated</option>
            <option value="created_at">Recently created</option>
            <option value="filename">Filename</option>
            <option value="status">Status</option>
          </select>
        </div>
      </SurfaceCard>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Visible documents"
          value={String(totalItems)}
          description="Matching current filters"
          icon={Layers3}
        />
        <MetricCard
          label="In flight"
          value={String(inFlightCount)}
          description="Queued or processing now"
          icon={TimerReset}
          tone="indigo"
        />
        <MetricCard
          label="Review ready"
          value={String(reviewReadyCount)}
          description="Extracted and not finalized"
          icon={FileCheck2}
          tone="violet"
        />
        <MetricCard
          label="Completed"
          value={String(completedCount)}
          description={`${failedCount} visible failures`}
          icon={CheckCircle2}
          tone="green"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <SurfaceCard className="p-5 sm:p-6">
          <div className="flex flex-col gap-3 border-b border-white/10 pb-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.26em] text-appTextMuted">
                Document queue
              </p>
              <h3 className="mt-2 text-xl font-semibold text-white">Processing backlog</h3>
            </div>
            <p className="text-sm text-appTextMuted">
              Page {documentsQuery.data?.meta.page ?? 1} of {documentsQuery.data?.meta.totalPages ?? 1}
            </p>
          </div>

          <div className="mt-5 space-y-3">
            {documentsQuery.isLoading
              ? Array.from({ length: 5 }).map((_, index) => (
                  <Skeleton key={index} className="h-32 rounded-2xl" />
                ))
              : null}

            {!documentsQuery.isLoading && !documents.length ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-10 text-center">
                <p className="text-sm font-medium text-appText">No documents match these filters.</p>
                <p className="mt-2 text-sm text-appTextMuted">
                  Try a different status or upload a new document to seed the workflow.
                </p>
              </div>
            ) : null}

            {documents.map((document) => (
              <DocumentQueueCard
                key={document.id}
                document={document}
                pendingDeleteId={pendingDeleteId}
                deletingDocumentId={deleteMutation.isPending ? deleteMutation.variables ?? null : null}
                deleteError={
                  deleteMutation.isError && deleteMutation.variables === document.id
                    ? deleteMutation.error.message
                    : null
                }
                onCancelDelete={() => setPendingDeleteId(null)}
                onRequestDelete={requestDelete}
              />
            ))}
          </div>

          <div className="mt-5 flex flex-col gap-3 text-sm text-appTextMuted sm:flex-row sm:items-center sm:justify-between">
            <p>
              Showing {documents.length} of {totalItems} documents
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() =>
                  setPage((current) =>
                    Math.min(documentsQuery.data?.meta.totalPages ?? current, current + 1)
                  )
                }
                disabled={page >= (documentsQuery.data?.meta.totalPages ?? 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </SurfaceCard>

        <aside id="jobs-preview" className="space-y-6">
          <SurfaceCard className="p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.26em] text-appTextMuted">
                  Jobs preview
                </p>
                <h3 className="mt-2 text-lg font-semibold text-white">Latest attempts</h3>
              </div>
              <Link href="/jobs" className="text-sm text-indigo-200 transition hover:text-white">
                Open
              </Link>
            </div>

            <div className="mt-5 space-y-3">
              {documentsQuery.isLoading
                ? Array.from({ length: 4 }).map((_, index) => (
                    <Skeleton key={index} className="h-20 rounded-2xl" />
                  ))
                : null}

              {!documentsQuery.isLoading && !recentJobs.length ? (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-5 text-sm text-appTextMuted">
                  Upload a document to create the first job attempt.
                </div>
              ) : null}

              {recentJobs.map((document) => (
                <RecentJobItem key={document.id} document={document} />
              ))}
            </div>
          </SurfaceCard>

          <SurfaceCard glow className="overflow-hidden p-5">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-300/40 to-transparent" />
            <p className="text-[11px] font-medium uppercase tracking-[0.26em] text-appTextMuted">
              Queue health
            </p>
            <div className="mt-5 space-y-4">
              <QueueBar label="In flight" value={inFlightCount} total={Math.max(documents.length, 1)} />
              <QueueBar label="Completed" value={completedCount} total={Math.max(documents.length, 1)} />
              <QueueBar label="Needs review" value={reviewReadyCount} total={Math.max(documents.length, 1)} />
            </div>
            <div className="mt-6 rounded-2xl border border-indigo-400/20 bg-indigo-500/10 p-4">
              <p className="text-sm font-medium text-indigo-100">Focus mode</p>
              <p className="mt-2 text-sm leading-6 text-indigo-100/70">
                The table is now optimized for operational scanning: status, progress, review state,
                and direct handoff into live job streams.
              </p>
            </div>
          </SurfaceCard>
        </aside>
      </div>
    </section>
  );
}

function MetricCard({
  label,
  value,
  description,
  icon: Icon,
  tone = "slate"
}: {
  label: string;
  value: string;
  description: string;
  icon: typeof Layers3;
  tone?: "slate" | "indigo" | "violet" | "green";
}) {
  const toneClasses = {
    slate: "border-white/10 bg-white/[0.06] text-appTextMuted",
    indigo: "border-indigo-400/20 bg-indigo-500/10 text-indigo-200",
    violet: "border-purple-400/20 bg-purple-500/10 text-purple-200",
    green: "border-emerald-400/20 bg-emerald-500/10 text-emerald-200"
  };

  return (
    <SurfaceCard className="p-5 transition duration-300 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.06]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.26em] text-appTextMuted">
            {label}
          </p>
          <p className="mt-4 font-display text-4xl font-semibold text-white">{value}</p>
        </div>
        <span className={["flex h-11 w-11 items-center justify-center rounded-2xl border", toneClasses[tone]].join(" ")}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-4 text-sm text-appTextMuted">{description}</p>
    </SurfaceCard>
  );
}

function DocumentQueueCard({
  document,
  pendingDeleteId,
  deletingDocumentId,
  deleteError,
  onCancelDelete,
  onRequestDelete
}: {
  document: DocumentSummary;
  pendingDeleteId: string | null;
  deletingDocumentId: string | null;
  deleteError: string | null;
  onCancelDelete: () => void;
  onRequestDelete: (documentId: string) => void;
}) {
  const latestJob = document.latest_job;
  const progress = latestJob?.progress ?? 0;
  const isActive = document.status === "queued" || document.status === "processing";
  const isConfirmingDelete = pendingDeleteId === document.id;
  const isDeleting = deletingDocumentId === document.id;

  return (
    <div className="group rounded-2xl border border-white/10 bg-white/[0.035] p-4 transition duration-300 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.06]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/documents/${document.id}`}
              className="truncate text-base font-semibold text-white transition hover:text-indigo-200"
            >
              {document.filename}
            </Link>
            <StatusBadge status={document.status} />
          </div>
          <p className="mt-2 truncate text-sm text-appTextMuted">{document.file_path}</p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-appTextMuted">
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
              {formatBytes(document.size_bytes)}
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
              {document.extracted_data?.category ?? "Pending category"}
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
              Updated {formatDate(document.updated_at)}
            </span>
          </div>
        </div>

        <div className="w-full lg:w-56">
          <div className="flex items-center justify-between text-xs text-appTextMuted">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <ProgressBar progress={progress} />
          <div className="mt-4 flex gap-2">
            {latestJob ? (
              <Link
                href={`/jobs/${latestJob.id}?documentId=${document.id}`}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-indigo-400/20 bg-indigo-500/10 px-3 py-2 text-sm font-medium text-indigo-100 transition duration-300 hover:bg-indigo-500/15"
              >
                Live job
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            ) : null}
            <Link
              href={`/documents/${document.id}`}
              className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-medium text-appText transition duration-300 hover:bg-white/[0.08]"
            >
              Review
            </Link>
          </div>
          <div className="mt-2 flex gap-2">
            <Button
              type="button"
              variant={isConfirmingDelete ? "danger" : "ghost"}
              className="flex-1 px-3 py-2 text-xs"
              onClick={() => onRequestDelete(document.id)}
              disabled={isActive || isDeleting}
              title={isActive ? "Wait for processing to finish before deleting." : undefined}
            >
              {isDeleting ? (
                <>
                  <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                  Deleting
                </>
              ) : isConfirmingDelete ? (
                <>
                  <Trash2 className="h-3.5 w-3.5" />
                  Confirm delete
                </>
              ) : (
                <>
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete file
                </>
              )}
            </Button>
            {isConfirmingDelete && !isDeleting ? (
              <Button
                type="button"
                variant="ghost"
                className="px-3 py-2 text-xs"
                onClick={onCancelDelete}
              >
                <X className="h-3.5 w-3.5" />
                Cancel
              </Button>
            ) : null}
          </div>
          {isActive ? (
            <p className="mt-2 text-xs text-appTextMuted">Delete unlocks after processing finishes.</p>
          ) : null}
          {deleteError ? (
            <p className="mt-2 rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs text-red-100">
              {deleteError}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function RecentJobItem({ document }: { document: DocumentSummary }) {
  const latestJob = document.latest_job;
  if (!latestJob) return null;

  return (
    <Link
      href={`/jobs/${latestJob.id}?documentId=${document.id}`}
      className="block rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition duration-300 hover:border-white/20 hover:bg-white/[0.06]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-white">{document.filename}</p>
          <p className="mt-1 inline-flex items-center gap-1 text-xs text-appTextMuted">
            <Clock3 className="h-3.5 w-3.5" />
            Attempt {latestJob.attempt_number}
          </p>
        </div>
        <StatusBadge status={latestJob.status} />
      </div>
      <ProgressBar progress={latestJob.progress} className="mt-4" />
    </Link>
  );
}

function QueueBar({ label, value, total }: { label: string; value: number; total: number }) {
  const percentage = Math.round((value / total) * 100);

  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-appTextMuted">{label}</span>
        <span className="font-medium text-appText">{value}</span>
      </div>
      <ProgressBar progress={percentage} className="mt-2" />
    </div>
  );
}

function ProgressBar({ progress, className = "" }: { progress: number; className?: string }) {
  return (
    <div className={["h-2 rounded-full bg-white/[0.08]", className].join(" ")}>
      <div
        className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 shadow-[0_0_24px_rgba(99,102,241,0.35)] transition-all duration-500"
        style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
      />
    </div>
  );
}
