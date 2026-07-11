"use client";

interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export function ErrorBanner({ message, onRetry, retryLabel = "Try Again" }: ErrorBannerProps) {
  return (
    <div
      className="animate-fade-up"
      style={{
        background: "rgba(239,68,68,0.08)",
        border: "1px solid rgba(239,68,68,0.25)",
        borderRadius: 12,
        padding: "16px 20px",
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          background: "rgba(239,68,68,0.15)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          fontSize: "1rem",
        }}
      >
        ⚠️
      </div>

      {/* Message */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, color: "#fca5a5", marginBottom: 4, fontSize: "0.9375rem" }}>
          Something went wrong
        </div>
        <div style={{ color: "#f87171", fontSize: "0.875rem", lineHeight: 1.5 }}>{message}</div>
      </div>

      {/* Retry */}
      {onRetry && (
        <button
          onClick={onRetry}
          id="error-retry-btn"
          style={{
            flexShrink: 0,
            padding: "8px 16px",
            borderRadius: 8,
            border: "1px solid rgba(239,68,68,0.4)",
            background: "rgba(239,68,68,0.1)",
            color: "#fca5a5",
            fontSize: "0.875rem",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(239,68,68,0.2)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(239,68,68,0.1)";
          }}
        >
          {retryLabel}
        </button>
      )}
    </div>
  );
}
