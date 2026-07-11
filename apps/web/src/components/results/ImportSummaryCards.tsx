"use client";

import type { ImportResult } from "@groweasy/shared";

interface ImportSummaryCardsProps {
  result: ImportResult;
}

interface CardProps {
  label: string;
  value: number;
  icon: string;
  color: string;
  bg: string;
  border: string;
  id: string;
}

function StatCard({ label, value, icon, color, bg, border, id }: CardProps) {
  return (
    <div
      id={id}
      style={{
        flex: "1 1 140px",
        padding: "24px 20px",
        borderRadius: 16,
        background: bg,
        border: `1px solid ${border}`,
        textAlign: "center",
        transition: "all 0.2s ease",
      }}
    >
      <div style={{ fontSize: "2rem", marginBottom: 10 }}>{icon}</div>
      <div
        style={{
          fontSize: "2.25rem",
          fontWeight: 800,
          color,
          marginBottom: 6,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value.toLocaleString()}
      </div>
      <div style={{ fontSize: "0.8125rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </div>
    </div>
  );
}

export function ImportSummaryCards({ result }: ImportSummaryCardsProps) {
  const successRate =
    result.totalRows > 0
      ? Math.round((result.totalImported / result.totalRows) * 100)
      : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Main stats */}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <StatCard
          id="stat-total-rows"
          label="Total Rows"
          value={result.totalRows}
          icon="📊"
          color="#a5b4fc"
          bg="rgba(99,102,241,0.08)"
          border="rgba(99,102,241,0.2)"
        />
        <StatCard
          id="stat-total-imported"
          label="Imported"
          value={result.totalImported}
          icon="✅"
          color="#6ee7b7"
          bg="rgba(16,185,129,0.08)"
          border="rgba(16,185,129,0.2)"
        />
        <StatCard
          id="stat-total-skipped"
          label="Skipped"
          value={result.totalSkipped}
          icon="⚠️"
          color="#fcd34d"
          bg="rgba(245,158,11,0.08)"
          border="rgba(245,158,11,0.2)"
        />
      </div>

      {/* Batch stats + success rate */}
      <div
        style={{
          display: "flex",
          gap: 16,
          padding: "16px 20px",
          background: "rgba(28,28,38,0.6)",
          border: "1px solid rgba(42,42,58,0.6)",
          borderRadius: 12,
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          <div>
            <span style={{ color: "#64748b", fontSize: "0.8125rem" }}>AI Batches: </span>
            <span style={{ fontWeight: 700, color: "#a5b4fc" }}>{result.batches.total}</span>
          </div>
          <div>
            <span style={{ color: "#64748b", fontSize: "0.8125rem" }}>Succeeded: </span>
            <span style={{ fontWeight: 700, color: "#6ee7b7" }}>{result.batches.succeeded}</span>
          </div>
          {result.batches.failed > 0 && (
            <div>
              <span style={{ color: "#64748b", fontSize: "0.8125rem" }}>Failed: </span>
              <span style={{ fontWeight: 700, color: "#fca5a5" }}>{result.batches.failed}</span>
            </div>
          )}
          {result.batches.retried > 0 && (
            <div>
              <span style={{ color: "#64748b", fontSize: "0.8125rem" }}>Retried: </span>
              <span style={{ fontWeight: 700, color: "#fcd34d" }}>{result.batches.retried}</span>
            </div>
          )}
        </div>

        {/* Success rate bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 120,
              height: 8,
              borderRadius: 4,
              background: "rgba(42,42,58,0.8)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${successRate}%`,
                borderRadius: 4,
                background: successRate >= 80
                  ? "linear-gradient(90deg, #10b981, #6ee7b7)"
                  : successRate >= 50
                  ? "linear-gradient(90deg, #f59e0b, #fcd34d)"
                  : "linear-gradient(90deg, #ef4444, #fca5a5)",
                transition: "width 0.8s ease",
              }}
            />
          </div>
          <span
            style={{
              fontSize: "0.875rem",
              fontWeight: 700,
              color: successRate >= 80 ? "#6ee7b7" : successRate >= 50 ? "#fcd34d" : "#fca5a5",
            }}
          >
            {successRate}% imported
          </span>
        </div>
      </div>
    </div>
  );
}
