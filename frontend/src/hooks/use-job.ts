"use client";

import { useQuery } from "@tanstack/react-query";
import { getJob } from "@/services/api";
import { queryKeys } from "@/services/query-client";

export function useJob(jobId: string) {
  return useQuery({
    queryKey: queryKeys.job(jobId),
    queryFn: () => getJob(jobId),
    enabled: Boolean(jobId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "completed" || status === "failed" ? false : 3_000;
    }
  });
}
