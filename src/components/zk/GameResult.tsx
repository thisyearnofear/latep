import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useWallet } from "../../hooks/useWallet";
import { useZKDilemma, type GameMove } from "../../hooks/useZKDilemma";
import { useGameStats, type GameRecord } from "../../hooks/useGameStats";
import { unlockAchievement } from "../ui/AchievementBadge";
import { TrustFallCharacter } from "../TrustFallCharacter";
import { RoundReceipt } from "../receipt/RoundReceipt";
import { Receipt, ReceiptLine, Stamp } from "../receipt";
import { Thread } from "../receipt/Thread";
import { txExplorerUrl } from "../../contracts/util";
import {
  getOutcome,
  MOVE_LABEL,
  STAMPS,
  type ThreadState,
} from "../../content/vocabulary";
import "../../styles/zk.css";

interface GameResultProps {
  gameId: number;
  gameState: {
    player1: string;
    player2: string | null;
    move1: GameMove | null;
    move2: GameMove | null;
    stake: string;
    status: string;
    reveal_deadline: string;
  };
  onBack: () => void;
  /** Return to the create-game view for a fresh match. */
  onPlayAgain?: () => void;
}

export const GameResult: React.FC<GameResultProps> = ({
  gameId,
  gameState,
  onBack,
  onPlayAgain,
}) => {
  const { address } = useWallet();
  const { resolveGame, claimForfeit, isLoading, error } = useZKDilemma();
  const { recordGame } = useGameStats();
  const [result, setResult] = useState<{
    payout1: bigint;
    payout2: bigint;
    hash?: string;
  } | null>(null);
  const [txError, setTxError] = useState<string | null>(null);
  const recordedRef = useRef<string | null>(null);

  const isPlayer1 = address === gameState.player1;
  const isPlayer2 = address === gameState.player2;
  const isPlayer = isPlayer1 || isPlayer2;

  const bothRevealed = gameState.move1 !== null && gameState.move2 !== null;
  const isResolved = gameState.status === "Resolved";
  const isForfeited = gameState.status === "Forfeited";
  const isActive =
    gameState.status === "BothCommitted" ||
    gameState.status === "AwaitingPlayer2";

  // Check reveal deadline for forfeit claim
  const deadline = Number(gameState.reveal_deadline);
  const now = Math.floor(Date.now() / 1000);
  const deadlinePassed = now > deadline && deadline > 0;

  // Check if the player has revealed and opponent hasn't
  const playerRevealed = isPlayer1
    ? gameState.move1 !== null
    : isPlayer2
      ? gameState.move2 !== null
      : false;
  const opponentRevealed = isPlayer1
    ? gameState.move2 !== null
    : isPlayer2
      ? gameState.move1 !== null
      : false;

  const canResolve = bothRevealed && !isResolved && !isForfeited;
  const canClaimForfeit =
    isActive &&
    isPlayer &&
    playerRevealed &&
    !opponentRevealed &&
    deadlinePassed;

  const handleResolve = async () => {
    setTxError(null);
    try {
      const resolveResult = await resolveGame(gameId);
      setResult(resolveResult);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setTxError(message);
    }
  };

  const handleClaimForfeit = async () => {
    setTxError(null);
    try {
      await claimForfeit(gameId);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setTxError(message);
    }
  };

  const formatXLM = (stroops: bigint | string): string => {
    const s = typeof stroops === "string" ? BigInt(stroops) : stroops;
    return `${(Number(s) / 10_000_000).toFixed(7)} XLM`;
  };

  const formatAddress = (addr: string): string =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  // Moves from this viewer's perspective: "you" is the connected player,
  // "partner" is the other side. A spectator sees player 1 on the left.
  const yourMove: GameMove | null = isPlayer
    ? isPlayer1
      ? gameState.move1
      : gameState.move2
    : gameState.move1;
  const partnerMove: GameMove | null = isPlayer
    ? isPlayer1
      ? gameState.move2
      : gameState.move1
    : gameState.move2;

  // The settled outcome, worded by the shared table — never recomputed here.
  const outcome =
    bothRevealed && yourMove && partnerMove
      ? getOutcome(yourMove, partnerMove)
      : null;

  const threadState: ThreadState = outcome ? outcome.thread : "loose";

  const getOutcomeHeadline = (): { title: string; subtitle: string } => {
    if (!bothRevealed && !isResolved && !isForfeited)
      return {
        title: "Suspended in the air…",
        subtitle: "Waiting for the reveal",
      };
    if (isForfeited)
      return {
        title: "No one caught anyone",
        subtitle: "Someone didn't show up for the reveal",
      };
    if (outcome) {
      switch (outcome.id) {
        case "held":
          return {
            title: "Held",
            subtitle: "You both showed up. Trust rewarded.",
          };
        case "standoff":
          return {
            title: "Standoff",
            subtitle: "You both stepped aside. Nobody caught anyone.",
          };
        case "dropped":
          return {
            title: "Dropped",
            subtitle: "You reached out. They stepped aside.",
          };
        case "taken":
          return {
            title: "You took it",
            subtitle: "They reached out. You let them fall.",
          };
      }
    }
    return { title: "The moment of truth", subtitle: "" };
  };

  const headline = getOutcomeHeadline();

  const stakeXlm = Number(BigInt(gameState.stake)) / 10_000_000;

  // Net XLM for each player, only once the contract has told us the payouts.
  const net1 = result ? Number(result.payout1) / 10_000_000 - stakeXlm : null;
  const net2 = result ? Number(result.payout2) / 10_000_000 - stakeXlm : null;
  const netYou =
    net1 !== null && net2 !== null ? (isPlayer1 ? net1 : net2) : null;
  const netPartner =
    net1 !== null && net2 !== null ? (isPlayer1 ? net2 : net1) : null;

  // The full receipt prints only when the numbers are real: a player who
  // resolved here gets the RoundReceipt. A spectator, or a game resolved on
  // another device, gets the same receipt minus the figures we can't prove.
  const canPrintReceipt =
    isResolved &&
    bothRevealed &&
    isPlayer &&
    yourMove !== null &&
    partnerMove !== null &&
    netYou !== null &&
    netPartner !== null;

  // Record the resolved game into persistent stats (once per game id).
  useEffect(() => {
    if (!isPlayer) return;
    if (!isResolved && !isForfeited) return;
    if (!bothRevealed && !isForfeited) return;
    if (!gameState.player2) return;

    const recordKey = String(gameId);
    if (recordedRef.current === recordKey) return;
    recordedRef.current = recordKey;

    const yourMoveStat: GameMove | null = isPlayer1
      ? gameState.move1
      : gameState.move2;
    const opponentMoveStat: GameMove | null = isPlayer1
      ? gameState.move2
      : gameState.move1;
    if (!yourMoveStat || !opponentMoveStat) return;

    const opponent = isPlayer1 ? gameState.player2 || "" : gameState.player1;

    // Determine outcome from the player's perspective.
    let outcomeStat: GameRecord["outcome"] = "tie";
    if (yourMoveStat === "C" && opponentMoveStat === "D") outcomeStat = "lose";
    else if (yourMoveStat === "D" && opponentMoveStat === "C")
      outcomeStat = "win";
    else outcomeStat = "tie"; // both C or both D → tie in trustfall framing

    // Compute net payout in XLM. Prefer the on-chain resolve result when
    // available; otherwise estimate from stake + outcome.
    let payoutXlm = 0;
    if (result) {
      const yourPayout = isPlayer1 ? result.payout1 : result.payout2;
      payoutXlm = Number(yourPayout) / 10_000_000 - stakeXlm;
    } else {
      // Estimate: win → +stake, lose → -stake, tie → 0
      payoutXlm =
        outcomeStat === "win"
          ? stakeXlm
          : outcomeStat === "lose"
            ? -stakeXlm
            : 0;
    }

    recordGame({
      gameId: String(gameId),
      opponent,
      yourMove: yourMoveStat,
      opponentMove: opponentMoveStat,
      outcome: outcomeStat,
      stake: stakeXlm,
      payout: payoutXlm,
      timestamp: Date.now(),
    });

    // Unlock ZK achievements
    unlockAchievement("zk_player");
    if (outcomeStat === "win") {
      unlockAchievement("zk_winner");
    }
  }, [
    isPlayer,
    isResolved,
    isForfeited,
    bothRevealed,
    gameId,
    gameState.player1,
    gameState.player2,
    gameState.move1,
    gameState.move2,
    gameState.stake,
    isPlayer1,
    result,
    recordGame,
    stakeXlm,
  ]);

  const moveWord = (m: GameMove | null): string =>
    m ? MOVE_LABEL[m] : "Not revealed";

  return (
    <div className="zk-result">
      <div className="zk-panel">
        <h3 className="zk-result__title">
          {isResolved || isForfeited ? headline.title : "The moment of truth"}
        </h3>
        <p className="zk-result__sub">
          Game #{gameId} —{" "}
          {headline.subtitle ||
            (isResolved
              ? "Resolved"
              : isForfeited
                ? "Forfeited"
                : "In progress")}
        </p>

        {/* The landing: two figures and the thread between them. The thread's
            state comes from the outcome table — never computed from moves. */}
        <div className="zk-figures">
          <div className="zk-figure">
            <TrustFallCharacter
              state={
                !isResolved
                  ? "standing"
                  : gameState.move1 === "C"
                    ? "caught"
                    : "impact"
              }
              color={isPlayer1 ? "you" : "opponent"}
              size="lg"
            />
            <p
              className={
                isPlayer1
                  ? "zk-figure__name zk-figure__name--you"
                  : "zk-figure__name"
              }
            >
              Player 1{isPlayer1 ? " (you)" : ""}
            </p>
            <p className="zk-figure__addr">
              {formatAddress(gameState.player1)}
            </p>
          </div>

          <Thread
            state={threadState}
            twists={outcome?.id === "held" ? 1 : 0}
            surface="counter"
            width={72}
            height={48}
          />

          <div className="zk-figure">
            <TrustFallCharacter
              state={
                !gameState.player2
                  ? "waiting"
                  : !isResolved
                    ? "standing"
                    : gameState.move2 === "C"
                      ? "caught"
                      : "impact"
              }
              color={isPlayer2 ? "you" : "opponent"}
              size="lg"
            />
            <p
              className={
                isPlayer2
                  ? "zk-figure__name zk-figure__name--you"
                  : "zk-figure__name"
              }
            >
              {gameState.player2
                ? `Player 2${isPlayer2 ? " (you)" : ""}`
                : "Waiting…"}
            </p>
            <p className="zk-figure__addr">
              {gameState.player2 ? formatAddress(gameState.player2) : "—"}
            </p>
          </div>
        </div>

        <div className="zk-figures__moves">
          <span className="zk-moves-line">{moveWord(gameState.move1)}</span>
          <span className="zk-moves-line">
            {gameState.player2 ? moveWord(gameState.move2) : "—"}
          </span>
        </div>

        {/* The receipt prints once the round is closed. Payouts come from the
            resolve transaction — a receipt never prints numbers it can't
            prove, so a game resolved elsewhere shows lines without figures. */}
        {canPrintReceipt && (
          <RoundReceipt
            roundNumber={1}
            mode="zk"
            you={yourMove}
            partner={partnerMove}
            pointsYou={Number(netYou.toFixed(4))}
            pointsPartner={Number(netPartner.toFixed(4))}
            txId={result?.hash}
            confirmed={Boolean(result?.hash)}
            explorerUrl={txExplorerUrl}
            stakeLabel={formatXLM(gameState.stake)}
            settlementLabel="Escrow settled"
            primitiveId="net"
            feeding
          />
        )}

        {(isResolved || isForfeited) && !canPrintReceipt && bothRevealed && (
          <Receipt title={`Game ${gameId}`} className="zk-solo-receipt">
            <ReceiptLine
              label="Player 1"
              value={
                gameState.move1 ? MOVE_LABEL[gameState.move1] : "Not revealed"
              }
            />
            <ReceiptLine
              label="Player 2"
              value={
                gameState.move2 ? MOVE_LABEL[gameState.move2] : "Not revealed"
              }
            />
            <ReceiptLine label="Stake" value={formatXLM(gameState.stake)} />
            <ReceiptLine
              label="Settlement"
              value={isResolved ? "Settled on-chain" : STAMPS.pending}
            />
            <div className="round-receipt-stamps">
              {outcome && <Stamp text={STAMPS[outcome.id]} />}
            </div>
          </Receipt>
        )}

        {isForfeited && (
          <div className="zk-banner">
            <p className="zk-banner__line zk-banner__line--bad">
              Nobody caught anyone — one player didn't show up for the reveal.
            </p>
          </div>
        )}

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

        <div className="zk-result__actions">
          {canResolve && (
            <div>
              <button
                type="button"
                onClick={() => void handleResolve()}
                disabled={isLoading}
                className="till-button till-button--primary"
              >
                {isLoading ? "Landing…" : "Resolve the landing"}
              </button>
              <p className="zk-result__hint">
                The contract verifies both proofs and pays out — press to
                settle.
              </p>
            </div>
          )}

          {canClaimForfeit && (
            <button
              type="button"
              onClick={() => void handleClaimForfeit()}
              disabled={isLoading}
              className="till-button"
            >
              {isLoading ? "Claiming…" : "Claim the fall"}
            </button>
          )}

          {/* Post-resolution actions */}
          {(isResolved || isForfeited) && onPlayAgain && (
            <>
              <button
                type="button"
                onClick={onPlayAgain}
                className="till-button till-button--primary"
              >
                Play again
              </button>
              <button type="button" onClick={onBack} className="till-button">
                Back to lobby
              </button>
            </>
          )}

          {!isResolved && !isForfeited && (
            <button type="button" onClick={onBack} className="till-button">
              ← Back
            </button>
          )}
        </div>

        {/* Relatability bridge: game mechanic -> everyday trust problems */}
        {isResolved && (
          <Link to="/real-life" className="zk-result__bridge">
            That wasn&apos;t just a game — sealed votes, group-buy deposits and
            members-only drops run on this exact math.{" "}
            <strong>See where you&apos;ll meet this again →</strong>
          </Link>
        )}
      </div>
    </div>
  );
};
