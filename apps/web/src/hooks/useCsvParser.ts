"use client";

import { useState, useCallback } from "react";
import Papa from "papaparse";

export interface ParsedCsv {
  headers: string[];
  rows: Record<string, string>[];
  rowCount: number;
}

export function useCsvParser() {
  const [parsed, setParsed] = useState<ParsedCsv | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  const parseFile = useCallback((file: File): Promise<ParsedCsv> => {
    return new Promise((resolve, reject) => {
      setParsing(true);
      setParseError(null);

      Papa.parse<Record<string, string>>(file, {
        header: true,
        skipEmptyLines: true,
        transform: (value: string) => value.trim(),
        complete: (result) => {
          setParsing(false);
          if (result.errors.length > 0 && result.data.length === 0) {
            const msg = result.errors[0]?.message ?? "Failed to parse CSV";
            setParseError(msg);
            reject(new Error(msg));
            return;
          }
          const headers = result.meta.fields ?? [];
          const rows = result.data;
          const data: ParsedCsv = { headers, rows, rowCount: rows.length };
          setParsed(data);
          resolve(data);
        },
        error: (err) => {
          setParsing(false);
          setParseError(err.message);
          reject(err);
        },
      });
    });
  }, []);

  const reset = useCallback(() => {
    setParsed(null);
    setParseError(null);
  }, []);

  return { parseFile, parsed, parsing, parseError, reset };
}
