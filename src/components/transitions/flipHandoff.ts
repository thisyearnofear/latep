/**
 * The Flip handoff (design.md §13.6): when a round receipt is added to the
 * record, its Flip state travels with the navigation so /record can play it
 * into its slot. A module-level stash because the receipt unmounts with the
 * route — it outlives the page, not the session.
 */
const STASH_TTL_MS = 2000;

export interface FlipRect {
  left: number;
  top: number; // page coordinates (rect + scroll)
  width: number;
  height: number;
}

interface FlipStash {
  rect: FlipRect;
  entryId: string;
  at: number;
}

let stash: FlipStash | null = null;

export function stashFlip(el: Element, entryId: string): void {
  try {
    const r = el.getBoundingClientRect();
    stash = {
      rect: {
        left: r.left + window.scrollX,
        top: r.top + window.scrollY,
        width: r.width,
        height: r.height,
      },
      entryId,
      at: Date.now(),
    };
  } catch {
    stash = null;
  }
}

/** Take the stash if it is fresh; consumes it either way. */
export function takeFlip(): FlipStash | null {
  const s = stash;
  stash = null;
  if (!s || Date.now() - s.at > STASH_TTL_MS) return null;
  return s;
}

/** The id of the stash without consuming it — the outgoing layer hides it. */
export function peekFlipId(): string | null {
  return stash && Date.now() - stash.at <= STASH_TTL_MS ? stash.entryId : null;
}
