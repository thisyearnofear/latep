// Screenshot every route at the two review widths, for PR before/after tables.
//
//   npm run dev            # in one terminal
//   npm run shots          # in another
//
// Uses Playwright's installed Chrome channel so no browser download is needed.
// Output lands in e2e/shots/<width>/ and is gitignored — regenerate, never
// commit (see AGENTS.md).
const fs = require("node:fs");
const path = require("node:path");

const { chromium } = require("@playwright/test");

const BASE = process.env.SHOTS_BASE_URL || "http://localhost:5173";
const OUT_ROOT = path.join(__dirname, "..", "e2e", "shots");
const WIDTHS = [
  { width: 390, height: 844 },
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
  for (const viewport of WIDTHS) {
    const dir = path.join(OUT_ROOT, String(viewport.width));
    fs.mkdirSync(dir, { recursive: true });
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: 1,
      reducedMotion: "no-preference",
    });
    const page = await context.newPage();

    for (const route of ROUTES) {
      const url = `${BASE}${route.path}`;
      try {
        await page.goto(url, { waitUntil: "networkidle", timeout: 20_000 });
      } catch {
        // networkidle never settles on pages that poll the chain; fall back.
        await page.goto(url, { waitUntil: "load", timeout: 20_000 });
      }
      await page.waitForTimeout(900); // let fonts + entry animation settle
      const file = path.join(dir, `${slug(route)}.png`);
      await page.screenshot({ path: file, fullPage: true });
      written.push(path.relative(process.cwd(), file));
    }

    await context.close();
  }

  await browser.close();
  console.log(
    `shots: ${written.length} screenshots in e2e/shots/\n  ${written.join("\n  ")}\n`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
