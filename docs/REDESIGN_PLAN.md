# Redesign plan — Latep

**Read [`design.md`](../design.md) first.** It is the locked design system
(surfaces, colours, type, vocabulary, motion). This file covers _how_ we get
there: phases, tickets, who owns what, and how work is reviewed.

---

## 1. Vision

### The problem we're fixing

User feedback: _outdated, generic, and it doesn't show how this relates to my
life._ The audit (October 2026) found three root causes:

1. **Outdated look.** Dark navy, the stock purple `#667eea → #764ba2`, glass
   panels, glows, a WebGL background, a custom cursor, and shimmer buttons.
   It reads as a 2021 crypto dApp.
2. **Generic layout.** Centred hero, then a big card, then three equal emoji
   cards, then a banner. 329 emoji stand in for icons.
3. **No relatability.** The core picture doesn't depict anything: two stick
   figures stand on cones, nobody falls or catches. One choice has three names
   (Cooperate / Offer a catch / Commit). The everyday examples are hidden on the
   fourth nav tab, after the game is over.

### Where we're going

> **Receipts and threads.** Every round prints a receipt: proof you can
> hold. A thread runs between the two players: it twists tighter each time
> you both lean in and snaps when someone holds back. The cryptography shows
> up as four counter-top objects: a **Seal** (stamped stub), a **Handshake**
> (two torn halves that must match), a **Net** (woven thread), and a **Pass**
> (punched ticket).

Four product shifts carry most of the impact. The restyle supports them:

1. **Make the picture literal and truthful: the trust lean.** Both players
   lean in at the same moment, or hold back. Both lean in: palms meet, they
   hold each other up, the thread twists ("Held"). One holds back: the leaner
   topples, the other takes the reward, the thread snaps ("Dropped" / "You
   took it"). This matches the Prisoner's Dilemma exactly, because both choices
   happen at once.
2. **Receipts make the mechanics visible.** Sealing prints a stub and tears
   it off. Revealing matches the two torn halves. The round's receipt shows
   what happened, with a `PRACTICE — NOT ON-CHAIN` stamp or, in multiplayer,
   a real tx id once it's confirmed. "Show me the receipts" is how everyone
   already thinks about proof.
3. **Situation first, theory later.** The home page opens with something
   everyone has lived through, like paying a stranger first. Game theory
   vocabulary lives in Learn.
4. **Name the primitive at the moment it's felt.** The foot of every round
   receipt says _"Used: The Seal. You decided before seeing theirs. That's how
   a sealed bid works."_ `/real-life` becomes the collection of everything
   you've already met.

### Success criteria

- A first-time visitor can say, in their own words, what one of the four
  primitives is for after a single practice round. (Test with 5 people before
  and after.)
- No screen uses emoji, glass, gradients, glows, or the old purple.
- The scripts in section 4 report **0** hardcoded colours and **0** emoji in `src/`.
- Every route works at 320 / 375 / 414 / 768 / 1440 px, by keyboard, and with
  reduced motion.
- No game, proof, wallet, or contract behaviour changes. (Look, not logic.)

---

## 2. Ground rules for the team

1. **Main is frozen for the hackathon submission (Oct 13, 00:59).** All
   redesign work happens on the integration branch `redesign`. Ticket branches
   come off `redesign` and merge back into it via PR. `redesign` merges to
   `main` only at the end of Phase 3, after review.
2. **Look, not logic.** Do not change files in `src/services/`, `src/util/`,
   `src/contracts/`, `src/hooks/`, `src/providers/`, `contracts/`,
   `circuits/`, or `packages/`. If a ticket seems to need it, stop and ask.
   Wallet files (`WalletProvider`, `useWallet`, `ConnectAccount` logic) are
   especially off-limits; only their markup and styling may change.
3. **Stay in your lane.** Each file has one owner per phase (section 5).
   Touching the other dev's file means a merge conflict. Ask first.
4. **Small PRs.** One ticket per PR, ideally under 400 changed lines. A big
   file (e.g. `TournamentMode.tsx`, 979 lines) gets split into several PRs.
5. **Never delete files** without the list being approved (Phase 4). Unused
   components are left alone until then.
6. **Every PR includes before/after screenshots** at 390 and 1440 px for each
   route it touches (`npm run shots`, section 4).
7. **No new dependencies** except `lucide-react` (ticket B1). Ask before
   adding anything else. Fonts load from Google Fonts, not npm.
8. **Strings live in one place.** Primitive names and everyday lines come from
   `src/content/primitives.ts`. Move, outcome, and stamp labels come from
   `src/content/vocabulary.ts`. Don't retype them.
9. **Receipts never lie.** A receipt line that claims a proof, transaction, or
   settlement happened must be driven by real app state, never by an
   animation finishing (`design.md` §7, honesty rules).

---

## 3. How to restyle a component (recipe)

Most styling today is inline `style={{…}}` with hardcoded colours. That's why
changing tokens alone can't restyle the app. The conversion:

**Before**

```tsx
<div style={{ padding: "14px 20px", borderRadius: "var(--radius-md)",
  background: "rgba(102, 126, 234, 0.08)", border: "1px solid rgba(102, 126, 234, 0.25)" }}>
```

**After**

```tsx
<div className="hint">
```

```css
/* src/styles/home.css */
.hint {
  padding: var(--space-xs) var(--space-md);
  background: var(--color-counter-2);
  border: 1px solid var(--color-counter-rule);
  color: var(--color-counter-text-2);
}
```

Rules:

- **First decide the surface.** Is this thing on the counter (nav, headings,
  scene frame) or on a receipt (anything you read closely, forms, results)?
  Use only that surface's tokens: `--color-counter-*` or `--color-receipt-*`.
  Mixing them is the most common mistake.
- **If it's read closely, it goes on a receipt.** Wrap it in the `Receipt`
  component (ticket B1b) instead of building a new panel.
- **Static styles become a class** in the area's stylesheet (`home.css`,
  `shell.css`, `learning.css`, `tournament.css`, `zk.css`, …). Name classes
  after what the thing _is_ (`.move-tile`, `.round-receipt`), not how it looks
  (`.blue-box`).
- **Dynamic values become a CSS variable**:
  `style={{ "--bar-width": `${pct}%` } as React.CSSProperties}` with
  `.bar { width: var(--bar-width); }` (better still, `transform: scaleX(...)`).
- **Every colour is a token** from `tokens.css`. If none fits, ask before
  adding one.
- **Every emoji becomes** a primitive mark, a `lucide-react` icon, a `Stamp`,
  or nothing. Usually nothing is right.
- **Delete decoration while you're there:** `box-shadow` glows, `filter:
drop-shadow`, `backdrop-filter`, `transition: all`, `ease-spring`, rounded
  "bubble" corners.
- **Keep every `aria-*`, `role`, `id`, `data-testid`, and event handler exactly
  as it was.**

---

## 4. Tooling (ticket A0, lands first)

Two scripts the team runs on every PR.

**`npm run design:check`** (`scripts/design-check.cjs`). Counts in `src/`
(excluding `src/contracts/` and `src/debug/`):

| Metric                                                                        | Baseline (2026-10-12) | Target                          |
| ----------------------------------------------------------------------------- | --------------------- | ------------------------------- |
| Hex / `rgb()` / `rgba()` literals in `.tsx` and `.css` (outside `tokens.css`) | 527                   | 0                               |
| `style={{` blocks                                                             | 941                   | under 120 (dynamic values only) |
| Emoji (`\p{Extended_Pictographic}`) in `.ts`/`.tsx`                           | 329                   | 0                               |
| Word-boundary `Cooperate` / `Defect` in strings and JSX text                  | 56                    | Glossary and inspector only     |
| `glass-panel` uses                                                            | 47                    | 0                               |

The script reads `scripts/design-baseline.json` and **fails if any number goes
up**. When a PR brings a number down, run `npm run design:check:write` and
commit the updated baseline in the same PR. That makes progress visible and
stops regressions. It runs in the pre-commit hook, so it cannot be merged past.

Measured over the files under `src/`, excluding `src/contracts/` (generated
from Rust) and `src/debug/` (the deliberate escape hatch). `src/styles/tokens.css`
is the one file allowed to hold raw colour values.

The `Cooperate`/`Defect` metric matches quoted strings and JSX text nodes only,
and strips comments first — otherwise the vocabulary file's own documentation
about the words would count against the metric. It is deliberately blunt within
that scope, so it over-counts the glossary and inspector; those land at their
target, not at 0. Baseline 56 as of B1.

**`npm run shots`** (`scripts/shots.cjs`). Starts against a running `npm run dev`
and screenshots `/`, `/learn`, `/learn/play`, `/tournament`, `/play`,
`/real-life` at 390 and 1440 px into `e2e/shots/` (gitignored; never commit
them, per `AGENTS.md`). Uses Playwright with `channel: "chrome"` so no browser
download is needed.

**Every PR runs:** `npm run build`, `npm run lint`, `npm run design:check`,
`npm run shots`.

---

## 5. Ownership

|         | Dev A: shell & story                                               | Dev B: scene & kit                                                                   |
| ------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| Phase 1 | Tooling, tokens, fonts, global CSS                                 | Content files, marks, receipt kit, thread, rig poses                                 |
| Phase 2 | App shell, Home                                                    | Trust lean scene, round receipt + takeaway                                           |
| Phase 3 | Learn journey, tutorial + history strip, ZK lobby / setup / commit | Everyday page, tournament till roll, ZK reveal / result / scoreboard / accreditation |
| Phase 4 | Mobile and a11y QA, legacy alias removal                           | Deletions (after approval), motion and reduced-motion QA                             |

---

## 6. Phases and tickets

Each ticket lists its files, what "done" means, and how it gets checked.
Rough sizing for a rookie: S ≈ half a day, M ≈ 1–2 days, L ≈ 3+ days.

### Phase 1 — Foundation

**A0 · Tooling** (S) — Dev A

- Create `scripts/design-check.cjs`, `scripts/design-baseline.json`,
  `scripts/shots.cjs`; add `design:check`, `design:check:write`, and `shots` to
  `package.json`; add the `design:check` line to `.husky/pre-commit`; add
  `e2e/shots/` to `.gitignore`.
- Done: `npm run design:check` reproduces the table in section 4 exactly and
  exits 1 on a planted regression; `npm run shots` writes both widths for all
  six routes.

**A1 · Tokens and the counter flip** (M) — Dev A

- Create `src/styles/tokens.css` with every token in `design.md` §3–§8.
  Import it first in `src/main.tsx`.
- In `src/index.css`, replace the old `:root` values with **legacy aliases**
  pointing at the new tokens, so the 941 inline styles that use
  `var(--accent-violet)` etc. pick up the new look right away:
  `--bg-deep → --color-counter`, `--bg-mid / --bg-glass / --bg-surface /
--bg-glass-light → --color-counter-2`, `--text-primary →
--color-counter-text`, `--text-secondary → --color-counter-text-2`,
  `--text-muted → --color-counter-muted`, `--border-glass →
--color-counter-rule`, `--accent-violet / --accent-purple / --accent-cool /
--accent-cooperate → --color-you`, `--accent-warm / --accent-defect →
--color-partner`, `--shadow-glow-* → none`, `--ease-spring → --ease-out`.
  Mark the block `/* LEGACY: removed in Phase 4 */`.
- `.glass-panel` becomes a flat `--color-counter-2` strip: no blur, no glow,
  1px counter-rule border, `--radius-sm`. (Phase 3 moves most of these onto
  receipts.)
- Fonts: one `<link>` in `index.html` (Bricolage Grotesque with `wdth` and
  `opsz` axes, Atkinson Hyperlegible Next, Martian Mono). Remove the `@import`
  in `index.css`. Set `--font-print`; keep `--font-mono` as a legacy alias of it.
- Add `overflow-x: clip` on `html, body`.
- The counter stays dark, so existing white inline text stays readable. Expect
  only small breakage, like hardcoded purple backgrounds. List anything
  unreadable in the PR description.
- Done: every route is readable at 1440 and 390, with no purple and no glass
  blur; `design:check` doesn't go up.
- **Shipped 2026-10-12** (`a64111b`). Two things the next tickets must know:
  1. The legacy block is **not all aliases**. `--space-xs/sm/md/lg/xl` and
     `--radius-md/lg/xl` hold _literal_ old values, because custom properties
     on the same element are last-declaration-wins: aliasing `--space-md` to
     `--space-sm` inside the block resolves to the block's own redefined
     `--space-sm`, not the token. Do not "tidy" those into aliases.
  2. Fonts resolve in the browser (verified via `document.fonts.check`).
     Martian Mono is lazy — it only downloads once a component uses
     `--font-print`, which today is the game-view set, not the landing pages.
- Pre-existing bugs confirmed **not** caused by A1 (shot the same route from
  `main` and compared): the invisible "Evolution Settings" / "Payoff Matrix" /
  "Stage: Ready" text on `/tournament`. Already B6 scope.

**B1 · Content and marks** (M) — Dev B

- `src/content/primitives.ts`: the four primitives (id, name, mark, oneLine,
  what it is in Latep, everyday examples[], related lesson route). Copy from
  the `design.md` §7 table.
- `src/content/vocabulary.ts`: move labels (Lean in / Hold back + helper
  lines), outcome words and stamp text (Held/HELD, Dropped/DROPPED,
  You took it/TAKEN, Standoff/STANDOFF), the `PRACTICE — NOT ON-CHAIN` and
  `SEALED` / `PENDING` stamps, keyed by the existing `GameMove` `"C" | "D"` type.
- `src/components/marks/`: `SealMark` (stamped stub), `HandshakeMark` (two
  torn halves that fit), `NetMark` (woven square), `PassMark` (punched ticket)
  as React SVG components (`size`, `title` props, `currentColor`, 2px stroke,
  round caps). Plus `index.ts`.
- `npm i lucide-react`.
- Show the marks in a temporary `src/debug/marks.preview.tsx` (not routed) and
  include screenshots in the PR.
- Done: marks are recognisable at 24px. The lead signs off on the drawings
  before anything uses them.
- **Shipped 2026-10-12.** `NetMark` was redrawn after review: the first pass
  was a square grid, which reads as a _window pane_ at 24px, not netting. It is
  now a diamond lattice. The other three were legible as drawn.

**B1b · Receipt kit and thread** (M) — Dev B

- `src/components/receipt/`: `Receipt` (torn top/bottom edge via a CSS mask,
  stock colour, `--shadow-receipt`, optional `tilt` prop limited to ±0.8°),
  `ReceiptLine` (label left, value right, print font, tabular nums),
  `TearLine`, `ReceiptStub`, `Stamp` (print font, `--color-stamp`, -4°,
  text prop typed to the stamp keys in `vocabulary.ts`), plus `receipt.css`.
- `src/components/receipt/Thread.tsx`: SVG between two points with
  `state: "loose" | "twisted" | "snapped" | "slack"` and `twists: number`
  (drawing capped at 5). Colours from `--color-you-print` /
  `--color-partner-print` (on receipts) or `--color-you` / `--color-partner`
  (on the counter) via a `surface` prop.
- The kit is presentational only: it never computes outcomes.
- Done: a debug preview shows a receipt with every line type, every stamp,
  a stub with tear line, and every thread state, at 390 and 1440.

**B2 · Rig poses for the lean** (M) — Dev B

- File: `src/components/TrustFallCharacter.tsx` (+ its CSS).
- Add states: `leaning` (rotated forward from the feet, arms out),
  `held` (leaning, palms raised to meet a partner), `holding-back` (upright,
  half-step back, arms in), `toppled` (face-down on the ground; reuse
  `impact`). Keep the existing states working, since other screens use them.
- Add a `facing: "left" | "right"` prop (mirror via `scaleX(-1)`) and a
  `surface: "counter" | "receipt"` prop for ink colour.
- Export the hand position per pose so `Thread` can attach to it.
- Reduced motion: poses switch with no transition.
- Done: a debug preview shows all poses in both facings, on both surfaces.

### Phase 2 — The story

**B3 · The trust lean scene** (L) — Dev B. _The most important ticket._

- Files: `src/components/visual/TrustStage.tsx`,
  `src/styles/trust-experiment.css`.
- Keep the public props (`TrustStageProps`) and the rule that **the stage
  never computes payoffs or reads hidden moves**. Nine screens use it, so
  changing that contract breaks them.
- Replace the cones and wind lines with: a wide `Receipt` carrying the scene,
  a printed ground line, two figures facing each other across a gap, and the
  `Thread` running between their hands with `twists = trustAltitude`.
- Before the reveal, each figure holds a `ReceiptStub` with a `SEALED` stamp
  (no move value in the DOM). On reveal the stubs tear off.
- Replace `outcomeActorState` with the table in `design.md` §7 (pose and
  thread state for each move pair). Put the table in a comment so the reviewer
  can check every pair.
- Reveal choreography (one GSAP timeline): stubs tear → poses + thread →
  stamp lands → `onRevealComplete` callback (new, optional prop) so the round
  receipt knows when to feed out.
- Noise stays: a recorded flip shows a gust tugging that figure's thread, plus
  text naming which move changed (as today).
- Done: all 4 outcomes plus a noise flip, in screenshots and a short screen
  recording; reduced motion jumps straight to the final state; the hidden-move
  rule still holds (inspect the DOM in the "sealed" phase: no move value).

**B4 · Round receipt and takeaway** (S) — Dev B

- `src/components/receipt/RoundReceipt.tsx`: prints round number, time, your
  move, partner's move, points, trust twists, the outcome `Stamp`, the
  `PRACTICE — NOT ON-CHAIN` stamp when `mode="practice"`, and the takeaway at
  the foot: primitive mark + “Used: The Seal” + one everyday line + “Where this
  shows up” link.
- Props come from the caller (moves, points, mode, primitiveId). It never
  computes outcomes or payoffs.
- Feeds out with `--dur-print` / `--ease-feed`; reduced motion just fades in.
- Which primitive to show: practice rounds 1–2 → The Seal; round 3+ → The
  Handshake. ZK result → The Net (on confirmed settlement) or The Pass (after
  an accreditation proof). Document this mapping in the file.
- Done: renders for all 4 outcomes, both modes, with focus-visible on the link.

**A2 · App shell** (M) — Dev A

- File: `src/components/AppShell.tsx` → `src/styles/shell.css`.
- Nav on a `--color-counter-2` strip: wordmark "Latep" (display face) left;
  links **Learn · Tournament · Everyday · Play with a friend** (`/real-life`
  is labelled _Everyday_; `/play` is _Play with a friend_); wallet button
  right with the "Testnet" badge (print font) inside it. Remove the duplicate
  "ZK multiplayer" button and the emoji.
- Under 768px: wordmark + "Menu" button opening a sheet. One row, never two.
- Stop rendering `CustomCursor` and `TopographicBackground` (don't delete the
  files yet).
- Replace the audio emoji with `lucide-react` `Volume2` / `VolumeX`.
- Done: nav fits on one row at 320px; the active link is shown by underline
  plus weight, not colour alone; keyboard order is logical.

**A3 · Home** (L) — Dev A. _Depends on B3 and B4. Build the layout against
the current stage first, then swap._

- Files: `src/pages/Home.tsx`, `src/components/TrustExperiment.tsx` (markup
  and styles only), new `src/styles/home.css`.
- Layout (Stage-led, left-biased, on the counter):
  1. **Opening:** a short situation, then the line "Lean in. Will they?"
     Draft copy (refine with the lead): _"You’ve paid a stranger before and
     hoped they’d deliver. That’s the whole game. Play one round."_ No eyebrow,
     no centred block.
  2. **The scene** (B3) with the two move tiles under it.
  3. **The round receipt** (B4) feeding out after each reveal; earlier rounds
     stack into a short history strip joined by the thread.
  4. **"Four things you’ll use"**: the four primitives as a row of stubs
     (mark, name, one line), each linking to its lesson. Not cards.
  5. **Where next**: three text rows (Practice against strategies · Watch a
     tournament · Play with a friend on Stellar), each a one-line description
     and a link. This replaces the three emoji cards and the hint banner.
- Keep the welcome wizard and personality quiz reachable, but quiet (text
  links in "Where next").
- Done: matches `design.md` at all five widths; zero emoji and zero colour
  literals in `Home.tsx`; the full play → reveal → receipt → play again loop
  works by keyboard.

### Phase 3 — Sweep every surface

Each ticket: decide each element's surface (counter or receipt), convert
inline styles per section 3, replace emoji, apply the vocabulary, fix the
listed bugs. Split large files into several PRs.

**Dev A**

- **A4 · Learn journey** (L): `src/pages/LearnJourney.tsx`, `SlideSystem.tsx`,
  `src/components/slides/*` _except_ `TournamentMode.tsx`,
  `TournamentSlide.tsx`, `PayoffMatrixEditor.tsx`, `StrategyInspector.tsx`;
  `src/components/learning/*`, `src/styles/learning.css`, `slides.css`,
  `balloon.css`. The lesson text for each chapter sits on a receipt. The
  epilogue becomes the four-primitive recap using `primitives.ts`. Introduce
  "(cooperate)" / "(defect)" once in the Choice chapter.
- **A5 · Tutorial sandbox** (L): `src/pages/TutorialSandbox.tsx` (27 emoji).
  Workbench layout: settings on a straight receipt in the left column, the
  scene in the main column, and the move history as a strip of `RoundReceipt`s
  joined by the thread (with a compact table view toggle for long sessions).
- **A6 · ZK lobby, setup, commit** (L): `GameLobby.tsx`, `MatchSetup.tsx`,
  `CommitMove.tsx`, `MatchCommitMove.tsx`, `NonceCard.tsx`, `ZKStepIndicator.tsx`,
  `OnboardingOverlay.tsx`, `WalletSetupHelper.tsx`, `FundAccountButton.tsx`,
  and the lobby/commit sections of `ZKGamePage.tsx`. Commit prints a stub:
  `SEALING…` while the proof generates, then separate lines for proof
  generated, submitted, and confirmed, each driven by real state. The nonce
  card becomes the stub you keep ("Keep this half").

**Dev B**

- **B5 · Everyday page** (M): `src/pages/RealLifePage.tsx`. Rebuild from
  `primitives.ts`: one receipt per primitive with its mark, the everyday
  problem, what the math adds, and a "try it" link to the lesson or round
  where it's felt. The honest-scope note becomes a small receipt footer.
  Remove emoji and the card stack.
- **B6 · Tournament till roll** (L, 2–3 PRs): `src/pages/TournamentPage.tsx`,
  `TournamentMode.tsx`, `TournamentSlide.tsx`, `TournamentViz.tsx`,
  `PayoffMatrixEditor.tsx`, `StrategyInspector.tsx`, `StrategyCard.tsx`,
  and strategy display names/emoji in `src/util/strategies.ts` (**display
  strings only**, approved by the project owner). Each generation prints as a
  section of a till roll (population per strategy as printed bars with names).
  Strategies are told apart by name plus thread pattern, not nine colours.
  Fix: the duplicate page title ("The Tournament" + "Tournament of Trust");
  near-invisible payoff inputs and preset tabs; the invisible "Stage: Ready"
  value.
- **B7 · ZK reveal, result, scoreboard, accreditation** (L):
  `RevealMove.tsx`, `GameResult.tsx`, `MatchScoreboard.tsx`, `StatsDisplay.tsx`,
  `VerifiedOnChainCard.tsx`, `PayoffMatrixReminder.tsx`, `AccreditationPanel.tsx`,
  `StickManScene.tsx` (switch to the lean poses and thread), and the
  reveal/result sections of `ZKGamePage.tsx`. Reveal shows the two torn halves
  matching (The Handshake). The result is a full `RoundReceipt` in ZK mode:
  tx ids with explorer links only once confirmed, escrow settlement lines,
  and The Net takeaway. Accreditation prints a Pass ("Verified: on the list ·
  which entry: hidden"). **Coordinate with Dev A on `ZKGamePage.tsx`:** A takes
  lines above the reveal phase, B below, and you merge A6 before B7.

**Shared, after both are done**

- `PersonalityQuiz.tsx`, `FirstRunWizard.tsx`, `ReactiveMascot.tsx`,
  `MascotContext.tsx`, `AchievementToast.tsx`, `SuccessCelebration.tsx`,
  `ShareableResult.tsx` (becomes a shareable receipt), `NotificationProvider.css`,
  `ErrorState.tsx`, `EmptyState.tsx`, `LoadingSpinner.tsx`: whoever finishes
  first takes them, announced in the team channel first.

### Phase 4 — Clean up and prove it

- **A7 · Remove legacy aliases** (S): delete the `LEGACY` block in
  `index.css`, fix whatever still referenced it. `design:check` hits targets.
- **A8 · Mobile and a11y QA** (M): every route at 320/375/414/768/1440;
  keyboard-only run of the practice round, a lesson, and the tournament;
  contrast check on both surfaces with devtools; fix findings.
- **B8 · Motion QA** (S): reduced-motion pass on every animated screen; no
  `transition: all`, no springs; `--ease-feed` used only for the receipt feed;
  one orchestrated moment per view.
- **B9 · Deletions** (S): **needs explicit sign-off from the project owner
  first.** Candidates, all unused after Phase 2–3 (verify each with a search
  before proposing): `ui/CustomCursor.tsx`, `ui/ShimmerButton.tsx`,
  `ui/ElectricButton.tsx`, `ui/StaggerButton.tsx`, `hooks/useMagnetic.ts`,
  `visual/TopographicBackground.tsx`, `visual/TrustFallFigure.tsx` (already
  unused), `DemoRound.tsx` (already unused), `Character.tsx` (if
  `AITutorPanel` moves to the rig). Keep `styles/balloon.css`: `LearnJourney`
  still imports it; it's restyled in A4.
- **Merge `redesign` → `main`** after the lead's final review and the 5-person
  comprehension test from section 1.

---

## 7. PR template

```
## Ticket
A3 · Home

## What changed
- …

## Screenshots
| | Before | After |
| 390  | … | … |
| 1440 | … | … |

## Checks
- [ ] npm run build
- [ ] npm run lint
- [ ] npm run design:check (numbers: colours 527→___, styles 941→___, emoji 329→___)
- [ ] Keyboard: tabbed through every control on the screen
- [ ] Reduced motion: toggled in devtools, flow still works
- [ ] Every element uses one surface's tokens (counter or receipt)
- [ ] No files touched outside my ticket's list
- [ ] No logic files touched (services/util/contracts/hooks/providers)
```

---

## 8. How review works

The lead (with the AI reviewer) checks every PR against this list. Anything
in **Blockers** sends it back.

**Blockers**

- Logic or behaviour changed (game rules, payoffs, proofs, wallet, contract
  calls, hidden-move rule), or a file outside the ticket was touched.
- A receipt line or stamp claims a proof, transaction, or settlement that the
  app state doesn't confirm; a practice receipt missing its stamp.
- A hardcoded colour, emoji, gradient, glow, glass, spring easing, or
  `transition: all` added.
- `design:check` numbers went up.
- An `aria-*`, `role`, `data-testid`, or handler removed or renamed.
- An outcome shown by colour alone; a heading in italic; text that wraps a
  button to two lines; horizontal scroll at 320px.
- Invented numbers in copy.

**Should fix**

- Words that don't match `design.md` §7 vocabulary.
- Counter tokens used on a receipt or the reverse; long text sitting directly
  on the counter.
- More than one decorative motion in a view; a panel inside a receipt.
- Class names describing looks instead of purpose.
- Missing focus-visible, disabled, or loading state.

**Nice to have**

- Curly quotes, real ellipses, tabular numbers, tidy spacing tokens.

---

## 9. Decisions

Locked by the project owner (2026-10-12):

- **Visual direction: Receipts + Threads**, as defined in `design.md`.
- **Decision 1 — the trust lean replaces the one-way trust fall** as the core
  picture (section 1). The name, the "trust me, trust me not" story, and the
  falling rig all stay; the lean poses are additive, so the fall survives for
  the ZK commit/reveal beats. Unblocks B2 and B3.
- **Decision 2 — nav labels are "Everyday"** (`/real-life`) **and "Play with a
  friend"** (`/play`). Unblocks A2.
- **Decision 3 — merge timing.** `main` is frozen until after the Oct 13
  submission. All redesign work lands on `redesign`; `redesign` merges to `main`
  after Phase 4 review. A winner-announcement hotfix on `main` is not a
  conflict risk: rebase the ticket branches forward when it lands.
- **Decision 4 — the deletion list** (B9) still needs sign-off when Phase 3 is
  done. Candidates are listed in B9; none may be removed before that.
- **Decision 5 — strategy display names in `src/util/strategies.ts`** may be
  edited for emoji removal only (B6).
