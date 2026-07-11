import type { CrmRecord, RawRecord, SkippedRecord } from "@groweasy/shared";
import { ALLOWED_CRM_STATUS, ALLOWED_DATA_SOURCE } from "@groweasy/shared";
import { AiCrmRecordSchema } from "../ai/schema/crm-record.schema.js";
import { logger } from "../utils/logger.js";

export interface ValidationResult {
  imported: CrmRecord[];
  skipped: SkippedRecord[];
}

/**
 * Validates AI output for a single batch:
 * 1. Zod schema validation per record
 * 2. Enum whitelist enforcement (defense-in-depth)
 * 3. Skip rule: no email AND no mobile → skipped
 *
 * @param aiRecords - Raw parsed AI output (unknown[])
 * @param rawRows - Original CSV rows for this batch (for SkippedRecord.raw)
 * @param batchStartIndex - Absolute row index of first item in this batch
 */
export function validateBatch(
  aiRecords: unknown[],
  rawRows: RawRecord[],
  batchStartIndex: number
): ValidationResult {
  const imported: CrmRecord[] = [];
  const skipped: SkippedRecord[] = [];

  const count = Math.max(aiRecords.length, rawRows.length);

  for (let i = 0; i < count; i++) {
    const absoluteIndex = batchStartIndex + i;
    const raw = rawRows[i] ?? {};
    const aiRecord = aiRecords[i];

    // 1. Schema validation
    const parseResult = AiCrmRecordSchema.safeParse(aiRecord);
    if (!parseResult.success) {
      const reason = `AI output failed schema validation: ${parseResult.error.message.slice(0, 200)}`;
      logger.warn("record-validator: schema validation failed", {
        rowIndex: absoluteIndex,
        reason,
      });
      skipped.push({ rowIndex: absoluteIndex, raw, reason });
      continue;
    }

    const record = parseResult.data;

    // 2. Enum whitelist enforcement (defense-in-depth beyond zod .catch())
    const safeCrmStatus =
      record.crm_status !== null &&
      ALLOWED_CRM_STATUS.includes(record.crm_status as typeof ALLOWED_CRM_STATUS[number])
        ? record.crm_status
        : null;

    const safeDataSource =
      record.data_source !== null &&
      record.data_source !== "" &&
      ALLOWED_DATA_SOURCE.includes(record.data_source as typeof ALLOWED_DATA_SOURCE[number])
        ? record.data_source
        : (record.data_source === "" ? "" : "");

    const sanitized: CrmRecord = {
      ...record,
      crm_status: safeCrmStatus as CrmRecord["crm_status"],
      data_source: safeDataSource as CrmRecord["data_source"],
      // Sanitize crm_note: no raw newlines
      crm_note: record.crm_note
        ? record.crm_note.replace(/\r?\n/g, " ").trim() || null
        : null,
      // Sanitize description: no raw newlines
      description: record.description
        ? record.description.replace(/\r?\n/g, " ").trim() || null
        : null,
    };

    // 3. Skip rule: must have at least email OR mobile
    const hasEmail = !!sanitized.email?.trim();
    const hasMobile = !!sanitized.mobile_without_country_code?.trim();

    if (!hasEmail && !hasMobile) {
      skipped.push({
        rowIndex: absoluteIndex,
        raw,
        reason: "No email or mobile number found",
      });
      continue;
    }

    imported.push(sanitized);
  }

  return { imported, skipped };
}
