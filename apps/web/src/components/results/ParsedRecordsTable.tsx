"use client";

import type { CrmRecord } from "@groweasy/shared";

interface ParsedRecordsTableProps {
  records: CrmRecord[];
}

const CRM_STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  GOOD_LEAD_FOLLOW_UP: { bg: "rgba(16,185,129,0.12)", color: "#6ee7b7" },
  DID_NOT_CONNECT: { bg: "rgba(245,158,11,0.12)", color: "#fcd34d" },
  BAD_LEAD: { bg: "rgba(239,68,68,0.12)", color: "#fca5a5" },
  SALE_DONE: { bg: "rgba(99,102,241,0.12)", color: "#a5b4fc" },
};

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return <span style={{ color: "#475569" }}>—</span>;
  const style = CRM_STATUS_COLORS[status] ?? { bg: "rgba(100,116,139,0.12)", color: "#94a3b8" };
  return (
    <span
      style={{
        padding: "2px 8px",
        borderRadius: 12,
        fontSize: "0.75rem",
        fontWeight: 600,
        background: style.bg,
        color: style.color,
        whiteSpace: "nowrap",
      }}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

function Cell({ value }: { value: string | null | undefined }) {
  if (!value) return <span style={{ color: "#334155", fontStyle: "italic" }}>—</span>;
  return <span title={value}>{value}</span>;
}

export function ParsedRecordsTable({ records }: ParsedRecordsTableProps) {
  if (records.length === 0) {
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
        <div>No records were imported</div>
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
      <div
        id="imported-records-table-wrapper"
        style={{ overflowX: "auto", overflowY: "auto", maxHeight: 420 }}
      >
        <table className="data-table" style={{ minWidth: 1200 }}>
          <thead>
            <tr>
              <th style={{ width: 48, textAlign: "center" }}>#</th>
              <th>Name</th>
              <th>Email</th>
              <th>Mobile</th>
              <th>Country Code</th>
              <th>Company</th>
              <th>City</th>
              <th>State</th>
              <th>Status</th>
              <th>Source</th>
              <th>Note</th>
              <th>Created At</th>
            </tr>
          </thead>
          <tbody>
            {records.map((rec, i) => (
              <tr key={i}>
                <td style={{ textAlign: "center", color: "#475569", fontSize: "0.75rem" }}>
                  {i + 1}
                </td>
                <td style={{ fontWeight: 500, color: "#f1f5f9" }}>
                  <Cell value={rec.name} />
                </td>
                <td><Cell value={rec.email} /></td>
                <td><Cell value={rec.mobile_without_country_code} /></td>
                <td><Cell value={rec.country_code} /></td>
                <td><Cell value={rec.company} /></td>
                <td><Cell value={rec.city} /></td>
                <td><Cell value={rec.state} /></td>
                <td><StatusBadge status={rec.crm_status} /></td>
                <td>
                  {rec.data_source ? (
                    <span style={{ fontSize: "0.8125rem", color: "#94a3b8" }}>
                      {rec.data_source}
                    </span>
                  ) : (
                    <span style={{ color: "#334155", fontStyle: "italic" }}>—</span>
                  )}
                </td>
                <td style={{ maxWidth: 200 }}><Cell value={rec.crm_note} /></td>
                <td><Cell value={rec.created_at} /></td>
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
          color: "#475569",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span>{records.length.toLocaleString()} records imported</span>
        <span>Scroll horizontally to see all columns</span>
      </div>
    </div>
  );
}
