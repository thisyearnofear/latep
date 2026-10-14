/**
 * How the room's code is fetched (design.md §12: lazy-loaded and code-split).
 *
 * Everything that touches three.js lives behind this one dynamic import, so no
 * route pays for the room until a reveal actually needs it. `RevealStage` warms
 * it while the player is still choosing, because arriving at the emotional peak
 * of the round and *then* waiting for a download is the one way to waste it.
 */

import { shouldUseRevealRoom } from "./capability";

/** The room's module. `lazy()` uses this, so it must resolve to a default export. */
export function loadRevealRoom() {
  return import("./RevealRoom");
}

let started = false;

/**
 * Start the download early, once. Does nothing on a device that will never show
 * the room — there is no point spending a phone's bandwidth on a render it has
 * already been told it cannot make.
 */
export function prefetchRevealRoom(): void {
  if (started) return;
  started = true;
  if (!shouldUseRevealRoom()) return;
  void loadRevealRoom().catch(() => {
    // A failed prefetch is not an error: the reveal falls back to the 2D stage,
    // and `error` in the console would only worry someone reading it.
    started = false;
  });
}
