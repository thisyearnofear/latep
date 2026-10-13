import { useState } from "react";
import { TrustFallCharacter } from "../components/TrustFallCharacter";
import {
  getHandPosition,
  RIG,
  type CharacterState,
} from "../components/trustFallRig";
import { Thread } from "../components/receipt/Thread";
import { OUTCOMES } from "../content/vocabulary";

/**
 * Review page for the rig (ticket B2). Every pose in both facings, on both
 * surfaces, plus the four outcome pairings with their threads, plus the hand
 * anchors B3 hangs the thread from.
 */

const LEAN_STATES: CharacterState[] = [
  "standing",
  "leaning",
  "held",
  "holding-back",
  "toppled",
];

const LEGACY_STATES: CharacterState[] = [
  "waiting",
  "thinking",
  "celebrating",
  "falling",
  "caught",
  "impact",
];

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <section style={{ marginBottom: 48 }}>
    <h2
      style={{
        font: "var(--font-print)",
        fontSize: 12,
        letterSpacing: "0.06em",
        marginBottom: 16,
        color: "var(--color-counter-muted)",
      }}
    >
      {title}
    </h2>
    {children}
  </section>
);

const Grid = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
      gap: 16,
    }}
  >
    {children}
  </div>
);

const Cell = ({
  label,
  children,
  dark,
}: {
  label: string;
  children: React.ReactNode;
  dark?: boolean;
}) => (
  <div
    style={{
      border: "1px solid var(--color-counter-rule)",
      padding: 12,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 8,
      minHeight: 120,
      justifyContent: "center",
      background: dark ? "var(--color-receipt)" : undefined,
      color: dark ? "var(--color-receipt-ink)" : undefined,
    }}
  >
    {children}
    <code
      style={{
        font: "var(--font-print)",
        fontSize: 11,
        color: dark
          ? "var(--color-receipt-faded)"
          : "var(--color-counter-muted)",
      }}
    >
      {label}
    </code>
  </div>
);

/** The hand anchor, drawn as a dot so B3 can check the thread lands right. */
function HandDot({
  state,
  facing,
}: {
  state: CharacterState;
  facing: "left" | "right";
}) {
  const h = getHandPosition(state, "right", facing);
  return (
    <svg
      width="48"
      height="56"
      viewBox="-4 -4 48 56"
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      aria-hidden="true"
    >
      <circle cx={h.x} cy={h.y} r="1.6" fill="var(--color-stamp)" />
    </svg>
  );
}

export function RigPreview() {
  const [surface, setSurface] = useState<"counter" | "receipt">("counter");

  return (
    <div
      style={{ padding: "var(--space-lg)", background: "var(--color-counter)" }}
    >
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "var(--text-2xl)",
        }}
      >
        The rig
      </h1>

      <div style={{ marginBottom: 24, display: "flex", gap: 8 }}>
        {(["counter", "receipt"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSurface(s)}
            style={{
              background:
                surface === s ? "var(--color-receipt)" : "transparent",
              color:
                surface === s
                  ? "var(--color-receipt-ink)"
                  : "var(--color-counter-text-2)",
              border: "1px solid var(--color-counter-rule)",
              borderRadius: "var(--radius-sm)",
              padding: "6px 14px",
              fontFamily: "var(--font-body)",
            }}
          >
            {s}
          </button>
        ))}
      </div>

      <Section title="LEAN POSES — facing right">
        <Grid>
          {LEAN_STATES.map((s) => (
            <Cell key={s} label={s} dark={surface === "receipt"}>
              <div style={{ position: "relative" }}>
                <TrustFallCharacter
                  state={s}
                  size="lg"
                  facing="right"
                  surface={surface}
                />
                <HandDot state={s} facing="right" />
              </div>
            </Cell>
          ))}
        </Grid>
      </Section>

      <Section title="LEAN POSES — facing left (mirrored)">
        <Grid>
          {LEAN_STATES.map((s) => (
            <Cell key={s} label={s} dark={surface === "receipt"}>
              <div style={{ position: "relative" }}>
                <TrustFallCharacter
                  state={s}
                  size="lg"
                  facing="left"
                  surface={surface}
                />
                <HandDot state={s} facing="left" />
              </div>
            </Cell>
          ))}
        </Grid>
      </Section>

      <Section title="LEGACY STATES — must still work (B2 keeps them)">
        <Grid>
          {LEGACY_STATES.map((s) => (
            <Cell key={s} label={s} dark={surface === "receipt"}>
              <TrustFallCharacter state={s} size="lg" surface={surface} />
            </Cell>
          ))}
        </Grid>
      </Section>

      <Section title="THE FOUR OUTCOMES — both figures, one thread">
        {OUTCOMES.map((o) => (
          <div
            key={o.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 0",
              borderBottom: "1px solid var(--color-counter-rule)",
            }}
          >
            <span
              style={{
                font: "var(--font-print)",
                fontSize: 12,
                width: 150,
                color: "var(--color-counter-muted)",
              }}
            >
              {o.moves.join(" / ")} → {o.word}
            </span>
            <TrustFallCharacter
              state={poseFor(o.moves[0])}
              size="lg"
              color="you"
              facing="right"
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <Thread
                state={o.thread}
                twists={o.thread === "twisted" ? 3 : 0}
                width={240}
                height={44}
              />
            </div>
            <TrustFallCharacter
              state={poseFor(o.moves[1])}
              size="lg"
              color="opponent"
              facing="left"
            />
          </div>
        ))}
      </Section>

      <Section title="HAND ANCHORS — the numbers B3 attaches the thread to">
        <pre
          style={{
            font: "var(--font-print)",
            fontSize: 11,
            color: "var(--color-counter-text-2)",
            whiteSpace: "pre-wrap",
          }}
        >
          {LEAN_STATES.map((s) => {
            const r = getHandPosition(s, "right", "right");
            const l = getHandPosition(s, "left", "right");
            return `${s.padEnd(14)} right hand (${r.x}, ${r.y})   left hand (${l.x}, ${l.y})`;
          }).join("\n")}
          {`\n\nhips (${RIG.hips.x}, ${RIG.hips.y})   shoulders (${RIG.shoulders.x}, ${RIG.shoulders.y})`}
        </pre>
      </Section>
    </div>
  );
}

/** Map a move to the pose that figure takes (design.md §7). */
function poseFor(move: "C" | "D"): CharacterState {
  return move === "C" ? "leaning" : "holding-back";
}

export default RigPreview;
