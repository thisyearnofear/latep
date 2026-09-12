# Latep — Development Roadmap

> **Active direction (Sept 2026):** Pattern 3 — Private Reputation — and the HackMeridian 2026 (Scale track) build. See `docs/HACKMERIDIAN.md` for the spec, pitch, and work plan.

## Current design priority — cohesive demo

First slice of the interactive trust stage (see [PRODUCT_REVIEW.md](PRODUCT_REVIEW.md#product-direction--september-2026)):

- [x] Home opens with a wallet-free illustrated practice round (choose → seal → reveal → outcome → replay)
- [x] Welcome wizard and personality quiz are optional actions, not auto-opened overlays
- [x] Local-sealing disclaimer shown in the interface; no proof or transaction implied
- [x] Responsive layout (320–1440) and reduced-motion support; sound is opt-in
- [ ] Carry the stage vocabulary into the tutorial and guided journey
- [ ] Extend the vocabulary to tournament populations
- [ ] Integrate the sealed-choice object with real on-chain multiplayer states
- [ ] Optional stylized Three.js diorama after the 2.5D interaction is reviewed

## 🎯 Current Status: ZK Multiplayer + Multi-Round Matches + Game Theory Sandbox

- ✅ ZK Dilemma Soroban contract (`contracts/zk_dilemma/`) — on-chain UltraHonk proof verification, keccak256 commitment, XLM escrow, forfeit logic, recovery functions (cancel_game, claim_refund), contract events, self-join prevention, **multi-round matches (best-of-3/5 with rematch)**
- ✅ Noir move-commitment circuit (`circuits/move_commitment/`) — keccak256-based, external `noir-lang/keccak256` library
- ✅ UltraHonk verifier integrated (`ultrahonk_soroban_verifier` crate from NethermindEth)
- ✅ soroban-sdk upgraded to 27.x (verifier on upstream `chore/protocol27` branch until NethermindEth/rs-soroban-ultrahonk PR #42 merges)
- ✅ Real ZK proof verified on-chain in Rust tests (19/19 tests passing — 7 single-round + 8 multi-round match + 4 accreditation)
- ✅ Nullifiers computed client-side for any game_id via `poseidon-lite` (matches `noir-lang/poseidon` BN254 params)
- ✅ Proof-generation timeout (`src/util/withTimeout.ts`) — no silent hang on bb.js WASM failure
- ✅ Browser proof generation via `@noir-lang/noir_js` + `@aztec/bb.js` (lazy-loaded, code-split)
- ✅ Contract deployed to testnet: `CCYHIUOAUWFCWA5RV34UPT4SEXJFNE3SITGFR5HM2BL2K2RFOSGECE4P` (includes multi-round match support + recovery functions + events, deployed 2026-07-03)
- ✅ ZK multiplayer frontend — GameLobby, CommitMove, RevealMove, GameResult, OnboardingOverlay, StatsDisplay, MatchSetup, MatchScoreboard, MatchCommitMove
- ✅ `useZKDilemma` hook with typed auto-generated client (all single-round + match functions)
- ✅ `useGameStats` hook — persistent stats and game history in localStorage
- ✅ WASM compiled + TypeScript bindings (regenerated with match functions)
- ✅ Pre-commit hooks with secrets scanning (secretlint) + linting (lint-staged)
- ✅ Interactive slide system (5 slides) with local simulation tutorial
- ✅ Mobile responsive breakpoints across ZK components
- ✅ Auto-retry for game_id race condition in create flow
- ✅ Nonce persisted in localStorage (survives browser close)
- ✅ Move auto-fill in reveal phase
- ✅ Latep thematic UI — the fall, the catch, the impact (CSS animations, trust altitude visual)
- ✅ Iterated tutorial — 9 stateful strategies (TFT, TF2T, Grudge, Pavlov, Prober, Generous TFT, All-C, All-D, Random), move history table, trust altitude, noise slider, payoff matrix editor, strategy inspector
- ✅ Tournament mode — evolutionary simulation, round-robin, population bar chart, auto-play, noise slider, payoff presets, population-over-generations chart, winner detection
- ✅ Configurable payoff matrix — 5 presets (Classic PD, Stag Hunt, Harmony, Snowdrift, High Temptation), live dilemma type detection, custom P/S/R/T editing
- ✅ Noise simulation — "the wind caught you" — random move flips in both tutorial and tournament
- ✅ Strategy inspector — plain-English decision logic, strengths/weaknesses, round-by-round examples for all 9 strategies
- ✅ Achievement system — unlockable badges (first_catch, first_betrayal, tournament_winner, zk_player, zk_winner, etc.) with toast notifications
- ✅ Persistent game stats — W/L/T record, net XLM, cooperation rate, game history
- ✅ Stake guidance — presets (1/5/10 XLM), recommended indicator, lobby filter by stake range
- ✅ Lobby feedback — waiting indicator, copy game link, opponent-joined notification with sound
- ✅ Multi-round matches — best-of-3/5, visual scoreboard, rematch with same opponent
- ✅ Shareable results — generate shareable cards from tournament outcomes
- ✅ Custom cursor with proximity-aware interactions
- ✅ 3D tilt + spotlight on strategy cards
- ✅ Directional slide transitions with parallax

## 🚀 Next: two-wallet e2e, then Pattern 3

- ⬜ End-to-end test with two wallets (last open honesty gap — see `HACKMERIDIAN.md` work plan)
- ▶️ Pattern 3 (Private Reputation) spec + build — see `HACKMERIDIAN.md`

## 🔧 Technical Debt & Optimizations

- ✅ **Mobile responsiveness** — breakpoints added for ZK components
- ✅ **Bundle size** — bb.js/noir.js lazy-loaded (code-split)
- ✅ **Game recovery** — cancel_game + claim_refund for stuck funds
- ✅ **Self-join prevention** — player1 cannot join as player2
- ✅ **Nonce persistence** — localStorage with sessionStorage fallback
- ✅ **Game ID race condition** — auto-retry on create
- ✅ **Contract events** — emitted for all state transitions
- ✅ **Multi-round match support** — Match struct, best-of-3/5, rematch, cancel_match, 8 new tests
- ✅ **Game design closed loops** — post-game Play Again, persistent stats, stake guidance, lobby feedback
- ✅ **Achievement system** — unlockable badges with toast notifications
- ✅ **Dead code removal** — single-player contract stub removed, tutorial uses local simulation
- ✅ **Strategy architecture** — refactored from stateless functions to stateful IteratedStrategy classes
- ✅ **Payoff matrix** — refactored from hardcoded values to configurable PayoffMatrix interface
- **Performance monitoring** and optimization
- **Accessibility compliance** (WCAG 2.1)
- **Internationalization** support
- **Advanced analytics** and user insights
- **Bundle size** — tournament + tutorial code could be code-split from ZK multiplayer bundle

## 📊 Success Metrics

- **User engagement**: Session duration, return rate
- **Educational impact**: Knowledge retention, behavior change
- **Economic activity**: XLM volume, transaction frequency
- **Community growth**: Active users, content creation
- **Academic adoption**: Research citations, educational use

---

_This roadmap follows our core principles: ENHANCEMENT FIRST, AGGRESSIVE CONSOLIDATION, PREVENT BLOAT_
