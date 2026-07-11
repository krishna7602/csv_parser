// ─── Core Types ────────────────────────────────────────────────────────────────

/** One raw CSV row: original headers → string values, untouched */
export type RawRecord = Record<string, string>;

/** Allowed CRM status values — closed enum */
export type CrmStatus =
  | "GOOD_LEAD_FOLLOW_UP"
  | "DID_NOT_CONNECT"
  | "BAD_LEAD"
  | "SALE_DONE";

/** Allowed data source values — closed enum */
export type DataSource =
  | "leads_on_demand"
  | "meridian_tower"
  | "eden_park"
  | "varah_swamy"
  | "sarjapur_plots";

/** A fully mapped GrowEasy CRM record */
export interface CrmRecord {
  created_at: string | null;
  name: string | null;
  email: string | null;
  country_code: string | null;
  mobile_without_country_code: string | null;
  company: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  lead_owner: string | null;
  crm_status: CrmStatus | null;
  crm_note: string | null;
  data_source: DataSource | "" | null;
  possession_time: string | null;
  description: string | null;
}

/** A CSV row that was skipped during import, with the reason */
export interface SkippedRecord {
  rowIndex: number;
  raw: RawRecord;
  reason: string;
}

/** The final result returned after a completed import job */
export interface ImportResult {
  uploadId: string;
  totalRows: number;
  totalImported: number;
  totalSkipped: number;
  records: CrmRecord[];
  skipped: SkippedRecord[];
  batches: {
    total: number;
    succeeded: number;
    failed: number;
    retried: number;
  };
}

// ─── API Response Shapes ───────────────────────────────────────────────────────

/** Response from POST /api/csv/upload */
export interface UploadResponse {
  uploadId: string;
  headers: string[];
  rowCount: number;
  preview: RawRecord[];
}

/** Job status values */
export type JobStatus = "processing" | "done" | "failed";

/** Response from POST /api/csv/:uploadId/import */
export interface ImportStartResponse {
  uploadId: string;
  status: JobStatus;
  message: string;
}

/** Response from GET /api/csv/:uploadId/status */
export interface ImportStatusResponse {
  uploadId: string;
  status: JobStatus;
  progress: {
    completedBatches: number;
    totalBatches: number;
  };
  result?: ImportResult;
  error?: string;
}

/** Shared API error shape */
export interface ApiError {
  error: {
    code: string;
    message: string;
  };
}
