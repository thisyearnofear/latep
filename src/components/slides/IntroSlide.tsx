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
import { LessonDetails } from "../learning/LessonDetails";

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
        what zero-knowledge proofs can—and cannot—guarantee. The same question
        appears when a stranger pays you from another country — except then, the
        stakes are real.
      </p>
      <LessonDetails trigger="Why this matters" title="Why this matters">
        <p>
          Everything in this journey is a miniature of a real problem: paying,
          trading, or agreeing with a stranger you will never meet. The internet
          made those interactions instant — but gave you no way to trust them.
        </p>
      </LessonDetails>
    </LessonLayout>
  );
};
