/**
 * IntroSlide — Welcome to Latep
 *
 * Sets up the journey. The user sees what they'll learn and why it matters.
 * This is the narrative hook before the interactive experience begins.
 */

import React from "react";
import { SlideProps } from "../SlideSystem";
import { TrustStage } from "../visual/TrustStage";
import { LessonLayout } from "../learning/LessonLayout";

export const IntroSlide: React.FC<SlideProps> = () => {
  return (
    <LessonLayout
      className="narrative-intro"
      headingLevel={1}
      title="The Evolution of Trust"
      description="Explore trust, betrayal, and cooperation—one choice at a time."
      visual={
        <TrustStage
          compact
          state={{ phase: "idle" }}
          showChoices={false}
          announce={false}
        />
      }
    >
      {/* Journey preview */}
      <h3>A small choice. A shared consequence.</h3>
      <p>
        Play against different strategies, see how trust evolves, and discover
        what zero-knowledge proofs can—and cannot—guarantee.
      </p>
    </LessonLayout>
  );
};
