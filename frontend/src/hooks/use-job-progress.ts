"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { getWebSocketBaseUrl } from "@/services/api";
import { queryKeys } from "@/services/query-client";
import { Job, ProgressEvent } from "@/services/types";

type ConnectionState = "connecting" | "open" | "closed" | "error";

export function useJobProgress(jobId: string, currentJob?: Job) {
  const queryClient = useQueryClient();
  const [events, setEvents] = useState<ProgressEvent[]>([]);
  const [connectionState, setConnectionState] = useState<ConnectionState>("connecting");

  useEffect(() => {
    if (!jobId) return;

    const socket = new WebSocket(`${getWebSocketBaseUrl()}/ws/progress/${jobId}`);

    socket.onopen = () => setConnectionState("open");
    socket.onclose = () => setConnectionState("closed");
    socket.onerror = () => setConnectionState("error");
    socket.onmessage = (message) => {
      const payload = JSON.parse(message.data as string) as ProgressEvent;

      setEvents((previous) => {
        const deduped = previous.filter(
          (entry) =>
            !(
              entry.stage === payload.stage &&
              entry.progress_percentage === payload.progress_percentage &&
              entry.timestamp === payload.timestamp
            )
        );
        return [payload, ...deduped].slice(0, 24);
      });

      queryClient.setQueryData<Job | undefined>(queryKeys.job(jobId), (current) => {
        if (!current) return current;
        return {
          ...current,
          status: payload.status,
          progress: payload.progress_percentage,
          error_message: payload.error_message
        };
      });

      if (payload.stage === "job_completed" || payload.stage === "job_failed") {
        void queryClient.invalidateQueries({ queryKey: queryKeys.documents });
        void queryClient.invalidateQueries({ queryKey: queryKeys.job(jobId) });
        void queryClient.invalidateQueries({
          predicate: (query) =>
            Array.isArray(query.queryKey) && String(query.queryKey[0]) === "document"
        });
      }
    };

    return () => {
      socket.close();
    };
  }, [jobId, queryClient]);

  const latestEvent = useMemo(() => events[0], [events]);
  const effectiveProgress = latestEvent?.progress_percentage ?? currentJob?.progress ?? 0;
  const effectiveStatus = latestEvent?.status ?? currentJob?.status ?? "queued";
  const effectiveStage = latestEvent?.stage ?? "job_queued";

  return {
    connectionState,
    events,
    latestStage: effectiveStage,
    latestEvent,
    progress: effectiveProgress,
    status: effectiveStatus
  };
}
