/**
 * StickManScene — a visual representation of the trust fall at each
 * stage of the ZK game flow, using the jointed TrustFallCharacter rig.
 *
 * Each player stands on a raised platform edge. When a move is committed
 * the figure topples (rig rotation) and physically plunges off its platform
 * — the fall distance scales with the stake, so "the fall" is the proof wait.
 * Resolve lands them: caught (cradled above the ground) or impact (flat, dust).
 *
 *   commit:   Both standing on their platforms, facing each other
 *   waiting:  You've committed — you plunge off your edge, opponent waits
 *   reveal:   Both falling
 *   resolve:  caught / betrayed / exploited / mutual outcome poses
 */
import React from "react";
import { TrustFallCharacter, type CharacterState } from "../TrustFallCharacter";
import type { ZKStep } from "./ZKStepIndicator";

interface StickManSceneProps {
  step: ZKStep;
  /** Game outcome for resolve step */
  outcome?: "caught" | "betrayed" | "exploited" | "mutual";
  /** Stake in XLM — controls the "height" of the fall */
  stake?: number;
}

const PLATFORM_H = 34;

interface SlotLayout {
  bottom: number;
  offsetX: number;
  plungeFrom?: number;
  platform: boolean;
}

function layoutFor(state: CharacterState, fallHeight: number): SlotLayout {
  switch (state) {
    case "falling":
      return {
        bottom: 10,
        offsetX: 0,
        plungeFrom: fallHeight,
        platform: true,
      };
    case "caught":
      return { bottom: 26, offsetX: 0, platform: false };
    case "impact":
      return { bottom: 6, offsetX: 0, platform: false };
    case "celebrating":
      return { bottom: 8, offsetX: 0, platform: false };
    default:
      return { bottom: 8 + PLATFORM_H, offsetX: 0, platform: true };
  }
}

export const StickManScene: React.FC<StickManSceneProps> = ({
  step,
  outcome,
  stake = 5,
}) => {
  const fallHeight = Math.min(120, Math.max(60, stake * 8));

  const getStates = (): { you: CharacterState; opponent: CharacterState } => {
    switch (step) {
      case "commit":
        return { you: "standing", opponent: "standing" };
      case "waiting":
        return { you: "falling", opponent: "waiting" };
      case "reveal":
        return { you: "falling", opponent: "falling" };
      case "resolve":
        switch (outcome) {
          case "caught":
            return { you: "caught", opponent: "caught" };
          case "betrayed":
            return { you: "impact", opponent: "celebrating" };
          case "exploited":
            return { you: "celebrating", opponent: "impact" };
          case "mutual":
            return { you: "impact", opponent: "impact" };
          default:
            return { you: "standing", opponent: "standing" };
        }
    }
  };

  const { you, opponent } = getStates();

  const getSpeech = (): { you?: string; opponent?: string } => {
    switch (step) {
      case "commit":
        return {};
      case "waiting":
        return { you: "I'm falling!", opponent: undefined };
      case "reveal":
        return {};
      case "resolve":
        switch (outcome) {
          case "caught":
            return { you: "We caught each other!", opponent: "Trust!" };
          case "betrayed":
            return { you: "Ouch...", opponent: "I stepped aside" };
          case "exploited":
            return { you: "I stepped aside!", opponent: "Ouch..." };
          case "mutual":
            return { you: "Nobody caught anyone", opponent: "💥" };
          default:
            return {};
        }
    }
  };

  const speech = getSpeech();

  const slots: Array<{
    key: string;
    state: CharacterState;
    color: "you" | "opponent";
    speech?: string;
    lean: number;
  }> = [
    { key: "you", state: you, color: "you", speech: speech.you, lean: 22 },
    {
      key: "opponent",
      state: opponent,
      color: "opponent",
      speech: speech.opponent,
      lean: -22,
    },
  ];

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-end",
        gap: "56px",
        height: `${fallHeight + PLATFORM_H + 70}px`,
        marginBottom: "20px",
        position: "relative",
      }}
    >
      {/* Ground line */}
      <div
        style={{
          position: "absolute",
          bottom: "8px",
          left: "8%",
          right: "8%",
          height: "2px",
          background:
            "linear-gradient(90deg, transparent, var(--border-glass-hover) 20%, var(--border-glass-hover) 80%, transparent)",
        }}
      />

      {slots.map(({ key, state, color, speech: line, lean }) => {
        const L = layoutFor(state, fallHeight);
        return (
          <div
            key={key}
            style={{
              position: "relative",
              width: "76px",
              height: "100%",
            }}
          >
            {/* Platform edge */}
            {L.platform && (
              <div
                style={{
                  position: "absolute",
                  bottom: "8px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: "68px",
                  height: `${PLATFORM_H}px`,
                  borderRadius: "6px 6px 3px 3px",
                  background:
                    "linear-gradient(180deg, var(--color-counter-2), var(--color-counter))",
                  border: "1px solid var(--border-glass)",
                  borderTop: "2px solid var(--border-glass-hover)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10)",
                }}
              />
            )}

            {/* Character slot: offset toward center while airborne */}
            <div
              style={{
                position: "absolute",
                bottom: `${L.bottom}px`,
                left: "50%",
                transform: `translateX(calc(-50% + ${state === "falling" ? lean : 0}px))`,
                transition: "bottom 0.5s var(--ease-out)",
              }}
            >
              {/* Inner wrapper carries the plunge so the offset transform stays put */}
              <div
                className={L.plungeFrom ? "tf-plunge" : undefined}
                style={
                  L.plungeFrom
                    ? ({
                        "--fall-h": `${L.plungeFrom}px`,
                      } as React.CSSProperties)
                    : undefined
                }
              >
                <TrustFallCharacter
                  state={state}
                  color={color}
                  size="lg"
                  speech={line}
                  flip={color === "opponent"}
                  label={key === "you" ? "You" : "Opponent"}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
