# Latep

**[latep.trustfall.xyz](https://latep.trustfall.xyz)** — a private reputation primitive for Stellar: **prove your track record to any counterparty without revealing it.** The first issuer is an interactive Prisoner's Dilemma with two real zero-knowledge proof patterns verified on-chain in a Soroban contract.

The name is `petal` backwards: trust me, trust me not.

Strangers can only transact three ways: **trust blindly**, **over-collateralize**, or **publish your history**. Trust blindly doesn't survive volume. Over-collateralizing is capital-inefficient — it is why a borrower with a flawless record still posts a full deposit in Stellar's remittance and OTC corridors, because the lender has no way to check the record. And publishing is becoming untenable: a public track record is permanent, correlatable, and it leaks _who you've transacted with_. For an autonomous agent it is absurd — an agent has no public history to publish and no social graph to borrow one from, so **every new agent starts at zero trust forever.** Latep builds the fourth option.

## What this actually is

**A private reputation primitive for Stellar.** A holder proves they have a record of keeping their word — _"≥T% of my recorded interactions were kept"_ — to any counterparty, without revealing who they are, what they did, or with whom. Reputation is minted **per issuer** into incremental Poseidon Merkle trees on Soroban, so any service can mint for the same holder without changing our contract.

The first issuer is Latep itself: a game-theory learning app (tutorial, tournament, ZK multiplayer) that doubles as a working proof that real ZK verification runs on Stellar today. Two Noir/UltraHonk circuits, verified on-chain via Stellar's native BN254 + Poseidon host functions:

1. **Move commitment binding** — prove a sealed move is valid at commit time, before the opponent stakes funds. Prevents commit-to-garbage griefing in any commit-reveal scheme.
2. **Private accreditation** — prove allowlist membership without revealing which credential is yours. Same pattern as KYC-gated access; includes nullifier replay protection.

A third pattern — **private reputation** (prove a track record without revealing it) — is spec'd but not built, and it is the primitive the product is made of. See `docs/VISION.md` for the problem, the gap and the use cases; `docs/PITCH_HACKMERIDIAN.md` for the pitch; `docs/HACKMERIDIAN.md` for the spec and the weekend plan; `docs/MIDNIGHT_PLAN.md` for the build decision.

## What's real vs. demo scaffolding

- **Real:** both ZK proofs generate in the browser (Noir + bb.js) and verify on-chain. 19/19 Rust contract tests pass. Contract deployed on testnet: `CCYHIUOAUWFCWA5RV34UPT4SEXJFNE3SITGFR5HM2BL2K2RFOSGECE4P`. The full multiplayer flow — two independent wallets, create → join → prove → reveal ×2 → escrow settlement — has been verified end-to-end on testnet headlessly (`scripts/e2e-testnet.mjs`, run log with tx hashes: `docs/E2E_TESTNET_RUN.md`). The contract holds a house reserve so CC/DC payouts (which exceed escrow) can settle; the script tops it up automatically.
- **Demo scaffolding:** the accreditation tree is pre-computed (3 hardcoded credentials), the frontend polls instead of subscribing to events, and the in-browser wallet session should be walked through per `docs/PITCH.md` before demoing. Details in `docs/PRODUCT_REVIEW.md`.

## HackMeridian (Stellar, Scale track)

**25–26 October 2026 · ONE16, Marvila, Lisbon · in person only.**

Entering the Scale track with the product position: Latep is a **private
reputation primitive for Stellar**, and the game is its first issuer. The
weekend's step is Pattern 3 — the reputation circuit, the on-chain Poseidon
sponge, the incremental Merkle append, and the contract surface, built
**issuer-agnostic** so a second issuer can mint for the same holder without
changing our contract.

Pitch, demo script and judge Q&A: [`docs/PITCH_HACKMERIDIAN.md`](docs/PITCH_HACKMERIDIAN.md).
Spec, weekend plan and the application framing:
[`docs/HACKMERIDIAN.md`](docs/HACKMERIDIAN.md). Product position, the problem,
the gap and the use cases: [`docs/VISION.md`](docs/VISION.md).

## Find Your Way (Stellar, General Track)

Entered as the education + games story: playable wallet-free tutorial/tournament plus two on-chain-verified ZK patterns (commitment binding, private accreditation). Submit by Oct 14, 0:59 — ship as-is, no new patterns; write-up stresses "real ZK verification runs on Stellar today." The package as submitted is kept at [`docs/PITCH.md`](docs/PITCH.md).

## Docs

- `design.md` — the design system and the reveal-room direction (the source of truth for look and motion)
- `docs/REDESIGN_PLAN.md` — redesign phases, tickets and review rules
- `docs/HACKMERIDIAN.md` — the three-pattern story, Pattern 3 (private reputation) spec, HackMeridian plan
- `docs/VISION.md` — product position: the problem, the gap, the use cases, the reputation primitive, the market analysis, the "canonical or bust" answer, and the convergence plan
- `docs/MIDNIGHT_PLAN.md` — the Stellar × Midnight build decision: data path, sharpened gate, privacy wording
- `docs/PATTERN3_TEST_VECTORS.md` — the shared Pattern 3 fixture and how the circuit, contract, and client consume it
- `docs/PATTERN3_SEED.md` — identity-seed lifecycle: creation, backup, recovery, rotation, threat model
- `docs/COMPREHENSION_TEST.md` — the 5-person protocol for the redesign's success criterion
- `docs/PITCH_HACKMERIDIAN.md` — the current pitch: problem, gap, use cases, demo script, submission copy, judge Q&A
- `docs/PITCH.md` — the Find Your Way pitch package as submitted (historical)
- `docs/PRODUCT_REVIEW.md` — honest product review, gaps, what was fixed
- `docs/ROADMAP.md` — build status, current design priority
- `docs/ZK_HACKATHON_PLAN.md` — original hackathon plan
- `docs/demo-script.md` — demo walkthrough
- `docs/SECURITY.md` — security notes

## Quick start

```bash
git clone https://github.com/thisyearnofear/latep.git
cd latep
npm install
npm run dev        # http://localhost:5173
```

Needs Node 24+, plus a Stellar wallet with testnet XLM for the ZK multiplayer side. The tutorial and tournament run wallet-free.

Contract, circuits, and dev commands are documented alongside the code: `contracts/zk_dilemma/`, `circuits/move_commitment/`, `circuits/allowlist_membership/`.

_Built for the Stellar Hacks: Real-World ZK hackathon. Adapts Nicky Case's ["The Evolution of Trust"](https://ncase.me/trust/). License: Apache 2.0._
