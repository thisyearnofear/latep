/**
 * IntroSlide — Welcome to Latep
 *
 * Sets up the journey. The user sees what they'll learn and why it matters.
 * This is the narrative hook before the interactive experience begins.
 */

import React from "react";
import { SlideProps } from "../SlideSystem";
import { TrustStage } from "../visual/TrustStage";

export const IntroSlide: React.FC<SlideProps> = () => {
  return (
    <div
      className="learning-round narrative-intro"
      style={{ textAlign: "center", padding: "40px 20px" }}
    >
      <h1
        data-animate
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "var(--text-4xl)",
          marginBottom: "16px",
          lineHeight: 1.05,
        }}
      >
        The Evolution of Trust
      </h1>

      <p
        data-animate
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "var(--text-xl)",
          maxWidth: "560px",
          margin: "0 auto 32px",
          lineHeight: 1.5,
          color: "var(--text-secondary)",
        }}
      >
        An interactive guide to why we trust — and why trust{" "}
        <em style={{ color: "var(--accent-warm)" }}>evolves</em>. Play the
        Prisoner's Dilemma, watch strategies compete, then explore how
        zero-knowledge proofs support on-chain play.
      </p>

      <div data-animate style={{ marginBottom: "32px" }}>
        <TrustStage
          state={{ phase: "idle" }}
          showChoices={false}
          announce={false}
        />
      </div>

      {/* Journey preview */}
      <div
        data-animate
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "8px",
          justifyContent: "center",
          maxWidth: "480px",
          margin: "0 auto 40px",
        }}
      >
        {[
          { icon: "🏔️", label: "The Edge" },
          { icon: "🤝", label: "The Choice" },
          { icon: "🔄", label: "The Repeat" },
          { icon: "⚔️", label: "The Opponents" },
          { icon: "🏆", label: "The Tournament" },
          { icon: "💨", label: "The Noise" },
          { icon: "🔒", label: "The Real Thing" },
        ].map((step, i) => (
          <div
            key={step.label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 12px",
              background: "var(--bg-glass-light)",
              border: "1px solid var(--border-glass)",
              borderRadius: "100px",
              fontSize: "var(--text-xs)",
              color: "var(--text-secondary)",
              fontFamily: "var(--font-body)",
            }}
          >
            <span>{step.icon}</span>
            <span>{step.label}</span>
            {i < 6 && (
              <span style={{ color: "var(--text-muted)", marginLeft: "2px" }}>
                →
              </span>
            )}
          </div>
        ))}
      </div>

      <p
        data-animate
        style={{
          fontFamily: "var(--font-display)",
          fontStyle: "italic",
          fontSize: "var(--text-lg)",
          color: "var(--text-muted)",
          maxWidth: "480px",
          margin: "0 auto",
        }}
      >
        Based on Nicky Case's "The Evolution of Trust" — enhanced with
        zero-knowledge proofs on Stellar.
      </p>
    </div>
  );
};
