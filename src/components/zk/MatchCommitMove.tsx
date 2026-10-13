import React, { useState, useEffect, useRef } from "react";
import { useWallet } from "../../hooks/useWallet";
import { useZKDilemma, type GameMove } from "../../hooks/useZKDilemma";
import {
  computeCommitment,
  generateNonce,
  generateProof,
} from "../../services/noirProofService";
import { persistSecrets } from "../../services/localSecretStore";
import { MOVE_HELPER, MOVE_LABEL } from "../../content/vocabulary";
import { ReceiptLine, TearLine } from "../receipt";
import { shortTx } from "../receipt/helpers";
import { NonceCard } from "./NonceCard";
import { PayoffMatrixReminder } from "./PayoffMatrixReminder";
import { VerifiedOnChainCard } from "./VerifiedOnChainCard";
import "../../styles/tournament.css";
import "../../styles/zk.css";

interface MatchCommitMoveProps {
  /** Which match phase we're committing for. */
  phase: "create" | "join" | "startNext" | "joinNext" | "rematch";
  /** Match id (0 for create/rematch-before-creation). */
  matchId: number;
  /** Known game id for join/joinNext phases; predicted for create/startNext. */
  gameId?: number;
  /** bestOf + stake, required for create/rematch phases. */
  bestOf?: number;
  stake?: string;
  /** Called with the new game id once the commit succeeds. */
  onComplete: (newGameId: number, newMatchId?: number) => void;
  onBack: () => void;
}

/**
 * MatchCommitMove — commit flow for match rounds.
 *
 * Handles the ZK proof generation + contract submission for the various
 * match phases (create, join, startNext, joinNext, rematch). Reuses the
 * same noir proof service as CommitMove but calls the match-specific
 * contract functions.
 */
export const MatchCommitMove: React.FC<MatchCommitMoveProps> = ({
  phase,
  matchId,
  gameId: knownGameId,
  bestOf,
  stake: stakeXlm,
  onComplete,
  onBack,
}) => {
  const { address } = useWallet();
  const {
    createMatch,
    joinMatch,
    startNextRound,
    joinNextRound,
    rematch,
    getGameCount,
    error,
  } = useZKDilemma();

  const [selectedMove, setSelectedMove] = useState<GameMove | null>(null);
  const [status, setStatus] = useState<
    "choose" | "generating" | "submitting" | "verified"
  >("choose");
  const [txError, setTxError] = useState<string | null>(null);
  const [debug, setDebug] = useState<string>("");
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

  /** On-chain celebration beat, then hand off to the parent view */
  const celebrate = (newGameId: number, newMatchId?: number) => {
    setStatus("verified");
    verifyTimer.current = window.setTimeout(
      () => onComplete(newGameId, newMatchId),
      2_000,
    );
  };

  const isLoadingState =
    status === "generating" || status === "submitting" || status === "verified";

  const phaseLabel: Record<MatchCommitMoveProps["phase"], string> = {
    create: "Create Match — Round 1",
    join: "Join Match — Round 1",
    startNext: "Start Next Round",
    joinNext: "Join Next Round",
    rematch: "Rematch — Round 1",
  };

  const handleCommit = async () => {
    if (!selectedMove || !address) return;
    setTxError(null);

    const moveNum: 0 | 1 = selectedMove === "C" ? 0 : 1;
    const nonce = generateNonce();
    setSavedNonce(nonce);

    // For phases where the game_id is known (join, joinNext), use it directly.
    // For create/startNext/rematch, predict via getGameCount()+1 with retries.
    const needsPrediction =
      phase === "create" || phase === "startNext" || phase === "rematch";

    const MAX_RETRIES = 2;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        setStatus("generating");

        let targetGameId: number;
        if (needsPrediction) {
          const count = await getGameCount();
          targetGameId = count + 1;
          setDebug(`Attempt ${attempt + 1}: targeting game_id=${targetGameId}`);
        } else {
          targetGameId = knownGameId ?? 0;
          setDebug(`Using known game_id=${targetGameId}`);
        }
        persistSecrets(targetGameId, nonce, selectedMove);

        setDebug(`Computing commitment for ${selectedMove}...`);
        const commitmentBytes = computeCommitment({
          move: moveNum,
          nonce,
          gameId: targetGameId,
        });
        const commitmentHex = Array.from(commitmentBytes)
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");

        setDebug("Generating ZK proof...");
        const proofOutput = await generateProof({
          move: moveNum,
          nonce,
          gameId: targetGameId,
        });
        const proofHex = Array.from(proofOutput.proof)
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");

        // Convert to Buffers for the hook
        const { Buffer } = await import("buffer");
        const commitment = Buffer.from(commitmentHex, "hex");
        const proof = Buffer.from(proofHex, "hex");

        setStatus("submitting");

        if (phase === "create" || phase === "rematch") {
          if (!bestOf || !stakeXlm) throw new Error("Missing match params");
          const stakeStroops = BigInt(
            Math.floor(parseFloat(stakeXlm) * 10_000_000),
          ).toString();
          const result =
            phase === "create"
              ? await createMatch(commitment, proof, stakeStroops, bestOf)
              : await rematch(matchId, commitment, proof);
          if (result.gameId !== targetGameId) {
            persistSecrets(result.gameId, nonce, selectedMove);
          }
          setVerifiedTxHash(result.hash ?? null);
          setDebug(
            phase === "create"
              ? `Match #${result.matchId} created, game #${result.gameId}!`
              : `Rematch #${result.matchId}, game #${result.gameId}!`,
          );
          celebrate(result.gameId, result.matchId);
        } else if (phase === "join") {
          const { hash } = await joinMatch(matchId, commitment, proof);
          setVerifiedTxHash(hash ?? null);
          setDebug(`Joined match #${matchId}!`);
          celebrate(knownGameId ?? 0);
        } else if (phase === "startNext") {
          const { gameId: newGameId, hash } = await startNextRound(
            matchId,
            commitment,
            proof,
          );
          if (newGameId !== targetGameId) {
            persistSecrets(newGameId, nonce, selectedMove);
          }
          setVerifiedTxHash(hash ?? null);
          setDebug(`Next round started, game #${newGameId}!`);
          celebrate(newGameId);
        } else if (phase === "joinNext") {
          await joinNextRound(matchId, commitment, proof);
          setVerifiedTxHash(null);
          setDebug(`Joined next round of match #${matchId}!`);
          celebrate(knownGameId ?? 0);
        }
        return; // success
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (
          needsPrediction &&
          attempt < MAX_RETRIES &&
          /proof|commitment|verification|mismatch|hash/i.test(message)
        ) {
          setDebug(
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

  return (
    <div className="zk-page">
      <button
        type="button"
        onClick={onBack}
        disabled={isLoadingState}
        className="zk-back"
      >
        ← Back
      </button>

      <div className="receipt receipt-edge zk-commit">
        <h3 className="zk-commit__title">{phaseLabel[phase]}</h3>
        <p className="zk-commit__lede">
          Choose your move. When you let go, a proof binds you — no take-backs.
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

        <PayoffMatrixReminder />

        {/* The commit stub: below the tear line, each line prints only when
            the state behind it is real. */}
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
            {showTech && debug && <p className="zk-tech__log">{debug}</p>}
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
          disabled={!selectedMove || isLoadingState}
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
    </div>
  );
};
