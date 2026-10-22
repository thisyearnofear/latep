# Design — Latep

The locked design system for this app. Every page and component change reads
this file first. Do not invent per-page colours, fonts, or button styles. If
the system needs to grow, amend this file in the same PR and say why.

The redesign plan, tickets, and review process live in
[`docs/REDESIGN_PLAN.md`](docs/REDESIGN_PLAN.md).

---

## 1. The idea in one paragraph

**Receipts and threads.** Every round of Latep prints a receipt: what you
sealed, when it was revealed, what happened. Receipts are proof you can hold.
Between the two players runs a thread. Each round you both lean in, the
threads twist tighter. Holding back snaps it. Your history is a strip of
receipts tied together by that thread, and the tournament is a long till roll.
The cryptography shows up as four things you already know from a counter: a
**Seal** (a stamped stub), a **Handshake** (two torn halves that must match),
a **Net** (woven thread), and a **Pass** (a punched ticket).

**Pencil becomes ink.** Before a choice, both players are drawn in pencil:
undecided, and the opponent stays pencil until reveal. Committing a move inks
your side. At reveal both sides are inked together and the thread twists or
snaps. Colour therefore means "decided", for you and for the other player.
The reveal itself is staged in one 3D moment, the reveal room (section 12).

**Why this direction.** Users called the old UI outdated, generic, and
unrelated to their lives. Everyone keeps receipts, and "show me the receipts"
already means "prove it", which is what a zero-knowledge proof does.
Threads ("ties", "no strings attached") carry the relationship side.The look explains the mechanics instead of decorating them. The 2D stage is built
from SVG and CSS. The one 3D moment, the reveal room (section 12), is optional and
falls back to the 2D stage.

---

## 2. Genre and page families

- **Genre:** editorial, print/thermal register: a counter with printed
  matter on it.
- **Two surfaces, always:** the **counter** (dark, warm charcoal) holds
  navigation, page headings, and the scene frame. **Receipts** (light thermal
  stock) hold everything you read closely: lessons, results, history, forms.
  Long text never sits directly on the counter.
- **Amended 2026-10-21 (section 13):** story pages sit on a third surface, the
  **desk** (light warm paper), and are told in numbered chapters. Lesson and
  workbench pages keep the counter.
- **Story pages** (`/`, `/real-life`, `/record`, the epilogue): _Stage-led_. A wide
  receipt "ticket" carries the scene. Copy sits beside it, aligned left.
  Below, the four primitives as a row of stubs.
- **Lesson pages** (`/learn`): _Lesson player_. Scene left (about 60 %), the
  lesson printed on a receipt to the right, a sticky footer with
  Previous/Next.
- **Workbench pages** (`/learn/play`, `/tournament`, `/play`): _Workbench_.
  Controls on a receipt in one column, the live scene or till roll in the main
  column. Receipts here are straight (no rotation) and function-first.

---

## 3. Colour

All values live in `src/styles/tokens.css`. Components use named tokens only.
**No hex, `rgb()`, `rgba()`, or `oklch()` literals in `.tsx` files.** If you
need a value that doesn't exist, add it to `tokens.css` and this table.

**Counter (the dark surface)**

| Token                    | Value                  | Use                                             |
| ------------------------ | ---------------------- | ----------------------------------------------- |
| `--color-counter`        | `oklch(23% 0.012 60)`  | Page background                                 |
| `--color-counter-2`      | `oklch(28% 0.014 60)`  | Raised strip on the counter (nav, tray)         |
| `--color-counter-rule`   | `oklch(38% 0.012 60)`  | Hairlines on the counter                        |
| `--color-counter-text`   | `oklch(94% 0.010 85)`  | Text on the counter                             |
| `--color-counter-text-2` | `oklch(78% 0.012 80)`  | Secondary text on the counter                   |
| `--color-counter-muted`  | `oklch(66% 0.012 75)`  | Helper text on the counter (≥ 4.5:1)            |
| `--color-scrim`          | `oklch(0% 0 0 / 0.62)` | Modal overlay: the page stays legible behind it |

**Receipt (the light surface)**

| Token                   | Value                 | Use                                        |
| ----------------------- | --------------------- | ------------------------------------------ |
| `--color-receipt`       | `oklch(97% 0.008 95)` | Receipt stock                              |
| `--color-receipt-2`     | `oklch(93% 0.010 95)` | Pressed / selected row on a receipt        |
| `--color-receipt-rule`  | `oklch(82% 0.010 90)` | Dashed rules, tear lines, input borders    |
| `--color-receipt-ink`   | `oklch(20% 0.010 60)` | Printed text and drawings                  |
| `--color-receipt-faded` | `oklch(48% 0.010 60)` | Faded thermal print: helper text (≥ 4.5:1) |

**Threads and people**

| Token                   | Value                 | Use                                                        |
| ----------------------- | --------------------- | ---------------------------------------------------------- |
| `--color-you`           | `oklch(68% 0.15 250)` | Your thread on the counter                                 |
| `--color-you-print`     | `oklch(48% 0.16 255)` | Your thread and text on a receipt                          |
| `--color-partner`       | `oklch(80% 0.15 75)`  | Partner thread on the counter                              |
| `--color-partner-print` | `oklch(52% 0.14 55)`  | Partner thread and text on a receipt                       |
| `--color-stamp`         | `oklch(55% 0.19 28)`  | Thermal "second colour": stamps (SEALED, PRACTICE), errors |
| `--color-focus`         | `oklch(62% 0.17 255)` | Focus ring (passes 3:1 on both surfaces)                   |

Rules:

- **There's no "bond" colour.** Mutual trust is drawn as the two threads
  twisted together, never as a third colour.
- **Thread colours are for people, not decoration.** Blue always means _you_,
  amber always means _your partner_. Never use them for headings or flair.
- **Stamp red is for stamps and errors only.** "Hold back" is never red.
- **Never signal an outcome by colour alone.** Every outcome also has a word,
  a stamp, and a thread state (section 7).
- **The UI accent is the receipt itself:** light stock on a dark counter. The
  primary button is a receipt-coloured tile with ink text.
- No gradients, glows, `backdrop-filter`, or glass. The only translucency
  allowed is inside shadow tokens and `--color-scrim` (a modal must not erase
  the page behind it).
- **Amended 2026-10-21 (section 13):** the desk surface and the earth washes
  add colour beyond people and stamps, and paper is a rendered material, not a
  6 % grain image. The rules below still hold everywhere section 13 is silent.
- Texture: one static, pre-rendered dither/grain image on receipts at ≤ 6 %
  opacity. No animated backgrounds. Runtime GLSL and WebGL are allowed only inside
  the reveal room (section 12), behind a capability check, and never in page
  chrome, receipts, or the 2D stage.

---

## 4. Typography

Load fonts once, self-hosted: woff2 files (Fontsource, latin subset) live in
`public/fonts/` and load via `src/styles/fonts.css` (`font-display: swap`),
with display + body preloaded in `index.html`. No Google Fonts request, no
CSS `@import`, no npm font imports.

| Role    | Face                                                                        | Weights       | Token            |
| ------- | --------------------------------------------------------------------------- | ------------- | ---------------- |
| Display | Bricolage Grotesque (variable: `wght` 500–800, `wdth` 80–100, `opsz` 12–96) | 600, 700, 780 | `--font-display` |
| Body    | Atkinson Hyperlegible Next                                                  | 400, 700      | `--font-body`    |
| Print   | Martian Mono (variable width)                                               | 400, 600      | `--font-print`   |

- **Display** is for page headings and the data figures. It is one variable
  file (`public/fonts/bricolage-variable.woff2`, instanced from Fontsource to
  the ranges above). Every rule that uses it sets its weight explicitly, and
  `font-optical-sizing: auto` lets the face draw itself for its size. Amended
  2026-10-21: the site previously shipped a single static 700 file, so the
  condensed width never applied and heavier weights were synthesised by the
  browser. That is why the old headings looked heavy.
- **Headlines are sentences, not slogans** (amended 2026-10-21). The story
  copy is narrative, so headings sit at reading-plus size: the hero headline at
  most 3.25rem, chapter headings 1.6–2.25rem at weight 600 with
  `text-wrap: balance`. Hierarchy comes from space and the chapter numbers.
- **Numbers carry the display size.** Where the content is a number (the
  collateral figure `100% → 40%`, the chapter numeral in the rail), the number
  is set large, at weight 780, `wdth` 85 and `tabular-nums`. Sentences around it
  stay modest.
- **Body** is for every sentence you read: lessons, explanations, buttons.
- **Print** is what the receipt printer prints: line items, scores, times,
  hashes, nonces, tx ids, stamps, labels. Never use it for paragraphs.

Scale (fluid, defined in `tokens.css`):

```
--text-xs   0.8125rem   receipt labels, captions
--text-sm   0.9375rem   helper text, table cells
--text-md   1.0625rem   body (default)
--text-lg   1.3125rem   lead paragraph
--text-xl   clamp(1.5rem, 1.2rem + 1vw, 2rem)       section heading
--text-2xl  clamp(2rem, 1.5rem + 2vw, 3rem)         page heading
--text-3xl  clamp(2.5rem, 1.6rem + 4vw, 4.75rem)    retired on story pages (see above)
hero h1     clamp(2.25rem, 1.6rem + 2.4vw, 3.25rem)
chapter h2  clamp(1.6rem, 1.3rem + 1.1vw, 2.25rem)
data figure clamp(3.5rem, 2rem + 6vw, 7rem)
```

Rules:

- Headings are roman, never italic.
- **Uppercase is only for receipt print labels** (`SEALED 14:02:11`, `ROUND 3`,
  `TOTAL`), letter-spaced `0.06em`. Everywhere else, sentence case.
- Display tracking `-0.02em`. Body line height 1.55, measure 45–70 characters.
- Numbers in scores, tables, and counters: `font-variant-numeric: tabular-nums`.
- Use curly quotes (’ “ ”) and a real ellipsis (…) in body copy.

---

## 5. Space, shape, elevation

- Spacing tokens: `--space-3xs` 4px, `--space-2xs` 8px, `--space-xs` 12px,
  `--space-sm` 16px, `--space-md` 24px, `--space-lg` 32px, `--space-xl` 48px,
  `--space-2xl` 72px, `--space-3xl` 112px.
- **Receipts have no rounded corners.** Their top and bottom edges are torn
  (zig-zag) using the shared `.receipt-edge` mask in `receipt.css`. Inputs and
  buttons use `--radius-sm` 3px. No pills except the network badge.
- Inside a receipt, group with **dashed rules** (`1px dashed
var(--color-receipt-rule)`) and spacing, never nested boxes.
- A **tear line** (dashed rule plus a small scissors-free notch at each end)
  separates a stub from its receipt. It is the visual for "this part gets
  separated and must match later".
- Elevation: receipts lie on the counter with `--shadow-receipt` (a 1px
  contact shadow plus a soft drop). Nothing else has a shadow. No glows.
- Story pages may rotate a receipt by up to ±0.8°. Workbench and lesson
  receipts are always straight.
- One containment layer. A receipt never sits inside a panel; a panel never
  sits inside a receipt.

---

## 6. Iconography and drawing

- **No emoji in the UI.** Not in nav, buttons, headings, strategy names, or
  stats. (Emoji may appear in a user-written share message, nowhere else.)
- **Four primitive marks** (custom SVG, `src/components/marks/`), drawn in
  `currentColor`, 2px stroke, round caps, at 24px and 48px:
  - **SealMark**: a folded stub with a round stamp on it.
  - **HandshakeMark**: two torn halves whose jagged edges fit together.
  - **NetMark**: a small square of woven thread.
  - **PassMark**: a ticket with a punched hole.
- **Utility icons:** `lucide-react`, stroke width 2, size 18 or 20,
  `currentColor`. No other icon sets.
- **Figures:** the jointed rig in `TrustFallCharacter`, printed in receipt ink
  when on a receipt and in counter text colour on the counter. Each figure
  holds the end of its thread (blue or amber) in its hand. Same rig everywhere.
- **Threads:** SVG paths with a 3px stroke and round caps. Untwisted is two
  separate gentle curves; twisted is two strokes braided along one path; snapped
  is two short frayed ends. Shared component, never redrawn per screen.
- **Stamps:** `Stamp` component, print font, uppercase, `--color-stamp`,
  2px border, rotated -4°. Text from `vocabulary.ts` only.
- **Dithering:** only as pre-rendered images (PNG/SVG) for illustrations.
- Strategy characters (Tit-for-Tat, Grudge, …) are told apart by name plus a
  thread pattern (solid, dashed, dotted, double) — not by nine colours. Charts
  use receipt ink plus up to four tints; legends always show names.

---

## 7. Vocabulary (locked)

One set of words across every screen. Code identifiers (`"C"`, `"D"`,
`cooperate`) do not change; only what users read changes.

**The moves**

| Users read | Means (game theory) | Short helper line                               |
| ---------- | ------------------- | ----------------------------------------------- |
| Lean in    | Cooperate           | “Trust them to hold you up.”                    |
| Hold back  | Defect              | “Stay safe — and grab the reward if they lean.” |

Use "Cooperate" / "Defect" only in the Learn journey glossary and the strategy
inspector, written as a parenthetical the first time: “Lean in (cooperate)”.

**The outcomes**

| Moves (you / partner) | Word        | Stamp    | Picture                                | Thread                  |
| --------------------- | ----------- | -------- | -------------------------------------- | ----------------------- |
| Lean in / Lean in     | Held        | HELD     | Palms meet, both supported             | Twists one turn tighter |
| Lean in / Hold back   | Dropped     | DROPPED  | You topple, partner keeps the reward   | Snaps                   |
| Hold back / Lean in   | You took it | TAKEN    | Partner topples, reward goes to you    | Snaps                   |
| Hold back / Hold back | Standoff    | STANDOFF | Both upright and apart, nothing gained | Goes slack              |

**Trust height** = the number of twists in the thread (consecutive "Held"
rounds). The exact count is printed on the receipt. The drawing caps at 5
twists. Any other outcome resets it to zero (the thread snaps or goes slack).

**The four primitives** — what the cryptography actually does, as objects.

| Name          | Mark                 | One line (everyday)                          | What it is in Latep                                     | Where you meet it in life                         |
| ------------- | -------------------- | -------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------- |
| The Seal      | Stamped stub         | Decide before you see theirs.                | Move commitment + ZK proof the sealed move is valid     | Sealed bids, votes, rock-paper-scissors over text |
| The Handshake | Matching torn halves | No take-backs.                               | Commitment binding: a revealed move must match the seal | Deals with strangers, prices that can't “shift”   |
| The Net       | Woven thread         | Nobody has to be the hero.                   | Contract escrow that settles automatically              | Group buys, deposits, marketplace payments        |
| The Pass      | Punched ticket       | Prove you belong without saying who you are. | ZK allowlist membership + nullifier                     | Members-only drops, age checks, accredited access |

The source of truth for these strings is `src/content/primitives.ts` and
`src/content/vocabulary.ts`. Never retype them in a component; import them.

**Honesty rules (the receipt makes them visible)**

- Every practice receipt carries a `PRACTICE — NOT ON-CHAIN` stamp.
- A ZK receipt prints a tx id and explorer link **only after** the app state
  says the transaction is confirmed. Before that, the line reads
  `PENDING` (or the real error).
- Proof generation, submission, and confirmation print as separate lines.
- Never print an invented number ("thousands of players", "10× safer").

---

## 8. Motion

_Amended 2026-10-21 (section 13): route transitions and chapter dissolves are
added as quiet, state-free motion. The reveal is still the only orchestrated
moment inside a view._

Library: GSAP (already installed). One orchestrated moment per view: **the
reveal**. Everything else is quiet.

```
--ease-out:    cubic-bezier(0.16, 1, 0.3, 1)    entering
--ease-in:     cubic-bezier(0.7, 0, 0.84, 0)    leaving
--ease-in-out: cubic-bezier(0.65, 0, 0.35, 1)   toggles
--ease-feed:   steps(12, end)                   receipt printing only
--dur-micro:   120ms   press, toggle
--dur-short:   220ms   hover, menus, tooltips
--dur-long:    420ms   panels, page reveal
--dur-print:   700ms   a receipt feeding out
--dur-scene:   1400ms  the lean / thread sequence (scene only)
```

- Animate `transform`, `opacity`, and `clip-path` (receipt feed) only. No
  `transition: all`.
- **The reveal sequence:** the Seal stub tears off (200ms) → both figures
  commit to their pose and the thread twists, snaps, or slackens (600ms) →
  the stamp lands (150ms, no bounce) → the round's receipt feeds out
  (`--dur-print`, `--ease-feed`) with the takeaway printed at the bottom.
- `--ease-feed` (stepped) is the only non-smooth easing allowed, and only for
  the receipt feed. No springs, overshoot, shimmer, electric borders, custom
  cursors, hover glows, scroll-triggered fade-ups, or decorative loops.
- **Commit = ink.** Committing a move fills your tile with ink along a brush-like
  wipe (`clip-path` plus a noise mask, 420ms, `--ease-out`). It fires only when
  app state confirms the move was sealed, never when an animation finishes. The
  opponent's tile stays pencil until reveal. Under reduced motion it is a flat
  fill with no wipe.
- Buttons: `translateY(1px)` on press, background shift on hover. That's all.
- `prefers-reduced-motion: reduce`: no feed, tear, or twist animation; final
  states appear with a 150ms opacity crossfade. The full flow still works.
- Sound stays opt-in and event-driven. A short printer sound on the feed is
  allowed when sound is on.

---

## 9. Components (voice)

Shared kit in `src/components/receipt/`: `Receipt`, `ReceiptLine`,
`ReceiptStub`, `TearLine`, `Stamp`, `Thread`.

- **Receipt:** stock background, torn edges, `--shadow-receipt`, padding
  `--space-md`. Header line (print font): what it is + time. Body: body font
  for sentences, print font for line items. Footer: totals or the takeaway.
- **Primary button:** receipt-stock tile on the counter, ink text, 2px ink
  border, `--radius-sm`, 48px min height, body font 700, sentence case. On a
  receipt, the inverse: ink fill, stock text.
- **Secondary button:** transparent, 1px border in the surface's rule colour.
- **Text link:** current text colour, 1px underline offset 3px, thicker on hover.
- **Move buttons:** two large tiles, "Lean in" and "Hold back", each with its
  helper line. Selected = pressed in (`translate(2px, 2px)`, border thickens)
  plus a small check, never colour alone.
- **Takeaway** (printed at the foot of every round receipt): primitive mark +
  “Used: The Seal” + one everyday line + “Where this shows up” link. Same
  component on home, tutorial, and the ZK result screen.
- **History strip:** round receipts side by side (or stacked on mobile),
  joined by the thread with its current twist count.
- **Network badge:** small pill inside the wallet button, “Testnet”, print font.
- Every interactive component ships 8 states: default, hover, focus-visible,
  active, disabled, loading, error, success. Focus ring: 2px `--color-focus`,
  offset 2px, never animated.

---

## 10. Layout and responsive floor

- Content max width 1200px; prose max 68ch. Bias left; centre only the move
  buttons under the scene.
- Receipts are at most 420px wide in a column, or as wide as the scene when
  they carry the scene. On mobile they go full width minus `--space-sm`.
- Must render cleanly at **320, 375, 414, 768, 1440**: no horizontal scroll
  (`overflow-x: clip` on `html` and `body`), no clickable text wrapping to two
  lines, grid tracks `minmax(0, 1fr)`, long headings `overflow-wrap: anywhere`,
  long hashes truncated in the middle with the full value in a copy button.
- Nav (amended 2026-10-21, section 13): the third link reads "Where it goes";
  a "Your record" chip sits before the wallet. The strip takes the surface of
  the page it sits on.
- Nav: wordmark left, four links, wallet right, on a `--color-counter-2`
  strip. Under 768px: the wordmark plus a "Menu" button. Never two rows.

---

## 11. What every page must share

Wordmark, tokens, the three fonts in their roles, the counter/receipt split,
the receipt kit, the thread, the rig, the four marks, the vocabulary above,
and the takeaway. Pages may differ only in which family layout they use
(section 2).

---

## 12. The reveal room (direction, decided 2026-10-14)

The one 3D moment in the product. Everything else is 2D. This section
amends sections 1, 3 and 8, which previously ruled out WebGL and shaders.

**What it is.** At reveal, the stage becomes a lit paper table. Each player's
sealed stub is a card on it. The thread is a rope between two hands. The commit
ink lands on both cards together. The camera settles on a close framing.

**Status.** Built and measured (spike S1). The S1 sign-off is still open, so
the room is **opt-in**: `?room=on` enables it on a device that can render it,
and the default route uses the 2D stage. Once the owner signs off, the default
can return to the capability probe (`shouldUseRevealRoom()`); `?room=off`
remains the comparison path.

**Engine and loading.**

- Three.js directly, not React Three Fiber. `three` was already a dependency
  and R3F plus drei would have been two new ones to buy a render loop that
  GSAP already owns; the room is one component holding the scene's whole
  lifetime, which is the case R3F helps least.
- Lazy-loaded and code-split behind one dynamic import. Warms itself once the
  choices are sealed (or after a breath on the choose step), so the download
  is not paid at the peak of the round. Never fetched on a device that cannot
  show it.
- GLSL for the paper grain and the ink wipe. GSAP drives every animated value,
  as in section 8; no shader reads a clock.
- Procedural geometry and shaders only. No new asset files at all: no
  generated worlds, no third-party or AI-generated models in v1.
- The rig is the 2D rig. `trustFallRig.ts` is the single source of joint
  numbers; the room walks the same joints and interpolates between poses the
  way the 2D figure's CSS transitions do. The outcome pose table lives in
  `components/visual/outcomePoses.ts` so both stages read one copy.

**Two rules the camera has to obey.** Both were found the hard way and both are
load-bearing:

- **The sheet is sized to the frame, not to the figures.** A table sized to the
  figures puts its far edge inside the shot, and everything above that edge is
  empty space, which silhouettes two dark figures against a dark void. The
  paper covers every pixel the camera can see and the renderer clears to stock,
  so the figures are always on paper, as the 2D stage prints them.
- **The camera's downward pitch exceeds its half-field-of-view.** Below that the
  horizon is inside the frame and no sheet, however large, reaches the top of
  it. The pitch is what makes the room a sheet rather than a strip.

**Input and honesty.**

- The room takes the same props as the 2D stage (`TrustStageProps`). It never
  computes outcomes, never reads a hidden move, and never shows a pose or
  thread state the 2D stage wouldn't.
- It renders only in `revealing` and `outcome`, so it cannot show a card that
  was not sealed, and there is nothing for it to reveal early.
- Ink lands on a card because app state says the move was sealed. The same rule
  drives the 2D tile's wipe: the animation never decides anything.
- The stamp and the outcome word are printed markup beside the canvas, never
  pixels inside it. The canvas is `aria-hidden`; the outcome is announced the
  way it always was.
- Lighting follows the outcome state. It adds no claim that the receipt doesn't
  print.

**Fallback and parity.** The 2D stage renders when WebGL is unavailable, when
the device reports two cores or less or a 2 GB memory limit, or under
`prefers-reduced-motion`. A render error or a chunk that never arrives falls
back to the 2D stage mid-round without losing state. It shows the same states
with the same words, stamps and thread states, and every outcome is legible
without the 3D. The room is never the only carrier of meaning.

Three rules keep the two stages from drifting apart, all added with the room:

- **One twist count.** Both stages call `drawnTwists()`
  (`src/content/vocabulary.ts`) instead of computing a braid height locally. A
  thread that is not `twisted` draws no braid, whatever the height says.
- **The height the round is earning.** App state records a round's height a beat
  _after_ the reveal starts, so the reveal draws the height that round is
  earning, and nothing moves when the state settles. Reading the settled height
  instead made the 2D thread jump a turn mid-animation and left it one turn
  behind the room for the rest of the round.
- **The reveal is keyed to `revealing`, not to the raw phase.** `TrustStage`
  collapses `outcome` onto `revealing` for its choreography, because app state
  flips the phase ~150 ms after the sequence ends; keyed to the raw phase, the
  tear/pose/thread/stamp sequence played a second time under the reader.

**Budget (measured, spike S1).**

- Lazy chunk: **137 kB gzipped** (536 kB raw, three included), against a
  proposed ceiling of 150 kB. Plus 0.5 kB of CSS.
- New asset weight: **0 bytes.** Every file stays under the 2 MB cap.
- **25 draw calls, 1,886 triangles, 4 programs, no textures**, for the whole
  scene at 620 x 320.
- **60 fps** (16.7 ms median frame) through the reveal measured on the dev Mac.
- **Phone-class budget (measured 2026-10-14, `npm run measure:reveal-room`).**
  There is no Android device on this machine, so this is a calibrated throttle
  and not a phone: Chrome's own CPU throttling at 4x (the mechanism behind
  DevTools' "4x slowdown"), a 412 x 915 viewport at DPR 2.625, and slow-4G
  network emulation, measured through the production build. The choreography
  held **59.88 fps median, p95 17.7 ms, 4 missed vsyncs in 316 frames, and zero
  main-thread tasks over 50 ms** while it ran. The one heavy task is start-up:
  building the scene and compiling its four programs takes 110-116 ms at 4x,
  before the first frame, which puts the room on screen **84-91 ms after the tap**
  (51-57 ms on this Mac). The render surface is small by any phone's standard —
  **660 x 340, about 0.2 megapixels**, 25 draw calls, 1,886 triangles, 4
  programs, no textures, with the pixel ratio capped at 2. The figures above are
  one run of four; across them the spread is a few milliseconds (p95 17.6-18.6
  ms), so read them as the pace the reveal holds rather than as a single sample.
- **What that still does not prove.** CPU throttling does not slow the GPU, so
  the phone's own driver and its thermal envelope are unmeasured, and a device
  trace remains the confirmation. The harness also runs the scene under
  SwiftShader to bound the GPU — and that run is reported as a diagnostic, not
  as a bar, because a CPU rasteriser is not a phone GPU: it misses frames by
  5-40x depending on the run, and cutting its pixel count by four did not change
  that, so its cost is its own fixed overhead rather than the fill a phone would
  do. It is not evidence in either direction, which is why the criterion above
  closes on the throttled measurement and names the GPU as the residual.
- Below the target the room falls back rather than degrading.

**Mobile.** Portrait framing: the camera pulls back rather than cropping. The
room sits in the same box as the 2D scene and is sized the same way, so
switching between them never moves the page. A tile inks when the move is
sealed, on a tap or from the keyboard (section 8).

**Not in v1.** Generated worlds, third-party or AI-generated models, a walkable
corridor, and scroll-linked camera moves. Each needs its own decision. Also not
in v1: contact shadows or any other gradient under the figures (section 3 bans
decorative falloff), and physics on the thread — the four thread states are
drawn, not simulated.

**Influences.** Codrops, "Sketching the Impossible" (2026): a hover-paint
shader on sketch textures. Codrops, "More Than a Portfolio" (2026): one
continuous scroll-driven world. CodePen, "Receipt prints using
animation-timeline" (2026): scroll-linked printing with a printed fallback.
Nicky Case, _The Evolution of Trust_ (public domain, github.com/ncase/trust):
the rule-changing explainer this game adapts. We borrow mechanisms from these,
not their looks.

---

## 13. Materials, story, and motion (amendment, 2026-10-21)

**Why this amendment.** The first redesign followed the system to the letter and
came out flat: a near-colourless counter, receipts drawn as flat polygons,
clip-art figures, and a site that told the story of a game. The product is a
**private reputation**: prove your track record to a stranger without
publishing it. The game is its first issuer. This section adds the story
surfaces that say so, and the materials (paper, pencil, ink) that make
"proof you can hold" look holdable. It amends sections 1–3, 6, 8 and 10 where
it says so, and leaves the rest standing.

### 13.1 The story, in order

Every story surface tells some part of this, in this order, and none skips
ahead:

1. **The problem.** Strangers can only trust blindly, demand full collateral, or
   publish their history. Each costs something.
2. **The fourth option.** Prove your record, reveal nothing else.
3. **Earn it.** Every round you play prints a receipt, and your receipts are
   your record.
4. **Spend it.** A proven record lowers what a stranger asks of you.
5. **Underneath.** The Seal, the Handshake, the Net, the Pass and the Record,
   with proofs on Stellar.

The copy lives in `src/content/story.ts`. Components never retype it.

### 13.2 The desk (third surface)

Story pages (`/`, `/real-life`, `/record`) sit on the **desk**: light warm
paper, ink text. Receipts lie on the desk exactly as they lie on the counter.
Lesson and workbench pages keep the counter, where the dark ground frames a
live scene. Nav, footer and modals take the surface of the page they sit on.

| Token                | Value                 | Use                                  |
| -------------------- | --------------------- | ------------------------------------ |
| `--color-desk`       | `oklch(95% 0.018 85)` | Story page ground                    |
| `--color-desk-2`     | `oklch(91% 0.022 85)` | Raised strip on the desk (nav, tray) |
| `--color-desk-rule`  | `oklch(80% 0.02 80)`  | Hairlines on the desk                |
| `--color-desk-ink`   | `oklch(22% 0.015 60)` | Text on the desk                     |
| `--color-desk-ink-2` | `oklch(38% 0.015 60)` | Secondary text on the desk           |
| `--color-desk-muted` | `oklch(48% 0.015 65)` | Helper text on the desk (≥ 4.5:1)    |

On the desk, people keep the print colours (`--color-you-print`,
`--color-partner-print`), as on a receipt.

### 13.3 Earth washes

Muted earth colours give chapters and illustration their ground, so that a page
is not grey from top to bottom.

| Token               | Value                  | Use                                                     |
| ------------------- | ---------------------- | ------------------------------------------------------- |
| `--color-moss`      | `oklch(42% 0.05 130)`  | The tinted phrase in a display heading; chapter numbers |
| `--color-moss-wash` | `oklch(88% 0.035 125)` | Chapter ground                                          |
| `--color-sand-wash` | `oklch(90% 0.05 85)`   | Chapter ground                                          |
| `--color-clay-wash` | `oklch(84% 0.055 45)`  | Chapter ground; the illustration's warm wash            |
| `--color-sage-wash` | `oklch(90% 0.03 160)`  | Chapter ground; the illustration's cool wash            |

Rules:

- A wash is a **ground**: a chapter band or the wash under an illustration.
  It never fills a button, never marks an outcome, and never stands for a person.
- Moss is the only earth colour used for type: one tinted phrase per display
  heading ("Prove you keep your word. _Without publishing your history._" is
  set roman, in moss, never italic) and the chapter numbers.
- Blue is still you, amber is still your partner, and stamp red is still for
  stamps and errors. No wash may sit close enough in hue to read as one of them.
- No gradients between washes. A chapter changes ground at a dithered edge
  (13.6), not with a blend.

### 13.4 Paper is a material

- **One shared paper texture.** On load, a capable device renders the paper
  once with `@paper-design/shaders` (`paperTexture`: fibre, roughness, faint
  folds, no crumples or drops) into an offscreen canvas. Its data URL becomes
  `--paper-texture`, the canvas is disposed, and the GL context is released.
  Receipts and the desk both read `--paper-texture` as a `background-image`
  blended over their stock colour. A device that can't render it uses the
  pre-rendered fallback in `public/assets/paper/`. The surface looks the same
  either way. It just isn't generated on the device.
- **One live shader per view, at most.** A page may hold one live WebGL
  canvas: the story hero (13.5) or the reveal room, never both at once. Every
  other surface is DOM over the baked texture. Browsers cap the number of WebGL
  contexts, and the budget is spent on the one moment that earns it.
- Paper does not move. No animated grain, no parallax on the texture.

### 13.5 Drawing: pencil and ink (amends section 6)

- **The sketch material** is how scenes are drawn in 3D: ballpoint hatching
  that follows the light, wobbly pen outlines that overshoot the corners, and
  hatched cast shadows. It is written in GLSL for our raw three.js setup, ported
  from R3FSketchMaterial (MIT, credited in `THIRD-PARTY-NOTICES.md`). Raw
  three.js, not R3F, for the reasons section 12 gives.
- **Pencil means undecided, ink means committed.** Pencil is sparse grey
  hatching with a faint outline. Ink is denser hatching in receipt ink with a
  firm outline. The thread's colours are ink. A figure moves from pencil to ink
  because app state says the move was sealed, never because an animation
  finished. This is section 1's "pencil becomes ink", now drawn.
- **The story hero** is one drawn scene in the sketch material: Maria's desk at
  the counter, the counterparty across it, a stack of receipt slips between
  them, and the thread. It sits on a hand-made watercolour wash in clay and
  sage. It draws itself in once on load (the sketch "wash/reveal": hatching
  arrives in blotches) and then holds still. No idle loop.
- **Hero fallback.** Without WebGL, under reduced motion, or on a low-power
  device, the hero is the isometric Desk plate (`components/figures/`) on the
  same wash, fully drawn. The hero is decoration around the headline. The
  headline is the page's largest text, renders before three.js loads, and
  carries the meaning without the drawing.
- The hero's figures are a simplified silhouette (head, torso, legs, arms in
  fixed proportions) rather than the game rig, because the rig's proportions
  don't survive the hero's scale. The game rig is untouched.
- The 2D stage's rig figures lose the smiley faces: a figure is a head, a
  body and two hands holding a thread. The rig's joints don't change.

### 13.6 Motion (amends section 8)

Quiet motion that never decides anything. Everything here collapses to a
150 ms crossfade, or to no motion at all, under reduced motion. Scroll stays
native everywhere: no smooth-scroll library and no scroll hijacking.

**Between pages.**

- **View Transitions first.** Internal link clicks run through
  `document.startViewTransition`. The app uses declarative `<Routes>`, so
  `AppShell` intercepts same-origin link clicks in the capture phase, and
  programmatic navigation goes through `navigateWithTransition`. The old page
  clears in 180 ms. The new page fades in from 120 ms over `--dur-long`: one
  after the other, not both at once.
- **The title morphs.** Every page's `h1` carries
  `view-transition-name: page-title`, so the old title becomes the new one.
  When a nav link is clicked, its label takes the name instead and becomes the
  new page's title. `/learn` and `/play` have no `h1`, so they skip the morph.
- **Changing surface feeds like a receipt.** Desk ↔ counter navigations reveal
  the new page top-down with `--ease-feed` over `--dur-print`, with no title
  morph.
- **The receipt carries you to your record.** "Add to your record" gives the
  round's receipt and its slot in the `/record` strip a shared name
  (`receipt-flight`), so the receipt travels into place.
- **Fallback.** Back/forward, and browsers without View Transitions, use the
  clone transition: a static copy of the old page settles and fades while the
  new page clips in, and the receipt flight is a GSAP tween from the stashed
  position. Focus moves to the new `h1` when either path finishes.

**Within Home: chapters are sheets of paper** (after the Codrops sticky-section
studies).

- Each chapter is a full-bleed sheet with its own opaque ground, the receipt's
  torn edge on top and `--shadow-sheet` cast upward. Later sheets slide over
  earlier ones.
- **A sheet that holds operable content is never covered.** Sheets are marked
  `data-sheet="stack"` or `data-sheet="flow"`. Stack sheets (hero, opening,
  chapters 01 and 04) are `position: sticky` with
  `top: min(0px, calc(100svh - var(--sheet-h)))`, so a tall sheet scrolls in
  full before it holds. As the next sheet arrives they scale to 0.97 and darken
  to `--color-scrim` at 0.45. Flow sheets (chapter 02's claim demo, chapter
  03's practice round, chapter 05's plates and everything after) stay in normal
  flow, so nothing can slide over a control. This rule was found the hard way:
  when the practice round was a stack sheet, the receipt that prints at the end
  of a round pushed "Play another round" under the next sheet, and no scroll
  position could reach it.
- When focus moves into a covered sheet, it is scrolled back into view (WCAG
  2.4.11).
- **The chapter rail** (≥ 1100 px) is a `nav` of the five chapters in the left
  margin, in print font and sentence case. The current chapter carries
  `aria-current`, and its numeral rolls over like a till. The rail appears only
  while a chapter is on screen, not over the hero, and switches to counter
  colours over chapter 03.
- **Lines rise into place.** Chapter headings and ledes reveal line by line
  through a mask (GSAP SplitText, `aria: "auto"`), starting when the chapter's
  top reaches 90 % of the viewport. Anything already on screen reveals at once,
  so a reader never sees a gap where text will appear. The hero headline never
  animates, because it is the page's largest paint.
- All of this sets up in an idle callback after first paint and
  `document.fonts.ready`, and measures again only on a real resize.

**On `/real-life`: dithered edges.** Where one scenario's ground meets the next,
the edge is a 4×4 Bayer dither at 4 px cells, generated once with Canvas2D into
`--dither-edge` (static fallback in `public/assets/dither/`). The edge sits
under the content of the band above it, and ScrollTrigger dissolves it in as
the band enters.

### 13.7 Narrative surfaces

**Home (`/`), told in chapters.** The hero (13.5), then a headline with a tinted
phrase and a one-sentence lede. Then five numbered chapters, each a sheet of
paper on its own ground (13.6), each opening with a print-font number ("01")
and a short title. Chapter 02 opens on the collateral figure, `100% → 40%`,
with the 40 % in moss. The numbers come from `CLAIM_DEMO`, never retyped:

| #   | Chapter           | Holds                                                                                   |
| --- | ----------------- | --------------------------------------------------------------------------------------- |
| 01  | The problem       | Maria's situation and the three dead ends                                               |
| 02  | The fourth option | The fourth-option copy and the **claim demo**                                           |
| 03  | Earn a record     | Why a game is the first issuer, then the practice round, ending in "Add to your record" |
| 04  | Where it goes     | The three directions, linking to `/real-life`                                           |
| 05  | Underneath        | The primitive plates, the two-line mechanism, and the honest scope                      |

"Where next" and the credit follow the chapters.

**The claim demo.** Two counterparties stand at Maria's counter. The
**stranger** has no record and posts the full deposit (100 %). The **holder**
shows a proof ("at least 90 % of 200 recorded deals kept") and posts 40 %. The
viewer can switch between the two, and the collateral plinth rises or falls. The
demo is stamped `ILLUSTRATIVE — NOT A PROOF` and `IN BUILD — PATTERN 3`,
visible in the view, not in a tooltip, and links to the Pattern 3 status. It
calls the claim through the reputation interface (13.8), so the real proof
replaces the simulated one without touching the UI.

**Your record (`/record`).** Your receipts, side by side and joined by the
thread, in two strips:

- **On-chain**: games played with a friend, read from the existing stats
  history. Each receipt prints its game id.
- **Practice**: rounds from the home stage and the sandbox. Each is stamped
  `PRACTICE — NOT ON-CHAIN`.

Above the strips, printed as receipt lines: rounds recorded, rounds kept (you
leaned in), the kept percentage, and the current trust height. Below them,
"Prove it" opens the claim demo with your own numbers. It is stamped exactly as
on Home, because it is the same simulation. The empty state says "No receipts
yet" and links to the practice round, and never shows a zero as though it were
an achievement.

**Where it goes (`/real-life`).** Three illustrated scenarios, each labelled
`ILLUSTRATIVE — NOT A PROOF`: Maria's remittance desk (credit), a marketplace
deposit (escrow), and an agent paying a stranger (agent payments). Each names the
primitives it uses, the Record among them, and ends at the claim demo. The four
primitive receipts that exist today stay below, under "Live today".

### 13.8 The reputation seam

The UI never talks to a proof system directly. It talks to one interface:

```ts
// src/reputation/types.ts
export interface ReputationSummary {
  recorded: number; // rounds in the record
  kept: number; // rounds where you leaned in
  keptPct: number; // 0–100, integer
}
export type ClaimResult =
  | {
      kind: "simulated";
      meets: boolean;
      threshold: number;
      summary: ReputationSummary;
    }
  | {
      kind: "proven";
      meets: true;
      threshold: number;
      nullifier: string;
      txHash?: string;
    };
export interface ReputationClaimer {
  claim(threshold: number, context: string): Promise<ClaimResult>;
}
```

v1 ships `simulatedClaimer` only. A `simulated` result always renders with the
two stamps above. A `proven` result renders only when the Pattern 3 circuit
produced it, and it follows the honesty rules in section 7: a tx id appears only
once it is confirmed.

### 13.9 What we take from each reference, and what we leave

| Reference                                                      | We take                                                                                                                                      | We leave                                                                     |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| kylon.io                                                       | One human illustration that depicts the product; warm grained paper; a muted earth palette; numbered chapters; one tinted phrase per heading | Logo walls, testimonials and metrics we don't have; rounded cards everywhere |
| twotwentytwo-studio/codrops-paper                              | Paper as a material, rendered once from Paper Shaders and shared by every surface                                                            | WebGPU, WGSL, domgl, Nuxt                                                    |
| abhishekmill/R3FSketchMaterial                                 | Light-following hatching, overshooting pen outlines, hatched shadows, the wash/reveal: pencil and ink                                        | R3F, the leva panel, the camera tour                                         |
| codrops/atelier-north                                          | Dithered pixel edges between sections, driven by native scroll                                                                               | Lenis, the architecture-portfolio tone, its fonts                            |
| ismamz/amber                                                   | Parallel route transitions on one GSAP timeline                                                                                              | Its layouts                                                                  |
| Codrops: sticky sections, SplitText reveals, Scrolling Letters | Chapters as stacking sheets; a persistent chapter rail that changes per section; masked line reveals with one ease and a small stagger       | Pinning, scroll hijacking, per-character effects on body copy                |
| Codrops: View Transitions articles                             | Browser-captured page snapshots with one named element (the title) morphing between pages                                                    | Animating every element; transitions that delay loading                      |

### 13.10 Budgets and gates

- The hero's lazy chunk (three.js plus the scene) stays under the reveal room's
  150 kB gzipped ceiling. Under the phone-class profile in
  `npm run measure:reveal-room`, it may add no main-thread task over 50 ms
  before the headline paints.
- `@paper-design/shaders` is pinned to an exact version that was at least seven
  days old when added.
- Every existing gate still runs (`design:check`, `check:hidden-moves`,
  `check:stage-parity`, `shots`), plus `/record` in the shot list. `shots`
  also fails on any element that overflows the viewport behind
  `overflow-x: clip`.
- Three more checks run against the dev server:
  - `node e2e/sheets-check.cjs`: no covered sheet can be hit through the one
    above it, focus is never hidden, no on-screen line is left unrevealed, and
    three practice rounds complete with real clicks at 1440 and 390.
  - `node e2e/transition-check.cjs`: View Transitions are used when supported,
    focus lands on the new `h1`, back/forward restores scroll, and reduced
    motion animates opacity only.
  - `node e2e/hero-check.cjs`: the hero draws in, freezes and releases its GL
    context.
- Headline paint stays under 900 ms on the 4× CPU phone-class profile
  (`scripts/measure-hero.cjs`).
- The comprehension test (`docs/COMPREHENSION_TEST.md`) gains one question:
  "What could you do with your record?"
