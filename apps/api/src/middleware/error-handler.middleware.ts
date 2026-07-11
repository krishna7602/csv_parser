import type { Request, Response, NextFunction } from "express";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

/**
 * Central error handler — converts thrown errors into { error: { code, message } }.
 * Never leaks stack traces in production.
 */
export function errorHandlerMiddleware(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const isDev = env.NODE_ENV === "development";

  // Multer file size error
  if (err.message?.includes("File too large") || err.code === "LIMIT_FILE_SIZE") {
    res.status(413).json({
      error: {
        code: "FILE_TOO_LARGE",
        message: `File exceeds the ${env.MAX_UPLOAD_MB}MB size limit`,
      },
    });
    return;
  }

  // Multer mimetype/extension error
  if (err.message?.startsWith("INVALID_FILE_TYPE")) {
    res.status(400).json({
      error: {
        code: "INVALID_FILE_TYPE",
        message: "Only CSV files are accepted (.csv extension, text/csv MIME type)",
      },
    });
    return;
  }

  // CSV parse errors
  if (err.message?.startsWith("CSV parse error")) {
    res.status(422).json({
      error: {
        code: "UNPARSEABLE_CSV",
        message: isDev ? err.message : "The uploaded file could not be parsed as CSV",
      },
    });
    return;
  }

  // Empty CSV
  if (err.message?.includes("empty")) {
    res.status(400).json({
      error: {
        code: "EMPTY_CSV",
        message: err.message,
      },
    });
    return;
  }

  const statusCode = err.statusCode ?? 500;
  const code = err.code ?? "INTERNAL_ERROR";

  logger.error("Unhandled error", {
    code,
    message: err.message,
    stack: isDev ? err.stack : undefined,
  });

  res.status(statusCode).json({
    error: {
      code,
      message: isDev ? err.message : "An unexpected error occurred",
    },
  });
}
