/**
 * FirstRunWizard — a welcoming, progressive onboarding overlay.
 *
 * Shows on first visit (when no milestones are unlocked). Presents a simple
 * 3-step path: Learn the basics → Try the tutorial → Play for real.
 *
 * Each step has a "Do it now" button that navigates the user to the right
 * route. The wizard dismisses automatically once the user starts an action
 * and can be re-opened from the landing page if needed.
 *
 * Also renders a compact "next step" hint bar on the landing page for
 * returning users who haven't completed all milestones.
 *
 * Surfaces (design.md §2): the wizard panel is a receipt — every step is
 * read closely. The next-step hint is one short line on the counter, so it
 * wears counter tokens.
 */
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Check,
  Gamepad2,
  Handshake,
  Lock,
  type LucideIcon,
} from "lucide-react";
import { useFirstRun, type FirstRunStage } from "../hooks/useFirstRun";
import { TrustFallCharacter } from "./TrustFallCharacter";
import { Receipt } from "./receipt";
import "../styles/ui.css";
import "../styles/wizard.css";

const WIZARD_SEEN_KEY = "tf_wizard_seen";

interface WizardStep {
  /** Lucide mark for the step's slot; replaced by a check once it's done. */
  Icon: LucideIcon;
  title: string;
  body: string;
  cta: string;
  route: string;
  milestone: "visited_learn" | "played_tutorial" | "connected_wallet";
}

const STEPS: WizardStep[] = [
  {
    Icon: BookOpen,
    title: "Learn the Theory",
    body: "A 5-minute interactive story about why we trust — and why trust breaks down. Start here if you’re new to game theory.",
    cta: "Start the story",
    route: "/learn",
    milestone: "visited_learn",
  },
  {
    Icon: Handshake,
    title: "Try the Tutorial",
    body: "Play against 9 AI strategies — no wallet needed. See how cooperation evolves (or collapses) over multiple rounds.",
    cta: "Play vs AI",
    route: "/learn/play",
    milestone: "played_tutorial",
  },
  {
    Icon: Lock,
    title: "Play for Real",
    body: "Stake real testnet XLM. Commit moves with zero-knowledge proofs — your opponent can’t see your move until reveal time.",
    cta: "Enter ZK lobby",
    route: "/play",
    milestone: "connected_wallet",
  },
];

export const FirstRunWizard: React.FC<{
  manual?: boolean;
  onClose?: () => void;
}> = ({ manual = false, onClose }) => {
  const navigate = useNavigate();
  const { milestones, stage, unlock } = useFirstRun();
  const [visible, setVisible] = useState(() => {
    if (manual) return true;
    try {
      return localStorage.getItem(WIZARD_SEEN_KEY) !== "true";
    } catch {
      return true;
    }
  });

  const dismiss = () => {
    try {
      localStorage.setItem(WIZARD_SEEN_KEY, "true");
    } catch {
      // ignore
    }
    setVisible(false);
    onClose?.();
  };

  // Don't show if user has completed everything or already dismissed
  if (!visible || (!manual && stage === "complete")) return null;

  // Determine which step to highlight based on stage
  const activeStepIndex =
    stage === "new" ? 0 : stage === "learning" ? 1 : stage === "ready" ? 2 : 0;

  const handleStart = (step: WizardStep) => {
    unlock(step.milestone);
    dismiss();
    void navigate(step.route);
  };

  return (
    <div className="wizard-overlay" onClick={dismiss}>
      <div className="wizard-panel" onClick={(e) => e.stopPropagation()}>
        <Receipt
          wide
          className="wizard"
          footer={
            <div className="wizard__foot">
              <p className="wizard__note">
                Takes ~5 minutes total • No real money at risk
              </p>
              <button
                type="button"
                className="wizard__dismiss"
                onClick={dismiss}
              >
                Explore on my own <ArrowRight size={16} aria-hidden="true" />
              </button>
            </div>
          }
        >
          <div className="wizard__head">
            <span className="wizard__figure">
              <TrustFallCharacter
                state="celebrating"
                color="you"
                size="xl"
                speech="Welcome!"
                surface="receipt"
              />
            </span>
            <h2 className="wizard__title">Welcome to Latep</h2>
            <p className="wizard__lead">
              An interactive game about trust, betrayal, and zero-knowledge
              proofs. Here’s how to get started:
            </p>
          </div>

          <ol className="wizard__steps">
            {STEPS.map((step, i) => {
              const isDone = milestones[step.milestone];
              const isActive = i === activeStepIndex;
              const classes = [
                "wizard-step",
                isActive && "wizard-step--active",
                isDone && "wizard-step--done",
              ]
                .filter(Boolean)
                .join(" ");
              return (
                <li key={step.title} className={classes}>
                  <span className="wizard-step__icon" aria-hidden="true">
                    {isDone ? <Check size={20} /> : <step.Icon size={20} />}
                  </span>
                  {isDone && <span className="wizard-step__sr">Done</span>}

                  <div className="wizard-step__text">
                    <h4 className="wizard-step__title">
                      <span className="wizard-step__num">{i + 1}.</span>{" "}
                      {step.title}
                    </h4>
                    <p className="wizard-step__body">{step.body}</p>
                  </div>

                  {!isDone && (
                    <button
                      type="button"
                      onClick={() => handleStart(step)}
                      className="wizard-step__cta"
                    >
                      {step.cta}{" "}
                      <ArrowRight size={16} aria-hidden="true" />
                    </button>
                  )}
                </li>
              );
            })}
          </ol>
        </Receipt>
      </div>
    </div>
  );
};

/**
 * NextStepHint — a compact banner shown on the landing page for returning
 * users who haven't completed all milestones. Shows the next recommended
 * action without blocking the page.
 */
export const NextStepHint: React.FC = () => {
  const navigate = useNavigate();
  const { stage } = useFirstRun();

  if (stage === "complete" || stage === "new") return null;

  const hints: Record<
    FirstRunStage,
    { Icon: LucideIcon; text: string; cta: string; route: string } | null
  > = {
    new: null,
    learning: {
      Icon: Handshake,
      text: "You’ve started learning — now try playing against the AI strategies.",
      cta: "Play tutorial",
      route: "/learn/play",
    },
    ready: {
      Icon: Lock,
      text: "Nice work! Ready to stake real testnet XLM with zero-knowledge proofs?",
      cta: "Set up wallet",
      route: "/play",
    },
    wallet: {
      Icon: Gamepad2,
      text: "Wallet connected! Create your first ZK game to play for real.",
      cta: "Play ZK",
      route: "/play",
    },
    complete: null,
  };

  const hint = hints[stage];
  if (!hint) return null;

  return (
    <div className="next-step">
      <span className="next-step__icon" aria-hidden="true">
        <hint.Icon size={20} />
      </span>
      <span className="next-step__text">{hint.text}</span>
      <button
        type="button"
        onClick={() => void navigate(hint.route)}
        className="ui-button ui-button--primary next-step__cta"
      >
        {hint.cta} <ArrowRight size={16} aria-hidden="true" />
      </button>
    </div>
  );
};
