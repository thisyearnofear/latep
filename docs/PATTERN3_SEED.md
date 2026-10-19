# Pattern 3 — identity seed lifecycle

**Status:** design, not built. This is the decision record for `s`, the secret
behind private reputation. It is written before the circuit so the product
promise is clear: a reputation is only as durable as the seed that earns it.

The claim Pattern 3 makes is:

> “I hold a secret `s` whose recorded outcomes show ≥ T% cooperation across N
> games, proven under a fresh identity, unlinkable to the address that earned
> it.”

Everything in that sentence depends on `s` being **secret**, **stable**, and
**recoverable**. This document covers all three.

## 1. What `s` is

- A random field element in the BN254 scalar field
  (`0 < s < 21888242871839275222246405745257275088548364400416034343698204186575808495617`).
- 32 bytes of cryptographically random entropy, reduced into the field. Never
  derive it from a wallet address, a username, or a timestamp.
- It never leaves the browser except through an explicit user export. It is
  never sent to the app's server, never put in a URL, never logged, and never
  included in analytics.
- Tags, leaves, and nullifiers are derived from it:

```
tag        = poseidon3([DOMAIN_TAG,        s, game_id])
leaf       = poseidon3([DOMAIN_LEAF,       tag, move])
nullifier  = poseidon3([DOMAIN_NULLIFIER,  s, context])
```

The domain constants and the exact expected values live in
[`PATTERN3_TEST_VECTORS.md`](PATTERN3_TEST_VECTORS.md). The circuit, the
contract, and the TypeScript client must all reproduce the same fixture before
any UI is built.

## 2. The product promise

Write this in the UI before the first seed is created, not in a help page
afterward:

> **Your trust key lives in this browser.**
> Back it up before you earn a record. If you clear site data or lose this
> device without a backup, the record still exists on-chain but no one can
> claim it — including you. A new trust key starts with an empty record.

That is the honest promise. There is no account recovery in v1 because there
is no account: the seed _is_ the account.

## 3. Lifecycle

| Stage       | What happens                                                                                                                                                   | What the user sees                                                     |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| **Create**  | On an explicit “Create your trust key” action, generate 32 bytes, reduce into the field, store it, and show the fingerprint. Do not create on first page load. | “Trust key created · fingerprint `7f3a…`”                              |
| **Persist** | Write `latep.reputation.seed.v1` to `localStorage` immediately. Keep the seed in memory only as long as needed.                                                | “Saved in this browser.”                                               |
| **Back up** | Offer “Export backup” and “Copy backup”. The backup is a versioned text string (section 5). Recommend the user store it in a password manager, not a note app. | “Save this somewhere safe. It is the only way to recover your record.” |
| **Use**     | At commit, derive `tag` and pass it to the move circuit. At claim, derive the `nullifier`. The seed itself is never a public input.                            | No visible change; the receipt prints the claim, not the key.          |
| **Rotate**  | Explicit “Start a new reputation” action. Generate a new seed; keep the old one exportable until the user confirms the new one is backed up.                   | “New trust key · old record is still claimable with the old backup.”   |
| **Delete**  | Explicit “Delete this trust key” action, with a typed confirmation. Warn that the on-chain record is not deleted; it becomes unclaimable.                      | “The record stays on-chain. You will not be able to claim it.”         |
| **Migrate** | Versioned key and record (section 4). Read the old version, write the new one, keep the old until the new one is verified.                                     | No interruption.                                                       |

### When the seed is created

Create it when the player opts into reputation — the first time they open the
reputation panel or check “count this game toward my record” — **not** on app
load and **not** on wallet connect. A seed created silently is a seed the user
does not know they have, and therefore cannot back up.

Existing games played before the seed existed have no tag and cannot be
retroactively added. Say that in the panel: “Your record starts with the next
game.”

## 4. Storage schema

```ts
const STORAGE_KEY = "latep.reputation.seed.v1";

interface StoredSeed {
  version: 1;
  /** 0x-prefixed, 64 hex characters, already reduced into the BN254 field. */
  seed: string;
  /** ISO-8601, for the “created” line in the UI. Never used in a hash. */
  createdAt: string;
  /** Optional user label, e.g. “laptop”. Never used in a hash. */
  label?: string;
}
```

Rules:

- Validate `seed` on read: `0x` + 64 hex, `0 < s < FIELD`. A corrupt record is
  treated as “no seed” and the UI offers import, not a silent new seed.
- `createdAt` and `label` are metadata only. Changing them must not change any
  tag, leaf, or nullifier.
- Do not store the seed in `sessionStorage` as a fallback. A reputation that
  disappears when the tab closes is worse than an explicit error.
- Do not use `localStorage` for the seed on the server. Guard every access with
  `typeof window !== "undefined"`.
- One key, one seed. Multiple seeds are separate records in the UI, not
  multiple keys.

### Why localStorage in v1

It matches the app's existing nonce storage (`src/services/localSecretStore.ts`)
and needs no backend. It is also the weakest part of the design: any XSS on the
origin can read it, and any browser “clear site data” destroys it. That is
acceptable for a demo **only because** the UI says so and export exists. It is
not acceptable for a reputation that gates money without those two things.

**v2 options, in order of preference:** a passkey-derived key (WebAuthn PRF or
a passkey-wrapped random seed), a wallet-signature-derived key with a clear
wallet-portability caveat, or an encrypted backup the user controls. Do not
build a server-held seed; that turns “unlinkable” into “trust our database”.

## 5. Backup and import format

A backup is a single line, easy to paste into a password manager:

```
latep1:<seed-hex>:<checksum-hex>
```

- `latep1` — format version.
- `<seed-hex>` — 64 lowercase hex characters, no `0x`.
- `<checksum-hex>` — the first 8 hex characters of `poseidon1([s])`. This is a
  typo check, not a security check.

Import rules:

1. Trim whitespace; accept surrounding quotes from a password manager.
2. Check the `latep1:` prefix.
3. Check 64 hex characters and the field range.
4. Recompute the checksum; reject with “That backup looks incomplete” rather
   than “invalid seed”.
5. Show the fingerprint and the on-chain record status (`none`, `N games`)
   **before** replacing the current seed. Require an explicit confirmation.
6. Never overwrite an existing seed without confirmation. If the imported seed
   is the same as the current one, say so and do nothing.

The fingerprint is `poseidon1([s])` rendered as hex, first 8 characters. It is
safe to display and lets a user tell two keys apart. Do not display the seed
itself after creation except behind an explicit “reveal” press.

## 6. Threat model

| Threat                      | Effect                                                    | v1 mitigation                                                  | Residual                                                                                                                                   |
| --------------------------- | --------------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| XSS on the origin           | Seed and nonces readable                                  | No server-held seed; CSP; no third-party scripts on `/play`    | A same-origin XSS can still steal it. Treat any XSS as a seed compromise and prompt rotation.                                              |
| Malicious browser extension | Seed readable                                             | None                                                           | Out of scope; say so.                                                                                                                      |
| Shared or lost device       | Record unclaimable                                        | Export prompt at creation; fingerprint                         | User must back up. No recovery.                                                                                                            |
| Browser profile sync        | Seed copied to other devices                              | None (localStorage does not sync)                              | Export/import is the only cross-device path.                                                                                               |
| Backup in notes/chat        | Seed leaked                                               | UI recommends a password manager                               | User choice; the backup is a bearer token.                                                                                                 |
| Seed sharing / collusion    | Reputation is transferable                                | None; documented                                               | A known v1 limitation. Binding to a wallet/passkey is v2.                                                                                  |
| Seed rotation / Sybil       | A bad record is abandoned; a good record is cherry-picked | Per-seed claim wording; no “per-person” claims                 | An attacker can farm a fresh seed. Distinct-opponent and stake-floor rules in `MIDNIGHT_PLAN.md` raise the cost; they do not eliminate it. |
| Loss                        | Record unclaimable                                        | Export; fingerprint                                            | No recovery. State it plainly.                                                                                                             |
| Phishing import             | User pastes a seed into a fake site                       | The real app never asks for a seed except on the import screen | Out of scope; do not add a “paste your seed to verify” flow.                                                                               |

## 7. Multiple tabs and concurrency

- On `storage` events for the seed key, reload the in-memory seed. If two tabs
  create a seed at once, the last write wins; the losing tab must show “another
  tab created a trust key” and use the stored one.
- Do not generate a new seed while an import or rotate is in progress. Use an
  in-memory promise lock per tab; cross-tab locks are not worth the complexity
  in v1.
- The seed is read once per operation, not held in a React context for the
  whole session, so a rotation is picked up without a reload.

## 8. API proposal

Keep this in one service (`src/services/identitySeed.ts` or equivalent), not
scattered through components. The game flow should receive derived values, not
the seed.

```ts
export type SeedStatus = "none" | "ready" | "corrupt";

export interface SeedRecord {
  version: 1;
  seed: bigint;
  createdAt: string;
  label?: string;
}

export function loadSeed(): { status: SeedStatus; record?: SeedRecord };
export function createSeed(): SeedRecord; // throws if one exists
export function importSeed(backup: string): SeedRecord;
export function exportSeed(record: SeedRecord): string;
export function rotateSeed(): SeedRecord; // keeps the old record exportable
export function deleteSeed(): void;
export function seedFingerprint(record: SeedRecord): string;

export function deriveTag(seed: bigint, gameId: bigint): bigint;
export function deriveLeaf(tag: bigint, move: 0 | 1): bigint;
export function deriveNullifier(seed: bigint, context: bigint): bigint;
```

The derive functions must be the only place the domain constants live in the
client. They must match the circuit and the contract, and they must be tested
against `PATTERN3_TEST_VECTORS.md`.

## 9. Tests

- Create → load → fingerprint is stable.
- Export → delete → import → same fingerprint and same tag for a fixed game
  id.
- Corrupt record (bad length, `0`, `>= FIELD`, non-hex) → `corrupt`, no silent
  replacement.
- Import with a bad checksum → rejected with the “incomplete” message.
- Import over an existing seed → requires confirmation; cancel leaves the
  original untouched.
- Rotate → the old backup still derives the old tag; the new seed derives a
  different one.
- Two tabs: the `storage` event updates the second tab; a concurrent create
  resolves to one stored seed.
- `localStorage` quota exceeded → a visible error, not a crash; the seed is
  never written to `sessionStorage` as a fallback.
- No seed, tag, or nullifier in `console.*`, analytics, error messages, or
  URLs. Add a lint rule or a test that greps the built output for the fixture
  seed.
- The seed is not included in any React state that is serialized or shared.

## 10. Open questions (do not block v1)

- Passkey/WebAuthn PRF derivation and whether it is portable across browsers.
- Encrypted backup with a user-chosen passphrase (would need a KDF and a
  format version).
- Social recovery or a guardian model — a reputation is a bearer asset; this
  is a product decision, not a cryptographic one.
- Binding `s` to a wallet without making the reputation wallet-locked. A
  signature-derived seed is portable only if every wallet signs the same
  message deterministically; many do not.
