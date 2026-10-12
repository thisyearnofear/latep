import React from "react";

/** "Your secret code" card — the nonce needed later to reveal the sealed move. */
export const NonceCard: React.FC<{ nonce: bigint | null }> = ({ nonce }) => {
  if (nonce === null) return null;
  return (
    <div
      style={{
        background: "var(--bg-glass-light)",
        borderRadius: "8px",
        padding: "12px",
        marginBottom: "16px",
        border: "1px solid var(--border-glass)",
        fontFamily: "var(--font-body)",
      }}
    >
      <p style={{ margin: "0 0 4px", fontWeight: "bold", fontSize: "13px" }}>
        🔑 Your secret code
      </p>
      <p
        style={{
          margin: "0 0 4px",
          fontSize: "12px",
          color: "var(--text-secondary)",
        }}
      >
        Needed to reveal your move. Saved automatically in this browser — write
        it down as a backup in case you switch device.
      </p>
      <p
        style={{
          margin: 0,
          fontFamily: "monospace",
          fontSize: "14px",
          color: "var(--accent-amber, #f57f17)",
          fontWeight: "bold",
          wordBreak: "break-all",
        }}
      >
        {nonce.toString()}
      </p>
      <p
        style={{
          margin: "4px 0 0",
          fontSize: "11px",
          color: "var(--text-muted)",
        }}
      >
        (It reappears automatically when you reveal)
      </p>
    </div>
  );
};
