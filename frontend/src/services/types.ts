export type DocumentStatus = "queued" | "processing" | "completed" | "failed";
export type JobStatus = DocumentStatus;
export type ProgressEventType =
  | "job_received"
  | "job_queued"
  | "job_started"
  | "document_validation_started"
  | "document_validation_completed"
  | "parsing_started"
  | "parsing_completed"
  | "extraction_started"
  | "extraction_completed"
  | "post_processing_started"
  | "post_processing_completed"
  | "saving_results"
  | "job_completed"
  | "job_failed";
export type ExportFormat = "json" | "csv";

export type PaginationMeta = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export type PaginatedResponse<T> = {
  items: T[];
  meta: PaginationMeta;
};

export type Job = {
  id: string;
  document_id: string;
  status: JobStatus;
  progress: number;
  error_message: string | null;
  celery_task_id: string;
  attempt_number: number;
  created_at: string;
  updated_at: string;
  started_at: string | null;
  completed_at: string | null;
};

export type ExtractedData = {
  id: string;
  document_id: string;
  title: string;
  category: string;
  summary: string;
  keywords: string[];
  finalized: boolean;
  created_at: string;
  updated_at: string;
};

export type DocumentSummary = {
  id: string;
  filename: string;
  file_path: string;
  status: DocumentStatus;
  content_type: string | null;
  size_bytes: number;
  created_at: string;
  updated_at: string;
  latest_job: Job | null;
  extracted_data: ExtractedData | null;
};

export type DocumentDetail = DocumentSummary & {
  jobs: Job[];
};

export type UploadResponse = {
  document_id: string;
  job_id: string;
  status: DocumentStatus;
};

export type BatchUploadResponse = {
  items: UploadResponse[];
};

export type DocumentDeleteResponse = {
  document_id: string;
  filename: string;
  deleted: boolean;
};

export type RetryJobResponse = {
  original_job_id: string;
  retry_job: Job;
};

export type FinalizeDocumentResponse = {
  document: DocumentDetail;
  finalized: boolean;
};

export type ProgressEvent = {
  job_id: string;
  document_id: string;
  stage: ProgressEventType;
  progress_percentage: number;
  timestamp: string;
  event_type: ProgressEventType;
  status: JobStatus;
  progress: number;
  message: string;
  occurred_at: string;
  error_message: string | null;
  metadata: Record<string, unknown>;
};

export type DocumentListParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: DocumentStatus | "all";
  sortBy?: "updated_at" | "created_at" | "filename" | "status";
  sortOrder?: "asc" | "desc";
};

export type ReviewPayload = {
  title?: string;
  category?: string;
  summary?: string;
  keywords?: string[];
};

export type ApiErrorPayload = {
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
};
