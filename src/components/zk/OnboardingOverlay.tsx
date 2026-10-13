import React, { useState } from "react";
import { MARKS } from "../marks";
import "../../styles/tournament.css";
import "../../styles/zk.css";

const STORAGE_KEY = "zk_onboarding_seen";

/**
 * 3-step onboarding overlay shown on first visit to /play.
 * Explains the ZK commit-reveal flow to new users.
 * Dismissed state persisted in localStorage.
 */
export const OnboardingOverlay: React.FC = () => {
  const [step, setStep] = useState(0);
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

  const steps = [
    {
      Mark: MARKS.seal,
      title: "Stand at the edge",
      body: `Pick your move — lean in (hold them up) or hold back (step aside). Your move is kept secret; they can't see it.`,
    },
    {
      Mark: MARKS.seal,
      title: "Let go — the math catches you",
      body: "Your browser generates a proof that your move is valid, binding you to it. This takes a few seconds — that's the fall.",
    },
    {
      Mark: MARKS.handshake,
      title: "The catch or the drop",
      body: "Both players reveal. If you both leaned in, you're held — trust rewarded. If someone held back, someone is dropped.",
    },
  ];

  const current = steps[step];
  const isLast = step === steps.length - 1;
  const Mark = current.Mark;

  return (
    <div className="zk-scrim" onClick={dismiss}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="receipt receipt-edge zk-onboard"
        role="dialog"
        aria-label="How sealed rounds work"
      >
        <div key={step}>
          <div className="zk-onboard__mark">
            <Mark size={56} />
          </div>

          <h3 className="zk-onboard__title">{current.title}</h3>

          <p className="zk-onboard__body">{current.body}</p>
        </div>

        {/* Steps as a printed counter — "2 of 3" — not dots. */}
        <p className="zk-onboard__count">
          Step {step + 1} of {steps.length}
        </p>

        <div className="zk-onboard__actions">
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="payoff-preset"
            >
              ← Back
            </button>
          )}
          {isLast ? (
            <button
              type="button"
              onClick={dismiss}
              className="payoff-preset payoff-preset--active"
            >
              Play
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="payoff-preset payoff-preset--active"
            >
              Next →
            </button>
          )}
        </div>

        <button type="button" onClick={dismiss} className="zk-onboard__skip">
          Skip the intro
        </button>
      </div>
    </div>
  );
};
