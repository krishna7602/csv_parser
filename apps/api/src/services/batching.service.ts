import type { RawRecord } from "@groweasy/shared";

/**
 * Splits an array of raw records into fixed-size batches.
 *
 * @param rows - All raw records from the CSV
 * @param batchSize - Number of rows per batch (default 20)
 * @returns Array of batches (last batch may be smaller)
 */
export function chunkIntoBatches(
  rows: RawRecord[],
  batchSize: number
): RawRecord[][] {
  if (batchSize < 1) throw new Error("batchSize must be >= 1");
  if (rows.length === 0) return [];

  const batches: RawRecord[][] = [];
  for (let i = 0; i < rows.length; i += batchSize) {
    batches.push(rows.slice(i, i + batchSize));
  }
  return batches;
}

/**
 * Returns the starting row index for a batch.
 * Useful for correlating batch rows back to original row indices.
 */
export function getBatchStartIndex(batchIndex: number, batchSize: number): number {
  return batchIndex * batchSize;
}
