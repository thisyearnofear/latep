# Latep — Vision

Status: draft for discussion. This is a direction, not a spec. It extends
`REDESIGN_PLAN.md` (receipts and threads) and turns it into interactions.
Where it conflicts with the plan, the plan wins until the owner signs off.

---

## 1. The one idea

**Everything starts as pencil. Colour arrives when someone commits.**

The whole product is a sketchbook. Before a choice, both players are
drawn in pencil: unfinished, unknown. When you seal a move, your side
gets ink. When the round reveals, both sides are inked at once, and the
thread between you either twists tighter or snaps.

This makes the mechanic visible without a single explanatory sentence:

- **Colour means "decided".** Pencil means "not yet", for you and for the
  opponent. Nothing in the picture is coloured until it is actually
  committed.
- **Hidden moves stay hidden in the picture too.** The opponent's side stays
  pencil until reveal, so the visual rule matches the hidden-move rule the
  app already enforces.
- **Colour is not decoration.** Blue is you and amber is your partner
  (already in `tokens.css`). Here, colour is a status signal, not a theme.

Why this is the differentiator: most explainers use colour as mood. Here
colour is the state of the game. It is hard to copy without copying the
mechanic.

## 2. Influences, and what we take from each

| Source                                                                                                                                                                                                                                                                                 | What it shows                                                                                                                                                                            | What we take                                                                                                                                                                                                        |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Codrops, "Sketching the Impossible" (June 2026) — a 3D portfolio built from hand-drawn textures, where every clickable element starts as a black-and-white sketch and fills with colour on hover via a brush-stroke shader. Source on GitHub.                                          | Colour as an affordance and a signal. A sketch-to-paint reveal reads as "this is live."                                                                                                  | The pencil-to-ink commit reveal. We do it in SVG and GSAP, not a custom shader. Hover is replaced by press-and-hold on touch (see §5).                                                                              |
| Codrops, "More Than a Portfolio" (April 2026) — a scroll-driven 3D world where each section is a scene and scroll maps to camera. Input is unified through GSAP Observer, so mouse, touch and trackpad behave the same. Projects open with their own transition, not the default fade. | Walking through a space beats scrolling a page. Each chapter should earn its own transition.                                                                                             | The learn journey as a sequence of scenes that each open differently, driven by one scroll-or-tap input. We do not need Three.js for this.                                                                          |
| CodePen, "Receipt — prints using animation-timeline" (2026) — a receipt prints out as the page scrolls, using `animation-timeline: scroll()` on a custom property.                                                                                                                     | Exactly the receipt metaphor, as scroll-linked motion with no JavaScript loop. Progressive enhancement: where `animation-timeline` is unsupported, the receipt should simply be printed. | The round receipt prints as the player scrolls past it. Fallback is the finished receipt, not a broken one.                                                                                                         |
| Nicky Case, "The Evolution of Trust" — the reference interactive explainer for this exact game. Sliders change the rules; you watch populations shift. Public domain; source at github.com/ncase/trust.                                                                                | An explainer where the reader changes a rule and sees the result. Our tournament page should lead with this.                                                                             | Let the visitor drag the temptation payoff and watch the tournament population move. We should extend this idea, not copy it. Note: the live page text did not render in our fetch, so verify the details directly. |
| Codrops, "Demos Hub" and the CodePen "paper effects" collections (torn-edge and ripped-paper CSS).                                                                                                                                                                                     | Torn edges can be done in CSS without images.                                                                                                                                            | Our receipt tear is already a `border-image`. Check the community versions before adding any new paper effect.                                                                                                      |

**What we are not taking:** the dark background with neon accent,
text-left and image-right layouts, and a single long hero followed by
cards. Codrops' own author calls those the default, and so do we.

## 3. The interactions

Each one answers a specific question the visitor has, and each one
respects the honesty rules in `REDESIGN_PLAN.md` §2.

1. **Commit = paint (the core).** You press a move. The tile fills with ink
   along a brush-like wipe (SVG `clip-path` plus a noise mask, driven by
   GSAP). The opponent's tile stays pencil until reveal. At reveal both
   inks land together, and the thread twists or snaps.
   - Honesty rule: ink appears only when app state confirms the move was
     sealed. It must never fire from an animation finishing.
2. **The receipt prints as you read.** The round receipt feeds out line by
   line as you scroll past it, so reading and proof arrive together. Where
   scroll-linked animation is unsupported, the receipt is printed in full.
3. **Rooms, not pages (learn).** Each chapter is a room on one continuous
   path. Scroll or tap advances the camera along it. Each room has its own
   transition: the Seal arrives as a stamp, the Handshake as two torn
   halves meeting, and so on. The four primitives become four doors.
4. **Turn the rule, watch the room (tournament).** Lead with a single
   control, temptation, and a live population chart. The reader changes a
   rule and watches strategies rise and fall. The chart stays truthful to
   the real data; the controls are not decorative.
5. **Pick the thing to hold (everyday).** Each primitive shows a situation
   the visitor has lived through, as a receipt they can pick up. Tapping
   one reveals the lesson where that primitive is felt.

## 4. One scene, many states

Build a single scene component with a small set of states, reused across
home, learn and the round. The scene should not know the game rules. It
receives state from the caller, as `TrustStage` does today.

States: `sealed` (pencil), `revealing` (inks landing), `held`, `snapped`,
`standoff`. The same state set drives the thread, the figures and the receipt.

This also keeps the work small. Adding a new screen means adding a
caller, not another animation.

## 5. Mobile and desktop

**Mobile is the primary surface.** Most of the target audience will meet
this on a phone, so the design starts at 320 px.

- **Portrait first.** The scene takes the top of the screen. The move
  tiles sit within thumb reach at the bottom. No hover-only information.
- **Press and hold replaces hover.** Holding a tile for about 300 ms
  starts the ink, and releasing seals the move. A quick tap also seals it,
  so the gesture never hides the action.
- **Scroll-linked motion needs a fallback.** Print and room transitions tie
  to scroll. With reduced motion or no support, everything shows in its
  final state.
- **No WebGL requirement.** SVG and GSAP only, as `PRODUCT_REVIEW.md`
  requires. The page must work on a low-end phone with no 3D.
- **Performance budget.** Animate `transform`, `opacity` and `clip-path`
  only. Only one orchestrated moment per view.

**Desktop uses the space.** At 1440 px the scene and the receipt sit side
by side, so the visitor can read the receipt while the table stays in view.
Keyboard works throughout: arrows move between tiles, Enter seals, Space
toggles the receipt's detail.

## 6. What "differentiated" should mean here

Use these tests before calling the redesign done:

1. **Five-second test.** Show someone a screenshot with no text. Can they say
   "a game where you decide before seeing the other side"? Target: 3 of 5.
2. **Pencil test.** Does a stranger understand that the grey figure is
   undecided without being told? Target: 4 of 5.
3. **Replacement test.** Swap our palette and fonts for a generic dark UI.
   If the product still reads as Latep, the idea is carrying it. If not,
   the look is carrying it, and the look is the part we can copy.
4. **Five-person comprehension test** from `REDESIGN_PLAN.md` §1, run on the
   new interactions, not the old layout.

## 7. What this asks of the project

- Mostly reuses what is in the repo: GSAP (kept for this reason), SVG
  marks, the receipt kit and the trust stage. No new dependencies.
- The paint wipe is the one new effect. Prototype it on a single tile before
  committing to it everywhere.
- Needs a decision from the owner: whether pencil-to-ink replaces the
  current "Lean in" tile styling, or sits alongside it for the first release.

## 8. Open questions

- Is press-and-hold acceptable for seal, or should a single tap seal and
  press-and-hold preview the move?
- Do the four primitives become rooms in the learn path, or a separate
  "everyday" path that rooms link into?
- Should the tournament lead with the population chart or the rule control?
- Shareable receipt (`ShareableResult`): does the paint state carry into the
  shared image?
