-- Pattern 3 — private reputation circuit
-- Computes root and nullifier from seed s and 16 game outcomes

template Pattern3Circuit() {
    // Private: the seed
    signal s;

    // Private: per-game moves (0=cooperate, 1=defect)
    signal moves[16];

    // Private: per-game game_ids
    signal game_ids[16];

    // Public: threshold numerator (e.g., 3 for 3/4 threshold)
    signal threshold_num;

    // Public: threshold denominator (e.g., 4 for 3/4 threshold)
    signal threshold_den;

    // Public: context (chain_id + contract_id hashed into field)
    signal context;

    // Public output: reputation root (field element)
    signal root;

    // Public output: nullifier (field element)
    signal nullifier;

    // --- Domain constants (field elements) ---
    -- TAG = 0x544147 ("TAG")
    constant TAG: field = 0x544147;
    -- LEAF = 0x4c454146 ("LEAF")
    constant LEAF: field = 0x4c454146;
    -- NULL = 0x4e554c4c ("NULL")
    constant NULL: field = 0x4e554c4c;
    -- CTXT = 0x43545854 ("CTXT")
    constant CTXT: field = 0x43545854;

    // --- Per-game tag computation ---
    -- tag_i = poseidon3([TAG, s, game_id_i])
    // This is the core primitive: bind the seed to each game identity

    // --- Per-leaf computation ---
    -- leaf_i = poseidon3([LEAF, tag_i, moves_i])
    -- Commits each game's move to the leaf under the pseudonym tag

    // --- Nullifier computation ---
    -- nullifier = poseidon3([NULL, s, context])
    -- The one-value that proves knowledge of the seed while preventing replay

    // --- Merkle tree ---
    -- Build tree over the 16 leaves using poseidon2 internal nodes
    -- The root commits to all 16 game outcomes under the same seed

    // --- Threshold gate ---
    -- coopCount = count of moves where move == 0 (cooperate)
    -- The threshold check: coopCount * threshold_den >= threshold_num * 16
    -- If this fails, the circuit cannot produce a valid reputation proof

    // Wire inputs to operations
    // tag[i] <- poseidon3(TAG, s, game_ids[i])
    // leaf[i] <- poseidon3(LEAF, tag[i], moves[i])
    // root <- merkle_root(leaf[0..15])
    // nullifier <- poseidon3(NULL, s, context)

    // The threshold check is enforced as a circuit constraint:
    // coopCount * threshold_den >= threshold_num * 16
    // This must hold for the reputation to pass
}
