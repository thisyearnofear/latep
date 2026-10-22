// Regenerate the dither-edge fallback (design.md §13.6). Writes the same
// Bayer-thresholded ramp the runtime bake draws — keep the two in sync.
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("@playwright/test");

const OUT = path.join(__dirname, "..", "public", "assets", "dither");

async function main() {
  const browser = await chromium.launch({ channel: "chrome" });
  const page = await browser.newPage();
  const dataUrl = await page.evaluate(() => {
    const CELL = 4,
      COLS = 16,
      ROWS = 12;
    const BAYER = [
      [0, 8, 2, 10],
      [12, 4, 14, 6],
      [3, 11, 1, 9],
      [15, 7, 13, 5],
    ];
    const canvas = document.createElement("canvas");
    canvas.width = COLS * CELL;
    canvas.height = ROWS * CELL;
    const ctx = canvas.getContext("2d");
    for (let y = 0; y < ROWS; y++) {
      const t = y / (ROWS - 1);
      for (let x = 0; x < COLS; x++) {
        if (t + 0.5 / ROWS >= BAYER[y % 4][x % 4] / 16) {
          ctx.fillStyle = "#000";
          ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
        }
      }
    }
    return canvas.toDataURL("image/png");
  });
  await browser.close();
  fs.mkdirSync(OUT, { recursive: true });
  const file = path.join(OUT, "edge.png");
  fs.writeFileSync(file, Buffer.from(dataUrl.split(",")[1], "base64"));
  console.log(`wrote ${file} (${fs.statSync(file).size} bytes)`);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
