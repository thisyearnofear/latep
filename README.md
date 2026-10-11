# Latep

**[latep.trustfall.xyz](https://latep.trustfall.xyz)** — an interactive demo of the iterated Prisoner's Dilemma on Stellar, with two real zero-knowledge proof patterns verified on-chain in a Soroban contract.

The name is `petal` backwards: trust me, trust me not.

## What this actually is

A game-theory learning app (tutorial, tournament, ZK multiplayer) that doubles as a working proof that real ZK verification runs on Stellar today. Two Noir/UltraHonk circuits, verified on-chain via Stellar's native BN254 + Poseidon host functions:

1. **Move commitment binding** — prove a sealed move is valid at commit time, before the opponent stakes funds. Prevents commit-to-garbage griefing in any commit-reveal scheme.
2. **Private accreditation** — prove allowlist membership without revealing which credential is yours. Same pattern as KYC-gated access; includes nullifier replay protection.

A third pattern — **private reputation** (prove a track record without revealing it) — is spec'd but not built. See `docs/HACKMERIDIAN.md`.

## What's real vs. demo scaffolding

- **Real:** both ZK proofs generate in the browser (Noir + bb.js) and verify on-chain. 19/19 Rust contract tests pass. Contract deployed on testnet: `CCYHIUOAUWFCWA5RV34UPT4SEXJFNE3SITGFR5HM2BL2K2RFOSGECE4P`. The full multiplayer flow — two independent wallets, create → join → prove → reveal ×2 → escrow settlement — has been verified end-to-end on testnet headlessly (`scripts/e2e-testnet.mjs`, run log with tx hashes: `docs/E2E_TESTNET_RUN.md`). The contract holds a house reserve so CC/DC payouts (which exceed escrow) can settle; the script tops it up automatically.
- **Demo scaffolding:** the accreditation tree is pre-computed (3 hardcoded credentials), the frontend polls instead of subscribing to events, and the in-browser wallet session should be walked through per `docs/PITCH.md` before demoing. Details in `docs/PRODUCT_REVIEW.md`.

## Find Your Way (Stellar, General Track)

Entered as the education + games story: playable wallet-free tutorial/tournament plus two on-chain-verified ZK patterns (commitment binding, private accreditation). Submit by Oct 13, 0:59 — ship as-is, no new patterns; write-up stresses "real ZK verification runs on Stellar today."

## Docs

- `docs/HACKMERIDIAN.md` — the three-pattern story, Pattern 3 (private reputation) spec, HackMeridian plan
- `docs/PITCH.md` — pitch script, submission copy, two-wallet demo runbook
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
