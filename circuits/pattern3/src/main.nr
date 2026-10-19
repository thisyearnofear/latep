// Pattern 3 (Private Reputation) Circuit for Zero-Knowledge Prisoner's Dilemma
//

use dep::poseidon::poseidon::bn254::{hash_1, hash_2};

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

    // Public outputs (computed within circuit)
    // These are visible to the TypeScript client via the proof
    root: Field,     // Merkle tree root
    nullifier: Field, // Nullifier hash
    tags: [Field; 16],   // Tag for each game
    leaves: [Field; 16], // Leaf hash for each game
) {
    // -------------------------------------------------------------------------
    // 1. Derive per-game tags: tag = poseodin3([DOMAIN_TAG, s, game_id])
    // Using hash_1 for single-field and hash_2 for two-field composition:
    //   poseodin3(a, b, c) = hash_2([hash_1(a), hash_2(b, c)])
    // -------------------------------------------------------------------------
    let mut tags_local: [Field; 16] = [0; 16];
    for i in 0..16 {
        let tag_part1: Field = hash_1([DOMAIN_TAG]);
        let tag_part2: Field = hash_2([s, game_ids[i]]);
        tags_local[i] = hash_2([tag_part1, tag_part2]);
    }

    // -------------------------------------------------------------------------
    // 2. Derive per-game leaves: leaf = poseodin3([DOMAIN_LEAF, tag, move])
    // -------------------------------------------------------------------------
    let mut leaves_local: [Field; 16] = [0; 16];
    for i in 0..16 {
        let move_field: Field = moves[i] as Field;
        let leaf_part1: Field = hash_1([DOMAIN_LEAF]);
        let leaf_part2: Field = hash_2([tags_local[i], move_field]);
        leaves_local[i] = hash_2([leaf_part1, leaf_part2]);
    }

    // -------------------------------------------------------------------------
    // 3. Build Merkle tree and compute root using poseodin2
    // Tree has 16 leaves at depth 4 (2^4 = 16)
    // Level 0 (16 leaves) -> Level 1 (8 nodes) -> Level 2 (4 nodes) ->
    //   Level 3 (2 nodes) -> Level 4 (1 root)
    // -------------------------------------------------------------------------
    // Level 1: 8 nodes - combine pairs of leaves
    let mut level_1: [Field; 8] = [0; 8];
    for i in 0..8 {
        level_1[i] = hash_2([leaves_local[i * 2], leaves_local[i * 2 + 1]]);
    }

    // Level 2: 4 nodes - combine pairs of level-1 nodes
    let mut level_2: [Field; 4] = [0; 4];
    for i in 0..4 {
        level_2[i] = hash_2([level_1[i * 2], level_1[i * 2 + 1]]);
    }

    // Level 3: 2 nodes - combine pairs of level-2 nodes
    let mut level_3: [Field; 2] = [0; 2];
    for i in 0..2 {
        level_3[i] = hash_2([level_2[i * 2], level_2[i * 2 + 1]]);
    }

    // Level 4: 1 root - combine the two level-3 nodes
    let root_local: Field = hash_2([level_3[0], level_3[1]]);

    // -------------------------------------------------------------------------
    // 4. Compute nullifier: nullifier = poseodin3([DOMAIN_NULLIFIER, s, context])
    // context = poseodin3([DOMAIN_CONTEXT, chain_id, contract_id])
    // chain_id = "Stellar", contract_id = "Latep"
    // -------------------------------------------------------------------------
    let chain_id: Field = 0x5374656c6c6172u64 as Field; // "Stellar"
    let contract_id: Field = 0x4c61746570u64 as Field; // "Latep"
    // Use intermediate variables for mutability
    let context_part1: Field = hash_1([DOMAIN_CONTEXT]);
    let context_part2: Field = hash_2([chain_id, contract_id]);
    let context: Field = hash_2([context_part1, context_part2]);
    // Use intermediate variables for mutability
    let nullifier_part1: Field = hash_1([DOMAIN_NULLIFIER]);
    let nullifier_part2: Field = hash_2([s, context]);
    let nullifier_local: Field = hash_2([nullifier_part1, nullifier_part2]);

    // Assign outputs
    root = root_local;
    nullifier = nullifier_local;
    tags = tags_local;
    leaves = leaves_local;
}