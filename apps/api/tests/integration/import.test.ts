import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import { jobRepository } from "../../src/repositories/in-memory-job.repository.js";
import * as importJobService from "../../src/services/import-job.service.js";

// Mock the entire import-job service so we control async behavior
vi.mock("../../src/services/import-job.service.js");

const VALID_CSV = Buffer.from(
  `Full Name,Email Address,Phone\nJohn Doe,john@example.com,9876543210`
);

async function uploadCsv(): Promise<string> {
  const res = await request(app)
    .post("/api/csv/upload")
    .attach("file", VALID_CSV, { filename: "test.csv", contentType: "text/csv" });
  return res.body.uploadId as string;
}

describe("POST /api/csv/:uploadId/import", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 404 for unknown uploadId", async () => {
    const res = await request(app).post("/api/csv/up_nonexistent/import");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("UPLOAD_NOT_FOUND");
  });

  it("starts the job and returns 202 for valid uploadId", async () => {
    vi.mocked(importJobService.runImportJob).mockResolvedValue(undefined);

    const uploadId = await uploadCsv();
    const res = await request(app).post(`/api/csv/${uploadId}/import`);

    expect(res.status).toBe(202);
    expect(res.body.uploadId).toBe(uploadId);
    expect(res.body.status).toBe("processing");
  });

  it("calls runImportJob exactly once", async () => {
    vi.mocked(importJobService.runImportJob).mockResolvedValue(undefined);

    const uploadId = await uploadCsv();
    await request(app).post(`/api/csv/${uploadId}/import`);

    expect(importJobService.runImportJob).toHaveBeenCalledTimes(1);
  });
});

describe("GET /api/csv/:uploadId/status", () => {
  it("returns 404 for unknown uploadId", async () => {
    const res = await request(app).get("/api/csv/up_nonexistent/status");
    expect(res.status).toBe(404);
  });

  it("returns processing status after import starts", async () => {
    vi.mocked(importJobService.runImportJob).mockResolvedValue(undefined);

    const uploadId = await uploadCsv();
    await request(app).post(`/api/csv/${uploadId}/import`);

    const res = await request(app).get(`/api/csv/${uploadId}/status`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("processing");
    expect(res.body.progress).toBeDefined();
  });

  it("returns result when job is done", async () => {
    const uploadId = await uploadCsv();

    // Simulate a completed job
    const mockResult = {
      uploadId,
      totalRows: 1,
      totalImported: 1,
      totalSkipped: 0,
      records: [],
      skipped: [],
      batches: { total: 1, succeeded: 1, failed: 0, retried: 0 },
    };
    await jobRepository.setResult(uploadId, mockResult);

    const res = await request(app).get(`/api/csv/${uploadId}/status`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("done");
    expect(res.body.result).toBeDefined();
    expect(res.body.result.uploadId).toBe(uploadId);
  });
});
