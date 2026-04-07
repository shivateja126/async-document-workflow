import {
  BatchUploadResponse,
  DocumentDetail,
  DocumentDeleteResponse,
  DocumentListParams,
  DocumentSummary,
  ExportFormat,
  FinalizeDocumentResponse,
  Job,
  PaginatedResponse,
  RetryJobResponse,
  ReviewPayload,
  UploadResponse
} from "./types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "http://localhost:8000";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly details?: unknown
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...(init?.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(init?.headers ?? {})
    },
    cache: "no-store"
  });

  if (!response.ok) {
    const payload = (await safeJsonParse(response)) as {
      error?: { code?: string; message?: string; details?: unknown };
    } | null;
    throw new ApiError(
      payload?.error?.message ?? "Request failed.",
      payload?.error?.code,
      payload?.error?.details
    );
  }

  return (await response.json()) as T;
}

async function safeJsonParse(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return null;
  }
  return response.json();
}

export async function uploadDocument(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);
  return request<UploadResponse>("/documents/upload", {
    method: "POST",
    body: formData
  });
}

export async function uploadDocuments(files: File[]): Promise<BatchUploadResponse> {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  return request<BatchUploadResponse>("/documents/upload-batch", {
    method: "POST",
    body: formData
  });
}

export async function getDocuments(
  params: DocumentListParams
): Promise<PaginatedResponse<DocumentSummary>> {
  const searchParams = new URLSearchParams();
  searchParams.set("page", String(params.page ?? 1));
  searchParams.set("page_size", String(params.pageSize ?? 10));
  if (params.search) searchParams.set("search", params.search);
  if (params.status && params.status !== "all") searchParams.set("status", params.status);
  if (params.sortBy) searchParams.set("sort_by", params.sortBy);
  if (params.sortOrder) searchParams.set("sort_order", params.sortOrder);

  const raw = await request<{
    items: DocumentSummary[];
    meta: {
      page: number;
      page_size: number;
      total_items: number;
      total_pages: number;
    };
  }>(`/documents?${searchParams.toString()}`);

  return {
    items: raw.items,
    meta: {
      page: raw.meta.page,
      pageSize: raw.meta.page_size,
      totalItems: raw.meta.total_items,
      totalPages: raw.meta.total_pages
    }
  };
}

export async function getDocument(documentId: string): Promise<DocumentDetail> {
  return request<DocumentDetail>(`/documents/${documentId}`);
}

export async function deleteDocument(documentId: string): Promise<DocumentDeleteResponse> {
  return request<DocumentDeleteResponse>(`/documents/${documentId}`, {
    method: "DELETE"
  });
}

export async function getJob(jobId: string): Promise<Job> {
  return request<Job>(`/jobs/${jobId}`);
}

export async function retryJob(jobId: string): Promise<RetryJobResponse> {
  return request<RetryJobResponse>(`/jobs/${jobId}/retry`, {
    method: "POST"
  });
}

export async function reviewDocument(
  documentId: string,
  payload: ReviewPayload
): Promise<DocumentDetail> {
  return request<DocumentDetail>(`/documents/${documentId}/review`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export async function finalizeDocument(
  documentId: string
): Promise<FinalizeDocumentResponse> {
  return request<FinalizeDocumentResponse>(`/documents/${documentId}/finalize`, {
    method: "POST"
  });
}

export function buildExportUrl(documentId: string, format: ExportFormat): string {
  const searchParams = new URLSearchParams({ format });
  return `${API_BASE_URL}/documents/${documentId}/export?${searchParams.toString()}`;
}

export function getWebSocketBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_WS_BASE_URL) {
    return process.env.NEXT_PUBLIC_WS_BASE_URL.replace(/\/$/, "");
  }
  return API_BASE_URL.replace(/^http/, "ws");
}
