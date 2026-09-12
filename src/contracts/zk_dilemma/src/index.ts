import { Buffer } from "buffer";
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
  Result,
  Spec as ContractSpec,
} from "@stellar/stellar-sdk/contract";
import type {
  u32,
  u64,
  i128,
  Option,
} from "@stellar/stellar-sdk/contract";
export * from "@stellar/stellar-sdk";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";

if (typeof window !== "undefined") {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}





export interface Game {
  commit_deadline: u64;
  commitment1: Buffer;
  commitment2: Option<Buffer>;
  created_at: u64;
  /**
 * None for standalone games, Some(match_id) for match rounds
 */
match_id: Option<u64>;
  move1: Option<string>;
  move2: Option<string>;
  nonce1: Option<u64>;
  nonce2: Option<u64>;
  player1: string;
  player2: Option<string>;
  reveal_deadline: u64;
  /**
 * 0 for standalone games, 1-indexed for match rounds
 */
round_number: u32;
  stake: i128;
  status: GameStatus;
}


export interface Match {
  /**
 * Best-of setting (3 or 5)
 */
best_of: u32;
  created_at: u64;
  /**
 * Game ID of the current round
 */
current_game_id: u64;
  /**
 * Current round number (1-indexed)
 */
current_round: u32;
  /**
 * Deadline for the next round to start (when in AwaitingNextRound)
 */
next_round_deadline: u64;
  /**
 * Player 1 round wins
 */
p1_wins: u32;
  /**
 * Player 2 round wins
 */
p2_wins: u32;
  player1: string;
  player2: Option<string>;
  /**
 * Stake per round (in stroops)
 */
stake: i128;
  status: MatchStatus;
  /**
 * Number of wins needed to take the match (ceil(best_of / 2))
 */
target_wins: u32;
  /**
 * Tied rounds
 */
ties: u32;
}

export type GameStatus = {tag: "AwaitingPlayer2", values: void} | {tag: "BothCommitted", values: void} | {tag: "Resolved", values: void} | {tag: "Forfeited", values: void} | {tag: "Cancelled", values: void};

export type MatchStatus = {tag: "AwaitingJoin", values: void} | {tag: "InProgress", values: void} | {tag: "AwaitingNextRound", values: void} | {tag: "Completed", values: void} | {tag: "Cancelled", values: void};

export const Errors = {
  1: {message:"GameNotFound"},
  2: {message:"GameAlreadyFull"},
  3: {message:"GameAlreadyJoined"},
  4: {message:"GameAlreadyResolved"},
  5: {message:"GameNotReady"},
  6: {message:"GameExpired"},
  7: {message:"NotYourGame"},
  8: {message:"MoveAlreadyRevealed"},
  9: {message:"InvalidMove"},
  10: {message:"InvalidStake"},
  11: {message:"CommitmentMismatch"},
  12: {message:"ProofVerificationFailed"},
  13: {message:"ProofTooLong"},
  14: {message:"InvalidPublicInputs"},
  15: {message:"VKNotInitialized"},
  16: {message:"Unauthorized"},
  17: {message:"AlreadyRevealed"},
  18: {message:"NotYourTurn"},
  19: {message:"InsufficientBalance"},
  20: {message:"TransferFailed"},
  21: {message:"TokenClientError"},
  22: {message:"DeadlineNotPassed"},
  23: {message:"BothRevealed"},
  24: {message:"MatchNotFound"},
  25: {message:"MatchNotInProgress"},
  26: {message:"MatchAlreadyComplete"},
  27: {message:"NotInMatch"},
  28: {message:"RoundNotReady"},
  29: {message:"InvalidBestOf"},
  30: {message:"WrongOpponent"},
  31: {message:"MatchRoundMismatch"},
  32: {message:"AccreditationNotInitialized"},
  33: {message:"RootMismatch"},
  34: {message:"NullifierAlreadyUsed"},
  35: {message:"InvalidRoot"},
  36: {message:"AccreditationAdminMismatch"}
}

export interface Client {
  /**
   * Construct and simulate a get_vk transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_vk: (options?: MethodOptions) => Promise<AssembledTransaction<Option<Buffer>>>

  /**
   * Construct and simulate a rematch transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Rematch: create a new match with the same opponent and settings.
   * 
   * Either player from the completed match can call this. The caller
   * becomes player 1 of the new match. Returns (new_match_id, game_id).
   */
  rematch: ({player, old_match_id, commitment, proof}: {player: string, old_match_id: u64, commitment: Buffer, proof: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<Result<readonly [u64, u64]>>>

  /**
   * Construct and simulate a get_game transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_game: ({game_id}: {game_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Option<Game>>>

  /**
   * Construct and simulate a get_match transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_match: ({match_id}: {match_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Option<Match>>>

  /**
   * Construct and simulate a join_game transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Join an existing game with a ZK-committed move.
   * 
   * Player 2 submits commitment + proof. The proof is verified against the
   * commitment and the game_id. Stake is deposited into escrow.
   */
  join_game: ({player2, game_id, commitment, proof}: {player2: string, game_id: u64, commitment: Buffer, proof: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a initialize transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Initialize the contract with the Noir UltraHonk verification key
   * and the XLM token contract address.
   */
  initialize: ({vk_bytes, xlm_token}: {vk_bytes: Buffer, xlm_token: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a join_match transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Join a match by joining its first round.
   * 
   * Player 2 submits their first-round commitment + proof + stake.
   */
  join_match: ({player2, match_id, commitment, proof}: {player2: string, match_id: u64, commitment: Buffer, proof: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a cancel_game transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Cancel a game that no one joined and reclaim the stake.
   * 
   * Player 1 can call this after the commit deadline passes if no opponent
   * joined. The full stake is returned. This prevents funds from being
   * locked forever in games that never start.
   */
  cancel_game: ({player1, game_id}: {player1: string, game_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a create_game transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Create a new game with a ZK-committed move.
   * 
   * Player 1 submits commitment (32-byte keccak256 hash) + ZK proof + stake.
   * The proof is verified on-chain against the commitment and the new game_id,
   * guaranteeing the commitment is to a valid move (0 or 1) with a known
   * preimage. The stake is deposited into escrow.
   */
  create_game: ({player1, commitment, proof, stake}: {player1: string, commitment: Buffer, proof: Buffer, stake: i128}, options?: MethodOptions) => Promise<AssembledTransaction<Result<u64>>>

  /**
   * Construct and simulate a reveal_move transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Reveal a player's move and nonce.
   * 
   * Verifies keccak256(move || nonce || game_id) matches the stored commitment.
   * This re-derives the same hash the ZK proof guaranteed at commit time,
   * confirming the revealed move is the one that was committed.
   */
  reveal_move: ({player, game_id, move_, nonce}: {player: string, game_id: u64, move_: string, nonce: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a cancel_match transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Cancel a match that is awaiting a join (player 1 only, after timeout).
   */
  cancel_match: ({player1, match_id}: {player1: string, match_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a claim_refund transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Claim a refund when both players failed to reveal.
   * 
   * If the reveal deadline passes and neither player revealed, anyone can
   * call this to split the escrow equally and return both stakes. This
   * prevents funds from being locked when both players go offline.
   */
  claim_refund: ({game_id}: {game_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a create_match transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Create a new multi-round match.
   * 
   * Player 1 submits their first-round commitment + proof + stake.
   * `best_of` must be 3 or 5. The match creates its first round game
   * immediately. Returns (match_id, game_id).
   */
  create_match: ({player1, commitment, proof, stake, best_of}: {player1: string, commitment: Buffer, proof: Buffer, stake: i128, best_of: u32}, options?: MethodOptions) => Promise<AssembledTransaction<Result<readonly [u64, u64]>>>

  /**
   * Construct and simulate a resolve_game transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Resolve the game after both players have revealed.
   * 
   * Calculates payoffs and transfers XLM from contract escrow to players.
   * Anyone can call after both reveals are complete.
   * If the game is part of a match, updates the match score and may
   * transition the match to AwaitingNextRound or Completed.
   */
  resolve_game: ({game_id}: {game_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<readonly [i128, i128]>>>

  /**
   * Construct and simulate a claim_forfeit transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Claim forfeit if the opponent didn't reveal in time.
   * 
   * A player who revealed before the deadline can claim the full escrow
   * (both stakes) after the deadline passes.
   */
  claim_forfeit: ({claimant, game_id}: {claimant: string, game_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a get_game_count transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_game_count: (options?: MethodOptions) => Promise<AssembledTransaction<u64>>

  /**
   * Construct and simulate a get_match_count transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_match_count: (options?: MethodOptions) => Promise<AssembledTransaction<u64>>

  /**
   * Construct and simulate a join_next_round transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Join the next round of a match (called by player 2).
   * 
   * After player 1 starts the next round, player 2 joins it.
   */
  join_next_round: ({player2, match_id, commitment, proof}: {player2: string, match_id: u64, commitment: Buffer, proof: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a start_next_round transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Start the next round of a match (called by player 1).
   * 
   * After a round resolves and the match is not yet complete, player 1
   * commits to the next round. Creates a new game linked to the match.
   */
  start_next_round: ({player1, match_id, commitment, proof}: {player1: string, match_id: u64, commitment: Buffer, proof: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<Result<u64>>>

  /**
   * Construct and simulate a get_accredited_root transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Query the current accredited Merkle root.
   */
  get_accredited_root: (options?: MethodOptions) => Promise<AssembledTransaction<Option<Buffer>>>

  /**
   * Construct and simulate a cancel_match_timeout transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Cancel a match when the next round hasn't started in time.
   * Either player can call after the next_round_deadline passes.
   */
  cancel_match_timeout: ({player, match_id}: {player: string, match_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a verify_accreditation transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Verify a player's ZK accreditation proof.
   * 
   * The player submits an UltraHonk proof that their credential_id is a
   * leaf in the Merkle tree with the stored root, without revealing which
   * leaf. The nullifier (poseidon(credential_id, game_id)) prevents the
   * same credential from being used twice for the same game.
   * 
   * On success, the nullifier is recorded and an event is emitted. The
   * player is now "accredited" for game_id -- the off-chain indexer or
   * frontend can use this event to gate access to accredited-only games.
   */
  verify_accreditation: ({player, proof, merkle_root, nullifier, game_id}: {player: string, proof: Buffer, merkle_root: Buffer, nullifier: Buffer, game_id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a update_accredited_root transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Update the accredited Merkle root. Only the admin can call this.
   */
  update_accredited_root: ({admin, merkle_root}: {admin: string, merkle_root: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a initialize_accreditation transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Initialize the accreditation system with a separate UltraHonk VK
   * (for the allowlist_membership Noir circuit), a Merkle root of
   * accredited participants, and an admin who can update the root.
   * 
   * This is a separate VK from the move-commitment VK because the
   * allowlist circuit is a different Noir program with different public
   * inputs.
   */
  initialize_accreditation: ({admin, vk_bytes, merkle_root}: {admin: string, vk_bytes: Buffer, merkle_root: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a is_accreditation_initialized transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Query whether accreditation has been initialized.
   */
  is_accreditation_initialized: (options?: MethodOptions) => Promise<AssembledTransaction<boolean>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions &
      Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
      }
  ): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy(null, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAAAQAAAAAAAAAAAAAABEdhbWUAAAAPAAAAAAAAAA9jb21taXRfZGVhZGxpbmUAAAAABgAAAAAAAAALY29tbWl0bWVudDEAAAAADgAAAAAAAAALY29tbWl0bWVudDIAAAAD6AAAAA4AAAAAAAAACmNyZWF0ZWRfYXQAAAAAAAYAAAA6Tm9uZSBmb3Igc3RhbmRhbG9uZSBnYW1lcywgU29tZShtYXRjaF9pZCkgZm9yIG1hdGNoIHJvdW5kcwAAAAAACG1hdGNoX2lkAAAD6AAAAAYAAAAAAAAABW1vdmUxAAAAAAAD6AAAABEAAAAAAAAABW1vdmUyAAAAAAAD6AAAABEAAAAAAAAABm5vbmNlMQAAAAAD6AAAAAYAAAAAAAAABm5vbmNlMgAAAAAD6AAAAAYAAAAAAAAAB3BsYXllcjEAAAAAEwAAAAAAAAAHcGxheWVyMgAAAAPoAAAAEwAAAAAAAAAPcmV2ZWFsX2RlYWRsaW5lAAAAAAYAAAAyMCBmb3Igc3RhbmRhbG9uZSBnYW1lcywgMS1pbmRleGVkIGZvciBtYXRjaCByb3VuZHMAAAAAAAxyb3VuZF9udW1iZXIAAAAEAAAAAAAAAAVzdGFrZQAAAAAAAAsAAAAAAAAABnN0YXR1cwAAAAAH0AAAAApHYW1lU3RhdHVzAAA=",
        "AAAAAQAAAAAAAAAAAAAABU1hdGNoAAAAAAAADQAAABhCZXN0LW9mIHNldHRpbmcgKDMgb3IgNSkAAAAHYmVzdF9vZgAAAAAEAAAAAAAAAApjcmVhdGVkX2F0AAAAAAAGAAAAHEdhbWUgSUQgb2YgdGhlIGN1cnJlbnQgcm91bmQAAAAPY3VycmVudF9nYW1lX2lkAAAAAAYAAAAgQ3VycmVudCByb3VuZCBudW1iZXIgKDEtaW5kZXhlZCkAAAANY3VycmVudF9yb3VuZAAAAAAAAAQAAABARGVhZGxpbmUgZm9yIHRoZSBuZXh0IHJvdW5kIHRvIHN0YXJ0ICh3aGVuIGluIEF3YWl0aW5nTmV4dFJvdW5kKQAAABNuZXh0X3JvdW5kX2RlYWRsaW5lAAAAAAYAAAATUGxheWVyIDEgcm91bmQgd2lucwAAAAAHcDFfd2lucwAAAAAEAAAAE1BsYXllciAyIHJvdW5kIHdpbnMAAAAAB3AyX3dpbnMAAAAABAAAAAAAAAAHcGxheWVyMQAAAAATAAAAAAAAAAdwbGF5ZXIyAAAAA+gAAAATAAAAHFN0YWtlIHBlciByb3VuZCAoaW4gc3Ryb29wcykAAAAFc3Rha2UAAAAAAAALAAAAAAAAAAZzdGF0dXMAAAAAB9AAAAALTWF0Y2hTdGF0dXMAAAAAO051bWJlciBvZiB3aW5zIG5lZWRlZCB0byB0YWtlIHRoZSBtYXRjaCAoY2VpbChiZXN0X29mIC8gMikpAAAAAAt0YXJnZXRfd2lucwAAAAAEAAAAC1RpZWQgcm91bmRzAAAAAAR0aWVzAAAABA==",
        "AAAAAgAAAAAAAAAAAAAACkdhbWVTdGF0dXMAAAAAAAUAAAAAAAAAAAAAAA9Bd2FpdGluZ1BsYXllcjIAAAAAAAAAAAAAAAANQm90aENvbW1pdHRlZAAAAAAAAAAAAAAAAAAACFJlc29sdmVkAAAAAAAAAAAAAAAJRm9yZmVpdGVkAAAAAAAAAAAAAAAAAAAJQ2FuY2VsbGVkAAAA",
        "AAAAAgAAAAAAAAAAAAAAC01hdGNoU3RhdHVzAAAAAAUAAAAAAAAALlBsYXllciAxIGNyZWF0ZWQsIHdhaXRpbmcgZm9yIHBsYXllciAyIHRvIGpvaW4AAAAAAAxBd2FpdGluZ0pvaW4AAAAAAAAAJ0JvdGggcGxheWVycyBqb2luZWQsIHJvdW5kcyBpbiBwcm9ncmVzcwAAAAAKSW5Qcm9ncmVzcwAAAAAAAAAAADRXYWl0aW5nIGZvciBib3RoIHBsYXllcnMgdG8gY29tbWl0IHRvIHRoZSBuZXh0IHJvdW5kAAAAEUF3YWl0aW5nTmV4dFJvdW5kAAAAAAAAAAAAABVTb21lb25lIHdvbiB0aGUgbWF0Y2gAAAAAAAAJQ29tcGxldGVkAAAAAAAAAAAAACpNYXRjaCBjYW5jZWxsZWQgKHRpbWVvdXQgb3IgbWFudWFsIGNhbmNlbCkAAAAAAAlDYW5jZWxsZWQAAAA=",
        "AAAAAAAAAAAAAAAGZ2V0X3ZrAAAAAAAAAAAAAQAAA+gAAAAO",
        "AAAAAAAAAMZSZW1hdGNoOiBjcmVhdGUgYSBuZXcgbWF0Y2ggd2l0aCB0aGUgc2FtZSBvcHBvbmVudCBhbmQgc2V0dGluZ3MuCgpFaXRoZXIgcGxheWVyIGZyb20gdGhlIGNvbXBsZXRlZCBtYXRjaCBjYW4gY2FsbCB0aGlzLiBUaGUgY2FsbGVyCmJlY29tZXMgcGxheWVyIDEgb2YgdGhlIG5ldyBtYXRjaC4gUmV0dXJucyAobmV3X21hdGNoX2lkLCBnYW1lX2lkKS4AAAAAAAdyZW1hdGNoAAAAAAQAAAAAAAAABnBsYXllcgAAAAAAEwAAAAAAAAAMb2xkX21hdGNoX2lkAAAABgAAAAAAAAAKY29tbWl0bWVudAAAAAAADgAAAAAAAAAFcHJvb2YAAAAAAAAOAAAAAQAAA+kAAAPtAAAAAgAAAAYAAAAGAAAAAw==",
        "AAAAAAAAAAAAAAAIZ2V0X2dhbWUAAAABAAAAAAAAAAdnYW1lX2lkAAAAAAYAAAABAAAD6AAAB9AAAAAER2FtZQ==",
        "AAAAAAAAAAAAAAAJZ2V0X21hdGNoAAAAAAAAAQAAAAAAAAAIbWF0Y2hfaWQAAAAGAAAAAQAAA+gAAAfQAAAABU1hdGNoAAAA",
        "AAAAAAAAALNKb2luIGFuIGV4aXN0aW5nIGdhbWUgd2l0aCBhIFpLLWNvbW1pdHRlZCBtb3ZlLgoKUGxheWVyIDIgc3VibWl0cyBjb21taXRtZW50ICsgcHJvb2YuIFRoZSBwcm9vZiBpcyB2ZXJpZmllZCBhZ2FpbnN0IHRoZQpjb21taXRtZW50IGFuZCB0aGUgZ2FtZV9pZC4gU3Rha2UgaXMgZGVwb3NpdGVkIGludG8gZXNjcm93LgAAAAAJam9pbl9nYW1lAAAAAAAABAAAAAAAAAAHcGxheWVyMgAAAAATAAAAAAAAAAdnYW1lX2lkAAAAAAYAAAAAAAAACmNvbW1pdG1lbnQAAAAAAA4AAAAAAAAABXByb29mAAAAAAAADgAAAAEAAAPpAAAAAgAAAAM=",
        "AAAAAAAAAGRJbml0aWFsaXplIHRoZSBjb250cmFjdCB3aXRoIHRoZSBOb2lyIFVsdHJhSG9uayB2ZXJpZmljYXRpb24ga2V5CmFuZCB0aGUgWExNIHRva2VuIGNvbnRyYWN0IGFkZHJlc3MuAAAACmluaXRpYWxpemUAAAAAAAIAAAAAAAAACHZrX2J5dGVzAAAADgAAAAAAAAAJeGxtX3Rva2VuAAAAAAAAEwAAAAA=",
        "AAAAAAAAAGhKb2luIGEgbWF0Y2ggYnkgam9pbmluZyBpdHMgZmlyc3Qgcm91bmQuCgpQbGF5ZXIgMiBzdWJtaXRzIHRoZWlyIGZpcnN0LXJvdW5kIGNvbW1pdG1lbnQgKyBwcm9vZiArIHN0YWtlLgAAAApqb2luX21hdGNoAAAAAAAEAAAAAAAAAAdwbGF5ZXIyAAAAABMAAAAAAAAACG1hdGNoX2lkAAAABgAAAAAAAAAKY29tbWl0bWVudAAAAAAADgAAAAAAAAAFcHJvb2YAAAAAAAAOAAAAAQAAA+kAAAACAAAAAw==",
        "AAAAAAAAAOxDYW5jZWwgYSBnYW1lIHRoYXQgbm8gb25lIGpvaW5lZCBhbmQgcmVjbGFpbSB0aGUgc3Rha2UuCgpQbGF5ZXIgMSBjYW4gY2FsbCB0aGlzIGFmdGVyIHRoZSBjb21taXQgZGVhZGxpbmUgcGFzc2VzIGlmIG5vIG9wcG9uZW50CmpvaW5lZC4gVGhlIGZ1bGwgc3Rha2UgaXMgcmV0dXJuZWQuIFRoaXMgcHJldmVudHMgZnVuZHMgZnJvbSBiZWluZwpsb2NrZWQgZm9yZXZlciBpbiBnYW1lcyB0aGF0IG5ldmVyIHN0YXJ0LgAAAAtjYW5jZWxfZ2FtZQAAAAACAAAAAAAAAAdwbGF5ZXIxAAAAABMAAAAAAAAAB2dhbWVfaWQAAAAABgAAAAEAAAPpAAAAAgAAAAM=",
        "AAAAAAAAATNDcmVhdGUgYSBuZXcgZ2FtZSB3aXRoIGEgWkstY29tbWl0dGVkIG1vdmUuCgpQbGF5ZXIgMSBzdWJtaXRzIGNvbW1pdG1lbnQgKDMyLWJ5dGUga2VjY2FrMjU2IGhhc2gpICsgWksgcHJvb2YgKyBzdGFrZS4KVGhlIHByb29mIGlzIHZlcmlmaWVkIG9uLWNoYWluIGFnYWluc3QgdGhlIGNvbW1pdG1lbnQgYW5kIHRoZSBuZXcgZ2FtZV9pZCwKZ3VhcmFudGVlaW5nIHRoZSBjb21taXRtZW50IGlzIHRvIGEgdmFsaWQgbW92ZSAoMCBvciAxKSB3aXRoIGEga25vd24KcHJlaW1hZ2UuIFRoZSBzdGFrZSBpcyBkZXBvc2l0ZWQgaW50byBlc2Nyb3cuAAAAAAtjcmVhdGVfZ2FtZQAAAAAEAAAAAAAAAAdwbGF5ZXIxAAAAABMAAAAAAAAACmNvbW1pdG1lbnQAAAAAAA4AAAAAAAAABXByb29mAAAAAAAADgAAAAAAAAAFc3Rha2UAAAAAAAALAAAAAQAAA+kAAAAGAAAAAw==",
        "AAAAAAAAAPBSZXZlYWwgYSBwbGF5ZXIncyBtb3ZlIGFuZCBub25jZS4KClZlcmlmaWVzIGtlY2NhazI1Nihtb3ZlIHx8IG5vbmNlIHx8IGdhbWVfaWQpIG1hdGNoZXMgdGhlIHN0b3JlZCBjb21taXRtZW50LgpUaGlzIHJlLWRlcml2ZXMgdGhlIHNhbWUgaGFzaCB0aGUgWksgcHJvb2YgZ3VhcmFudGVlZCBhdCBjb21taXQgdGltZSwKY29uZmlybWluZyB0aGUgcmV2ZWFsZWQgbW92ZSBpcyB0aGUgb25lIHRoYXQgd2FzIGNvbW1pdHRlZC4AAAALcmV2ZWFsX21vdmUAAAAABAAAAAAAAAAGcGxheWVyAAAAAAATAAAAAAAAAAdnYW1lX2lkAAAAAAYAAAAAAAAABW1vdmVfAAAAAAAAEQAAAAAAAAAFbm9uY2UAAAAAAAAGAAAAAQAAA+kAAAACAAAAAw==",
        "AAAAAAAAAEZDYW5jZWwgYSBtYXRjaCB0aGF0IGlzIGF3YWl0aW5nIGEgam9pbiAocGxheWVyIDEgb25seSwgYWZ0ZXIgdGltZW91dCkuAAAAAAAMY2FuY2VsX21hdGNoAAAAAgAAAAAAAAAHcGxheWVyMQAAAAATAAAAAAAAAAhtYXRjaF9pZAAAAAYAAAABAAAD6QAAAAIAAAAD",
        "AAAAAAAAAPtDbGFpbSBhIHJlZnVuZCB3aGVuIGJvdGggcGxheWVycyBmYWlsZWQgdG8gcmV2ZWFsLgoKSWYgdGhlIHJldmVhbCBkZWFkbGluZSBwYXNzZXMgYW5kIG5laXRoZXIgcGxheWVyIHJldmVhbGVkLCBhbnlvbmUgY2FuCmNhbGwgdGhpcyB0byBzcGxpdCB0aGUgZXNjcm93IGVxdWFsbHkgYW5kIHJldHVybiBib3RoIHN0YWtlcy4gVGhpcwpwcmV2ZW50cyBmdW5kcyBmcm9tIGJlaW5nIGxvY2tlZCB3aGVuIGJvdGggcGxheWVycyBnbyBvZmZsaW5lLgAAAAAMY2xhaW1fcmVmdW5kAAAAAQAAAAAAAAAHZ2FtZV9pZAAAAAAGAAAAAQAAA+kAAAACAAAAAw==",
        "AAAAAAAAAMpDcmVhdGUgYSBuZXcgbXVsdGktcm91bmQgbWF0Y2guCgpQbGF5ZXIgMSBzdWJtaXRzIHRoZWlyIGZpcnN0LXJvdW5kIGNvbW1pdG1lbnQgKyBwcm9vZiArIHN0YWtlLgpgYmVzdF9vZmAgbXVzdCBiZSAzIG9yIDUuIFRoZSBtYXRjaCBjcmVhdGVzIGl0cyBmaXJzdCByb3VuZCBnYW1lCmltbWVkaWF0ZWx5LiBSZXR1cm5zIChtYXRjaF9pZCwgZ2FtZV9pZCkuAAAAAAAMY3JlYXRlX21hdGNoAAAABQAAAAAAAAAHcGxheWVyMQAAAAATAAAAAAAAAApjb21taXRtZW50AAAAAAAOAAAAAAAAAAVwcm9vZgAAAAAAAA4AAAAAAAAABXN0YWtlAAAAAAAACwAAAAAAAAAHYmVzdF9vZgAAAAAEAAAAAQAAA+kAAAPtAAAAAgAAAAYAAAAGAAAAAw==",
        "AAAAAAAAASJSZXNvbHZlIHRoZSBnYW1lIGFmdGVyIGJvdGggcGxheWVycyBoYXZlIHJldmVhbGVkLgoKQ2FsY3VsYXRlcyBwYXlvZmZzIGFuZCB0cmFuc2ZlcnMgWExNIGZyb20gY29udHJhY3QgZXNjcm93IHRvIHBsYXllcnMuCkFueW9uZSBjYW4gY2FsbCBhZnRlciBib3RoIHJldmVhbHMgYXJlIGNvbXBsZXRlLgpJZiB0aGUgZ2FtZSBpcyBwYXJ0IG9mIGEgbWF0Y2gsIHVwZGF0ZXMgdGhlIG1hdGNoIHNjb3JlIGFuZCBtYXkKdHJhbnNpdGlvbiB0aGUgbWF0Y2ggdG8gQXdhaXRpbmdOZXh0Um91bmQgb3IgQ29tcGxldGVkLgAAAAAADHJlc29sdmVfZ2FtZQAAAAEAAAAAAAAAB2dhbWVfaWQAAAAABgAAAAEAAAPpAAAD7QAAAAIAAAALAAAACwAAAAM=",
        "AAAAAAAAAKJDbGFpbSBmb3JmZWl0IGlmIHRoZSBvcHBvbmVudCBkaWRuJ3QgcmV2ZWFsIGluIHRpbWUuCgpBIHBsYXllciB3aG8gcmV2ZWFsZWQgYmVmb3JlIHRoZSBkZWFkbGluZSBjYW4gY2xhaW0gdGhlIGZ1bGwgZXNjcm93Cihib3RoIHN0YWtlcykgYWZ0ZXIgdGhlIGRlYWRsaW5lIHBhc3Nlcy4AAAAAAA1jbGFpbV9mb3JmZWl0AAAAAAAAAgAAAAAAAAAIY2xhaW1hbnQAAAATAAAAAAAAAAdnYW1lX2lkAAAAAAYAAAABAAAD6QAAAAIAAAAD",
        "AAAAAAAAAAAAAAAOZ2V0X2dhbWVfY291bnQAAAAAAAAAAAABAAAABg==",
        "AAAAAAAAAAAAAAAPZ2V0X21hdGNoX2NvdW50AAAAAAAAAAABAAAABg==",
        "AAAAAAAAAG5Kb2luIHRoZSBuZXh0IHJvdW5kIG9mIGEgbWF0Y2ggKGNhbGxlZCBieSBwbGF5ZXIgMikuCgpBZnRlciBwbGF5ZXIgMSBzdGFydHMgdGhlIG5leHQgcm91bmQsIHBsYXllciAyIGpvaW5zIGl0LgAAAAAAD2pvaW5fbmV4dF9yb3VuZAAAAAAEAAAAAAAAAAdwbGF5ZXIyAAAAABMAAAAAAAAACG1hdGNoX2lkAAAABgAAAAAAAAAKY29tbWl0bWVudAAAAAAADgAAAAAAAAAFcHJvb2YAAAAAAAAOAAAAAQAAA+kAAAACAAAAAw==",
        "AAAAAAAAALxTdGFydCB0aGUgbmV4dCByb3VuZCBvZiBhIG1hdGNoIChjYWxsZWQgYnkgcGxheWVyIDEpLgoKQWZ0ZXIgYSByb3VuZCByZXNvbHZlcyBhbmQgdGhlIG1hdGNoIGlzIG5vdCB5ZXQgY29tcGxldGUsIHBsYXllciAxCmNvbW1pdHMgdG8gdGhlIG5leHQgcm91bmQuIENyZWF0ZXMgYSBuZXcgZ2FtZSBsaW5rZWQgdG8gdGhlIG1hdGNoLgAAABBzdGFydF9uZXh0X3JvdW5kAAAABAAAAAAAAAAHcGxheWVyMQAAAAATAAAAAAAAAAhtYXRjaF9pZAAAAAYAAAAAAAAACmNvbW1pdG1lbnQAAAAAAA4AAAAAAAAABXByb29mAAAAAAAADgAAAAEAAAPpAAAABgAAAAM=",
        "AAAAAAAAAClRdWVyeSB0aGUgY3VycmVudCBhY2NyZWRpdGVkIE1lcmtsZSByb290LgAAAAAAABNnZXRfYWNjcmVkaXRlZF9yb290AAAAAAAAAAABAAAD6AAAAA4=",
        "AAAAAAAAAHdDYW5jZWwgYSBtYXRjaCB3aGVuIHRoZSBuZXh0IHJvdW5kIGhhc24ndCBzdGFydGVkIGluIHRpbWUuCkVpdGhlciBwbGF5ZXIgY2FuIGNhbGwgYWZ0ZXIgdGhlIG5leHRfcm91bmRfZGVhZGxpbmUgcGFzc2VzLgAAAAAUY2FuY2VsX21hdGNoX3RpbWVvdXQAAAACAAAAAAAAAAZwbGF5ZXIAAAAAABMAAAAAAAAACG1hdGNoX2lkAAAABgAAAAEAAAPpAAAAAgAAAAM=",
        "AAAAAAAAAf1WZXJpZnkgYSBwbGF5ZXIncyBaSyBhY2NyZWRpdGF0aW9uIHByb29mLgoKVGhlIHBsYXllciBzdWJtaXRzIGFuIFVsdHJhSG9uayBwcm9vZiB0aGF0IHRoZWlyIGNyZWRlbnRpYWxfaWQgaXMgYQpsZWFmIGluIHRoZSBNZXJrbGUgdHJlZSB3aXRoIHRoZSBzdG9yZWQgcm9vdCwgd2l0aG91dCByZXZlYWxpbmcgd2hpY2gKbGVhZi4gVGhlIG51bGxpZmllciAocG9zZWlkb24oY3JlZGVudGlhbF9pZCwgZ2FtZV9pZCkpIHByZXZlbnRzIHRoZQpzYW1lIGNyZWRlbnRpYWwgZnJvbSBiZWluZyB1c2VkIHR3aWNlIGZvciB0aGUgc2FtZSBnYW1lLgoKT24gc3VjY2VzcywgdGhlIG51bGxpZmllciBpcyByZWNvcmRlZCBhbmQgYW4gZXZlbnQgaXMgZW1pdHRlZC4gVGhlCnBsYXllciBpcyBub3cgImFjY3JlZGl0ZWQiIGZvciBnYW1lX2lkIC0tIHRoZSBvZmYtY2hhaW4gaW5kZXhlciBvcgpmcm9udGVuZCBjYW4gdXNlIHRoaXMgZXZlbnQgdG8gZ2F0ZSBhY2Nlc3MgdG8gYWNjcmVkaXRlZC1vbmx5IGdhbWVzLgAAAAAAABR2ZXJpZnlfYWNjcmVkaXRhdGlvbgAAAAUAAAAAAAAABnBsYXllcgAAAAAAEwAAAAAAAAAFcHJvb2YAAAAAAAAOAAAAAAAAAAttZXJrbGVfcm9vdAAAAAAOAAAAAAAAAAludWxsaWZpZXIAAAAAAAAOAAAAAAAAAAdnYW1lX2lkAAAAAAYAAAABAAAD6QAAAAIAAAAD",
        "AAAAAAAAAEBVcGRhdGUgdGhlIGFjY3JlZGl0ZWQgTWVya2xlIHJvb3QuIE9ubHkgdGhlIGFkbWluIGNhbiBjYWxsIHRoaXMuAAAAFnVwZGF0ZV9hY2NyZWRpdGVkX3Jvb3QAAAAAAAIAAAAAAAAABWFkbWluAAAAAAAAEwAAAAAAAAALbWVya2xlX3Jvb3QAAAAADgAAAAA=",
        "AAAAAAAAAUhJbml0aWFsaXplIHRoZSBhY2NyZWRpdGF0aW9uIHN5c3RlbSB3aXRoIGEgc2VwYXJhdGUgVWx0cmFIb25rIFZLCihmb3IgdGhlIGFsbG93bGlzdF9tZW1iZXJzaGlwIE5vaXIgY2lyY3VpdCksIGEgTWVya2xlIHJvb3Qgb2YKYWNjcmVkaXRlZCBwYXJ0aWNpcGFudHMsIGFuZCBhbiBhZG1pbiB3aG8gY2FuIHVwZGF0ZSB0aGUgcm9vdC4KClRoaXMgaXMgYSBzZXBhcmF0ZSBWSyBmcm9tIHRoZSBtb3ZlLWNvbW1pdG1lbnQgVksgYmVjYXVzZSB0aGUKYWxsb3dsaXN0IGNpcmN1aXQgaXMgYSBkaWZmZXJlbnQgTm9pciBwcm9ncmFtIHdpdGggZGlmZmVyZW50IHB1YmxpYwppbnB1dHMuAAAAGGluaXRpYWxpemVfYWNjcmVkaXRhdGlvbgAAAAMAAAAAAAAABWFkbWluAAAAAAAAEwAAAAAAAAAIdmtfYnl0ZXMAAAAOAAAAAAAAAAttZXJrbGVfcm9vdAAAAAAOAAAAAA==",
        "AAAAAAAAADFRdWVyeSB3aGV0aGVyIGFjY3JlZGl0YXRpb24gaGFzIGJlZW4gaW5pdGlhbGl6ZWQuAAAAAAAAHGlzX2FjY3JlZGl0YXRpb25faW5pdGlhbGl6ZWQAAAAAAAAAAQAAAAE=",
        "AAAABAAAAAAAAAAAAAAABUVycm9yAAAAAAAAJAAAAAAAAAAMR2FtZU5vdEZvdW5kAAAAAQAAAAAAAAAPR2FtZUFscmVhZHlGdWxsAAAAAAIAAAAAAAAAEUdhbWVBbHJlYWR5Sm9pbmVkAAAAAAAAAwAAAAAAAAATR2FtZUFscmVhZHlSZXNvbHZlZAAAAAAEAAAAAAAAAAxHYW1lTm90UmVhZHkAAAAFAAAAAAAAAAtHYW1lRXhwaXJlZAAAAAAGAAAAAAAAAAtOb3RZb3VyR2FtZQAAAAAHAAAAAAAAABNNb3ZlQWxyZWFkeVJldmVhbGVkAAAAAAgAAAAAAAAAC0ludmFsaWRNb3ZlAAAAAAkAAAAAAAAADEludmFsaWRTdGFrZQAAAAoAAAAAAAAAEkNvbW1pdG1lbnRNaXNtYXRjaAAAAAAACwAAAAAAAAAXUHJvb2ZWZXJpZmljYXRpb25GYWlsZWQAAAAADAAAAAAAAAAMUHJvb2ZUb29Mb25nAAAADQAAAAAAAAATSW52YWxpZFB1YmxpY0lucHV0cwAAAAAOAAAAAAAAABBWS05vdEluaXRpYWxpemVkAAAADwAAAAAAAAAMVW5hdXRob3JpemVkAAAAEAAAAAAAAAAPQWxyZWFkeVJldmVhbGVkAAAAABEAAAAAAAAAC05vdFlvdXJUdXJuAAAAABIAAAAAAAAAE0luc3VmZmljaWVudEJhbGFuY2UAAAAAEwAAAAAAAAAOVHJhbnNmZXJGYWlsZWQAAAAAABQAAAAAAAAAEFRva2VuQ2xpZW50RXJyb3IAAAAVAAAAAAAAABFEZWFkbGluZU5vdFBhc3NlZAAAAAAAABYAAAAAAAAADEJvdGhSZXZlYWxlZAAAABcAAAAAAAAADU1hdGNoTm90Rm91bmQAAAAAAAAYAAAAAAAAABJNYXRjaE5vdEluUHJvZ3Jlc3MAAAAAABkAAAAAAAAAFE1hdGNoQWxyZWFkeUNvbXBsZXRlAAAAGgAAAAAAAAAKTm90SW5NYXRjaAAAAAAAGwAAAAAAAAANUm91bmROb3RSZWFkeQAAAAAAABwAAAAAAAAADUludmFsaWRCZXN0T2YAAAAAAAAdAAAAAAAAAA1Xcm9uZ09wcG9uZW50AAAAAAAAHgAAAAAAAAASTWF0Y2hSb3VuZE1pc21hdGNoAAAAAAAfAAAAAAAAABtBY2NyZWRpdGF0aW9uTm90SW5pdGlhbGl6ZWQAAAAAIAAAAAAAAAAMUm9vdE1pc21hdGNoAAAAIQAAAAAAAAAUTnVsbGlmaWVyQWxyZWFkeVVzZWQAAAAiAAAAAAAAAAtJbnZhbGlkUm9vdAAAAAAjAAAAAAAAABpBY2NyZWRpdGF0aW9uQWRtaW5NaXNtYXRjaAAAAAAAJA==" ]),
      options
    )
  }
  public readonly fromJSON = {
    get_vk: this.txFromJSON<Option<Buffer>>,
        rematch: this.txFromJSON<Result<readonly [u64, u64]>>,
        get_game: this.txFromJSON<Option<Game>>,
        get_match: this.txFromJSON<Option<Match>>,
        join_game: this.txFromJSON<Result<void>>,
        initialize: this.txFromJSON<null>,
        join_match: this.txFromJSON<Result<void>>,
        cancel_game: this.txFromJSON<Result<void>>,
        create_game: this.txFromJSON<Result<u64>>,
        reveal_move: this.txFromJSON<Result<void>>,
        cancel_match: this.txFromJSON<Result<void>>,
        claim_refund: this.txFromJSON<Result<void>>,
        create_match: this.txFromJSON<Result<readonly [u64, u64]>>,
        resolve_game: this.txFromJSON<Result<readonly [i128, i128]>>,
        claim_forfeit: this.txFromJSON<Result<void>>,
        get_game_count: this.txFromJSON<u64>,
        get_match_count: this.txFromJSON<u64>,
        join_next_round: this.txFromJSON<Result<void>>,
        start_next_round: this.txFromJSON<Result<u64>>,
        get_accredited_root: this.txFromJSON<Option<Buffer>>,
        cancel_match_timeout: this.txFromJSON<Result<void>>,
        verify_accreditation: this.txFromJSON<Result<void>>,
        update_accredited_root: this.txFromJSON<null>,
        initialize_accreditation: this.txFromJSON<null>,
        is_accreditation_initialized: this.txFromJSON<boolean>
  }
}