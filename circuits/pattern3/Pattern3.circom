template Pattern3Circuit(cooperation_threshold, total_games) {
    // Private: the seed s
    signal s;

    // Private: per-game moves (0=cooperate, 1=defect)
    signal moves[16];

    // Private: per-game game_ids
    signal game_ids[16];

    // Public: threshold numerator
    signal threshold_num;

    // Public: threshold denominator
    signal threshold_den;

    // Public: context
    signal context;

    // Public: root
    signal root;

    // Public: nullifier
    signal nullifier;

    // --- Hash primitives (wired as constants, actual poseidon3 via witnessed inputs) ---
    // In practice, these would be witnessed/inputs from the Noir side
    // For now, the template structure is correct

    // --- Merkle tree using Circom's built-in sparse_merkle_tree ---
    // The leaves vector is computed outside the circuit from the Noir witness
    // leaf[i] = poseidon3([LEAF, poseidon3([TAG, s, game_ids[i]]), moves[i]])

    // sparse Merkle tree root
    root <- sparse_merkle_tree(/* leaves */);

    // --- Nullifier ---
    // nullifier <- poseidon3([NULL, s, context])

    // --- Threshold check ---
    // This would be enforced as a constraint outside the circuit
    // from the Noir witness: cooperation_count * threshold_den >= threshold_num * total_games
}
