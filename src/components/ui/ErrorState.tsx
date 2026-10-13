import React from "react";

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message,
  onRetry,
  onDismiss,
}) => {
  return (
    <div
      role="alert"
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "14px",
        padding: "20px 22px",
        background:
          "linear-gradient(135deg, rgba(248, 113, 113, 0.12), var(--color-counter-2))",
        border: "1px solid rgba(248, 113, 113, 0.35)",
        borderRadius: "3px",
        boxShadow: "var(--shadow-receipt)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
      }}
    >
      <div
        style={{
          fontSize: "22px",
          lineHeight: 1.2,
          flexShrink: 0,
        }}
        aria-hidden
      >
        {"\u26a0\ufe0f"}
      </div>
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        <p
          style={{
            margin: 0,
            fontFamily: "var(--font-body)",
            fontSize: "14px",
            lineHeight: 1.5,
            color: "var(--color-counter-text)",
          }}
        >
          {message}
        </p>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {onRetry && (
            <button
              onClick={onRetry}
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "13px",
                fontWeight: 500,
                color: "var(--color-counter-text)",
                background: "var(--color-stamp)",
                border: "none",
                borderRadius: "8px",
                padding: "8px 16px",
                cursor: "pointer",
                transition: "opacity 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = "0.85";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = "1";
              }}
            >
              Try Again
            </button>
          )}
          {onDismiss && (
            <button
              onClick={onDismiss}
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "13px",
                fontWeight: 500,
                color: "var(--color-counter-text-2)",
                background: "var(--color-counter-2)",
                border: "1px solid var(--color-counter-rule)",
                borderRadius: "8px",
                padding: "8px 16px",
                cursor: "pointer",
                transition: "opacity 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = "0.85";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = "1";
              }}
            >
              Dismiss
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
