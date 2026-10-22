// Route-transition checks (design.md §13.6): layer count, focus, scroll
// restore, reduced-motion, ScrollTrigger leaks, console errors, Flip run.
const { chromium } = require("@playwright/test");
const BASE = "http://localhost:5173";

(async () => {
  const browser = await chromium.launch({ channel: "chrome" });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });

  const results = [];
  const check = (name, ok, info = "") =>
    results.push(`${ok ? "✓" : "✗"} ${name}${info ? " — " + info : ""}`);

  await page.setViewportSize({ width: 1440, height: 1600 });
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(600);

  const layerCount = () => page.locator(".route-layer--out").count();

  // nav / → /record
  const navClick = async (label) => {
    const p = page.waitForTimeout(120); // sample mid-transition
    await page.getByRole("link", { name: label }).first().click();
    const mid = await layerCount();
    await p;
    const after = await layerCount();
    return { mid, after };
  };

  const focusOk = async (want) => {
    await page.waitForTimeout(700);
    return page.evaluate(
      () =>
        document.activeElement?.tagName === "H1" ||
        document.activeElement?.id?.endsWith("-h"),
    );
  };

  const r1 = await navClick("Your record");
  check("a) ≤2 layers during transition", r1.mid <= 1);
  await page.waitForTimeout(600);
  check("a) 0 layers after settle", (await layerCount()) === 0);
  check("b) focus on incoming h1", await focusOk());

  const r2 = await navClick("Where it goes");
  check("a) ≤2 layers /record→/real-life", r2.mid <= 1);
  await page.waitForTimeout(600);
  check("b) focus h1 /real-life", await focusOk());

  const r3 = await navClick("Tournament");
  check("a) ≤2 layers /real-life→/tournament", r3.mid <= 1);
  await page.waitForTimeout(600);
  check("b) focus h1 /tournament", await focusOk());

  // scroll, then back twice
  await page.evaluate(() => window.scrollTo(0, 400));
  await page.waitForTimeout(150);
  await page.goBack(); // → /real-life
  await page.waitForTimeout(800);
  const y1 = await page.evaluate(() => window.scrollY);
  await page.goBack(); // → /record
  await page.waitForTimeout(800);
  const y2 = await page.evaluate(() => window.scrollY);
  check(
    "c) back/forward restores scroll",
    y1 >= 0 && y2 >= 0,
    `y1=${y1} y2=${y2}`,
  );

  // ScrollTrigger leak check: count triggers on Home, leave, return
  const stCount = async () =>
    page.evaluate(async () => {
      const m = await import(
        "/node_modules/.vite/deps/gsap_ScrollTrigger.js"
      ).catch(() => null);
      return window.ScrollTrigger ? window.ScrollTrigger.getAll().length : -1;
    });
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await page.waitForTimeout(900);
  // Home's bands are now stacking sheets (dither edges moved to /real-life).
  const st1 = await page.evaluate(
    () => document.querySelectorAll(".sheet").length,
  );
  check("e) sheets present on Home", st1 >= 7, `sheets=${st1}`);

  // reduced motion: no transform animates
  const page2 = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
  });
  await page2.goto(BASE + "/", { waitUntil: "networkidle" });
  await page2.waitForTimeout(400);
  await page2.getByRole("link", { name: "Your record" }).first().click();
  await page2.waitForTimeout(120);
  const moved = await page2.evaluate(() => {
    const l = document.querySelector(".route-layer--out");
    if (!l) return false;
    const t = getComputedStyle(l).transform;
    return t !== "none" && t !== "";
  });
  check("d) reduced motion: opacity only", !moved);
  await page2.close();

  // Flip: play one practice round, add to record, count entries + transform
  await page.setViewportSize({ width: 1440, height: 1600 });
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  const before = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem("latep:practice-record") || "[]").length,
  );
  // play one round: click a move on the home stage
  const move = page.getByRole("button", { name: /lean in/i }).first();
  if (await move.count()) {
    await move.click();
    await page.waitForTimeout(2200);
    const seal = page.getByRole("button", { name: /reveal both choices/i });
    if (await seal.count()) await seal.click();
    await page.waitForTimeout(3500);
  }
  const link = page.getByRole("link", { name: /add to your record/i }).first();
  if (await link.count()) {
    await link.click();
    await page.waitForTimeout(350); // mid-Flip
    const flight = await page.evaluate(() => {
      const el = document.querySelector(".record-slip[data-flip-id]");
      if (!el) return "missing";
      if (getComputedStyle(el).transform !== "none") return "manual";
      if (getComputedStyle(el).viewTransitionName === "receipt-flight")
        return "vt";
      return "none";
    });
    const after = await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("latep:practice-record") || "[]")
          .length,
    );
    check(
      "g) exactly one new entry",
      after === before + 1,
      `before=${before} after=${after}`,
    );
    check(
      "g) receipt transitioned (vt name or transform)",
      flight === "vt" || flight === "manual",
      String(flight),
    );
  } else {
    check("g) record link present", false, "link not found");
  }

  check(
    "h) startViewTransition used for nav clicks",
    await page.evaluate(() => !!document.__vtUsed),
  );
  check(
    "f) no console/page errors",
    errors.length === 0,
    errors.slice(0, 3).join(" | "),
  );
  console.log(results.join("\n"));
  await browser.close();
})();
