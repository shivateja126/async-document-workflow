"use client";

import { useMutation } from "@tanstack/react-query";
import { ArrowRight, CheckCircle2, Clock3, LoaderCircle, RadioTower, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { getStageLabel, PipelineStepper } from "@/components/jobs/pipeline-stepper";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button, buttonClassName } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SurfaceCard } from "@/components/ui/surface-card";
import { useJob } from "@/hooks/use-job";
import { useJobProgress } from "@/hooks/use-job-progress";
import { ApiError, retryJob } from "@/services/api";
import { formatDate, titleCase } from "@/services/format";
import { ProgressEvent, RetryJobResponse } from "@/services/types";

export function JobProgressView({ jobId }: { jobId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isRouting, startTransition] = useTransition();
  const documentId = searchParams.get("documentId");

  const jobQuery = useJob(jobId);
  const { connectionState, events, latestEvent, latestStage, progress, status } = useJobProgress(
    jobId,
    jobQuery.data
  );
  const toast = usePipelineToast(latestEvent);
  const estimatedCompletion = getEstimatedCompletion(latestEvent, status);

  const retryMutation = useMutation<RetryJobResponse, ApiError, string>({
    mutationFn: retryJob,
    onSuccess: (response) => {
      startTransition(() => {
        const target = documentId
          ? `/jobs/${response.retry_job.id}?documentId=${documentId}`
          : `/jobs/${response.retry_job.id}`;
        router.replace(target);
      });
    }
  });

  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="space-y-6">
        {toast ? <PipelineToast toast={toast} /> : null}

        <SurfaceCard glow className="overflow-hidden p-6 sm:p-8">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-300/40 to-transparent" />
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-indigo-200/90">
                Live progress
              </p>
              <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-white">
                Job {jobId.slice(0, 8)} is {getStageLabel(latestStage)}.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-appTextMuted">
                Redis Pub/Sub events stream through FastAPI into this WebSocket channel while the
                Celery worker advances a detailed 14-stage document pipeline.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge status={status} />
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs font-medium text-appTextMuted">
                <span className="relative flex h-2.5 w-2.5">
                  {connectionState === "open" ? (
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/60" />
                  ) : null}
                  <span
                    className={[
                      "relative inline-flex h-2.5 w-2.5 rounded-full",
                      connectionState === "open" ? "bg-emerald-400" : "bg-amber-400"
                    ].join(" ")}
                  />
                </span>
                Socket {titleCase(connectionState)}
              </span>
            </div>
          </div>

          <div className="mt-8 rounded-[28px] border border-white/10 bg-[#0B1224]/90 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.26em] text-appTextMuted">
                  Current backend stage
                </p>
                <p className="mt-3 font-display text-6xl font-semibold tracking-tight text-white">
                  {progress}%
                </p>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-appTextMuted">
                  {latestEvent?.message ?? "Waiting for the worker to publish the next progress event."}
                </p>
              </div>
              <div className="flex flex-col items-start gap-3 md:items-end">
                <span className="inline-flex rounded-full border border-indigo-300/20 bg-indigo-500/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-100">
                  {getStageLabel(latestStage)}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-appTextMuted">
                  <Clock3 className="h-3.5 w-3.5" />
                  {estimatedCompletion}
                </span>
                {documentId ? (
                  <Link
                    href={`/documents/${documentId}`}
                    className={buttonClassName({ variant: "secondary" })}
                  >
                    Open document detail
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : null}
              </div>
            </div>

            <div className="mt-6 h-3 overflow-hidden rounded-full bg-white/[0.08]">
              <div
                className="h-3 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 shadow-[0_0_28px_rgba(99,102,241,0.45)] transition-all duration-700"
                style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
              />
            </div>
          </div>
        </SurfaceCard>

        <SurfaceCard className="p-5 sm:p-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-5">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.26em] text-appTextMuted">
                Pipeline stepper
              </p>
              <h3 className="mt-2 text-xl font-semibold text-white">Real-time worker stages</h3>
            </div>
            <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100">
              Backend owned
            </span>
          </div>

          <div className="mt-6">
            <PipelineStepper
              currentStage={latestStage}
              events={events}
              progress={progress}
              status={status}
            />
          </div>
        </SurfaceCard>

        <SurfaceCard className="p-5 sm:p-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-5">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.26em] text-appTextMuted">
                Event timeline
              </p>
              <h3 className="mt-2 text-xl font-semibold text-white">Worker progress feed</h3>
            </div>
            <RadioTower className="h-5 w-5 text-indigo-200" />
          </div>

          <div className="mt-5 space-y-3">
            {!events.length && jobQuery.isLoading
              ? Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} className="h-24 rounded-2xl" />
                ))
              : null}

            {!events.length && !jobQuery.isLoading ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-6 text-sm text-appTextMuted">
                Waiting for the next worker event. The snapshot will update as soon as Redis
                publishes a progress message.
              </div>
            ) : null}

            {events.map((event) => (
              <div
                key={`${event.stage}-${event.timestamp}`}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition duration-300 hover:border-white/20 hover:bg-white/[0.06]"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-indigo-200">
                      {titleCase(event.stage)} · {event.progress_percentage}%
                    </p>
                    <p className="mt-2 text-sm leading-6 text-appText">{event.message}</p>
                  </div>
                  <div className="inline-flex items-center gap-2 text-xs text-appTextMuted">
                    <Clock3 className="h-3.5 w-3.5" />
                    {formatDate(event.timestamp)}
                  </div>
                </div>
                {event.error_message ? (
                  <p className="mt-3 rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                    {event.error_message}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </SurfaceCard>
      </div>

      <aside className="space-y-6">
        <SurfaceCard className="p-5">
          <p className="text-[11px] font-medium uppercase tracking-[0.26em] text-appTextMuted">
            Operational notes
          </p>
          <div className="mt-5 space-y-4">
            {[
              "Jobs are created in the API, executed in Celery, and reported back through Redis.",
              "Failures remain retryable without repeating heavy work inside the request path.",
              "Completed documents can be reviewed, finalized, and exported from the detail page."
            ].map((note) => (
              <div key={note} className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                <p className="text-sm leading-6 text-appTextMuted">{note}</p>
              </div>
            ))}
          </div>
        </SurfaceCard>

        {status === "failed" ? (
          <SurfaceCard className="border-red-400/20 bg-red-500/10 p-5">
            <p className="text-sm font-semibold text-red-100">This job failed during processing.</p>
            <p className="mt-2 text-sm leading-6 text-red-100/70">
              Queue a retry to create a fresh auditable attempt for the same document.
            </p>
            <Button
              type="button"
              onClick={() => retryMutation.mutate(jobId)}
              disabled={retryMutation.isPending || isRouting}
              className="mt-4 w-full"
            >
              {retryMutation.isPending || isRouting ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Queueing retry
                </>
              ) : (
                <>
                  <RotateCcw className="h-4 w-4" />
                  Retry job
                </>
              )}
            </Button>
            {retryMutation.error ? (
              <p className="mt-3 text-sm text-red-100">{retryMutation.error.message}</p>
            ) : null}
          </SurfaceCard>
        ) : null}
      </aside>
    </section>
  );
}

type PipelineToastState = {
  tone: "success" | "error";
  title: string;
  message: string;
};

function usePipelineToast(latestEvent?: ProgressEvent): PipelineToastState | null {
  const [toast, setToast] = useState<PipelineToastState | null>(null);
  const lastToastKey = useRef<string | null>(null);

  useEffect(() => {
    if (!latestEvent || !["job_completed", "job_failed"].includes(latestEvent.stage)) {
      return;
    }

    const toastKey = `${latestEvent.stage}-${latestEvent.timestamp}`;
    if (lastToastKey.current === toastKey) return;
    lastToastKey.current = toastKey;

    setToast(
      latestEvent.stage === "job_completed"
        ? {
            tone: "success",
            title: "Pipeline completed",
            message: "The document is ready for review and export."
          }
        : {
            tone: "error",
            title: "Pipeline failed",
            message: latestEvent.error_message ?? "The job failed during processing."
          }
    );

    const timer = window.setTimeout(() => setToast(null), 4200);
    return () => window.clearTimeout(timer);
  }, [latestEvent]);

  return toast;
}

function PipelineToast({ toast }: { toast: PipelineToastState }) {
  return (
    <div
      className={[
        "fixed right-6 top-6 z-50 w-[min(360px,calc(100vw-3rem))] rounded-2xl border p-4 shadow-[0_24px_90px_rgba(0,0,0,0.35)] backdrop-blur-xl animate-in fade-in slide-in-from-top-2",
        toast.tone === "success"
          ? "border-emerald-300/30 bg-emerald-500/15 text-emerald-50"
          : "border-red-300/30 bg-red-500/15 text-red-50"
      ].join(" ")}
    >
      <p className="text-sm font-semibold">{toast.title}</p>
      <p className="mt-1 text-sm leading-6 opacity-80">{toast.message}</p>
    </div>
  );
}

function getEstimatedCompletion(latestEvent: ProgressEvent | undefined, status: string): string {
  if (status === "completed") return "Completed";
  if (status === "failed") return "Stopped";

  const remainingSeconds = Number(latestEvent?.metadata?.estimated_remaining_seconds);
  if (!Number.isFinite(remainingSeconds)) {
    return "Estimating completion";
  }
  if (remainingSeconds <= 0) {
    return "Finishing now";
  }
  return `About ${Math.ceil(remainingSeconds)}s remaining`;
}
