import type { RawRecord, ImportResult, JobStatus } from "@groweasy/shared";

/** Stored job state in the repository */
export interface ImportJob {
  uploadId: string;
  headers: string[];
  rows: RawRecord[];
  status: JobStatus;
  progress: {
    completedBatches: number;
    totalBatches: number;
  };
  result?: ImportResult;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

/** Repository interface — swap with Postgres/Mongo without touching business logic */
export interface IJobRepository {
  create(uploadId: string, headers: string[], rows: RawRecord[]): Promise<ImportJob>;
  findById(uploadId: string): Promise<ImportJob | null>;
  updateStatus(uploadId: string, status: JobStatus, error?: string): Promise<void>;
  updateProgress(uploadId: string, completedBatches: number, totalBatches: number): Promise<void>;
  setResult(uploadId: string, result: ImportResult): Promise<void>;
}
