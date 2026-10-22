import { line, thread, type Box, type Tone, type Vec3 } from "./iso";
import { STAMPS } from "../../content/vocabulary";
import type { PlateDefinition, PlateScene } from "./types";

/**
 * The plates.
 *
 * Six drawings, each a mechanism you can operate. Every figure is stamped for
 * what it is: the four shipped primitives show a mechanism, and the fifth —
 * the one the product is being built around — is stamped as in build, with
 * an illustrative number rather than a measured one.
 *
 * The geometry is written in world units: +x runs right and down, +y runs
 * left and down, +z runs up. A counter top sits at z = 0.3, a desk at
 * z = 2.4.
 */

/* ----------------------------------------------------------------------------
 * Fig 1 — The Desk. The story: collateral drops from 100% to 40%.
 * -------------------------------------------------------------------------- */

const COUNTER_TOP = 2.4;

const deskStep = (claimed: boolean): PlateScene => {
  const plinthHeight = claimed ? 0.95 : 2.4;
  const boxes: Box[] = [
    // the counter
    {
      x: 0,
      y: 0,
      z: 0,
      w: 11,
      d: 4.6,
      h: COUNTER_TOP,
      tone: "faint" as const,
      solid: true,
    },
    // the desk's requirement: a plinth whose height is the collateral
    {
      x: 4.7,
      y: 2.1,
      z: COUNTER_TOP,
      w: 1.2,
      d: 1.2,
      h: plinthHeight,
      tone: "partner" as const,
      solid: true,
    },
    // their record, printed as a stack of slips
    {
      x: 7.4,
      y: 1.1,
      z: COUNTER_TOP,
      w: 2.6,
      d: 1.8,
      h: 0.16,
      tone: "ink" as const,
      solid: true,
    },
    {
      x: 7.4,
      y: 1.1,
      z: COUNTER_TOP + 0.19,
      w: 2.6,
      d: 1.8,
      h: 0.16,
      tone: "ink" as const,
      solid: true,
    },
    {
      x: 7.4,
      y: 1.1,
      z: COUNTER_TOP + 0.38,
      w: 2.6,
      d: 1.8,
      h: 0.16,
      tone: "ink" as const,
      solid: true,
    },
  ];

  if (claimed) {
    // the proof, laid on the counter
    boxes.push({
      x: 1.3,
      y: 1.5,
      z: COUNTER_TOP,
      w: 2.6,
      d: 1.5,
      h: 0.14,
      tone: "you",
      solid: true,
    });
  }

  return { boxes };
};

const DESK: PlateDefinition = {
  id: "desk",
  number: 1,
  name: "The Desk",
  caption:
    "An example, not a proof: a counterparty shows a claim, the desk checks it, and the collateral comes down.",
  stamps: [STAMPS.illustrative],
  steps: [
    {
      id: "",
      parts: [
        {
          id: "claim",
          label: "Show the proof",
          hint: "the slip in front of you",
          at: { x: 2.6, y: 2.25, z: COUNTER_TOP + 0.4 },
        },
      ],
      scene: deskStep(false),
      lines: [
        { label: "CLAIM PRESENTED", value: "NONE" },
        { label: "IDENTITY SHARED", value: "NO" },
        { label: "COLLATERAL REQUIRED", value: "100%", total: true },
      ],
    },
    {
      id: "claim",
      parts: [
        {
          id: "accept",
          label: "Accept the claim",
          hint: "the amber block",
          at: { x: 5.3, y: 2.7, z: COUNTER_TOP + 1.6 },
        },
      ],
      scene: deskStep(true),
      lines: [
        { label: "CLAIM", value: "90% OF 200 DEALS KEPT" },
        { label: "IDENTITY SHARED", value: "NO" },
        { label: "COUNTERPARTIES SHARED", value: "NO" },
        { label: "COLLATERAL REQUIRED", value: "40%", total: true },
      ],
    },
  ],
};

/* ----------------------------------------------------------------------------
 * Fig 2 — The Seal. Decide before you see theirs.
 * -------------------------------------------------------------------------- */

const TABLE = 0.3;

const sealStep = (sealed: boolean): PlateScene => {
  const boxes: Box[] = [
    {
      x: 0,
      y: 0,
      z: 0,
      w: 10.4,
      d: 4.2,
      h: TABLE,
      tone: "faint" as const,
      solid: true,
    },
    // your tile
    {
      x: 1.3,
      y: 1.1,
      z: TABLE,
      w: 2.9,
      d: 2.1,
      h: 0.12,
      tone: sealed ? ("you" as const) : ("faint" as const),
      solid: true,
    },
    // their tile — pencil until the reveal
    {
      x: 6.1,
      y: 1.1,
      z: TABLE,
      w: 2.9,
      d: 2.1,
      h: 0.12,
      tone: "faint" as const,
      solid: true,
    },
  ];

  if (sealed) {
    // the sealed stub, lifted clear of the tile
    boxes.push({
      x: 1.8,
      y: 1.6,
      z: TABLE + 0.95,
      w: 1.9,
      d: 1.1,
      h: 0.12,
      tone: "you",
      solid: true,
    });
  }

  return { boxes };
};

const SEAL: PlateDefinition = {
  id: "seal",
  number: 2,
  name: "The Seal",
  mark: "seal",
  caption:
    "Decide before you see theirs. Your move is bound before anyone stakes anything.",
  href: "/",
  hrefLabel: "Play a round",
  steps: [
    {
      id: "",
      parts: [
        {
          id: "seal",
          label: "Seal your move",
          hint: "the tile on the left",
          at: { x: 2.75, y: 2.15, z: TABLE + 0.5 },
        },
      ],
      scene: sealStep(false),
      lines: [
        { label: "YOUR MOVE", value: "NOT SEALED" },
        { label: "THEIR MOVE", value: "NOT SEEN" },
        { label: "THEY CAN CHANGE IT LATER", value: "YES", total: true },
      ],
    },
    {
      id: "seal",
      parts: [],
      scene: sealStep(true),
      lines: [
        { label: "YOUR MOVE", value: "SEALED" },
        { label: "THEIR MOVE", value: "NOT SEEN" },
        { label: "THEY CAN CHANGE IT LATER", value: "NO", total: true },
      ],
    },
  ],
};

/* ----------------------------------------------------------------------------
 * Fig 3 — The Handshake. No take-backs.
 * -------------------------------------------------------------------------- */

const handshakeStep = (revealed: boolean, matched: boolean): PlateScene => {
  const yoursX = 2.2;
  const theirsX = matched ? 4.3 : 6.9;

  const boxes: Box[] = [
    {
      x: 0,
      y: 0,
      z: 0,
      w: 10.4,
      d: 4.4,
      h: TABLE,
      tone: "faint" as const,
      solid: true,
    },
    {
      x: yoursX,
      y: 1.3,
      z: TABLE,
      w: 2.0,
      d: 1.7,
      h: 0.14,
      tone: "you" as const,
      solid: true,
    },
    {
      x: theirsX,
      y: 1.3,
      z: TABLE,
      w: 2.0,
      d: 1.7,
      h: 0.14,
      tone: "partner" as const,
      solid: true,
    },
  ];

  const threads: { a: string; b: string; toneA: Tone; toneB: Tone }[] = [];

  if (revealed) {
    // the tie between the two sides, drawn once the reveal lands
    const t = thread(
      { x: 2.6, y: 3.4, z: TABLE + 0.2 },
      { x: 8.2, y: 3.4, z: TABLE + 0.2 },
      4,
    );
    threads.push({
      a: t.a,
      b: t.b,
      toneA: "you" as const,
      toneB: "partner" as const,
    });
  }

  return { boxes, threads };
};

const HANDSHAKE: PlateDefinition = {
  id: "handshake",
  number: 3,
  name: "The Handshake",
  mark: "handshake",
  caption:
    "No take-backs. A revealed move that doesn't match the seal is refused.",
  href: "/learn/play",
  hrefLabel: "Practise the handshake",
  steps: [
    {
      id: "",
      parts: [
        {
          id: "reveal",
          label: "Reveal the move",
          hint: "the tile on the right",
          at: { x: 7.9, y: 2.2, z: TABLE + 0.55 },
        },
      ],
      scene: handshakeStep(false, false),
      lines: [
        { label: "YOUR SEAL", value: "IN PLACE" },
        { label: "THEIR MOVE", value: "STILL HIDDEN" },
        { label: "A MISMATCH WOULD BE", value: "REFUSED", total: true },
      ],
    },
    {
      id: "reveal",
      parts: [
        {
          id: "swap",
          label: "Try a different move",
          hint: "the same tile, a different move",
          at: { x: 7.9, y: 2.2, z: TABLE + 0.55 },
        },
      ],
      scene: handshakeStep(true, true),
      lines: [
        { label: "THEIR MOVE", value: "MATCHES THE SEAL" },
        { label: "SETTLEMENT", value: "PROCEEDS" },
        { label: "A TAKE-BACK", value: "NOT POSSIBLE", total: true },
      ],
    },
    {
      id: "swap",
      parts: [],
      scene: handshakeStep(true, false),
      lines: [
        { label: "THEIR MOVE", value: "DIFFERENT FROM THE SEAL" },
        { label: "SETTLEMENT", value: "REFUSED" },
        { label: "A TAKE-BACK", value: "NOT POSSIBLE", total: true },
      ],
    },
  ],
};

/* ----------------------------------------------------------------------------
 * Fig 4 — The Net. Nobody has to be the hero.
 * -------------------------------------------------------------------------- */

const netStep = (settled: boolean): PlateScene => {
  const potX = 3.4;
  const potY = 1.5;
  const potW = 3.4;
  const potD = 1.9;
  const potH = 0.9;

  const boxes: Box[] = [
    {
      x: 0,
      y: 0,
      z: 0,
      w: 10.4,
      d: 4.4,
      h: TABLE,
      tone: "faint" as const,
      solid: true,
    },
    // the pot
    {
      x: potX,
      y: potY,
      z: TABLE,
      w: potW,
      d: potD,
      h: potH,
      tone: "ink" as const,
      solid: true,
    },
    // the four posts the net is tied to
    {
      x: 0.9,
      y: 0.7,
      z: TABLE,
      w: 0.28,
      d: 0.28,
      h: 1.7,
      tone: "faint" as const,
    },
    {
      x: 0.9,
      y: 3.4,
      z: TABLE,
      w: 0.28,
      d: 0.28,
      h: 1.7,
      tone: "faint" as const,
    },
    {
      x: 9.0,
      y: 0.7,
      z: TABLE,
      w: 0.28,
      d: 0.28,
      h: 1.7,
      tone: "faint" as const,
    },
    {
      x: 9.0,
      y: 3.4,
      z: TABLE,
      w: 0.28,
      d: 0.28,
      h: 1.7,
      tone: "faint" as const,
    },
  ];

  const lines: { d: string; tone: Tone; width?: number }[] = [];
  const tie = (from: Vec3, to: Vec3) =>
    lines.push({ d: line(from, to), tone: "ink" as const });

  // the net: from each post top down to the pot's rim
  tie(
    { x: 1.04, y: 0.84, z: TABLE + 1.7 },
    { x: potX, y: potY, z: TABLE + potH },
  );
  tie(
    { x: 1.04, y: 3.54, z: TABLE + 1.7 },
    { x: potX, y: potY, z: TABLE + potH },
  );
  tie(
    { x: 9.14, y: 0.84, z: TABLE + 1.7 },
    { x: potX + potW, y: potY, z: TABLE + potH },
  );
  tie(
    { x: 9.14, y: 3.54, z: TABLE + 1.7 },
    { x: potX + potW, y: potY + potD, z: TABLE + potH },
  );

  if (settled) {
    // the net pulled taut across the pot, and the payout beside it
    tie(
      { x: potX, y: potY, z: TABLE + potH },
      { x: potX + potW, y: potY + potD, z: TABLE + potH },
    );
    tie(
      { x: potX + potW, y: potY, z: TABLE + potH },
      { x: potX, y: potY + potD, z: TABLE + potH },
    );
    boxes.push({
      x: 7.2,
      y: 1.7,
      z: TABLE,
      w: 1.5,
      d: 1.2,
      h: 0.3,
      tone: "you",
      solid: true,
    });
  }

  return { boxes, lines };
};

const NET: PlateDefinition = {
  id: "net",
  number: 4,
  name: "The Net",
  mark: "net",
  caption:
    "Nobody has to be the hero. The contract holds the pot and settles it on agreed terms.",
  href: "/play",
  hrefLabel: "See it settle on-chain",
  steps: [
    {
      id: "",
      parts: [
        {
          id: "settle",
          label: "Settle the pot",
          hint: "the pot in the middle",
          at: { x: 5.1, y: 2.4, z: TABLE + 1.5 },
        },
      ],
      scene: netStep(false),
      lines: [
        { label: "THE POT SITS IN THE CONTRACT", value: "YES" },
        { label: "A TRUSTED MIDDLEMAN", value: "NOT NEEDED" },
        { label: "SETTLEMENT", value: "WAITING", total: true },
      ],
    },
    {
      id: "settle",
      parts: [],
      scene: netStep(true),
      lines: [
        { label: "THE POT SITS IN THE CONTRACT", value: "YES" },
        { label: "A TRUSTED MIDDLEMAN", value: "NOT NEEDED" },
        { label: "SETTLEMENT", value: "DONE ON-CHAIN", total: true },
      ],
    },
  ],
};

/* ----------------------------------------------------------------------------
 * Fig 5 — The Pass. Prove you belong without saying who you are.
 * -------------------------------------------------------------------------- */

const passStep = (shown: boolean, replayed: boolean): PlateScene => {
  const boxes: Box[] = [
    {
      x: 0,
      y: 0,
      z: 0,
      w: 10.4,
      d: 6.2,
      h: TABLE,
      tone: "faint" as const,
      solid: true,
    },
    {
      x: 2.2,
      y: 1.0,
      z: TABLE,
      w: 5.0,
      d: 1.9,
      h: 0.12,
      tone: shown ? ("you" as const) : ("faint" as const),
      solid: true,
    },
  ];

  if (shown) {
    // the punch: a hole in the ticket
    boxes.push({
      x: 6.1,
      y: 1.7,
      z: TABLE + 0.12,
      w: 0.5,
      d: 0.5,
      h: 0.02,
      tone: "void",
      solid: true,
    });
  }

  if (replayed) {
    // the same pass, offered again in the same context
    boxes.push({
      x: 2.2,
      y: 3.9,
      z: TABLE,
      w: 5.0,
      d: 1.9,
      h: 0.12,
      tone: "faint",
      solid: true,
    });
  }

  const lines: { d: string; tone: Tone; width?: number }[] = [];
  if (replayed) {
    lines.push({
      d: line(
        { x: 2.2, y: 3.9, z: TABLE + 0.2 },
        { x: 7.2, y: 5.8, z: TABLE + 0.2 },
      ),
      tone: "partner" as const,
      width: 2,
    });
  }

  return { boxes, lines };
};

const PASS: PlateDefinition = {
  id: "pass",
  number: 5,
  name: "The Pass",
  mark: "pass",
  caption:
    "Prove you belong without saying who you are — and spend the proof only once in a context.",
  href: "/play",
  hrefLabel: "See it live",
  steps: [
    {
      id: "",
      parts: [
        {
          id: "show",
          label: "Show the pass",
          hint: "the ticket on the counter",
          at: { x: 4.7, y: 1.95, z: TABLE + 0.6 },
        },
      ],
      scene: passStep(false, false),
      lines: [
        { label: "ON THE LIST", value: "NOT YET SHOWN" },
        { label: "IDENTITY SHARED", value: "NO" },
        {
          label: "A SECOND USE IN THIS CONTEXT",
          value: "POSSIBLE",
          total: true,
        },
      ],
    },
    {
      id: "show",
      parts: [
        {
          id: "again",
          label: "Show it a second time",
          hint: "the same ticket",
          at: { x: 4.7, y: 1.95, z: TABLE + 0.6 },
        },
      ],
      scene: passStep(true, false),
      lines: [
        { label: "ON THE LIST", value: "YES" },
        { label: "WHICH ENTRY", value: "HIDDEN" },
        { label: "IDENTITY SHARED", value: "NO" },
        {
          label: "A SECOND USE IN THIS CONTEXT",
          value: "BLOCKED",
          total: true,
        },
      ],
    },
    {
      id: "again",
      parts: [],
      scene: passStep(true, true),
      lines: [
        { label: "ON THE LIST", value: "YES" },
        { label: "WHICH ENTRY", value: "HIDDEN" },
        {
          label: "A SECOND USE IN THIS CONTEXT",
          value: "BLOCKED",
          total: true,
        },
      ],
    },
  ],
};

/* ----------------------------------------------------------------------------
 * Fig 6 — The Record. The one the product is being built around.
 * -------------------------------------------------------------------------- */

const LEAF = { x: 0.9, y: 2.3, z: 0.3 };
const ROOT = { x: 4.4, y: 2.3, z: 2.7 };

/** The second tree's space, so the drawing never resizes between steps. */
const SECOND_TREE = [
  { x: 8.2, y: 2.3, z: 2.7, w: 1.2, d: 1.2, h: 0.4 },
  { x: 7.0, y: 2.4, z: 1.3, w: 0.9, d: 0.9, h: 0.3 },
  { x: 9.4, y: 2.4, z: 1.3, w: 0.9, d: 0.9, h: 0.3 },
];

const recordStep = (claimed: boolean, secondIssuer: boolean): PlateScene => {
  const boxes: Box[] = [
    {
      x: 0,
      y: 0,
      z: 0,
      w: 10.4,
      d: 4.6,
      h: TABLE,
      tone: "faint" as const,
      solid: true,
    },
    // the holder's leaf — inked only once the claim is made
    {
      x: LEAF.x,
      y: LEAF.y,
      z: LEAF.z,
      w: 0.9,
      d: 0.9,
      h: 0.26,
      tone: claimed ? ("you" as const) : ("faint" as const),
      solid: true,
    },
    // its sibling
    {
      x: 2.6,
      y: 2.4,
      z: 0.3,
      w: 0.9,
      d: 0.9,
      h: 0.26,
      tone: "faint" as const,
      solid: true,
    },
    // the other half of the tree
    {
      x: 6.6,
      y: 2.4,
      z: 1.3,
      w: 0.9,
      d: 0.9,
      h: 0.26,
      tone: "faint" as const,
      solid: true,
    },
    {
      x: 5.2,
      y: 2.4,
      z: 0.3,
      w: 0.9,
      d: 0.9,
      h: 0.26,
      tone: "faint" as const,
      solid: true,
    },
    // the root
    {
      x: ROOT.x,
      y: ROOT.y,
      z: ROOT.z,
      w: 1.2,
      d: 1.2,
      h: 0.4,
      tone: "ink" as const,
      solid: true,
    },
  ];

  const lines: { d: string; tone: Tone; width?: number }[] = [];
  const edge = (from: Vec3, to: Vec3) =>
    lines.push({ d: line(from, to), tone: "faint" as const });

  edge({ x: 1.35, y: 2.75, z: 0.56 }, { x: 3.05, y: 2.85, z: 1.56 });
  edge({ x: 3.05, y: 2.85, z: 1.56 }, { x: 5.0, y: 2.9, z: 2.7 });
  edge({ x: 7.05, y: 2.85, z: 1.56 }, { x: 5.0, y: 2.9, z: 2.7 });
  edge({ x: 5.65, y: 2.85, z: 0.56 }, { x: 7.05, y: 2.85, z: 1.56 });

  if (claimed) {
    // the path the proof carries, inked
    lines.push({
      d: line({ x: 1.35, y: 2.75, z: 0.56 }, { x: 3.05, y: 2.85, z: 1.56 }),
      tone: "you",
      width: 2,
    });
    lines.push({
      d: line({ x: 3.05, y: 2.85, z: 1.56 }, { x: 5.0, y: 2.9, z: 2.7 }),
      tone: "you",
      width: 2,
    });
  }

  if (secondIssuer) {
    // a second tree, a different issuer, the same holder
    boxes.push(
      {
        x: SECOND_TREE[0].x,
        y: SECOND_TREE[0].y,
        z: SECOND_TREE[0].z,
        w: SECOND_TREE[0].w,
        d: SECOND_TREE[0].d,
        h: SECOND_TREE[0].h,
        tone: "ink",
        solid: true,
      },
      {
        x: SECOND_TREE[1].x,
        y: SECOND_TREE[1].y,
        z: SECOND_TREE[1].z,
        w: SECOND_TREE[1].w,
        d: SECOND_TREE[1].d,
        h: SECOND_TREE[1].h,
        tone: "faint",
        solid: true,
      },
      {
        x: SECOND_TREE[2].x,
        y: SECOND_TREE[2].y,
        z: SECOND_TREE[2].z,
        w: SECOND_TREE[2].w,
        d: SECOND_TREE[2].d,
        h: SECOND_TREE[2].h,
        tone: "you",
        solid: true,
      },
    );
  }

  return { boxes, lines };
};

const RECORD: PlateDefinition = {
  id: "record",
  number: 6,
  name: "The Record",
  mark: "record",
  caption:
    "The primitive the product is made of: a track record proved without publishing it, and minted per issuer.",
  stamps: [STAMPS.illustrative, STAMPS.building],
  steps: [
    {
      id: "",
      parts: [
        {
          id: "claim",
          label: "Make the claim",
          hint: "the leaf on the left",
          at: { x: 1.35, y: 2.75, z: 0.9 },
        },
      ],
      scene: recordStep(false, false),
      lines: [
        { label: "THE TREE", value: "ON-CHAIN" },
        { label: "THE HOLDER'S LEAF", value: "HIDDEN" },
        { label: "THE PROOF", value: "NOT YET MADE", total: true },
      ],
    },
    {
      id: "claim",
      parts: [
        {
          id: "issuer",
          label: "Show a second issuer",
          hint: "the root at the top",
          at: { x: 5.0, y: 2.9, z: ROOT.z + 0.6 },
        },
      ],
      scene: recordStep(true, false),
      lines: [
        { label: "THE PROOF", value: "AT LEAST 90% OF 200 DEALS KEPT" },
        { label: "IDENTITY SHARED", value: "NO" },
        { label: "WHICH DEALS", value: "NOT SHARED" },
        {
          label: "A SECOND USE IN THIS CONTEXT",
          value: "BLOCKED",
          total: true,
        },
      ],
    },
    {
      id: "issuer",
      parts: [],
      scene: recordStep(true, true),
      lines: [
        { label: "ISSUER", value: "acme.rental" },
        { label: "THE SAME HOLDER", value: "A SECOND TREE" },
        { label: "OUR CONTRACT", value: "UNCHANGED", total: true },
      ],
    },
  ],
};

/* -------------------------------------------------------------------------- */

export const STORY_PLATE = DESK;

export const GALLERY_PLATES: readonly PlateDefinition[] = [
  SEAL,
  HANDSHAKE,
  NET,
  PASS,
  RECORD,
];

export const ALL_PLATES: readonly PlateDefinition[] = [DESK, ...GALLERY_PLATES];
