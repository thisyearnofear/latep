import type { ReactNode } from "react";
import { MARKS } from "../marks";
import { getPrimitive, type PrimitiveId } from "../../content/primitives";
import {
  getOutcome,
  MOVE_LABEL,
  STAMPS,
  transactionLine,
  type StampText,
} from "../../content/vocabulary";
import type { GameMove } from "../../util/strategies";
import { Receipt, ReceiptLine, Stamp, Takeaway } from "./index";
import { shortTx } from "./helpers";

/**
 * The round receipt — the thing a round prints.
 *
 * PRESENTATIONAL ONLY. Every value arrives as a prop. This component never
 * computes an outcome, a payoff, or a trust height; `getOutcome` below only
 * maps an already-revealed pair of moves to the wording for that pair, which
 * is what design.md §7's table is for.
 *
 * It must never be rendered before both moves are revealed: the honesty rules
 * (design.md §7) say a receipt claims nothing that app state doesn't confirm,
 * and a sealed round has nothing to print yet.
 */

export type RoundMode = "practice" | "zk";

export interface RoundReceiptProps {
  roundNumber: number;
  /** Practice rounds are points, never XLM. */
  mode: RoundMode;
  you: GameMove;
  partner: GameMove;
  /** Your points for this round. Practice points are labelled as points. */
  pointsYou: number;
  pointsPartner: number;
  /** Consecutive mutual-cooperation rounds. The exact count is printed. */
  trustTwists?: number;
  /** Printed in the header. Caller supplies it; never invented here. */
  time?: string;
  /**
   * On-chain only. The transaction is printed as an explorer link ONLY once
   * `confirmed` is true. Before that the line reads PENDING — a receipt must
   * never claim a transaction that hasn't landed.
   */
  txId?: string;
  confirmed?: boolean;
  explorerUrl?: (txId: string) => string;
  /** Escrow settlement, on-chain only. */
  stakeLabel?: string;
  settlementLabel?: string;
  /** Which primitive the round demonstrates. See the mapping below. */
  primitiveId: PrimitiveId;
  /** "Where this shows up" link. */
  learnHref?: string;
  /** Play the stepped feed-out — the one orchestrated moment. */
  feeding?: boolean;
  children?: ReactNode;
}

export function RoundReceipt({
  roundNumber,
  mode,
  you,
  partner,
  pointsYou,
  pointsPartner,
  trustTwists,
  time,
  txId,
  confirmed = false,
  explorerUrl,
  stakeLabel,
  settlementLabel,
  primitiveId,
  learnHref,
  feeding,
  children,
}: RoundReceiptProps) {
  const outcome = getOutcome(you, partner);
  const primitive = getPrimitive(primitiveId);
  const Mark = MARKS[primitive.mark];
  const stamp: StampText = STAMPS[outcome.id as keyof typeof STAMPS];

  // Never let a pending or failed transaction print as real.
  const tx = transactionLine(confirmed, txId);
  const link = confirmed && txId && explorerUrl ? explorerUrl(txId) : null;

  return (
    <Receipt
      title={`Round ${roundNumber}`}
      time={time}
      feeding={feeding}
      footer={
        <Takeaway
          Mark={Mark}
          used={primitive.name}
          line={primitive.oneLine}
          where={primitive.everyday}
          {...(learnHref ? { href: learnHref } : {})}
        />
      }
    >
      <ReceiptLine label="You" value={MOVE_LABEL[you]} />
      <ReceiptLine label="Partner" value={MOVE_LABEL[partner]} />
      {trustTwists !== undefined && (
        <ReceiptLine label="Trust twists" value={String(trustTwists)} />
      )}

      {mode === "zk" && (
        <>
          <ReceiptLine label="Stake" value={stakeLabel ?? "—"} />
          <ReceiptLine
            label="Settlement"
            value={
              confirmed
                ? (settlementLabel ?? "Settled on-chain")
                : STAMPS.pending
            }
          />
          <ReceiptLine
            label="Transaction"
            value={
              link ? (
                <a href={link} rel="noreferrer noopener">
                  {shortTx(txId!)}
                </a>
              ) : (
                tx
              )
            }
          />
        </>
      )}

      <div className="round-receipt-stamps">
        <Stamp text={stamp} />
        {mode === "practice" && (
          <span className="round-receipt-stamp-extra">
            <Stamp text={STAMPS.practice} />
          </span>
        )}
      </div>

      <ReceiptLine
        label="Total"
        value={`${pointsYou >= 0 ? "+" : ""}${pointsYou} / ${
          pointsPartner >= 0 ? "+" : ""
        }${pointsPartner}`}
        total
      />

      {children}
    </Receipt>
  );
}
