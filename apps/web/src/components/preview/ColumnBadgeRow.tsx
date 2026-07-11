"use client";

interface ColumnBadgeRowProps {
  headers: string[];
  rowCount: number;
}

// Known CRM target fields for visual highlighting
const CRM_TARGET_FIELDS = new Set([
  "name", "email", "phone", "mobile", "created", "date", "company",
  "city", "state", "country", "source", "status", "note", "notes",
  "remarks", "lead", "owner", "description",
]);

function guessIsRecognized(header: string): boolean {
  const lower = header.toLowerCase().replace(/[\s_\-]+/g, "");
  return [...CRM_TARGET_FIELDS].some((field) => lower.includes(field));
}

export function ColumnBadgeRow({ headers, rowCount }: ColumnBadgeRowProps) {
  const recognized = headers.filter(guessIsRecognized);
  const unrecognized = headers.filter((h) => !guessIsRecognized(h));

  return (
    <div
      style={{
        background: "rgba(28,28,38,0.6)",
        border: "1px solid rgba(42,42,58,0.6)",
        borderRadius: 12,
        padding: "16px 20px",
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 14,
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <div style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Detected Columns ({headers.length})
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <span style={{ fontSize: "0.8125rem", color: "#6ee7b7" }}>
            ✓ {recognized.length} likely recognized
          </span>
          {unrecognized.length > 0 && (
            <span style={{ fontSize: "0.8125rem", color: "#fcd34d" }}>
              ~ {unrecognized.length} AI will map
            </span>
          )}
        </div>
      </div>

      {/* Badge row */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {headers.map((header) => {
          const isKnown = guessIsRecognized(header);
          return (
            <span
              key={header}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "4px 12px",
                borderRadius: 20,
                fontSize: "0.8125rem",
                fontWeight: 500,
                background: isKnown
                  ? "rgba(16,185,129,0.1)"
                  : "rgba(245,158,11,0.08)",
                border: isKnown
                  ? "1px solid rgba(16,185,129,0.25)"
                  : "1px solid rgba(245,158,11,0.2)",
                color: isKnown ? "#6ee7b7" : "#fcd34d",
                transition: "all 0.2s ease",
              }}
            >
              <span style={{ fontSize: "0.625rem" }}>{isKnown ? "●" : "◌"}</span>
              {header}
            </span>
          );
        })}
      </div>

      {/* Footer info */}
      <div
        style={{
          marginTop: 14,
          paddingTop: 14,
          borderTop: "1px solid rgba(42,42,58,0.5)",
          fontSize: "0.8125rem",
          color: "#475569",
          display: "flex",
          gap: 16,
        }}
      >
        <span>📊 {rowCount} rows will be imported</span>
        <span>🤖 AI handles all column name variations</span>
      </div>
    </div>
  );
}
