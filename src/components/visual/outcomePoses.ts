/**
 * The four outcomes — design.md §7.
 *
 * This table is the whole scene's pose source: the 2D stage reads it to draw
 * the two figures, and the reveal room (design.md §12) reads it to pose the
 * same rig in three dimensions. It lives on its own so the two cannot drift —
 * a change here changes both, which is the point.
 *
 * A reviewer should be able to check every move pair against design.md §7 and
 * find it here, in the same order, with the same words:
 *
 *   you / partner   word          pose you / pose partner   thread
 *   ---------------------------------------------------------------------
 *   C  / C         Held          held       / held          twisted
 *   C  / D         Dropped       toppled    / holding-back  snapped
 *   D  / C         You took it   holding-back / toppled     snapped
 *   D  / D         Standoff      holding-back / holding-back slack
 *
 * The thread state does NOT live here: it comes from `getOutcome`
 * (content/vocabulary.ts), which is the single source of truth. Only the poses
 * are here, because they are a property of the drawing rather than of the
 * words.
 *
 * Before the reveal there is no outcome at all: both figures hold their seal,
 * the thread is loose, and no move value is anywhere in the DOM.
 */

import type { CharacterState } from "../trustFallRig";
import type { GameMove } from "../../util/strategies";

export const OUTCOME_POSES: Record<
  string,
  { you: CharacterState; partner: CharacterState }
> = {
  // C / C — Held: both lean in, palms meet, both are held up.
  CC: { you: "held", partner: "held" },
  // C / D — Dropped: you leaned in, they held back; you go over.
  CD: { you: "toppled", partner: "holding-back" },
  // D / C — You took it: the reverse. The leaner goes over, not you.
  DC: { you: "holding-back", partner: "toppled" },
  // D / D — Standoff: both upright and apart, nothing gained.
  DD: { you: "holding-back", partner: "holding-back" },
};

/** Before anyone has chosen, both figures stand ready. */
export const READY_POSE: CharacterState = "standing";

/** The poses for a phase. No move pair means no outcome to draw. */
export function posesFor(
  phase: string,
  you?: GameMove,
  partner?: GameMove,
): { you: CharacterState; partner: CharacterState } {
  if (phase !== "revealing" && phase !== "outcome") {
    return { you: READY_POSE, partner: READY_POSE };
  }
  if (!you || !partner) return { you: READY_POSE, partner: READY_POSE };
  return OUTCOME_POSES[`${you}${partner}`];
}
