/**
 * TrustFallCharacter — the unified SVG stick figure mascot.
 *
 * A jointed rig (shoulder/elbow, hip/knee) posed per state. Poses are
 * interpolated with CSS transform transitions, so state changes blend
 * instead of snapping. The whole figure toples for "falling" and lies
 * flat for "impact" (with dust puffs).
 *
 * States: standing | falling | caught | impact | thinking | celebrating | waiting
 * Colors: you (violet) | opponent (amber) | neutral | cooperator | defector
 *   — "you" carries a hero arc, "opponent" a hair tuft, so the two are
 *     recognizable silhouettes at a glance.
 */
import React from "react";

export type CharacterState =
  | "standing"
  | "falling"
  | "caught"
  | "impact"
  | "thinking"
  | "celebrating"
  | "waiting";

export type CharacterColor =
  | "you"
  | "opponent"
  | "neutral"
  | "cooperator"
  | "defector";

interface TrustFallCharacterProps {
  state?: CharacterState;
  color?: CharacterColor;
  size?: "sm" | "md" | "lg" | "xl";
  /** Show a speech bubble with text */
  speech?: string;
  /** Label under the character */
  label?: string;
  /** Mirror the figure horizontally (for right-side actors) */
  flip?: boolean;
  /** Additional className for custom animations */
  className?: string;
}

const COLOR_MAP: Record<CharacterColor, string> = {
  you: "#667eea",
  opponent: "#f0a020",
  neutral: "#9E9E9E",
  cooperator: "#4ade80",
  defector: "#f87171",
};

const SIZE_MAP: Record<string, number> = {
  sm: 32,
  md: 48,
  lg: 64,
  xl: 96,
};

const STATE_ANIMATION: Record<CharacterState, string> = {
  standing: "tf-sway",
  falling: "tf-falling",
  caught: "tf-catch",
  impact: "tf-impact",
  thinking: "tf-sway",
  celebrating: "tf-bounce",
  waiting: "tf-sway",
};

/** Joint angles in degrees. Arms/legs hang along +y at 0deg. */
interface Pose {
  body: number; // torso rotation around the hips
  head: number; // head tilt around the neck
  lS: number; // left shoulder
  lE: number; // left elbow
  rS: number;
  rE: number;
  lH: number; // left hip
  lK: number; // left knee
  rH: number;
  rK: number;
}

const POSES: Record<CharacterState, Pose> = {
  standing: {
    body: 0,
    head: 0,
    lS: -20,
    lE: -8,
    rS: 20,
    rE: 8,
    lH: -10,
    lK: 6,
    rH: 10,
    rK: -6,
  },
  waiting: {
    body: 0,
    head: 0,
    lS: -40,
    lE: -14,
    rS: 40,
    rE: 14,
    lH: -10,
    lK: 6,
    rH: 10,
    rK: -6,
  },
  thinking: {
    body: 0,
    head: 8,
    lS: -20,
    lE: -10,
    rS: 42,
    rE: -88,
    lH: -10,
    lK: 6,
    rH: 10,
    rK: -6,
  },
  falling: {
    body: 82,
    head: -18,
    lS: -150,
    lE: -25,
    rS: 150,
    rE: 25,
    lH: -28,
    lK: 40,
    rH: 12,
    rK: 30,
  },
  caught: {
    body: -6,
    head: -4,
    lS: -70,
    lE: -25,
    rS: 70,
    rE: 25,
    lH: -8,
    lK: 4,
    rH: 8,
    rK: -4,
  },
  celebrating: {
    body: 0,
    head: -4,
    lS: -150,
    lE: -8,
    rS: 150,
    rE: 8,
    lH: -16,
    lK: 8,
    rH: 16,
    rK: -8,
  },
  impact: {
    body: 88,
    head: -24,
    lS: -50,
    lE: 22,
    rS: -70,
    rE: 18,
    lH: -26,
    lK: 18,
    rH: -12,
    rK: 12,
  },
};

const TRANSITION =
  "transform 0.5s var(--rig-ease, cubic-bezier(.34,1.56,.64,1))";

const joint = (rotation: number): React.CSSProperties => ({
  transform: `rotate(${rotation}deg)`,
  transformOrigin: "0px 0px",
  transformBox: "view-box",
  transition: TRANSITION,
});

export const TrustFallCharacter: React.FC<TrustFallCharacterProps> = ({
  state = "standing",
  color = "you",
  size = "md",
  speech,
  label,
  flip = false,
  className = "",
}) => {
  const dim = SIZE_MAP[size];
  const stroke = color === "neutral" ? 2.5 : 3;
  const c = COLOR_MAP[color];
  const animClass = STATE_ANIMATION[state];
  const p = POSES[state];

  const eyes: "happy" | "wide" | "dazed" | "thinking" | "neutral" =
    state === "caught" || state === "celebrating"
      ? "happy"
      : state === "impact"
        ? "dazed"
        : state === "falling"
          ? "wide"
          : state === "thinking"
            ? "thinking"
            : "neutral";
  const mouth: "smile" | "o" | "flat" | "neutral" =
    state === "caught" || state === "celebrating"
      ? "smile"
      : state === "impact" || state === "falling"
        ? "o"
        : state === "thinking" || state === "waiting"
          ? "flat"
          : "neutral";

  const limb = (elbow: number, upper: number, lower: number) => (
    <React.Fragment>
      {/* upper segment */}
      <line
        x1="0"
        y1="0"
        x2="0"
        y2={upper}
        stroke={c}
        strokeWidth={stroke}
        strokeLinecap="round"
      />
      <g transform={`translate(0 ${upper})`}>
        <g style={joint(elbow)}>
          {/* lower segment + hand/foot */}
          <line
            x1="0"
            y1="0"
            x2="0"
            y2={lower}
            stroke={c}
            strokeWidth={stroke}
            strokeLinecap="round"
          />
          <circle cx="0" cy={lower + 0.6} r="1.3" fill={c} stroke="none" />
        </g>
      </g>
    </React.Fragment>
  );

  return (
    <div
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "4px",
      }}
    >
      <div style={{ position: "relative", display: "inline-block" }}>
        {/* Speech bubble */}
        {speech && (
          <div
            style={{
              position: "absolute",
              bottom: "100%",
              left: "50%",
              transform: "translateX(-50%)",
              background: "rgba(20, 26, 46, 0.95)",
              border: `1px solid ${c}40`,
              padding: "6px 12px",
              borderRadius: "12px",
              fontSize: "12px",
              fontFamily: "var(--font-body)",
              color: "var(--text-primary)",
              maxWidth: "180px",
              textAlign: "center",
              marginBottom: "6px",
              whiteSpace: "nowrap",
              boxShadow: `0 4px 16px ${c}30`,
              animation: "fadeIn 0.3s ease-out",
              zIndex: 10,
            }}
          >
            {speech}
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: "50%",
                transform: "translateX(-50%)",
                width: 0,
                height: 0,
                borderLeft: "5px solid transparent",
                borderRight: "5px solid transparent",
                borderTop: `5px solid rgba(20, 26, 46, 0.95)`,
              }}
            />
          </div>
        )}

        {/* Thinking bubble */}
        {state === "thinking" && !speech && (
          <div
            style={{
              position: "absolute",
              top: "-8px",
              right: "-12px",
              fontSize: "16px",
              animation: "tf-sway 2s ease-in-out infinite",
            }}
          >
            💭
          </div>
        )}

        {/* Waiting indicator */}
        {state === "waiting" && (
          <div
            style={{
              position: "absolute",
              top: "-10px",
              right: "-8px",
              fontSize: "14px",
              animation: "tf-waiting-pulse 1.5s ease-in-out infinite",
            }}
          >
            ❓
          </div>
        )}

        {/* Jointed stick figure */}
        <div
          style={
            flip
              ? { transform: "scaleX(-1)", display: "inline-block" }
              : undefined
          }
        >
          <svg
            width={dim}
            height={dim}
            viewBox="-4 -4 48 56"
            className={`${animClass} ${className}`}
            style={{
              overflow: "visible",
              filter: `drop-shadow(0 0 8px ${c}40)`,
            }}
          >
            {/* Whole figure rotates around the hips */}
            <g
              style={{
                transform: `rotate(${p.body}deg)`,
                transformOrigin: "20px 32px",
                transformBox: "view-box",
                transition: TRANSITION,
              }}
            >
              {/* Torso */}
              <line
                x1="20"
                y1="15"
                x2="20"
                y2="32"
                stroke={c}
                strokeWidth={stroke}
                strokeLinecap="round"
              />

              {/* Head, tilting at the neck */}
              <g transform="translate(20 15)">
                <g style={joint(p.head)}>
                  <circle
                    cx="0"
                    cy="-6"
                    r="6"
                    fill={c}
                    fillOpacity={0.14}
                    stroke={c}
                    strokeWidth={stroke}
                    strokeLinecap="round"
                  />
                  {/* Identity marks */}
                  {color === "you" && (
                    <path
                      d="M -4.6 -9.6 Q 0 -13 4.6 -9.6"
                      fill="none"
                      stroke={c}
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                  )}
                  {color === "opponent" && (
                    <path
                      d="M 1 -11.6 Q 3 -14 4.4 -11.2"
                      fill="none"
                      stroke={c}
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                  )}
                  {/* Eyes */}
                  {eyes === "happy" && (
                    <>
                      <path
                        d="M -3 -7 Q -2 -9 -1 -7"
                        fill="none"
                        stroke={c}
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                      <path
                        d="M 1 -7 Q 2 -9 3 -7"
                        fill="none"
                        stroke={c}
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </>
                  )}
                  {eyes === "wide" && (
                    <>
                      <circle cx="-2.5" cy="-7" r="1.7" fill={c} />
                      <circle cx="2.5" cy="-7" r="1.7" fill={c} />
                    </>
                  )}
                  {eyes === "dazed" && (
                    <>
                      <line
                        x1="-3.5"
                        y1="-8"
                        x2="-1.5"
                        y2="-6"
                        stroke={c}
                        strokeWidth="1.4"
                        strokeLinecap="round"
                      />
                      <line
                        x1="-1.5"
                        y1="-8"
                        x2="-3.5"
                        y2="-6"
                        stroke={c}
                        strokeWidth="1.4"
                        strokeLinecap="round"
                      />
                      <line
                        x1="1.5"
                        y1="-8"
                        x2="3.5"
                        y2="-6"
                        stroke={c}
                        strokeWidth="1.4"
                        strokeLinecap="round"
                      />
                      <line
                        x1="3.5"
                        y1="-8"
                        x2="1.5"
                        y2="-6"
                        stroke={c}
                        strokeWidth="1.4"
                        strokeLinecap="round"
                      />
                    </>
                  )}
                  {eyes === "thinking" && (
                    <>
                      <line
                        x1="-3.5"
                        y1="-7"
                        x2="-1.5"
                        y2="-7"
                        stroke={c}
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <line
                        x1="1.5"
                        y1="-7"
                        x2="3.5"
                        y2="-7"
                        stroke={c}
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </>
                  )}
                  {eyes === "neutral" && (
                    <>
                      <circle cx="-2.5" cy="-7" r="1" fill={c} />
                      <circle cx="2.5" cy="-7" r="1" fill={c} />
                    </>
                  )}
                  {/* Mouth */}
                  {mouth === "smile" && (
                    <path
                      d="M -3 -3.6 Q 0 -1.8 3 -3.6"
                      fill="none"
                      stroke={c}
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  )}
                  {mouth === "o" && (
                    <circle
                      cx="0"
                      cy="-3.2"
                      r="1.5"
                      fill="none"
                      stroke={c}
                      strokeWidth="1.2"
                    />
                  )}
                  {mouth === "flat" && (
                    <line
                      x1="-2"
                      y1="-3.2"
                      x2="2"
                      y2="-3.2"
                      stroke={c}
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  )}
                  {mouth === "neutral" && (
                    <path
                      d="M -2 -3.4 Q 0 -2.9 2 -3.4"
                      fill="none"
                      stroke={c}
                      strokeWidth="1.2"
                      strokeLinecap="round"
                    />
                  )}
                </g>
              </g>

              {/* Arms, shouldering from mid-torso */}
              <g transform="translate(20 21)">
                <g style={joint(p.lS)}>{limb(p.lE, 6.5, 6.5)}</g>
              </g>
              <g transform="translate(20 21)">
                <g style={joint(p.rS)}>{limb(p.rE, 6.5, 6.5)}</g>
              </g>

              {/* Legs, hinging at the hips */}
              <g transform="translate(20 32)">
                <g style={joint(p.lH)}>{limb(p.lK, 6.5, 5.5)}</g>
              </g>
              <g transform="translate(20 32)">
                <g style={joint(p.rH)}>{limb(p.rK, 6.5, 5.5)}</g>
              </g>
            </g>

            {/* Impact dust puffs */}
            {state === "impact" && (
              <g>
                <circle
                  className="tf-dust"
                  cx="5"
                  cy="47"
                  r="2.6"
                  fill={c}
                  fillOpacity={0.5}
                />
                <circle
                  className="tf-dust"
                  cx="20"
                  cy="48"
                  r="3.4"
                  fill={c}
                  fillOpacity={0.5}
                  style={{ animationDelay: "0.12s" }}
                />
                <circle
                  className="tf-dust"
                  cx="35"
                  cy="47"
                  r="2.6"
                  fill={c}
                  fillOpacity={0.5}
                  style={{ animationDelay: "0.24s" }}
                />
              </g>
            )}
          </svg>
        </div>
      </div>

      {/* Label */}
      {label && (
        <span
          style={{
            fontSize: "var(--text-xs)",
            color: c,
            fontWeight: 600,
            fontFamily: "var(--font-body)",
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
};
