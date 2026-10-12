import type { GameMove } from "../hooks/useZKDilemma";

/** Persist nonce + move keyed by game id so RevealMove can auto-fill */
export function persistSecrets(gameId: number, nonce: bigint, move: GameMove) {
  const nonceKey = `zk_nonce_game_${gameId}`;
  const moveKey = `zk_move_game_${gameId}`;
  try {
    localStorage.setItem(nonceKey, nonce.toString());
    localStorage.setItem(moveKey, move);
  } catch {
    sessionStorage.setItem(nonceKey, nonce.toString());
    sessionStorage.setItem(moveKey, move);
  }
}
