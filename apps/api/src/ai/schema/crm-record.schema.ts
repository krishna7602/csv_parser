import { z } from "zod";
import { ALLOWED_CRM_STATUS, ALLOWED_DATA_SOURCE } from "@groweasy/shared";

/**
 * Zod schema for a single CRM record returned by the AI.
 * Mirrors the prompt's TARGET SCHEMA exactly.
 * Used for validation + coercion of AI output.
 */
export const AiCrmRecordSchema = z.object({
  created_at: z.string().nullable(),
  name: z.string().nullable(),
  email: z.string().nullable(),
  country_code: z.string().nullable(),
  mobile_without_country_code: z.string().nullable(),
  company: z.string().nullable(),
  city: z.string().nullable(),
  state: z.string().nullable(),
  country: z.string().nullable(),
  lead_owner: z.string().nullable(),
  crm_status: z
    .enum(ALLOWED_CRM_STATUS as [string, ...string[]])
    .nullable()
    .catch(null), // coerce invalid values to null (defense-in-depth)
  crm_note: z.string().nullable(),
  data_source: z
    .union([
      z.enum(ALLOWED_DATA_SOURCE as [string, ...string[]]),
      z.literal(""),
    ])
    .nullable()
    .catch(""), // coerce invalid values to "" (defense-in-depth)
  possession_time: z.string().nullable(),
  description: z.string().nullable(),
});

export type AiCrmRecord = z.infer<typeof AiCrmRecordSchema>;

/** Schema for the full AI response (array of records) */
export const AiResponseSchema = z.array(AiCrmRecordSchema);
