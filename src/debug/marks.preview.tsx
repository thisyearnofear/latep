/**
 * Review page for the four primitive marks (ticket B1). Not routed in
 * production — open it by importing <MarksPreview /> in a scratch route, or
 * screenshot it via the debug harness.
 *
 * Shows each mark at 24px (the recognisability test) and 48px, on both
 * surfaces, in both thread colours.
 */

import {
  HandshakeMark,
  MARKS,
  NetMark,
  PassMark,
  SealMark,
} from "../components/marks";
import {
  MOVE_HELPER,
  MOVE_LABEL,
  OUTCOMES,
  STAMPS,
} from "../content/vocabulary";
import { PRIMITIVES } from "../content/primitives";

const ALL_MARKS = [
  { id: "seal", Label: "SealMark", Component: SealMark },
  { id: "handshake", Label: "HandshakeMark", Component: HandshakeMark },
  { id: "net", Label: "NetMark", Component: NetMark },
  { id: "pass", Label: "PassMark", Component: PassMark },
] as const;

const Row = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div
    style={{ display: "flex", alignItems: "center", gap: 16, padding: "6px 0" }}
  >
    <span style={{ font: "var(--font-print)", fontSize: 12, width: 150 }}>
      {label}
    </span>
    {children}
  </div>
);

export function MarksPreview() {
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
        Primitive marks
      </h1>

      <section style={{ marginBottom: 40 }}>
        <h2
          style={{
            font: "var(--font-print)",
            letterSpacing: "0.06em",
            fontSize: 12,
          }}
        >
          24PX — RECOGNISABILITY TEST
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          }}
        >
          {ALL_MARKS.map(({ id, Label, Component }) => (
            <div
              key={id}
              style={{
                border: "1px solid var(--color-counter-rule)",
                padding: "var(--space-md)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Component size={24} />
              <code style={{ font: "var(--font-print)", fontSize: 12 }}>
                {Label}
              </code>
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginBottom: 40 }}>
        <h2
          style={{
            font: "var(--font-print)",
            letterSpacing: "0.06em",
            fontSize: 12,
          }}
        >
          48PX, IN THE THREAD COLOURS
        </h2>
        {(
          ["--color-you", "--color-partner", "--color-receipt-ink"] as const
        ).map((colour) => (
          <Row key={colour} label={colour}>
            {ALL_MARKS.map(({ id, Component }) => (
              <Component
                key={id}
                size={48}
                style={{ color: `var(${colour})` }}
              />
            ))}
          </Row>
        ))}
      </section>

      <section style={{ marginBottom: 40 }}>
        <h2
          style={{
            font: "var(--font-print)",
            letterSpacing: "0.06em",
            fontSize: 12,
          }}
        >
          ON RECEIPT STOCK
        </h2>
        <div
          style={{
            background: "var(--color-receipt)",
            color: "var(--color-receipt-ink)",
            padding: "var(--space-md)",
            display: "flex",
            gap: 24,
          }}
        >
          {ALL_MARKS.map(({ id, Component }) => (
            <Component key={id} size={48} />
          ))}
        </div>
      </section>

      <section style={{ marginBottom: 40 }}>
        <h2
          style={{
            font: "var(--font-print)",
            letterSpacing: "0.06em",
            fontSize: 12,
          }}
        >
          PRIMITIVES
        </h2>
        {PRIMITIVES.map((p) => {
          const M = MARKS[p.mark];
          return (
            <div
              key={p.id}
              style={{ display: "flex", gap: 12, padding: "8px 0" }}
            >
              <M size={24} />
              <div>
                <strong>{p.name}</strong> — {p.oneLine}
                <div
                  style={{ color: "var(--color-counter-muted)", fontSize: 14 }}
                >
                  {p.whatItIs} · {p.everyday}
                </div>
              </div>
            </div>
          );
        })}
      </section>

      <section style={{ marginBottom: 40 }}>
        <h2
          style={{
            font: "var(--font-print)",
            letterSpacing: "0.06em",
            fontSize: 12,
          }}
        >
          VOCABULARY
        </h2>
        <div style={{ fontFamily: "var(--font-print)", fontSize: 13 }}>
          {Object.entries(MOVE_LABEL).map(([k, v]) => (
            <div key={k}>
              {v} — {MOVE_HELPER[k as "C" | "D"]}
            </div>
          ))}
          {OUTCOMES.map((o) => (
            <div key={o.id}>
              {o.word} · stamp {o.stamp} · thread {o.thread}
            </div>
          ))}
          {Object.entries(STAMPS).map(([k, v]) => (
            <div key={k}>{v}</div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default MarksPreview;
