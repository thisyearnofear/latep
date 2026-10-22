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

/* -------------------------------------------------------------------------- */
/* The hero and the chapters (design.md §13.7)                                 */
/* -------------------------------------------------------------------------- */

export const HERO = {
  title: "Prove you keep your word.",
  tint: "Without publishing your history.",
  lede: "Latep is a private reputation for Stellar: show a stranger your track record, and nothing else. It's being built on top of a trust game you can play today.",
  illustrationLabel:
    "Drawing: Maria at her remittance desk, a counterparty across the counter, a stack of receipt slips between them.",
} as const;

export interface Chapter {
  id: "problem" | "fourth" | "earn" | "goes" | "underneath";
  number: string;
  title: string;
}

export const CHAPTERS: readonly Chapter[] = [
  { id: "problem", number: "01", title: "The problem" },
  { id: "fourth", number: "02", title: "The fourth option" },
  { id: "earn", number: "03", title: "Earn a record" },
  { id: "goes", number: "04", title: "Where it goes" },
  { id: "underneath", number: "05", title: "Underneath" },
] as const;

/* -------------------------------------------------------------------------- */
/* The claim demo (design.md §13.7). Worked example, not measured.             */
/* -------------------------------------------------------------------------- */

export const CLAIM_DEMO = {
  heading: "Same counter, two counterparties",
  stranger: {
    label: "A stranger",
    line: "No record Maria can check. She asks for the full amount up front.",
    collateralPct: 100,
  },
  holder: {
    label: "A proven holder",
    line: "Shows a proof: at least 90% of 200 recorded deals kept. Maria learns nothing else.",
    collateralPct: 40,
    threshold: 90,
    recorded: 200,
  },
  collateralLabel: "Collateral asked",
  learnsLabel: "What Maria learns",
  learnsStranger: "Nothing — so she assumes the worst.",
  learnsHolder: "One fact: the threshold was met.",
  statusLink: "Where Pattern 3 is",
} as const;

/* -------------------------------------------------------------------------- */
/* Earn a record — the close of chapter 03                                      */
/* -------------------------------------------------------------------------- */

export const EARN = {
  line: "Every round you play prints a receipt. Lean in and the thread twists tighter. Your receipts, tied together, are your record.",
  addToRecord: "Add to your record",
} as const;

/* -------------------------------------------------------------------------- */
/* /record (design.md §13.7)                                                    */
/* -------------------------------------------------------------------------- */

export const RECORD = {
  title: "Your record",
  tint: "Yours to prove, not to publish.",
  lede: "Every round you've played, tied together by the thread. When Pattern 3 ships, this is what you'll prove a threshold over — without showing a single receipt.",
  onChain: "On-chain",
  onChainEmpty: "No on-chain games yet. Play with a friend to record one.",
  practice: "Practice",
  practiceEmpty: "No receipts yet. Play a practice round to print your first.",
  practiceCta: "Play a practice round",
  recorded: "Rounds recorded",
  kept: "Rounds kept",
  keptPct: "Kept",
  height: "Trust height",
  prove: "Prove it",
  proveLine:
    "See what a counterparty would learn from your record — and what it wouldn't.",
} as const;

/* -------------------------------------------------------------------------- */
/* /real-life — where it goes (design.md §13.7). All illustrative.             */
/* -------------------------------------------------------------------------- */

export interface Scenario {
  id: "credit" | "escrow" | "agents";
  kicker: string;
  title: string;
  today: string;
  withLatep: string;
  uses: readonly ("seal" | "handshake" | "net" | "pass" | "record")[];
}

export const WHERE_IT_GOES = {
  title: "Where it goes",
  tint: "Trust you can carry between strangers.",
  lede: "The game is the first place a record is earned. These are the places it gets spent.",
  liveToday: "Live today",
  liveTodayLine:
    "The four pieces already working in the app, and where you've met them.",
  todayLabel: "Today",
  withLabel: "With a Latep proof",
  usesLabel: "Uses",
  demoLink: "Try the claim demo",
  homeLink: "See where it goes",
} as const;

/** Calls to action under the hero. */
export const HERO_ACTIONS = {
  primary: "Play a practice round",
  secondary: "See where it goes",
} as const;

export const SCENARIOS: readonly Scenario[] = [
  {
    id: "credit",
    kicker: "Credit",
    title: "A remittance desk extends credit to a stranger",
    today:
      "Maria demands the full amount up front, so capital sits locked on both ends of the corridor.",
    withLatep:
      "The counterparty proves 90% of their recorded deals were kept. Maria asks for 40% and learns nothing about who they've dealt with.",
    uses: ["record", "net"],
  },
  {
    id: "escrow",
    kicker: "Escrow",
    title: "A marketplace sets a seller's deposit",
    today:
      "Every new seller posts the same large deposit, because the market can't tell a careful seller from a careless one.",
    withLatep:
      "A seller proves a kept-delivery threshold from another market's record. The deposit shrinks; neither market sees the other's customers.",
    uses: ["record", "net", "handshake"],
  },
  {
    id: "agents",
    kicker: "Agents",
    title: "An AI agent pays a service it has never used",
    today:
      "A new agent has no history to show, so it starts at zero trust and prepays everything.",
    withLatep:
      "The agent arrives with a proof — kept 95% of its last 200 commitments — checked in seconds, revealing nothing else.",
    uses: ["record", "seal"],
  },
] as const;
