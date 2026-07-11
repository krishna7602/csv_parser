import pLimit from "p-limit";
import type { CrmRecord, RawRecord, SkippedRecord } from "@groweasy/shared";
import type { ILLMClient } from "../ai/ai-client.interface.js";
import { chunkIntoBatches, getBatchStartIndex } from "./batching.service.js";
import { validateBatch } from "./record-validator.service.js";
import { retry } from "../utils/retry.js";
import { logger } from "../utils/logger.js";

export interface ExtractionResult {
  records: CrmRecord[];
  skipped: SkippedRecord[];
  batchStats: {
    total: number;
    succeeded: number;
    failed: number;
    retried: number;
  };
}

export interface ExtractionOptions {
  batchSize: number;
  concurrency: number;
  onBatchComplete?: (completedBatches: number, totalBatches: number) => void;
}

/**
 * Orchestrates AI extraction across all batches with:
 * - Bounded concurrency (p-limit)
 * - Per-batch exponential-backoff retry (max 3 attempts)
 * - Graceful degradation: failed batches → skipped records
 */
export async function extractAllBatches(
  rows: RawRecord[],
  headers: string[],
  llmClient: ILLMClient,
  options: ExtractionOptions
): Promise<ExtractionResult> {
  const { batchSize, concurrency, onBatchComplete } = options;

  const batches = chunkIntoBatches(rows, batchSize);
  const totalBatches = batches.length;
  const limit = pLimit(concurrency);

  const allRecords: CrmRecord[] = [];
  const allSkipped: SkippedRecord[] = [];
  let succeeded = 0;
  let failed = 0;
  let retried = 0;
  let completedBatches = 0;

  logger.info("ai-extraction: starting extraction", {
    totalRows: rows.length,
    totalBatches,
    batchSize,
    concurrency,
  });

  const batchTasks = batches.map((batchRows, batchIndex) =>
    limit(async () => {
      const startIndex = getBatchStartIndex(batchIndex, batchSize);
      let attemptCount = 0;

      try {
        const aiRecords = await retry(
          async () => {
            attemptCount++;
            return llmClient.extractBatch(batchRows, headers);
          },
          {
            attempts: 3,
            backoffMs: [500, 1500, 4000],
            onRetry: (attempt) => {
              retried++;
              logger.warn("ai-extraction: retrying batch", {
                batchIndex,
                attempt,
                rowCount: batchRows.length,
              });
            },
          },
          `batch-${batchIndex}`
        );

        const { imported, skipped } = validateBatch(aiRecords, batchRows, startIndex);
        allRecords.push(...imported);
        allSkipped.push(...skipped);
        succeeded++;

        logger.info("ai-extraction: batch succeeded", {
          batchIndex,
          imported: imported.length,
          skipped: skipped.length,
          attempts: attemptCount,
        });
      } catch (err) {
        // All retry attempts exhausted — move entire batch to skipped
        failed++;
        const reason = "AI extraction failed after retries";
        for (let i = 0; i < batchRows.length; i++) {
          allSkipped.push({
            rowIndex: startIndex + i,
            raw: batchRows[i]!,
            reason,
          });
        }

        logger.error("ai-extraction: batch permanently failed", {
          batchIndex,
          rowCount: batchRows.length,
          error: err instanceof Error ? err.message : String(err),
        });
      } finally {
        completedBatches++;
        onBatchComplete?.(completedBatches, totalBatches);
      }
    })
  );

  await Promise.all(batchTasks);

  logger.info("ai-extraction: extraction complete", {
    totalRows: rows.length,
    totalImported: allRecords.length,
    totalSkipped: allSkipped.length,
    batches: { total: totalBatches, succeeded, failed, retried },
  });

  return {
    records: allRecords,
    skipped: allSkipped,
    batchStats: { total: totalBatches, succeeded, failed, retried },
  };
}
