import React, { useState, useEffect, useRef } from "react";
import { useWallet } from "../../hooks/useWallet";
import { useZKDilemma, type GameMove } from "../../hooks/useZKDilemma";
import {
  computeCommitment,
  generateNonce,
  generateProof,
} from "../../services/noirProofService";
import { MOVE_HELPER, MOVE_LABEL } from "../../content/vocabulary";
import { ReceiptLine, TearLine } from "../receipt";
import { shortTx } from "../receipt/helpers";
import { VerifiedOnChainCard } from "./VerifiedOnChainCard";
import { NonceCard } from "./NonceCard";
import { PayoffMatrixReminder } from "./PayoffMatrixReminder";
import { persistSecrets } from "../../services/localSecretStore";
import "../../styles/tournament.css";
import "../../styles/zk.css";

/** Stake preset options for quick selection */
const STAKE_PRESETS = ["1", "5", "10"] as const;
const RECOMMENDED_STAKE = "5";

interface CommitMoveProps {
  mode: "create" | "join";
  gameId?: number;
  hostAddress?: string;
  stake?: string;
  onComplete: (gameId: number) => void;
  onBack: () => void;
}

export const CommitMove: React.FC<CommitMoveProps> = ({
  mode,
  gameId,
  hostAddress,
  stake: initialStake,
  onComplete,
  onBack,
}) => {
  const { address } = useWallet();
  const { createGame, joinGame, getGameCount, isLoading, error } =
    useZKDilemma();

  const [selectedMove, setSelectedMove] = useState<GameMove | null>(null);
  const [stake, setStake] = useState(initialStake || RECOMMENDED_STAKE);
  const [showCustomStake, setShowCustomStake] = useState(false);
  const [status, setStatus] = useState<
    "choose" | "generating" | "submitting" | "verified"
  >("choose");
  const [txError, setTxError] = useState<string | null>(null);
  const [commitDebug, setCommitDebug] = useState<string>("");
  const [showTech, setShowTech] = useState(false);
  const [savedNonce, setSavedNonce] = useState<bigint | null>(null);
  const [verifiedTxHash, setVerifiedTxHash] = useState<string | null>(null);
  const verifyTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (verifyTimer.current) window.clearTimeout(verifyTimer.current);
    },
    [],
  );

  const celebrate = (gameId: number) => {
    setStatus("verified");
    verifyTimer.current = window.setTimeout(() => onComplete(gameId), 2_000);
  };

  const canSubmit = selectedMove !== null && !isLoading;

  const handleCommit = async () => {
    if (!selectedMove || !address) return;

    setTxError(null);

    const moveNum: 0 | 1 = selectedMove === "C" ? 0 : 1;
    const nonce = generateNonce();
    setSavedNonce(nonce);

    // For create mode: retry up to 2 times if game_id prediction fails
    // (race condition: another game created between count check and tx)
    const MAX_RETRIES = 2;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        setStatus("generating");

        let targetGameId: number;
        if (mode === "create") {
          const count = await getGameCount();
          targetGameId = count + 1;
          setCommitDebug(
            `Attempt ${attempt + 1}: targeting game_id=${targetGameId}`,
          );
        } else {
          targetGameId = gameId ?? 0;
        }
        persistSecrets(targetGameId, nonce, selectedMove);

        // Compute commitment hash (keccak256 of move + nonce + game_id)
        setCommitDebug(`Computing commitment for ${selectedMove}...`);
        const commitmentBytes = computeCommitment({
          move: moveNum,
          nonce,
          gameId: targetGameId,
        });

        const commitmentHex = Array.from(commitmentBytes)
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");

        setCommitDebug(`Commitment: ${commitmentHex.slice(0, 16)}...`);

        // Generate ZK proof
        setCommitDebug("Generating ZK proof...");
        const proofOutput = await generateProof({
          move: moveNum,
          nonce,
          gameId: targetGameId,
        });

        const proofHex = Array.from(proofOutput.proof)
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");

        setCommitDebug(`Proof: ${proofHex.slice(0, 16)}...`);

        // Submit to contract
        setStatus("submitting");

        if (mode === "create") {
          const stakeStroops = BigInt(
            Math.floor(parseFloat(stake) * 10_000_000),
          ).toString();
          const { gameId: newGameId, hash } = await createGame(
            commitmentHex,
            proofHex,
            stakeStroops,
          );
          if (newGameId !== targetGameId) {
            persistSecrets(newGameId, nonce, selectedMove);
          }
          setVerifiedTxHash(hash ?? null);
          setCommitDebug(`Game #${newGameId} created!`);
          celebrate(newGameId);
        } else if (mode === "join" && gameId) {
          const { hash } = await joinGame(gameId, commitmentHex, proofHex);
          setVerifiedTxHash(hash ?? null);
          setCommitDebug(`Joined game #${gameId}!`);
          celebrate(gameId);
        }
        return; // Success — exit retry loop
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);

        // If create mode and this looks like a proof/commitment mismatch
        // (game_id race condition), retry with fresh count
        if (
          mode === "create" &&
          attempt < MAX_RETRIES &&
          /proof|commitment|verification|mismatch|hash/i.test(message)
        ) {
          setCommitDebug(
            `Game ID mismatch (race condition), retrying... (${attempt + 1}/${MAX_RETRIES})`,
          );
          continue;
        }

        setTxError(message);
        setStatus("choose");
        return;
      }
    }
  };

  if (!address) {
    return (
      <div className="zk-loading">
        <p>Connect your wallet to commit a move</p>
      </div>
    );
  }

  const isLoadingState =
    status === "generating" || status === "submitting" || status === "verified";

  return (
    <div className="zk-page">
      <button
        type="button"
        onClick={onBack}
        disabled={isLoadingState}
        className="zk-back"
      >
        ← Lobby
      </button>

      {/* Choosing a move is a form — a form is read closely, so it prints
          on stock. */}
      <div className="receipt receipt-edge zk-commit">
        <h3 className="zk-commit__title">
          {mode === "create" ? "Stand at the edge." : "Step to the edge."}
        </h3>

        <p className="zk-commit__lede">
          {mode === "create"
            ? "Choose your move. When you let go, a proof binds you — no take-backs."
            : `Game #${gameId} — ${hostAddress?.slice(0, 8)}… is waiting. Will you catch them?`}
        </p>

        {/* Move tiles */}
        <p className="zk-commit__label">Your move</p>
        <div className="zk-choices">
          <button
            type="button"
            onClick={() => setSelectedMove("C")}
            disabled={isLoadingState}
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
            disabled={isLoadingState}
            aria-pressed={selectedMove === "D"}
            className={
              selectedMove === "D" ? "zk-move zk-move--picked" : "zk-move"
            }
          >
            <span className="zk-move__name">{MOVE_LABEL.D}</span>
            <span className="zk-move__note">{MOVE_HELPER.D}</span>
          </button>
        </div>

        {/* Stake (create mode only) */}
        {mode === "create" && (
          <div className="till-field">
            <p className="zk-commit__label">Stake (XLM) — the height of it</p>

            <div className="zk-stake-row">
              {STAKE_PRESETS.map((preset) => {
                const isSelected = !showCustomStake && stake === preset;
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      setShowCustomStake(false);
                      setStake(preset);
                    }}
                    className={
                      isSelected
                        ? "payoff-preset payoff-preset--active"
                        : "payoff-preset"
                    }
                  >
                    {preset} XLM
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setShowCustomStake(true)}
                className={
                  showCustomStake
                    ? "payoff-preset payoff-preset--active"
                    : "payoff-preset"
                }
              >
                Custom
              </button>
            </div>

            {showCustomStake && (
              <input
                aria-label="Stake in XLM"
                value={stake}
                onChange={(e) => setStake(e.target.value)}
                type="number"
                min="0.1"
                step="0.1"
                disabled={isLoadingState}
                className="payoff-input zk-stake-input"
              />
            )}
            {!showCustomStake && stake === RECOMMENDED_STAKE && (
              <span
                className="zk-recommended"
                title="Low enough for casual play, high enough to matter"
              >
                Recommended — {RECOMMENDED_STAKE} XLM
              </span>
            )}

            {/* The stake as a height sketch — an inked bar in a dashed
                frame, printed like the charts. */}
            <div className="zk-height">
              <div className="zk-height__track">
                <div
                  className="zk-height__bar"
                  style={{
                    height: `${Math.min(100, Math.max(8, (parseFloat(stake) || 0) * 5))}%`,
                  }}
                />
              </div>
            </div>
            <p className="zk-height__caption">
              {(() => {
                const s = parseFloat(stake) || 0;
                if (s <= 0) return "Enter a stake to see the height";
                if (s < 1) return "A small step";
                if (s < 5) return "A real fall";
                if (s < 20) return "A long way down";
                if (s < 100) return "A cliff edge";
                return "The abyss";
              })()}
            </p>
          </div>
        )}

        <PayoffMatrixReminder />

        {/* The commit stub: below the tear line, each line prints only when
            the state behind it is real. Sealing… while the proof generates,
            then proof generated, submitted, confirmed. */}
        {status !== "choose" && (
          <div className="zk-stub" aria-live="polite">
            <TearLine label="The seal" />
            <ReceiptLine
              label="Seal"
              value={status === "generating" ? "Sealing…" : "Sealed"}
            />
            <ReceiptLine
              label="Proof"
              value={status === "generating" ? "—" : "generated"}
            />
            <ReceiptLine
              label="Submitted"
              value={
                verifiedTxHash
                  ? shortTx(verifiedTxHash)
                  : status === "submitting"
                    ? "sending…"
                    : "—"
              }
            />
            {status === "generating" && (
              <p className="zk-stub__hint">
                Proving your move is valid without showing it — this takes a few
                seconds.
              </p>
            )}
            {status === "submitting" && (
              <p className="zk-stub__hint">
                Sending the sealed move to the contract…
              </p>
            )}
            {showTech && commitDebug && (
              <p className="zk-tech__log">{commitDebug}</p>
            )}
          </div>
        )}

        {status !== "choose" && status !== "verified" && (
          <label className="zk-tech">
            <input
              type="checkbox"
              checked={showTech}
              onChange={(e) => setShowTech(e.target.checked)}
            />
            Show technical details
          </label>
        )}

        <NonceCard nonce={savedNonce} />

        {/* On-chain celebration beat */}
        {status === "verified" && <VerifiedOnChainCard hash={verifiedTxHash} />}

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
          onClick={() => void handleCommit()}
          disabled={!canSubmit || isLoadingState}
          className="till-button till-button--primary zk-submit"
        >
          {isLoadingState
            ? status === "generating"
              ? "Sealing…"
              : status === "submitting"
                ? "Committing…"
                : "Sealed"
            : "Let go"}
        </button>
      </div>

      <p className="zk-note">
        <strong>The math catches you:</strong> your move is zero-knowledge
        proven before you let go — the contract knows your commitment is real,
        but can't see your move until you reveal it.
      </p>
    </div>
  );
};
