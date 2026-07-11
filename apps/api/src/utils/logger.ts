import { env } from "../config/env.js";

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  [key: string]: unknown;
}

function formatLog(level: LogLevel, message: string, context?: LogContext): string {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(context && { context }),
  };
  return JSON.stringify(entry);
}

/**
 * Structured logger — never log PII (emails, phone numbers, names).
 * Use batchIndex, rowCount, duration, etc. for operational context.
 */
export const logger = {
  debug(message: string, context?: LogContext) {
    if (env.NODE_ENV === "development") {
      console.debug(formatLog("debug", message, context));
    }
  },
  info(message: string, context?: LogContext) {
    console.info(formatLog("info", message, context));
  },
  warn(message: string, context?: LogContext) {
    console.warn(formatLog("warn", message, context));
  },
  error(message: string, context?: LogContext) {
    console.error(formatLog("error", message, context));
  },
};
