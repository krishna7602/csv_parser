"use client";

const PREVIEW_LIMIT = 25;

interface CsvPreviewTableProps {
  headers: string[];
  rows: Record<string, string>[];
}

export function CsvPreviewTable({ headers, rows }: CsvPreviewTableProps) {
  const displayed = rows.slice(0, PREVIEW_LIMIT);

  if (headers.length === 0 || rows.length === 0) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "48px 24px",
          color: "#475569",
          background: "rgba(28,28,38,0.4)",
          borderRadius: 12,
          border: "1px solid rgba(42,42,58,0.5)",
        }}
      >
        <div style={{ fontSize: "2rem", marginBottom: 12 }}>📭</div>
        <div>No preview data available</div>
      </div>
    );
  }

  return (
    <div
      style={{
        border: "1px solid rgba(42,42,58,0.8)",
        borderRadius: 12,
        overflow: "hidden",
        background: "rgba(22,22,29,0.8)",
      }}
    >
      {/* Table wrapper: independent vertical + horizontal scroll */}
      <div
        id="csv-preview-table-wrapper"
        style={{
          overflowX: "auto",
          overflowY: "auto",
          maxHeight: 360,
        }}
      >
        <table className="data-table" style={{ minWidth: headers.length * 160 }}>
          <thead>
            <tr>
              {/* Row number column */}
              <th
                style={{
                  width: 48,
                  textAlign: "center",
                  color: "#475569",
                  left: 0,
                  position: "sticky",
                  background: "var(--color-bg-secondary)",
                  zIndex: 20,
                  borderRight: "1px solid rgba(42,42,58,0.5)",
                }}
              >
                #
              </th>
              {headers.map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayed.map((row, rowIndex) => (
              <tr key={rowIndex}>
                <td
                  style={{
                    textAlign: "center",
                    color: "#475569",
                    fontSize: "0.75rem",
                    background: "rgba(22,22,29,0.9)",
                    borderRight: "1px solid rgba(42,42,58,0.3)",
                    position: "sticky",
                    left: 0,
                  }}
                >
                  {rowIndex + 1}
                </td>
                {headers.map((h) => {
                  const val = row[h] ?? "";
                  return (
                    <td key={h} title={val}>
                      {val || <span style={{ color: "#334155", fontStyle: "italic" }}>—</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div
        style={{
          padding: "10px 16px",
          borderTop: "1px solid rgba(42,42,58,0.5)",
          background: "rgba(16,16,20,0.6)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: "0.8125rem", color: "#475569" }}>
          Showing {displayed.length} of {rows.length} rows
          {rows.length > PREVIEW_LIMIT && ` (preview limited to ${PREVIEW_LIMIT})`}
        </span>
        <span style={{ fontSize: "0.8125rem", color: "#475569" }}>
          {headers.length} columns
        </span>
      </div>
    </div>
  );
}
