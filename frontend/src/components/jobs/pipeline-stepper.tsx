"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Circle, Clock3, LoaderCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate, titleCase } from "@/services/format";
import { JobStatus, ProgressEvent, ProgressEventType } from "@/services/types";

export type PipelineStageMeta = {
  stage: ProgressEventType;
  label: string;
  description: string;
  progress: number;
};

export const PIPELINE_STAGES: PipelineStageMeta[] = [
  {
    stage: "job_received",
    label: "Job received",
    description: "Worker accepted the queue payload.",
    progress: 2
  },
  {
    stage: "job_queued",
    label: "Job queued",
    description: "Job record is waiting in the async queue.",
    progress: 5
  },
  {
    stage: "job_started",
    label: "Job started",
    description: "Celery started the processing run.",
    progress: 9
  },
  {
    stage: "document_validation_started",
    label: "Validation started",
    description: "Checking metadata, type, size, and storage.",
    progress: 14
  },
  {
    stage: "document_validation_completed",
    label: "Validation completed",
    description: "The uploaded document passed validation.",
    progress: 22
  },
  {
    stage: "parsing_started",
    label: "Parsing started",
    description: "Breaking the document into readable sections.",
    progress: 30
  },
  {
    stage: "parsing_completed",
    label: "Parsing completed",
    description: "Normalized text blocks are ready.",
    progress: 45
  },
  {
    stage: "extraction_started",
    label: "Extraction started",
    description: "Extracting title, summary, category, and keywords.",
    progress: 55
  },
  {
    stage: "extraction_completed",
    label: "Extraction completed",
    description: "Structured fields are ready for normalization.",
    progress: 70
  },
  {
    stage: "post_processing_started",
    label: "Post-processing started",
    description: "Cleaning fields and preparing review output.",
    progress: 78
  },
  {
    stage: "post_processing_completed",
    label: "Post-processing completed",
    description: "Review-ready record is normalized.",
    progress: 86
  },
  {
    stage: "saving_results",
    label: "Saving results",
    description: "Persisting extracted data and audit metadata.",
    progress: 92
  },
  {
    stage: "job_completed",
    label: "Job completed",
    description: "The document is ready for review and export.",
    progress: 100
  },
  {
    stage: "job_failed",
    label: "Job failed",
    description: "Terminal failure state for retryable jobs.",
    progress: 100
  }
];

type StepState = "completed" | "current" | "failed" | "pending";

type PipelineStepperProps = {
  currentStage: ProgressEventType;
  events: ProgressEvent[];
  progress: number;
  status: JobStatus;
};

export function PipelineStepper({
  currentStage,
  events,
  progress,
  status
}: PipelineStepperProps) {
  const eventByStage = new Map<ProgressEventType, ProgressEvent>();
  for (const event of events) {
    if (!eventByStage.has(event.stage)) {
      eventByStage.set(event.stage, event);
    }
  }

  return (
    <div className="space-y-3">
      {PIPELINE_STAGES.map((stage, index) => {
        const state = getStepState(stage, currentStage, progress, status);
        const event = eventByStage.get(stage.stage);

        return (
          <motion.div
            key={stage.stage}
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: index * 0.025, duration: 0.25, ease: "easeOut" }}
            className="grid grid-cols-[44px,1fr] gap-4"
          >
            <div className="relative flex justify-center">
              {index < PIPELINE_STAGES.length - 1 ? (
                <span
                  className={cn(
                    "absolute top-11 h-[calc(100%+0.75rem)] w-px",
                    state === "completed" ? "bg-emerald-400/35" : "bg-white/10"
                  )}
                />
              ) : null}
              <StepNode state={state} />
            </div>

            <div
              className={cn(
                "rounded-2xl border p-4 transition duration-300",
                state === "completed" &&
                  "border-emerald-400/20 bg-emerald-400/[0.06] shadow-[0_12px_42px_rgba(34,197,94,0.08)]",
                state === "current" &&
                  "border-indigo-300/40 bg-indigo-500/[0.12] shadow-[0_18px_60px_rgba(99,102,241,0.18)]",
                state === "failed" &&
                  "border-red-400/35 bg-red-500/[0.12] shadow-[0_18px_60px_rgba(239,68,68,0.12)]",
                state === "pending" && "border-white/10 bg-white/[0.025] opacity-55"
              )}
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p
                    className={cn(
                      "text-sm font-semibold",
                      state === "completed" && "text-emerald-100",
                      state === "current" && "text-white",
                      state === "failed" && "text-red-100",
                      state === "pending" && "text-appTextMuted"
                    )}
                  >
                    {stage.label}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-appTextMuted">{stage.description}</p>
                  {event ? (
                    <p className="mt-3 text-sm leading-6 text-appText">{event.message}</p>
                  ) : null}
                </div>

                <div className="flex shrink-0 items-center gap-3 text-xs text-appTextMuted">
                  <span>{stage.progress}%</span>
                  {event ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Clock3 className="h-3.5 w-3.5" />
                      {formatDate(event.timestamp)}
                    </span>
                  ) : (
                    <span>{titleCase(state)}</span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

export function getStageLabel(stage: ProgressEventType): string {
  return PIPELINE_STAGES.find((item) => item.stage === stage)?.label ?? titleCase(stage);
}

function getStepState(
  stage: PipelineStageMeta,
  currentStage: ProgressEventType,
  progress: number,
  status: JobStatus
): StepState {
  if (stage.stage === "job_failed") {
    return status === "failed" || currentStage === "job_failed" ? "failed" : "pending";
  }

  if (status === "completed") {
    return "completed";
  }

  if (status === "failed") {
    if (stage.stage === currentStage) return "current";
    return progress >= stage.progress ? "completed" : "pending";
  }

  if (stage.stage === currentStage) {
    return "current";
  }

  return progress >= stage.progress ? "completed" : "pending";
}

function StepNode({ state }: { state: StepState }) {
  if (state === "completed") {
    return (
      <span className="relative z-10 flex h-10 w-10 items-center justify-center rounded-2xl border border-emerald-300/30 bg-emerald-400/15 text-emerald-200 shadow-[0_0_24px_rgba(34,197,94,0.18)]">
        <CheckCircle2 className="h-5 w-5" />
      </span>
    );
  }

  if (state === "current") {
    return (
      <span className="relative z-10 flex h-10 w-10 items-center justify-center rounded-2xl border border-indigo-300/40 bg-indigo-500/20 text-indigo-100 shadow-[0_0_28px_rgba(99,102,241,0.35)]">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-2xl bg-indigo-400/25" />
        <LoaderCircle className="relative h-5 w-5 animate-spin" />
      </span>
    );
  }

  if (state === "failed") {
    return (
      <span className="relative z-10 flex h-10 w-10 items-center justify-center rounded-2xl border border-red-300/35 bg-red-500/15 text-red-100 shadow-[0_0_28px_rgba(239,68,68,0.22)]">
        <XCircle className="h-5 w-5" />
      </span>
    );
  }

  return (
    <span className="relative z-10 flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.035] text-appTextMuted">
      <Circle className="h-4 w-4" />
    </span>
  );
}

