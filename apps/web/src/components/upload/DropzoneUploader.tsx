"use client";

import { useRef, useState } from "react";
import { useFileValidation } from "@/hooks/useFileValidation";
import { ErrorBanner } from "@/components/shared/ErrorBanner";
import { MAX_FILE_SIZE_BYTES } from "@/lib/constants";

interface DropzoneUploaderProps {
  onFile: (file: File) => void;
  disabled?: boolean;
}

export function DropzoneUploader({ onFile, disabled }: DropzoneUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { validate, validationError, clearError } = useFileValidation();

  function handleFile(file: File) {
    clearError();
    if (validate(file)) {
      onFile(file);
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled) return;
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // reset input so same file can be re-selected
    e.target.value = "";
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Drop Zone */}
      <div
        id="dropzone-area"
        className={`dropzone${isDragOver ? " drag-over" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={onDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        style={{
          padding: "56px 32px",
          textAlign: "center",
          opacity: disabled ? 0.5 : 1,
          cursor: disabled ? "not-allowed" : "pointer",
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          style={{ display: "none" }}
          onChange={onInputChange}
          disabled={disabled}
          id="csv-file-input"
          aria-label="Upload CSV file"
        />

        {/* Upload icon */}
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: isDragOver
              ? "linear-gradient(135deg, rgba(99,102,241,0.3), rgba(139,92,246,0.3))"
              : "rgba(99,102,241,0.1)",
            border: "1px solid rgba(99,102,241,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
            fontSize: "2rem",
            transition: "all 0.2s ease",
          }}
        >
          {isDragOver ? "⬇️" : "📄"}
        </div>

        <h3
          style={{
            fontSize: "1.125rem",
            fontWeight: 700,
            marginBottom: 8,
            color: isDragOver ? "#a5b4fc" : "#f1f5f9",
          }}
        >
          {isDragOver ? "Drop your CSV here" : "Drag & drop your CSV file"}
        </h3>
        <p style={{ color: "#64748b", fontSize: "0.875rem", marginBottom: 16 }}>
          or click to browse your files
        </p>

        {/* Constraints */}
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          {["CSV files only", "Max 5MB", "Any column order"].map((tag) => (
            <span key={tag} className="badge badge-purple">{tag}</span>
          ))}
        </div>
      </div>

      {/* Validation Error */}
      {validationError && (
        <ErrorBanner
          message={validationError.message}
          onRetry={clearError}
          retryLabel="Dismiss"
        />
      )}

      {/* Supported formats hint */}
      <div
        style={{
          background: "rgba(28,28,38,0.6)",
          border: "1px solid rgba(42,42,58,0.6)",
          borderRadius: 12,
          padding: "14px 18px",
        }}
      >
        <div style={{ fontSize: "0.8125rem", color: "#64748b", marginBottom: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Works with any CSV format
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["Facebook Lead Ads", "Google Ads", "Real estate CRM", "Manual spreadsheets", "Sales reports"].map((fmt) => (
            <span
              key={fmt}
              style={{
                fontSize: "0.8125rem",
                color: "#94a3b8",
                background: "rgba(42,42,58,0.5)",
                padding: "3px 10px",
                borderRadius: 6,
              }}
            >
              {fmt}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
