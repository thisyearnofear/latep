// Keep the two reveal stages honest about the same two things:
//
//   1. Trust height. The 2D stage (`visual/TrustStage.tsx`) and the reveal room
//      (`reveal-room/RevealRoom.tsx`) must draw the same number of turns for the
//      same round, must not move that count when app state settles the round a
//      beat after the reveal starts, and must draw no braid at all for a thread
//      that is not `twisted`.
//   2. One reveal. The choreography must write nothing once the phase flips to
//      `outcome`; keyed to the raw phase, the 2D stage replayed the whole
//      tear/pose/thread/stamp sequence under the reader.
//
//   npm run dev                     # in one terminal
//   npm run check:stage-parity      # in another
//
// The twist count is measured OFF THE DRAWING, never from the props: the SVG
// polyline the 2D stage prints, and the TubeGeometry three builds for the room,
// read through three's own devtools hook. A check that compared
// `drawnTwists()` calls would pass while both stages drew the same wrong thing,
// which is the bug this exists to catch.
//
// The practice round is deterministic — the partner mirrors your previous move —
// so the fixed sequence below always visits Held, Held, taken, standoff, dropped,
// and with them printed heights 0 -> 1 -> 2 -> 0 -> 0 -> 0.
//
// Exits 1 on any mismatch. Needs a running `npm run dev`.
const { chromium } = require("@playwright/test");

const BASE = process.env.PARITY_BASE_URL || "http://localhost:5173";
/** content/vocabulary.ts MAX_DRAWN_TWISTS — used only to bound the rule here. */
const MAX_DRAWN_TWISTS = 5;

/** the move you play, the word that must print, the thread that must be drawn */
const ROUNDS = [
  { move: "Lean in", word: "Held", thread: "twisted" },
  { move: "Lean in", word: "Held", thread: "twisted" },
  { move: "Hold back", word: "You took it", thread: "snapped" },
  { move: "Hold back", word: "Standoff", thread: "slack" },
  { move: "Lean in", word: "Dropped", thread: "snapped" },
];

// This runs from CI and from a terminal, where stdout can be closed early
// (piped to `head`, or a runner that stops reading). An EPIPE is not a failure
// of the check, so exit quietly rather than crash.
process.stdout.on("error", (e) => {
  if (e && e.code === "EPIPE") process.exit(0);
  throw e;
});

/**
 * Per-frame sampling, installed before the app loads. Reads the phase, the
 * printed height, the thread state and the drawing itself, and records every
 * style write the reveal choreography makes.
 */
const SAMPLER = `
window.__startSample = (ms) => {
  window.__records = [];
  window.__writes = [];
  window.__canvases = { events: [] };
  const t0 = performance.now();
  window.__t0 = t0;
  // A round's sampler must not keep listening in the next round: without this
  // the previous round's observers push into the new buffer with their own
  // clock, and every late write is attributed to the wrong reveal.
  window.__watch?.disconnect();
  clearInterval(window.__poll);

  // Watched from the first round on and never disconnected: the room builds its
  // renderer inside its effect, so a canvas appearing a second time means that
  // effect re-ran — the scene was rebuilt and the reveal is playing again under
  // the reader. Attached here rather than at load, when there is no document
  // element to observe yet.
  if (!window.__canvasWatch) {
    // The story hero mounts its own WebGL canvas on / for one draw-in and
    // removes it again (design.md §13.5). It is not the room's renderer
    // rebuilding, so canvases it carries are excluded from this count.
    const holdsCanvas = (n) =>
      n.nodeType === 1 &&
      (n.tagName === "CANVAS" || !!n.querySelector?.("canvas")) &&
      !n.querySelector?.("canvas[data-hero]") &&
      !(n.tagName === "CANVAS" && n.dataset?.hero);
    window.__canvasWatch = new MutationObserver((records) => {
      for (const r of records) {
        for (const n of r.addedNodes) {
          if (holdsCanvas(n))
            window.__canvases.events.push({
              kind: "add",
              t: Math.round(performance.now() - window.__t0),
            });
        }
        for (const n of r.removedNodes) {
          if (holdsCanvas(n))
            window.__canvases.events.push({
              kind: "remove",
              t: Math.round(performance.now() - window.__t0),
            });
        }
      }
    });
    window.__canvasWatch.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  }

  // Turns off the 2D drawing. A braid is printed as a polyline of L commands;
  // loose, slack and snapped are curves with no oscillation to count.
  const turnsOfPath = (d) => {
    if (!d) return null;
    if (/[CQ]/.test(d)) return 0;
    const nums = (d.match(/-?\\d+(?:\\.\\d+)?/g) || []).map(Number);
    const ys = [];
    for (let i = 1; i < nums.length; i += 2) ys.push(nums[i]);
    let peaks = 0;
    for (let i = 1; i < ys.length - 1; i++) {
      if (ys[i] > ys[i - 1] + 1e-6 && ys[i] >= ys[i + 1] - 1e-6) peaks++;
    }
    return peaks;
  };

  // Turns off the room's cord: local maxima along z, and the amplitude of that
  // oscillation measured clear of the end points, where a snapped thread lifts a
  // frayed tip. A braid is an oscillation; one frayed tip is not one.
  const cordOf = () => {
    const scenes = window.__scenes || [];
    const scene = scenes[scenes.length - 1];
    if (!scene) return { turns: null, amp: 0, strands: 0 };
    let peaks = 0;
    let amp = 0;
    let strands = 0;
    scene.traverse((o) => {
      const g = o.geometry;
      if (!g || g.type !== "TubeGeometry" || !g.parameters || !g.parameters.path) return;
      strands++;
      const zs = (g.parameters.path.points || []).map((v) => v.z);
      let local = 0;
      for (let i = 1; i < zs.length - 1; i++) {
        if (zs[i] > zs[i - 1] + 1e-7 && zs[i] >= zs[i + 1] - 1e-7) local++;
      }
      const interior = zs.slice(1, -1);
      amp = Math.max(amp, Math.max(...interior) - Math.min(...interior));
      peaks = Math.max(peaks, local);
    });
    return { turns: strands ? (amp > 0.02 ? peaks : 0) : null, amp, strands };
  };

  const seen = new WeakSet();
  const watch = new MutationObserver((records) => {
    for (const r of records) {
      if (r.target.nodeType === 1) window.__writes.push({ t: Math.round(performance.now() - t0) });
    }
  });
  window.__watch = watch;
  const attach = () => {
    const nodes = document.querySelectorAll(
      ".trust-seal-stub, .trust-actor-inner, .trust-thread, .trust-seal-revealed, .reveal-room-plate",
    );
    for (const el of nodes) {
      if (seen.has(el)) continue;
      seen.add(el);
      watch.observe(el, { attributes: true, attributeFilter: ["style"] });
    }
  };
  attach();
  window.__poll = setInterval(attach, 50);

  const tick = () => {
    const stage = document.querySelector(".trust-stage-surface");
    const path = document.querySelector(".trust-thread svg path")?.getAttribute("d") || null;
    const cord = cordOf();
    const inRoom = cord.turns !== null && !!document.querySelector(".reveal-room-canvas");
    window.__records.push({
      t: Math.round(performance.now() - t0),
      phase: stage?.dataset.stagePhase ?? null,
      height: stage?.dataset.trustHeight ?? null,
      thread: stage?.dataset.threadState ?? null,
      renderer: inRoom ? "room" : "2D",
      turns: inRoom ? cord.turns : turnsOfPath(path),
      braided2d: inRoom ? null : !!path && /L/.test(path) && !/[CQ]/.test(path),
    });
    if (performance.now() - t0 < ms) requestAnimationFrame(tick);
    else clearInterval(window.__poll);
  };
  requestAnimationFrame(tick);
};

window.__result = () => ({
  records: window.__records,
  writes: window.__writes,
  canvases: window.__canvases,
});

window.__canvases = { events: [] };
`;

/**
 * The moment the reveal first had something on screen: for the room, the first
 * frame its canvas existed; for the 2D stage, the first revealing frame.
 */
function revealStartedAt(records, renderer) {
  const frame = records.find((r) =>
    renderer === "room" ? r.renderer === "room" : r.phase === "revealing",
  );
  return frame ? frame.t : 0;
}

/** One round, sampled frame by frame from just before the reveal. */
async function playRound(page, round) {
  await page.getByRole("button", { name: round.move, exact: true }).click();
  await page.waitForTimeout(120);
  const heightBefore = Number(
    await page.evaluate(
      () => document.querySelector(".trust-stage-surface")?.dataset.trustHeight,
    ),
  );
  await page.evaluate((ms) => window.__startSample(ms), 2600);
  await page
    .getByRole("button", { name: "Reveal both choices", exact: true })
    .click();
  await page.waitForTimeout(2800);
  const { records, writes, canvases } = await page.evaluate(() =>
    window.__result(),
  );
  const renderer = records.find((r) => r.phase === "outcome")?.renderer ?? "?";
  const builds = canvases.events.filter((e) => e.kind === "add").length;
  const teardowns = canvases.events.filter((e) => e.kind === "remove").length;
  const revealStarted = revealStartedAt(records, renderer);
  // A build within a moment of the scene first appearing is the mount itself —
  // StrictMode builds the scene, tears it down and builds it again in the same
  // tick, before anything is on screen. A build later than that is the reveal
  // being rebuilt while it is running, which is what a replay means here.
  const rebuiltWhileShowing = canvases.events.filter(
    (e) => e.t > revealStarted + 60,
  ).length;

  const drawn = records.filter(
    (r) => r.renderer === renderer && r.turns !== null,
  );
  const unique = (frames) => [...new Set(frames.map((r) => r.turns))];
  const turnsDuring = unique(drawn.filter((r) => r.phase === "revealing"));
  const turnsAfter = unique(drawn.filter((r) => r.phase === "outcome"));

  // The thread printed once the reveal began. `loose` before that is the
  // hidden-move rule, not a disagreement between the stages.
  const revealed = drawn.filter(
    (r) => r.phase === "revealing" || r.phase === "outcome",
  );
  const threads = [...new Set(revealed.map((r) => r.thread))];

  // Which beat app state settled the round. The replay guard is per stage,
  // because the two reveals end at different moments: the 2D sequence is over
  // before the flip, so any write after it is a second pass, while the room's
  // own plate press is still finishing at that moment — there, the signal is
  // the scene being rebuilt, which is what re-running its effect means.
  const flip = records.findIndex(
    (r, i) =>
      i > 0 && r.phase === "outcome" && records[i - 1].phase === "revealing",
  );
  const flipAt = flip > 0 ? records[flip].t : null;
  const writesAfterFlip = writes.filter(
    (w) => flipAt !== null && w.t > flipAt + 40,
  ).length;

  // The rule (design.md section 6): the height this round is earning, or no
  // braid at all for a thread that is not twisted.
  const turns = turnsAfter[0] ?? null;
  const expected =
    round.thread === "twisted"
      ? Math.min(Math.max(heightBefore + 1, 1), MAX_DRAWN_TWISTS)
      : 0;

  // A braid is drawn only where the thread is twisted: a polyline in the SVG, or
  // a real z amplitude in the room.
  const settled = drawn.filter((r) => r.phase === "outcome");
  const braided =
    renderer === "room"
      ? settled.some((r) => r.turns > 0)
      : settled.every((r) => r.braided2d === true);

  const word = await page.evaluate(
    () =>
      document.querySelector(".trust-seal-caption")?.textContent ??
      document.querySelector(".reveal-room-word")?.textContent ??
      "",
  );

  const problems = [];
  if (turnsDuring.length !== 1 || turnsAfter.length !== 1) {
    problems.push(
      `the count is not steady: ${JSON.stringify(turnsDuring)} during the reveal, ${JSON.stringify(turnsAfter)} after it`,
    );
  } else if (turnsDuring[0] !== turnsAfter[0]) {
    problems.push(
      `the count moved at the flip (${turnsDuring[0]} -> ${turnsAfter[0]}); app state settling the round must not move the drawing`,
    );
  } else if (turnsAfter[0] !== expected) {
    problems.push(
      `drew ${turnsAfter[0]} turns where the rule says ${expected} (printed height ${heightBefore})`,
    );
  }
  if (threads.length !== 1) {
    problems.push(
      `printed more than one thread state during the reveal: ${JSON.stringify(threads)}`,
    );
  } else if (threads[0] !== round.thread) {
    problems.push(`printed thread "${threads[0]}", expected "${round.thread}"`);
  }
  if (braided !== (round.thread === "twisted")) {
    problems.push(
      round.thread === "twisted"
        ? "the thread is twisted but no braid was drawn"
        : `drew a braid for a "${round.thread}" thread`,
    );
  }
  if (!word.includes(round.word)) {
    problems.push(`printed "${word.trim()}", expected "${round.word}"`);
  }
  if (renderer === "2D" && writesAfterFlip) {
    problems.push(
      `${writesAfterFlip} style write(s) after the phase flipped at ${flipAt}ms; the 2D sequence ends at ~950ms, so the reveal replayed`,
    );
  }
  if (renderer === "room" && rebuiltWhileShowing) {
    problems.push(
      `the room rebuilt its scene while the reveal was running (${rebuiltWhileShowing} of ${builds} build(s) after ${revealStarted}ms, ${teardowns} teardown(s)); the reveal played again`,
    );
  }

  return {
    renderer,
    turns,
    problems,
    summary:
      `${round.move.padEnd(9)} -> "${word.trim()}" | thread ${threads.join("/")} | ` +
      `height ${heightBefore} -> ${expected} | turns ${JSON.stringify(turnsDuring)} then ` +
      `${JSON.stringify(turnsAfter)} | flip at ${flipAt}ms | writes after it ${writesAfterFlip} | ` +
      `scene builds ${builds} at ${JSON.stringify(
        canvases.events.filter((e) => e.kind === "add").map((e) => e.t),
      )}`,
  };
}

/** Drive one stage through the whole sequence. */
async function runStage(browser, stage) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();
  const pageErrors = [];
  page.on("pageerror", (error) =>
    pageErrors.push(error.message.split("\n")[0]),
  );
  await page.addInitScript(SAMPLER);
  await page.addInitScript(() => {
    // three publishes its scene here without any change to the app source.
    window.__scenes = [];
    window.__THREE_DEVTOOLS__ = {
      dispatchEvent(e) {
        if (e.detail && e.detail.isScene) window.__scenes.push(e.detail);
      },
    };
  });
  await page.goto(BASE + stage.url, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(800);

  console.log(`\n${stage.name} (${stage.url})`);
  const rounds = [];
  for (const [i, round] of ROUNDS.entries()) {
    const result = await playRound(page, round);
    console.log(`  round ${i + 1}  ${result.summary}`);
    rounds.push(result);
    if (i < ROUNDS.length - 1) {
      await page
        .getByRole("button", { name: "Play another round", exact: true })
        .click();
      await page.waitForTimeout(400);
    }
  }
  await context.close();

  const carried = [...new Set(rounds.map((r) => r.renderer))].filter(
    (r) => r !== "?",
  );
  return { ...stage, rounds, carried, pageErrors };
}

(async () => {
  try {
    await fetch(BASE, { signal: AbortSignal.timeout(3000) });
  } catch {
    console.error(
      `\n✗ Nothing serving at ${BASE}.\n  Start it first:  npm run dev\n`,
    );
    process.exit(1);
  }

  const browser = await chromium.launch({ channel: "chrome" });
  const stages = [];
  const failures = [];
  try {
    for (const stage of [
      { name: "2D", url: "/?room=off" },
      { name: "room", url: "/?room=on" },
    ]) {
      const result = await runStage(browser, stage);
      stages.push(result);
      // A page error means the app is broken, and also that this check may be
      // reading a half-installed instrument — never let that read as a pass.
      for (const error of result.pageErrors) {
        failures.push(`${stage.name}: page error — ${error}`);
      }

      // `?room=on` is only a comparison if the room actually carried the reveal.
      if (stage.name === "room" && !result.carried.includes("room")) {
        failures.push(
          `the room never mounted (carried by ${result.carried.join(", ") || "neither stage"}) — WebGL is unavailable here, so the comparison was not exercised`,
        );
      }
      for (const [i, round] of result.rounds.entries()) {
        for (const problem of round.problems) {
          failures.push(`${stage.name} round ${i + 1}: ${problem}`);
        }
      }
    }
  } finally {
    await browser.close();
  }

  const seen = (name) =>
    (stages.find((s) => s.name === name)?.rounds ?? []).map((r) => r.turns);
  const [twoD, room] = [seen("2D"), seen("room")];
  if (
    twoD.length === room.length &&
    JSON.stringify(twoD) !== JSON.stringify(room)
  ) {
    failures.push(
      `the stages disagree on trust height: the 2D stage drew ${JSON.stringify(twoD)}, the room drew ${JSON.stringify(room)}`,
    );
  }

  if (failures.length) {
    console.error(`\n✗ reveal-stage parity — ${failures.length} finding(s):`);
    for (const failure of failures) console.error(`    ${failure}`);
    console.error("");
    process.exit(1);
  }
  console.log(
    `\n✓ both stages drew ${JSON.stringify(twoD)} turns for the same five rounds, and neither reveal replayed\n`,
  );
})();
