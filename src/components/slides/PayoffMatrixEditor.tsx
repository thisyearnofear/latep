import React, { useState } from "react";
import { type PayoffMatrix, PAYOFF_PRESETS } from "../../util/strategies";
import { MOVE_LABEL } from "../../content/vocabulary";
import "../../styles/tournament.css";

interface PayoffMatrixEditorProps {
  payoffs: PayoffMatrix;
  onChange: (payoffs: PayoffMatrix) => void;
  compact?: boolean;
}

/**
 * Interactive payoff matrix editor with preset scenarios.
 * Lets users tweak P/S/R/T values and see how it changes the game.
 * Prints inside a settings receipt — fields on the stock, not its own panel.
 */
export const PayoffMatrixEditor: React.FC<PayoffMatrixEditorProps> = ({
  payoffs,
  onChange,
  compact = false,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<string>("classic");

  const applyPreset = (presetId: string) => {
    const preset = PAYOFF_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      onChange({ ...preset.matrix });
      setSelectedPreset(presetId);
    }
  };

  const updateValue = (key: keyof PayoffMatrix, value: number) => {
    onChange({ ...payoffs, [key]: value });
    setSelectedPreset("custom");
  };

  // Check if current payoffs match a known dilemma type
  const dilemmaType = (() => {
    const { T, R, P, S } = payoffs;
    if (T > R && R > P && P > S && 2 * R > T + S)
      return { name: "Prisoner's Dilemma" };
    if (R > T && R > S && R > P) return { name: "Harmony Game" };
    if (R > T && T > P && P > S) return { name: "Stag Hunt" };
    if (T > R && R > S && S > P) return { name: "Snowdrift / Chicken" };
    return { name: "Custom" };
  })();

  const input = (key: keyof PayoffMatrix) => (
    <input
      type="number"
      value={payoffs[key]}
      onChange={(e) => updateValue(key, parseFloat(e.target.value) || 0)}
      className="payoff-input"
      aria-label={`Payoff ${key}`}
    />
  );

  return (
    <div className="payoff-editor">
      {/* Preset selector */}
      <div className="payoff-editor__presets">
        {PAYOFF_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => applyPreset(preset.id)}
            className={
              selectedPreset === preset.id
                ? "payoff-preset payoff-preset--active"
                : "payoff-preset"
            }
            title={preset.description}
          >
            {preset.name}
          </button>
        ))}
      </div>

      {/* Matrix grid: rows are your move, columns theirs. */}
      <div className="payoff-grid">
        <div className="payoff-grid__side" aria-hidden="true">
          You / them
        </div>
        <div className="payoff-grid__head">{MOVE_LABEL.C}</div>
        <div className="payoff-grid__head">{MOVE_LABEL.D}</div>

        {/* Row: you lean in */}
        <div className="payoff-grid__side">{MOVE_LABEL.C}</div>
        <div className="payoff-cell">
          {input("R")}
          <div className="payoff-cell__label">Reward</div>
        </div>
        <div className="payoff-cell">
          <div className="payoff-cell__pair">
            {input("S")}
            {input("T")}
          </div>
          <div className="payoff-cell__label">Sucker / Tempt</div>
        </div>

        {/* Row: you hold back */}
        <div className="payoff-grid__side">{MOVE_LABEL.D}</div>
        <div className="payoff-cell">
          <div className="payoff-cell__pair">
            {input("T")}
            {input("S")}
          </div>
          <div className="payoff-cell__label">Tempt / Sucker</div>
        </div>
        <div className="payoff-cell">
          {input("P")}
          <div className="payoff-cell__label">Punishment</div>
        </div>
      </div>

      {/* Dilemma type indicator */}
      <div className="payoff-editor__type">
        <p className="payoff-editor__type-name">{dilemmaType.name}</p>
        {!compact && (
          <p className="payoff-editor__type-detail">
            T={payoffs.T} R={payoffs.R} P={payoffs.P} S={payoffs.S}
            {2 * payoffs.R > payoffs.T + payoffs.S
              ? " · 2R > T+S holds"
              : " · 2R ≤ T+S — not iterated"}
          </p>
        )}
      </div>
    </div>
  );
};
