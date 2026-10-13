import type { PrimitiveId } from "../../content/primitives";
import type { RoundMode } from "./RoundReceipt";

/**
 * Presentation helpers for the round receipt.
 *
 * Split out of RoundReceipt.tsx so that file exports only a component (the
 * react-refresh lint rule flags mixed exports, and the same reason the rig
 * lives in trustFallRig.ts).
 */

/**
 * Which primitive a round demonstrates.
 *
 * Practice rounds 1-2 are The Seal: you decided before seeing theirs. From
 * round 3 the round is about holding each other up, which is The Handshake.
 * In ZK mode a settled round is The Net — the escrow settles itself, nobody
 * has to be the hero — and a proven accreditation is The Pass.
 */
export function primitiveForRound(
  roundNumber: number,
  mode: RoundMode,
  opts: { settled?: boolean; accredited?: boolean } = {},
): PrimitiveId {
  if (opts.accredited) return "pass";
  if (mode === "zk") return "net";
  return roundNumber >= 3 ? "handshake" : "seal";
}

/** Hashes and tx ids truncate in the middle (design.md §10). */
export function shortTx(id: string): string {
  return id.length <= 18 ? id : `${id.slice(0, 8)}…${id.slice(-6)}`;
}
