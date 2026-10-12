import React from "react";
import { txExplorerUrl } from "../../contracts/util";

interface Props {
  hash?: string | null;
  label?: string;
  sublabel?: string;
}

/** Celebration card shown for ~2s after a tx lands on-chain (the money shot). */
export const VerifiedOnChainCard: React.FC<Props> = ({
  hash,
  label = "Proof verified on-chain",
  sublabel = "The Stellar network checked your math and accepted it. Your move is now cryptographically sealed.",
}) => (
  <div
    className="glass-panel tf-verified"
    style={{
      padding: "24px",
      marginBottom: "16px",
      textAlign: "center",
      borderRadius: "12px",
      border: "1px solid var(--accent-cooperate)",
      background: "rgba(76, 175, 80, 0.12)",
    }}
  >
    <div style={{ fontSize: "40px", marginBottom: "8px" }}>✅</div>
    <div
      style={{
        fontFamily: "var(--font-body)",
        fontSize: "18px",
        fontWeight: 700,
        color: "var(--text-primary)",
        marginBottom: "6px",
      }}
    >
      {label}
    </div>
    <div
      style={{
        fontFamily: "var(--font-body)",
        fontSize: "13px",
        color: "var(--text-secondary)",
        marginBottom: hash ? "10px" : 0,
        lineHeight: 1.5,
      }}
    >
      {sublabel}
    </div>
    {hash && (
      <a
        href={txExplorerUrl(hash)}
        target="_blank"
        rel="noreferrer"
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "12px",
          color: "var(--accent-violet)",
          wordBreak: "break-all",
        }}
      >
        View transaction on the explorer ↗
      </a>
    )}
  </div>
);
