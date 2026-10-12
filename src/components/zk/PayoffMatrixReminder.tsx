import React from "react";
import { TrustFallCharacter } from "../TrustFallCharacter";

/** Compact payoff-matrix reminder shown above the commit CTA. */
export const PayoffMatrixReminder: React.FC = () => (
  <div
    style={{
      marginBottom: "24px",
      background: "rgba(10, 14, 26, 0.85)",
      border: "1px solid var(--border-glass)",
      borderRadius: "var(--radius-md)",
      padding: "16px",
    }}
  >
    <p
      style={{
        margin: "0 0 12px",
        fontSize: "var(--text-xs)",
        color: "var(--text-secondary)",
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        fontWeight: 600,
        textAlign: "center",
      }}
    >
      Payoff Matrix
    </p>
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "auto 1fr 1fr",
        gap: "6px",
        textAlign: "center",
        fontFamily: "var(--font-mono)",
      }}
    >
      <div />
      <div
        style={{
          fontWeight: 700,
          color: "var(--accent-cooperate)",
          fontSize: "var(--text-sm)",
        }}
      >
        🤝 They C
      </div>
      <div
        style={{
          fontWeight: 700,
          color: "var(--accent-defect)",
          fontSize: "var(--text-sm)",
        }}
      >
        ⚔️ They D
      </div>
      <div
        style={{
          fontWeight: 700,
          color: "var(--accent-cooperate)",
          fontSize: "var(--text-sm)",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          paddingRight: "6px",
          gap: "4px",
        }}
      >
        You C
        <TrustFallCharacter state="standing" color="cooperator" size="sm" />
      </div>
      <div
        style={{
          color: "#4ade80",
          fontWeight: 700,
          fontSize: "var(--text-base)",
        }}
      >
        +2 / +2
      </div>
      <div
        style={{
          color: "#f87171",
          fontWeight: 700,
          fontSize: "var(--text-base)",
        }}
      >
        0 / +3
      </div>
      <div
        style={{
          fontWeight: 700,
          color: "var(--accent-defect)",
          fontSize: "var(--text-sm)",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          paddingRight: "6px",
          gap: "4px",
        }}
      >
        You D
        <TrustFallCharacter state="standing" color="defector" size="sm" />
      </div>
      <div
        style={{
          color: "#fbbf24",
          fontWeight: 700,
          fontSize: "var(--text-base)",
        }}
      >
        +3 / 0
      </div>
      <div
        style={{
          color: "#ef4444",
          fontWeight: 700,
          fontSize: "var(--text-base)",
        }}
      >
        0 / 0
      </div>
    </div>
  </div>
);
