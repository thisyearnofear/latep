import type { ThreadState } from "../../content/vocabulary";

/* ============================================================================
 * Thread — design.md §6.
 *
 * The relationship between the two players, drawn as one of two 3px strokes.
 *
 *   loose    two separate gentle curves, untwisted
 *   twisted  the two braided along one path, one turn per round of mutual
 *            cooperation (capped at 5 by the caller's `twists`)
 *   snapped  two short frayed ends — someone held back
 *   slack    both ends hanging, nothing gained
 *
 * Shared component: screens import it, they never redraw it.
 *
 * The thread NEVER encodes the moves itself. The caller passes the state it is
 * allowed to show; before the reveal that is always "loose".
 * ========================================================================== */

export interface ThreadProps {
  /** Loose before the reveal, then the outcome's thread state. */
  state: ThreadState;
  /**
   * Trust height: consecutive mutual-cooperation rounds. Drawn up to
   * `MAX_DRAWN_TWISTS`; the exact count is printed on the receipt, never
   * encoded here.
   */
  twists?: number;
  /**
   * Which surface the thread is printed on. Counter uses the bright thread
   * colours; a receipt uses the print variants. Keeps the one-surface rule.
   */
  surface?: "counter" | "receipt";
  width?: number;
  height?: number;
  className?: string;
}

const MAX_TWISTS = 5;

/** Deterministic sine table so a twist never depends on Math.random(). */
function twistOffset(t: number, turns: number, amp: number) {
  return Math.sin(t * Math.PI * 2 * turns) * amp;
}

export function Thread({
  state,
  twists = 0,
  surface = "counter",
  width = 240,
  height = 48,
  className,
}: ThreadProps) {
  const you = `var(--color-you${surface === "receipt" ? "-print" : ""})`;
  const partner = `var(--color-partner${surface === "receipt" ? "-print" : ""})`;

  const midY = height / 2;
  const pad = 8;
  const span = width - pad * 2;

  // A twist is one full period of the sine. `turns` drives the frequency, so
  // 0 twists is a straight run and 5 twists is five crossings — the thread
  // stays the same visual weight as it grows. Amplitude is capped so a short
  // thread doesn't turn into a scribble.
  const amp = Math.min(10, height / 4);
  const turns = Math.max(0, Math.min(MAX_TWISTS, Math.round(twists)));

  const braidedPath = (phase: number) => {
    const points: string[] = [];
    const steps = Math.max(24, turns * 16);
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = pad + t * span;
      // Decay toward both ends so the thread anchors to the two hands.
      const taper = Math.sin(t * Math.PI);
      const y = midY + twistOffset(t, turns, amp * taper) * phase;
      points.push(`${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`);
    }
    return points.join(" ");
  };

  /** Untwisted: two separate gentle curves, clearly a little apart. */
  const loosePath = (sign: number) => {
    const off = sign * Math.max(5, height / 6);
    return `M${pad} ${midY - off} C${pad + span * 0.3} ${midY + off} ${
      pad + span * 0.7
    } ${midY - off} ${pad + span} ${midY - off}`;
  };

  /**
   * Snapped: two short ends pulled apart from the middle, each splaying
   * away from the break so the gap is unmistakable. The break is at 50%.
   */
  const frayedPath = (sign: number) => {
    const gap = span * 0.16;
    const mid = pad + span / 2;
    const lift = sign * Math.max(6, height / 3.5);
    return (
      `M${pad} ${midY - lift * 0.5} ` +
      `Q${pad + span * 0.22} ${midY - lift * 0.9} ${mid - gap / 2} ${midY - lift}` +
      `M${pad + span} ${midY - lift * 0.5} ` +
      `Q${pad + span * 0.78} ${midY - lift * 0.9} ${mid + gap / 2} ${midY - lift}`
    );
  };

  /** Slack: both ends hang, nothing gained. */
  const slackPath = (sign: number) => {
    const drop = sign * Math.max(6, height / 4);
    return `M${pad} ${midY - drop * 0.7} Q${pad + span * 0.28} ${midY + drop} ${
      pad + span * 0.5
    } ${midY - drop * 0.2} T${pad + span} ${midY + drop * 0.8}`;
  };

  const paths = () => {
    switch (state) {
      case "snapped":
        return [
          <path key="you" d={frayedPath(1)} stroke={you} fill="none" />,
          <path
            key="partner"
            d={frayedPath(-1)}
            stroke={partner}
            fill="none"
          />,
        ];
      case "slack":
        return [
          <path key="you" d={slackPath(1)} stroke={you} fill="none" />,
          <path key="partner" d={slackPath(-1)} stroke={partner} fill="none" />,
        ];
      case "twisted":
        // Zero twists is the same picture as loose: a straight untwisted run.
        if (turns === 0) {
          return [
            <path key="you" d={loosePath(1)} stroke={you} fill="none" />,
            <path
              key="partner"
              d={loosePath(-1)}
              stroke={partner}
              fill="none"
            />,
          ];
        }
        return [you, partner].map((c, i) => (
          <path
            key={c}
            d={braidedPath(i === 0 ? 1 : -1)}
            stroke={c}
            fill="none"
          />
        ));
      case "loose":
      default:
        return [
          <path key="you" d={loosePath(1)} stroke={you} fill="none" />,
          <path key="partner" d={loosePath(-1)} stroke={partner} fill="none" />,
        ];
    }
  };

  return (
    <svg
      className={className}
      width="100%"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      fill="none"
      strokeWidth={3}
      strokeLinecap="round"
      aria-hidden="true"
    >
      {paths()}
    </svg>
  );
}
