/**
 * EpilogueSlide — Chapter 9: "The Internet"
 *
 * The payoff of the journey: each mechanic the user just played maps to a
 * real protocol primitive — reputation, commit-reveal, escrowed settlement,
 * accreditation. It also states the honest scope of the demo (moves and
 * membership, not balances or full identity privacy) and frames privacy vs
 * KYC through the contract's existing accreditation methods.
 */

import React from "react";
import { useNavigate } from "react-router-dom";
import { SlideProps } from "../SlideSystem";
import { TrustStage } from "../visual/TrustStage";
import { LessonLayout } from "../learning/LessonLayout";
import { LessonActions } from "../learning/LessonActions";
import { LessonDetails } from "../learning/LessonDetails";

const PRIMITIVE_MAP: Array<{ lesson: string; primitive: string }> = [
  {
    lesson: "Repeated play",
    primitive:
      "Reputation — works when you will meet again. Most internet interactions are one-shot with strangers whose history does not port.",
  },
  {
    lesson: "The sealed choice",
    primitive:
      "Commit-reveal — binding but hidden. The same primitive behind on-chain auctions, voting, and front-running protection.",
  },
  {
    lesson: "The enforced catch",
    primitive:
      "Escrowed settlement — the contract holds the stakes, so the outcome does not depend on goodwill.",
  },
  {
    lesson: "Proven membership",
    primitive:
      "Accreditation — the contract can verify you are on the list without revealing which entry is yours. Privacy without losing eligibility.",
  },
];

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
            Illustration only—no proof or transaction is created here.
          </p>
        </>
      }
    >
      {/* Mechanic → primitive mapping */}
      <dl className="epilogue-map">
        {PRIMITIVE_MAP.map((pair) => (
          <React.Fragment key={pair.lesson}>
            <dt>{pair.lesson}</dt>
            <dd>{pair.primitive}</dd>
          </React.Fragment>
        ))}
      </dl>

      {/* Honest scope */}
      <p>
        This demo proves moves and list membership — not balances or full
        identity privacy. Stellar is a transparent ledger; broader
        private-credential work is an ecosystem direction, not what this
        contract does today.
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
          Enter ZK lobby
        </button>
      </LessonActions>
    </LessonLayout>
  );
};
