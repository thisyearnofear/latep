import { useState } from "react";
import { MARKS } from "../components/marks";
import {
  Receipt,
  ReceiptLine,
  ReceiptStub,
  Stamp,
  Takeaway,
  TearLine,
} from "../components/receipt";
import { Thread } from "../components/receipt/Thread";
import { getPrimitive } from "../content/primitives";
import {
  MOVE_HELPER,
  MOVE_LABEL,
  OUTCOMES,
  STAMPS,
} from "../content/vocabulary";

/**
 * Review page for the receipt kit and thread (ticket B1b). Every line type,
 * every stamp, a stub with its tear line, and every thread state, on both
 * surfaces.
 */

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

const Row = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div
    style={{
      display: "flex",
      flexWrap: "wrap",
      alignItems: "center",
      gap: 16,
      padding: "8px 0",
    }}
  >
    <span
      style={{
        font: "var(--font-print)",
        fontSize: 12,
        width: 170,
        color: "var(--color-counter-muted)",
      }}
    >
      {label}
    </span>
    {children}
  </div>
);

export function ReceiptPreview() {
  const [feeding, setFeeding] = useState(false);
  const seal = getPrimitive("seal");

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
        Receipt kit
      </h1>

      <Section title="EVERY LINE TYPE">
        <Receipt title="Round 3" time="14:02:11">
          <ReceiptLine label="You" value={MOVE_LABEL.C} />
          <ReceiptLine label="Partner" value={MOVE_LABEL.D} />
          <ReceiptLine label="Points" value="+0 / +3" />
          <ReceiptLine label="Trust twists" value="0" />
          <TearLine />
          <ReceiptStub>Nonce 4889032476950494216</ReceiptStub>
          <div style={{ marginTop: 12 }}>
            <Stamp text={STAMPS.dropped} />
          </div>
          <ReceiptLine label="Total" value="+3" total />
        </Receipt>
      </Section>

      <Section title="TAKEAWAY (the foot of every round receipt)">
        <Receipt
          title="Round 3"
          time="14:02:11"
          footer={
            <Takeaway
              Mark={MARKS.seal}
              used={seal.name}
              line={seal.oneLine}
              where={seal.everyday}
            />
          }
        >
          <ReceiptLine label="Outcome" value={OUTCOMES[1].word} />
        </Receipt>
      </Section>

      <Section title="PRACTICE STAMP — every practice receipt carries one">
        <Row label="practice">
          <Stamp text={STAMPS.practice} />
        </Row>
        <Row label="sealed stub">
          <ReceiptStub>
            <Stamp text={STAMPS.sealed} />
          </ReceiptStub>
        </Row>
        <Row label="pending tx">
          <Stamp text={STAMPS.pending} />
        </Row>
        <Row label="outcome stamps">
          {OUTCOMES.map((o) => (
            <Stamp key={o.id} text={STAMPS[o.id as keyof typeof STAMPS]} />
          ))}
        </Row>
      </Section>

      <Section title="TILT — story pages only, clamped to ±0.8°">
        <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
          <Receipt tilt={0.8} title="Tilted" time="14:02">
            <ReceiptLine label="You" value={MOVE_LABEL.C} />
          </Receipt>
          <Receipt tilt={-0.8} title="Counter-tilted" time="14:02">
            <ReceiptLine label="You" value={MOVE_LABEL.D} />
          </Receipt>
          <Receipt title="Straight (workbench)" time="14:02">
            <ReceiptLine label="You" value={MOVE_LABEL.D} />
          </Receipt>
        </div>
      </Section>

      <Section title="FEED — the one orchestrated moment">
        <button
          type="button"
          onClick={() => setFeeding((f) => !f)}
          style={{
            background: "var(--color-receipt)",
            color: "var(--color-receipt-ink)",
            border: "2px solid var(--color-receipt-ink)",
            borderRadius: "var(--radius-sm)",
            padding: "8px 16px",
            fontFamily: "var(--font-body)",
            fontWeight: 700,
            marginBottom: 16,
          }}
        >
          {feeding ? "Stop" : "Feed"}
        </button>
        <Receipt title="Feeding" time="14:02:11" feeding={feeding}>
          <ReceiptLine label="You" value={MOVE_LABEL.C} />
          <ReceiptLine label="Partner" value={MOVE_LABEL.C} />
          <ReceiptLine label="Total" value="+4" total />
        </Receipt>
      </Section>

      <Section title="THREAD — every state, counter surface">
        {(["loose", "twisted", "snapped", "slack"] as const).map((s) => (
          <Row key={s} label={`${s} (twists 0)`}>
            <Thread state={s} width={300} height={44} />
          </Row>
        ))}
        {[1, 3, 5, 9].map((t) => (
          <Row key={t} label={`twisted — ${t} twists (capped at 5)`}>
            <Thread state="twisted" twists={t} width={300} height={44} />
          </Row>
        ))}
      </Section>

      <Section title="THREAD — receipt surface uses the print variants">
        <div
          style={{
            background: "var(--color-receipt)",
            padding: "var(--space-md)",
          }}
        >
          <Thread
            state="twisted"
            twists={3}
            surface="receipt"
            width={320}
            height={48}
          />
        </div>
      </Section>

      <Section title="MOVES — helper lines are never colour-alone">
        {Object.entries(MOVE_LABEL).map(([k, label]) => (
          <Row key={k} label={`${label} (${k})`}>
            <span style={{ fontFamily: "var(--font-body)" }}>
              {MOVE_HELPER[k as "C" | "D"]}
            </span>
          </Row>
        ))}
      </Section>
    </div>
  );
}

export default ReceiptPreview;
