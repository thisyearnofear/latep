import React, { useState, useEffect, useRef } from "react";
import { useWallet } from "../../hooks/useWallet";
import { useZKDilemma, type GameMove } from "../../hooks/useZKDilemma";
import { VerifiedOnChainCard } from "./VerifiedOnChainCard";
import { MOVE_LABEL, MOVE_HELPER } from "../../content/vocabulary";
import "../../styles/zk.css";

interface RevealMoveProps {
  gameId: number;
  gameState: {
    player1: string;
    player2: string | null;
    move1: GameMove | null;
    move2: GameMove | null;
    nonce1: string | null;
    nonce2: string | null;
    reveal_deadline: string;
    status: string;
  };
  onRevealed: () => void;
}

export const RevealMove: React.FC<RevealMoveProps> = ({
  gameId,
  gameState,
  onRevealed,
}) => {
  const { address } = useWallet();
  const { revealMove, isLoading, error } = useZKDilemma();
  const [revealNonce, setRevealNonce] = useState<string>("");
  const [selectedMove, setSelectedMove] = useState<GameMove | null>(null);
  const [txError, setTxError] = useState<string | null>(null);
  const [justRevealed, setJustRevealed] = useState(false);
  const [revealTxHash, setRevealTxHash] = useState<string | null>(null);
  const revealTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (revealTimer.current) window.clearTimeout(revealTimer.current);
    },
    [],
  );

  // Auto-fill nonce and move from storage (set during commit step)
  // Check localStorage first (survives browser close), then sessionStorage
  useEffect(() => {
    const nonceKey = `zk_nonce_game_${gameId}`;
    const moveKey = `zk_move_game_${gameId}`;
    const storedNonce =
      localStorage.getItem(nonceKey) || sessionStorage.getItem(nonceKey);
    const storedMove =
      localStorage.getItem(moveKey) || sessionStorage.getItem(moveKey);
    if (storedNonce && !revealNonce) {
      setRevealNonce(storedNonce);
    }
    if (storedMove && !selectedMove) {
      setSelectedMove(storedMove as GameMove);
    }
  }, [gameId, revealNonce, selectedMove]);

  // Determine the player's role
  const isPlayer1 = address === gameState.player1;
  const isPlayer2 = address === gameState.player2;
  const isPlayer = isPlayer1 || isPlayer2;

  // Check if the player has already revealed
  const hasRevealed = isPlayer1
    ? gameState.move1 !== null
    : isPlayer2
      ? gameState.move2 !== null
      : false;

  // Check reveal deadline
  const deadline = Number(gameState.reveal_deadline);
  const now = Math.floor(Date.now() / 1000);
  const isExpired = now > deadline && deadline > 0;
  const timeRemaining = deadline > 0 ? Math.max(0, deadline - now) : 0;

  // Check if opponent has revealed
  const opponentRevealed = isPlayer1
    ? gameState.move2 !== null
    : isPlayer2
      ? gameState.move1 !== null
      : false;

  // Both revealed?
  const bothRevealed = gameState.move1 !== null && gameState.move2 !== null;

  const handleReveal = async () => {
    if (!selectedMove || !address) return;

    setTxError(null);

    try {
      // The nonce should be passed as a bigint to the contract
      // The user enters it as a decimal string
      const nonceBigInt = BigInt(revealNonce || "0");
      if (nonceBigInt <= BigInt(0)) {
        setTxError("Please enter the nonce you used when committing");
        return;
      }

      const { hash } = await revealMove(gameId, selectedMove, nonceBigInt);
      setRevealTxHash(hash ?? null);
      setJustRevealed(true);
      revealTimer.current = window.setTimeout(() => {
        setJustRevealed(false);
        onRevealed();
      }, 1_800);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setTxError(message);
    }
  };

  if (!isPlayer) {
    return (
      <div className="zk-panel zk-panel--centred">
        <p className="zk-status-line">
          Spectating — wait for the players to show their hands.
        </p>
      </div>
    );
  }

  if (justRevealed) {
    return (
      <div className="receipt receipt-edge zk-solo-receipt">
        <VerifiedOnChainCard
          hash={revealTxHash}
          label="Sealed move opened"
          sublabel="The contract checked your reveal against your commitment — math, not trust."
        />
      </div>
    );
  }

  if (bothRevealed) {
    return (
      <div className="zk-panel zk-panel--centred tf-fade-in-up">
        <p className="zk-status-line">
          <strong>Both hands are showing.</strong> Resolve next to settle the
          round.
        </p>
      </div>
    );
  }

  if (hasRevealed) {
    return (
      <div className="zk-panel zk-panel--centred">
        <p className="zk-status-line">
          <strong>Your turn is done</strong> — your move is revealed.
        </p>
        <p className="zk-status-line">
          {opponentRevealed
            ? "Both hands are showing — press Resolve next."
            : "Waiting for your opponent to show their hand…"}
        </p>
        {!opponentRevealed && timeRemaining > 0 && (
          <p className="zk-status-line">
            You can claim forfeit after the deadline (
            {Math.floor(timeRemaining / 60)}m {timeRemaining % 60}s remaining)
          </p>
        )}
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="zk-panel zk-panel--centred">
        <p className="zk-status-line zk-status-line--warn">
          <strong>The reveal deadline has passed.</strong>{" "}
          {opponentRevealed
            ? "Your opponent can claim forfeit."
            : "You can no longer reveal and forfeit your stake."}
        </p>
      </div>
    );
  }

  return (
    <div className="receipt receipt-edge zk-commit">
      <h4 className="zk-commit__title">Show your hand</h4>
      <p className="zk-commit__lede">
        You both reveal your own move. Your secret is already filled in — just
        press the button.
      </p>

      {/* Timer */}
      {timeRemaining > 0 && (
        <p
          className={
            timeRemaining < 60 ? "zk-timer zk-timer--late" : "zk-timer"
          }
        >
          Time to reveal: {Math.floor(timeRemaining / 60)}m {timeRemaining % 60}
          s before you forfeit
        </p>
      )}

      {/* Move selection — confirm the move you committed earlier */}
      <p className="zk-commit__label">
        {selectedMove
          ? "Confirm the move you committed — your nonce proves it matches"
          : "Select the move you committed earlier"}
      </p>
      <div className="zk-choices">
        <button
          type="button"
          onClick={() => setSelectedMove("C")}
          disabled={isLoading}
          aria-pressed={selectedMove === "C"}
          className={
            selectedMove === "C" ? "zk-move zk-move--picked" : "zk-move"
          }
        >
          <span className="zk-move__name">{MOVE_LABEL.C}</span>
          <span className="zk-move__note">{MOVE_HELPER.C}</span>
        </button>
        <button
          type="button"
          onClick={() => setSelectedMove("D")}
          disabled={isLoading}
          aria-pressed={selectedMove === "D"}
          className={
            selectedMove === "D" ? "zk-move zk-move--picked" : "zk-move"
          }
        >
          <span className="zk-move__name">{MOVE_LABEL.D}</span>
          <span className="zk-move__note">{MOVE_HELPER.D}</span>
        </button>
      </div>

      {/* Nonce input */}
      <div className="zk-field">
        <label htmlFor={`reveal-nonce-${gameId}`} className="zk-field__label">
          Your commitment nonce
        </label>
        <p className="zk-field__hint">
          The nonce you used when committing — you saved it locally.
        </p>
        <input
          id={`reveal-nonce-${gameId}`}
          type="text"
          value={revealNonce}
          onChange={(e) => setRevealNonce(e.target.value)}
          placeholder="Enter your nonce…"
          disabled={isLoading}
          className="zk-input"
        />
      </div>

      {txError && (
        <p className="zk-error" role="alert">
          {txError}
        </p>
      )}

      {error && (
        <p className="zk-error" role="alert">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={() => void handleReveal()}
        disabled={!selectedMove || !revealNonce || isLoading}
        className="till-button till-button--primary zk-submit"
      >
        {isLoading ? "Revealing…" : "Show my hand"}
      </button>
    </div>
  );
};
