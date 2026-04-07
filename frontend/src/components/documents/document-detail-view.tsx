"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowDownToLine,
  ArrowRight,
  CheckCircle2,
  FileText,
  History,
  LoaderCircle,
  Save,
  Trash2,
  X
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, Dispatch, SetStateAction, useEffect, useState } from "react";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button, buttonClassName } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SurfaceCard } from "@/components/ui/surface-card";
import { useDocument } from "@/hooks/use-document";
import {
  ApiError,
  buildExportUrl,
  deleteDocument,
  finalizeDocument,
  reviewDocument
} from "@/services/api";
import { formatBytes, formatDate } from "@/services/format";
import { queryKeys } from "@/services/query-client";
import { DocumentDeleteResponse, DocumentDetail, FinalizeDocumentResponse } from "@/services/types";

type ReviewState = {
  title: string;
  category: string;
  summary: string;
  keywords: string;
};

const emptyState: ReviewState = {
  title: "",
  category: "",
  summary: "",
  keywords: ""
};

export function DocumentDetailView({ documentId }: { documentId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const documentQuery = useDocument(documentId);
  const [formState, setFormState] = useState<ReviewState>(emptyState);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    const extracted = documentQuery.data?.extracted_data;
    if (!extracted) return;
    setFormState({
      title: extracted.title,
      category: extracted.category,
      summary: extracted.summary,
      keywords: extracted.keywords.join(", ")
    });
  }, [documentQuery.data?.extracted_data]);

  const reviewMutation = useMutation<DocumentDetail, ApiError, void>({
    mutationFn: () =>
      reviewDocument(documentId, {
        title: formState.title,
        category: formState.category,
        summary: formState.summary,
        keywords: formState.keywords
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      }),
    onSuccess: (document) => {
      queryClient.setQueryData(queryKeys.document(documentId), document);
      void queryClient.invalidateQueries({ queryKey: queryKeys.documents });
    }
  });

  const finalizeMutation = useMutation<FinalizeDocumentResponse, ApiError, void>({
    mutationFn: () => finalizeDocument(documentId),
    onSuccess: (response) => {
      queryClient.setQueryData(queryKeys.document(documentId), response.document);
      void queryClient.invalidateQueries({ queryKey: queryKeys.documents });
    }
  });

  const deleteMutation = useMutation<DocumentDeleteResponse, ApiError, void>({
    mutationFn: () => deleteDocument(documentId),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: queryKeys.document(documentId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.documents });
      router.push("/dashboard");
    }
  });

  const document = documentQuery.data;
  const latestJob = document?.latest_job;
  const extractedData = document?.extracted_data;
  const canDelete = document ? document.status !== "queued" && document.status !== "processing" : false;
  const exportReady = Boolean(extractedData?.finalized);

  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="space-y-6">
        <SurfaceCard glow className="overflow-hidden p-6 sm:p-8">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-300/40 to-transparent" />
          {documentQuery.isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-20 rounded-2xl" />
              <div className="grid gap-4 md:grid-cols-3">
                <Skeleton className="h-24 rounded-2xl" />
                <Skeleton className="h-24 rounded-2xl" />
                <Skeleton className="h-24 rounded-2xl" />
              </div>
            </div>
          ) : null}

          {document ? (
            <>
              <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-indigo-200/90">
                    Document detail
                  </p>
                  <h2 className="mt-3 truncate font-display text-3xl font-semibold tracking-tight text-white">
                    {document.filename}
                  </h2>
                  <p className="mt-3 max-w-3xl break-all text-sm leading-6 text-appTextMuted">
                    Stored at {document.file_path}
                  </p>
                </div>
                <StatusBadge status={document.status} />
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-3">
                <Metric label="Current job" value={latestJob?.id.slice(0, 8) ?? "Pending"} />
                <Metric label="Progress" value={`${latestJob?.progress ?? 0}%`} />
                <Metric label="File size" value={formatBytes(document.size_bytes)} />
              </div>
            </>
          ) : null}
        </SurfaceCard>

        <SurfaceCard className="p-6 sm:p-8">
          <div className="flex flex-col gap-4 border-b border-white/10 pb-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.26em] text-appTextMuted">
                Review extracted data
              </p>
              <h3 className="mt-2 text-2xl font-semibold text-white">Operator review</h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-appTextMuted">
                Refine the simulated extraction before finalizing and exporting the clean record.
              </p>
            </div>
            {document?.latest_job ? (
              <Link
                href={`/jobs/${document.latest_job.id}?documentId=${document.id}`}
                className={buttonClassName({ variant: "secondary" })}
              >
                Open live job
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : null}
          </div>

          {!extractedData ? (
            <div className="mt-6 rounded-2xl border border-amber-400/20 bg-amber-500/10 px-5 py-5 text-sm leading-6 text-amber-100">
              Extraction output has not been generated yet. Return after the worker completes.
            </div>
          ) : (
            <div className="mt-6 grid gap-5">
              <div className="grid gap-5 md:grid-cols-2">
                <Field
                  label="Title"
                  value={formState.title}
                  onChange={(event) => updateField(setFormState, "title", event)}
                />
                <Field
                  label="Category"
                  value={formState.category}
                  onChange={(event) => updateField(setFormState, "category", event)}
                />
              </div>

              <label className="grid gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-appTextMuted">
                  Summary
                </span>
                <textarea
                  value={formState.summary}
                  onChange={(event) => updateField(setFormState, "summary", event)}
                  rows={7}
                  className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm leading-6 text-appText outline-none transition duration-300 placeholder:text-appTextMuted/70 hover:border-white/20 focus:border-indigo-400/40 focus:bg-white/[0.07]"
                />
              </label>

              <Field
                label="Keywords"
                value={formState.keywords}
                onChange={(event) => updateField(setFormState, "keywords", event)}
                hint="Comma-separated"
              />

              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  onClick={() => reviewMutation.mutate()}
                  disabled={reviewMutation.isPending}
                >
                  {reviewMutation.isPending ? (
                    <>
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      Saving review
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save review changes
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => finalizeMutation.mutate()}
                  disabled={finalizeMutation.isPending || extractedData.finalized}
                >
                  {extractedData.finalized ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Finalized
                    </>
                  ) : finalizeMutation.isPending ? (
                    <>
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      Finalizing
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Finalize document
                    </>
                  )}
                </Button>
              </div>

              {reviewMutation.error ? (
                <p className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                  {reviewMutation.error.message}
                </p>
              ) : null}
            </div>
          )}
        </SurfaceCard>
      </div>

      <aside className="space-y-6">
        <SurfaceCard className="p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-indigo-400/20 bg-indigo-500/10 text-indigo-100">
              <ArrowDownToLine className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.26em] text-appTextMuted">
                Export
              </p>
              <h3 className="text-lg font-semibold text-white">Download output</h3>
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            {exportReady ? (
              <>
                <a href={buildExportUrl(documentId, "json")} className={buttonClassName({})}>
                  Export JSON
                  <ArrowDownToLine className="h-4 w-4" />
                </a>
                <a
                  href={buildExportUrl(documentId, "csv")}
                  className={buttonClassName({ variant: "secondary" })}
                >
                  Export CSV
                  <ArrowDownToLine className="h-4 w-4" />
                </a>
              </>
            ) : (
              <>
                <Button type="button" disabled>
                  Export JSON
                  <ArrowDownToLine className="h-4 w-4" />
                </Button>
                <Button type="button" variant="secondary" disabled>
                  Export CSV
                  <ArrowDownToLine className="h-4 w-4" />
                </Button>
                <p className="text-sm leading-6 text-appTextMuted">
                  Finalize the reviewed output to unlock assignment-compliant exports.
                </p>
              </>
            )}
          </div>
        </SurfaceCard>

        <SurfaceCard className="border-red-400/20 bg-red-500/10 p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-red-400/30 bg-red-500/15 text-red-100">
              <Trash2 className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.26em] text-red-100/70">
                File cleanup
              </p>
              <h3 className="text-lg font-semibold text-red-50">Delete uploaded file</h3>
            </div>
          </div>

          <p className="mt-4 text-sm leading-6 text-red-100/75">
            Removes this document, its job history, extracted data, and the stored upload from the
            local project storage.
          </p>

          {!canDelete ? (
            <p className="mt-3 rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
              Delete becomes available after the worker finishes processing.
            </p>
          ) : null}

          <div className="mt-5 flex gap-2">
            <Button
              type="button"
              variant={confirmDelete ? "danger" : "secondary"}
              className="flex-1"
              disabled={!canDelete || deleteMutation.isPending}
              onClick={() => {
                if (confirmDelete) {
                  deleteMutation.mutate();
                  return;
                }
                setConfirmDelete(true);
              }}
            >
              {deleteMutation.isPending ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Deleting
                </>
              ) : confirmDelete ? (
                <>
                  <Trash2 className="h-4 w-4" />
                  Confirm delete
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Delete file
                </>
              )}
            </Button>
            {confirmDelete && !deleteMutation.isPending ? (
              <Button type="button" variant="ghost" onClick={() => setConfirmDelete(false)}>
                <X className="h-4 w-4" />
                Cancel
              </Button>
            ) : null}
          </div>

          {deleteMutation.error ? (
            <p className="mt-3 rounded-2xl border border-red-300/20 bg-red-950/30 px-4 py-3 text-sm text-red-100">
              {deleteMutation.error.message}
            </p>
          ) : null}
        </SurfaceCard>

        <SurfaceCard className="p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-appTextMuted">
              <FileText className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.26em] text-appTextMuted">
                Extracted record
              </p>
              <h3 className="text-lg font-semibold text-white">
                {extractedData?.finalized ? "Finalized" : "Review pending"}
              </h3>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <InfoRow label="Category" value={extractedData?.category ?? "Pending"} />
            <InfoRow label="Updated" value={document ? formatDate(document.updated_at) : "Pending"} />
            <InfoRow label="Keywords" value={extractedData?.keywords.length ? String(extractedData.keywords.length) : "0"} />
          </div>
        </SurfaceCard>

        <SurfaceCard className="p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-appTextMuted">
              <History className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.26em] text-appTextMuted">
                Job history
              </p>
              <h3 className="text-lg font-semibold text-white">Attempts</h3>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {document?.jobs.map((job) => (
              <Link
                key={job.id}
                href={`/jobs/${job.id}?documentId=${documentId}`}
                className="block rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition duration-300 hover:border-white/20 hover:bg-white/[0.06]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">Attempt {job.attempt_number}</p>
                    <p className="mt-1 text-xs text-appTextMuted">{formatDate(job.created_at)}</p>
                  </div>
                  <StatusBadge status={job.status} />
                </div>
              </Link>
            ))}
          </div>
        </SurfaceCard>
      </aside>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4">
      <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-appTextMuted">
        {label}
      </p>
      <p className="mt-3 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  hint
}: {
  label: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  hint?: string;
}) {
  return (
    <label className="grid gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-appTextMuted">
          {label}
        </span>
        {hint ? <span className="text-xs text-appTextMuted">{hint}</span> : null}
      </div>
      <input
        value={value}
        onChange={onChange}
        className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-appText outline-none transition duration-300 placeholder:text-appTextMuted/70 hover:border-white/20 focus:border-indigo-400/40 focus:bg-white/[0.07]"
      />
    </label>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
      <span className="text-sm text-appTextMuted">{label}</span>
      <span className="truncate text-sm font-medium text-white">{value}</span>
    </div>
  );
}

function updateField(
  setState: Dispatch<SetStateAction<ReviewState>>,
  key: keyof ReviewState,
  event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
) {
  const value = event.target.value;
  setState((current) => ({ ...current, [key]: value }));
}
