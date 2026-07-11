"use client";

import { useCallback, useRef, useState } from "react";
import { apiClient, ApiError } from "@/lib/api-client";
import type { ImportResult } from "@groweasy/shared";
import { POLL_INTERVAL_MS } from "@/lib/constants";

export type ImportPhase = "idle" | "starting" | "polling" | "done" | "error";

export interface ImportProgress {
  completedBatches: number;
  totalBatches: number;
}

export interface UseImportLeadsReturn {
  phase: ImportPhase;
  progress: ImportProgress;
  result: ImportResult | null;
  error: string | null;
  startImport: (uploadId: string) => Promise<void>;
  reset: () => void;
}

export function useImportLeads(): UseImportLeadsReturn {
  const [phase, setPhase] = useState<ImportPhase>("idle");
  const [progress, setProgress] = useState<ImportProgress>({ completedBatches: 0, totalBatches: 0 });
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const pollStatus = useCallback(
    async (uploadId: string) => {
      try {
        const status = await apiClient.getImportStatus(uploadId);
        setProgress(status.progress);

        if (status.status === "done" && status.result) {
          stopPolling();
          setResult(status.result);
          setPhase("done");
        } else if (status.status === "failed") {
          stopPolling();
          setError(status.error ?? "Import failed");
          setPhase("error");
        }
      } catch (err) {
        stopPolling();
        const msg = err instanceof ApiError ? err.message : "Failed to check import status";
        setError(msg);
        setPhase("error");
      }
    },
    [stopPolling]
  );

  const startImport = useCallback(
    async (uploadId: string) => {
      setPhase("starting");
      setError(null);
      setResult(null);
      setProgress({ completedBatches: 0, totalBatches: 0 });

      try {
        await apiClient.startImport(uploadId);
        setPhase("polling");

        // Start polling every 2s
        pollTimerRef.current = setInterval(() => {
          pollStatus(uploadId);
        }, POLL_INTERVAL_MS);

        // Also poll immediately
        await pollStatus(uploadId);
      } catch (err) {
        const msg = err instanceof ApiError ? err.message : "Failed to start import";
        setError(msg);
        setPhase("error");
      }
    },
    [pollStatus]
  );

  const reset = useCallback(() => {
    stopPolling();
    setPhase("idle");
    setProgress({ completedBatches: 0, totalBatches: 0 });
    setResult(null);
    setError(null);
  }, [stopPolling]);

  return { phase, progress, result, error, startImport, reset };
}
