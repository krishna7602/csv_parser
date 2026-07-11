"use client";

interface LoadingStateProps {
  completedBatches: number;
  totalBatches: number;
  rowCount?: number;
}

export function LoadingState({ completedBatches, totalBatches, rowCount }: LoadingStateProps) {
  const hasProgress = totalBatches > 0;
  const pct = hasProgress ? Math.round((completedBatches / totalBatches) * 100) : 0;

  return (
    <div
      className="animate-fade-up"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 32,
        padding: "60px 40px",
      }}
    >
      {/* Animated AI Brain */}
      <div
        style={{
          position: "relative",
          width: 100,
          height: 100,
        }}
      >
        <div
          style={{
            width: 100,
            height: 100,
            borderRadius: "50%",
            background: "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))",
            border: "2px solid rgba(99,102,241,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "2.5rem",
            animation: "pulse-glow 2s ease-in-out infinite",
          }}
        >
          🤖
        </div>
        {/* Spinning ring */}
        <div
          style={{
            position: "absolute",
            inset: -6,
            borderRadius: "50%",
            border: "2px solid transparent",
            borderTopColor: "#6366f1",
            borderRightColor: "#8b5cf6",
            animation: "spin 1.5s linear infinite",
          }}
        />
      </div>

      {/* Text */}
      <div style={{ textAlign: "center" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 8 }}>
          AI is mapping your leads
        </h2>
        <p style={{ color: "#94a3b8", fontSize: "0.9375rem", maxWidth: 380, lineHeight: 1.6 }}>
          Claude is analyzing your CSV columns and intelligently mapping them
          to the GrowEasy CRM schema in batches.
        </p>
      </div>

      {/* Progress */}
      {hasProgress ? (
        <div style={{ width: "100%", maxWidth: 400 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 10,
              fontSize: "0.875rem",
            }}
          >
            <span style={{ color: "#94a3b8" }}>
              Batch {completedBatches} of {totalBatches}
            </span>
            <span style={{ color: "#a5b4fc", fontWeight: 600 }}>{pct}%</span>
          </div>
          <div
            style={{
              height: 8,
              borderRadius: 4,
              background: "rgba(42,42,58,0.8)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${pct}%`,
                borderRadius: 4,
                background: "linear-gradient(90deg, #6366f1, #8b5cf6, #a855f7)",
                transition: "width 0.5s ease",
              }}
            />
          </div>
        </div>
      ) : (
        <div style={{ width: "100%", maxWidth: 400 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, fontSize: "0.875rem" }}>
            <span style={{ color: "#94a3b8" }}>Starting AI processing…</span>
          </div>
          <div style={{ height: 8, borderRadius: 4, background: "rgba(42,42,58,0.8)", overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: "100%",
                borderRadius: 4,
                background: "linear-gradient(90deg, #6366f1, #8b5cf6, #a855f7)",
                backgroundSize: "200% 100%",
                animation: "shimmer 1.5s linear infinite",
              }}
            />
          </div>
        </div>
      )}

      {/* Stats */}
      {rowCount && (
        <div
          style={{
            display: "flex",
            gap: 20,
            padding: "16px 24px",
            background: "rgba(28,28,38,0.5)",
            borderRadius: 12,
            border: "1px solid rgba(42,42,58,0.8)",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#a5b4fc" }}>{rowCount}</div>
            <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Total Rows</div>
          </div>
          {totalBatches > 0 && (
            <>
              <div style={{ width: 1, background: "#2a2a3a" }} />
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#a5b4fc" }}>{totalBatches}</div>
                <div style={{ fontSize: "0.75rem", color: "#64748b" }}>AI Batches</div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
