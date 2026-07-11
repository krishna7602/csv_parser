import type { RawRecord, ImportResult, JobStatus } from "@groweasy/shared";
import type { IJobRepository, ImportJob } from "./job-repository.interface.js";

/**
 * In-memory implementation of IJobRepository.
 * Suitable for single-process deployments and testing.
 * Swap for a database-backed implementation to add persistence.
 */
export class InMemoryJobRepository implements IJobRepository {
  private readonly store = new Map<string, ImportJob>();

  async create(
    uploadId: string,
    headers: string[],
    rows: RawRecord[]
  ): Promise<ImportJob> {
    const job: ImportJob = {
      uploadId,
      headers,
      rows,
      status: "processing",
      progress: { completedBatches: 0, totalBatches: 0 },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.store.set(uploadId, job);
    return job;
  }

  async findById(uploadId: string): Promise<ImportJob | null> {
    return this.store.get(uploadId) ?? null;
  }

  async updateStatus(
    uploadId: string,
    status: JobStatus,
    error?: string
  ): Promise<void> {
    const job = this.store.get(uploadId);
    if (!job) throw new Error(`Job not found: ${uploadId}`);
    job.status = status;
    if (error !== undefined) job.error = error;
    job.updatedAt = new Date();
  }

  async updateProgress(
    uploadId: string,
    completedBatches: number,
    totalBatches: number
  ): Promise<void> {
    const job = this.store.get(uploadId);
    if (!job) throw new Error(`Job not found: ${uploadId}`);
    job.progress = { completedBatches, totalBatches };
    job.updatedAt = new Date();
  }

  async setResult(uploadId: string, result: ImportResult): Promise<void> {
    const job = this.store.get(uploadId);
    if (!job) throw new Error(`Job not found: ${uploadId}`);
    job.result = result;
    job.status = "done";
    job.updatedAt = new Date();
  }
}

/** Singleton instance — shared across the application */
export const jobRepository = new InMemoryJobRepository();
