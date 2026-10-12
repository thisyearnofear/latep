const { chromium } = require("@playwright/test");

/**
 * The hidden-move rule (design.md §7): before the reveal, no screen may
 * contain a move value in the DOM, whether as text, a class, an attribute, or
 * in the accessibility tree. Run against a live dev server.
 */
const NEEDLES = [
  "Cooperate",
  "Defect",
  "lean in",
  "Lean in",
  "Hold back",
  "leaning",
  "held",
  "toppled",
  "Dropped",
  "Taken",
  "Standoff",
  "HELD",
  "DROPPED",
  "TAKEN",
  "STANDOFF",
  "caught",
  "impact",
  "celebrating",
];

(async () => {
  const base = "http://localhost:5173";
  const browser = await chromium.launch({ channel: "chrome" });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
  });
  let failures = 0;

  for (const route of [
    "/",
    "/learn",
    "/learn/play",
    "/real-life",
    "/tournament",
  ]) {
    await page.goto(base + route, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(700);

    // Only inspect the stage: the move BUTTONS legitimately say "Lean in".
    const leaks = await page.evaluate((needles) => {
      const stage = document.querySelector(".trust-stage-surface");
      if (!stage) return { note: "no stage on this route" };
      const out = [];
      const seen = new WeakSet();

      const walk = (node, path) => {
        if (node.nodeType === 3) {
          const t = node.textContent || "";
          for (const n of needles)
            if (t.includes(n)) out.push(`${path}: text "${t.trim()}"`);
          return;
        }
        if (node.nodeType !== 1) return;
        if (seen.has(node)) return;
        seen.add(node);
        const el = node;
        for (const attr of el.attributes || []) {
          for (const n of needles)
            if (attr.value.includes(n))
              out.push(`${path}: @${attr.name}="${attr.value}"`);
        }
        for (const child of el.childNodes)
          walk(child, `${path} > ${el.tagName.toLowerCase()}`);
      };
      walk(stage, "stage");
      return { leaks: out };
    }, NEEDLES);

    const phase = await page.evaluate(
      () => document.querySelector(".trust-stage-surface")?.dataset.stagePhase,
    );

    if (leaks.note) {
      console.log(`  ${route}: ${leaks.note}`);
      continue;
    }
    if (leaks.leaks.length) {
      failures += leaks.leaks.length;
      console.log(`✗ ${route} (phase=${phase}) leaks a move:`);
      leaks.leaks.forEach((l) => console.log(`    ${l}`));
    } else {
      console.log(`✓ ${route} (phase=${phase}) clean`);
    }
  }

  await browser.close();
  process.exit(failures ? 1 : 0);
})();
