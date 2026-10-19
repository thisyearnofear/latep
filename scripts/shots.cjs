// Screenshot every route at the review widths, for PR before/after tables, and
// report any route that overflows horizontally.
//
//   npm run dev            # in one terminal
//   npm run shots          # in another
//   npm run shots -- --reduced   # same pass under prefers-reduced-motion (B8)
//
// 390 and 1440 are the two widths every PR must show (docs/REDESIGN_PLAN.md
// section 2, rule 6). 320 / 375 / 414 / 768 are the responsive floor from
// design.md section 10 — ticket A8 checks those.
//
// Overflow is reported as a finding, not a failure, so the tool stays usable
// while routes are mid-restyle. SHOTS_STRICT=1 turns it into a gate (A8).
//
// Uses Playwright's installed Chrome channel so no browser download is needed.
// Output lands in e2e/shots/<width>/ and is gitignored — regenerate, never
// commit (see AGENTS.md).
const fs = require("node:fs");
const path = require("node:path");

const { chromium } = require("@playwright/test");

const BASE = process.env.SHOTS_BASE_URL || "http://localhost:5173";
const OUT_ROOT = path.join(__dirname, "..", "e2e", "shots");
const REDUCED = process.argv.includes("--reduced");
const STRICT = process.env.SHOTS_STRICT === "1";

const WIDTHS = [
  { width: 320, height: 700 },
  { width: 375, height: 812 },
  { width: 390, height: 844 },
  { width: 414, height: 896 },
  { width: 768, height: 1024 },
  { width: 1440, height: 900 },
];

const ROUTES = [
  { name: "home", path: "/" },
  { name: "learn", path: "/learn" },
  { name: "learn-play", path: "/learn/play" },
  { name: "tournament", path: "/tournament" },
  { name: "play", path: "/play" },
  { name: "real-life", path: "/real-life" },
];

const slug = (route) =>
  `${route.name}__${route.path.replace(/^\//, "").replace(/\//g, "-") || "root"}`;

const short = (err) =>
  String(err.message || err)
    .split("\n")[0]
    .slice(0, 60);

async function main() {
  let browser;
  try {
    await fetch(BASE, { signal: AbortSignal.timeout(3000) });
  } catch {
    console.error(
      `\n✗ Nothing serving at ${BASE}.\n  Start it first:  npm run dev\n`,
    );
    process.exit(1);
  }

  try {
    browser = await chromium.launch({ channel: "chrome" });
  } catch {
    console.error(
      "\n✗ Could not launch Chrome via Playwright's `chrome` channel.\n" +
        "  Install Google Chrome, or set SHOTS_BROWSER=chromium to use the\n" +
        "  bundled build instead (requires `npx playwright install chromium`).\n",
    );
    process.exit(1);
  }

  const written = [];
  const overflowing = [];
  const partial = [];
  const failed = [];
  for (const viewport of WIDTHS) {
    const dir = path.join(
      OUT_ROOT,
      REDUCED ? "reduced" : ".",
      String(viewport.width),
    );
    fs.mkdirSync(dir, { recursive: true });
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: 1,
      reducedMotion: REDUCED ? "reduce" : "no-preference",
    });
    const page = await context.newPage();

    for (const route of ROUTES) {
      const label = `${viewport.width}px ${route.path}`;
      const url = `${BASE}${route.path}`;
      try {
        await page.goto(url, { waitUntil: "networkidle", timeout: 20_000 });
      } catch {
        // networkidle never settles on pages that poll the chain; fall back.
        try {
          await page.goto(url, { waitUntil: "load", timeout: 20_000 });
        } catch (err) {
          failed.push(`${label} — did not load (${short(err)})`);
          continue;
        }
      }
      await page.waitForTimeout(900); // let fonts + entry animation settle

      // Probe before shooting: a page that hangs the screenshot must still
      // report its overflow. design.md §10 allows none at any width.
      const px = await page
        .evaluate(
          () =>
            document.documentElement.scrollWidth -
            document.documentElement.clientWidth,
        )
        .catch(() => 0);
      if (px > 1) overflowing.push(`${label}  +${px}px`);

      const file = path.join(dir, `${slug(route)}.png`);
      try {
        await page.screenshot({ path: file, fullPage: true, timeout: 60_000 });
      } catch {
        // A never-settling animation (a rAF loop, an infinite keyframe) can
        // hold a full-page capture open. Above the fold still shows the state.
        try {
          await page.screenshot({ path: file, timeout: 20_000 });
          partial.push(`${label} — above the fold only`);
        } catch (err) {
          failed.push(`${label} — no screenshot (${short(err)})`);
          continue;
        }
      }
      written.push(path.relative(process.cwd(), file));
    }

    await context.close();
  }

  await browser.close();
  console.log(
    `shots: ${written.length} screenshots in ${REDUCED ? "e2e/shots/reduced/" : "e2e/shots/"}` +
      `${REDUCED ? " (reduced motion)" : ""}\n`,
  );

  if (overflowing.length) {
    console.log(
      `horizontal overflow (design.md §10 allows none):\n  ${overflowing.join("\n  ")}\n`,
    );
  } else {
    console.log("✓ no horizontal overflow at any width\n");
  }
  if (partial.length) {
    console.log(
      `captured above the fold only — the page never settled:\n  ${partial.join("\n  ")}\n`,
    );
  }
  if (failed.length) {
    console.log(`✗ no screenshot:\n  ${failed.join("\n  ")}\n`);
  }

  if ((overflowing.length && STRICT) || failed.length) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
