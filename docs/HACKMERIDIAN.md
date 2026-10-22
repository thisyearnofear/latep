# Latep — HackMeridian 2026 Plan

**HackMeridian**: October 25–26, 2026 · ONE16, Lisbon · Track: **Scale** (Prototype → Product)

> **Build sequencing (2026-10-19).** The claim and product story below stand.
> The Stellar × Midnight decision, the Stellar-to-Midnight data path, and the
> sharpened gate are in [`MIDNIGHT_PLAN.md`](MIDNIGHT_PLAN.md); the shared
> fixture is in [`PATTERN3_TEST_VECTORS.md`](PATTERN3_TEST_VECTORS.md); the
> seed lifecycle is in [`PATTERN3_SEED.md`](PATTERN3_SEED.md). Treat the work
> plan at the bottom as the original schedule, not the current one.
>
> **Product position (2026-10-21).** The game is the demo; the product is a
> **private reputation primitive for Stellar** — a portable credential that any
> issuer can mint and any gate can accept. The market analysis, the "canonical
> or bust" answer, the three load-bearing scale assumptions, and the
> convergence plan are in [`VISION.md`](VISION.md). Read it before changing the
> pitch, because it changes what the weekend is _for_: the credential is the
> headline, the game is the first issuer, and the primitive is built
> issuer-agnostic or not at all.

**One-liner:** _Prove your track record to any counterparty without revealing it — on Stellar, today._ Latep is the first issuer of that credential: the iterated Prisoner's Dilemma, real XLM in escrow, every move sealed with a zero-knowledge proof and verified on-chain.

---

## The story

Latep started as a trust-fall game: two players commit Cooperate or Defect behind ZK commitments, real XLM in escrow. The name is `petal` backwards — "she loves me, she loves me not" → "trust me, trust me not." Each round of the game is a petal plucked. The question the project answers: _can you show the accumulated trust without exposing the flower?_

The behavioral layer is the foundation, not decoration. The tutorial and tournament modes (adapted from Nicky Case's _Evolution of Trust_) demonstrate that trust is **dynamic** — earned over repeated interaction, fragile under noise, destroyed by betrayal. Strict Tit-for-Tat dies under noise; Generous TFT survives. Payment systems face identical conditions: failed settlements, disputes, miscommunication. Binary allowlists can't forgive; reputation degrades gracefully.

That behavioral story is what the third ZK pattern captures.

## The three ZK patterns

| Pattern                    | Question answered                                                           | Status                                              |
| -------------------------- | --------------------------------------------------------------------------- | --------------------------------------------------- |
| 1. Private Accreditation   | _Who you are_ — prove you're on the list without revealing which credential | ✅ shipped (Poseidon Merkle membership + nullifier) |
| 2. Move Commitment Binding | _What you're doing now_ — prove a commitment is valid at commit time        | ✅ shipped (keccak256 + UltraHonk)                  |
| 3. Private Reputation      | _What you've done_ — prove a track record without revealing it              | 🚧 this build                                       |

Pattern 3 is the missing piece the original hackathon plan called out as future work ("I've cooperated in N% of games"). It completes the arc: static trust (1, 2) + dynamic trust (3).

## Pattern 3: Private Reputation — technical spec

> **Hash construction (updated 2026-10-19).** The three-input,
> domain-separated forms below are pinned by
> [`PATTERN3_TEST_VECTORS.md`](PATTERN3_TEST_VECTORS.md); that fixture is
> authoritative. The earlier two-input sketch is superseded, and the seed
> lifecycle is in [`PATTERN3_SEED.md`](PATTERN3_SEED.md).

**Claim:** "I hold a secret `s` whose recorded outcomes in the on-chain reputation set show ≥ T% cooperation across N games" — proven under a fresh identity, unlinkable to the address that earned it.

The privacy win is not hiding the stats — game outcomes are publicly recorded. The win is **severing reputation from identity**: a player proves trustworthiness to a new counterparty, lobby, or contract without revealing which history is theirs.

### Data model

> **Read the 2026-10-21 amendment below before implementing this list.** The
> `game_id` in the tag construction and the single `rep_root` here are
> superseded by the issuer-agnostic form (`issuer` as a public input,
> `rep_roots[issuer]`).

- **Identity seed `s`** — a long-lived secret held client-side (like the reveal nonce today; persisted in localStorage, later derivable from a wallet signature). Never leaves the client.
- **Per-game pseudonym tag** — at commit time, the move-commitment circuit gains one public input: `tag = poseidon3([DOMAIN_TAG, s, game_id])`. This proves the tag derives from a secret the committer knows, without revealing `s`. The tag is unlinkable across games (per-game pseudorandom) and unforgeable (bound into the same proof).
- **Outcome leaves** — on `resolve_game`, the contract appends two leaves to an incremental Poseidon Merkle tree (the _reputation tree_): `leaf = poseidon3([DOMAIN_LEAF, tag, move])`, where `move` is the revealed play. Contract stores `rep_root`.

An observer sees the public tag at commit, the revealed moves at resolve, and the appended leaves — so a leaf's owner is linkable to the tag and the tag to the committing address. The leaves are public commitments, not private data. What stays unlinkable is the **claim**: the proof reveals no leaf, only that the claimant knows a qualifying one. The anonymity set is every player whose record is compatible, and it is only as large as the player base.

### Amendment (2026-10-21): make the tree issuer-agnostic

Pattern 3 as specified above is **latep-scoped**: `game_id` is a latep concept,
`resolve_game` is a latep function, `rep_root` is latep's state. That caps the
credential at "latep players" and makes the game the product. It is the
highest-leverage change in the whole plan, and it is a **design change, not a
feature**.

**The change:** `issuer` becomes a public input, and the tree is keyed by issuer.

- `tag = poseidon3([DOMAIN_TAG, s, issuer, interaction_id])` — four inputs,
  domain-separated. `issuer` is a public, issuer-chosen domain string
  (`"latep.dilemma"`, `"acme.rental"`); `interaction_id` is that issuer's own
  id for the interaction, replacing the latep-specific `game_id`.
- Leaves are appended by **the issuer**, into **the issuer's own tree**.
  `rep_root` becomes per-issuer: `rep_roots[issuer]`.
- The claim's `context` — already in the design, and already the replay-
  protection domain — is the scope the claim is made _in_, and therefore the
  scope the verifier belongs to.
- Consequence: **a second issuer mints a leaf for the same holder without
  touching latep's contract.** The second issuer is a tag, not a rewrite.
  That is the test of whether we built a primitive or an app.

**Cost:** the tag construction changes (three inputs → four), so
`PATTERN3_TEST_VECTORS.md` is regenerated and the move-circuit VK with it. The
nullifier construction is unchanged. The contract gains a per-issuer root map.

**Do not do this if** the weekend cannot also land the circuit, the on-chain
Poseidon sponge, and the incremental Merkle append. The issuer dimension is not
decoration, but it is not worth landing a broken tree. If the append is not
ready, the honest fallback is the mock — labelled as a mock.

### Circuit: `circuits/reputation_threshold/`

- **Private inputs:** `s`, `game_ids[N]`, `moves[N]`, `paths[N][D]`, `indices[N][D]`
- **Public inputs:** `rep_root`, `threshold_num`, `threshold_den`, `context`, `nullifier`

> Under the 2026-10-21 amendment, `game_ids[N]` becomes `interaction_ids[N]`
> and the circuit derives the issuer from each interaction's public binding;
> `rep_root` becomes the issuer's root. The nullifier and the threshold
> assertion are unchanged.

- **Logic:**
  - For each i: `tag_i = poseidon3([DOMAIN_TAG, s, game_ids[i]])`; `leaf_i = poseidon3([DOMAIN_LEAF, tag_i, moves[i]])`; assert membership of `leaf_i` at `indices[i]` under `rep_root` (Poseidon Merkle path, same construction as the allowlist circuit)
  - `nullifier = poseidon3([DOMAIN_NULLIFIER, s, context])` — binds the claim to a domain (e.g. `"trusted_lobby"`), prevents replay within that context, reveals nothing else
  - Assert `coop_count * threshold_den ≥ threshold_num * N`

Fixed `N` (e.g. 16) and depth `D` (e.g. 16 → 65k leaves) for v1.

### Contract surface

```rust
// extended on existing structs/fns:
//   create_game / join_game gain `tag: Bytes` arg (public input to move circuit)
//   resolve_game appends poseidon3([DOMAIN_LEAF, tag_i, move_i]) leaves, updates rep_root

fn verify_reputation(env, claimant: Address, proof: Bytes,
                     root: Bytes, threshold_num: u32, threshold_den: u32,
                     context: Symbol, nullifier: Bytes) -> Result<()>
//   verifies UltraHonk with a third VK, checks root == rep_root,
//   records nullifier, sets rep_passed(claimant, context), emits event

fn rep_passed(env, player: Address, context: Symbol) -> bool
fn get_reputation_root(env) -> Option<Bytes>
```

**Gated action for the demo:** a _trusted lobby_ — a low-stake (or zero-stake) game room requiring `rep_passed(player, "trusted_lobby")`. The concrete pitch is **reputation as access** — proven players enter a lobby that others cannot. If the contract actually reduces the required escrow, call it collateral; the demo does not need to.

### Hard parts (honest list)

1. **On-chain Poseidon leaf append.** CAP-75 exposes the Poseidon _permutation_, not a hash — the contract must implement the sponge matching `noir-lang/poseidon` bn254 `hash_1`/`hash_2` exactly (field, state size, round constants, padding). Prior art: Nethermind's `contracts/tornado_classic` in rs-soroban-ultrahonk already does incremental Merkle + on-chain Poseidon — steal the pattern. Their `feat/for_poseidon2` branch is worth checking too.
2. **Move circuit change** — one added public input (`tag`) and the `poseidon3([DOMAIN_TAG, s, game_id])` constraint. Requires regenerating the VK and re-initializing the contract, so it lands with the next deploy, not as a patch.
3. **Incremental Merkle tree in contract** — frontier-based append (classic Tornado-style), D=16.
4. **Per-issuer roots** (added 2026-10-21) — the issuer-agnostic amendment turns a single `rep_root` into a map, `rep_roots[issuer]`. Keep it small and prune it: an issuer with no leaves for 30 days can be dropped. On a chain where state is paid for, an unbounded map is a liability, and an unpruned map is also a privacy smell — it advertises who is participating.

### Honest limitations to state plainly

- **Cherry-picking:** the prover selects which N games to prove over. Mitigations (binding to most-recent leaves via index ranges, or consecutive-index proofs) are future work — the demo proves _existence_ of a good record, not completeness.
- **Shareable secrets:** `s` can be shared or sold — reputation is transferable by collusion. Non-transferability (binding `s` to a wallet signature or passkey) is a v2 concern.
- **Anonymity-set limits:** a claim is only as private as the set of players with compatible records. Small player base → weak privacy. Fine to demo; be careful claiming more.
- **Verifier maturity:** the UltraHonk verifier is community-maintained and recently audited (fixes in flight, upstream PR #41). Mainnet claims wait for that to land.

## Why this is the HackMeridian pitch

The suggested ideas (tip jars, counters, remittance mocks) all reduce to one question: _can I trust this stranger with my money?_ Stellar's current answers are "trust blindly" or "doxx your history." Private reputation is the missing middle, and it maps to real rails:

- **Undercollateralized credit / micro-lending** — reputation instead of overcollateralization
- **Agent payments** — an agent's spending limit gated by a proven track record (x402/MPP adjacency)
- **Remittance / OTC counterparties** — prove reliability without revealing your transaction graph
- **Escrow sizing** — proven players post less stake

**The problem, stated so a judge can grade us on it.** Strangers can only
transact three ways: trust blindly, over-collateralize, or publish their
history. Trust blindly doesn't survive volume. Over-collateralizing is
capital-inefficient — it is _why_ a borrower with a flawless record still posts
a full deposit in Stellar's corridors, because the lender has no way to check
the record. And publishing is becoming untenable: a public track record is
permanent, correlatable, and leaks _who you've transacted with_. For an
autonomous agent it is absurd — an agent has no public history to publish and
no social graph to borrow one from, so **every new agent starts at zero trust
forever.**

**The gap, substantiated.** Every trust standard in this market answers either
"who is this?" or "what did they do, publicly?" — W3C VC and DIDs, EAS,
ERC-8004's registries, x402, MPP, AP2, Visa Intelligent Commerce, Mastercard
Agent Pay, and the agent-gate evidence stacks (Casper/Pharos registries, MonID,
Self Protocol). None answers _"prove what you did, to me, without telling me
anything."_ And the structural finding holds: **"closed attestation systems are
dead ends due to data fragmentation."** The market standardised identity,
attestation and transport, and left **history** private-shaped and unbuilt.
The one layer nobody standardised is the one where it matters — the decision
layer, where a payment is actually approved. Full analysis:
[`VISION.md`](VISION.md).

And the demo arc writes itself: tutorial (trust evolves) → ZK match (trust hidden but binding) → reputation proof (trust portable and private) → the same proof gates entry to the trusted lobby. One click from game to "this is why Stellar."

**What makes it a Scale story and not a demo (2026-10-21).** The Scale track is
"Prototype → Product", and the step here is _"from ZK demo to reputation
infrastructure."_ Three things carry that, and all three are in
[`VISION.md`](VISION.md):

1. **The credential, not the game, is the headline.** We are not pitching a
   Prisoner's Dilemma with a score. We are pitching a portable, private
   reputation primitive for Stellar, and the game is the first issuer of it.
2. **The issuer-agnostic amendment.** If a second issuer can mint a leaf for
   the same holder without patching latep's contract, we built a primitive. If
   it cannot, we built an app — and the weekend should say so honestly rather
   than overclaim.
3. **The consumer is real and named.** The signal this primitive produces is
   the one thing the agent-payment decision layer lacks: every existing gate
   asks _whether the counterparty is registered_; none can ask _whether they
   have a proven record of keeping their word, provable without revealing who
   they are_. A gate is where trust is decided, so a gate is where a primitive
   is worth something. We are building both sides of that, which is why the
   primitive is designed to be a module and not a feature.

**Say the scale claim honestly.** The belief is that this reaches millions;
the mechanism is three assumptions — issuer-agnosticism, proof economics at
scale, and identity continuity — and the curve is not monotone (privacy
improves with scale, proof cost degrades). A judge who asks "how does this
scale?" should hear the three assumptions named, not a number.

## Work plan (~6 weeks to Oct 25)

| When      | What                                                                                                                                                                                               |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ✅ done   | soroban-sdk 27 bump (verifier on upstream `chore/protocol27`), 19/19 tests, nullifier fix for any game_id, proof-gen timeout, Raven MCP + Stellar skills wired, contract confirmed live on testnet |
| Week 1–2  | Two-wallet e2e test (last honest-gap item); repin verifier to `main` once upstream PR #42 merges; redeploy fresh contract if needed                                                                |
| Week 3–4  | Move circuit `tag` input + VK regen; on-chain Poseidon leaf append + incremental Merkle tree; contract storage for `rep_roots[issuer]` (issuer-agnostic, per the 2026-10-21 amendment)             |
| Week 5–6  | `reputation_threshold` circuit + `verify_reputation`; minimal trusted-lobby gate; demo polish                                                                                                      |
| Oct 25–26 | Build the gated surface live, record the demo, pitch                                                                                                                                               |

**Application framing (Scale):** existing working product (deployed, tested,
live at latep.trustfall.xyz) → the meaningful step toward production is
Pattern 3: from ZK demo to reputation infrastructure. Modernized using
Stellar's own agentic tooling (Raven MCP + Stellar Skills). Ask: audit pathway
for the verifier + SCF continuation.

**Application framing, revised 2026-10-21 (this is the one to submit).**

- **Primary weekend goal:** _Deploy our project to Stellar mainnet._ The
  contract compiles, has 19 green tests, and needs a funded house reserve. It
  is the milestone the Scale track can check.
- **Specific outcome:** the escrow contract live on Stellar mainnet with a
  funded reserve, **plus** the Pattern 3 circuit and contract surface built
  issuer-agnostic, and the two-wallet e2e run repeated against mainnet with
  published tx hashes.
- **The punchline (if it lands):** two independent issuers, one holder, one
  verifier. If the second issuer only needs a tag, that is the evidence for
  the primitive claim. If it does not land in the window, say so — a honestly
  scoped single-issuer demo with a named next step beats a claim the demo
  cannot support.
- **Mentor asks:** _Stellar engineering_ and _Smart contracts_ for the mainnet
  deploy and the on-chain Poseidon sponge (Nethermind's `tornado_classic` is
  the prior art) — plus the **audit pathway for the community UltraHonk
  verifier** and **SCF continuation**, which is the ask already written into
  this doc and the one a Stellar mentor can act on directly.
