# Pitch Package — HackMeridian 2026 (Scale track)

**HackMeridian**: 25–26 October 2026 · ONE16, Marvila, Lisbon · **Scale**
(Prototype → Product) · in person only.

Everything below is supported by evidence in this repo. Where something is
**not** shipped, it says so — the honesty is the point. Plan and spec:
[`HACKMERIDIAN.md`](HACKMERIDIAN.md). Long-horizon position:
[`VISION.md`](VISION.md). The previous event's package (Find Your Way, General
Track) is [`PITCH.md`](PITCH.md) and is kept as the record of what was
submitted then.

---

## The problem, in one paragraph

Strangers can only transact three ways: **trust blindly**, **over-collateralize**,
or **publish your history**. Trust blindly doesn't survive volume.
Over-collateralizing is capital-inefficient — it is _why_ a borrower with a
flawless record still posts a full deposit in Stellar's remittance and OTC
corridors, because the lender has no way to check the record. And **publishing
is becoming untenable**: a public track record is permanent, correlatable, and
it leaks _who you've transacted with_, not just what you did. For an autonomous
agent it is absurd — an agent has no public history to publish and no social
graph to borrow one from, so **every new agent starts at zero trust forever.**

## The gap, substantiated

Every trust standard in this market answers either _"who is this?"_ or _"what
did they do, publicly?"_ None answers _"prove what you did, to me, without
telling me anything."_

| Layer / standard                                                                                                                                             | Standardises                               | Private proven history?                                                                                                |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| W3C VC + DIDs v1.0                                                                                                                                           | credential format                          | No — the credential is disclosed                                                                                       |
| **EAS**                                                                                                                                                      | "primitive for portable, verifiable truth" | No — attestations are public                                                                                           |
| **ERC-8004** (Draft)                                                                                                                                         | identity + reputation registries           | No — public, correlatable to an address                                                                                |
| **x402** (Coinbase + Cloudflare, 140M+ txns) · **MPP**/**ACP** (Stripe) · **AP2** (Google, 100+ partners) · Visa Intelligent Commerce · Mastercard Agent Pay | payment transport, agent authorisation     | No — all assume a _trusted_ counterparty                                                                               |
| Agent-gate evidence stacks (Casper/Pharos `CredentialRegistry`, MonID, Self Protocol, EAS)                                                                   | counterparty evidence                      | No — **all presence-based and public**; presence is cheap to mint, so the signal degrades toward "someone holds a key" |

And the structural finding: **"closed attestation systems are dead ends due to
data fragmentation."** The reason interoperable schemas win is that more apps
using them make the graph more valuable. A reputation only your own users can
read is the failure mode, not a strategy.

**The market standardised identity, attestation and transport — and left
history private-shaped and unbuilt.** The one layer nobody standardised is the
one where it matters: the **decision layer**, where a payment is actually
approved.

## The claim

> **"I have a record of keeping my word. Here is proof of it. I will not tell
> you who I am, what I did, or with whom."**

Proven by a zero-knowledge proof: _≥T% of N recorded interactions were kept_,
under a secret identity seed, nullifier-bound to the claiming context so it
cannot be replayed — revealing no leaf, no address, and no counterparty.

Reputation is minted **per issuer** into incremental Poseidon Merkle trees on
Soroban, so **any service can mint for the same holder without changing our
contract.** A second issuer is a tag, not a rewrite.

## The use cases, and why they are real

1. **Uncollateralized credit and smaller escrow stakes** — the lender verifies
   the record without seeing the borrower, so the deposit drops from a full
   stake to a risk-adjusted one, and locked capital becomes liquid. This is
   Stellar's corridor market.
2. **Agent-to-agent payment** — the fastest-scaling instance of the same gap.
   The transport is being solved right now (x402 140M+ txns, Stripe MPP, Google
   AP2, Visa and Mastercard agent protocols). What is not being solved is the
   trust question between two agents that have never met.
3. **Remittance / OTC counterparties** — prove reliability without handing over
   the transaction graph. Privacy and compliance at once.
4. **Marketplace trust with an honest incentive** — if your rating is itself a
   reputation you carry, rating honestly is worth something to you.
5. **Proof-gated access** — accredited-investor / KYC gating for tokenised
   assets; pattern 1 already demonstrates it with a nullifier.

## One-liners

**30-second:** Strangers can only trust blindly, over-collateralize, or publish
their history. Latep builds the fourth option: a reputation you can **prove
without publishing** — on Stellar, today.

**Two-second:** _Prove your track record to any counterparty without revealing
it — on Stellar, today._

**With the mechanism:** Latep is a private reputation primitive for Stellar. A
holder proves "≥T% of my recorded interactions were kept" to any counterparty,
with a nullifier that makes the claim non-replayable, revealing neither their
identity, nor the interactions, nor the counterparty asking. Reputation is
minted per issuer into Poseidon Merkle trees on Soroban, so any service can
mint for the same holder without changing our contract. The first issuer is
Latep itself — the iterated Prisoner's Dilemma with real XLM in escrow, where
every move is sealed with a zero-knowledge proof and verified on-chain today.

## Why this wins the Scale track

Scale is "existing Stellar-based MVP, pilot or live product → product". We have
the product; the step is the primitive. Judged on the six axes:

1. **Meaningful use of Stellar** — not "a contract that stores things." We use
   the newest protocol primitives (Poseidon host functions, BN254 ops) and a
   Soroban verifier (UltraHonk) that checks a **14,592-byte proof produced
   entirely in the user's browser**. Pattern 3 adds an **on-chain Poseidon
   sponge plus an incremental Merkle append** — the reputation tree is
   maintained by the network, not by us.
2. **Technical execution** — 19/19 contract tests, plus a **headless
   two-wallet end-to-end run verified on testnet** (`scripts/e2e-testnet.mjs`,
   log: [`E2E_TESTNET_RUN.md`](E2E_TESTNET_RUN.md)): two independent accounts,
   real proofs, commit → join → prove → reveal ×2 → escrow settlement, resolved
   on-chain with visible tx hashes.
3. **Originality** — a reputation that is _carried and proven_ rather than
   published. The market has the primitives (W3C VC, EAS, ERC-8004); the
   combination — private, ZK-proven, per-issuer, non-replayable, with a live
   on-chain verifier — is not shipped by anyone we can find.
4. **Impact** — collateral reduction in Stellar's corridors; the cold-start
   problem for agent commerce; escrow sizing; privacy-preserving OTC.
5. **UX clarity** — the demo is one claim, one gate, one effect: _a proven
   holder posts a smaller stake._ Cryptography is the mechanism, not the story.
6. **Presentation** — this package, the live site, the contract ID, and a
   two-minute video.

## Two-minute demo script

**Beat 0:00–0:20 — the problem, in one shot.** Title card over the live demo:
_"Three ways to trust a stranger: believe them, over-collateralize, or publish
your history."_ Then the third option, struck through. _"We built the fourth."_

**Beat 0:20–0:55 — the game, briefly, as proof the stack is real.** Screen
capture of the ZK multiplayer: a move is sealed, the browser generates the
proof (Noir + bb.js), **the Stellar network verifies it on-chain** before any
funds move. Show the tx. One line: _"This is real today, on testnet, 19/19
tests. It is the first issuer of the primitive."_ — 35 seconds, no more. The
game is the credibility, not the pitch.

**Beat 0:55–1:35 — the primitive.** The claim, stated in the user's words:
_"I have a record of keeping my word."_ Show: reputation accrues across games →
the holder claims to a **counterparty service** → the counterparty verifies the
proof on-chain and **lowers the stake** → the holder posts less collateral →
settlement. Voiceover: _"The counterparty learned that the record qualifies. It
did not learn who I am, which games I played, or who I played with."_

**Beat 1:35–1:50 — the honest scope slide.** _"What's real today: proof
generation in-browser, on-chain verification, escrow settlement, e2e from two
independent wallets. What's landing this weekend: the reputation tree and the
threshold claim. What's scaffolding: a 3-leaf demo tree in pattern 1, polling
instead of events."_ — Honesty reads as maturity on a technical-execution axis.

**Beat 1:50–2:00 — close.** _"Latep — petal backwards. Trust me, trust me not.
Prove your track record without revealing it. On Stellar."_ End card: live
URL, testnet contract `CCYHIUOAUWFCWA5RV34UPT4SEXJFNE3SITGFR5HM2BL2K2RFOSGECE4P`,
GitHub.

### If pattern 3 does not land in the window

Do **not** fake the second beat. Re-cut to: the problem (0:00–0:20) → the two
shipped patterns with their real use cases (0:20–1:30) → the pattern-3 design
as _intent_, stated as intent (1:30–1:50) → close (1:50–2:00). Say "this is
what we are building this weekend and will have by the next one." A
rehearsed scope-honest cut beats a broken one.

## Submission copy (project page / README top)

> **Latep — a private reputation primitive for Stellar. Prove your track
> record without revealing it.**
>
> Strangers can only transact three ways: trust blindly, over-collateralize, or
> publish their history. Publishing is becoming untenable — a public track
> record is permanent, correlatable, and leaks who you've transacted with. And
> an autonomous agent has no public history to publish at all, so every new
> agent starts at zero trust forever.
>
> Latep builds the fourth option. A holder proves _"≥T% of my recorded
> interactions were kept"_ to any counterparty — with a nullifier that makes the
> claim non-replayable — revealing neither their identity, nor the interactions,
> nor the counterparty asking. Reputation is minted **per issuer** into
> incremental Poseidon Merkle trees on Soroban, so any service can mint for the
> same holder without changing our contract.
>
> **What ships today:** two real zero-knowledge patterns verified on-chain in a
> Soroban contract — move-commitment binding (kills commit-to-garbage griefing)
> and private accreditation (Poseidon Merkle membership with nullifier replay
> protection) — 19/19 Rust tests, a deployed testnet contract, and a headless
> two-wallet end-to-end run with public transaction hashes. The first issuer is
> Latep itself: the iterated Prisoner's Dilemma with real XLM in escrow.
>
> **The payoff:** uncollateralized credit and smaller escrow stakes in
> Stellar's corridors; the cold-start problem for agent-to-agent payment; and
> escrow sizing that scales with the track record rather than against it.

## Judge Q&A (anticipate, don't dodge)

- **"Isn't this just a credit score with extra steps?"** — A credit score is
  published, correlatable to you, and reveals your counterparties. Ours proves
  a threshold without naming a single interaction. The anonymity set is every
  player with a compatible record.
- **"Why ZK instead of just publishing a score?"** — Because publishing _is_ the
  problem. The proof is what lets a holder be trusted without being exposed —
  and it is the only form that works for a principal with no public history at
  all, like an agent.
- **"Who's the customer?"** — The decision layer. Any credit desk, escrow
  market, or agent-payment gateway that today either over-collateralizes or
  declines. We're building the consumer side too.
- **"Why Stellar, and isn't this chain-agnostic?"** — It is, and the tree is
  per-issuer — Stellar is the first chain it runs on, not the only one. And
  we're not trying to be canonical: being canonical is a position you lose,
  because EAS is taking it by being schema-compatible. We're trying to be the
  thing every _gate_ accepts, and a gate that verifies a proof doesn't care
  which chain minted the root.
- **"How does this scale to millions?"** — Three assumptions, and they're the
  real work: issuer-agnosticism (the tree is per-issuer, so any service can
  mint), proof economics (a 14.6 KB proof per claim is demo-grade; at scale
  you need incremental proofs), and identity continuity (a secret seed can be
  farmed; v2 binds it to a passkey). The curve isn't monotone either — privacy
  improves with scale, proof cost degrades. I'd rather name those than quote a
  number.
- **"Is the reputation data real?"** — The pattern-1 accreditation tree is a
  3-leaf demo, and we say so. The circuit, the nullifier logic, the VK
  storage, the on-chain verification and the escrow settlement are real, and
  the e2e log has tx hashes.
- **"Is the verifier production-ready?"** — No, and this is our mainnet ask:
  `rs-soroban-ultrahonk` is community-maintained with audit fixes in flight
  upstream. That's why the mainnet deploy is a stretch goal, not the headline.
- **"Who built this?"** — Solo builder with AI coding agents, human-directed.
  114 commits, Apache-2.0, and the repository is the evidence.

## The asks

1. **An audit pathway for the community UltraHonk Soroban verifier** — the
   single highest-leverage thing we could get. It is the difference between a
   testnet proof and a usable one.
2. **A smart-contract mentor on the on-chain Poseidon sponge** — Soroban
   exposes the Poseidon _permutation_, not a hash, so the contract must
   reimplement `noir-lang/poseidon`'s bn254 `hash_1`/`hash_2` bit-for-bit
   (field, state size, round constants, padding). Nethermind's
   `tornado_classic` is the prior art; who has shipped it in production is
   worth an afternoon of someone's time.
3. **A first consumer** — a credit desk, an escrow market, or an agent-payment
   gateway that would accept a private reputation proof. The issuer side and a
   reference implementation are the easy half.

---

_Added 2026-10-21 for HackMeridian. Not yet submitted; the weekend scope is
in `HACKMERIDIAN.md`._
