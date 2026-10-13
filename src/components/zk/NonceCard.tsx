import React from "react";
import { ReceiptStub, TearLine } from "../receipt";
import "../../styles/zk.css";

/**
 * The nonce — "Keep this half".
 *
 * The nonce is the half of the round you tear off and keep: it's needed to
 * reveal the sealed move later. It prints as the stub below the commit
 * receipt's tear line.
 */
export const NonceCard: React.FC<{ nonce: bigint | null }> = ({ nonce }) => {
  if (nonce === null) return null;
  return (
    <div className="zk-stub">
      <TearLine label="Keep this half" />
      <p className="zk-stub__label">Your secret code</p>
      <ReceiptStub>{nonce.toString()}</ReceiptStub>
      <p className="zk-stub__hint">
        Needed to reveal your move. Saved automatically in this browser — write
        it down as a backup in case you switch device. It reappears
        automatically when you reveal.
      </p>
    </div>
  );
};
