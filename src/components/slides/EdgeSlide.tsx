/**
 * EdgeSlide — Step 1: "The Edge"
 *
 * Introduces the trust fall metaphor. No game mechanics yet.
 * The user sees a figure standing at the edge of a cliff.
 * The question: do you fall?
 */

import React from "react";
import { SlideProps } from "../SlideSystem";
import { TrustStage } from "../visual/TrustStage";

export const EdgeSlide: React.FC<SlideProps> = ({ onNext }) => {
  return (
    <div
      className="learning-round"
      style={{
        margin: "0 auto",
        textAlign: "center",
        padding: "20px",
      }}
    >
      {/* The scene */}
      <div data-animate style={{ marginBottom: "32px" }}>
        {/* Cliff */}
        {/* Ground/cliff shape */}
        {/* Edge line */}
        {/* Figure standing on edge */}
        {/* Head */}
        {/* Body */}
        {/* Arms — crossed (hesitant) */}
        {/* Legs */}
        {/* Glow at edge */}
        <TrustStage
          state={{ phase: "idle" }}
          showChoices={false}
          announce={false}
        />
      </div>

      <h2
        data-animate
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "var(--text-3xl)",
          marginBottom: "16px",
          lineHeight: 1.1,
        }}
      >
        You're standing at the edge.
      </h2>

      <p
        data-animate
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "var(--text-lg)",
          color: "var(--text-secondary)",
          maxWidth: "480px",
          margin: "0 auto 24px",
          lineHeight: 1.6,
        }}
      >
        Two people take a risk. If both offer a catch, both benefit. If one
        steps aside, the other bears the cost.
      </p>

      <p
        data-animate
        style={{
          fontFamily: "var(--font-display)",
          fontStyle: "italic",
          fontSize: "var(--text-xl)",
          color: "var(--accent-warm)",
          marginBottom: "40px",
        }}
      >
        Do you fall?
      </p>

      <div data-animate>
        <button
          type="button"
          className="learning-button learning-button-primary"
          onClick={onNext}
        >
          Take the fall
        </button>
      </div>

      <p
        data-animate
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "var(--text-sm)",
          color: "var(--text-muted)",
          marginTop: "32px",
        }}
      >
        This is the Prisoner's Dilemma. Start with practice points; explore
        on-chain stakes later.
      </p>
    </div>
  );
};
