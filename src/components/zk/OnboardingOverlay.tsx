import React, { useState } from "react";
import { MARKS } from "../marks";
import "../../styles/tournament.css";
import "../../styles/zk.css";

const STORAGE_KEY = "zk_onboarding_seen";

/**
 * One-slip onboarding shown on first visit to /play.
 * The whole commit-reveal flow as three printed lines — one click to dismiss.
 * Dismissed state persisted in localStorage.
 */
export const OnboardingOverlay: React.FC = () => {
  const [visible, setVisible] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) !== "true";
    } catch {
      return true;
    }
  });

  if (!visible) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // Ignore storage errors
    }
    setVisible(false);
  };

  const rows = [
    {
      Mark: MARKS.seal,
      title: "Stand at the edge",
      body: "Pick your move — lean in or hold back. It stays sealed where they can't see it.",
    },
    {
      Mark: MARKS.seal,
      title: "Let go — the math catches you",
      body: "Your browser proves the move is valid and binds you to it. A few seconds — that's the fall.",
    },
    {
      Mark: MARKS.handshake,
      title: "The catch or the drop",
      body: "Both players reveal. Two leans are held; a held-back partner drops someone.",
    },
  ];

  return (
    <div className="zk-scrim" onClick={dismiss}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="receipt receipt-edge zk-onboard"
        role="dialog"
        aria-label="How sealed rounds work"
      >
        <h3 className="zk-onboard__title">How a sealed round works</h3>

        <ul className="zk-onboard__rows">
          {rows.map(({ Mark, title, body }) => (
            <li key={title} className="zk-onboard__row">
              <span className="zk-onboard__row-mark">
                <Mark size={40} />
              </span>
              <span className="zk-onboard__row-copy">
                <strong>{title}</strong>
                {body}
              </span>
            </li>
          ))}
        </ul>

        <div className="zk-onboard__actions">
          <button
            type="button"
            onClick={dismiss}
            className="payoff-preset payoff-preset--active"
          >
            Play
          </button>
        </div>
      </div>
    </div>
  );
};
