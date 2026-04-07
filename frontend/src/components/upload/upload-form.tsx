"use client";

import { useMutation } from "@tanstack/react-query";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileText,
  LoaderCircle,
  UploadCloud
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DragEvent, useRef, useState, useTransition } from "react";
import { useDocuments } from "@/hooks/use-documents";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SurfaceCard } from "@/components/ui/surface-card";
import { ApiError, uploadDocuments } from "@/services/api";
import { formatBytes } from "@/services/format";
import { BatchUploadResponse } from "@/services/types";

export function UploadForm() {
  const router = useRouter();
  const [isRouting, startTransition] = useTransition();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const recentDocumentsQuery = useDocuments({
    page: 1,
    pageSize: 4,
    sortBy: "updated_at",
    sortOrder: "desc"
  });

  const mutation = useMutation<BatchUploadResponse, ApiError, File[]>({
    mutationFn: uploadDocuments,
    onSuccess: (response) => {
      startTransition(() => {
        if (response.items.length === 1) {
          const uploadedDocument = response.items[0];
          router.push(`/jobs/${uploadedDocument.job_id}?documentId=${uploadedDocument.document_id}`);
          return;
        }
        router.push("/dashboard");
      });
    }
  });

  const recentDocuments = recentDocumentsQuery.data?.items ?? [];
  const isSubmitting = mutation.isPending || isRouting;
  const selectedFileCount = selectedFiles.length;
  const selectedTotalSize = selectedFiles.reduce((total, file) => total + file.size, 0);

  function handleFileSelection(files: FileList | File[] | null) {
    setSelectedFiles(files ? Array.from(files) : []);
    mutation.reset();
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    handleFileSelection(event.dataTransfer.files);
  }

  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_380px]">
      <div className="space-y-6">
        <SurfaceCard glow className="overflow-hidden p-6 sm:p-8">
          <div className="flex flex-col gap-4 border-b border-white/10 pb-6 md:flex-row md:items-start md:justify-between">
            <div className="max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-indigo-200/90">
                Document intake
              </p>
              <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Dispatch uploads without blocking the request path.
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-appTextMuted">
                Each upload is persisted, queued, and streamed into the worker pipeline so the UI
                can stay focused on visibility instead of waiting.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                <p className="text-xs uppercase tracking-[0.22em] text-appTextMuted">Accepted</p>
                <p className="mt-2 text-sm font-medium text-appText">PDF, DOCX, TXT, PNG, JPG</p>
              </div>
            </div>
          </div>

          <div
            role="button"
            tabIndex={0}
            onClick={() => inputRef.current?.click()}
            onDragEnter={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={(event) => {
              event.preventDefault();
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                setIsDragging(false);
              }
            }}
            onDrop={handleDrop}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                inputRef.current?.click();
              }
            }}
            className={[
              "group relative mt-6 overflow-hidden rounded-[28px] border border-dashed p-8 transition duration-300",
              isDragging
                ? "border-indigo-400/60 bg-indigo-500/10 shadow-[0_0_0_1px_rgba(129,140,248,0.4)]"
                : "border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.03] hover:border-indigo-400/30 hover:bg-white/[0.06]"
            ].join(" ")}
          >
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-purple-600/10 opacity-80" />

            <div className="relative flex flex-col items-center justify-center gap-6 py-8 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-[24px] border border-indigo-400/20 bg-gradient-to-br from-indigo-500/15 to-purple-600/20 text-indigo-100 shadow-[0_18px_40px_rgba(99,102,241,0.18)] transition duration-300 group-hover:scale-[1.03]">
                <UploadCloud className="h-10 w-10" />
              </div>

              <div>
                <h3 className="text-2xl font-semibold text-white">
                  Drop documents to create processing jobs
                </h3>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-appTextMuted">
                  Drag and drop one or more files here or browse from disk. The API responds
                  immediately with job ids while workers continue processing in the background.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 text-xs uppercase tracking-[0.22em] text-appTextMuted">
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
                  Max 25 MB
                </span>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
                  Local storage
                </span>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
                  Live progress
                </span>
              </div>

              <input
                ref={inputRef}
                id="document-upload"
                type="file"
                multiple
                className="hidden"
                accept=".pdf,.txt,.doc,.docx,.md,.png,.jpg,.jpeg"
                onChange={(event) => handleFileSelection(event.target.files)}
              />
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/[0.06] text-appTextMuted">
                    <FileText className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-appText">
                      {selectedFileCount
                        ? `${selectedFileCount} document${selectedFileCount === 1 ? "" : "s"} selected`
                        : "No document selected yet"}
                    </p>
                    <p className="text-sm text-appTextMuted">
                      {selectedFileCount
                        ? `${formatBytes(selectedTotalSize)} ready for queue handoff`
                        : "Accepted types: pdf, txt, doc, docx, md, png, jpg, jpeg"}
                    </p>
                  </div>
                </div>
                {selectedFileCount ? <StatusBadge status="queued" /> : null}
              </div>
              {selectedFileCount ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {selectedFiles.slice(0, 4).map((file) => (
                    <span
                      key={`${file.name}-${file.size}-${file.lastModified}`}
                      className="max-w-full truncate rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-appTextMuted"
                    >
                      {file.name}
                    </span>
                  ))}
                  {selectedFileCount > 4 ? (
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-appTextMuted">
                      +{selectedFileCount - 4} more
                    </span>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                variant="secondary"
                className="min-w-[150px]"
                onClick={() => inputRef.current?.click()}
              >
                Browse files
              </Button>
              <Button
                className="min-w-[180px]"
                disabled={!selectedFileCount || isSubmitting}
                onClick={() => {
                  if (!selectedFileCount) return;
                  mutation.mutate(selectedFiles);
                }}
              >
                {isSubmitting ? (
                  <>
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    Queuing
                  </>
                ) : (
                  <>
                    Upload and enqueue
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>

          {mutation.error ? (
            <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {mutation.error.message}
            </div>
          ) : null}
        </SurfaceCard>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              label: "API handoff",
              value: "202 Accepted",
              body: "Uploads return immediately after the document row and job record are created."
            },
            {
              label: "Worker depth",
              value: "Celery queued",
              body: "Heavy parsing and extraction stays off the request thread."
            },
            {
              label: "Client feedback",
              value: "Realtime stream",
              body: "Progress events arrive over WebSockets instead of polling the UI to death."
            }
          ].map((item) => (
            <SurfaceCard key={item.label} className="p-5">
              <p className="text-[11px] font-medium uppercase tracking-[0.26em] text-appTextMuted">
                {item.label}
              </p>
              <p className="mt-4 text-lg font-semibold text-white">{item.value}</p>
              <p className="mt-2 text-sm leading-6 text-appTextMuted">{item.body}</p>
            </SurfaceCard>
          ))}
        </div>
      </div>

      <aside className="space-y-6">
        <SurfaceCard className="p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.26em] text-appTextMuted">
                Recent jobs
              </p>
              <h3 className="mt-2 text-lg font-semibold text-white">Latest queue activity</h3>
            </div>
            <Link href="/dashboard" className="text-sm text-indigo-200 transition hover:text-white">
              View all
            </Link>
          </div>

          <div className="mt-5 space-y-3">
            {recentDocumentsQuery.isLoading
              ? Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-20 rounded-2xl" />
                ))
              : null}

            {!recentDocumentsQuery.isLoading && !recentDocuments.length ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-5 text-sm text-appTextMuted">
                Queue activity will appear here after the first upload is created.
              </div>
            ) : null}

            {recentDocuments.map((document) => (
              <Link
                key={document.id}
                href={
                  document.latest_job
                    ? `/jobs/${document.latest_job.id}?documentId=${document.id}`
                    : `/documents/${document.id}`
                }
                className="group block rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition duration-300 hover:border-white/20 hover:bg-white/[0.06]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">{document.filename}</p>
                    <p className="mt-1 truncate text-xs text-appTextMuted">{document.file_path}</p>
                  </div>
                  <StatusBadge status={document.latest_job?.status ?? document.status} />
                </div>

                <div className="mt-4">
                  <div className="h-2 rounded-full bg-white/[0.08]">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-500"
                      style={{ width: `${document.latest_job?.progress ?? 0}%` }}
                    />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-appTextMuted">
                    <span>{document.latest_job?.progress ?? 0}% complete</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock3 className="h-3.5 w-3.5" />
                      Attempt {document.latest_job?.attempt_number ?? 1}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </SurfaceCard>

        <SurfaceCard className="p-5">
          <p className="text-[11px] font-medium uppercase tracking-[0.26em] text-appTextMuted">
            Pipeline stages
          </p>
          <div className="mt-5 space-y-4">
            <PipelineStep
              title="Queued"
              description="API validates the upload, stores the file, and creates a job."
              tone="indigo"
            />
            <PipelineStep
              title="Processing"
              description="Workers emit parsing and extraction events while the browser stays live."
              tone="violet"
            />
            <PipelineStep
              title="Completed"
              description="Structured data becomes review-ready and exportable from the detail view."
              tone="green"
            />
          </div>
        </SurfaceCard>
      </aside>
    </section>
  );
}

function PipelineStep({
  title,
  description,
  tone
}: {
  title: string;
  description: string;
  tone: "indigo" | "violet" | "green";
}) {
  const styles = {
    indigo: "border-indigo-400/20 bg-indigo-500/10 text-indigo-200",
    violet: "border-purple-400/20 bg-purple-500/10 text-purple-200",
    green: "border-emerald-400/20 bg-emerald-500/10 text-emerald-200"
  };

  return (
    <div className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <span
        className={[
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border",
          styles[tone]
        ].join(" ")}
      >
        <CheckCircle2 className="h-4 w-4" />
      </span>
      <div>
        <p className="text-sm font-medium text-white">{title}</p>
        <p className="mt-1 text-sm leading-6 text-appTextMuted">{description}</p>
      </div>
    </div>
  );
}
