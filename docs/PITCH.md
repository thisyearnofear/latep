# Pitch Package — Find Your Way (General Track)

Deadline: Oct 14, 0:59. Everything below is supported by evidence already in this repo.

## One-liner

**Real zero-knowledge verification runs on Stellar today** — Latep is a trust game where two players' sealed moves are proven valid in-browser and verified on-chain by the network itself, using the native BN254 + Poseidon host functions (Protocols 25/26). No oracle. No off-chain trust.

## Why this wins the General Track

Judged on six axes, and we lead on the two that separate entries:

1. **Meaningful use of Stellar** — not "a contract that stores things." We use the _newest_ protocol primitives (Poseidon host functions, BN254 ops) that most builders haven't touched, plus a Soroban verifier (UltraHonk) that checks a 14,592-byte proof produced entirely in the user's browser.
2. **Technical execution** — 19/19 contract tests, plus a **headless two-wallet end-to-end run verified on testnet** (`scripts/e2e-testnet.mjs`, log: `docs/E2E_TESTNET_RUN.md`): two independent accounts, real proofs, commit → join → reveal ×2 → escrow settlement, game resolved on-chain with visible tx hashes.
3. **Originality** — two genuinely load-bearing ZK patterns (move-commitment binding; private accreditation with nullifier replay protection) inside a playable game adapted from "The Evolution of Trust." A third (private reputation) is fully spec'd.
4. **Impact** — both patterns generalize beyond games: sealed-bid auctions, fair escrow, wagering; KYC/accredited-investor gating for tokenized assets — a real Stellar/RWA story.
5. **UX** — wallet-free tutorial + evolutionary tournament to the on-chain game; honest state labels; accessible controls; distinctive trust-fall visual language.
6. **Presentation** — this document + tight video (below) + README written for a 5-minute judge pass.

## 2:30 pitch video script

| Time      | Scene                                                                                           | Beat                                                                                                                                                                                                                                                                                                                       |
| --------- | ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0:00–0:15 | Cold open, screen-recorded play                                                                 | "Two people, one fall each. Trust me… or push." Hook with the tutorial round (existing capture segment 02/hero + practice round).                                                                                                                                                                                          |
| 0:15–0:45 | Tutorial + tournament captures (segments 03, 04)                                                | The learning story: why cooperation evolves — adapted from Nicky Case, on Stellar, wallet-free.                                                                                                                                                                                                                            |
| 0:45–1:30 | **The money shot: ZK multiplayer** (segment c02c4 commit-and-proof + live two-wallet recording) | Narration: "This move is sealed. The browser generates a zero-knowledge proof that the sealed move is _valid_ — cooperate or defect, never garbage — and **the Stellar network verifies that proof on-chain before any funds move.**" Show the tx landing on the deployed contract, 19/19 tests, then reveal + settlement. |
| 1:30–1:55 | Accreditation panel (segment 05)                                                                | Second pattern: "Prove you're on the allowlist without revealing _which_ credential is yours — the KYC / accredited-investor problem, solved with a nullifier so it can't be replayed. Poseidon Merkle trees, verified natively on-chain."                                                                                 |
| 1:55–2:15 | Honest scope slide                                                                              | "What's real: proof generation in-browser, on-chain verification, escrow settlement — e2e-verified from two independent wallets on testnet today. What's scaffolding: a 3-leaf demo tree, polling instead of events." Honesty reads as maturity on a technical-execution axis.                                             |
| 2:15–2:30 | Close (segment 08)                                                                              | "Latep — petal backwards. Trust me, trust me not. Real ZK runs on Stellar today." Link + contract ID on screen.                                                                                                                                                                                                            |

Keep any wallet-approval popups out of frame or fast-forwarded. End card: live URL, testnet contract `CCYHIUOAUWFCWA5RV34UPT4SEXJFNE3SITGFR5HM2BL2K2RFOSGECE4P`, GitHub repo.

## Live browser two-wallet session — runbook (backup recording)

The backend flow is already proven headlessly. Do this once in a browser and record it; that clip is the insurance policy for the live demo:

1. `npm install && npm run dev` (Node 24+, two browser windows — normal + private is fine).
2. Each window: connect a Freighter testnet wallet; fund both (friendbot via https://stellar.org/testnet).
3. Window A: /play → create a match (best-of-3, 1 XLM) → choose C → "Let go" → save the secret code → copy game link.
4. Window B: open link → join (choose D) → both reveal → watch settlement.
5. Screen-record both windows; also grab the Stellar Expert tx links from the game page debug area.
6. Note: the contract now holds a house reserve (topped up by `scripts/e2e-testnet.mjs`) so CC/DC outcomes can pay winners more than escrow — if a fresh deployment is ever used, re-run the script once before demoing.

## Submission copy (project page / README top)

> **Latep — an interactive Prisoner's Dilemma on Stellar with two ZK patterns verified on-chain.**
>
> Trust, played and proven. A wallet-free tutorial and evolutionary tournament teach why cooperation emerges; a ZK multiplayer mode makes it consequential: every move is sealed with a commitment, and a zero-knowledge proof (generated fully in the browser with Noir + bb.js) proves the sealed move is valid _before_ anyone stakes. A Soroban contract verifies the proof on-chain using Stellar's native BN254 + Poseidon host functions — no oracles, no off-chain trust.
>
> Two real patterns ship in this demo:
>
> 1. **Move-commitment binding** — kills commit-to-garbage griefing in any commit-reveal scheme (sealed-bid auctions, fair escrow, wagering).
> 2. **Private accreditation** — Poseidon Merkle-tree membership with nullifier replay protection, without revealing which credential you hold — the KYC / accredited-investor gating problem for tokenized assets.
>
> Evidence: deployed testnet contract, 19/19 Rust tests, and a two-wallet end-to-end run (create → join → prove → reveal ×2 → settle) verified on testnet, with public transaction hashes. A third pattern — private reputation (prove a track record without revealing it) — is spec'd for HackMeridian.
>
> Try it in 60 seconds: play a wallet-free round → open the tournament → watch a real proof verify on-chain in the ZK match.

## Judge Q&A (anticipate, don't dodge)

- **"Why ZK instead of a plain hash commit?"** — A bare hash lets me commit to garbage; you stake against a commitment I can never open. The proof makes the commitment _binding_ (valid move + known preimage + bound to this game id) at commit time. Without it, the game is exploitable.
- **"Why not just verify the proof off-chain?"** — Then the escrow depends on a trusted verifier. On-chain verification with Protocol 25/26 host functions means the network itself gates settlement.
- **"Is the accreditation data real?"** — The tree is a 3-leaf demo (stated honestly); the circuit, nullifier logic, VK storage, and on-chain verification are real. Production would build the tree off-chain and distribute paths privately.
- **"Reputation proofs?"** — Spec'd in `docs/HACKMERIDIAN.md`, deliberately not rushed before the deadline. Ships as the HackMeridian story.
