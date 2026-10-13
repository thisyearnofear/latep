import React, { useState } from "react";
import "../../styles/tournament.css";
import "../../styles/zk.css";

interface MatchSetupProps {
  /** Called with (bestOf, stakeXlm) when the user starts the match. */
  onCreateMatch: (bestOf: number, stake: string) => void;
  /** Return to the lobby. */
  onBack: () => void;
}

/** Stake preset options — same as CommitMove. */
const STAKE_PRESETS = ["1", "5", "10"] as const;
const RECOMMENDED_STAKE = "5";

/**
 * MatchSetup — shown in the lobby when the user clicks "Create Match".
 *
 * A form, so it prints on stock: Best-of-3 or Best-of-5 as printed tiles,
 * a stake preset row, then the start action.
 */
export const MatchSetup: React.FC<MatchSetupProps> = ({
  onCreateMatch,
  onBack,
}) => {
  const [bestOf, setBestOf] = useState<3 | 5>(3);
  const [stake, setStake] = useState<string>(RECOMMENDED_STAKE);

  const canSubmit = bestOf === 3 || bestOf === 5;

  return (
    <div className="zk-page">
      <button type="button" onClick={onBack} className="zk-back">
        ← Lobby
      </button>

      <div className="receipt receipt-edge zk-commit">
        <h3 className="zk-commit__title">Create a match</h3>
        <p className="zk-commit__lede">
          A run of rounds. First to win the majority of rounds takes the match.
        </p>

        {/* Best-of selection */}
        <p className="zk-commit__label">Match format</p>
        <div className="zk-choices">
          <button
            type="button"
            onClick={() => setBestOf(3)}
            aria-pressed={bestOf === 3}
            className={bestOf === 3 ? "zk-move zk-move--picked" : "zk-move"}
          >
            <span className="zk-move__name">Best of 3</span>
            <span className="zk-move__note">First to 2 wins</span>
          </button>
          <button
            type="button"
            onClick={() => setBestOf(5)}
            aria-pressed={bestOf === 5}
            className={bestOf === 5 ? "zk-move zk-move--picked" : "zk-move"}
          >
            <span className="zk-move__name">Best of 5</span>
            <span className="zk-move__note">First to 3 wins</span>
          </button>
        </div>

        {/* Stake presets */}
        <div className="till-field">
          <p className="zk-commit__label">Stake per round (XLM)</p>
          <div className="zk-stake-row">
            {STAKE_PRESETS.map((preset) => {
              const isSelected = stake === preset;
              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setStake(preset)}
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
            <span
              className="zk-recommended"
              title="Low enough for casual play, high enough to matter"
            >
              Recommended — {RECOMMENDED_STAKE} XLM
            </span>
          </div>
          <p className="till-field__hint">
            Stake is deposited per round. Up to {bestOf} rounds × {stake} XLM.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onCreateMatch(bestOf, stake)}
          disabled={!canSubmit}
          className="till-button till-button--primary zk-submit"
        >
          Start match
        </button>
      </div>

      <p className="zk-note">
        <strong>How matches work:</strong> you commit your first move with a
        proof. After each round resolves, player 1 starts the next round and
        player 2 joins it. First to reach the target wins takes the match.
      </p>
    </div>
  );
};
