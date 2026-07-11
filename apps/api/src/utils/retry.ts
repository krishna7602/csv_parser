import { logger } from "./logger.js";

export interface RetryOptions {
  attempts: number;
  backoffMs: number[];
  onRetry?: (attempt: number, error: unknown) => void;
}

const DEFAULT_OPTIONS: RetryOptions = {
  attempts: 3,
  backoffMs: [500, 1500, 4000],
};

/**
 * Generic exponential-backoff retry helper.
 * If fn throws after all attempts, the last error is re-thrown.
 *
 * @param fn - Async function to retry
 * @param options - Retry configuration
 * @param context - Optional context label for logging (e.g. "batch-3")
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {},
  context = "operation"
): Promise<T> {
  const opts: RetryOptions = { ...DEFAULT_OPTIONS, ...options };

  let lastError: unknown;

  for (let attempt = 1; attempt <= opts.attempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const isLastAttempt = attempt === opts.attempts;

      if (isLastAttempt) {
        logger.error(`${context}: failed after ${opts.attempts} attempts`, {
          attempt,
          error: err instanceof Error ? err.message : String(err),
        });
        break;
      }

      const waitMs = opts.backoffMs[attempt - 1] ?? opts.backoffMs.at(-1) ?? 1000;
      logger.warn(`${context}: attempt ${attempt} failed, retrying in ${waitMs}ms`, {
        attempt,
        nextAttempt: attempt + 1,
        waitMs,
        error: err instanceof Error ? err.message : String(err),
      });

      opts.onRetry?.(attempt, err);
      await sleep(waitMs);
    }
  }

  throw lastError;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
