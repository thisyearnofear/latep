#!/usr/bin/env node
/**
 * Two-wallet end-to-end proof against the deployed testnet contract.
 *
 * Funds two fresh accounts via friendbot, generates REAL Noir/bb.js proofs
 * in-process (same circuit, same keccak flavor the browser uses), and drives
 * create_game -> join_game -> reveal_move x2 -> resolve_game from two
 * different signers. Prints tx hashes for Stellar Expert.
 *
 * Run: node scripts/e2e-testnet.mjs [--stake 1]
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  rpc,
  Keypair,
  TransactionBuilder,
  Networks,
  nativeToScVal,
  scValToNative,
  Operation,
  xdr,
} from "@stellar/stellar-sdk";
import { keccak_256 } from "@noble/hashes/sha3.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const RPC_URL = "https://soroban-testnet.stellar.org";
const HORIZON_URL = "https://horizon-testnet.stellar.org";
const FRIENDBOT = "https://friendbot.stellar.org";
const CONTRACT_ID =
  process.env.VITE_ZK_DILEMMA_CONTRACT_ID ||
  "CCYHIUOAUWFCWA5RV34UPT4SEXJFNE3SITGFR5HM2BL2K2RFOSGECE4P";
const STAKE_XLM = Number(
  process.env.STAKE_XLM ||
    process.argv.find((a, i) => process.argv[i - 1] === "--stake") ||
    1,
);

const log = (...a) => console.log(...a);
const bigReplacer = (_k, v) => (typeof v === "bigint" ? v.toString() : v);
const server = new rpc.Server(RPC_URL, { allowHttp: false });

// ---------------------------------------------------------------------------
// Commitment + proof (mirrors src/services/noirProofService.ts exactly)
// ---------------------------------------------------------------------------

function computeCommitment(move, nonce, gameId) {
  const bytes = new Uint8Array(17);
  bytes[0] = move;
  const nonceBuf = new Uint8Array(8);
  for (let i = 0; i < 8; i++)
    nonceBuf[7 - i] = Number((nonce >> BigInt(i * 8)) & 0xffn);
  bytes.set(nonceBuf, 1);
  const gidBuf = new Uint8Array(8);
  const gid = BigInt(gameId);
  for (let i = 0; i < 8; i++)
    gidBuf[7 - i] = Number((gid >> BigInt(i * 8)) & 0xffn);
  bytes.set(gidBuf, 9);
  return keccak_256(bytes);
}

function bytes16ToDecimal(bytes) {
  let r = 0n;
  for (const b of bytes) r = r * 256n + BigInt(b);
  return r.toString();
}

function randomNonce() {
  const buf = new Uint8Array(8);
  crypto.getRandomValues(buf);
  let n = 0n;
  for (const b of buf) n = (n << 8n) | BigInt(b);
  return n;
}

const circuit = JSON.parse(
  readFileSync(resolve(ROOT, "public/circuits/move_commitment.json"), "utf8"),
);
const { Noir } = await import("@noir-lang/noir_js");
const { UltraHonkBackend } = await import("@aztec/bb.js");
const noir = new Noir(circuit);
const backend = new UltraHonkBackend(circuit.bytecode);

async function generateProof(move, nonce, gameId) {
  const commitment = computeCommitment(move, nonce, gameId);
  const inputs = {
    move: move.toString(),
    nonce: nonce.toString(),
    commitment_high: bytes16ToDecimal(commitment.slice(0, 16)),
    commitment_low: bytes16ToDecimal(commitment.slice(16, 32)),
    game_id: gameId.toString(),
  };
  const { witness } = await noir.execute(inputs);
  const { proof } = await backend.generateProof(witness, { keccak: true });
  return { commitment, proof };
}

// ---------------------------------------------------------------------------
// Transaction plumbing
// ---------------------------------------------------------------------------

async function fund(kp) {
  const res = await fetch(`${FRIENDBOT}?addr=${kp.publicKey()}`);
  if (!res.ok && res.status !== 400) throw new Error(`friendbot ${res.status}`);
  const acc = await server.getAccount(kp.publicKey());
  return acc;
}

async function build(kp, fnName, args) {
  const account = await server.getAccount(kp.publicKey());
  return new TransactionBuilder(account, {
    fee: "100000",
    networkPassphrase: Networks.TESTNET,
  })
    .setTimeout(300)
    .addOperation(
      Operation.invokeContractFunction({
        contract: CONTRACT_ID,
        function: fnName,
        args,
      }),
    )
    .build();
}

/**
 * The contract pays winners more than the 2x-stake escrow holds
 * (CC pays 2+2=4x, CD pays 3x), so it needs a house reserve.
 * Contract accounts have no classic ledger entry, so top up via a
 * Soroban transfer on the native StellarAsset contract.
 */
const XLM_TOKEN = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC";

async function xlmBalanceOfScAddress(scAddr) {
  const account = await server.getAccount(A.publicKey());
  const tx = new TransactionBuilder(account, {
    fee: "100000",
    networkPassphrase: Networks.TESTNET,
  })
    .setTimeout(300)
    .addOperation(
      Operation.invokeContractFunction({
        contract: XLM_TOKEN,
        function: "balance",
        args: [scAddr],
      }),
    )
    .build();
  const sim = await server.simulateTransaction(tx);
  if (sim.error) throw new Error(`simulate balance: ${sim.error}`);
  const raw = sim.result.retval;
  const scVal = typeof raw === "string" ? xdr.ScVal.fromXDR(raw, "hex") : raw;
  return BigInt(scValToNative(scVal).toString());
}

async function ensureHouseReserve(kp, neededStroops) {
  const contractAddr = nativeToScVal(CONTRACT_ID, { type: "address" });
  const have = await xlmBalanceOfScAddress(contractAddr);
  if (have >= neededStroops) {
    log(`  house reserve OK: ${have / 10000000n} XLM on contract`);
    return;
  }
  const topUp = neededStroops - have;
  log(`  topping up house reserve: +${topUp / 10000000n} XLM → contract`);
  const account = await server.getAccount(kp.publicKey());
  const tx = new TransactionBuilder(account, {
    fee: "100000",
    networkPassphrase: Networks.TESTNET,
  })
    .setTimeout(300)
    .addOperation(
      Operation.invokeContractFunction({
        contract: XLM_TOKEN,
        function: "transfer",
        args: [
          nativeToScVal(kp.publicKey(), { type: "address" }),
          contractAddr,
          nativeToScVal(topUp, { type: "i128" }),
        ],
      }),
    )
    .build();
  const sim = await server.simulateTransaction(tx);
  if (sim.error) throw new Error(`simulate token transfer: ${sim.error}`);
  const prepared = rpc.assembleTransaction(tx, sim).build();
  prepared.sign(kp);
  const send = await server.sendTransaction(prepared);
  for (let i = 0; i < 60; i++) {
    const got = await server.getTransaction(send.hash);
    if (got.status === "SUCCESS") break;
    if (got.status === "FAILED")
      throw new Error(
        `house top-up FAILED: ${JSON.stringify(got.resultXdr?._attributes?.result)}`,
      );
    await new Promise((r) => setTimeout(r, 1000));
  }
  log(`  ✓ reserve topped up → ${send.hash}`);
}
async function view(kp, fnName, args) {
  const tx = await build(kp, fnName, args);
  const sim = await server.simulateTransaction(tx);
  if (sim.error) throw new Error(`simulate ${fnName}: ${sim.error}`);
  const raw = sim.result.retval;
  const scVal =
    typeof raw === "string"
      ? xdr.ScVal.fromXDR(
          raw,
          /^[0-9a-fA-F]+$/.test(raw) && raw.length % 2 === 0 ? "hex" : "base64",
        )
      : raw;
  return scValToNative(scVal);
}

/** Write: simulate, sign, submit, wait for confirmation. */
async function call(kp, fnName, args) {
  const tx = await build(kp, fnName, args);
  const sim = await server.simulateTransaction(tx);
  if (sim.error) throw new Error(`simulate ${fnName}: ${sim.error}`);
  if (sim.restorePricing)
    throw new Error(`${fnName} requires fee bump restore — unexpected`);
  const prepared = rpc.assembleTransaction(tx, sim).build();
  prepared.sign(kp);
  const send = await server.sendTransaction(prepared);
  if (send.status === "ERROR")
    throw new Error(`send ${fnName}: ${JSON.stringify(send)}`);
  for (let i = 0; i < 60; i++) {
    const got = await server.getTransaction(send.hash);
    if (got.status === "SUCCESS") {
      log(`  ✓ ${fnName} → ${send.hash}`);
      return { hash: send.hash };
    }
    if (got.status === "FAILED")
      throw new Error(`${fnName} FAILED: ${JSON.stringify(got)}`);
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`${fnName} timed out`);
}

// ---------------------------------------------------------------------------
// Main flow
// ---------------------------------------------------------------------------

log("Latep two-wallet ZK end-to-end — Stellar TESTNET");
log(`Contract: ${CONTRACT_ID}`);
log(`Stake: ${STAKE_XLM} XLM\n`);

const A = Keypair.random();
const B = Keypair.random();
log("[1/6] Funding two fresh accounts via friendbot…");
await fund(A);
await fund(B);
log(`  A: ${A.publicKey()}`);
log(`  B: ${B.publicKey()}`);

log("\n[1b/6] Checking contract house reserve (payouts exceed escrow)");
await ensureHouseReserve(A, BigInt(STAKE_XLM * 1e7 * 4 + 5 * 1e7));

const countBefore = Number(await view(A, "get_game_count", []));

const nonceA = randomNonce();
const moveA = 0; // Cooperate
const gameId = Number(countBefore) + 1;
log(
  `\n[2/6] Player A: generating real UltraHonk proof (keccak flavor) for game #${gameId}…`,
);
const pa = await generateProof(moveA, nonceA, gameId);
log(`  proof = ${pa.proof.length} bytes (expect 14592)`);
const createArgs = [
  nativeToScVal(A.publicKey(), { type: "address" }),
  nativeToScVal(pa.commitment, { type: "bytes" }),
  nativeToScVal(pa.proof, { type: "bytes" }),
  nativeToScVal(BigInt(STAKE_XLM * 1e7), { type: "i128" }),
];
// Simulate create to read the contract's real game id before submitting
const realGameId = Number(await view(A, "create_game", createArgs));
if (realGameId !== gameId)
  throw new Error(`game id drift: predicted ${gameId}, got ${realGameId}`);
const created = await call(A, "create_game", createArgs);

const nonceB = randomNonce();
const moveB = 1; // Defect
log(`\n[3/6] Player B: generating proof + joining game #${realGameId}…`);
const pb = await generateProof(moveB, nonceB, realGameId);
await call(B, "join_game", [
  nativeToScVal(B.publicKey(), { type: "address" }),
  nativeToScVal(realGameId, { type: "u64" }),
  nativeToScVal(pb.commitment, { type: "bytes" }),
  nativeToScVal(pb.proof, { type: "bytes" }),
]);

log(`\n[4/6] Reveals (A=C, B=D — the temptation case: B should win)`);
await call(A, "reveal_move", [
  nativeToScVal(A.publicKey(), { type: "address" }),
  nativeToScVal(realGameId, { type: "u64" }),
  nativeToScVal("C", { type: "symbol" }),
  nativeToScVal(nonceA, { type: "u64" }),
]);
await call(B, "reveal_move", [
  nativeToScVal(B.publicKey(), { type: "address" }),
  nativeToScVal(realGameId, { type: "u64" }),
  nativeToScVal("D", { type: "symbol" }),
  nativeToScVal(nonceB, { type: "u64" }),
]);

log(`\n[5/6] Resolving escrow`);
const gidArg = [nativeToScVal(realGameId, { type: "u64" })];
const payouts = await view(A, "resolve_game", gidArg);
log(`  predicted payouts (stroops): ${JSON.stringify(payouts, bigReplacer)}`);
const resolved = await call(A, "resolve_game", gidArg);

const g = await view(A, "get_game", gidArg);
log(`\n[6/6] Final on-chain game state:`);
log(JSON.stringify(g, bigReplacer, 2));

log(`\nRESULT: PASS — two independent wallets, real browser-flavor proofs,`);
log(`verified ON-CHAIN on testnet. Game #${realGameId}.`);
log(`A: https://stellar.expert/explorer/testnet/account/${A.publicKey()}`);
log(`B: https://stellar.expert/explorer/testnet/account/${B.publicKey()}`);
log(
  `Game tx from create: https://stellar.expert/explorer/testnet/tx/${created.hash}`,
);
process.exit(0);
