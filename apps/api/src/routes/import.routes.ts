import { Router, type Router as RouterType } from "express";
import {
  startImportController,
  getImportStatusController,
} from "../controllers/import.controller.js";

export const importRouter: RouterType = Router();

/**
 * POST /api/csv/:uploadId/import
 * Starts async AI extraction for a previously uploaded CSV.
 */
importRouter.post("/:uploadId/import", startImportController);

/**
 * GET /api/csv/:uploadId/status
 * Poll for job status, progress, and final result.
 */
importRouter.get("/:uploadId/status", getImportStatusController);
