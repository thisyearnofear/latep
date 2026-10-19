// Shared fixture for Pattern 3 (private reputation).
//
// This is the cross-stack contract for the hash math, written before the
// circuit exists. The Noir/Compact circuit, the Soroban contract, and the
// TypeScript client must all reproduce these values exactly:
//
//   tag       = poseidon3([DOMAIN_TAG,       s, game_id])
//   leaf      = poseidon3([DOMAIN_LEAF,      tag, move])
//   nullifier = poseidon3([DOMAIN_NULLIFIER, s, context])
//   node      = poseidon2([left, right])
//
//   npm run check:pattern3-vectors        # verify the checked-in fixture
//   node scripts/check-pattern3-vectors.cjs --write   # regenerate it
//
// The fixture is generated from a fixed seed and move list, so a diff means
// either the hash parameters changed or someone edited the JSON by hand. Both
// are worth stopping for.

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { poseidon1, poseidon2, poseidon3 } = require("poseidon-lite");

const FIELD =
  21888242871839275222246405745257275088548364400416034343698204186575808495617n;

// ASCII domain constants. The exact values are part of the fixture.
const DOMAIN_TAG = 0x544147n; // "TAG"
const DOMAIN_LEAF = 0x4c454146n; // "LEAF"
const DOMAIN_NULLIFIER = 0x4e554c4cn; // "NULL"
const DOMAIN_CONTEXT = 0x43545854n; // "CTXT"

// Fixture inputs. The chain/contract values stand in for the real deployment;
// the client must derive them from the deployed contract, not hard-code these.
const SEED = 0x0a1b2c3d4e5f60718293a4b5c6d7e8f00112233445566778899aabbccddeeffn;
const CHAIN_ID = 0x5374656c6c6172n; // "Stellar"
const CONTRACT_ID = 0x4c61746570n; // "Latep"

const DEPTH = 16;
const N = 16;
const EMPTY_LEAF = 0n;
const TREE_LEAVES = 1 << DEPTH;

const GAME_IDS = Array.from({ length: N }, (_, i) => 1001 + i);
const LEAF_INDICES = [
  0, 17, 42, 99, 123, 257, 511, 1023, 2047, 4095, 8191, 16383, 32767, 40000,
  50000, 65535,
];

const FIXTURE_PATH = path.join(
  __dirname,
  "..",
  "test-vectors",
  "pattern3.json",
);

function modField(value) {
  const reduced = value % FIELD;
  return reduced < 0n ? reduced + FIELD : reduced;
}

const context = poseidon3([DOMAIN_CONTEXT, CHAIN_ID, CONTRACT_ID]);

function deriveLeaf(s, gameId, move) {
  const tag = poseidon3([DOMAIN_TAG, s, BigInt(gameId)]);
  const leaf = poseidon3([DOMAIN_LEAF, tag, BigInt(move)]);
  return { tag, leaf };
}

function buildTree(entries) {
  const leaves = new Array(TREE_LEAVES).fill(EMPTY_LEAF);
  for (const { leafIndex, leaf } of entries) leaves[leafIndex] = leaf;

  const levels = [leaves];
  let level = leaves;
  while (level.length > 1) {
    const next = new Array(level.length / 2);
    for (let i = 0; i < level.length; i += 2) {
      next[i / 2] = poseidon2([level[i], level[i + 1]]);
    }
    levels.push(next);
    level = next;
  }
  return { root: levels[DEPTH][0], levels };
}

function pathFor(levels, leafIndex) {
  const merklePath = [];
  const pathIndices = [];
  let index = leafIndex;
  for (let depth = 0; depth < DEPTH; depth++) {
    merklePath.push(levels[depth][index ^ 1]);
    pathIndices.push(index & 1);
    index = Math.floor(index / 2);
  }
  return { merklePath, pathIndices };
}

function makeCase({ name, moves, threshold, note }) {
  const games = GAME_IDS.map((gameId, i) => ({
    gameId,
    move: moves[i],
    leafIndex: LEAF_INDICES[i],
  }));

  const derived = games.map(({ gameId, move }) =>
    deriveLeaf(SEED, gameId, move),
  );
  const tree = buildTree(
    games.map((game, i) => ({
      leafIndex: game.leafIndex,
      leaf: derived[i].leaf,
    })),
  );

  const coopCount = moves.filter((move) => move === 1).length;
  const shouldPass =
    BigInt(coopCount) * BigInt(threshold.den) >=
    BigInt(threshold.num) * BigInt(N);

  return {
    name,
    note,
    threshold,
    coopCount,
    shouldPass,
    games,
    tags: games.map((game, i) =>
      deriveLeaf(SEED, game.gameId, game.move).tag.toString(),
    ),
    leaves: derived.map(({ leaf }) => leaf.toString()),
    root: tree.root.toString(),
    nullifier: poseidon3([DOMAIN_NULLIFIER, SEED, context]).toString(),
    paths: games.map((game) => {
      const { merklePath, pathIndices } = pathFor(tree.levels, game.leafIndex);
      return {
        path: merklePath.map(String),
        indices: pathIndices,
      };
    }),
  };
}

function buildFixture() {
  return {
    version: 1,
    description:
      "Pattern 3 shared fixture. Recompute with poseidon-lite (BN254) and compare every value before changing a circuit or contract.",
    curve: "bn254",
    hash: "Poseidon (noir-lang/poseidon bn254; poseidon-lite parity)",
    domains: {
      tag: DOMAIN_TAG.toString(),
      leaf: DOMAIN_LEAF.toString(),
      nullifier: DOMAIN_NULLIFIER.toString(),
      context: DOMAIN_CONTEXT.toString(),
    },
    tree: {
      depth: DEPTH,
      leaves: TREE_LEAVES,
      emptyLeaf: EMPTY_LEAF.toString(),
      internalNode: "poseidon2([left, right])",
    },
    seed: `0x${SEED.toString(16).padStart(64, "0")}`,
    context: context.toString(),
    cases: [
      makeCase({
        name: "pass-12-of-16",
        moves: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0],
        threshold: { num: 3, den: 4 },
        note: "75% cooperation against a 3/4 threshold; equality passes.",
      }),
      makeCase({
        name: "fail-11-of-16",
        moves: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0],
        threshold: { num: 3, den: 4 },
        note: "68.75% cooperation against 3/4; the circuit must reject.",
      }),
    ],
  };
}

function compare(actual, expected, where) {
  assert.deepStrictEqual(actual, expected, `mismatch at ${where}`);
}

function verify(fixture) {
  assert.equal(fixture.version, 1, "fixture version");
  assert.equal(fixture.curve, "bn254", "curve");
  assert.equal(fixture.tree.depth, DEPTH, "tree depth");
  assert.equal(fixture.tree.leaves, TREE_LEAVES, "tree leaves");
  assert.equal(fixture.tree.emptyLeaf, EMPTY_LEAF.toString(), "empty leaf");

  const seed = BigInt(fixture.seed);
  assert.ok(seed > 0n && seed < FIELD, "seed is in the field");
  assert.equal(context.toString(), fixture.context, "context derivation");
  assert.equal(
    poseidon3([DOMAIN_NULLIFIER, seed, context]).toString(),
    fixture.cases[0].nullifier,
    "nullifier is shared across cases",
  );

  const summary = [];
  for (const testCase of fixture.cases) {
    assert.equal(testCase.games.length, N, `${testCase.name}: N games`);
    assert.equal(testCase.tags.length, N, `${testCase.name}: N tags`);
    assert.equal(testCase.leaves.length, N, `${testCase.name}: N leaves`);
    assert.equal(testCase.paths.length, N, `${testCase.name}: N paths`);

    const derived = testCase.games.map(({ gameId, move }) =>
      deriveLeaf(seed, gameId, move),
    );
    compare(
      derived.map(({ tag }) => tag.toString()),
      testCase.tags,
      `${testCase.name}: tags`,
    );
    compare(
      derived.map(({ leaf }) => leaf.toString()),
      testCase.leaves,
      `${testCase.name}: leaves`,
    );

    const tree = buildTree(
      testCase.games.map((game, i) => ({
        leafIndex: game.leafIndex,
        leaf: derived[i].leaf,
      })),
    );
    assert.equal(tree.root.toString(), testCase.root, `${testCase.name}: root`);

    for (let i = 0; i < N; i++) {
      const { merklePath, pathIndices } = pathFor(
        tree.levels,
        testCase.games[i].leafIndex,
      );
      compare(
        merklePath.map(String),
        testCase.paths[i].path,
        `${testCase.name}: path ${i}`,
      );
      compare(
        pathIndices,
        testCase.paths[i].indices,
        `${testCase.name}: indices ${i}`,
      );
    }

    const coopCount = testCase.games.filter((game) => game.move === 1).length;
    assert.equal(coopCount, testCase.coopCount, `${testCase.name}: coop count`);
    const thresholdPass =
      BigInt(coopCount) * BigInt(testCase.threshold.den) >=
      BigInt(testCase.threshold.num) * BigInt(N);
    assert.equal(
      thresholdPass,
      testCase.shouldPass,
      `${testCase.name}: threshold ${testCase.threshold.num}/${testCase.threshold.den}`,
    );
    summary.push(
      `${testCase.name}: ${coopCount}/${N} vs ${testCase.threshold.num}/${testCase.threshold.den} — ${
        testCase.shouldPass ? "passes" : "rejects (expected)"
      }`,
    );
  }

  console.log(
    `pattern3 vectors: ${fixture.cases.length} cases, ${N} leaves, depth ${DEPTH} — ok`,
  );
  for (const line of summary) console.log(`  ${line}`);
}

const write = process.argv.includes("--write");
if (write) {
  fs.mkdirSync(path.dirname(FIXTURE_PATH), { recursive: true });
  fs.writeFileSync(
    FIXTURE_PATH,
    `${JSON.stringify(buildFixture(), null, 2)}\n`,
  );
  console.log(
    `pattern3 vectors: wrote ${path.relative(process.cwd(), FIXTURE_PATH)}`,
  );
} else {
  if (!fs.existsSync(FIXTURE_PATH)) {
    console.error(
      `pattern3 vectors: missing ${path.relative(process.cwd(), FIXTURE_PATH)}\n` +
        "  Run: node scripts/check-pattern3-vectors.cjs --write",
    );
    process.exit(1);
  }
  const fixture = JSON.parse(fs.readFileSync(FIXTURE_PATH, "utf8"));
  verify(fixture);
}
