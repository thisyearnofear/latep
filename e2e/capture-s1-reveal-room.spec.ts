import { test, expect, Page } from "@playwright/test";

/**
 * S1 review recording — the reveal room, all four outcomes, one take.
 *
 * Decision 6 in docs/REDESIGN_PLAN.md gates the room on the owner reviewing a
 * recording of it plus its measurements. This spec is that recording: it drives
 * a real round for each outcome in the room and holds long enough on each one
 * for a person to read the word, the stamp and the thread.
 *
 * It is not a still — a still cannot show the reveal, and the reveal is the
 * thing being reviewed. Playwright records the WebM under `e2e/demo-footage/`
 * and prints the exact path when the run ends; `find e2e/demo-footage -name
 * video.webm -newer package.json` is the quick way to it.
 *
 * Run:
 *   npm run dev        # in a separate terminal — vite on :5173
 *   npm run demo:s1
 *
 * Output is gitignored (AGENTS.md): regenerate it, never commit it.
 *
 * The practice partner mirrors your previous move, so the sequence below is
 * deterministic and visits all four outcomes in order — Held, You took it,
 * Standoff, Dropped.
 */

// Four rounds at ~7s each is a capture, not a test: the default 30s timeout is
// shorter than the thing being recorded.
test.describe.configure({ timeout: 120_000 });

const SEALED = 1200; // hold on the sealed phase, so the stubs read
const REVEAL = 950; // the choreography itself (design.md section 8)
const OUTCOME = 3200; // let the settled outcome read before moving on

const ROUNDS = [
  { move: "Lean in", word: "Held", thread: "twisted" },
  { move: "Hold back", word: "You took it", thread: "snapped" },
  { move: "Hold back", word: "Standoff", thread: "slack" },
  { move: "Lean in", word: "Dropped", thread: "snapped" },
] as const;

/** Nothing that competes with the scene in a review recording. */
async function suppressChrome(page: Page) {
  await page.addStyleTag({
    content: `::-webkit-scrollbar { display: none !important; }`,
  });
}

/** One round, in the room, held long enough to be looked at. */
async function playRound(
  page: Page,
  round: (typeof ROUNDS)[number],
): Promise<void> {
  await page.getByRole("button", { name: round.move, exact: true }).click();
  await page.waitForTimeout(SEALED);

  await page.getByRole("button", { name: "Reveal both choices" }).click();
  await page.waitForTimeout(REVEAL + 400);

  // The room has to have carried the reveal. A recording of the 2D fallback
  // would look like a passing review of something else entirely.
  await expect(page.locator(".reveal-room-canvas canvas")).toBeVisible();
  await expect(page.locator(".reveal-room-word")).toHaveText(round.word);
  const stage = page.locator(".trust-stage-surface");
  await expect(stage).toHaveAttribute("data-room", "on");
  await expect(stage).toHaveAttribute("data-thread-state", round.thread);

  await page.waitForTimeout(OUTCOME);
}

test.describe("S1 review recording", () => {
  test("reveal room — four outcomes", async ({ page }) => {
    await page.goto("/?room=on");
    await suppressChrome(page);
    await page.waitForTimeout(800);

    for (const [index, round] of ROUNDS.entries()) {
      await playRound(page, round);
      // The receipt that follows the last outcome is part of what is being
      // reviewed, so the clip ends on it rather than cutting away.
      if (index < ROUNDS.length - 1) {
        await page.getByRole("button", { name: "Play another round" }).click();
        await page.waitForTimeout(600);
      }
    }

    await page.waitForTimeout(OUTCOME);
  });
});
