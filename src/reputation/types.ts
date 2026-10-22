/**
 * The reputation seam (design.md §13.8).
 *
 * The UI never talks to a proof system directly — it talks to this one
 * interface. v1 ships the simulated claimer only: a `simulated` result is
 * always rendered with the ILLUSTRATIVE and IN BUILD stamps. A `proven`
 * result renders only when the Pattern 3 circuit produced it, and follows the
 * honesty rules in design.md §7 — a tx id appears only once it is confirmed.
 */

export interface ReputationSummary {
  /** rounds in the record */
  recorded: number;
  /** rounds where you leaned in */
  kept: number;
  /** 0–100, integer */
  keptPct: number;
}

export type ClaimResult =
  | {
      kind: "simulated";
      meets: boolean;
      threshold: number;
      summary: ReputationSummary;
    }
  | {
      kind: "proven";
      meets: true;
      threshold: number;
      nullifier: string;
      txHash?: string;
    };

export interface ReputationClaimer {
  claim(threshold: number, context: string): Promise<ClaimResult>;
}
