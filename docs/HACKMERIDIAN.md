# Latep — HackMeridian 2026 Plan

**HackMeridian**: October 25–26, 2026 · ONE16, Lisbon · Track: **Scale** (Prototype → Product)

**One-liner:** Latep turns the iterated Prisoner's Dilemma into private, portable reputation on Stellar — prove a track record without revealing it.

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

**Claim:** "I hold a secret `s` whose recorded outcomes in the on-chain reputation set show ≥ T% cooperation across N games" — proven under a fresh identity, unlinkable to the address that earned it.

The privacy win is not hiding the stats — game outcomes are publicly recorded. The win is **severing reputation from identity**: a player proves trustworthiness to a new counterparty, lobby, or contract without revealing which history is theirs.

### Data model

- **Identity seed `s`** — a long-lived secret held client-side (like the reveal nonce today; persisted in localStorage, later derivable from a wallet signature). Never leaves the client.
- **Per-game pseudonym tag** — at commit time, the move-commitment circuit gains one public input: `tag = poseidon(s, game_id)`. This proves the tag derives from a secret the committer knows, without revealing `s`. The tag is unlinkable across games (per-game pseudorandom) and unforgeable (bound into the same proof).
- **Outcome leaves** — on `resolve_game`, the contract appends two leaves to an incremental Poseidon Merkle tree (the _reputation tree_): `leaf = poseidon(tag, move)`, where `move` is the revealed play. Contract stores `rep_root`.

An observer sees leaves appended per game and knows both players' moves — but a leaf's interior (which player's secret produced it) is opaque. The anonymity set for a reputation claim is all players whose records are compatible.

### Circuit: `circuits/reputation_threshold/`

- **Private inputs:** `s`, `game_ids[N]`, `moves[N]`, `paths[N][D]`, `indices[N][D]`
- **Public inputs:** `rep_root`, `threshold_num`, `threshold_den`, `context`, `nullifier`
- **Logic:**
  - For each i: `tag_i = poseidon(s, game_ids[i])`; `leaf_i = poseidon(tag_i, moves[i])`; assert membership of `leaf_i` at `indices[i]` under `rep_root` (Poseidon Merkle path, same construction as the allowlist circuit)
  - `nullifier = poseidon(s, context)` — binds the claim to a domain (e.g. `"trusted_lobby"`), prevents replay within that context, reveals nothing else
  - Assert `coop_count * threshold_den ≥ threshold_num * N`

Fixed `N` (e.g. 16) and depth `D` (e.g. 16 → 65k leaves) for v1.

### Contract surface

```rust
// extended on existing structs/fns:
//   create_game / join_game gain `tag: Bytes` arg (public input to move circuit)
//   resolve_game appends poseidon(tag_i, move_i) leaves, updates rep_root

fn verify_reputation(env, claimant: Address, proof: Bytes,
                     root: Bytes, threshold_num: u32, threshold_den: u32,
                     context: Symbol, nullifier: Bytes) -> Result<()>
//   verifies UltraHonk with a third VK, checks root == rep_root,
//   records nullifier, sets rep_passed(claimant, context), emits event

fn rep_passed(env, player: Address, context: Symbol) -> bool
fn get_reputation_root(env) -> Option<Bytes>
```

**Gated action for the demo:** a _trusted lobby_ — a low-stake (or zero-stake) game room requiring `rep_passed(player, "trusted_lobby")`. The concrete pitch: _reputation as collateral_ — proven players play with reduced or no escrow.

### Hard parts (honest list)

1. **On-chain Poseidon leaf append.** CAP-75 exposes the Poseidon _permutation_, not a hash — the contract must implement the sponge matching `noir-lang/poseidon` bn254 `hash_1`/`hash_2` exactly (field, state size, round constants, padding). Prior art: Nethermind's `contracts/tornado_classic` in rs-soroban-ultrahonk already does incremental Merkle + on-chain Poseidon — steal the pattern. Their `feat/for_poseidon2` branch is worth checking too.
2. **Move circuit change** — one added public input (`tag`) and the `poseidon(s, game_id)` constraint. Requires regenerating the VK and re-initializing the contract, so it lands with the next deploy, not as a patch.
3. **Incremental Merkle tree in contract** — frontier-based append (classic Tornado-style), D=16.

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

And the demo arc writes itself: tutorial (trust evolves) → ZK match (trust hidden but binding) → reputation proof (trust portable and private) → the same proof gates entry to the trusted lobby. One click from game to "this is why Stellar."

## Work plan (~6 weeks to Oct 25)

| When      | What                                                                                                                                                                                               |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ✅ done   | soroban-sdk 27 bump (verifier on upstream `chore/protocol27`), 19/19 tests, nullifier fix for any game_id, proof-gen timeout, Raven MCP + Stellar skills wired, contract confirmed live on testnet |
| Week 1–2  | Two-wallet e2e test (last honest-gap item); repin verifier to `main` once upstream PR #42 merges; redeploy fresh contract if needed                                                                |
| Week 3–4  | Move circuit `tag` input + VK regen; on-chain Poseidon leaf append + incremental Merkle tree; contract storage for rep_root                                                                        |
| Week 5–6  | `reputation_threshold` circuit + `verify_reputation`; minimal trusted-lobby gate; demo polish                                                                                                      |
| Oct 25–26 | Build the gated surface live, record the demo, pitch                                                                                                                                               |

**Application framing (Scale):** existing working product (deployed, tested, live at latep.trustfall.xyz) → the meaningful step toward production is Pattern 3: from ZK demo to reputation infrastructure. Modernized using Stellar's own agentic tooling (Raven MCP + Stellar Skills). Ask: audit pathway for the verifier + SCF continuation.
