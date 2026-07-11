"use client";

import { useState, useCallback } from "react";
import { MAX_FILE_SIZE_BYTES } from "@/lib/constants";

export interface FileValidationError {
  type: "SIZE" | "TYPE" | "EMPTY";
  message: string;
}

export function useFileValidation() {
  const [error, setError] = useState<FileValidationError | null>(null);

  const validate = useCallback((file: File): boolean => {
    setError(null);

    if (file.size === 0) {
      setError({ type: "EMPTY", message: "The file is empty." });
      return false;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      const mb = (file.size / (1024 * 1024)).toFixed(1);
      setError({
        type: "SIZE",
        message: `File is ${mb}MB — maximum allowed size is 5MB.`,
      });
      return false;
    }

    const isCSV =
      file.name.toLowerCase().endsWith(".csv") ||
      file.type === "text/csv" ||
      file.type === "application/vnd.ms-excel";

    if (!isCSV) {
      setError({
        type: "TYPE",
        message: "Only CSV files are accepted (.csv extension).",
      });
      return false;
    }

    return true;
  }, []);

  return { validate, validationError: error, clearError: () => setError(null) };
}
