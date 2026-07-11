import multer from "multer";
import type { RequestHandler } from "express";
import { env } from "../config/env.js";

const ALLOWED_MIMETYPES = ["text/csv", "application/vnd.ms-excel", "text/plain"];

const multerInstance = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.MAX_UPLOAD_MB * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    const isValidMime = ALLOWED_MIMETYPES.includes(file.mimetype);
    const isValidExt = file.originalname.toLowerCase().endsWith(".csv");

    if (!isValidMime && !isValidExt) {
      cb(new Error("INVALID_FILE_TYPE: Only CSV files are accepted"));
      return;
    }
    cb(null, true);
  },
});

/** Multer config: memory storage, 5MB limit, CSV mimetype/extension filter */
export const uploadMiddleware: RequestHandler = multerInstance.single("file") as RequestHandler;
