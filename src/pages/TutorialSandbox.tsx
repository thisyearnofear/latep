/**
 * TutorialSandbox — Interactive Prisoner's Dilemma vs AI strategies
 *
 * Extracted from the former GameSlide.tsx (1,381 lines) which embedded
 * three game modes as tabs. Now a standalone page at /learn/play focused
 * solely on the tutorial (vs AI) experience.
 *
 * Workbench layout (ticket A5): settings on a straight receipt in the left
 * column, the scene in the main column, and the move history as a strip of
 * round receipts joined by the thread — with a compact table toggle for
 * long sessions.
 */

import React, { useMemo, useRef, useState } from "react";
import {
  VeniceAIService,
  type GameContext,
} from "../components/ai/VeniceAIService";
import { AI_PERSONAS } from "../components/ai/AIPersonas";
import AudioManager from "../components/AudioManager";
import {
  TrustStage,
  type TrustStageState,
} from "../components/visual/TrustStage";
import { useFirstRun } from "../hooks/useFirstRun";
import { usePracticeRecord } from "../hooks/usePracticeRecord";
import { useMascot } from "../components/MascotContext";
import {
  createStrategy,
  getStrategyInfo,
  ALL_STRATEGY_IDS,
  type IteratedStrategy,
  type StrategyId,
  type GameMove,
  type PayoffMatrix,
  calculatePayoff,
  NC_DEFAULT,
} from "../util/strategies";
import {
  MAX_DRAWN_TRUST,
  MOVE_HELPER,
  MOVE_LABEL,
  getOutcome,
} from "../content/vocabulary";
import { RoundReceipt } from "../components/receipt/RoundReceipt";
import { Thread } from "../components/receipt/Thread";
import { primitiveForRound } from "../components/receipt/helpers";
import { PayoffMatrixEditor } from "../components/slides/PayoffMatrixEditor";
import { StrategyInspector } from "../components/slides/StrategyInspector";
import "../styles/learning.css";
import "../styles/tournament.css";
import "../styles/sandbox.css";

interface RoundRecord {
  round: number;
  playerMove: GameMove;
  aiMove: GameMove;
  playerPayout: number;
  aiPayout: number;
  outcome: "caught" | "betrayed" | "exploited" | "mutual-destruction";
  noiseEvent: { player: boolean; opponent: boolean };
}

interface AIPersona {
  name: string;
  personality: string;
}

/** Rounds per autoplay batch — the same count that braids the thread fully. */
const AUTO_ROUNDS = MAX_DRAWN_TRUST;
/** Slightly longer than the receipt feed so each round prints visibly. */
const AUTO_ROUND_GAP_MS = 850;

export const TutorialSandbox: React.FC = () => {
  const { unlock, milestones } = useFirstRun();
  const { react: mascotReact } = useMascot();
  const [move, setMove] = useState<string>("");
  const [stake, setStake] = useState<string>("1");
  const [aiStrategyId, setAiStrategyId] = useState<StrategyId>("tft");
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [showTutor, setShowTutor] = useState(false);
  const [txError, setTxError] = useState<string>("");
  const [rounds, setRounds] = useState<RoundRecord[]>([]);
  const [showSummary, setShowSummary] = useState(false);
  const [payoffMatrix, setPayoffMatrix] = useState<PayoffMatrix>(NC_DEFAULT);
  const [noise, setNoise] = useState(0);
  const [showPayoffEditor, setShowPayoffEditor] = useState(false);
  const [historyView, setHistoryView] = useState<"receipts" | "table">(
    "receipts",
  );
  const [inspectedStrategy, setInspectedStrategy] = useState<StrategyId | null>(
    null,
  );
  const { recordRound } = usePracticeRecord();

  const strategyRef = useRef<IteratedStrategy>(createStrategy("tft"));
  const [currentStrategyId, setCurrentStrategyId] = useState<StrategyId>("tft");

  const [aiPersona] = useState<AIPersona>(() => {
    const fallback: AIPersona = {
      name: "The Tutor",
      personality: "Educational and supportive guide",
    };
    try {
      const personas = Object.values(AI_PERSONAS);
      const selected = personas[Math.floor(Math.random() * personas.length)];
      if (selected && "name" in selected) {
        return {
          name: selected.name,
          personality: selected.personality,
        };
      }
      return fallback;
    } catch {
      return fallback;
    }
  });
  const [aiMessage, setAiMessage] = useState<string>("");
  const veniceService = VeniceAIService.getInstance();

  const trustAltitude = useMemo(() => {
    let altitude = 0;
    for (const r of rounds) {
      if (r.playerMove === "C" && r.aiMove === "C") altitude++;
      else altitude = 0;
    }
    return altitude;
  }, [rounds]);

  const cumulativePlayer = useMemo(
    () => rounds.reduce((sum, r) => sum + r.playerPayout, 0),
    [rounds],
  );
  const cumulativeAI = useMemo(
    () => rounds.reduce((sum, r) => sum + r.aiPayout, 0),
    [rounds],
  );

  const audioManager = AudioManager.getInstance();

  const sessionAnalysis = useMemo(() => {
    const wins = rounds.filter((r) => r.playerPayout > r.aiPayout).length;
    const losses = rounds.filter((r) => r.playerPayout < r.aiPayout).length;
    const ties = rounds.filter((r) => r.playerPayout === r.aiPayout).length;
    const cooperationRate =
      rounds.length > 0
        ? (rounds.filter((r) => r.playerMove === "C").length / rounds.length) *
          100
        : 0;
    const maxAltitude = rounds.reduce((max, _r, i) => {
      let alt = 0;
      for (let j = 0; j <= i; j++) {
        if (rounds[j].playerMove === "C" && rounds[j].aiMove === "C") alt++;
        else alt = 0;
      }
      return Math.max(max, alt);
    }, 0);
    return {
      wins,
      losses,
      ties,
      cooperationRate,
      maxAltitude,
      total: rounds.length,
    };
  }, [rounds]);

  const generateAIFeedback = async (roundData: RoundRecord) => {
    const context: GameContext = {
      playerMove: roundData.playerMove,
      outcome:
        roundData.outcome === "exploited"
          ? "win"
          : roundData.outcome === "betrayed"
            ? "lose"
            : "tie",
      stake: parseFloat(stake) || 1,
      history: rounds.map((r) => ({
        move: r.playerMove === "C" ? "cooperate" : "defect",
        outcome:
          r.outcome === "exploited"
            ? "win"
            : r.outcome === "betrayed"
              ? "lose"
              : "tie",
        stake: parseFloat(stake) || 1,
        playerPayout: r.playerPayout,
        aiPayout: r.aiPayout,
        aiStrategy: strategyRef.current.name,
      })),
    };
    const requestType =
      roundData.outcome === "exploited" ? "encouragement" : "advice";
    try {
      const feedback = await veniceService.generateTutorAdvice(
        aiPersona.name,
        aiPersona.personality,
        context,
        requestType,
      );
      setAiMessage(feedback);
    } catch {
      const fallbacks: Record<string, string> = {
        win: "Great choice! You're learning the dynamics of cooperation.",
        lose: "Interesting outcome. Consider how trust affects your decisions.",
        advice:
          "Think about the long-term benefits of cooperation vs. short-term gains.",
        encouragement: "Nice play! Each round teaches you something new.",
      };
      setAiMessage(fallbacks[requestType] || fallbacks.advice);
    }
  };

  const handleStrategyChange = (id: StrategyId) => {
    setAiStrategyId(id);
    if (id !== currentStrategyId) {
      strategyRef.current = createStrategy(id);
      setCurrentStrategyId(id);
      setRounds([]);
      setResult("");
      setMove("");
      setAiMessage("");
      audioManager.playSound("click");
    }
  };

  /** Resolve one round against the strategy and current noise/stake. */
  const resolveOne = (chosen: string, historyLength: number): RoundRecord => {
    let playerMove: GameMove = chosen === "cooperate" ? "C" : "D";
    const stakeAmount = parseFloat(stake) || 1;
    let aiMove = strategyRef.current.play();
    const noiseEvent = { player: false, opponent: false };
    if (Math.random() < noise) {
      playerMove = playerMove === "C" ? "D" : "C";
      noiseEvent.player = true;
    }
    if (Math.random() < noise) {
      aiMove = aiMove === "C" ? "D" : "C";
      noiseEvent.opponent = true;
    }
    const { playerPayout, aiPayout } = calculatePayoff(
      playerMove,
      aiMove,
      stakeAmount,
      payoffMatrix,
    );
    strategyRef.current.remember(aiMove, playerMove);
    const outcome: RoundRecord["outcome"] =
      playerMove === "C" && aiMove === "C"
        ? "caught"
        : playerMove === "C" && aiMove === "D"
          ? "betrayed"
          : playerMove === "D" && aiMove === "C"
            ? "exploited"
            : "mutual-destruction";
    const record: RoundRecord = {
      round: historyLength + 1,
      playerMove,
      aiMove,
      playerPayout,
      aiPayout,
      outcome,
      noiseEvent,
    };
    // The round has settled in app state — this is where the outcome is
    // decided for both playRound and autoPlay, before any animation or
    // feedback runs (design.md §7: recorded by state, never by animation).
    recordRound({
      source: "sandbox",
      yourMove: record.playerMove,
      partnerMove: record.aiMove,
    });
    return record;
  };

  /** The aria-live line says what the receipt prints, in the same words. */
  const describeRound = (record: RoundRecord) => {
    const word = getOutcome(record.playerMove, record.aiMove).word;
    const noiseFlipped = record.noiseEvent.player || record.noiseEvent.opponent;
    return `Round ${record.round}: ${word}. You chose ${MOVE_LABEL[record.playerMove]}, ${strategyRef.current.name} chose ${MOVE_LABEL[record.aiMove]}.${noiseFlipped ? " The wind caught someone — a move was flipped." : ""}`;
  };

  const reactTo = (record: RoundRecord) => {
    if (record.outcome === "exploited") {
      audioManager.playSound("win");
      mascotReact("betrayed_opponent");
    } else if (record.outcome === "betrayed") {
      audioManager.playSound("lose");
      mascotReact("betrayed_by_opponent");
    } else if (record.outcome === "caught") {
      audioManager.playSound("coin");
      mascotReact("mutual_cooperation");
    } else {
      audioManager.playSound("defect");
      mascotReact("mutual_defection");
    }
    audioManager.playSound(record.playerMove === "C" ? "cooperate" : "defect");
  };

  const markFirstTutorial = () => {
    const wasFirstTutorial = !milestones.played_tutorial;
    unlock("played_tutorial");
    if (wasFirstTutorial) {
      mascotReact("tutorial_complete");
    }
  };

  const playRound = () => {
    if (!move || loading) return;
    setLoading(true);
    setTxError("");
    try {
      const record = resolveOne(move, rounds.length);
      setRounds((prev) => [...prev, record]);
      reactTo(record);
      setResult(describeRound(record));
      void generateAIFeedback(record);
      markFirstTutorial();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      setTxError(`Error: ${errorMessage}`);
      audioManager.playSound("error");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Autoplay: run the chosen move for AUTO_ROUNDS rounds, one receipt feeding
   * out at a time. The loop carries its own history copy so stale `rounds`
   * state can't collide between iterations.
   */
  const autoPlay = async () => {
    if (!move || loading) return;
    setLoading(true);
    setTxError("");
    try {
      let history = rounds.slice();
      for (let i = 0; i < AUTO_ROUNDS; i++) {
        const record = resolveOne(move, history.length);
        history = [...history, record];
        setRounds(history);
        reactTo(record);
        setResult(describeRound(record));
        if (i < AUTO_ROUNDS - 1) {
          await new Promise<void>((resolve) =>
            window.setTimeout(resolve, AUTO_ROUND_GAP_MS),
          );
        }
      }
      const last = history[history.length - 1];
      if (last) void generateAIFeedback(last);
      markFirstTutorial();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      setTxError(`Error: ${errorMessage}`);
      audioManager.playSound("error");
    } finally {
      setLoading(false);
    }
  };

  const newOpponent = () => {
    strategyRef.current = createStrategy(aiStrategyId);
    setRounds([]);
    setResult("");
    setMove("");
    setAiMessage("");
    audioManager.playSound("click");
  };

  const strategyInfo = getStrategyInfo(aiStrategyId);
  const latestRound = rounds[rounds.length - 1];
  const stageState: TrustStageState =
    result && latestRound
      ? {
          phase: "outcome",
          playerMove: latestRound.playerMove,
          opponentMove: latestRound.aiMove,
        }
      : { phase: "choose" };

  return (
    <div className="sandbox">
      <header className="sandbox-head">
        <div>
          <h1 className="sandbox-title" data-vt-title>
            See how trust changes.
          </h1>
          <p className="sandbox-lede">
            Play the iterated dilemma against 9 stateful strategies. Local
            simulation — scores are practice points; no wallet or funds.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowTutor(!showTutor)}
          aria-pressed={showTutor}
          className={
            showTutor ? "till-button till-button--active" : "till-button"
          }
        >
          {showTutor ? "Tutor on" : "Tutor off"}
        </button>
      </header>

      <div className="sandbox-grid">
        <div className="sandbox-side">
          {/* Left column — the workbench settings, on a straight receipt. */}
          <aside className="sandbox-settings receipt receipt-edge">
            <p className="till-settings__title">Workbench settings</p>

            <div className="till-field">
              <label
                htmlFor="tutorial-strategy"
                className="till-field__label sandbox-label"
              >
                Opponent
              </label>
              <select
                id="tutorial-strategy"
                value={aiStrategyId}
                onChange={(e) =>
                  handleStrategyChange(e.target.value as StrategyId)
                }
                disabled={loading}
                className="sandbox-select"
              >
                {ALL_STRATEGY_IDS.map((id) => {
                  const info = getStrategyInfo(id);
                  return (
                    <option key={id} value={id}>
                      {info.name} — {info.description}
                    </option>
                  );
                })}
              </select>
              <p className="till-field__hint">{strategyInfo.description}</p>
            </div>

            <div className="till-field">
              <label
                htmlFor="tutorial-stake"
                className="till-field__label sandbox-label"
              >
                Practice stake (points)
              </label>
              <input
                id="tutorial-stake"
                value={stake}
                onChange={(e) => setStake(e.target.value || "1")}
                type="number"
                min="0.1"
                step="0.1"
                disabled={loading}
                className="payoff-input sandbox-stake"
              />
            </div>

            <div className="till-field">
              <div className="till-field__row">
                <span className="till-field__label">
                  Noise — the wind caught you
                </span>
                <span
                  className={
                    noise > 0.1
                      ? "till-field__value till-field__value--loud"
                      : "till-field__value"
                  }
                >
                  {(noise * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="0.5"
                step="0.01"
                value={noise}
                aria-label="Noise level"
                onChange={(e) => setNoise(parseFloat(e.target.value))}
                disabled={loading}
              />
              <p className="till-field__hint">
                {noise === 0
                  ? "No mistakes — your move is your move"
                  : noise < 0.05
                    ? "Rare slips — sometimes your hand slips"
                    : noise < 0.15
                      ? "Frequent mistakes — trust is harder to build"
                      : "Chaos — noise drowns out intention"}
              </p>
            </div>

            <div className="till-field">
              <button
                type="button"
                onClick={() => setShowPayoffEditor(!showPayoffEditor)}
                aria-expanded={showPayoffEditor}
                className="payoff-preset sandbox-toggle"
              >
                {showPayoffEditor ? "Hide" : "Edit"} payoff matrix
              </button>
              {showPayoffEditor && (
                <div className="sandbox-editor">
                  <PayoffMatrixEditor
                    payoffs={payoffMatrix}
                    onChange={setPayoffMatrix}
                    compact
                  />
                </div>
              )}
            </div>

            <div className="till-field">
              <button
                type="button"
                onClick={() =>
                  setInspectedStrategy(inspectedStrategy ? null : aiStrategyId)
                }
                aria-expanded={!!inspectedStrategy}
                className="payoff-preset sandbox-toggle"
              >
                {inspectedStrategy ? "Hide" : "Inspect"} {strategyInfo.name}
              </button>
            </div>
          </aside>

          {/* Inspector gets its own receipt — never nested inside settings. */}
          {inspectedStrategy && (
            <div className="sandbox-inspector">
              <StrategyInspector strategyId={inspectedStrategy} />
            </div>
          )}
        </div>

        {/* Main column — the scene and the receipts it prints. */}
        <main className="sandbox-main">
          <section className="sandbox-round" aria-label="Tutorial round">
            <div className="sandbox-round__meta">
              <span>
                Round{" "}
                {result && latestRound ? latestRound.round : rounds.length + 1}
              </span>
              <span>{strategyInfo.name}</span>
            </div>

            {/* The goal: braid the thread fully — five holds in a row. A real
                Thread drawn at the current streak height, not a meter. */}
            <div className="sandbox-goal" aria-live="polite">
              <Thread
                surface="counter"
                state={trustAltitude > 0 ? "twisted" : "loose"}
                twists={trustAltitude}
                width={80}
                height={22}
                className="sandbox-goal__thread"
              />
              <span className="sandbox-goal__text">
                {trustAltitude >= MAX_DRAWN_TRUST
                  ? "Fully braided — five holds in a row."
                  : `Braid the thread — ${trustAltitude} of ${MAX_DRAWN_TRUST} holds in a row.`}
              </span>
            </div>

            <TrustStage
              state={stageState}
              opponentLabel={strategyInfo.name}
              roundKey={rounds.length}
              trustAltitude={trustAltitude}
              noise={noise}
              noiseEvent={
                result && latestRound ? latestRound.noiseEvent : undefined
              }
            />

            {/* Move tiles */}
            <div className="trust-choices sandbox-choices">
              <div className="trust-choice">
                <button
                  type="button"
                  className="trust-btn trust-btn-primary"
                  aria-pressed={move === "cooperate"}
                  disabled={loading}
                  onClick={() => {
                    setMove("cooperate");
                    setResult("");
                    audioManager.playSound("click");
                  }}
                >
                  {MOVE_LABEL.C}
                </button>
                <span className="trust-choice-note">{MOVE_HELPER.C}</span>
              </div>
              <div className="trust-choice">
                <button
                  type="button"
                  className="trust-btn trust-btn-secondary"
                  aria-pressed={move === "defect"}
                  disabled={loading}
                  onClick={() => {
                    setMove("defect");
                    setResult("");
                    audioManager.playSound("click");
                  }}
                >
                  {MOVE_LABEL.D}
                </button>
                <span className="trust-choice-note">{MOVE_HELPER.D}</span>
              </div>
            </div>
            <p className="tutorial-selection" aria-live="polite">
              {result
                ? result
                : move
                  ? `Selected: ${move === "cooperate" ? MOVE_LABEL.C : MOVE_LABEL.D} — now press Play round below.`
                  : "Select a move first."}
            </p>

            {/* Actions */}
            <div className="learning-actions sandbox-actions">
              <button
                type="button"
                className="learning-button learning-button-primary"
                onClick={() => void playRound()}
                disabled={!move || loading}
              >
                {loading
                  ? "Playing…"
                  : !move
                    ? "Play round"
                    : `Play round — ${move === "cooperate" ? MOVE_LABEL.C : MOVE_LABEL.D}`}
              </button>
              <button
                type="button"
                className="learning-button"
                onClick={() => void autoPlay()}
                disabled={!move || loading}
              >
                {loading
                  ? "Playing…"
                  : !move
                    ? `Play ${AUTO_ROUNDS} rounds`
                    : `Play ${AUTO_ROUNDS} rounds — ${
                        move === "cooperate" ? MOVE_LABEL.C : MOVE_LABEL.D
                      }`}
              </button>
              {rounds.length > 0 && (
                <>
                  <button
                    type="button"
                    className="learning-button"
                    onClick={() => {
                      setMove("");
                      setResult("");
                      audioManager.playSound("click");
                    }}
                  >
                    Clear move
                  </button>
                  <button
                    type="button"
                    className="learning-button"
                    onClick={newOpponent}
                  >
                    New opponent
                  </button>
                  <button
                    type="button"
                    className="learning-button"
                    onClick={() => setShowSummary(!showSummary)}
                  >
                    Summary
                  </button>
                </>
              )}
            </div>

            {txError && (
              <div className="sandbox-error" role="alert">
                {txError}
              </div>
            )}

            {/* The latest round prints its receipt. Practice mode only ever
                claims points — never a transaction (honesty rules, §7). */}
            {result && latestRound && (
              <RoundReceipt
                roundNumber={latestRound.round}
                mode="practice"
                you={latestRound.playerMove}
                partner={latestRound.aiMove}
                pointsYou={latestRound.playerPayout}
                pointsPartner={latestRound.aiPayout}
                trustTwists={trustAltitude}
                primitiveId={primitiveForRound(latestRound.round, "practice")}
                learnHref="/learn"
                feeding
              >
                {latestRound.noiseEvent.player ||
                latestRound.noiseEvent.opponent ? (
                  <p className="sandbox-noise-note">
                    The wind caught{" "}
                    {latestRound.noiseEvent.player &&
                    latestRound.noiseEvent.opponent
                      ? "you both"
                      : latestRound.noiseEvent.player
                        ? "you"
                        : strategyInfo.name}{" "}
                    — a move was flipped.
                  </p>
                ) : null}
              </RoundReceipt>
            )}
          </section>

          {/* AI tutor feedback — a note from the persona, on stock. */}
          {result && aiMessage && showTutor && (
            <div className="sandbox-tutor receipt receipt-edge">
              <p className="sandbox-tutor__name">{aiPersona.name}</p>
              <p className="sandbox-tutor__message">{aiMessage}</p>
            </div>
          )}

          {/* Session summary */}
          {showSummary && rounds.length > 0 && (
            <div className="sandbox-summary receipt receipt-edge">
              <p className="till-settings__title">Session summary</p>
              <dl className="sandbox-summary__grid">
                <div>
                  <dt>Record</dt>
                  <dd>
                    {sessionAnalysis.wins}W {sessionAnalysis.losses}L{" "}
                    {sessionAnalysis.ties}T
                  </dd>
                </div>
                <div>
                  <dt>Cooperation rate</dt>
                  <dd>{sessionAnalysis.cooperationRate.toFixed(0)}%</dd>
                </div>
                <div>
                  <dt>Peak trust altitude</dt>
                  <dd>{sessionAnalysis.maxAltitude}</dd>
                </div>
                <div>
                  <dt>Your total</dt>
                  <dd>{cumulativePlayer} points</dd>
                </div>
                <div>
                  <dt>{strategyInfo.name} total</dt>
                  <dd>{cumulativeAI} points</dd>
                </div>
              </dl>
              <p className="sandbox-summary__note">
                Each round builds or breaks trust. Try different opponents to
                see how strategies change the game.
              </p>
            </div>
          )}

          {/* Move history — a strip of round receipts joined by the thread,
              with a compact table for long sessions. */}
          {rounds.length > 0 && (
            <section className="sandbox-history" aria-label="Move history">
              <div className="sandbox-history__head">
                <p className="till-stat__label">
                  Move history — {rounds.length} round
                  {rounds.length > 1 ? "s" : ""}
                </p>
                <div
                  className="sandbox-history__toggle"
                  role="group"
                  aria-label="History view"
                >
                  <button
                    type="button"
                    className={
                      historyView === "receipts"
                        ? "payoff-preset payoff-preset--active"
                        : "payoff-preset"
                    }
                    onClick={() => setHistoryView("receipts")}
                  >
                    Receipts
                  </button>
                  <button
                    type="button"
                    className={
                      historyView === "table"
                        ? "payoff-preset payoff-preset--active"
                        : "payoff-preset"
                    }
                    onClick={() => setHistoryView("table")}
                  >
                    Table
                  </button>
                </div>
              </div>

              {historyView === "receipts" ? (
                <div className="sandbox-history__strip">
                  {rounds.map((r, i) => {
                    // The thread joining receipt i-1 to receipt i carries
                    // that round's outcome state and the running twist count.
                    let twists = 0;
                    for (let j = i; j >= 0; j--) {
                      if (
                        rounds[j].playerMove === "C" &&
                        rounds[j].aiMove === "C"
                      )
                        twists++;
                      else break;
                    }
                    return (
                      <React.Fragment key={r.round}>
                        {i > 0 && (
                          <Thread
                            surface="receipt"
                            state={getOutcome(r.playerMove, r.aiMove).thread}
                            twists={twists}
                            width={72}
                            height={36}
                            className="sandbox-history__thread"
                          />
                        )}
                        <div className="sandbox-history__item">
                          <RoundReceipt
                            roundNumber={r.round}
                            mode="practice"
                            you={r.playerMove}
                            partner={r.aiMove}
                            pointsYou={r.playerPayout}
                            pointsPartner={r.aiPayout}
                            primitiveId={primitiveForRound(r.round, "practice")}
                            learnHref="/learn"
                          />
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>
              ) : (
                <div className="till-results receipt receipt-edge">
                  <table
                    className="till-results__table"
                    aria-label="Tutorial move history"
                  >
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>You</th>
                        <th>{strategyInfo.name}</th>
                        <th>You</th>
                        <th>Them</th>
                        <th>Outcome</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rounds
                        .slice()
                        .reverse()
                        .map((r) => (
                          <tr key={r.round}>
                            <td>{r.round}</td>
                            <td>{MOVE_LABEL[r.playerMove]}</td>
                            <td>{MOVE_LABEL[r.aiMove]}</td>
                            <td>{r.playerPayout}</td>
                            <td>{r.aiPayout}</td>
                            <td>{getOutcome(r.playerMove, r.aiMove).word}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                  <dl className="sandbox-history__totals">
                    <div>
                      <dt>Your total</dt>
                      <dd>{cumulativePlayer} points</dd>
                    </div>
                    <div>
                      <dt>{strategyInfo.name} total</dt>
                      <dd>{cumulativeAI} points</dd>
                    </div>
                  </dl>
                </div>
              )}
            </section>
          )}
        </main>
      </div>
    </div>
  );
};
