/**
 * Can this device run the reveal room? (design.md §12)
 *
 * The room is the one 3D moment in the product, and it is never the only
 * carrier of meaning: every outcome it draws is also printed in the DOM beside
 * it, and the 2D stage renders the same round when this says "no". So the job
 * here is to answer cheaply and honestly, before any three.js code is fetched.
 *
 * `?room=on` / `?room=off` override the probe. Reviewers and `npm run shots`
 * need both paths on one device, and the design-system gate asks for a
 * keyboard run with the room on and off.
 *
 * The S1 sign-off is still open (REDESIGN_PLAN.md), so the room is opt-in:
 * the default route uses the 2D stage until `?room=on` asks for the room.
 */

export type RevealRoomReason =
  | "ok"
  | "no-webgl"
  | "reduced-motion"
  | "low-power"
  | "disabled";

export type RevealRoomMode = "auto" | "on" | "off";

let cached: RevealRoomReason | null = null;

/** Read the query override once per call; it can change between tests. */
export function revealRoomMode(): RevealRoomMode {
  if (typeof window === "undefined") return "off";
  try {
    const value = new URLSearchParams(window.location.search).get("room");
    if (value === "on" || value === "off") return value;
  } catch {
    // A malformed URL must not take the page down with it.
  }
  return "auto";
}

/**
 * Ask the browser for a WebGL context and give it straight back. Browsers cap
 * live contexts, so releasing the probe keeps us from spending one of them on
 * a question we only needed answered once.
 */
function hasWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    if (!gl) return false;
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}

/**
 * Coarse device checks only. `deviceMemory` is Chromium-only, so it is read
 * when present and skipped when not; an unreadable device is never assumed to
 * be slow, because wrongly hiding the room is worse than a dropped frame on a
 * device we cannot see.
 */
function isLowPower(): boolean {
  if (typeof navigator === "undefined") return false;
  const deviceMemory = (navigator as Navigator & { deviceMemory?: number })
    .deviceMemory;
  if (typeof deviceMemory === "number" && deviceMemory <= 2) return true;
  const cores = navigator.hardwareConcurrency;
  return typeof cores === "number" && cores <= 2;
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** The reason the room is, or is not, available. Cached after the first call. */
export function revealRoomSupport(): RevealRoomReason {
  if (cached !== null) return cached;
  if (prefersReducedMotion()) cached = "reduced-motion";
  else if (!hasWebGL()) cached = "no-webgl";
  else if (isLowPower()) cached = "low-power";
  else cached = "ok";
  return cached;
}

/** The one function callers need: should this reveal use the 3D room? */
export function shouldUseRevealRoom(): boolean {
  const mode = revealRoomMode();
  if (mode === "off") return false;
  if (mode === "on") return true;
  // S1 sign-off is still open (REDESIGN_PLAN.md). Keep the room opt-in until
  // the owner reviews the recording; `revealRoomSupport()` is the switch to
  // flip back to `=== "ok"` when the gate closes.
  return false;
}

/**
 * Test hook. The probe is cached for the life of the page, so a browser test
 * that changes the reduced-motion setting mid-run needs this to re-ask.
 */
export function resetRevealRoomCapability(): void {
  cached = null;
}
