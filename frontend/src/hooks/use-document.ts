"use client";

import { useQuery } from "@tanstack/react-query";
import { getDocument } from "@/services/api";
import { queryKeys } from "@/services/query-client";

export function useDocument(documentId: string) {
  return useQuery({
    queryKey: queryKeys.document(documentId),
    queryFn: () => getDocument(documentId),
    enabled: Boolean(documentId)
  });
}
