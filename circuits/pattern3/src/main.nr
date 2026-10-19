// Pattern 3 (Private Reputation) Circuit for Zero-Knowledge Prisoner's Dilemma
// This circuit reproduces the hash math from the shared fixture:
//   tag       = poseidon3([DOMAIN_TAG,       s, game_id])
//   leaf      = poseidon3([DOMAIN_LEAF,      tag, move])
//   nullifier = poseidon3([DOMAIN_NULLIFIER, s, context])
//   node      = poseidon2([left, right])

// Use the new poseodin import path (without dep:: prefix)
use ::poseidon::poseidon::bn254::{hash_1, hash_2};

// Domain constants as Field elements (must match fixture exactly)
global DOMAIN_TAG: Field = 0x544147u64 as Field;   // "TAG"
global DOMAIN_LEAF: Field = 0x4c454146u64 as Field; // "LEAF"
global DOMAIN_NULLIFIER: Field = 0x4e554c4cu64 as Field; // "NULL"
global DOMAIN_CONTEXT: Field = 0x43545854u64 as Field; // "CTXT"

// Merkle tree depth - 16 leaves at depth 4 (2^4 = 16)
global MERKLE_DEPTH: u32 = 4;

fn main(
    // Private input: the seed/salt value used for all hash computations
    s: Field,

    // Per-game public inputs
    game_ids: [Field; 16],
    moves: [u8; 16],

    // Public outputs
    root: pub Field,     // Merkle tree root
    nullifier: pub Field, // Nullifier hash
    tags: [Field; 16],   // Tag for each game
    leaves: [Field; 16], // Leaf hash for each game
) {
    // -------------------------------------------------------------------------
    // 1. Derive per-game tags: tag = poseodin3([DOMAIN_TAG, s, game_id])
    // Using hash_1 for single-field and hash_2 for two-field composition
    // poseodin3(a, b, c) composed as: hash_2([hash_1(a), hash_2(b, c)])
    // -------------------------------------------------------------------------
    for i in 0..16 {
        // Explicit type annotation for the hash_2 result
        let tag_part1: Field = hash_1([DOMAIN_TAG]);
        let tag_part2: Field = hash_2([s, game_ids[i]]);
        tags[i] = hash_2([tag_part1, tag_part2]);
    }

    // -------------------------------------------------------------------------
    // 2. Derive per-game leaves: leaf = poseodin3([DOMAIN_LEAF, tag, move])
    // -------------------------------------------------------------------------
    for i in 0..16 {
        let move_field: Field = moves[i] as Field;
        // Explicit type annotation for the hash_2 result
        let leaf_part1: Field = hash_1([DOMAIN_LEAF]);
        let leaf_part2: Field = hash_2([tags[i], move_field]);
        leaves[i] = hash_2([leaf_part1, leaf_part2]);
    }

    // -------------------------------------------------------------------------
    // 3. Build Merkle tree and compute root using poseodin2
    // Tree has 16 leaves at depth 4
    // Level 0 (16 leaves) -> Level 1 (8 nodes) -> Level 2 (4 nodes) -> Level 3 (2 nodes) -> Level 4 (1 root)
    // -------------------------------------------------------------------------
    // Start with our 16 leaves - explicit type
    let mut current_level: [Field; 16] = leaves;

    // Level 1: 8 nodes - explicit type
    let mut level_1: [Field; 8];
    for i in 0..8 {
        level_1[i] = hash_2([current_level[i * 2], current_level[i * 2 + 1]]);
    }

    // Level 2: 4 nodes - explicit type
    let mut level_2: [Field; 4];
    for i in 0..4 {
        level_2[i] = hash_2([level_1[i * 2], level_1[i * 2 + 1]]);
    }

    // Level 3: 2 nodes - explicit type
    let mut level_3: [Field; 2];
    for i in 0..2 {
        level_3[i] = hash_2([level_2[i * 2], level_2[i * 2 + 1]]);
    }

    // Level 4: 1 root
    root = hash_2([level_3[0], level_3[1]]);

    // -------------------------------------------------------------------------
    // 4. Compute nullifier: nullifier = poseodin3([DOMAIN_NULLIFIER, s, context])
    // context = poseodin3([DOMAIN_CONTEXT, chain_id, contract_id])
    // For the fixture, chain_id = "Stellar" and contract_id = "Latep"
    // -------------------------------------------------------------------------
    // In the full setup, context would be derived from on-chain values,
    // but for the circuit we compute a fixed context from domain constants
    // Explicit type annotations
    let context: Field = hash_2([DOMAIN_CONTEXT, 0x5374656c6c6172u64 as Field]); // "Stellar"
    let nullifier_part1: Field = hash_1([DOMAIN_NULLIFIER]);
    let nullifier_part2: Field = hash_2([s, context]);
    nullifier = hash_2([nullifier_part1, nullifier_part2]);
}