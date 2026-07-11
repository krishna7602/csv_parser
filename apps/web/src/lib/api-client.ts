const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      ...init?.headers,
    },
  });

  if (!res.ok) {
    let errorData: { error?: { code?: string; message?: string } } = {};
    try {
      errorData = await res.json();
    } catch {
      // ignore parse errors
    }
    const code = errorData?.error?.code ?? "UNKNOWN_ERROR";
    const message = errorData?.error?.message ?? `HTTP ${res.status}`;
    throw new ApiError(message, code, res.status);
  }

  return res.json() as Promise<T>;
}

export const apiClient = {
  /**
   * Upload a CSV file
   */
  uploadCsv(file: File) {
    const form = new FormData();
    form.append("file", file);
    return request<{
      uploadId: string;
      headers: string[];
      rowCount: number;
      preview: Record<string, string>[];
    }>("/api/csv/upload", { method: "POST", body: form });
  },

  /**
   * Start AI import for a previously uploaded CSV
   */
  startImport(uploadId: string) {
    return request<{ uploadId: string; status: string; message: string }>(
      `/api/csv/${uploadId}/import`,
      { method: "POST" }
    );
  },

  /**
   * Poll import status
   */
  getImportStatus(uploadId: string) {
    return request<{
      uploadId: string;
      status: "processing" | "done" | "failed";
      progress: { completedBatches: number; totalBatches: number };
      result?: import("@groweasy/shared").ImportResult;
      error?: string;
    }>(`/api/csv/${uploadId}/status`);
  },
};
