/**
 * The four primitives — what the cryptography actually does, as objects
 * everyone already keeps on a counter.
 *
 * Source of truth: design.md §7. Never retype these strings in a component;
 * import from here. If a line needs to change, change it here and say why in
 * the PR (design.md §3 rule: amend the doc in the same PR).
 */

export type PrimitiveId = "seal" | "handshake" | "net" | "pass";

export interface Primitive {
  id: PrimitiveId;
  /** The name users read. */
  name: string;
  /** Mark component key, e.g. "seal" -> <SealMark />. */
  mark: PrimitiveId;
  /** The one everyday line printed under the name. */
  oneLine: string;
  /** What this primitive is, in Latep specifically. */
  whatItIs: string;
  /** Where people already meet this in real life. */
  everyday: string;
  /** Route where the visitor has already felt it. */
  meetItAt: string;
}

export const PRIMITIVES: readonly Primitive[] = [
  {
    id: "seal",
    name: "The Seal",
    mark: "seal",
    oneLine: "Decide before you see theirs.",
    whatItIs: "Move commitment + ZK proof the sealed move is valid",
    everyday: "Sealed bids, votes, rock-paper-scissors over text",
    meetItAt: "/",
  },
  {
    id: "handshake",
    name: "The Handshake",
    mark: "handshake",
    oneLine: "No take-backs.",
    whatItIs: "Commitment binding: a revealed move must match the seal",
    everyday: "Deals with strangers, prices that can't “shift”",
    meetItAt: "/learn/play",
  },
  {
    id: "net",
    name: "The Net",
    mark: "net",
    oneLine: "Nobody has to be the hero.",
    whatItIs: "Contract escrow that settles automatically",
    everyday: "Group buys, deposits, marketplace payments",
    meetItAt: "/play",
  },
  {
    id: "pass",
    name: "The Pass",
    mark: "pass",
    oneLine: "Prove you belong without saying who you are.",
    whatItIs: "ZK allowlist membership + nullifier",
    everyday: "Members-only drops, age checks, accredited access",
    meetItAt: "/real-life",
  },
] as const;

const BY_ID = new Map(PRIMITIVES.map((p) => [p.id, p]));

export function getPrimitive(id: PrimitiveId): Primitive {
  const found = BY_ID.get(id);
  if (!found) throw new Error(`Unknown primitive: ${id}`);
  return found;
}

export const PRIMITIVE_IDS = PRIMITIVES.map((p) => p.id);
