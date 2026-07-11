import { describe, it, expect } from "vitest";
import { validateBatch } from "../../src/services/record-validator.service.js";

const validAiRecord = {
  created_at: "2026-05-13",
  name: "John Doe",
  email: "john@example.com",
  country_code: "+91",
  mobile_without_country_code: "9876543210",
  company: "Acme Corp",
  city: "Mumbai",
  state: "Maharashtra",
  country: "India",
  lead_owner: null,
  crm_status: "GOOD_LEAD_FOLLOW_UP",
  crm_note: "Interested in demo",
  data_source: "meridian_tower",
  possession_time: null,
  description: null,
};

const rawRow = { Name: "John Doe", Email: "john@example.com" };

describe("validateBatch", () => {
  it("imports valid records with email and mobile", () => {
    const { imported, skipped } = validateBatch(
      [validAiRecord],
      [rawRow],
      0
    );
    expect(imported).toHaveLength(1);
    expect(skipped).toHaveLength(0);
    expect(imported[0]?.email).toBe("john@example.com");
  });

  it("skips records with neither email nor mobile", () => {
    const noContact = {
      ...validAiRecord,
      email: null,
      mobile_without_country_code: null,
    };
    const { imported, skipped } = validateBatch([noContact], [rawRow], 0);
    expect(imported).toHaveLength(0);
    expect(skipped).toHaveLength(1);
    expect(skipped[0]?.reason).toBe("No email or mobile number found");
  });

  it("accepts records with email but no mobile", () => {
    const emailOnly = { ...validAiRecord, mobile_without_country_code: null };
    const { imported } = validateBatch([emailOnly], [rawRow], 0);
    expect(imported).toHaveLength(1);
  });

  it("accepts records with mobile but no email", () => {
    const mobileOnly = { ...validAiRecord, email: null };
    const { imported } = validateBatch([mobileOnly], [rawRow], 0);
    expect(imported).toHaveLength(1);
  });

  it("coerces invalid crm_status to null", () => {
    const invalidStatus = { ...validAiRecord, crm_status: "INVALID_STATUS" };
    const { imported } = validateBatch([invalidStatus], [rawRow], 0);
    expect(imported[0]?.crm_status).toBeNull();
  });

  it("coerces invalid data_source to empty string", () => {
    const invalidSource = { ...validAiRecord, data_source: "UNKNOWN_SOURCE" };
    const { imported } = validateBatch([invalidSource], [rawRow], 0);
    expect(imported[0]?.data_source).toBe("");
  });

  it("skips records that fail schema validation", () => {
    const invalid = "not an object";
    const { imported, skipped } = validateBatch([invalid], [rawRow], 0);
    expect(imported).toHaveLength(0);
    expect(skipped[0]?.reason).toContain("schema validation");
  });

  it("sanitizes raw newlines from crm_note", () => {
    const withNewlines = { ...validAiRecord, crm_note: "Line1\nLine2\r\nLine3" };
    const { imported } = validateBatch([withNewlines], [rawRow], 0);
    expect(imported[0]?.crm_note).not.toMatch(/\n/);
  });

  it("assigns correct absolute row index when batchStartIndex > 0", () => {
    const noContact = { ...validAiRecord, email: null, mobile_without_country_code: null };
    const { skipped } = validateBatch([noContact], [rawRow], 40);
    expect(skipped[0]?.rowIndex).toBe(40);
  });
});
