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

const STEP_COLORS = [
  "rgba(102,126,234,0.15)",
  "rgba(240,160,32,0.15)",
  "rgba(74,222,128,0.15)",
];
const STEP_TEXT = [
  "var(--accent-violet)",
  "var(--accent-warm)",
  "var(--accent-cooperate)",
];
const STEPS: Array<{ name: string; short: string; full: string }> = [
  {
    name: "Commit",
    short:
      "Prove that a hidden commitment contains a valid move for this game.",
    full: "A zero-knowledge proof verifies that the hidden commitment contains a valid move for this game. It does not reveal which move you chose.",
  },
  {
    name: "Reveal",
    short: "Reveal the move and nonce; the contract checks their hash.",
    full: "After both players commit, reveal your move and nonce. The contract checks their hash against your stored commitment.",
  },
  {
    name: "Resolve",
    short: "A transaction applies the rules and pays from contract escrow.",
    full: "A resolution transaction applies the game rules and transfers XLM from contract escrow. Timeout and recovery paths handle unfinished games.",
  },
];

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
      {/* How it works */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {STEPS.map((step, i) => (
          <div
            key={step.name}
            style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}
          >
            <div
              style={{
                minWidth: "28px",
                height: "28px",
                borderRadius: "50%",
                background: STEP_COLORS[i],
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "var(--font-display)",
                fontSize: "var(--text-base)",
                color: STEP_TEXT[i],
                flexShrink: 0,
              }}
            >
              {i + 1}
            </div>
            <div>
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "var(--text-sm)",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  margin: "0 0 2px",
                }}
              >
                {step.name}
              </p>
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "var(--text-sm)",
                  color: "var(--text-secondary)",
                  margin: 0,
                }}
              >
                {step.short}
              </p>
            </div>
          </div>
        ))}
      </div>

      <p
        style={{
          fontFamily: "var(--font-display)",
          fontStyle: "italic",
          fontSize: "var(--text-base)",
          color: "var(--text-secondary)",
          margin: 0,
        }}
      >
        Proofs check valid moves, not cooperative intentions.
      </p>

      {/* Wallet status */}
      {address ? (
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-sm)",
            color: "var(--accent-cooperate)",
            margin: 0,
          }}
        >
          ✓ Wallet connected — {address.slice(0, 8)}...{address.slice(-6)}
        </p>
      ) : (
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "var(--text-sm)",
            color: "var(--text-muted)",
            margin: 0,
          }}
        >
          Connect a Stellar wallet in the lobby when you are ready.
        </p>
      )}

      <LessonDetails
        trigger="How verification works"
        title="Commit, reveal, resolve"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {STEPS.map((step) => (
            <p
              key={step.name}
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "var(--text-sm)",
                color: "var(--text-secondary)",
                margin: 0,
              }}
            >
              <strong style={{ color: "var(--text-primary)" }}>
                {step.name}:
              </strong>{" "}
              {step.full}
            </p>
          ))}
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "var(--text-sm)",
              color: "var(--text-secondary)",
              margin: 0,
            }}
          >
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
