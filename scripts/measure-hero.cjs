const { chromium } = require("@playwright/test");
const BASE = "http://localhost:4173";

async function measure(url, throttle) {
  const browser = await chromium.launch({ channel: "chrome" });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const cdp = await page.context().newCDPSession(page);
  if (throttle) await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  await page.addInitScript(() => {
    window.__lcp = { v: 0, el: "" };
    window.__long = [];
    new PerformanceObserver((l) => {
      const e = l.getEntries().at(-1);
      if (e)
        window.__lcp = {
          v: e.startTime,
          el: e.element?.tagName + "." + (e.element?.className || ""),
        };
    }).observe({ type: "largest-contentful-paint", buffered: true });
    new PerformanceObserver((l) => {
      for (const e of l.getEntries())
        window.__long.push([Math.round(e.startTime), Math.round(e.duration)]);
    }).observe({ type: "longtask", buffered: true });
  });
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(9000);
  const lcp = await page.evaluate(() => window.__lcp);
  const long = await page.evaluate(() =>
    window.__long.filter(([, d]) => d > 50),
  );
  const canvases = await page.evaluate(
    () => document.querySelectorAll("canvas").length,
  );
  await browser.close();
  return {
    lcp: Math.round(lcp.v),
    el: String(lcp.el).slice(0, 60),
    long,
    canvases,
  };
}
(async () => {
  console.log(
    "hero=off :",
    JSON.stringify(await measure(BASE + "/?hero=off", true)),
  );
  console.log(
    "hero=on  :",
    JSON.stringify(await measure(BASE + "/?hero=on", true)),
  );
})();
