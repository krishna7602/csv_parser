"use client";

import type { SkippedRecord } from "@groweasy/shared";

interface SkippedRecordsTableProps {
  skipped: SkippedRecord[];
}

// Reason color codes
function ReasonBadge({ reason }: { reason: string }) {
  const isNoContact = reason.includes("email or mobile");
  const isAiFail = reason.includes("AI extraction");
  const isSchemaFail = reason.includes("schema validation");

  const style = isNoContact
    ? { bg: "rgba(245,158,11,0.12)", color: "#fcd34d" }
    : isAiFail
    ? { bg: "rgba(239,68,68,0.12)", color: "#fca5a5" }
    : isSchemaFail
    ? { bg: "rgba(139,92,246,0.12)", color: "#c4b5fd" }
    : { bg: "rgba(100,116,139,0.12)", color: "#94a3b8" };

  return (
    <span
      style={{
        padding: "3px 10px",
        borderRadius: 12,
        fontSize: "0.75rem",
        fontWeight: 600,
        background: style.bg,
        color: style.color,
        whiteSpace: "nowrap",
      }}
    >
      {reason}
    </span>
  );
}

export function SkippedRecordsTable({ skipped }: SkippedRecordsTableProps) {
  if (skipped.length === 0) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "40px 24px",
          background: "rgba(16,185,129,0.05)",
          border: "1px solid rgba(16,185,129,0.15)",
          borderRadius: 12,
        }}
      >
        <div style={{ fontSize: "2rem", marginBottom: 10 }}>🎉</div>
        <div style={{ fontWeight: 600, color: "#6ee7b7", marginBottom: 4 }}>
          All rows imported successfully!
        </div>
        <div style={{ fontSize: "0.875rem", color: "#475569" }}>
          No records were skipped
        </div>
      </div>
    );
  }

  // Get all unique keys from raw rows for table headers (max 6 for readability)
  const rawKeys = [
    ...new Set(skipped.flatMap((s) => Object.keys(s.raw))),
  ].slice(0, 6);

  return (
    <div
      style={{
        border: "1px solid rgba(245,158,11,0.2)",
        borderRadius: 12,
        overflow: "hidden",
        background: "rgba(22,22,29,0.8)",
      }}
    >
      <div
        id="skipped-records-table-wrapper"
        style={{ overflowX: "auto", overflowY: "auto", maxHeight: 360 }}
      >
        <table className="data-table" style={{ minWidth: Math.max(600, rawKeys.length * 160) }}>
          <thead>
            <tr>
              <th style={{ width: 56, textAlign: "center" }}>Row #</th>
              <th>Skip Reason</th>
              {rawKeys.map((k) => (
                <th key={k}>{k}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {skipped.map((record) => (
              <tr key={record.rowIndex}>
                <td style={{ textAlign: "center", color: "#fcd34d", fontWeight: 700 }}>
                  {record.rowIndex + 1}
                </td>
                <td>
                  <ReasonBadge reason={record.reason} />
                </td>
                {rawKeys.map((k) => (
                  <td key={k} title={record.raw[k]}>
                    {record.raw[k] || (
                      <span style={{ color: "#334155", fontStyle: "italic" }}>—</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div
        style={{
          padding: "10px 16px",
          borderTop: "1px solid rgba(42,42,58,0.5)",
          background: "rgba(16,16,20,0.6)",
          fontSize: "0.8125rem",
          color: "#64748b",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span>{skipped.length} row{skipped.length !== 1 ? "s" : ""} skipped</span>
        <span>Rows shown with original CSV values for debugging</span>
      </div>
    </div>
  );
}
