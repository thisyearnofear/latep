---
format: 1920x1080
message: "Trust is proven, not promised — two ZK primitives, working on Stellar."
arc: Hook → Problem → Product → Proof#1 → Proof#2 → Stack → CTA
audience: technical hackathon judges (Stellar core devs, ZK researchers)
---

## Video direction

- **Palette** — deep-navy canvas (`#0a0e1a`), off-white / warm-white ink for body, warm-gold (`#f0a020`) as the honest accent (identity / labels / hairlines), violet (`#667eea`) as the proof accent (ZK verdicts, wordmark, primary CTA). Green (`#4ade80`) reserved for "verified ✓" state only. Never invent; every color role is `frame.md`.
- **Motion grammar + reveal model** — long-tail smooth (`power3` default), never bouncy. Every frame is VO-paced or beat-paced: at t=0 only the current beat's element enters; each further piece reveals on its spoken/visual cue, spreading reveals across the back ~50%. During a hold, at most **subtle jitter** on the held hero; no lazy breathing, no forced camera drift.
- **Rhythm / held-frame allocation** — held reads live at Frames 5, 7, 9-end, 10-end, 11-end (the title cards + the receipts). The two live-video beats (6 + 8) sustain live motion via the playing footage; typography lands still to let the callouts read.
- **Negative list** — no browser chrome, no real cursors overlaid on video (the video already carries the interaction), no lens-flares, no floating bokeh, no purple-blue "AI" gradients, no bouncy/elastic eases, no PowerPoint-style all-at-once entrance (front-load then freeze), no screensaver-style independent-drift bloom. No exposed contract-ID / Merkle-root text overlaps the caption band (bottom ~17%).

## Frame 1 — Hook

- scene: "Trust is proven, not promised" — kinetic word-swap on canvas, mascot silhouette pops on the payoff
- duration: 12s
- transition_in: cut
- status: animated
- blueprint: kinetic-type-beats (Reproduce)
- asset_candidates: (none — synthesized)
- focal: hero-line "Trust is PROVEN, not promised"
- roles: canvas = deep-navy full-bleed background; hero-line = cutout centered upper-two-thirds; mascot silhouette = cutout supporting
- sfx: impact-soft (on the word swap), sub-thud (on mascot pop)
- src: compositions/frames/01-hook.html

Reproduce: `kinetic-type-beats` slotted with a two-word swap payoff.

Scene 1 (0.0–2.5s): deep-navy canvas holds; "Trust is…" per-word-staggered reveals centered upper-third in Instrument Serif display, warm-white → `dynamic-content-sequencing`. Centered, ~40% of frame. Nothing else on canvas.
Scene 2 (2.5–5.5s): "promised." types in below on the same baseline in Instrument Serif display, muted white → type-on with caret. Layout unchanged. Held read for 1.5s.
Scene 3 (5.5–7.5s): the word "promised" swaps in-place to "PROVEN" (violet display, +8% weight-optical) via in-place token cycle + spring-pop entrance (long-tail settle, no overshoot) → `spring-pop-entrance` + `discrete-text-sequence`. Layout unchanged.
Scene 4 (7.5–12.0s): a small stick-figure mascot silhouette drops centered below the payoff line (spring-pop, long-tail) → `spring-pop-entrance`, then subtle-jitter for the hold → `sine-wave-loop` (low-amplitude). Micro-label "Latep · ZK on Stellar" fades in bottom-left in Inter caps rail-label. Layout: centered hero + bottom-left chrome anchor. Held read; the swap has already earned it.

## Frame 2 — The problem: identity + integrity

- scene: Two-word beats stack: "IDENTITY" and "INTEGRITY" land as separate lines, then "without doxxing" wipes across underneath
- duration: 18s
- transition_in: crossfade
- status: animated
- blueprint: kinetic-type-beats (Adapt)
- asset_candidates: (none — synthesized)
- focal: stacked pair "IDENTITY / AND INTEGRITY"
- roles: canvas = background; rail-label = supporting; IDENTITY / INTEGRITY / disclaimer = cutout hero stack
- sfx: impact-soft ×2 (on the two beat slams), typewriter-quiet (on the disclaimer)
- src: compositions/frames/02-problem.html

Adapt: `kinetic-type-beats` extended to a three-beat vertical stack (rather than in-place swap) to accommodate a longer premise. Keep the beat-slam signature: each beat lands alone before the next enters.

Scene 1 (0.0–2.0s): "Real trust needs" rail-label types in upper-third (Inter caps, warm gold) → `discrete-text-sequence` + `context-sensitive-cursor`. Rule-of-thirds framing, ~15% of canvas.
Scene 2 (2.0–6.5s): "IDENTITY" (Instrument Serif display, warm-gold) beat-slams centered under the rail-label with a long-tail settle → `kinetic-beat-slam`. Layout shifts to centered hero, ~50% of canvas.
Scene 3 (6.5–11.0s): "AND INTEGRITY" (Instrument Serif display, violet) beat-slams below "IDENTITY" — same treatment, different accent → `kinetic-beat-slam`. Stack now reads as a paired pair; layout centered, hero density ~55%.
Scene 4 (11.0–14.5s): "— without doxxing." types in below the pair in Inter body-lede, muted white → `discrete-text-sequence` + `context-sensitive-cursor`. Held on the completed premise.
Scene 5 (14.5–18.0s): held read on the full stack with subtle-jitter on IDENTITY + AND INTEGRITY only → `sine-wave-loop` (low-amplitude). The disclaimer stays still. This is the frame that earns its own hold.

## Frame 3 — Meet Latep (video-driven)

- scene: FirstRun wizard footage plays as base; overlay title "Meet Latep" fades in over the last 3s
- duration: 12s
- transition_in: crossfade
- status: animated
- blueprint: compose
- asset_candidates: capture/assets/clip-01-first-run-wizard.webm
- focal: clip-01 wizard footage
- roles: clip-01 = background (full-bleed, hairline-framed at 96%); overlay strip = cutout foreground
- sfx: soft-swoosh (on the overlay strip rise)
- src: compositions/frames/03-meet.html

Compose: no product-launch blueprint fits a raw-footage introduction beat. Base is the app itself; overlay lands late so the viewer sees the product before the label.

Scene 1 (0.0–8.5s): clip-01 plays 100% at 96% canvas width, centered, with a 1px warm-gold hairline frame around it → pan / focus-lock on the running clip → `viewport-change` (static hold; the clip carries motion). Layout: centered hero, ~90% density, 2 depth layers (hairline frame + video).
Scene 2 (8.5–12.0s): overlay strip rises from the lower third (above the caption band), deep-navy panel with hairline top/bottom rules → spring-pop entrance (subtle, long-tail) → `spring-pop-entrance`. Inside: "Meet Latep" (Instrument Serif display, off-white) + "an interactive game about trust — with real cryptographic stakes." (Inter body-lede, muted). Held read; the clip keeps playing behind.

## Frame 4 — The app in action (video-driven, two-clip cascade)

- scene: Quiz clip (03) plays center, then wipes to Tournament clip (04) with a single hairline transition; overlays name the beats
- duration: 20s
- transition_in: cut
- status: animated
- blueprint: compose
- asset_candidates: capture/assets/clip-03-personality-quiz.webm, capture/assets/clip-04-tournament-evolution.webm
- focal: clip-03 (first half) then clip-04 (second half)
- roles: clip-03 = background hero (first half); clip-04 = background hero (second half); rail-label = cutout supporting
- sfx: subtle-whoosh (on the hairline wipe seam)
- src: compositions/frames/04-app-in-action.html

Compose: two-clip diptych-in-time. The seam is the shape.

Scene 1 (0.0–1.0s): clip-03 fades up to 100% at 96% width, centered with hairline frame → viewport-change (still holding). Rail-label "quiz your instincts" bottom-left types in warm-gold caps → `discrete-text-sequence` + `context-sensitive-cursor`.
Scene 2 (1.0–9.0s): clip-03 plays through; the quiz answers cascade on-screen naturally. No overlay motion; the clip does the work. Layout: centered hero, ~90% density.
Scene 3 (9.0–10.5s): hairline sweeps left-to-right across the canvas, clip-03 wipes off with cut-the-curve, clip-04 slides in behind in the same direction at matched velocity → `cut-catalog.md` (cut-the-curve seam) + `svg-path-draw` on the hairline.
Scene 4 (10.5–19.0s): clip-04 plays through, the population bar chart animating across generations. Rail-label swaps in-place from "quiz your instincts" to "watch trust evolve at scale" via in-place token cycle → `discrete-text-sequence`. Layout unchanged.
Scene 5 (19.0–20.0s): held on the final generation of the tournament; rail-label still. The population chart is the still resolution.

## Frame 5 — Proof #1 title card

- scene: Title card "Proof #1 · Private Accreditation" reveals with a single restrained hairline sweep
- duration: 5s
- transition_in: crossfade
- status: animated
- blueprint: titlecard-reveal (Reproduce)
- asset_candidates: (none — synthesized)
- focal: title stack "PROOF #1 / Private Accreditation"
- roles: canvas = background; hairline = supporting; title stack = cutout hero
- sfx: hairline-draw-tick (soft mechanical tick on the sweep)
- src: compositions/frames/05-proof1-card.html

Reproduce: `titlecard-reveal` slotted with our proof label.

Scene 1 (0.0–1.5s): warm-gold hairline draws in horizontally across the middle of the canvas, left → right → `svg-path-draw`. Centered framing, ~65% width.
Scene 2 (1.5–3.5s): "PROOF #1" (Inter caps rail-label, warm-gold) fades in above the line and "Private Accreditation" (Instrument Serif display) lands below the line — per-word staggered reveal on the display line → `dynamic-content-sequencing`. Layout: centered title stack, upper-two-thirds, ~40% density.
Scene 3 (3.5–5.0s): sub-line "prove you're allowed to play — without saying who you are." types in below in Inter body → `discrete-text-sequence` + `context-sensitive-cursor`. Held read to the exit.

## Frame 6 — Accreditation, live on-chain (video-driven)

- scene: Clip 05 plays as base; overlay callouts point at Merkle root chip + Poseidon depth chip; "Signing on Stellar…" card covers the last 1.5s
- duration: 13.077s
- transition_in: cut
- status: animated
- blueprint: compose
- asset_candidates: capture/assets/clip-05-accreditation-zk.webm
- focal: clip-05 accreditation panel
- roles: clip-05 = background hero; callout labels + arrows = cutout foreground supporting; "Signing" card = cutout hero (final beat)
- voiceover: "Prove you're on the allowlist — without revealing which credential is yours. A Poseidon Merkle root, plus a nullifier, verified on-chain by an UltraHonk verifier. No identity leaked."
- sfx: subtle-tick (each callout arrival), soft-thunk (on "Signing" card), success-chime (on the verified ✓ chip)
- src: compositions/frames/06-accreditation-live.html

Compose: the money shot. Reveals are paced strictly to the VO — nothing appears before the narrator has named it. All overlay callouts sit outside the video letterbox so they never occlude the interactive UI they're describing.

Scene 1 (0.0–4.0s): clip-05 plays at 96% width, centered with hairline frame → viewport-change. As VO begins "Prove you're on the allowlist", the phrase "Prove you're on the allowlist" fades in upper-right in Inter body-lede via per-word staggered reveal → `dynamic-content-sequencing`. Layout: centered video + upper-right VO-label.
Scene 2 (4.0–8.0s): as VO reaches "which credential is yours", a warm-gold hairline arrow draws from the upper-right label down to the "Root: 0365f89d…" chip visible in the video → `svg-path-draw`; the chip receives a keyword-glow pulse → `asr-keyword-glow`. Callout text "Poseidon Merkle root · depth 4" types in beside the arrow → `discrete-text-sequence`.
Scene 3 (8.0–13.0s): as VO says "plus a nullifier", a second hairline arrow draws to the "Technical details" section; callout "nullifier prevents replay — without linking identity" per-word staggers in → `svg-path-draw` + `dynamic-content-sequencing`. First callout dims to 40% to defer to the new one.
Scene 4 (13.0–17.0s): as VO says "verified on-chain by an UltraHonk verifier", third callout draws to the "Prove Accreditation" CTA in the video; "UltraHonk proof · generated client-side" text lands beside it → `svg-path-draw` + `dynamic-content-sequencing`. The CTA in the video receives keyword-glow → `asr-keyword-glow`.
Scene 5 (17.0–19.5s): video freezes on the last frame; "Signing on Stellar…" card slides up from the bottom over the CTA area (deep-navy, hairline-bordered, small Inconsolata tx-hash placeholder counting) → `spring-pop-entrance` (long-tail settle). Card sits ~40% of frame centered on the CTA position.
Scene 6 (19.5–22.0s): as VO delivers "No identity leaked.", the "Signing" card scale-swaps into a violet "✓ Verified on-chain" chip → `scale-swap-transition` + `spring-pop-entrance`. The "No identity leaked." payoff lands centered lower-third in Instrument Serif display. Held read to the exit; no jitter (the verdict is enough).

## Frame 7 — Proof #2 title card

- scene: Title card "Proof #2 · Binding Move Commitment" mirrors the Proof #1 card design
- duration: 5s
- transition_in: crossfade
- status: animated
- blueprint: titlecard-reveal (Reproduce)
- asset_candidates: (none — synthesized)
- focal: title stack "PROOF #2 / Binding Move Commitment"
- roles: canvas = background; hairline = supporting; title stack = cutout hero
- sfx: hairline-draw-tick
- src: compositions/frames/07-proof2-card.html

Reproduce: same shape as Frame 5 — the symmetry earns the parallel. Motions identical, only labels differ.

Scene 1 (0.0–1.5s): warm-gold hairline draws horizontally → `svg-path-draw`.
Scene 2 (1.5–3.5s): "PROOF #2" caps above; "Binding Move Commitment" (Instrument Serif display) below with per-word staggered reveal → `dynamic-content-sequencing`.
Scene 3 (3.5–5.0s): sub-line "the proof makes the commit binding at commit time — no griefing, no replay." types in in Inter body → `discrete-text-sequence` + `context-sensitive-cursor`. Held read.

## Frame 8 — Move commitment, live (video-driven)

- scene: Clip 06 plays as base; overlays point at Cooperate/Defect choice + proof formula; "Signing on Stellar…" card covers the last 1.5s
- duration: 12.459s
- transition_in: cut
- status: animated
- blueprint: compose
- asset_candidates: capture/assets/clip-06-commit-proof-gen.webm
- focal: clip-06 commit flow
- roles: clip-06 = background hero (playback rate ~0.4×); callout labels + arrows = cutout supporting; formula chip + "Signing" card = cutout hero (mid + late)
- voiceover: "The proof makes the commit binding at commit time. Not just secret — provably a valid move, with a known preimage. Garbage commitments get rejected before your opponent locks their stake."
- sfx: subtle-tick (callouts), formula-lock (on the keccak256 chip settle), soft-thunk (on "Signing" card), success-chime (on ✓ chip)
- src: compositions/frames/08-commit-live.html

Compose: mirror of Frame 6 in shape (video + VO-paced callouts + Signing card + verdict chip). Clip 06 is only ~8s of source but the beat needs ~17s, so play it at 0.4× via `playbackRate` on the `<video>` element so it fits without freeze-holds.

Scene 1 (0.0–4.0s): clip-06 begins at 96% width with hairline frame; VO opens "The proof makes the commit binding at commit time" — phrase per-word staggers in upper-right in Inter body-lede → `dynamic-content-sequencing`.
Scene 2 (4.0–8.0s): as VO says "Not just secret — provably a valid move", a hairline arrow draws to the Cooperate/Defect buttons in-video; Inconsolata mono chip "move ∈ {0, 1}" lands beside the buttons → `svg-path-draw` + `spring-pop-entrance`.
Scene 3 (8.0–13.0s): as VO says "with a known preimage", a second arrow draws to the ✋ "Let go" CTA; the formula chip "keccak256(move ∥ nonce ∥ game_id) == commitment" lands centered upper-third in Inconsolata mono → `svg-path-draw` + `spring-pop-entrance` (long-tail settle). Existing callouts dim to 40%.
Scene 4 (13.0–17.0s): as VO delivers "Garbage commitments get rejected before your opponent locks their stake", overlay strip "UltraHonk proof rejects garbage commitments" lands lower-third-above-band with per-word staggered reveal → `dynamic-content-sequencing`. Video is now ~mid-flow, showing the "Falling…" state visually.
Scene 5 (17.0–20.0s): video freezes; "Signing on Stellar…" card slides up (mirrors Frame 6 exactly) → `spring-pop-entrance`; scale-swap to violet "✓ Committed on-chain" chip → `scale-swap-transition` + `spring-pop-entrance`. Held read.

## Frame 9 — The stack under the hood

- scene: Synthesized diagram — Noir → bb.js → UltraHonk verifier → Soroban contract, with contract ID and Protocol 25/26 chips
- duration: 14.037s
- transition_in: crossfade
- status: animated
- blueprint: dataviz-countup (Adapt)
- asset_candidates: (none — synthesized)
- focal: horizontal stack flow (4 nodes)
- roles: canvas = background; flow-line = supporting; 4 nodes + 2 protocol chips + contract-ID line = cutout hero group
- voiceover: "Noir circuits. Browser-side proofs via bb.js. UltraHonk, verified in a Soroban contract — using Stellar's native Poseidon and BN254 host functions."
- sfx: chip-arrival ×4 (per node spring-pop), chip-arrival ×2 (per protocol chip), typewriter-quiet (contract-ID reveal)
- src: compositions/frames/09-stack.html

Adapt: `dataviz-countup`'s "push-through the data → land on the receipt" spine — but recast as a horizontal component flow rather than a count-up ring. The receipt is the contract ID.

Scene 1 (0.0–3.0s): warm-gold hairline flow-line draws left-to-right across mid-canvas → `svg-path-draw`. As VO says "Noir circuits", the first node "Noir circuits" spring-pops on the left end of the line → `spring-pop-entrance` (long-tail). Layout: horizontal strip mid-canvas, 3 depth layers (canvas + line + nodes).
Scene 2 (3.0–6.0s): as VO says "Browser-side proofs via bb.js", second node "bb.js · browser · lazy-loaded" spring-pops next along the line → `spring-pop-entrance`; a small hairline arrow connects node 1 → node 2 → `svg-path-draw`.
Scene 3 (6.0–9.0s): third node "UltraHonk proof" pops, then fourth node "Soroban contract" pops (both spring-pop, staggered ~0.4s apart) → `spring-pop-entrance`. Arrows chain between them → `svg-path-draw`. VO delivers "UltraHonk, verified in a Soroban contract".
Scene 4 (9.0–12.0s): as VO says "using Stellar's native Poseidon and BN254 host functions", two chips spring-pop below the flow: "Protocol 25 · Poseidon host fn" (warm-gold chip) and "Protocol 26 · BN254 host fns" (violet chip) → `spring-pop-entrance`.
Scene 5 (12.0–15.0s): contract ID `CCYHIUOAUWFCWA5RV34UPT4SEXJFNE3SITGFR5HM2BL2K2RFOSGECE4P` types in Inconsolata mono at the bottom edge (above the caption band), one chunk at a time → `discrete-text-sequence` + `context-sensitive-cursor`. "on testnet" violet pill fades in beside it. Held read to the exit — receipts don't need motion.

## Frame 10 — On-chain outcome (synthesized)

- scene: Escrow → payout diagram; contract emits event; both moves revealed, keccak256 verified as truth check
- duration: 13s
- transition_in: crossfade
- status: animated
- blueprint: compose
- asset_candidates: (none — synthesized)
- focal: escrow chip → keccak256 verdict → payout arrows
- roles: canvas = background; two mascots + escrow chip + verdict chip + arrows = cutout hero group
- sfx: gentle-shimmer (on escrow chip glow), formula-lock (on verdict), coin-tick ×2 (on the two payout arrows)
- src: compositions/frames/10-outcome.html

Compose: substitute for the missing clip 07. Recap the whole game loop in one still visual.

Scene 1 (0.0–3.0s): deep-navy canvas; two stick-figure mascots (violet + warm-gold coded, matching in-app colors) spring-pop in from opposite sides at 25/75 horizontal positions → `spring-pop-entrance`. An escrow chip "5 XLM" spring-pops into the middle between them, ambient-glow blooming softly around it → `spring-pop-entrance` + `ambient-glow-bloom` (subtle).
Scene 2 (3.0–7.0s): mono chip "keccak256(move ∥ nonce ∥ game_id)" lands above the escrow (Inconsolata) via per-word staggered reveal → `dynamic-content-sequencing`; then scale-swaps to "= commitment ✓" with keyword-glow on the ✓ → `scale-swap-transition` + `asr-keyword-glow`.
Scene 3 (7.0–10.0s): the escrow chip splits — two payout arrows draw outward returning stake to each mascot → `svg-path-draw`. Small "+2.5 XLM" chips spring-pop beside each mascot → `spring-pop-entrance`.
Scene 4 (10.0–13.0s): rail-label lands lower-third: "commit-reveal, resolved — no wallet needed to trust the outcome." per-word staggered reveal → `dynamic-content-sequencing`. Held read to the exit.

## Frame 11 — Close

- scene: Hero landing footage plays; URL + contract ID chip build over it
- duration: 10s
- transition_in: crossfade
- status: animated
- blueprint: logo-assemble-lockup (Adapt)
- asset_candidates: capture/assets/clip-08-close.webm
- focal: "Latep" wordmark + latep.trustfall.xyz URL pill
- roles: clip-08 = background (dimmed to ~70%); wordmark + URL pill + contract-ID chip = cutout hero lockup
- sfx: soft-swoosh (on wordmark assemble), hairline-draw-tick (on the URL underline)
- src: compositions/frames/11-close.html

Adapt: `logo-assemble-lockup`'s "elements assemble into a centered lockup, extended to URL/CTA" — kept fully. The signature move is the assemble-into-lockup; we keep it and land it over the live clip 08 as base.

Scene 1 (0.0–4.0s): clip-08 fades up to 100% at 96% width, dimmed to ~70% brightness so it reads as base → viewport-change (still hold). Layout: centered hero video.
Scene 2 (4.0–7.0s): "Latep" wordmark (Instrument Serif display, off-white) assembles over the video via per-word/per-letter staggered reveal on a long-tail settle → `dynamic-content-sequencing` + `spring-pop-entrance`. Layout: centered upper-two-thirds.
Scene 3 (7.0–9.0s): "latep.trustfall.xyz" URL pill (violet accent, off-white text) spring-pops below the wordmark → `spring-pop-entrance`. Contract ID chip "CCYHIUOAUWFCWA5RV34UPT4SEXJFNE3SITGFR5HM2BL2K2RFOSGECE4P" (Inconsolata mono, small) fades in below the URL pill, above the caption band.
Scene 4 (9.0–10.0s): a single warm-gold hairline sweeps beneath the URL pill as an underline → `svg-path-draw`. Held read; final 500ms is the video's authored exit fade to deep-navy (this frame owns its own exit, not the harness).
