# Latep × Midnight — Build Plan

**Decision:** Build Latep. Keep it on Stellar. Use Midnight _only_ for pattern 3 (private reputation), and only if the whole Compact path — circuit, tree, data path, verifier — proves genuinely easier than writing the circuit in Noir.

**Date set:** 19 October 2026 · **HackMeridian:** 25–26 October 2026 · **Wave 3 build window:** 27 October – 16 November 2026

> **Two deadlines, two scopes.** If both dates are live, they are not the same
> deliverable. HackMeridian gets the smallest honest demo: the reputation
> circuit plus a fixture tree, with the on-chain gate mocked **and labelled as
> a mock** if the append is not ready. Wave 3 gets the production path: an on-chain tree, the gated
> lobby, and the negative tests. Do not let the HackMeridian date force a
> half-built append; do not let the Wave 3 date hide that the demo needs a
> fallback. If only one date is live, delete the other from this line so the
> plan has one clock.

---

## The decision rule

Three constraints, applied in order:

1. **One project** — not a portfolio, a single build.
2. **Keep the chain it has** — Latep is on Stellar; the circuits are tuned to Stellar's host functions and the escrow is deployed. Don't migrate.
3. **Leverage Midnight only if it's additive** — additive means it makes a build _easier or possible_, not just different.

This rule exists because the obvious alternative — "let's also try Midnight" — produces a half-built circuit on a new chain and a half-maintained Stellar deployment. Both suffer. The rule forces a clear answer.

## Why Latep, and not the other candidates

Every other chain'd project in the portfolio was evaluated against the same rule:

| Project        | Chain       | Already works there? | Midnight additive?                                | Verdict           |
| -------------- | ----------- | -------------------- | ------------------------------------------------- | ----------------- |
| **Latep**      | Stellar     | Two circuits shipped | **Maybe — pattern 3, if the data path is priced** | ✅ **Build this** |
| Dallas         | Stellar     | Deployed             | No — it's a port                                  | ❌                |
| Sonic Guardian | Starknet    | Sepolia deployed     | No — it's a port                                  | ❌                |
| Stoppage       | Solana      | Devnet               | No — not a privacy product                        | ❌                |
| Diversifi      | Multi-chain | Live                 | No — privacy isn't its thesis                     | ❌                |

Dallas is the closest alternative. It already proves ZK-conditional escrow on Stellar — benchmark improvement ≥ threshold, private inputs never leave the browser, XLM released on attestation. Moving it to Midnight buys nothing; it's a migration, not an increment. Same logic for Sonic Guardian (proof-of-knowledge on Starknet) and Stoppage (proof-gated settlement on Solana).

Latep is the only project where Midnight could be more than a port: pattern 3
needs a reputation tree, nullifiers, and an anonymity set, and Midnight gives
the witness a private place to live. But that is a narrower advantage than it
first looks — the tree root and nullifiers are still public, and the history is
still public. On Stellar you emulate the witness privacy with a ZK circuit; on
Midnight the witness is private state but the circuit remains. The bet is
about developer ergonomics and where the witness lives, not about a free
anonymity set.

## The plan

### What stays on Stellar

- The game (tutorial, tournament, ZK multiplayer)
- Both shipped circuits: `move_commitment` (keccak256 + UltraHonk) and `allowlist_membership` (Poseidon Merkle + nullifier)
- The Soroban escrow contract (`CCYHIUOAUWFCWA5RV34UPT4SEXJFNE3SITGFR5HM2BL2K2RFOSGECE4P`)
- The house reserve and settlement flow
- The e2e testnet harness
- The source of truth for outcomes. If the reputation tree moves to Midnight,
  the Stellar contract must emit a signed attestation that the Midnight
  contract can verify; the plan must name who signs it.

### What Midnight is for

Pattern 3 — private reputation — and nothing else. The claim: _"I hold a secret `s` whose recorded outcomes show ≥ T% cooperation across N games — proven under a fresh identity, unlinkable to the address that earned it."_

The spec already exists in `docs/HACKMERIDIAN.md`. The data model:

- **Identity seed `s`** — client-side secret, never leaves the browser
- **Per-game pseudonym tag** — `tag = poseidon3([DOMAIN_TAG, s, game_id])`, unlinkable across games
- **Incremental Poseidon Merkle tree** — `leaf = poseidon3([DOMAIN_LEAF, tag, move])`, depth 16; the contract stores the public `rep_root`
- **Reputation proof** — prove ≥ T% cooperation across N games, unlinkable to the earning address; `nullifier = poseidon3([DOMAIN_NULLIFIER, s, context])`
- **Shared fixture** — `docs/PATTERN3_TEST_VECTORS.md` and `scripts/check-pattern3-vectors.cjs` pin the tags, leaves, root, and nullifier before implementation

On Midnight the secret `s` and the witness can live in private state, but the
**tree root and the nullifier set must stay public** for a third party to
verify the claim and reject a replay. The leaves are commitments, not secrets:
the game outcomes are already public. The precise claim is **“the history is
public; the proof that a qualifying record belongs to this fresh identity is
unlinkable”**, not “the history is private”. The circuit still proves “I know
a path to a qualifying leaf”; private state changes where the witness lives,
not whether a circuit is needed. That narrower claim is the bet.

### What counts as a reputation leaf

The claim is only as good as its admission rules. Decide these before the
circuit:

- **Resolved games only.** A forfeited, cancelled, or unrevealed game has no
  leaf. A player cannot farm a record by abandoning bad rounds.
- **Distinct opponents.** At least K of the N games must be against different
  addresses; otherwise two colluding accounts can produce a perfect record in
  an afternoon.
- **A stake floor, or stake weighting.** A zero-stake game must not count. The
  trusted lobby may be low-stake, but its games should not feed the same tree
  unless the lobby is explicitly a practice surface. If the lobby feeds the
  tree, reputation is farmable for free.
- **N is fixed at 16.** A player with fewer than 16 qualifying games cannot
  claim; do not pad with dummy leaves. A player with more than 16 proves
  _there exist_ 16 qualifying games — say that in the UI, not “my full
  record”.
- **One seed is one reputation.** A new `s` is a new, empty history. Binding
  `s` to a wallet signature or passkey is v2; in v1 the honest wording is
  “per-seed”, and the demo should show that a fresh seed has no record.
- **Access, not collateral.** `rep_passed` gates entry. That is reputation as
  access. Calling it collateral requires the contract to reduce the required
  escrow; if that is not built, do not use the word.

The circuit's public inputs should carry `threshold_num`, `threshold_den`,
`context`, and `nullifier`; `N` is fixed by the array length. The contract
must store the nullifier as public state. A private nullifier set cannot
prevent a double claim.

### The data path (answer this before the gate)

The game, the escrow, and the settlement stay on Stellar. The reputation tree
needs the outcomes of those games. **The original plan did not say how a
Stellar result becomes a Midnight leaf.** That is not a detail; it is the
largest cost in the decision. The three shapes below settle it.

There are three shapes:

| Shape                                    | What it costs                                                                                                                                                             | What it trusts                                                                                           |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| **A. Build pattern 3 on Stellar (Noir)** | The Poseidon sponge + incremental tree in the contract (hard part 1 in `docs/HACKMERIDIAN.md`), plus the circuit. No new chain, no bridge.                                | The existing Stellar contract and verifier.                                                              |
| **B. Mirror outcomes to Midnight**       | A relayer that reads Stellar events and submits signed outcome attestations to a Midnight contract, plus the Midnight verifier and tree. Two deployments to keep in sync. | The relayer's liveness and honesty, unless the attestation is verified on Midnight (which is more work). |
| **C. Move the game to Midnight**         | A port of the game + escrow + settlement.                                                                                                                                 | Contradicts the decision rule.                                                                           |

**Recommendation:** price A and B before the Compact spike. For a 20-day
window, A is the lower-risk path: it puts the reputation tree next to the
outcomes that feed it and removes a cross-chain trust assumption. B is only
additive if the Midnight tree buys something A cannot — and “private state”
does not, by itself, buy unlinkability (see the privacy note above). If B is
chosen for strategic reasons (the Midnight ecosystem, a partner, a grant),
say so explicitly and budget the relayer and its trust model as part of
pattern 3, not as an afterthought.

The gate below is necessary but not sufficient. A green Compact spike with no
data path is still a no.

### The decision gate

**Not “does Compact ship Poseidon?” — that is a proxy.** The gate is a working
slice:

1. A Compact contract maintains an incremental Merkle tree over public
   commitments (the same shape as hard part 1 in `docs/HACKMERIDIAN.md`).
2. A circuit proves membership of `N` leaves under that root and asserts the
   threshold, with `s` private.
3. The proof verifies in a third-party verifier on a Midnight testnet, not
   only in the prover's own client.
4. A nullifier replay is rejected by the contract.
5. Browser proving time is measured, not estimated.
6. The data path from Stellar is decided (see above) and, if it is B, the
   attestation format is sketched.

**Why the old gate was too narrow.** The current Compact standard-library
docs ([docs.midnight.network/compact/standard-library](https://docs.midnight.network/compact/standard-library))
list `persistentHash`, `transientHash`, `persistentCommit`, and a Merkle tree
module — not Poseidon. That may be enough, but it is a different hash and, as
far as the current docs show, a different field/curve from the Noir BN254
circuit. Confirm both against the pinned version in the spike. Nothing in
`circuits/allowlist_membership` can be reused as-is. This is a reimplementation
of the same claim, not a port; the plan should say so.

**Pass/fail and a hard date.** The spike is green only if all six items above
work end to end. Book **23 October 2026** for the HackMeridian scope and
**26 October 2026** for the Wave 3 scope. If the spike is not green by the
relevant date, the default is **Noir on Stellar**; Midnight becomes a later
port once the claim is proven. A default is how the window survives a
discovery.

**Pre-work (before Wave 3 opens, 27 October):**

1. Install the Compact toolchain and compile the sample contract.
2. Read the standard-library hash and Merkle-tree APIs; write down the exact
   hash, field, and proof system.
3. Build the 16-leaf fixture (`docs/PATTERN3_TEST_VECTORS.md`) in Compact and
   compare the root with the Noir/TS implementation.
4. Run the six-item gate above, including the data path.
5. Decide and record the decision in this file, with the date and the reason.

This is a day of work, not a few hours, once the toolchain, testnet, and
verifier are included. Do it before the window, not inside it.

### Security details to pin down

- **Domain separation.** `tag = poseidon3([DOMAIN_TAG, s, game_id])`,
  `leaf = poseidon3([DOMAIN_LEAF, tag, move])`, and
  `nullifier = poseidon3([DOMAIN_NULLIFIER, s, context])`, with distinct
  domain constants. Do not reuse the same two-input shape for the tag and the
  nullifier: a context value that collides with a game id would leak linkage.
  Include the chain id and contract id in the context so a proof cannot be
  replayed on another deployment.
- **Test vectors first.** `docs/PATTERN3_TEST_VECTORS.md` and
  `scripts/check-pattern3-vectors.cjs` define the shared fixture. The circuit,
  the contract, and the TS client must all reproduce the same tags, leaves,
  root, and nullifier before any UI is built.
- **Negative tests.** Wrong root, reused nullifier, threshold one unit below,
  leaf not in the tree, tag mismatch, `N-1` games, malformed public inputs,
  proof from another context, and a proof from another contract/chain.
- **Seed lifecycle.** `docs/PATTERN3_SEED.md` covers creation, backup,
  recovery, rotation, and the localStorage threat model. Read it before
  writing the first `getOrCreateSeed`.

### What we are not doing

- **Not migrating Latep to Midnight.** The game, escrow, and settlement stay on Stellar. Midnight is for the reputation layer only.
- **Not shipping a relayer without naming its trust model.** If the data path
  is B, the relayer is part of the product, not plumbing.
- **Not porting patterns 1 and 2.** They're proven on Stellar. Rewriting them in Compact has no payoff.
- **Not building pattern 3 in Noir as a fallback before testing Compact.** If
  the six-item gate fails, or the data path costs more than the circuit, the
  default is Noir on Stellar; we revisit Midnight after the claim is proven.
  Building both in parallel is how you end up with neither.
- **Not treating Midnight as a hedge.** It's either additive for pattern 3 or it's not used. "Also on Midnight" is not a strategy.

## Why this is accretive

Latep and Dallas are the same product pattern — prove something without revealing it, and that proof releases money. Latep proves _behavioral_ trust; Dallas proves _performance_ trust. The shared infrastructure is **ZK-conditional settlement**.

If pattern 3 lands on Midnight, Latep becomes an early working example of a
_portable_ reputation on a chain designed for it, while keeping its game and
settlement on a chain that already works. That is only true if the outcome
path is attested; otherwise the reputation is a separate island. It is still a
genuine architectural statement, not a demo trick — but the statement is about
the whole path, not the chain.

If pattern 3 lands on Stellar instead, the project still ships — it just takes the Noir path. Midnight being additive is a bonus, not a dependency.

Either way, Latep ships. That's the point of the rule.
