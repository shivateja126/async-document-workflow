export const queryKeys = {
  documents: ["documents"] as const,
  document: (documentId: string) => ["document", documentId] as const,
  job: (jobId: string) => ["job", jobId] as const
};
