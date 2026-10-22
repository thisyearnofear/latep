# Latep — Vision: a private reputation primitive for Stellar

> **Status: researched 2026-10-21. Not a shipped claim.** This doc holds the
> long-horizon product position, and it is ordered the way the argument
> actually runs: **the problem → the gap → the use cases → the product → the
> position.** The HackMeridian weekend plan is in
> [`HACKMERIDIAN.md`](HACKMERIDIAN.md); the pitch is in
> [`PITCH_HACKMERIDIAN.md`](PITCH_HACKMERIDIAN.md); the pattern-3 spec is in
> [`PATTERN3_SEED.md`](PATTERN3_SEED.md) and
> [`PATTERN3_TEST_VECTORS.md`](PATTERN3_TEST_VECTORS.md); the Stellar ×
> Midnight decision is in [`MIDNIGHT_PLAN.md`](MIDNIGHT_PLAN.md).
>
> The question this doc answers: **if the game is the demo, what is the
> product, and what real problem does it solve?**

---

## The problem

Strangers can only transact three ways. Everything else in the market is a
variation on these three.

|                          |                                       | Why it fails at scale                                                                                                                                                                                                |
| ------------------------ | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Trust blindly**        | no data, no checks                    | doesn't survive a volume of strangers you will never meet                                                                                                                                                            |
| **Over-collateralize**   | post more than the deal is worth      | capital-inefficient; this is _why_ the credit gap exists in Stellar's remittance and OTC corridors — a borrower with a flawless record still posts a full deposit, because the lender has no way to check the record |
| **Publish your history** | a public score, keyed to your address | permanent, correlatable, and it leaks **who you've transacted with** — not just what you did                                                                                                                         |

**Publishing is the one becoming untenable.** A public track record is a
liability that follows you forever: one bad month in 2023 is still attached to
you, and a counterparty who reads it also learns your counterparties, your
trajectory, and your vulnerability. For a person that is a privacy liability
with no expiry. For an autonomous agent it is _absurd_: an agent has no public
history to publish in the first place and no social graph to borrow one from.
**Every new agent starts at zero trust forever.**

That is the gap this project is aimed at: the credit market works for people
whose history someone else already holds, and does not work at all for anyone
whose history nobody has — including every agent that has ever wanted to pay a
stranger.

## The gap (researched 2026-10-21)

**Every trust standard in this market answers either "who is this?" or "what
did they do, publicly?"** None answers _"prove what you did, to me, without
telling me anything."_

| Layer / standard                                                                                                                                                                              | What it standardises                       | Private proven history?                                                                                                |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| W3C VC + DIDs v1.0                                                                                                                                                                            | credential format                          | No — the credential is disclosed                                                                                       |
| **EAS**                                                                                                                                                                                       | "primitive for portable, verifiable truth" | No — attestations are public                                                                                           |
| **ERC-8004** (Draft)                                                                                                                                                                          | identity + reputation registries           | No — reputation is public and correlatable to an address                                                               |
| **x402** (Coinbase + Cloudflare; 140M+ txns, v2 Dec 2025) · **MPP** / **ACP** (Stripe) · **AP2** (Google, 100+ partners, built on W3C VCs) · Visa Intelligent Commerce · Mastercard Agent Pay | payment transport, agent authorisation     | No — all of them assume a _trusted_ counterparty                                                                       |
| **Ligis' evidence stack** (Casper / Pharos `CredentialRegistry`, MonID, Self Protocol, EAS)                                                                                                   | counterparty evidence                      | No — **all presence-based and public**; presence is cheap to mint, so the signal degrades toward "someone holds a key" |

And the structural finding that decides the shape of everything else:
**"closed attestation systems are dead ends due to data fragmentation."** The
reason interoperable attestation schemas (EAS) win is that more apps using them
make the graph more valuable, and vice versa. A reputation only your own users
can read is the failure mode, not a strategy.

**So the gap is precise.** The market standardised **identity**, **attestation**
and **transport** — and left **history** private-shaped and unbuilt. The one
layer nobody has standardised is the one layer where it matters: the
**decision layer**, where a payment is actually approved and where a private
track record is worth the most.

## The use cases

Ranked by how real they are, and by what each one unlocks.

**1. Uncollateralized credit and smaller escrow stakes.** If the lender can
verify the record without seeing the borrower, the stake drops from a full
deposit to a risk-adjusted amount, and capital that was locked becomes liquid.
This is the use case that pays real people's bills, and it is the one Stellar's
corridor market is built on.

**2. Agent-to-agent payment — the fastest-scaling instance of the same gap.**
The transport is being solved _right now_: x402 has cleared 140M+ transactions,
Stripe's MPP and ACP are live, Google's AP2 has 100+ partners, and Visa and
Mastercard both have agent protocols. What is **not** being solved is the trust
question between two agents that have never met and share no registry, no
credit file and no social graph. The moment agent-to-agent commerce scales, the
bottleneck is not moving money — it is deciding _whether to_.

**3. Remittance / OTC counterparties.** Prove reliability without handing over
the transaction graph, which is a privacy matter and a compliance one at the
same time.

**4. Marketplace trust with an honest incentive.** If your rating is itself a
reputation you carry, rating honestly becomes worth something to you.

**5. Proof-gated access** — the accredited-investor / KYC case for tokenised
assets, which pattern 1 already demonstrates with a nullifier.

## The product

Not a trust game with a reputation feature. A **private, portable trust
credential for Stellar**:

> "I have a record of keeping my word. Here is proof of it. I will not tell
> you who I am, what I did, or with whom."

The game is the **first issuer** of that credential. It is the reference
implementation that proves the whole stack works end to end — in-browser proof
generation, on-chain verification, real money in escrow — on Stellar, today.
Every other surface that mints reputation is the _same primitive with a
different issuer_, not a new product.

That distinction is the whole strategy, and it is testable: **if the second
issuer needs a second implementation, we built an app. If it needs only a
different tag, we built a primitive.**

## Why the game cannot be the end state

Not because games don't scale — because a game creates reputation _only among
its own players_, and its reputation is _public and linkable_ (outcomes are on
the public ledger; the tag binds to the committing address). A closed vertical
is a known failure mode in this market: _"closed attestation systems are dead
ends due to data fragmentation"_ — the reason interoperable attestation
schemas win is that more apps using them make the graph more valuable.

A trust credential for a trust game is the definition of a closed vertical. It
is also the _only_ kind of credential that gets left behind.

## The market: three layers, three competitive dynamics

| Layer                                | Who is in it (2026)                                                                                            | Dynamic                                                           | Our position                                                              |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------- |
| **Standards & rails**                | W3C VC + DIDs v1.0 · **EAS** · **x402** · **AP2** · Visa Intelligent Commerce · Mastercard Agent Pay · **MPP** | Winner-take-most. Integration wins it, not quality.               | **Conform. Never compete.**                                               |
| **Credential apps with user graphs** | Karma, Gitcoin, Billions Network, ZK Passport, Privado ID, ZK Registry                                         | Winner-take-most on distribution and on whose graph is canonical. | **Don't compete.** We don't have the audience, and the graph is the moat. |
| **Policy / decision layer**          | No incumbent standard. Visa IC, AP2 and x402 all assume a _trusted_ merchant or payee.                         | **Open.**                                                         | **This is the gap we are in.**                                            |

Two findings that shaped the position:

**1. The idea is not novel.** A 2026 project directory lists "ZK Reputation" as
a product: _"prove their reputation based on private relationships and
interactions without exposing sensitive details."_ That is pattern 3, already a
named category with funded competitors. Novelty cannot be the moat. The moat
has to be the **decision-layer integration** and the **issuer-agnostic
design** — and, underrated, the **open reference implementation**.

**2. Nobody standardizes the interesting question.** The standards are about
_credential format_ and _payment transport_. None of them answers _"should this
payment happen, and does the counterparty have a hidden track record?"_ That
gap is a policy decision, and it is where a gate lives.

## "Canonical or bust" — the answer

**You do not need to be canonical. You need to be accepted by the layer where
the decision is made.** Those are different positions, and only one of them is
winner-take-most.

- Being **the** credential of record (the canonical reputation score, the
  default attestation schema) → winner-take-most. EAS is winning that position
  by being schema-compatible, not by being the best attestation.
- Being **the thing every gate accepts** → a different, more durable position.
  A ZK reputation proof is verifiable by anyone against a root anyone can
  read, with no dependency on the issuer's consent. **If a gate wants to
  accept it, it can. Nothing has to be forked, and nobody's permission is
  needed.**

So the metric to optimise is **composability, not canonicality**. And the
alignment risks follow from that:

| Risk                                                                                | Mitigation                                                                                                                                                                            |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| The space is standardised _away_ from us (AP2 / W3C VC define agent credentials)    | **Conform.** Express the reputation proof as a VC whose subject is a ZK proof; anchor the reputation root as an EAS attestation. The proof is the substance; the container is theirs. |
| A canonical issuer set excludes us                                                  | **Multi-issuer.** Reputation is per-issuer and per-context; a holder carries many credentials. No single issuer can exclude a holder who has others.                                  |
| We are excluded from the canonical graph                                            | Nothing to fork. The proof stands alone against a public root.                                                                                                                        |
| The real risk: **we build a closed vertical and get left behind by our own design** | Build the primitive open, from day one.                                                                                                                                               |

## The three positions, and which we take

1. **App** — a trust credential for a game. Closed, no audience, gets left
   behind. _This is latep-as-product today._
2. **Canonical spec/standard** — winner-take-most; standards are won by
   convening, not by shipping, and we are not Google or ConsenSys.
3. **The reference implementation of an open primitive, plugged into the
   decision layer** — an open circuit and open contract module; latep is the
   first issuer; a gate is the first consumer; the primitive is
   schema-compatible with VC/EAS.

**We take (3).** It is the only one where the exit is not a coin flip, and it
costs the same weekend work as (1) — the difference is that the artifact is
released as infrastructure and the second issuer costs a tag, not a rewrite.

The repo already gestures at this: the pattern-3 plan intends to _borrow_
Nethermind's `tornado_classic` pattern for on-chain Poseidon plus incremental
Merkle. Shipping that as an open module, with latep as its first user, is the
same work with a better exit.

## What "scales to millions" actually requires

Three load-bearing assumptions. The belief is fine; the belief is not what
survives scrutiny — the mechanism is.

**1. Issuer-agnosticism — the current gap, and the biggest one.**
Today `rep_root` lives in latep's contract, `resolve_game` appends the leaves,
and `tag = poseidon3([DOMAIN_TAG, s, game_id])` uses a _latep_ concept. A
second issuer cannot mint a leaf without patching the game contract. So the
current ceiling is _latep players_, not the internet. The nullifier is already
context-scoped (`poseidon3([DOMAIN_NULLIFIER, s, context])`), so the primitive
is half-built toward this. **The fix is a design change, not a feature: `issuer`
becomes a public input, and the tree is keyed by issuer.** That change is cheap
and is the single highest-leverage edit in this plan.

**2. Proof economics — demo-grade, and they degrade with scale.**
v1 is a 14,592-byte UltraHonk proof over N=16 leaves at depth D=16 (65k
leaves). Verifying a 14.6 KB proof on-chain per claim does not survive
millions of interactions; at that scale you need incremental/accumulator proofs
(prove a _delta_, not the whole history) or off-chain attestation with on-chain
anchoring. This is the assumption that quietly breaks the scale story, and it
is the one nobody will notice unless we say it first.

**3. Identity continuity.** A secret seed means unlimited fresh identities and
unlimited fresh records — `PATTERN3_SEED.md` says it plainly: _"An attacker can
farm a fresh seed… Distinct-opponent and stake-floor rules raise the cost;
they do not eliminate it."_ At scale, per-context reputation with cheap
re-entry is a farming surface until v2 binds `s` to a passkey or wallet
signature.

**And the curve is not monotone.** Privacy _improves_ with scale — the
anonymity set grows, and a claim is "only as private as the set of players
with compatible records" — while proof economics _degrade_. Both ends of the
curve are hard. A pitch that claims a smooth curve has not been stress-tested.

## The consumer: Ligis, and why the two projects converge

`Ligis` is a spend firewall for AI agents: `POST /api/gate` returns GO/STOP
from four signals — right payee, right amount, in scope, verified payee — plus
a Jev intent layer, on Pharos / Casper / Monad, live on the CROO Agent Store.

It is **not** the same thing as pattern 3, and the difference is the point:

|              | Ligis `verified payee` today                           | Pattern 3                                                                                 |
| ------------ | ------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| Question     | "Does this payee hold a valid credential?"             | "Does this payee have a proven record, and can I check it without learning who they are?" |
| Nature       | **Presence** — a registered, credentialed counterparty | **History** — a ZK proof of a track record                                                |
| Linkability  | Public and correlatable (ERC-8004-style registries)    | Unlinkable to the earner; nullifier-bound per context                                     |
| Cost to fake | Low — capability credentials are cheap to mint         | High — a record must be earned and cannot be replayed                                     |

**Presence is the weak signal in a world where credentials are cheap to mint.**
Ligis's own README names the moat as the thing that makes _verified payee_ hold
up under scrutiny. A ZK-proven history is what turns it into a moat — and it is
the one signal nobody in that field has: _"a third-party-issued, on-chain-
verifiable attestation about the counterparty."_

So: **the primitive belongs in the decision layer, and latep is its first
issuer.** One artifact, two consumers:

- **latep** — first issuer, reference implementation, the demo.
- **a gate** — first decision-layer consumer, where the signal changes what a
  payment is allowed to do.

That is the honest resolution of "one project": the _primitive_ is the project;
the game is its first user, and it has a date on it.

## The Monday framing

The name is `petal` backwards — _"trust me, trust me not."_ The primitive is
the second half of that: **you can show the accumulated trust without exposing
the flower.** A peer is minted a reputation; the flower stays closed; the
next stranger gets a proof instead of a disclosure. A million users is not a
number we claim, it is a number of petals.

## What we are not doing

- Not competing to be the canonical credential of record.
- Not building a closed vertical, and not shipping anything that only latep can
  use.
- Not claiming a scale figure without naming the three assumptions above.
- Not porting anything to another chain to chase a second verifier — see
  [`MIDNIGHT_PLAN.md`](MIDNIGHT_PLAN.md), which is now subordinate to this doc.
- Not calling a curated or seeded dataset live. The accreditation tree is
  still pre-computed with 3 hardcoded credentials.

## The one-weekend version

This is a three-week project. The weekend version is deliberately smaller, and
it lives in [`HACKMERIDIAN.md`](HACKMERIDIAN.md) and
[`PITCH_HACKMERIDIAN.md`](PITCH_HACKMERIDIAN.md):

- The `reputation_threshold` circuit, the on-chain Poseidon sponge, the
  incremental Merkle append, and the contract surface — **with `issuer` as a
  public input**, so a second issuer is a tag, not a rewrite.
- A demo where the credential **changes what a counterparty does** — a smaller
  stake, a waived deposit — not just a proof that verifies.
- The mentor asks: **audit pathway for the community UltraHonk verifier, and
  SCF continuation** — plus a smart-contract mentor for the on-chain Poseidon
  sponge, where Nethermind's `tornado_classic` is the prior art.

---

_Added 2026-10-21. Research and position — no code._
