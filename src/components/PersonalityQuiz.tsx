/**
 * PersonalityQuiz — an interactive onboarding quiz that builds a "trust profile".
 *
 * The stick-figure rig guides users through 5 questions, then reveals their
 * trust personality. Everything you read closely sits on a receipt (design.md
 * §2); the scrim is the counter. Vocabulary comes from design.md §7.
 *
 * Flow:
 *   1. Mascot welcomes user
 *   2. 5 interactive questions (visual choices, not text forms)
 *   3. Trust profile reveal (Cooperator / Strategist / Survivor / Wildcard)
 *   4. CTA to start learning
 *
 * The profile is saved to localStorage and can be referenced later
 * in the app (e.g., showing it in the lobby or tutorial).
 *
 * Sound cues play at each step for immersion.
 */
import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Brain,
  Shield,
  Shuffle,
  Users,
  type LucideIcon,
} from "lucide-react";
import { TrustFallCharacter, type CharacterState } from "./TrustFallCharacter";
import { Receipt } from "./receipt";
import { useFirstRun } from "../hooks/useFirstRun";
import AudioManager from "./AudioManager";
import "../styles/ui.css";
import "../styles/quiz.css";

const PROFILE_KEY = "tf_trust_profile";

export type TrustProfile =
  | "cooperator"
  | "strategist"
  | "survivor"
  | "wildcard";

interface QuizQuestion {
  id: string;
  prompt: string;
  mascotState: CharacterState;
  options: {
    label: string;
    value: "C" | "D" | "neutral";
    profileWeight: Partial<Record<TrustProfile, number>>;
  }[];
}

const QUESTIONS: QuizQuestion[] = [
  {
    id: "first_move",
    prompt: "Someone you just met asks you to trust fall. Do you catch them?",
    mascotState: "waiting",
    options: [
      {
        label: "Of course — I'd catch them",
        value: "C",
        profileWeight: { cooperator: 2, strategist: 1 },
      },
      {
        label: "Maybe — depends on their vibe",
        value: "neutral",
        profileWeight: { strategist: 2, survivor: 1 },
      },
      {
        label: "I'd step aside — prove yourself first",
        value: "D",
        profileWeight: { survivor: 2, wildcard: 1 },
      },
    ],
  },
  {
    id: "betrayed",
    prompt:
      "You caught someone last time, but they stepped aside when it was your turn. What now?",
    mascotState: "thinking",
    options: [
      {
        label: "Forgive — maybe they had a reason",
        value: "C",
        profileWeight: { cooperator: 2, wildcard: 1 },
      },
      {
        label: "Tit for tat — step aside next time",
        value: "neutral",
        profileWeight: { strategist: 3 },
      },
      {
        label: "Never trust them again",
        value: "D",
        profileWeight: { survivor: 2, strategist: 1 },
      },
    ],
  },
  {
    id: "stakes",
    prompt:
      "The stakes just went up — real XLM is on the line. How do you feel?",
    mascotState: "standing",
    options: [
      {
        label: "Excited — trust is worth proving",
        value: "C",
        profileWeight: { cooperator: 2, wildcard: 1 },
      },
      {
        label: "Cautious — I'll think carefully",
        value: "neutral",
        profileWeight: { strategist: 2, survivor: 1 },
      },
      {
        label: "Nervous — I might hold back",
        value: "D",
        profileWeight: { survivor: 2 },
      },
    ],
  },
  {
    id: "repeated",
    prompt: "You'll play 10 rounds with the same person. Your strategy?",
    mascotState: "thinking",
    options: [
      {
        label: "Always lean in — build trust",
        value: "C",
        profileWeight: { cooperator: 3 },
      },
      {
        label: "Start nice, mirror their moves",
        value: "neutral",
        profileWeight: { strategist: 3 },
      },
      {
        label: "Mix it up — keep them guessing",
        value: "D",
        profileWeight: { wildcard: 3 },
      },
    ],
  },
  {
    id: "noise",
    prompt:
      "There's noise — sometimes moves get flipped by accident. Does this change things?",
    mascotState: "waiting",
    options: [
      {
        label: "Be more forgiving — it might be noise",
        value: "C",
        profileWeight: { cooperator: 2, strategist: 1 },
      },
      {
        label: "Account for it — but stay sharp",
        value: "neutral",
        profileWeight: { strategist: 2, survivor: 1 },
      },
      {
        label: "Assume the worst — hold back anyway",
        value: "D",
        profileWeight: { survivor: 2, wildcard: 1 },
      },
    ],
  },
];

const PROFILE_INFO: Record<
  TrustProfile,
  {
    name: string;
    Icon: LucideIcon;
    description: string;
    state: CharacterState;
  }
> = {
  cooperator: {
    name: "The Cooperator",
    Icon: Users,
    description:
      "You lead with trust. You believe leaning in is the best strategy, even when it's risky. The world needs more people like you — but watch out for those who'd take advantage.",
    state: "caught",
  },
  strategist: {
    name: "The Strategist",
    Icon: Brain,
    description:
      "You think before you act. You mirror, you adapt, you play the long game. Tit for tat is your natural rhythm — fair but not naive.",
    state: "thinking",
  },
  survivor: {
    name: "The Survivor",
    Icon: Shield,
    description:
      "You protect yourself first. Trust is earned, not given. In a world of betrayal, you'd rather be safe than sorry — and that's a valid choice.",
    state: "standing",
  },
  wildcard: {
    name: "The Wildcard",
    Icon: Shuffle,
    description:
      "Unpredictable, adaptive, and a little chaotic. You keep everyone guessing — sometimes you lean in, sometimes you hold back. No one knows what you'll do next.",
    state: "celebrating",
  },
};

export const getStoredProfile = (): TrustProfile | null => {
  try {
    return localStorage.getItem(PROFILE_KEY) as TrustProfile | null;
  } catch {
    return null;
  }
};

const computeProfile = (answers: ("C" | "D" | "neutral")[]): TrustProfile => {
  const weights: Record<TrustProfile, number> = {
    cooperator: 0,
    strategist: 0,
    survivor: 0,
    wildcard: 0,
  };

  answers.forEach((answer, i) => {
    const question = QUESTIONS[i];
    const option = question.options.find((o) => o.value === answer);
    if (option) {
      Object.entries(option.profileWeight).forEach(([profile, weight]) => {
        weights[profile as TrustProfile] += weight;
      });
    }
  });

  // Find the max
  let maxProfile: TrustProfile = "strategist";
  let maxWeight = -1;
  (Object.keys(weights) as TrustProfile[]).forEach((p) => {
    if (weights[p] > maxWeight) {
      maxWeight = weights[p];
      maxProfile = p;
    }
  });

  return maxProfile;
};

export const PersonalityQuiz: React.FC<{
  manual?: boolean;
  onClose?: () => void;
}> = ({ manual = false, onClose }) => {
  const navigate = useNavigate();
  const { unlock } = useFirstRun();
  const [audioManager] = useState(() => AudioManager.getInstance());
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<("C" | "D" | "neutral")[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [profile, setProfile] = useState<TrustProfile | null>(null);
  const [visible, setVisible] = useState(() => {
    if (manual) return true;
    try {
      return localStorage.getItem("tf_quiz_seen") !== "true";
    } catch {
      return true;
    }
  });

  const playSound = useCallback(
    (sound: string) => {
      try {
        audioManager.playSound(sound);
      } catch {
        // ignore
      }
    },
    [audioManager],
  );

  if (!visible) return null;

  const dismiss = () => {
    try {
      localStorage.setItem("tf_quiz_seen", "true");
    } catch {
      // ignore
    }
    setVisible(false);
    onClose?.();
  };

  const handleAnswer = (value: "C" | "D" | "neutral") => {
    playSound("click");
    const newAnswers = [...answers, value];
    setAnswers(newAnswers);

    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      // Compute profile
      const result = computeProfile(newAnswers);
      setProfile(result);
      setShowResult(true);
      try {
        localStorage.setItem(PROFILE_KEY, result);
      } catch {
        // ignore
      }
      playSound(result === "cooperator" ? "coin" : "defect");
    }
  };

  const handleFinish = () => {
    unlock("visited_learn");
    dismiss();
    void navigate("/learn");
  };

  const currentQuestion = QUESTIONS[step];
  const progress = (step + 1) / QUESTIONS.length;

  // Result screen
  if (showResult && profile) {
    const info = PROFILE_INFO[profile];
    return (
      <div className="quiz-scrim" onClick={dismiss}>
        <div className="quiz-ticket" onClick={(e) => e.stopPropagation()}>
          <Receipt title="Trust profile">
            {/* Rig reveal — on receipt stock, so the figure prints in ink. */}
            <div className="quiz-figure">
              <TrustFallCharacter
                state={info.state}
                color={
                  profile === "cooperator"
                    ? "cooperator"
                    : profile === "survivor"
                      ? "defector"
                      : profile === "wildcard"
                        ? "opponent"
                        : "you"
                }
                size="xl"
                surface="receipt"
              />
            </div>

            <h2 className="quiz-result__name">
              <info.Icon size={20} aria-hidden className="quiz-result__icon" />
              {info.name}
            </h2>

            <p className="quiz-result__description">{info.description}</p>

            <p className="quiz-result__helper">
              Now let&rsquo;s see how your strategy plays out against 9 AI
              opponents…
            </p>

            <div className="quiz-actions">
              <button
                type="button"
                onClick={dismiss}
                className="quiz-skip"
              >
                Skip for now
              </button>
              <button
                type="button"
                onClick={handleFinish}
                className="ui-button ui-button--on-receipt"
              >
                Start learning
                <ArrowRight size={18} aria-hidden />
              </button>
            </div>
          </Receipt>
        </div>
      </div>
    );
  }

  // Quiz question screen
  return (
    <div className="quiz-scrim" onClick={dismiss}>
      <div className="quiz-ticket" onClick={(e) => e.stopPropagation()}>
        <Receipt title="Trust quiz">
          {/* Progress — the fill scales by the dynamic CSS variable only. */}
          <div className="quiz-progress">
            <div
              className="quiz-progress__fill"
              style={{ "--quiz-progress": progress } as React.CSSProperties}
            />
          </div>

          {/* Mascot + question */}
          <div className="quiz-figure">
            <TrustFallCharacter
              state={currentQuestion.mascotState}
              color="you"
              size="lg"
              speech={`Q${step + 1} of ${QUESTIONS.length}`}
              surface="receipt"
            />
          </div>

          <h3 className="quiz-prompt">{currentQuestion.prompt}</h3>

          {/* Answer options */}
          <div className="quiz-options">
            {currentQuestion.options.map((option) => (
              <button
                key={option.label}
                type="button"
                onClick={() => handleAnswer(option.value)}
                className="quiz-option"
              >
                <span>{option.label}</span>
              </button>
            ))}
          </div>

          {/* Skip */}
          <button type="button" onClick={dismiss} className="quiz-dismiss">
            Skip quiz
          </button>
        </Receipt>
      </div>
    </div>
  );
};
