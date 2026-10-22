const { chromium } = require("@playwright/test");
const sharp = require("sharp");

// sRGB -> OKLCH (hue/chroma) for bloom sampling
function oklch(r, g, b) {
  const f = (v) =>
    v / 255 <= 0.04045
      ? v / 255 / 12.92
      : Math.pow((v / 255 + 0.055) / 1.055, 2.4);
  const [lr, lg, lb] = [f(r), f(g), f(b)];
  const l = Math.cbrt(0.4122 * lr + 0.5363 * lg + 0.0514 * lb);
  const m = Math.cbrt(0.2119 * lr + 0.6807 * lg + 0.1074 * lb);
  const s = Math.cbrt(0.0883 * lr + 0.2817 * lg + 0.6299 * lb);
  const L = 0.2105 * l + 0.7937 * m - 0.0937 * s;
  const A = 1.9779 * l - 2.4286 * m + 0.4507 * s;
  const B = 0.0257 * l + 0.7828 * m - 0.8085 * s;
  return {
    L,
    C: Math.sqrt(A * A + B * B),
    h: (Math.atan2(B, A) * 180) / Math.PI,
  };
}

(async () => {
  const w = parseInt(process.argv[2] || "1440");
  const browser = await chromium.launch({ channel: "chrome" });
  const page = await browser.newPage({ viewport: { width: w, height: 900 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.goto("http://localhost:5173/?hero=on", {
    waitUntil: "networkidle",
  });
  await page.waitForTimeout(4000);
  const state = await page.evaluate(
    () => document.querySelector(".desk-hero")?.dataset.state,
  );
  const check = await page.evaluate(() => {
    const host = document.querySelector(".desk-hero");
    const sc = host.__heroScene;
    if (!sc) return null;
    const band = host.getBoundingClientRect();
    const P = (k) => sc.project(sc.anchors[k]);
    const out = { bandH: Math.round(band.height) };
    for (const who of ["maria", "partner"]) {
      const head = P(who + "Head"),
        neck = P(who + "Neck"),
        hip = P(who + "Hip");
      const hp = sc.anchors[who + "Hip"];
      const feetY = sc.project({ x: hp.x, y: 0, z: hp.z }).y;
      out[who] = {
        headNeckGapPx: Math.round(
          neck.y - head.y - (0.1 / (2 * 1.22)) * band.height,
        ), // head bottom to neck
        figHeightPx: Math.round(feetY - (head.y - (0.1 / 2.9) * band.height)), // top of head ~0.1 above centre
        bandPct: 0,
      };
      out[who].figHeightPx = Math.round(
        feetY - head.y + (0.1 / 2.9) * band.height,
      );
      out[who].bandPct = Math.round((100 * out[who].figHeightPx) / band.height);
    }
    return out;
  });
  await page.screenshot({ path: `e2e/shots/${w}/hero-final.png` });
  const hero = await page.locator(".home-hero").boundingBox();
  await page.screenshot({ path: `e2e/shots/${w}/hero-band.png`, clip: hero });
  console.log(
    w,
    "state:",
    state,
    "check:",
    JSON.stringify(check),
    "errors:",
    errors,
  );
  await browser.close();

  // bloom hue sampling on the band clip
  const { data, info } = await sharp(`e2e/shots/${w}/hero-band.png`)
    .raw()
    .toBuffer({ resolveWithObject: true });
  const C = info.channels;
  const smp = (fx, fy) => {
    const i =
      (Math.floor(fy * info.height) * info.width +
        Math.floor(fx * info.width)) *
      C;
    return oklch(data[i], data[i + 1], data[i + 2]);
  };
  // bloom centres (uv): clay (0.34,0.62) & (0.50,0.22), sage (0.66,0.52) — uv.y measured top-down in the quad; vUv origin is bottom-left
  for (const [name, fx, fy] of [
    ["clay1", 0.34, 0.62],
    ["sage", 0.66, 0.52],
    ["clay3", 0.5, 0.22],
  ]) {
    const s = smp(fx, 1 - fy);
    console.log(
      `bloom ${name}: L=${s.L.toFixed(2)} C=${s.C.toFixed(3)} h=${s.h.toFixed(0)}deg`,
    );
  }
})();
