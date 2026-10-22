/**
 * The locked vocabulary — design.md §7. One set of words across every screen.
 *
 * Code identifiers do not change: `GameMove` is still "C" | "D" and the game
 * still calls it cooperate/defect. Only what users READ changes. "Cooperate"
 * and "Defect" survive in the Learn glossary and the strategy inspector,
 * written as a parenthetical the first time.
 *
 * Never retype these strings in a component; import them.
 */

import type { GameMove } from "../util/strategies";

/* -------------------------------------------------------------------------- */
/* The moves                                                                  */
/* -------------------------------------------------------------------------- */

export const MOVE_LABEL: Record<GameMove, string> = {
  C: "Lean in",
  D: "Hold back",
};

export const MOVE_HELPER: Record<GameMove, string> = {
  C: "Trust them to hold you up.",
  D: "Stay safe — and grab the reward if they lean.",
};

/** The first time each game-theory term appears in the Learn journey. */
export const MOVE_THEORY: Record<GameMove, string> = {
  C: "cooperate",
  D: "defect",
};

/** Written once, parenthetical: "Lean in (cooperate)". */
export function moveLabelWithTheory(move: GameMove): string {
  return `${MOVE_LABEL[move]} (${MOVE_THEORY[move]})`;
}

/* -------------------------------------------------------------------------- */
/* The outcomes                                                               */
/* -------------------------------------------------------------------------- */

/** The four move pairs, in the order users meet them. */
export type OutcomeId = "held" | "dropped" | "taken" | "standoff";

/**
 * design.md §7. This table is the single source of truth for what an outcome
 * is called, what the stamp says, and what the thread does. The scene (B3)
 * reads it; nothing recomputes it from the moves.
 */
export interface Outcome {
  id: OutcomeId;
  /** You / partner. */
  moves: readonly [GameMove, GameMove];
  /** The word a person reads. */
  word: string;
  /** Uppercase, for the Stamp component. */
  stamp: string;
  /** The thread state after the reveal. */
  thread: ThreadState;
}

export const OUTCOMES: readonly Outcome[] = [
  {
    id: "held",
    moves: ["C", "C"],
    word: "Held",
    stamp: "HELD",
    thread: "twisted",
  },
  {
    id: "dropped",
    moves: ["C", "D"],
    word: "Dropped",
    stamp: "DROPPED",
    thread: "snapped",
  },
  {
    id: "taken",
    moves: ["D", "C"],
    word: "You took it",
    stamp: "TAKEN",
    thread: "snapped",
  },
  {
    id: "standoff",
    moves: ["D", "D"],
    word: "Standoff",
    stamp: "STANDOFF",
    thread: "slack",
  },
] as const;

export type ThreadState = "loose" | "twisted" | "snapped" | "slack";

/**
 * Resolve the outcome from the two moves. Presentation-only: this maps a
 * settled pair to its receipt wording. It never computes payoffs, and it is
 * never called with an unrevealed move.
 */
export function getOutcome(you: GameMove, partner: GameMove): Outcome {
  const found = OUTCOMES.find(
    (o) => o.moves[0] === you && o.moves[1] === partner,
  );
  if (!found) throw new Error(`No outcome for ${you}/${partner}`);
  return found;
}

/* -------------------------------------------------------------------------- */
/* Stamps                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Every stamp the app can print. Typed so a component cannot invent one.
 * Uppercase by design: stamps are the one place uppercase is allowed
 * (design.md §4).
 */
export const STAMPS = {
  practice: "PRACTICE — NOT ON-CHAIN",
  sealed: "SEALED",
  pending: "PENDING",
  held: "HELD",
  dropped: "DROPPED",
  taken: "TAKEN",
  standoff: "STANDOFF",
  // A plate is a drawing of a mechanism, not a receipt of a settlement. Any
  // figure that shows an outcome it did not measure carries this stamp, and
  // so does anything standing in for a claim that is still being built.
  illustrative: "ILLUSTRATIVE — NOT A PROOF",
  building: "IN BUILD — PATTERN 3",
} as const;

export type StampText = (typeof STAMPS)[keyof typeof STAMPS];

/* -------------------------------------------------------------------------- */
/* Honesty rules                                                              */
/* -------------------------------------------------------------------------- */

/**
 * design.md §7: a ZK receipt prints a tx id and explorer link ONLY once app
 * state says the transaction is confirmed. Before that, the line reads
 * PENDING. Components take `confirmed` and pick for themselves — nothing may
 * claim a transaction exists because an animation finished.
 */
export function transactionLine(confirmed: boolean, txId?: string) {
  return confirmed && txId ? txId : STAMPS.pending;
}

/** Trust height = consecutive "Held" rounds. The drawing caps at 5 twists. */
export const MAX_DRAWN_TWISTS = 5;
export const MAX_DRAWN_TRUST = 5;

/**
 * How many turns the braid is drawn with — the one rule, for both stages.
 *
 * `altitude` is the height the caller has been told, and `settled` says whether
 * that height already includes this round. During a reveal it has not: app state
 * records the round a beat after the reveal starts, so the braid is drawn at the
 * height the round is about to earn. Both the 2D stage and the reveal room call
 * this, which is what stops them disagreeing about the height on screen — and
 * what stops the count jumping when app state settles the round mid-animation.
 *
 * A thread that is not twisted draws no turns, whatever the height says: the
 * drawing never claims a twist the outcome did not earn (design.md §6).
 */
export function drawnTwists(
  thread: ThreadState,
  altitude: number,
  settled: boolean,
): number {
  if (thread !== "twisted") return 0;
  const turns = settled ? altitude : altitude + 1;
  return Math.min(Math.max(turns, 1), MAX_DRAWN_TWISTS);
}
