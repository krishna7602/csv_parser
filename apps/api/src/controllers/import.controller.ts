import type { Request, Response, NextFunction } from "express";
import { jobRepository } from "../repositories/in-memory-job.repository.js";
import { runImportJob } from "../services/import-job.service.js";
import { AnthropicClient } from "../ai/anthropic-client.js";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

/** Singleton LLM client — created once at startup */
const llmClient = new AnthropicClient(env.ANTHROPIC_API_KEY);

/**
 * POST /api/csv/:uploadId/import
 * Starts async AI extraction job. Returns immediately with processing status.
 * Frontend polls GET /status for completion.
 */
export async function startImportController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { uploadId } = req.params as { uploadId: string };

    const job = await jobRepository.findById(uploadId);
    if (!job) {
      res.status(404).json({
        error: { code: "UPLOAD_NOT_FOUND", message: `No upload found for ID: ${uploadId}` },
      });
      return;
    }

    // Idempotency: if already done, return result immediately
    if (job.status === "done" && job.result) {
      res.status(200).json(job.result);
      return;
    }

    // If already processing, return current status
    if (job.status === "processing" && job.progress.totalBatches > 0) {
      res.status(202).json({
        uploadId,
        status: "processing",
        message: "Import already in progress",
      });
      return;
    }

    // Mark as processing and kick off async job
    await jobRepository.updateStatus(uploadId, "processing");

    // Fire-and-forget — don't await
    runImportJob(uploadId, jobRepository, llmClient).catch((err) => {
      logger.error("startImport: background job error", {
        uploadId,
        error: err instanceof Error ? err.message : String(err),
      });
    });

    logger.info("import: job started", { uploadId, rowCount: job.rows.length });

    res.status(202).json({
      uploadId,
      status: "processing",
      message: `Import started for ${job.rows.length} rows`,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/csv/:uploadId/status
 * Returns current job status, progress, and result when done.
 */
export async function getImportStatusController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { uploadId } = req.params as { uploadId: string };

    const job = await jobRepository.findById(uploadId);
    if (!job) {
      res.status(404).json({
        error: { code: "UPLOAD_NOT_FOUND", message: `No upload found for ID: ${uploadId}` },
      });
      return;
    }

    const response: Record<string, unknown> = {
      uploadId,
      status: job.status,
      progress: job.progress,
    };

    if (job.status === "done" && job.result) {
      response.result = job.result;
    }

    if (job.status === "failed" && job.error) {
      response.error = job.error;
    }

    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
}
