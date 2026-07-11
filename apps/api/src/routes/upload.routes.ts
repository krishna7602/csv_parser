import { Router, type Router as RouterType } from "express";
import { uploadMiddleware } from "../middleware/upload.middleware.js";
import { uploadController } from "../controllers/upload.controller.js";

export const uploadRouter: RouterType = Router();

/**
 * POST /api/csv/upload
 * Accepts a CSV file via multipart/form-data, field: "file"
 */
uploadRouter.post("/upload", uploadMiddleware, uploadController);
