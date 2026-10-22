/**
 * The story — the words the landing page tells itself.
 *
 * The landing page used to open on a situation everyone had lived through
 * ("you've paid a stranger before and hoped they'd deliver"). That was true
 * and it was nobody's. This module replaces it with one named situation, the
 * three dead ends it has, the fourth option, and where the thing goes.
 *
 * The copy is held here rather than in the page for the same reason the
 * primitives are: one source of truth, so the landing page, the plates and
 * the everyday page cannot drift apart (design.md §3, §7).
 *
 * Honesty rules that apply to every line here (design.md §7):
 *   - No invented numbers. The 90%, the 200 deals and the 40% are a worked
 *     example, and every surface that shows them carries the ILLUSTRATIVE
 *     stamp.
 *   - Nothing claims a proof that the app cannot produce. The reputation
 *     claim is in build, and says so.
 */

/* -------------------------------------------------------------------------- */
/* The opening                                                                 */
/* -------------------------------------------------------------------------- */

export const SITUATION = {
  title: "Maria runs a remittance desk in Manila.",
  lede: "A counterparty in Dubai wants to settle on credit. Today Maria has three options, and every one of them costs her something.",
} as const;

/** The three ways strangers transact. Each fails for a different reason. */
export interface DeadEnd {
  id: "blind" | "collateral" | "publish";
  name: string;
  line: string;
}

export const DEAD_ENDS: readonly DeadEnd[] = [
  {
    id: "blind",
    name: "Trust a stranger",
    line: "It works until it doesn't, and nothing on the counter tells you which one you're in.",
  },
  {
    id: "collateral",
    name: "Demand the full amount up front",
    line: "Safe and expensive. Capital sits locked on both sides of the corridor for a deal that was probably routine.",
  },
  {
    id: "publish",
    name: "Ask for their history",
    line: "The most revealing option, and the one that costs the most: their record is also their list of counterparties.",
  },
] as const;

/** The fourth option — the product, in one paragraph. */
export const FOURTH = {
  kicker: "The fourth option",
  line: "The counterparty shows a proof that says: at least 90% of my recorded deals were honored. Maria verifies it in seconds. She learns nothing else — not who they are, not who they've dealt with, not which deals.",
  payoff: "Collateral drops from 100% to 40%.",
  close:
    "That is Latep: a private reputation you can carry and prove without publishing.",
} as const;

/** The mechanic, in the plainest words the app can manage. */
export const MECHANIC = {
  kicker: "How it works",
  line: "A holder proves \u201c\u2265T% of my recorded interactions were kept\u201d to any counterparty. A nullifier binds the claim to the context it was made in, so it cannot be replayed. It reveals neither their identity, nor the interactions, nor who is asking.",
  line2:
    "Reputation is minted per issuer into Poseidon Merkle trees on Soroban, so any service — a payment processor, an escrow market, a lending desk — can mint for the same holder without changing our contract.",
} as const;

/* -------------------------------------------------------------------------- */
/* Why a game is the first issuer                                              */
/* -------------------------------------------------------------------------- */

export const FIRST_ISSUER = {
  kicker: "Why a game is the first issuer",
  line: "Reputation needs a source of honest outcomes that is verifiable, repeatable, and has money on the line. The iterated Prisoner's Dilemma with real XLM in escrow is the cleanest version of that. Every move is sealed with a zero-knowledge proof and verified on-chain today, so Latep can produce the kind of record a settlement produces, from day one, without waiting for a partner.",
  line2: "A real issuer plugs into the same tree with a new tag.",
} as const;

/* -------------------------------------------------------------------------- */
/* Where it goes                                                                */
/* -------------------------------------------------------------------------- */

export interface Direction {
  id: "credit" | "agents" | "proof";
  title: string;
  line: string;
}

export const DIRECTIONS: readonly Direction[] = [
  {
    id: "credit",
    title: "Uncollateralized credit",
    line: "Smaller escrow stakes in Stellar's remittance and OTC corridors first — capital that was locked becomes liquid.",
  },
  {
    id: "agents",
    title: "Agent-to-agent payment",
    line: "An agent that spins up today starts at zero trust and stays there, because it has no history to publish.",
  },
  {
    id: "proof",
    title: "An agent arrives with a proof",
    line: "\u201cI kept 95% of my last 200 commitments.\u201d Checked in seconds, revealing nothing else.",
  },
] as const;

/* -------------------------------------------------------------------------- */
/* Honest scope                                                                 */
/* -------------------------------------------------------------------------- */

export const SCOPE = {
  kicker: "Honest scope",
  lines: [
    "The Seal, the Handshake, the Net and the Pass are real today: proofs generate in your browser and verify on-chain.",
    "The Record is in build. Its plate on this page shows the mechanism, not a proof — it is stamped for what it is.",
  ],
} as const;
