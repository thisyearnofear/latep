/**
 * EpilogueSlide — the last chapter.
 *
 * The payoff: everything the visitor just played maps to one of the four
 * primitives. The list is read from `content/primitives.ts`, so this chapter
 * and the Everyday page and the Home row can never disagree about what the
 * primitives are called or what they do.
 *
 * The honest scope is stated here too, because this is the last thing anyone
 * reads before deciding whether to trust the app.
 */

import React from "react";
import { useNavigate } from "react-router-dom";
import { SlideProps } from "../SlideSystem";
import { TrustStage } from "../visual/TrustStage";
import { LessonLayout } from "../learning/LessonLayout";
import { LessonActions } from "../learning/LessonActions";
import { LessonDetails } from "../learning/LessonDetails";
import { MARKS } from "../marks";
import { Takeaway } from "../receipt";
import { PRIMITIVES } from "../../content/primitives";
import { MAX_DRAWN_TWISTS } from "../../content/vocabulary";

/**
 * What each chapter taught, keyed by the primitive it paid off. `primitives.ts`
 * owns the names, the marks and the everyday line; this only says which
 * chapter earned it.
 */
const EARNED_IN: Record<string, string> = {
  seal: "The sealed choice",
  handshake: "No take-backs",
  net: "The enforced catch",
  pass: "Proven membership",
};

/** The lesson that isn't a primitive: repeated play, and why it isn't enough. */
const REPUTATION_NOTE =
  "Reputation works when you will meet again. Most internet interactions are " +
  "one-shot with strangers whose history does not port — which is why the " +
  "other three exist.";

export const EpilogueSlide: React.FC<SlideProps> = () => {
  const navigate = useNavigate();

  return (
    <LessonLayout
      title="Trust, at internet scale"
      description="Everything you just played was the human solution. Here is what the protocol adds."
      visual={
        <>
          <TrustStage
            compact
            state={{ phase: "sealed" }}
            commitmentIllustration
            announce={false}
            showChoices={false}
          />
          <p className="narrative-disclaimer">
            Illustration only — no proof or transaction is created here.
          </p>
        </>
      }
    >
      {/*
        The lesson column is already the receipt, so these are NOT nested
        receipts — they are grouped with dashed rules, which is how you group
        inside a receipt (design.md §5, one containment layer).
      */}
      <ul className="epilogue-primitives">
        {PRIMITIVES.map((primitive) => {
          const Mark = MARKS[primitive.mark];
          return (
            <li key={primitive.id}>
              <Takeaway
                Mark={Mark}
                used={EARNED_IN[primitive.id] ?? primitive.name}
                line={primitive.oneLine}
                where={primitive.everyday}
                href="/real-life"
                linkLabel="Where this shows up"
              />
              <p className="epilogue-what">{primitive.whatItIs}</p>
            </li>
          );
        })}
      </ul>

      {/* Reputation is the lesson that did NOT become a primitive. Saying so
          is more honest than quietly dropping it. */}
      <p className="epilogue-reputation">{REPUTATION_NOTE}</p>

      {/* Honest scope */}
      <p>
        This demo proves moves and list membership — not balances, and not full
        identity privacy. Stellar is a transparent ledger; broader
        private-credential work is an ecosystem direction, not what this
        contract does today. The thread you saw caps at {MAX_DRAWN_TWISTS}{" "}
        twists in the drawing, but the streak keeps counting.
      </p>

      <LessonDetails
        trigger="Why privacy vs KYC matters"
        title="Privacy vs KYC"
      >
        <p>
          Traditionally, proving you are trustworthy means revealing who you
          are: identity checks, credit history, account records. That trades
          privacy for access.
        </p>
        <p>
          Zero-knowledge membership proofs offer a third path — prove a property
          (on the list, eligible, solvent) without disclosing the underlying
          identity or history. The accreditation methods on this game’s contract
          already implement the on-chain half of that check.
        </p>
      </LessonDetails>

      <LessonActions>
        <button
          type="button"
          className="learning-button learning-button-primary"
          onClick={() => void navigate("/play")}
        >
          Play with a friend
        </button>
      </LessonActions>
    </LessonLayout>
  );
};
