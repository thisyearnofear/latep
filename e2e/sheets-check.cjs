// WCAG 2.4.11 check: tab through all of Home; at each focus the focused
// element's centre must resolve (elementFromPoint) to itself or a descendant —
// never obscured by a covering sheet.
const { chromium } = require("@playwright/test");

const BASE = "http://localhost:5173";

async function reveal(el, page) {
  const hit = () =>
    el.evaluate((e) => {
      const r = e.getBoundingClientRect();
      const cy = Math.min(Math.max(r.top + r.height / 2, 0), innerHeight - 1);
      const at = document.elementFromPoint(r.left + r.width / 2, cy);
      return at === e || e.contains(at) || (at && at.contains(e));
    });
  await el.evaluate((e) => e.scrollIntoView({ block: "center" }));
  await page.waitForTimeout(60);
  if (await hit()) return true;
  // The uncovered window sits where the element's own sheet is topmost —
  // scan the scroll range (like a reader scrubbing) until hit-testing
  // reaches it.
  const max = await page.evaluate(
    () => document.documentElement.scrollHeight - innerHeight,
  );
  for (let y = 0; y <= max; y += 100) {
    await page.evaluate((yy) => scrollTo(0, yy), y);
    await page.waitForTimeout(20);
    // Fresh evaluate each step — the locator re-resolves the node, which
    // React may replace during round-state updates.
    if (await hit()) return true;
  }
  return false;
}

async function reveal(el, page) {
  // scrollIntoView maps to the element's flow position, which can sit inside
  // a later sheet's coverage zone; a reader scrolls until it's revealed.
  for (let i = 0; i < 60; i++) {
    const st = await el.evaluate((e) => {
      const r = e.getBoundingClientRect();
      const cy = Math.min(Math.max(r.top + r.height / 2, 0), innerHeight - 1);
      const at = document.elementFromPoint(r.left + r.width / 2, cy);
      return {
        hit: at === e || e.contains(at) || (at && at.contains(e)),
        inView: r.top >= 0 && r.bottom <= innerHeight,
        top: r.top,
      };
    });
    if (st.hit && st.inView) return true;
    // scroll toward putting the element mid-viewport, favouring the window
    // where its sheet is on top (scroll down a touch each pass)
    await el.evaluate((e) => e.scrollIntoView({ block: "center" }));
    await page.waitForTimeout(60);
    const hit2 = await el.evaluate((e) => {
      const r = e.getBoundingClientRect();
      const at = document.elementFromPoint(
        r.left + r.width / 2,
        Math.min(Math.max(r.top + r.height / 2, 0), innerHeight - 1),
      );
      return at === e || e.contains(at) || (at && at.contains(e));
    });
    if (hit2) return true;
    await page.evaluate(() => scrollBy(0, -160));
    await page.waitForTimeout(60);
  }
  return false;
}
module.exports = { reveal };

(async () => {
  const browser = await chromium.launch({ channel: "chrome" });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto("http://localhost:5173/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);

  // tab through the page; after each Tab assert visibility of the focused el
  let bad = [];
  let tabs = 0;
  for (let i = 0; i < 80; i++) {
    await page.keyboard.press("Tab");
    tabs++;
    await page.waitForTimeout(450);
    const r = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      const rect = el.getBoundingClientRect();
      if (!rect.width && !rect.height) return null;
      const cx = rect.left + rect.width / 2;
      const cy = Math.min(
        Math.max(rect.top + rect.height / 2, 0),
        innerHeight - 1,
      );
      const at = document.elementFromPoint(cx, cy);
      // Visually-hidden controls (the demo's sr-only checkbox) are covered
      // by their own visible label by design — skip them.
      const cs = getComputedStyle(el);
      if (el.tagName === "INPUT" && rect.height <= 2) return null; // sr-only control
      const visible = at === el || el.contains(at) || (at && at.contains(el));
      return visible
        ? null
        : `${el.tagName}.${String(el.className).slice(0, 50)} covered by ${at?.tagName}.${String(at?.className).slice(0, 40)}`;
    });
    if (r) bad.push(r);
  }
  console.log(`tabs=${tabs}`);
  console.log(
    bad.length
      ? `✗ covered focus:\n${bad.slice(0, 8).join("\n")}`
      : "✓ every focused element visible (elementFromPoint)",
  );
  console.log(
    errors.length
      ? `✗ errors: ${errors.slice(0, 3).join(" | ")}`
      : "✓ no page errors",
  );

  // -- Clickability + flow-sheet reachability --------------------------------
  // data-sheet="flow" holds operable content — every control must be
  // reachable by a plain scrollIntoView (a sheet is never covered).
  let clickFailures = 0;
  for (const vw of [1440, 390]) {
    const p2 = await browser.newPage({ viewport: { width: vw, height: 900 } });
    await p2.goto(BASE + "/?hero=off", { waitUntil: "networkidle" });
    // The app's global scroll-behavior:smooth makes every scrollIntoView
    // animate — Playwright hit-tests mid-animation against covered spots
    // and retries forever. Tests scroll instantly.
    await p2.addStyleTag({
      content: "html { scroll-behavior: auto !important }",
    });
    await p2.waitForTimeout(2400);
    const before = await p2.evaluate(
      () =>
        JSON.parse(localStorage.getItem("latep:practice-record") || "[]")
          .length,
    );
    for (let round = 0; round < 3; round++) {
      const lean = p2.getByRole("button", { name: /lean in/i }).first();
      if (!(await lean.count())) {
        console.log(`  round ${round + 1}: no lean-in — skipping`);
        break;
      }
      await lean.evaluate((e) => e.scrollIntoView({ block: "center" }));
      await p2.waitForTimeout(500);
      await lean.click({ timeout: 8000 });
      await p2.waitForTimeout(2200);
      const seal = p2.getByRole("button", { name: /reveal both choices/i });
      if (await seal.count()) {
        await seal.evaluate((e) => e.scrollIntoView({ block: "center" }));
        await p2.waitForTimeout(500);
        await seal.click();
      }
      await p2.waitForTimeout(3600);
      const again = p2.getByRole("button", {
        name: "Play another round",
        exact: true,
      });
      if (round < 2) {
        if (!(await again.count())) {
          console.log(`  round ${round + 1}: no replay button`);
          clickFailures++;
          break;
        }
        await again.evaluate((e) => e.scrollIntoView({ block: "center" }));
        await p2.waitForTimeout(500);
        await again.click({ timeout: 8000 });
        await p2.waitForTimeout(700);
      }
    }
    const rec = p2.getByRole("link", { name: /add to your record/i });
    if (await rec.count()) {
      await rec.evaluate((e) => e.scrollIntoView({ block: "center" }));
      await p2.waitForTimeout(500);
      await rec.click();
      await p2.waitForTimeout(900);
      const entries = await p2.evaluate(
        () =>
          JSON.parse(localStorage.getItem("latep:practice-record") || "[]")
            .length,
      );
      // one new practice entry per round — three rounds played
      const ok = entries === before + 3;
      console.log(
        `${ok ? "✓" : "✗"} record click → +${entries - before} entries @${vw}px`,
      );
      if (!ok) clickFailures++;
    }
    // flow-sheet controls: scrollIntoView centre → elementFromPoint hits
    const covered = await p2.evaluate(async () => {
      const bad = [];
      for (const e of document.querySelectorAll(
        '[data-sheet="flow"] button, [data-sheet="flow"] a[href], [data-sheet="flow"] input, [data-sheet="flow"] summary',
      )) {
        const cs = getComputedStyle(e),
          r0 = e.getBoundingClientRect();
        if (
          cs.visibility === "hidden" ||
          cs.display === "none" ||
          (!r0.width && !r0.height) ||
          (e.tagName === "INPUT" && r0.height <= 2)
        )
          continue;
        e.scrollIntoView({ block: "center" });
        await new Promise((res) => setTimeout(res, 30));
        const r = e.getBoundingClientRect();
        const at = document.elementFromPoint(
          r.left + r.width / 2,
          Math.min(Math.max(r.top + r.height / 2, 0), innerHeight - 1),
        );
        if (!(at === e || e.contains(at) || (at && at.contains(e))))
          bad.push(
            e.tagName +
              "." +
              String(e.className).slice(0, 40) +
              " " +
              (e.textContent || "").slice(0, 30),
          );
      }
      return bad;
    });
    if (covered.length) {
      console.log(
        `✗ covered controls @${vw}px:\n  ${covered.slice(0, 6).join("\n  ")}`,
      );
      clickFailures += covered.length;
    } else console.log(`✓ all flow-sheet controls reachable @${vw}px`);
    await p2.close();
  }
  await browser.close();
  process.exit(bad.length || errors.length || clickFailures ? 1 : 0);
})();
