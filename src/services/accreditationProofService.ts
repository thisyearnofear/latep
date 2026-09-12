/**
 * Accreditation Proof Service
 *
 * Generates real ZK proofs for the allowlist_membership Noir circuit using
 * @noir-lang/noir_js (witness generation) and @aztec/bb.js (UltraHonk proof
 * generation).
 *
 * The circuit proves: "I know a credential_id whose Poseidon hash is a leaf
 * in a Merkle tree with the public root, and here is my nullifier" -- without
 * revealing which leaf is mine.
 *
 * This is the private accreditation pattern: the contract verifies the proof
 * on-chain, checks the root matches its stored accredited root, and records
 * the nullifier to prevent replay.
 */

import { poseidon2 } from "poseidon-lite";
import {
  ACCREDITED_CREDENTIALS,
  MERKLE_ROOT_DEC,
  type AccreditedCredential,
} from "../util/merkleTree";
import { withTimeout } from "../util/withTimeout";

export interface AccreditationProofInputs {
  credentialId: string;
  merklePath: string[];
  pathIndices: number[];
  gameId: number;
}

export interface AccreditationProofOutput {
  proof: Uint8Array; // 14,592-byte UltraHonk proof
  merkleRoot: Uint8Array; // 32-byte big-endian Field
  nullifier: Uint8Array; // 32-byte big-endian Field
}

// Heavy modules are shared with the move-commitment proof service.
// They are loaded lazily on first proof generation.
let noirModule: typeof import("@noir-lang/noir_js") | null = null;
let bbModule: typeof import("@aztec/bb.js") | null = null;
let backendInstance: import("@aztec/bb.js").UltraHonkBackend | null = null;
let noirInstance: import("@noir-lang/noir_js").Noir | null = null;
let circuitCache: import("@noir-lang/noir_js").CompiledCircuit | null = null;

/**
 * Load the compiled allowlist_membership Noir circuit from the public directory.
 */
async function loadCircuit(): Promise<
  import("@noir-lang/noir_js").CompiledCircuit
> {
  if (circuitCache) return circuitCache;

  const response = await fetch("/circuits/allowlist_membership.json");
  if (!response.ok) {
    throw new Error(
      `Failed to load accreditation circuit: ${response.status} ${response.statusText}`,
    );
  }
  const circuit =
    (await response.json()) as import("@noir-lang/noir_js").CompiledCircuit;
  circuitCache = circuit;
  return circuit;
}

async function getNoir() {
  if (!noirModule) {
    noirModule = await import("@noir-lang/noir_js");
  }
  if (!noirInstance) {
    const circuit = await loadCircuit();
    noirInstance = new noirModule.Noir(circuit);
  }
  return noirInstance;
}

async function getBackend() {
  if (!bbModule) {
    bbModule = await import("@aztec/bb.js");
  }
  if (!backendInstance) {
    const circuit = await loadCircuit();
    backendInstance = new bbModule.UltraHonkBackend(circuit.bytecode);
  }
  return backendInstance;
}

/**
 * Convert a decimal string to a 32-byte big-endian Uint8Array.
 */
function decimalToBytes32(decimal: string): Uint8Array {
  const value = BigInt(decimal);
  const bytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    bytes[31 - i] = Number((value >> BigInt(i * 8)) & BigInt(0xff));
  }
  return bytes;
}

/**
 * Generate a real ZK proof for allowlist membership.
 *
 * The proof proves:
 *   1. The credential_id's Poseidon hash is a leaf in the Merkle tree
 *   2. The computed root matches the public merkle_root
 *   3. The nullifier = poseidon(credential_id, game_id) matches
 *
 * The proof does NOT reveal which leaf is the player's.
 */
export async function generateAccreditationProof(
  inputs: AccreditationProofInputs,
): Promise<AccreditationProofOutput> {
  // The nullifier is a public input: poseidon(credential_id, game_id).
  // The circuit recomputes it and asserts equality, so we must supply the
  // correct value. poseidon-lite's BN254 Poseidon matches noir-lang/poseidon's
  // hash_2 (verified against the circuit's test vectors).

  // Prepare circuit inputs
  const circuitInputs = {
    credential_id: inputs.credentialId,
    merkle_path: inputs.merklePath,
    path_indices: inputs.pathIndices,
    merkle_root: MERKLE_ROOT_DEC,
    nullifier: computeNullifier(inputs.credentialId, inputs.gameId),
    game_id: inputs.gameId.toString(),
  };

  // Generate witness
  const noir = await getNoir();
  const { witness } = await withTimeout(
    noir.execute(circuitInputs),
    "Witness generation",
  );

  // Generate UltraHonk proof with keccak oracle hash (non-ZK flavor),
  // matching the on-chain verifier.
  const backend = await getBackend();
  const { proof } = await withTimeout(
    backend.generateProof(witness, { keccak: true }),
    "Proof generation",
  );

  return {
    proof: new Uint8Array(proof),
    merkleRoot: decimalToBytes32(MERKLE_ROOT_DEC),
    nullifier: decimalToBytes32(circuitInputs.nullifier),
  };
}

/**
 * Compute the nullifier = poseidon(credential_id, game_id) for any game_id.
 * Uses poseidon-lite's BN254 Poseidon, which produces identical outputs to
 * noir-lang/poseidon's hash_2.
 */
function computeNullifier(credentialId: string, gameId: number): string {
  return poseidon2([BigInt(credentialId), BigInt(gameId)]).toString();
}

/**
 * Get the accreditation credential for a given index (0-based).
 * Used by the demo UI to let the player select which credential to use.
 */
export function getCredential(index: number): AccreditedCredential | null {
  return ACCREDITED_CREDENTIALS[index] ?? null;
}

/**
 * Get all available accreditation credentials.
 */
export function getAllCredentials(): AccreditedCredential[] {
  return ACCREDITED_CREDENTIALS;
}
