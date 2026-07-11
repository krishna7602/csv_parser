import type { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";
import { parseCsvBuffer } from "../services/csv-parser.service.js";
import { jobRepository } from "../repositories/in-memory-job.repository.js";
import { PREVIEW_ROW_LIMIT } from "@groweasy/shared";
import { logger } from "../utils/logger.js";

/**
 * POST /api/csv/upload
 * Validates + parses the uploaded CSV, stores raw rows, returns preview.
 * No AI calls here.
 */
export async function uploadController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.file) {
      res.status(400).json({
        error: { code: "NO_FILE", message: "No file was uploaded. Use multipart/form-data with field 'file'" },
      });
      return;
    }

    if (req.file.size === 0) {
      res.status(400).json({
        error: { code: "EMPTY_FILE", message: "The uploaded file is empty" },
      });
      return;
    }

    // Parse CSV (throws on error — caught by error handler)
    const { headers, rows } = parseCsvBuffer(req.file.buffer);

    // Generate upload ID and persist
    const uploadId = `up_${uuidv4().replace(/-/g, "").slice(0, 12)}`;
    await jobRepository.create(uploadId, headers, rows);

    const preview = rows.slice(0, PREVIEW_ROW_LIMIT);

    logger.info("upload: CSV accepted", {
      uploadId,
      rowCount: rows.length,
      columnCount: headers.length,
    });

    res.status(200).json({
      uploadId,
      headers,
      rowCount: rows.length,
      preview,
    });
  } catch (err) {
    next(err);
  }
}
