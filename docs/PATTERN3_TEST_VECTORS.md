# Pattern 3 — shared test vectors

**Status:** fixture and checker live; the circuit and contract do not exist yet.
This file is the contract between them. If the circuit, the contract, and the
TypeScript client do not reproduce these values, one of them is wrong.

- Fixture: [`test-vectors/pattern3.json`](../test-vectors/pattern3.json)
- Checker: [`scripts/check-pattern3-vectors.cjs`](../scripts/check-pattern3-vectors.cjs)
- Command: `npm run check:pattern3-vectors`

The fixture is generated, not hand-written. `--write` regenerates it from the
fixed seed and move list. A diff means the hash parameters or the derivation
changed; treat that as a deliberate decision, not a formatting fix.

## What is pinned

```
FIELD      = 21888242871839275222246405745257275088548364400416034343698204186575808495617
DEPTH      = 16
N          = 16
EMPTY_LEAF = 0
node       = poseidon2([left, right])
```

```
DOMAIN_TAG       = 0x544147   ("TAG")
DOMAIN_LEAF      = 0x4c454146 ("LEAF")
DOMAIN_NULLIFIER = 0x4e554c4c ("NULL")
DOMAIN_CONTEXT   = 0x43545854 ("CTXT")
```

```
tag       = poseidon3([DOMAIN_TAG,       s, game_id])
leaf      = poseidon3([DOMAIN_LEAF,      tag, move])
nullifier = poseidon3([DOMAIN_NULLIFIER, s, context])
```

`move` is `0` (hold back / defect) or `1` (lean in / cooperate), matching the
existing contract symbols `C` and `D`. `context` is derived once per deployment:

```
context = poseidon3([DOMAIN_CONTEXT, chain_id, contract_id])
```

For the fixture, `chain_id` is the field value of `"Stellar"` and
`contract_id` is the field value of `"Latep"`. In production, hash the actual
chain identifier and the deployed contract's address into a field; do not
reuse these stand-ins.

The domain separation is deliberate. Without it, a `context` value that
collides with a `game_id` would make `nullifier == tag`, which links a claim
to the game that earned it. Do not "simplify" the three-input hashes back to
two.

## The tree

- Depth 16, so 65,536 leaves. Empty leaves are `0`.
- The 16 reputation leaves are placed at the indices in `cases[].games[]`;
  the rest are empty. The indices are scattered on purpose, including `0` and
  `65535`, so a path implementation that only handles the easy middle is
  caught.
- Internal nodes are `poseidon2([left, right])`, the same construction the
  allowlist circuit already uses.
- The root is public. The leaves are public commitments; `s` is the secret.
  Do not describe the leaves as private.

## Cases

| Case            | Games | Cooperation | Threshold | Expected                    |
| --------------- | ----- | ----------- | --------- | --------------------------- |
| `pass-12-of-16` | 16    | 12          | 3/4       | passes (`12 * 4 == 3 * 16`) |
| `fail-11-of-16` | 16    | 11          | 3/4       | rejects (`11 * 4 < 3 * 16`) |

The first case is the boundary: equality passes. An implementation that uses
`>` instead of `>=` fails it. The second case is the near miss: a circuit that
always returns true fails it.

Reference values (decimal):

```
seed      = 0x00a1b2c3d4e5f60718293a4b5c6d7e8f00112233445566778899aabbccddeeff
context   = 16006758644140578265442010674689220455694387300008272576350684081898094790634
nullifier = 4456907813826433154083662695619727984475538127017865137313188990724541346274
root (pass) = 9727650087204668027243248480418543288546355054797763968201477299129845983146
root (fail) = 3101617857565512934274883167619326854037450115456292979271679967484576465314

tag[0]    = 1791736070823506247714834395869911398584944219667416185870577622973968941547
leaf[0]   = 1843750369849108702872918804579586336083271874100669866154493628634116165230
```

The fixture contains all 16 tags, leaves, paths, and path indices for both
cases. Use the JSON, not this table, for implementation.

## How each layer consumes it

**Circuit (Noir or Compact).** The public inputs are `rep_root`,
`threshold_num`, `threshold_den`, `context`, and `nullifier`. The private
inputs are `s`, `game_ids[N]`, `moves[N]`, `paths[N][D]`, and
`indices[N][D]`. For each `i`, recompute `tag_i`, `leaf_i`, and the root, then
assert the threshold:

```
coop_count * threshold_den >= threshold_num * N
```

Use `hash_3` from `noir-lang/poseidon` (the package exposes `hash_1` through
`hash_4`). `poseidon-lite` is the TypeScript parity implementation; the
existing allowlist nullifier already matches it. If a pinned Noir version does
not expose `hash_3`, pin a version that does rather than changing the
construction.

**Contract.** Store `rep_root` and the used-nullifier set as public state.
`verify_reputation` must check the root, verify the proof, and record the
nullifier before it sets `rep_passed`. A private nullifier set cannot prevent a
double claim. Append leaves only for resolved games, and only when the
admission rules in [`MIDNIGHT_PLAN.md`](MIDNIGHT_PLAN.md#what-counts-as-a-reputation-leaf)
are met.

**TypeScript client.** Use `poseidon-lite` and a single `deriveTag` /
`deriveLeaf` / `deriveNullifier` module. Do not duplicate the domain constants
in components. The client must be able to reproduce every value in the fixture
before it is allowed to generate a proof.

## Negative tests the fixture does not cover

These are separate tests, not fixture values:

- Wrong root: a valid path under a different root must fail.
- Reused nullifier: a second claim in the same context must revert.
- Threshold one unit below: `coop * den + 1 < num * N` must fail.
- Leaf not in the tree: a leaf that is not at the claimed index must fail.
- Tag mismatch: a tag derived from a different `s` must fail.
- `N-1` games: a player with 15 qualifying games cannot fill the fixed `N=16`
  circuit. The UI must say "not enough games", not pad with dummy leaves.
- Malformed public inputs: wrong lengths, non-canonical field elements, zero
  `threshold_den`.
- Context replay: a proof for one chain/contract must not verify on another.
- Cross-game linkage: a nullifier must not equal any public tag.

## Changing the fixture

Only regenerate after an intentional change to the hash, the domains, the tree
construction, or the case inputs. In the same change:

1. Update this file and the constants in `scripts/check-pattern3-vectors.cjs`.
2. Regenerate: `node scripts/check-pattern3-vectors.cjs --write`.
3. Update the circuit and contract constants.
4. Run `npm run check:pattern3-vectors` and the contract tests.
5. Say in the PR why the root changed.

A fixture diff without a corresponding circuit/contract change is a red flag.
