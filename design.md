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

**Why this direction.** Users called the old UI outdated, generic, and
unrelated to their lives. Everyone keeps receipts, and "show me the receipts"
already means "prove it", which is what a zero-knowledge proof does.
Threads ("ties", "no strings attached") carry the relationship side. The look
explains the mechanics instead of decorating them, and it's built from SVG
and CSS, not WebGL.

---

## 2. Genre and page families

- **Genre:** editorial, print/thermal register: a counter with printed
  matter on it.
- **Two surfaces, always:** the **counter** (dark, warm charcoal) holds
  navigation, page headings, and the scene frame. **Receipts** (light thermal
  stock) hold everything you read closely: lessons, results, history, forms.
  Long text never sits directly on the counter.
- **Story pages** (`/`, `/real-life`, the epilogue): _Stage-led_. A wide
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

| Token                    | Value                 | Use                                     |
| ------------------------ | --------------------- | --------------------------------------- |
| `--color-counter`        | `oklch(23% 0.012 60)` | Page background                         |
| `--color-counter-2`      | `oklch(28% 0.014 60)` | Raised strip on the counter (nav, tray) |
| `--color-counter-rule`   | `oklch(38% 0.012 60)` | Hairlines on the counter                |
| `--color-counter-text`   | `oklch(94% 0.010 85)` | Text on the counter                     |
| `--color-counter-text-2` | `oklch(78% 0.012 80)` | Secondary text on the counter           |
| `--color-counter-muted`  | `oklch(66% 0.012 75)` | Helper text on the counter (≥ 4.5:1)    |

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
  allowed is inside shadow tokens.
- Texture: one static, pre-rendered dither/grain image on receipts at ≤ 6 %
  opacity. No runtime shaders, canvas, or animated backgrounds.

---

## 4. Typography

Load fonts once, in `index.html` (with preconnect). Delete the CSS `@import`.

| Role    | Face                                                  | Weights  | Token            |
| ------- | ----------------------------------------------------- | -------- | ---------------- |
| Display | Bricolage Grotesque (variable, `wdth` 75–100, `opsz`) | 700, 800 | `--font-display` |
| Body    | Atkinson Hyperlegible Next                            | 400, 700 | `--font-body`    |
| Print   | Martian Mono (variable width)                         | 400, 600 | `--font-print`   |

- **Display** is for page headings on the counter. Use the condensed width
  (`font-stretch: 80%`) for the story hero.
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
--text-3xl  clamp(2.5rem, 1.6rem + 4vw, 4.75rem)    story hero only
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
- Nav: wordmark left, four links, wallet right, on a `--color-counter-2`
  strip. Under 768px: the wordmark plus a "Menu" button. Never two rows.

---

## 11. What every page must share

Wordmark, tokens, the three fonts in their roles, the counter/receipt split,
the receipt kit, the thread, the rig, the four marks, the vocabulary above,
and the takeaway. Pages may differ only in which family layout they use
(section 2).
