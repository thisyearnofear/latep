import type { CSSProperties, ReactNode } from "react";
import type { StampText } from "../../content/vocabulary";
import "./receipt.css";

/* ============================================================================
 * The receipt kit — design.md §9.
 *
 * PRESENTATIONAL ONLY. Nothing in this folder computes an outcome, a payoff,
 * or a trust height, and nothing decides what a receipt is allowed to claim.
 * Every prop comes from the caller, and the honesty rules in design.md §7
 * (practice receipts always stamped, tx ids only once confirmed) are the
 * caller's responsibility to satisfy — these components just print what they
 * are told.
 * ========================================================================== */

/* ----------------------------------------------------------------------------
 * Receipt
 * -------------------------------------------------------------------------- */

export interface ReceiptProps {
  /** Header line: what this receipt is. Printed in the print face. */
  title?: string;
  /** Right side of the header — usually a time. */
  time?: string;
  /** Totals or the takeaway. */
  footer?: ReactNode;
  children?: ReactNode;
  /** As wide as its container (for a receipt that carries the scene). */
  wide?: boolean;
  /** Full width minus the gutter. Mobile default. */
  full?: boolean;
  /**
   * Story pages may rotate a receipt by up to ±0.8°. Workbench and lesson
   * receipts are always straight. Values outside the range are clamped.
   */
  tilt?: number;
  /** Play the stepped feed-out. The one orchestrated moment. */
  feeding?: boolean;
  className?: string;
  style?: CSSProperties;
  /** Attributes forwarded to the outer div (e.g. data-flip-id). */
  [attr: `data-${string}`]: string | undefined;
}

const MAX_TILT = 0.8;

export function Receipt({
  title,
  time,
  footer,
  children,
  wide,
  full,
  tilt,
  feeding,
  className,
  style,
  ...attrs
}: ReceiptProps) {
  const classes = [
    "receipt",
    "receipt-edge",
    wide && "receipt--wide",
    full && "receipt--full",
    tilt !== undefined && tilt !== 0 && "receipt--tilt",
    feeding && "receipt--feeding",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={classes}
      {...attrs}
      style={
        tilt !== undefined && tilt !== 0
          ? ({
              "--receipt-tilt": `${Math.max(-MAX_TILT, Math.min(MAX_TILT, tilt))}deg`,
              ...style,
            } as CSSProperties)
          : style
      }
    >
      {(title || time) && (
        <div className="receipt-header">
          <span>{title}</span>
          {time && <span>{time}</span>}
        </div>
      )}
      {children}
      {footer && <div className="receipt-footer">{footer}</div>}
    </div>
  );
}

/* ----------------------------------------------------------------------------
 * ReceiptLine — label left, value right
 * -------------------------------------------------------------------------- */

export interface ReceiptLineProps {
  label: string;
  value: ReactNode;
  /** Draws the dashed rule above and bolds the value. Totals row. */
  total?: boolean;
}

export function ReceiptLine({ label, value, total }: ReceiptLineProps) {
  return (
    <div
      className={total ? "receipt-line receipt-line--total" : "receipt-line"}
    >
      <span className="receipt-line__label">{label}</span>
      <span className="receipt-line__value">{value}</span>
    </div>
  );
}

/* ----------------------------------------------------------------------------
 * TearLine — "this part gets separated and must match later"
 * -------------------------------------------------------------------------- */

export function TearLine({ label }: { label?: string }) {
  return <div className="tear-line">{label && <span>{label}</span>}</div>;
}

/* ----------------------------------------------------------------------------
 * ReceiptStub — the half you tear off and keep
 * -------------------------------------------------------------------------- */

export function ReceiptStub({ children }: { children: ReactNode }) {
  return <span className="receipt-stub">{children}</span>;
}

/* ----------------------------------------------------------------------------
 * Stamp
 *
 * `text` is typed to the stamp set in content/vocabulary.ts, so a component
 * cannot invent a stamp that the honesty rules don't recognise.
 * -------------------------------------------------------------------------- */

export function Stamp({ text }: { text: StampText }) {
  return <span className="stamp">{text}</span>;
}

/* ----------------------------------------------------------------------------
 * Takeaway — printed at the foot of every round receipt (design.md §9)
 *
 * Mark + "Used: The Seal" + one everyday line + where it shows up in life.
 * -------------------------------------------------------------------------- */

export interface TakeawayProps {
  /** The mark component to draw at 24px. */
  Mark: (props: { size?: number; className?: string }) => ReactNode;
  /** "Used: The Seal" */
  used: string;
  /** The one everyday line, e.g. "Decide before you see theirs." */
  line: string;
  /** Where this shows up in real life. */
  where: string;
  /** Optional link to the lesson or round where it's felt. */
  href?: string;
  linkLabel?: string;
}

export function Takeaway({
  Mark: PrimitiveMark,
  used,
  line,
  where,
  href,
  linkLabel = "Where this shows up",
}: TakeawayProps) {
  return (
    <div className="takeaway">
      <span className="takeaway__mark">
        <PrimitiveMark size={24} />
      </span>
      <div className="takeaway__body">
        <span className="takeaway__used">Used: {used}</span>
        <span className="takeaway__line">{line}</span>
        {href ? (
          <a href={href}>{linkLabel}</a>
        ) : (
          <span className="takeaway__line">{where}</span>
        )}
      </div>
    </div>
  );
}
