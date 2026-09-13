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
import { LessonLayout } from "../learning/LessonLayout";
import { LessonActions } from "../learning/LessonActions";
import { LessonDetails } from "../learning/LessonDetails";

export const EdgeSlide: React.FC<SlideProps> = ({ onNext }) => {
  return (
    <LessonLayout
      title="You’re standing at the edge."
      description="Will you offer a catch—or step aside?"
      visual={
        <>
          {/* The scene */}
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
            compact
            state={{ phase: "idle" }}
            showChoices={false}
            announce={false}
          />
        </>
      }
    >
      <p>
        Two people take a risk. If both offer a catch, both benefit. If one
        steps aside, the other bears the cost.
      </p>
      <p>
        The lesson uses practice points. You can explore on-chain stakes later.
      </p>
      <LessonDetails trigger="Why this matters" title="Why this matters">
        <p>
          Most online exchanges are one-shot. No history, no repeat — just a
          single decision about whether to extend trust to someone anonymous.
        </p>
      </LessonDetails>
      <LessonActions>
        <button
          type="button"
          className="learning-button learning-button-primary"
          onClick={onNext}
        >
          Take the fall
        </button>
      </LessonActions>
    </LessonLayout>
  );
};
