import React from "react";
import { Link } from "react-router-dom";
import { txExplorerUrl } from "../../contracts/util";
import { Stamp } from "../receipt";
import { STAMPS } from "../../content/vocabulary";
import "../../styles/zk.css";

interface Props {
  hash?: string | null;
  label?: string;
  sublabel?: string;
}

/**
 * The confirmed-transaction stub shown for ~2s after a tx lands on-chain.
 *
 * Prints on receipt stock — inside zk-commit it joins the same stock;
 * standalone callers wrap it in `receipt receipt-edge`. The explorer link
 * exists only because the caller already holds a real hash (design.md §7).
 */
export const VerifiedOnChainCard: React.FC<Props> = ({
  hash,
  label = "Proof verified on-chain",
  sublabel = "The Stellar network checked your math and accepted it. Your move is now cryptographically sealed.",
}) => (
  <div className="zk-verified" role="status">
    <Stamp text={STAMPS.sealed} />
    <p className="zk-verified__label">{label}</p>
    <p className="zk-verified__sub">{sublabel}</p>
    {hash && (
      <p className="zk-verified__tx">
        <a href={txExplorerUrl(hash)} target="_blank" rel="noreferrer">
          View transaction on the explorer ↗
        </a>
      </p>
    )}
    <p className="zk-verified__keep">
      Keep this receipt — the same math secures{" "}
      <Link to="/real-life">votes, deposits and memberships in real life</Link>.
    </p>
  </div>
);
