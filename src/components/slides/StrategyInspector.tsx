import React from "react";
import { getStrategyInfo, type StrategyId } from "../../util/strategies";
import "../../styles/tournament.css";

interface StrategyInspectorProps {
  strategyId: StrategyId;
}

/**
 * Explains a strategy's decision logic in plain English.
 * Educational component — helps users understand WHY each strategy
 * behaves the way it does.
 */
const STRATEGY_LOGIC: Record<
  StrategyId,
  {
    howItWorks: string;
    firstMove: string;
    strength: string;
    weakness: string;
    example: string;
  }
> = {
  tft: {
    howItWorks:
      "Starts by cooperating. Then copies whatever you did last round. You cooperate? It cooperates. You defect? It defects back.",
    firstMove: "Cooperate (trust first)",
    strength:
      "Never gets exploited twice. Retaliates immediately but forgives immediately too.",
    weakness:
      "In a noisy world, it gets stuck in endless retaliation loops — you both keep copying each other's defection.",
    example:
      "Round 1: C. You play D. Round 2: D (copies you). You play C. Round 3: C (copies you). Back to peace.",
  },
  all_c: {
    howItWorks: "Always cooperates. No matter what. Unconditional trust.",
    firstMove: "Cooperate",
    strength:
      "Creates maximum mutual benefit when paired with another cooperator.",
    weakness: "Gets brutally exploited by defectors. The ultimate sucker.",
    example: "Every round: C. Even if you defect 100 times. It never learns.",
  },
  all_d: {
    howItWorks: "Always defects. No matter what. Zero trust.",
    firstMove: "Defect",
    strength:
      "Can never be exploited. Always gets at least the punishment payoff.",
    weakness:
      "Can never achieve mutual cooperation. Dooms everyone to mutual defection.",
    example:
      "Every round: D. Even against a cooperator. It takes everything and builds nothing.",
  },
  tf2t: {
    howItWorks:
      "Like Tit-for-Tat, but it takes TWO betrayals in a row before it retaliates. One defection is forgiven.",
    firstMove: "Cooperate",
    strength:
      "Much more forgiving than TFT. Breaks out of retaliation loops caused by noise.",
    weakness:
      "Can be exploited by strategies that defect occasionally — it forgives too much.",
    example:
      "Round 1: C. You play D. Round 2: C (forgives once). You play D again. Round 3: D (now it retaliates).",
  },
  grudge: {
    howItWorks:
      "Cooperates happily... until you betray it ONCE. Then it defects forever. No forgiveness. No mercy.",
    firstMove: "Cooperate",
    strength: "Punishes betrayal severely. One strike and you're out.",
    weakness:
      "One mistake (yours or noise) ruins the relationship permanently. Cannot recover.",
    example:
      "Round 1: C. You play D. Round 2+: D forever. Even if you cooperate 1000 times after.",
  },
  pavlov: {
    howItWorks:
      "Win-Stay, Lose-Shift. If the last round went well (you both cooperated), keep doing the same thing. If it went badly, switch.",
    firstMove: "Cooperate",
    strength:
      "Recovers from noise faster than TFT. If both accidentally defect, it switches back to cooperate.",
    weakness:
      "Can be exploited by a smart defector who times their defections.",
    example:
      "Round 1: C. Both cooperate — stay. Round 2: C. You defect — it switches. Round 3: D.",
  },
  prober: {
    howItWorks:
      "Tests you with a sequence: Cooperate, Defect, Cooperate, Cooperate. If you ever retaliate during the test, it plays Tit-for-Tat. If you NEVER retaliate, it switches to Always Defect — you're a sucker.",
    firstMove: "Cooperate (testing phase)",
    strength:
      "Identifies and exploits unconditional cooperators. Adapts to your strategy.",
    weakness:
      "The test phase wastes rounds and can trigger grudges from other strategies.",
    example:
      "Rounds 1-4: C, D, C, C. If you played D at any point → TFT. If you never played D → Always Defect.",
  },
  gtft: {
    howItWorks:
      "Like Tit-for-Tat, but 10% of the time when you defect, it forgives you and cooperates anyway.",
    firstMove: "Cooperate",
    strength:
      "Breaks retaliation loops. In noisy environments, it outperforms strict TFT.",
    weakness:
      "The 10% forgiveness rate means it occasionally gets exploited. More forgiving = more vulnerable.",
    example:
      "Round 1: C. You play D. Round 2: D (usually)... but 10% chance it plays C instead (forgives).",
  },
  random: {
    howItWorks:
      "Flips a coin every round. 50% cooperate, 50% defect. No memory, no strategy, no pattern.",
    firstMove: "Random",
    strength:
      "Unpredictable. Cannot be exploited by pattern-reading strategies.",
    weakness:
      "Also can't cooperate with itself. Achieves nothing. The baseline of chaos.",
    example:
      "Every round: 50/50 coin flip. No memory of past rounds. No logic.",
  },
};

export const StrategyInspector: React.FC<StrategyInspectorProps> = ({
  strategyId,
}) => {
  const info = getStrategyInfo(strategyId);
  const logic = STRATEGY_LOGIC[strategyId];

  return (
    <div className="till-inspector receipt receipt-edge tf-fade-in-up">
      {/* Header: the pattern key and the name are the identity; the tint on
          the name ties it back to the charts. */}
      <div className="till-inspector__head">
        <span
          className={`thread-key thread-key--${info.pattern} chart-tint-${info.tint}`}
          aria-hidden="true"
        />
        <h4 className={`till-inspector__name chart-tint-${info.tint}`}>
          {info.name}
        </h4>
      </div>

      {/* How it works */}
      <div className="till-inspector__section">
        <p className="till-inspector__label">How it works</p>
        <p className="till-inspector__body">{logic.howItWorks}</p>
      </div>

      {/* First move */}
      <div className="till-inspector__section">
        <p className="till-inspector__label">First move</p>
        <p className="till-inspector__body">{logic.firstMove}</p>
      </div>

      {/* Strength + Weakness */}
      <div className="till-inspector__grid">
        <div>
          <p className="till-inspector__label">Strength</p>
          <p className="till-inspector__body">{logic.strength}</p>
        </div>
        <div>
          <p className="till-inspector__label">Weakness</p>
          <p className="till-inspector__body">{logic.weakness}</p>
        </div>
      </div>

      {/* Example */}
      <div className="till-inspector__example">
        <p className="till-inspector__label">Example</p>
        <p className="till-inspector__body">{logic.example}</p>
      </div>
    </div>
  );
};
