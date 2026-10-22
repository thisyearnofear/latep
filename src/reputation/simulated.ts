/**
 * The simulated claimer (design.md §13.8).
 *
 * v1 has no circuit, so the claim is answered by the record itself: the
 * claimer reads a ReputationSummary and reports whether the kept percentage
 * meets the threshold. Every result comes back `kind: "simulated"`, which is
 * what tells the UI to keep the ILLUSTRATIVE and IN BUILD stamps on.
 *
 * Pure: no proof code, no network. When Pattern 3 lands, a real claimer
 * implements the same interface and the UI does not change.
 */

import type {
  ClaimResult,
  ReputationClaimer,
  ReputationSummary,
} from "./types";

/** Turn a list of rounds into the summary a claim is made over. */
export function summarize(
  rounds: readonly { yourMove: "C" | "D" }[],
): ReputationSummary {
  const recorded = rounds.length;
  const kept = rounds.filter((r) => r.yourMove === "C").length;
  const keptPct = recorded > 0 ? Math.round((kept / recorded) * 100) : 0;
  return { recorded, kept, keptPct };
}

/**
 * Build a claimer over a live summary source. The factory takes a getter so
 * the same claimer always answers against the current record, not a snapshot
 * taken when the component mounted.
 */
export function createSimulatedClaimer(
  getSummary: () => ReputationSummary,
): ReputationClaimer {
  return {
    // The context binds a real claim to where it was made; the simulated one
    // ignores it, so the parameter is omitted (the interface still holds).
    claim(threshold: number): Promise<ClaimResult> {
      const summary = getSummary();
      return Promise.resolve({
        kind: "simulated",
        meets: summary.keptPct >= threshold,
        threshold,
        summary,
      });
    },
  };
}

/** The worked example on the story surfaces: 90% of 200 recorded deals. */
export const simulatedClaimer: ReputationClaimer = createSimulatedClaimer(
  () => ({ recorded: 200, kept: 190, keptPct: 95 }),
);
