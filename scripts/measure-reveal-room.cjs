// Measure the reveal on a phone-class profile, so S1 criterion 2 has a number.
//
//   npm run build
//   npm run preview                 # serves dist/ on :4173, in a second terminal
//   npm run measure:reveal-room
//   MEASURE_STRICT=1 npm run measure:reveal-room   # exit 1 if a bar is missed
//
// WHAT THIS IS, EXACTLY. There is no Android device on this machine, so this is
// a calibrated throttle, not a phone: Chrome's own CPU throttling (the same
// mechanism behind DevTools' "4x slowdown", which is how a mid-range device is
// approximated), a phone-class viewport and DPR, and slow-4G network emulation.
// It measures the reveal through the PRODUCTION build, because dev-mode React is
// not what a phone runs.
//
// WHAT IT DOES NOT PROVE. CDP CPU throttling does not slow the GPU, so the
// midrange profile still draws on this Mac's GPU. The `midrange-software-gl`
// profile is the answer to that: it forces SwiftShader, a software rasteriser
// far slower than any phone's Adreno or Mali, and is therefore a conservative
// bound — if the reveal holds there, the GPU is not the constraint. A thermal
// envelope and a real driver remain unmeasured until someone runs a device
// trace; see design.md section 12.
//
// The room has to actually carry the reveal or the numbers are worthless, so
// every round asserts it (a throttled run that quietly fell back to the 2D stage
// would otherwise report flattering numbers for the wrong renderer).
//
// Output: a table on stdout, plus JSON under e2e/perf/ (gitignored — regenerate,
// never commit; AGENTS.md).
const fs = require("node:fs");
const path = require("node:path");

const { chromium } = require("@playwright/test");

const BASE = process.env.MEASURE_BASE_URL || "http://localhost:4173";
const STRICT = process.env.MEASURE_STRICT === "1";
const OUT_DIR = path.join(__dirname, "..", "e2e", "perf");

/**
 * The bar the reveal is judged against on a phone-class profile. 60 fps is the
 * desktop target (design.md section 12); the mobile question is whether the
 * reveal still reads as an animation rather than a stutter, so the bar is a
 * floor, not the desktop figure.
 */
const BAR = {
  medianFrameMs: 33.3, // median at least 30 fps
  p95FrameMs: 50, // only the tail may be slower than the floor
  worstFrameMs: 100, // no visible freeze
  worstLongTaskMs: 200, // nothing that blocks input into a stall
  setupMs: 250, // the room's first frame, from the tap, under throttle
};

const PROFILES = [
  {
    name: "desktop",
    note: "this Mac, unthrottled — the reference the recorded 60 fps was measured on",
    viewport: { width: 1440, height: 900 },
    dpr: 1,
    cpu: 1,
    mobile: false,
    network: null,
    softwareGl: false,
    gate: true,
  },
  {
    name: "midrange",
    note: "CPU 4x, 412x915 DPR 2.625, slow 4G — a mid-range phone, approximated",
    viewport: { width: 412, height: 915 },
    dpr: 2.625,
    cpu: 4,
    mobile: true,
    network: "slow4G",
    softwareGl: false,
    gate: true,
  },
  {
    // SwiftShader is a CPU rasteriser, and a phone's Adreno or Mali is not — so
    // this is not a bar the reveal should be made to pass, because passing or
    // failing it says nothing about a phone. It is kept because of what it
    // measures instead: run at two pixel counts it says whether the cost is
    // pixels or work, which is what decides the lever if a device does struggle
    // (the room already caps DPR at 2 — `RevealRoom.tsx`).
    name: "software-gl-dpr2",
    note: "software rasteriser at capped DPR 2 — diagnostic: what it says is that the cost is NOT pixels",
    viewport: { width: 412, height: 915 },
    dpr: 2,
    cpu: 4,
    mobile: true,
    network: "slow4G",
    softwareGl: true,
    gate: false,
  },
  {
    name: "software-gl-dpr1",
    note: "same scene at DPR 1 — a quarter of the pixels; read it against the line above",
    viewport: { width: 412, height: 915 },
    dpr: 1,
    cpu: 4,
    mobile: true,
    network: "slow4G",
    softwareGl: true,
    gate: false,
  },
];

const SLOW_4G = {
  offline: false,
  downloadThroughput: (400 * 1000) / 8, // 400 kbps
  uploadThroughput: (400 * 1000) / 8,
  latency: 400,
};

const MOBILE_UA =
  "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36";

/** Frames, phase changes, room readiness and long tasks, for the whole run. */
const SAMPLER = `
window.__perf = { frames: [], phases: [], room: [], longTasks: [] };

try {
  // Anything over 50ms blocks input. Recorded, so a stutter is attributable to
  // the main thread rather than guessed at from frame deltas alone.
  new PerformanceObserver((list) => {
    for (const e of list.getEntries()) {
      window.__perf.longTasks.push({
        start: Math.round(e.startTime),
        duration: Math.round(e.duration),
      });
    }
  }).observe({ type: "longtask", buffered: true });
} catch (e) {
  /* An engine without the longtask type: the frame trace still stands. */
}

const sample = () => {
  const t = performance.now();
  const stage = document.querySelector(".trust-stage-surface");
  window.__perf.frames.push(t);
  window.__perf.phases.push(stage?.dataset.stagePhase ?? null);
  window.__perf.room.push(!!document.querySelector(".reveal-room-canvas canvas"));
  requestAnimationFrame(sample);
};
requestAnimationFrame(sample);

window.__perfRenderer = () => {
  try {
    const canvas = document.querySelector(".reveal-room-canvas canvas");
    if (!canvas) return null;
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
    const ext = gl?.getExtension("WEBGL_debug_renderer_info");
    return {
      renderer: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : "unknown renderer",
      // What the GPU is actually asked to fill: RevealRoom.tsx caps its pixel
      // ratio, so this is the real budget, not the CSS size.
      surface: canvas.width + " x " + canvas.height,
      surfacePixels: canvas.width * canvas.height,
      cssRatio: Math.round((window.devicePixelRatio || 1) * 100) / 100,
    };
  } catch (e) {
    return null;
  }
};
`;

const round2 = (n) => Math.round(n * 100) / 100;
const pct = (values, p) => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(
    sorted.length - 1,
    Math.floor((p / 100) * sorted.length),
  );
  return sorted[index];
};

/**
 * One reveal, split where it actually splits: the work before the room's first
 * frame is on screen (chunk already loaded, scene built, four programs
 * compiled) and is a one-off start-up cost — the reveal begins a beat later,
 * but nothing stutters. Everything after that first frame is the choreography a
 * person watches, and that is where frame pacing is the question.
 */
function analyseWindow(sample, from, to) {
  const firstIndex = sample.phases.findIndex(
    (phase, i) => sample.room[i] && sample.frames[i] > from,
  );
  const firstRoomFrame = firstIndex > 0 ? sample.frames[firstIndex] : null;
  const setupMs =
    firstRoomFrame === null ? null : round2(firstRoomFrame - from);

  // Frame intervals after the room is on screen. The first one bridges the
  // setup work, so it is excluded from the pacing figures.
  const deltas = [];
  if (firstIndex > 1) {
    for (let i = firstIndex + 1; i < sample.frames.length; i++) {
      const t = sample.frames[i];
      if (t <= from || t > to) continue;
      deltas.push(t - sample.frames[i - 1]);
    }
  }

  const long = sample.longTasks.filter(
    (task) => task.start + task.duration > from && task.start < to,
  );
  const before = long.filter((task) => task.start < (firstRoomFrame ?? from));
  const after = long.filter((task) => task.start >= (firstRoomFrame ?? from));
  const worst = (list) =>
    list.length ? Math.max(...list.map((t) => t.duration)) : 0;

  return {
    frames: deltas.length,
    medianMs: round2(pct(deltas, 50)),
    p95Ms: round2(pct(deltas, 95)),
    worstMs: round2(Math.max(...deltas, 0)),
    fps: deltas.length ? round2(1000 / pct(deltas, 50)) : 0,
    // A 60Hz frame is 16.7ms; past 25ms a vsync was missed, which is the first
    // interval a person can see.
    dropped: deltas.filter((d) => d > 25).length,
    roomMountMs: setupMs,
    setupLongestTaskMs: worst(before),
    choreographyLongestTaskMs: worst(after),
    longTasks: long.length,
    longestTaskMs: worst(long),
  };
}

/** One reveal, timed. */
async function revealRound(page, round) {
  await page.getByRole("button", { name: round.move, exact: true }).click();
  await page.waitForTimeout(800);
  await page.evaluate(() => {
    window.__perf.frames.length = 0;
    window.__perf.phases.length = 0;
    window.__perf.room.length = 0;
    window.__perf.longTasks.length = 0;
  });
  const from = await page.evaluate(() => performance.now());
  await page
    .getByRole("button", { name: "Reveal both choices", exact: true })
    .click();
  // The choreography is 950ms and app state settles ~150ms after it, so this
  // window covers the whole reveal and nothing else.
  await page.waitForTimeout(2000);
  const to = await page.evaluate(() => performance.now());
  const sample = await page.evaluate(() => ({
    frames: window.__perf.frames,
    phases: window.__perf.phases,
    room: window.__perf.room,
    longTasks: window.__perf.longTasks,
  }));
  return analyseWindow(sample, from, to);
}

async function measureProfile(browser, profile) {
  const context = await browser.newContext({
    viewport: profile.viewport,
    deviceScaleFactor: profile.dpr,
    isMobile: profile.mobile,
    hasTouch: profile.mobile,
    userAgent: profile.mobile ? MOBILE_UA : undefined,
  });
  const page = await context.newPage();
  await page.addInitScript(SAMPLER);

  const cdp = await context.newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: profile.cpu });
  if (profile.network) {
    await cdp.send("Network.enable");
    await cdp.send("Network.emulateNetworkConditions", SLOW_4G);
  }

  await page.goto(BASE + "/?room=on", { waitUntil: "domcontentloaded" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1500);

  // Which GPU answered. Read during a reveal: before the first one the room is
  // not mounted, so there is no canvas to ask.
  let renderer = null;

  const rounds = [];
  for (const [i, round] of [
    { move: "Lean in" },
    { move: "Lean in" },
    { move: "Lean in" },
  ].entries()) {
    const result = await revealRound(page, round);
    // The measurement is worthless if the fallback carried the reveal.
    const carried = await page.evaluate(
      () => !!document.querySelector(".reveal-room-canvas canvas"),
    );
    result.carriedByRoom = carried;
    if (carried && !renderer) {
      renderer = await page.evaluate(() => window.__perfRenderer());
    }
    rounds.push(result);
    if (i < 2) {
      await page.getByRole("button", { name: "Play another round" }).click();
      await page.waitForTimeout(500);
    }
  }

  await context.close();
  const all = rounds.filter((r) => r.frames > 0);
  const merged = {
    rounds: all.length,
    frames: all.reduce((n, r) => n + r.frames, 0),
    // Pace is reported over the worst round as well as the median round: a
    // reveal that stutters once in three is not a smooth reveal.
    medianMs: round2(
      pct(
        all.map((r) => r.medianMs),
        50,
      ),
    ),
    p95Ms: Math.max(...all.map((r) => r.p95Ms)),
    worstMs: Math.max(...all.map((r) => r.worstMs)),
    fps: round2(
      pct(
        all.map((r) => r.fps),
        50,
      ),
    ),
    dropped: all.reduce((n, r) => n + r.dropped, 0),
    roomMountMs: round2(
      pct(
        all.filter((r) => r.roomMountMs !== null).map((r) => r.roomMountMs),
        50,
      ),
    ),
    setupLongestTaskMs: Math.max(...all.map((r) => r.setupLongestTaskMs)),
    choreographyLongestTaskMs: Math.max(
      ...all.map((r) => r.choreographyLongestTaskMs),
    ),
    longTasks: all.reduce((n, r) => n + r.longTasks, 0),
  };

  const failures = [];
  if (!rounds.every((r) => r.carriedByRoom)) {
    failures.push(
      "the 2D fallback carried at least one reveal — this is not a room measurement",
    );
  }
  // A diagnostic profile is measured for what it says, not to be passed, so its
  // findings are reported and decide nothing. The room-mount check above still
  // applies: a diagnostic of the wrong renderer is worthless too.
  if (!profile.gate) return { profile, renderer, rounds, merged, failures };
  if (!merged.frames)
    failures.push("no frames were sampled after the room's first frame");
  if (merged.medianMs > BAR.medianFrameMs) {
    failures.push(
      `median frame ${merged.medianMs}ms is over the ${BAR.medianFrameMs}ms floor`,
    );
  }
  if (merged.p95Ms > BAR.p95FrameMs) {
    failures.push(
      `p95 frame ${merged.p95Ms}ms is over the ${BAR.p95FrameMs}ms bar`,
    );
  }
  if (merged.worstMs > BAR.worstFrameMs) {
    failures.push(
      `worst frame ${merged.worstMs}ms is over the ${BAR.worstFrameMs}ms bar`,
    );
  }
  if (merged.choreographyLongestTaskMs > BAR.worstLongTaskMs) {
    failures.push(
      `longest main-thread task during the choreography ${merged.choreographyLongestTaskMs}ms is over the ${BAR.worstLongTaskMs}ms bar`,
    );
  }
  if (merged.roomMountMs > BAR.setupMs) {
    failures.push(
      `the room's first frame took ${merged.roomMountMs}ms to arrive, over the ${BAR.setupMs}ms bar`,
    );
  }

  return { profile, renderer, rounds, merged, failures };
}

(async () => {
  try {
    await fetch(BASE, { signal: AbortSignal.timeout(3000) });
  } catch {
    console.error(
      `\n✗ Nothing serving at ${BASE}.\n  This measures the production build:\n    npm run build && npm run preview\n`,
    );
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const results = [];
  let failures = 0;

  for (const profile of PROFILES) {
    // Software GL needs its own browser: the flag is a launch argument.
    const browser = await chromium.launch({
      channel: "chrome",
      args: profile.softwareGl
        ? [
            "--use-gl=angle",
            "--use-angle=swiftshader",
            "--enable-unsafe-swiftshader",
          ]
        : [],
    });
    try {
      const result = await measureProfile(browser, profile);
      results.push(result);
      const m = result.merged;
      console.log(`\n${profile.name} — ${profile.note}`);
      console.log(
        `  renderer: ${result.renderer?.renderer ?? "not reported"}${
          result.renderer
            ? ` | surface ${result.renderer.surface} (${Math.round(result.renderer.surfacePixels / 10000) / 100} Mpx) | device ratio ${result.renderer.cssRatio}`
            : ""
        }`,
      );
      console.log(
        `  choreography: ${m.frames} frames over ${m.rounds} reveal(s) | median ${m.medianMs}ms (${m.fps} fps) | p95 ${m.p95Ms}ms | worst ${m.worstMs}ms | missed vsyncs ${m.dropped}`,
      );
      console.log(
        `  start-up: room's first frame ${m.roomMountMs}ms after the tap | longest task before it ${m.setupLongestTaskMs}ms, during the choreography ${m.choreographyLongestTaskMs}ms`,
      );
      for (const failure of result.failures) {
        console.log(`  ${profile.gate ? "✗" : "·"} ${failure}`);
      }
      if (!profile.gate) console.log("  (diagnostic — reported, not gated)");
      failures += profile.gate ? result.failures.length : 0;
      fs.writeFileSync(
        path.join(OUT_DIR, `reveal-room-${profile.name}.json`),
        JSON.stringify(
          { measured: new Date().toISOString(), base: BASE, ...result },
          null,
          2,
        ),
      );
    } finally {
      await browser.close();
    }
  }

  console.log(
    `\nbar: median ≤ ${BAR.medianFrameMs}ms, p95 ≤ ${BAR.p95FrameMs}ms, worst frame ≤ ${BAR.worstFrameMs}ms, ` +
      `longest choreography task ≤ ${BAR.worstLongTaskMs}ms, first frame ≤ ${BAR.setupMs}ms`,
  );

  if (failures) {
    console.error(
      `\n✗ ${failures} finding(s). ${STRICT ? "MEASURE_STRICT=1 set." : "Set MEASURE_STRICT=1 to gate."}\n`,
    );
    process.exit(1);
  }
  console.log("✓ every profile held the bar\n");
})();
