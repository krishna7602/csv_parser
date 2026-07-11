import express, { type Express } from "express";
import cors from "cors";
import { requestLoggerMiddleware } from "./middleware/request-logger.middleware.js";
import { errorHandlerMiddleware } from "./middleware/error-handler.middleware.js";
import { uploadRouter } from "./routes/upload.routes.js";
import { importRouter } from "./routes/import.routes.js";
import { env } from "./config/env.js";

export const app: Express = express();

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(requestLoggerMiddleware);

// ─── Health Check ──────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── API Routes ────────────────────────────────────────────────────────────────
app.use("/api/csv", uploadRouter);
app.use("/api/csv", importRouter);

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    error: { code: "NOT_FOUND", message: "Route not found" },
  });
});

// ─── Error Handler (must be last) ─────────────────────────────────────────────
app.use(errorHandlerMiddleware);
