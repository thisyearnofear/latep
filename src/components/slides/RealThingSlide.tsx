/**
 * RealThingSlide — Step 7: "The Real Thing"
 *
 * The bridge to ZK multiplayer. The user has learned the theory.
 * Now they can play with real XLM stakes, protected by zero-knowledge proofs.
 * This slide explains WHY ZK matters (commit-reveal fairness) and
 * provides a clear CTA to enter the ZK multiplayer flow.
 */

import React from "react";
import { useNavigate } from "react-router-dom";
import { SlideProps } from "../SlideSystem";
import { useWallet } from "../../hooks/useWallet";
import { TrustStage } from "../visual/TrustStage";
import { LessonLayout } from "../learning/LessonLayout";
import { LessonActions } from "../learning/LessonActions";
import { LessonDetails } from "../learning/LessonDetails";
import { MARKS } from "../marks";
import { getPrimitive, type PrimitiveId } from "../../content/primitives";
import "../../styles/slide-repeat.css";

const STEPS: Array<{
  name: string;
  /** The primitive this step is — name and line come from primitives.ts. */
  primitive: PrimitiveId;
  short: string;
  full: string;
}> = [
  {
    name: "Commit",
    primitive: "seal",
    short:
      "Prove that a hidden commitment contains a valid move for this game.",
    full: "A zero-knowledge proof verifies that the hidden commitment contains a valid move for this game. It does not reveal which move you chose.",
  },
  {
    name: "Reveal",
    primitive: "handshake",
    short: "Reveal the move and nonce; the contract checks their hash.",
    full: "After both players commit, reveal your move and nonce. The contract checks their hash against your stored commitment.",
  },
  {
    name: "Resolve",
    primitive: "net",
    short: "A transaction applies the rules and pays from contract escrow.",
    full: "A resolution transaction applies the game rules and transfers XLM from contract escrow. Timeout and recovery paths handle unfinished games.",
  },
];

/**
 * The fourth primitive is not part of a round: it is the accreditation proof
 * waiting in the lobby. Name and everyday line come from primitives.ts.
 */
const PASS = getPrimitive("pass");
const PassMark = MARKS[PASS.mark];
const PASS_NOTE =
  "A round never needs it. The lobby’s accreditation proof is exactly this.";

export const RealThingSlide: React.FC<SlideProps> = () => {
  const navigate = useNavigate();
  const { address } = useWallet();

  return (
    <LessonLayout
      title="The Real Thing"
      description="Hidden commitments. Valid moves. On-chain escrow."
      visual={
        <>
          <TrustStage
            compact
            state={{ phase: "sealed" }}
            commitmentIllustration
            announce={false}
          />
          <p className="narrative-disclaimer">
            Illustration only — no proof is generated and no transaction is
            submitted here.
          </p>
        </>
      }
    >
      {/* How it works — each step is one of the four counter objects, named
          with the wording from content/primitives.ts */}
      <ul className="realthing-steps">
        {STEPS.map((step) => {
          const primitive = getPrimitive(step.primitive);
          const Mark = MARKS[primitive.mark];
          return (
            <li key={step.name} className="realthing-step">
              <span className="realthing-step-mark">
                <Mark size={24} />
              </span>
              <div className="realthing-step-body">
                <p className="realthing-step-name">{step.name}</p>
                <p className="realthing-step-line">{step.short}</p>
                <p className="realthing-step-primitive">
                  {primitive.name} — {primitive.oneLine}
                </p>
              </div>
            </li>
          );
        })}
        {/* The Pass is the fourth primitive, and it belongs to the lobby. */}
        <li className="realthing-step">
          <span className="realthing-step-mark">
            <PassMark size={24} />
          </span>
          <div className="realthing-step-body">
            <p className="realthing-step-name">{PASS.name}</p>
            <p className="realthing-step-line">{PASS.oneLine}</p>
            <p className="realthing-step-primitive">{PASS_NOTE}</p>
          </div>
        </li>
      </ul>

      <p className="realthing-lead">
        Proofs check valid moves, not cooperative intentions.
      </p>

      {/* Wallet status — a printed line, and the words carry the state. */}
      {address ? (
        <p className="realthing-wallet realthing-wallet--connected">
          Wallet connected — {address.slice(0, 8)}…{address.slice(-6)}
        </p>
      ) : (
        <p className="realthing-wallet">
          Connect a Stellar wallet in the lobby when you are ready.
        </p>
      )}

      <LessonDetails
        trigger="How verification works"
        title="Commit, reveal, resolve"
      >
        <div className="realthing-detail">
          {STEPS.map((step) => (
            <p key={step.name} className="realthing-detail-step">
              <strong>{step.name}:</strong> {step.full}
            </p>
          ))}
          <p className="realthing-detail-step">
            On-chain play adds XLM escrow and hidden commitments. A proof checks
            a valid move, not whether someone will cooperate. Review the network
            and stakes in the lobby.
          </p>
        </div>
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
