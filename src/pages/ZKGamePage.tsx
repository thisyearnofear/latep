import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "../hooks/useWallet";
import { useZKDilemma } from "../hooks/useZKDilemma";
import { useFirstRun } from "../hooks/useFirstRun";
import { GameLobby } from "../components/zk/GameLobby";
import { CommitMove } from "../components/zk/CommitMove";
import { RevealMove } from "../components/zk/RevealMove";
import { GameResult } from "../components/zk/GameResult";
import { MatchScoreboard } from "../components/zk/MatchScoreboard";
import { MatchSetup } from "../components/zk/MatchSetup";
import { MatchCommitMove } from "../components/zk/MatchCommitMove";
import { OnboardingOverlay } from "../components/zk/OnboardingOverlay";
import { AccreditationPanel } from "../components/zk/AccreditationPanel";
import {
  ZKStepIndicator,
  deriveZKStep,
} from "../components/zk/ZKStepIndicator";
import { StickManScene } from "../components/zk/StickManScene";
import { WalletSetupHelper } from "../components/WalletSetupHelper";
import ConnectAccount from "../components/ConnectAccount";
import { useAchievementToast } from "../components/ui/AchievementToast";
import { useMascot } from "../components/MascotContext";
import { getUnlockedAchievements } from "../components/ui/AchievementBadge";
import AudioManager from "../components/AudioManager";
import "../styles/tournament.css";
import "../styles/zk.css";

type ViewState =
  | { type: "lobby" }
  | { type: "create" }
  | { type: "matchSetup" }
  | { type: "join"; gameId: number; hostAddress: string; stake: string }
  | { type: "game"; gameId: number }
  | { type: "match"; matchId: number; gameId: number; role: "p1" | "p2" }
  | {
      type: "matchCommit";
      matchId: number;
      gameId: number;
      role: "p1" | "p2";
      phase: "startNext" | "joinNext" | "rematch";
    };

/** A counter panel — the flat surface game facts sit on. */
const CardDiv: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}> = ({ children, style, className }) => (
  <div
    className={className ? `zk-panel ${className}` : "zk-panel"}
    style={style}
  >
    {children}
  </div>
);

export const ZKGamePage: React.FC = () => {
  const navigate = useNavigate();
  const { address } = useWallet();
  const { unlock, milestones } = useFirstRun();
  const { react: mascotReact } = useMascot();
  const {
    fetchGame,
    currentGame,
    cancelGame,
    claimRefund,
    fetchMatch,
    currentMatch,
    isLoading: txLoading,
  } = useZKDilemma();

  const [view, setView] = useState<ViewState>({ type: "lobby" });
  const [opponentJoined, setOpponentJoined] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const prevStatusRef = useRef<string | undefined>(undefined);
  const prevAchievementsRef = useRef<string[]>(getUnlockedAchievements());
  const { toastElement, showAchievement } = useAchievementToast();

  // Bring the reveal card into view once per game when both commits land
  const revealCardRef = useRef<HTMLDivElement | null>(null);
  const revealScrolledFor = useRef<number | null>(null);
  useEffect(() => {
    if (
      view.type === "game" &&
      currentGame?.status === "BothCommitted" &&
      revealScrolledFor.current !== view.gameId
    ) {
      revealScrolledFor.current = view.gameId;
      revealCardRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [view, currentGame?.status]);

  // Pending match setup params (bestOf, stake) captured from MatchSetup,
  // passed through to the CommitMove flow which submits the first round.
  const [pendingMatchSetup, setPendingMatchSetup] = useState<{
    bestOf: number;
    stake: string;
  } | null>(null);

  // Unlock wallet milestone when address appears + mascot reaction
  useEffect(() => {
    if (address) {
      unlock("connected_wallet");
      mascotReact("wallet_connected");
    }
  }, [address, unlock, mascotReact]);

  // Mascot reacts to game resolution
  const prevResolvedRef = useRef(false);
  useEffect(() => {
    if (!currentGame) return;
    const isResolved = currentGame.status === "Resolved";
    if (isResolved && !prevResolvedRef.current) {
      prevResolvedRef.current = true;
      // Determine outcome from moves
      const myMove =
        address === currentGame.player1 ? currentGame.move1 : currentGame.move2;
      const theirMove =
        address === currentGame.player1 ? currentGame.move2 : currentGame.move1;
      if (myMove === "C" && theirMove === "C") {
        mascotReact("mutual_cooperation");
      } else if (myMove === "D" && theirMove === "D") {
        mascotReact("mutual_defection");
      } else if (myMove === "D" && theirMove === "C") {
        mascotReact("betrayed_opponent");
      } else if (myMove === "C" && theirMove === "D") {
        mascotReact("betrayed_by_opponent");
      }
    } else if (!isResolved) {
      prevResolvedRef.current = false;
    }
  }, [currentGame, address, mascotReact]);

  // Watch for newly unlocked achievements and show toast
  useEffect(() => {
    const checkInterval = setInterval(() => {
      const current = getUnlockedAchievements();
      const newOnes = current.filter(
        (id) => !prevAchievementsRef.current.includes(id),
      );
      if (newOnes.length > 0) {
        prevAchievementsRef.current = current;
        // Import ACHIEVEMENTS dynamically to show toast
        void import("../components/ui/AchievementBadge").then(
          ({ ACHIEVEMENTS }) => {
            for (const id of newOnes) {
              const ach = ACHIEVEMENTS[id];
              if (ach) showAchievement(ach);
            }
          },
        );
      }
    }, 1000);
    return () => clearInterval(checkInterval);
  }, [showAchievement]);

  // Detect opponent joining: status transitions from AwaitingPlayer2 -> BothCommitted
  useEffect(() => {
    if (!currentGame) return;
    const prev = prevStatusRef.current;
    const curr = currentGame.status;
    prevStatusRef.current = curr;
    if (prev === "AwaitingPlayer2" && curr === "BothCommitted") {
      setOpponentJoined(true);
      try {
        AudioManager.getInstance().playSound("click");
      } catch {
        /* audio not available */
      }
      const timer = setTimeout(() => setOpponentJoined(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [currentGame]);

  const handleCopyGameLink = useCallback((gameId: number) => {
    const link = `https://latep.trustfall.xyz/play/${gameId}`;
    try {
      void navigator.clipboard.writeText(link).then(() => {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      });
    } catch {
      /* clipboard not available */
    }
  }, []);

  // Poll game state when viewing a game or match
  useEffect(() => {
    if (view.type !== "game" && view.type !== "join" && view.type !== "match") {
      return;
    }
    const id = view.gameId;
    const poll = setInterval(() => {
      void fetchGame(id);
      if (view.type === "match") {
        void fetchMatch(view.matchId);
      }
    }, 5000);
    return () => clearInterval(poll);
  }, [view, fetchGame, fetchMatch]);

  // Fetch game/match data when entering game or match view
  useEffect(() => {
    if (view.type === "game") {
      void fetchGame(view.gameId);
    } else if (view.type === "match") {
      void fetchGame(view.gameId);
      void fetchMatch(view.matchId);
    }
  }, [view, fetchGame, fetchMatch]);

  const handleSelectGame = useCallback((gameId: number) => {
    setView({ type: "game", gameId });
  }, []);

  const handleCreateGame = useCallback(() => {
    setView({ type: "create" });
  }, []);

  const handleJoinGame = useCallback(
    (gameId: number, hostAddress: string, stake: string) => {
      setView({ type: "join", gameId, hostAddress, stake });
    },
    [],
  );

  const handleCommitComplete = useCallback(
    (gameId: number) => {
      const wasFirstGame = !milestones.first_zk_game;
      unlock("first_zk_game");
      if (wasFirstGame) {
        mascotReact("first_game");
      }
      setView({ type: "game", gameId });
    },
    [unlock, mascotReact, milestones.first_zk_game],
  );

  const handleBackToLobby = useCallback(() => {
    setView({ type: "lobby" });
  }, []);

  const handlePlayAgain = useCallback(() => {
    setView({ type: "create" });
  }, []);

  // --- Match handlers ---

  const handleCreateMatch = useCallback(() => {
    setView({ type: "matchSetup" });
  }, []);

  const handleMatchSetupConfirm = useCallback(
    (bestOf: number, stake: string) => {
      setPendingMatchSetup({ bestOf, stake });
      // Go to the create-game commit flow; the first round is created as
      // part of create_match. We intercept completion to call createMatch.
      setView({ type: "create" });
    },
    [],
  );

  const handleMatchSetupBack = useCallback(() => {
    setView({ type: "lobby" });
  }, []);

  const handleStartNextRound = useCallback(
    (matchId: number) => {
      if (!currentMatch) return;
      setView({
        type: "matchCommit",
        matchId,
        gameId: currentMatch.current_game_id,
        role: "p1",
        phase: "startNext",
      });
    },
    [currentMatch],
  );

  const handleRematch = useCallback(() => {
    if (!currentMatch) return;
    if (view.type !== "match") return;
    // Pass the old match id; MatchCommitMove uses it for the rematch contract
    // call. handleMatchCommitDone uses the new id from onComplete to transition.
    setView({
      type: "matchCommit",
      matchId: view.matchId,
      gameId: 0,
      role: currentMatch.player1 === address ? "p1" : "p2",
      phase: "rematch",
    });
  }, [currentMatch, address, view]);

  const handleMatchCommitDone = useCallback(
    async (newGameId: number, newMatchId?: number) => {
      if (view.type !== "matchCommit") return;
      const { role } = view;
      // For rematch, a new match is created with a new id.
      const targetMatchId = newMatchId ?? view.matchId;
      await fetchMatch(targetMatchId);
      setView({
        type: "match",
        matchId: targetMatchId,
        gameId: newGameId,
        role,
      });
    },
    [view, fetchMatch],
  );

  // If viewing a specific game
  if (view.type === "game" && currentGame) {
    const bothRevealed =
      currentGame.move1 !== null && currentGame.move2 !== null;
    const isResolved =
      currentGame.status === "Resolved" ||
      currentGame.status === "Forfeited" ||
      currentGame.status === "Cancelled";
    const myCommitDone =
      address === currentGame.player1
        ? currentGame.move1 !== null || currentGame.status === "BothCommitted"
        : currentGame.move2 !== null || currentGame.status === "BothCommitted";
    const step = deriveZKStep(currentGame.status, myCommitDone, bothRevealed);
    const nextAction =
      step === "commit"
        ? "pick your move below, then press Let go — your proof seals it"
        : step === "waiting"
          ? "nothing to press — your opponent is still committing"
          : step === "reveal"
            ? "press Show My Hand below — your secret is already filled in"
            : bothRevealed
              ? "press Resolve the Landing to settle the payout"
              : undefined;

    // Show game result view if resolved or both revealed
    if (isResolved) {
      return (
        <div className="zk-page tf-fade-in-up">
          <GameResult
            gameId={view.gameId}
            gameState={currentGame}
            onBack={handleBackToLobby}
            onPlayAgain={handlePlayAgain}
          />
          {toastElement}
        </div>
      );
    }

    return (
      <div className="zk-page tf-fade-in-up">
        {/* Unified header + step indicator */}
        <ZKStepIndicator
          step={step}
          nextAction={nextAction}
          gameId={view.gameId}
          onBack={handleBackToLobby}
          detail={
            currentGame.status === "AwaitingPlayer2"
              ? "Waiting for opponent to join and commit"
              : currentGame.status === "BothCommitted"
                ? "Both moves locked in — reveal now!"
                : undefined
          }
        />

        {/* Stick-man visualization */}
        <StickManScene
          step={step}
          stake={Number(currentGame.stake) / 10_000_000}
        />

        {/* Game status card — facts on the counter, "you" in your colour */}
        <CardDiv className="zk-panel--centred">
          <h4 className="zk-section-title">
            {currentGame.status === "AwaitingPlayer2"
              ? "Waiting for an opponent to join"
              : currentGame.status === "BothCommitted"
                ? "Both moves are sealed — time to reveal"
                : `Game ${currentGame.status}`}
          </h4>

          {/* Opponent joined — words and a rule, not a glow */}
          {opponentJoined && (
            <p className="zk-joined">Opponent joined — both moves sealed.</p>
          )}

          <dl className="zk-grid">
            <div>
              <dt>Player 1</dt>
              <dd className={address === currentGame.player1 ? "zk-you" : ""}>
                {currentGame.player1.slice(0, 8)}…
                {address === currentGame.player1 && " (you)"}
              </dd>
            </div>
            <div>
              <dt>Player 2</dt>
              <dd className={address === currentGame.player2 ? "zk-you" : ""}>
                {currentGame.player2
                  ? `${currentGame.player2.slice(0, 8)}…${address === currentGame.player2 ? " (you)" : ""}`
                  : "—"}
              </dd>
            </div>
            <div>
              <dt>Stake</dt>
              <dd>
                {(BigInt(currentGame.stake) / BigInt(10_000_000)).toString()}{" "}
                XLM
              </dd>
            </div>
            <div>
              <dt>Moves</dt>
              <dd>
                P1 {currentGame.move1 ? "sealed" : "waiting"} · P2{" "}
                {currentGame.move2 ? "sealed" : "waiting"}
              </dd>
            </div>
          </dl>
        </CardDiv>

        {/* Reveal move section (when BothCommitted) */}
        {currentGame.status === "BothCommitted" && (
          <div ref={revealCardRef}>
            <RevealMove
              gameId={view.gameId}
              gameState={currentGame}
              onRevealed={() => {
                void fetchGame(view.gameId);
              }}
            />
          </div>
        )}

        {/* Refund option when both players timeout on reveal */}
        {currentGame.status === "BothCommitted" &&
          !bothRevealed &&
          (() => {
            const now = Math.floor(Date.now() / 1000);
            const deadline = Number(currentGame.reveal_deadline);
            const canRefund = now > deadline && deadline > 0;
            if (!canRefund) return null;
            return (
              <CardDiv className="zk-panel--centred">
                <p className="zk-lede">
                  The reveal deadline passed and neither player revealed.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    void claimRefund(view.gameId).then(() => {
                      handleBackToLobby();
                    });
                  }}
                  disabled={txLoading}
                  className="till-button"
                >
                  {txLoading ? "Processing…" : "Claim refund (split escrow)"}
                </button>
              </CardDiv>
            );
          })()}

        {/* If still awaiting player 2 and this is player 1 */}
        {currentGame.status === "AwaitingPlayer2" &&
          address === currentGame.player1 &&
          (() => {
            const now = Math.floor(Date.now() / 1000);
            const deadline = Number(currentGame.commit_deadline);
            const canCancel = now > deadline && deadline > 0;
            const timeLeft = deadline > 0 ? Math.max(0, deadline - now) : 0;
            return (
              <CardDiv className="zk-panel--centred">
                <p className="zk-section-title">Waiting for an opponent…</p>

                {/* The game id, printed big — it's the thing you share. */}
                <div className="zk-gameid">
                  <span className="zk-gameid__label">Share this game id</span>
                  <span className="zk-gameid__value">#{view.gameId}</span>
                </div>

                <div className="zk-actions zk-panel__actions">
                  <button
                    type="button"
                    className="till-button"
                    onClick={() => handleCopyGameLink(view.gameId)}
                  >
                    {copiedLink ? "Link copied" : "Copy game link"}
                  </button>
                </div>

                <p className="zk-lede">
                  {canCancel
                    ? "Commit deadline passed. You can cancel to reclaim your stake."
                    : `Time remaining for opponent: ${Math.floor(timeLeft / 60)}m ${timeLeft % 60}s`}
                </p>
                {canCancel && (
                  <button
                    type="button"
                    onClick={() => {
                      void cancelGame(view.gameId).then(() => {
                        handleBackToLobby();
                      });
                    }}
                    disabled={txLoading}
                    className="till-button zk-row__btn"
                  >
                    {txLoading ? "Cancelling…" : "Cancel and reclaim stake"}
                  </button>
                )}
              </CardDiv>
            );
          })()}

        {/* Resolve button if both revealed */}
        {currentGame.status === "BothCommitted" && bothRevealed && (
          <CardDiv className="zk-panel--centred">
            <p className="zk-section-title">
              Both players revealed — resolve to settle the round.
            </p>
            <GameResult
              gameId={view.gameId}
              gameState={currentGame}
              onBack={handleBackToLobby}
              onPlayAgain={handlePlayAgain}
            />
          </CardDiv>
        )}

        {/* If awaiting player 2 and spectator */}
        {currentGame.status === "AwaitingPlayer2" &&
          address !== currentGame.player1 && (
            <CardDiv className="zk-panel--centred">
              <p className="zk-lede">
                This round is waiting for a second player.
              </p>
              <button
                type="button"
                onClick={() =>
                  void handleJoinGame(
                    view.gameId,
                    currentGame.player1,
                    currentGame.stake,
                  )
                }
                disabled={!address}
                className="till-button till-button--primary"
              >
                Join this round
              </button>
            </CardDiv>
          )}

        {/* Error state if game not found */}
        {!currentGame && (
          <CardDiv className="zk-panel--centred">
            <p className="zk-error">Game not found.</p>
            <button
              type="button"
              onClick={handleBackToLobby}
              className="till-button"
            >
              ← Back to lobby
            </button>
          </CardDiv>
        )}
        {toastElement}
      </div>
    );
  }

  // If viewing a specific game but no data loaded yet
  if (view.type === "game" && !currentGame) {
    return (
      <div className="zk-loading">
        <p>Loading game…</p>
      </div>
    );
  }

  // Match setup flow
  if (view.type === "matchSetup") {
    return (
      <div className="zk-page tf-fade-in-up">
        <MatchSetup
          onCreateMatch={handleMatchSetupConfirm}
          onBack={handleMatchSetupBack}
        />
        {toastElement}
      </div>
    );
  }

  // Match commit flow (create/join/startNext/joinNext/rematch)
  if (view.type === "matchCommit") {
    const phase =
      view.phase === "rematch"
        ? "rematch"
        : view.phase === "startNext"
          ? "startNext"
          : view.phase === "joinNext"
            ? "joinNext"
            : view.role === "p1"
              ? "create"
              : "join";
    return (
      <div className="zk-page tf-fade-in-up">
        <MatchCommitMove
          phase={phase}
          matchId={view.matchId}
          gameId={view.gameId || undefined}
          bestOf={pendingMatchSetup?.bestOf}
          stake={pendingMatchSetup?.stake}
          onComplete={(newGameId, newMatchId) => {
            void handleMatchCommitDone(newGameId, newMatchId);
          }}
          onBack={handleBackToLobby}
        />
        {toastElement}
      </div>
    );
  }

  // Match view — scoreboard above the current round's game view
  if (view.type === "match" && currentMatch) {
    const bothRevealed =
      currentGame?.move1 !== null && currentGame?.move2 !== null;
    const isRoundResolved =
      currentGame?.status === "Resolved" ||
      currentGame?.status === "Forfeited" ||
      currentGame?.status === "Cancelled";

    const matchCompleted = currentMatch.status === "Completed";
    const matchCancelled = currentMatch.status === "Cancelled";
    const awaitingNextRound =
      currentMatch.status === "AwaitingNextRound" && isRoundResolved;

    const roundStep = currentGame
      ? deriveZKStep(
          currentGame.status,
          address === currentGame.player1
            ? currentGame.move1 !== null ||
                currentGame.status === "BothCommitted"
            : currentGame.move2 !== null ||
                currentGame.status === "BothCommitted",
          bothRevealed,
        )
      : "commit";
    const roundNextAction =
      roundStep === "commit"
        ? "pick your move below, then press Let go — your proof seals it"
        : roundStep === "waiting"
          ? "nothing to press — your opponent is still committing"
          : roundStep === "reveal"
            ? "press Show My Hand below — your secret is already filled in"
            : roundStep === "resolve"
              ? "press Resolve the Landing to settle the payout"
              : undefined;

    return (
      <div className="zk-page tf-fade-in-up">
        {/* Unified header + step indicator for current round */}
        {currentGame && !matchCompleted && !matchCancelled ? (
          <ZKStepIndicator
            step={roundStep}
            nextAction={roundNextAction}
            gameId={view.matchId}
            onBack={handleBackToLobby}
            detail={
              currentGame.status === "AwaitingPlayer2"
                ? "Waiting for opponent to join and commit"
                : currentGame.status === "BothCommitted"
                  ? "Both moves locked in — reveal now!"
                  : undefined
            }
          />
        ) : (
          <ZKStepIndicator
            step="resolve"
            gameId={view.matchId}
            onBack={handleBackToLobby}
            detail={matchCompleted ? "Match complete" : undefined}
          />
        )}

        {/* Scoreboard */}
        <MatchScoreboard
          match={currentMatch}
          onStartNextRound={() => handleStartNextRound(view.matchId)}
        />

        {/* Completed match: winner + rematch */}
        {matchCompleted && (
          <CardDiv className="zk-panel--centred">
            <p className="zk-section-title">
              Match complete — start a new one with the same opponent, or head
              back.
            </p>
            <div className="zk-actions zk-panel__actions">
              <button
                type="button"
                className="till-button till-button--primary"
                onClick={handleRematch}
              >
                Rematch
              </button>
              <button
                type="button"
                className="till-button"
                onClick={handleBackToLobby}
              >
                ← Back to lobby
              </button>
            </div>
          </CardDiv>
        )}

        {/* Cancelled match */}
        {matchCancelled && (
          <CardDiv className="zk-panel--centred">
            <p className="zk-error">This match was cancelled.</p>
            <button
              type="button"
              className="till-button"
              onClick={handleBackToLobby}
            >
              ← Back to lobby
            </button>
          </CardDiv>
        )}

        {/* Awaiting next round: commit next round prompt */}
        {awaitingNextRound && !matchCompleted && (
          <CardDiv className="zk-panel--centred">
            {view.role === "p1" ? (
              <>
                <p className="zk-lede">
                  Round resolved. Commit your next move to start round{" "}
                  {currentMatch.current_round + 1}.
                </p>
                <button
                  type="button"
                  className="till-button till-button--primary"
                  onClick={() => handleStartNextRound(view.matchId)}
                >
                  Commit next round
                </button>
              </>
            ) : (
              <p className="zk-lede">
                Waiting for your opponent to start the next round…
              </p>
            )}
          </CardDiv>
        )}

        {/* Active round: show the game view inline */}
        {!isRoundResolved &&
          !matchCompleted &&
          !matchCancelled &&
          currentGame && (
            <>
              <CardDiv className="zk-panel--centred">
                <h4 className="zk-section-title">
                  Round {currentMatch.current_round} — Game #
                  {currentMatch.current_game_id}
                </h4>
                {opponentJoined && (
                  <p className="zk-joined">
                    Opponent joined — both moves sealed.
                  </p>
                )}
                <dl className="zk-grid">
                  <div>
                    <dt>Player 1</dt>
                    <dd
                      className={
                        address === currentGame.player1 ? "zk-you" : ""
                      }
                    >
                      {currentGame.player1.slice(0, 8)}…
                      {address === currentGame.player1 && " (you)"}
                    </dd>
                  </div>
                  <div>
                    <dt>Player 2</dt>
                    <dd
                      className={
                        address === currentGame.player2 ? "zk-you" : ""
                      }
                    >
                      {currentGame.player2
                        ? `${currentGame.player2.slice(0, 8)}…${address === currentGame.player2 ? " (you)" : ""}`
                        : "—"}
                    </dd>
                  </div>
                </dl>
              </CardDiv>

              {/* Reveal move section */}
              {currentGame.status === "BothCommitted" && (
                <RevealMove
                  gameId={view.gameId}
                  gameState={currentGame}
                  onRevealed={() => {
                    void fetchGame(view.gameId);
                  }}
                />
              )}

              {/* Resolve / result when both revealed */}
              {currentGame.status === "BothCommitted" && bothRevealed && (
                <div className="zk-result-slot">
                  <GameResult
                    gameId={view.gameId}
                    gameState={currentGame}
                    onBack={handleBackToLobby}
                    onPlayAgain={() => {
                      void fetchMatch(view.matchId);
                      void fetchGame(view.gameId);
                    }}
                  />
                </div>
              )}
            </>
          )}
        {toastElement}
      </div>
    );
  }

  // Match view loading state
  if (view.type === "match" && !currentMatch) {
    return (
      <div className="zk-loading">
        <p>Loading match…</p>
      </div>
    );
  }

  // Create game flow
  if (view.type === "create") {
    // If we came from MatchSetup, use the match commit flow instead.
    if (pendingMatchSetup) {
      return (
        <div className="zk-page tf-fade-in-up">
          <MatchCommitMove
            phase="create"
            matchId={0}
            bestOf={pendingMatchSetup.bestOf}
            stake={pendingMatchSetup.stake}
            onComplete={(newGameId, newMatchId) => {
              setPendingMatchSetup(null);
              if (newMatchId) {
                setView({
                  type: "match",
                  matchId: newMatchId,
                  gameId: newGameId,
                  role: "p1",
                });
              } else {
                setView({ type: "game", gameId: newGameId });
              }
            }}
            onBack={() => {
              setPendingMatchSetup(null);
              handleBackToLobby();
            }}
          />
          {toastElement}
        </div>
      );
    }
    return (
      <div className="zk-page tf-fade-in-up">
        <ZKStepIndicator
          step="commit"
          onBack={handleBackToLobby}
          nextAction="pick your move below, then press Let go — your proof seals it"
        />
        <CommitMove
          mode="create"
          onComplete={handleCommitComplete}
          onBack={handleBackToLobby}
        />
      </div>
    );
  }

  // Join game flow
  if (view.type === "join") {
    return (
      <div className="zk-page tf-fade-in-up">
        <ZKStepIndicator
          step="commit"
          gameId={view.gameId}
          onBack={handleBackToLobby}
          nextAction="pick your move below, then press Let go — your proof seals it"
        />
        <CommitMove
          mode="join"
          gameId={view.gameId}
          hostAddress={view.hostAddress}
          stake={view.stake}
          onComplete={handleCommitComplete}
          onBack={handleBackToLobby}
        />
      </div>
    );
  }

  // Lobby
  return (
    <div className="zk-page tf-fade-in-up">
      <OnboardingOverlay />

      {/* Wallet setup helper — shows when wallet not connected or not funded */}
      <WalletSetupHelper />

      {/* Connect prompt (only if wallet helper didn't cover it) */}
      {!address && (
        <div className="zk-panel zk-panel--centred zk-setup">
          <ConnectAccount />
        </div>
      )}

      <div className="zk-head">
        <div />
        <button
          type="button"
          onClick={() => void navigate("/")}
          className="till-button"
        >
          ← Back to tutorial
        </button>
      </div>

      <GameLobby
        onSelectGame={handleSelectGame}
        onCreateGame={handleCreateGame}
        onCreateMatch={handleCreateMatch}
      />

      <AccreditationPanel />

      {toastElement}
    </div>
  );
};
