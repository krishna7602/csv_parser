import { parse } from "csv-parse/sync";
import type { RawRecord } from "@groweasy/shared";
import { logger } from "../utils/logger.js";

export interface ParsedCsv {
  headers: string[];
  rows: RawRecord[];
}

/**
 * Parses a CSV buffer into headers + typed raw records.
 * Uses csv-parse in sync mode since files are already in memory (≤5MB).
 */
export function parseCsvBuffer(buffer: Buffer): ParsedCsv {
  let records: RawRecord[];

  try {
    records = parse(buffer, {
      columns: true,          // use first row as headers
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,   // tolerate ragged rows
      cast: false,                // keep everything as strings
    }) as RawRecord[];
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`CSV parse error: ${msg}`);
  }

  if (records.length === 0) {
    throw new Error("CSV is empty or has only a header row");
  }

  // Extract header names from the first record's keys
  const headers = Object.keys(records[0] ?? {});

  logger.info("csv-parser: parsed CSV", {
    rowCount: records.length,
    columnCount: headers.length,
  });

  return { headers, rows: records };
}
