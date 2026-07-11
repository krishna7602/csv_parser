import type { CrmStatus, DataSource } from "./types.js";

/** All valid CRM status enum values */
export const ALLOWED_CRM_STATUS: CrmStatus[] = [
  "GOOD_LEAD_FOLLOW_UP",
  "DID_NOT_CONNECT",
  "BAD_LEAD",
  "SALE_DONE",
];

/** All valid data source enum values */
export const ALLOWED_DATA_SOURCE: DataSource[] = [
  "leads_on_demand",
  "meridian_tower",
  "eden_park",
  "varah_swamy",
  "sarjapur_plots",
];

/** All CRM target field names (mirrors CrmRecord keys) */
export const CRM_FIELDS = [
  "created_at",
  "name",
  "email",
  "country_code",
  "mobile_without_country_code",
  "company",
  "city",
  "state",
  "country",
  "lead_owner",
  "crm_status",
  "crm_note",
  "data_source",
  "possession_time",
  "description",
] as const;

export type CrmField = (typeof CRM_FIELDS)[number];

/** Max file size in bytes (default 5MB) */
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

/** Accepted MIME types */
export const ACCEPTED_MIME_TYPES = ["text/csv", "application/vnd.ms-excel"];

/** Default batch size for AI extraction */
export const DEFAULT_BATCH_SIZE = 20;

/** Default concurrency cap for AI batch requests */
export const DEFAULT_BATCH_CONCURRENCY = 3;

/** Max preview rows to return from upload endpoint */
export const PREVIEW_ROW_LIMIT = 25;
