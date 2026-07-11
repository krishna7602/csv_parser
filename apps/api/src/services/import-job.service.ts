import type { ImportResult } from "@groweasy/shared";
import type { ILLMClient } from "../ai/ai-client.interface.js";
import type { IJobRepository } from "../repositories/job-repository.interface.js";
import { extractAllBatches } from "./ai-extraction.service.js";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

/**
 * Orchestrates the full import job lifecycle:
 * 1. Fetches job from repository
 * 2. Runs AI extraction with progress updates
 * 3. Persists final ImportResult
 *
 * Designed to be called asynchronously (fire-and-forget from controller).
 */
export async function runImportJob(
  uploadId: string,
  repository: IJobRepository,
  llmClient: ILLMClient
): Promise<void> {
  const job = await repository.findById(uploadId);
  if (!job) {
    logger.error("import-job: job not found", { uploadId });
    return;
  }

  logger.info("import-job: starting", {
    uploadId,
    rowCount: job.rows.length,
  });

  try {
    const result = await extractAllBatches(
      job.rows,
      job.headers,
      llmClient,
      {
        batchSize: env.BATCH_SIZE,
        concurrency: env.BATCH_CONCURRENCY,
        onBatchComplete: async (completed, total) => {
          await repository.updateProgress(uploadId, completed, total);
        },
      }
    );

    const importResult: ImportResult = {
      uploadId,
      totalRows: job.rows.length,
      totalImported: result.records.length,
      totalSkipped: result.skipped.length,
      records: result.records,
      skipped: result.skipped,
      batches: result.batchStats,
    };

    await repository.setResult(uploadId, importResult);

    logger.info("import-job: completed", {
      uploadId,
      totalImported: importResult.totalImported,
      totalSkipped: importResult.totalSkipped,
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    logger.error("import-job: fatal error", { uploadId, error: errorMsg });
    await repository.updateStatus(uploadId, "failed", errorMsg);
  }
}
