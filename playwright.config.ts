import { defineConfig, devices } from "@playwright/test";

/**
 * Capture-only Playwright config for HyperFrames demo footage.
 *
 * This is NOT a test config — it drives the app end-to-end and records WebM
 * video of each segment. Wallet-gated actions (Freighter sign popups) are
 * skipped and covered later with HyperFrames overlays.
 *
 * Run:
 *   npm run dev   # in a separate terminal — vite on :5173
 *   npx playwright test --project=demo-capture
 *
 * Output:
 *   e2e/demo-footage/<segment>/video.webm
 *
 * The `s1-reveal-room` project is the same kind of thing for one artifact: the
 * recording Decision 6 asks the owner to review before the reveal room spreads
 * to other screens (docs/REDESIGN_PLAN.md). It is a separate project so it can
 * be re-recorded on its own, without walking the whole demo.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "list",
  outputDir: "./e2e/demo-footage",

  use: {
    baseURL: process.env.BASE_URL ?? "http://localhost:5173",
    trace: "off",
    video: {
      mode: "on",
      size: { width: 1920, height: 1080 },
    },
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 2, // retina — sharper text in the render
    screenshot: "off",
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },

  projects: [
    {
      name: "demo-capture",
      testIgnore: "**/capture-s1-reveal-room.spec.ts",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "s1-reveal-room",
      testMatch: "**/capture-s1-reveal-room.spec.ts",
      // The installed Chrome channel, like scripts/shots.cjs and
      // scripts/check-hidden-moves.cjs: no browser download needed to record.
      use: { ...devices["Desktop Chrome"], channel: "chrome" },
    },
  ],
});
