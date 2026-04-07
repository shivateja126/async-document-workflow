"use client";

import { useQuery } from "@tanstack/react-query";
import { getDocuments } from "@/services/api";
import { DocumentListParams } from "@/services/types";
import { queryKeys } from "@/services/query-client";

export function useDocuments(params: DocumentListParams) {
  return useQuery({
    queryKey: [...queryKeys.documents, params],
    queryFn: () => getDocuments(params)
  });
}
