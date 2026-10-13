/**
 * ReactiveMascot — a floating stick figure that lives in the corner of the
 * screen and reacts to game events with personality.
 *
 * It's always present but unobtrusive — small in the corner, idle by default.
 * When something happens (game won, wallet connected, etc.), it springs to
 * life with a speech bubble and animated state.
 *
 * The mascot's personality is shaped by the user's trust profile.
 *
 * Clicking the mascot dismisses the current speech bubble.
 */
import React, { useState } from "react";
import { TrustFallCharacter } from "./TrustFallCharacter";
import { useMascot } from "./MascotContext";
import "../styles/ui.css";

export const ReactiveMascot: React.FC = () => {
  const { state, speech, color, isReacting, clear } = useMascot();
  const [dismissed, setDismissed] = useState(false);

  // Don't render if there's no speech and not reacting (idle mascot is hidden)
  if (!isReacting && !speech) return null;

  // If user dismissed the current reaction, hide until next event
  if (dismissed && speech) {
    // New speech appeared — reset dismissed
    setDismissed(false);
  }

  const handleClick = () => {
    setDismissed(true);
    clear();
  };

  if (dismissed) return null;

  return (
    <div onClick={handleClick} className="ui-mascot" title="Click to dismiss">
      {/* Speech bubble (positioned to the left of the mascot) */}
      {speech && <div className="ui-mascot__bubble">{speech}</div>}

      {/* The mascot */}
      <div>
        <TrustFallCharacter state={state} color={color} size="md" />
      </div>
    </div>
  );
};
