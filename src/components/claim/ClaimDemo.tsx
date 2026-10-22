/**
 * ClaimDemo — the claim, as a worked example (design.md §13.7).
 *
 * Two counterparties stand at Maria's counter. The stranger has no record and
 * posts the full deposit; the holder shows a proof and posts less. The
 * viewer switches between them and the Desk plate's collateral plinth falls.
 *
 * The claim goes through the reputation seam (§13.8): `claimer.claim` is the
 * only call this component makes, and the UI renders whatever the
 * ClaimResult says. v1's claimer is simulated, so both stamps —
 * ILLUSTRATIVE and IN BUILD — are on the receipt in plain view, not in a
 * tooltip. When the real proof replaces it, nothing here changes.
 *
 * `summary` (optional) swaps the worked example for the reader's own record,
 * which is how /record proves "what a counterparty would learn". With an
 * empty record the holder option is disabled — a claim over nothing proves
 * nothing.
 */

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plate } from "../figures/Plate";
import { STORY_PLATE } from "../figures/figures";
import { Receipt, ReceiptLine, Stamp } from "../receipt";
import { CLAIM_DEMO, RECORD } from "../../content/story";
import { STAMPS } from "../../content/vocabulary";
import {
  createSimulatedClaimer,
  simulatedClaimer,
} from "../../reputation/simulated";
import type {
  ClaimResult,
  ReputationClaimer,
  ReputationSummary,
} from "../../reputation/types";
import "../../styles/claim.css";

type Option = "stranger" | "holder";

/** The claim context: what this proof was made for. Not a secret. */
const CONTEXT = "latep-claim-demo";

export function ClaimDemo({ summary }: { summary?: ReputationSummary }) {
  const [option, setOption] = useState<Option>("stranger");
  const [result, setResult] = useState<ClaimResult | null>(null);

  const empty = summary !== undefined && summary.recorded === 0;
  const holder = option === "holder";

  // The claimer is per-surface: the story surfaces use the worked example;
  // /record hands in the reader's own record. Same interface either way.
  const claimer: ReputationClaimer = useMemo(
    () => (summary ? createSimulatedClaimer(() => summary) : simulatedClaimer),
    [summary],
  );

  // The claim is made when the holder option is chosen — app state, not a
  // drawing finishing. It is re-asked when the summary changes so the page
  // cannot show a stale result over a new record.
  useEffect(() => {
    if (!holder) {
      setResult(null);
      return;
    }
    let cancelled = false;
    void claimer.claim(CLAIM_DEMO.holder.threshold, CONTEXT).then((r) => {
      if (!cancelled) setResult(r);
    });
    return () => {
      cancelled = true;
    };
  }, [holder, claimer]);

  // The collateral the desk asks for. The worked example is fixed copy; the
  // reader's own record comes from the claim result — met, it drops to 40%;
  // unmet, it stays at the full amount.
  const collateralPct = !holder
    ? CLAIM_DEMO.stranger.collateralPct
    : summary
      ? result && result.kind === "simulated" && result.meets
        ? CLAIM_DEMO.holder.collateralPct
        : CLAIM_DEMO.stranger.collateralPct
      : CLAIM_DEMO.holder.collateralPct;

  return (
    <div className="claim-demo">
      <Receipt
        title={CLAIM_DEMO.heading}
        footer={
          <span className="claim-demo__stamps">
            <Stamp text={STAMPS.illustrative} />
            <Stamp text={STAMPS.building} />
          </span>
        }
        className="claim-demo__receipt"
      >
        <div
          className="claim-demo__toggle"
          role="radiogroup"
          aria-label={CLAIM_DEMO.heading}
        >
          <label
            className={[
              "claim-demo__option",
              !holder && "claim-demo__option--on",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <input
              type="radio"
              name="claim-demo"
              value="stranger"
              checked={!holder}
              onChange={() => setOption("stranger")}
            />
            <span>{CLAIM_DEMO.stranger.label}</span>
          </label>
          <label
            className={[
              "claim-demo__option",
              holder && "claim-demo__option--on",
              empty && "claim-demo__option--disabled",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <input
              type="radio"
              name="claim-demo"
              value="holder"
              checked={holder}
              disabled={empty}
              onChange={() => setOption("holder")}
            />
            <span>{summary ? "You" : CLAIM_DEMO.holder.label}</span>
          </label>
        </div>

        {empty && <p className="claim-demo__empty">{RECORD.practiceEmpty}</p>}

        <Plate
          definition={STORY_PLATE}
          step={holder ? "claim" : ""}
          className="claim-demo__plate"
        />

        <div className="claim-demo__lines">
          {!holder ? (
            <p className="claim-demo__line">{CLAIM_DEMO.stranger.line}</p>
          ) : !summary ? (
            <p className="claim-demo__line">{CLAIM_DEMO.holder.line}</p>
          ) : null}

          <ReceiptLine
            label={CLAIM_DEMO.collateralLabel}
            value={`${collateralPct}%`}
            total
          />
          <ReceiptLine
            label={CLAIM_DEMO.learnsLabel}
            value={holder ? CLAIM_DEMO.learnsHolder : CLAIM_DEMO.learnsStranger}
          />
          {summary && (
            <>
              <ReceiptLine label={RECORD.recorded} value={summary.recorded} />
              <ReceiptLine label={RECORD.kept} value={summary.kept} />
              <ReceiptLine
                label={RECORD.keptPct}
                value={`${summary.keptPct}%`}
              />
            </>
          )}
        </div>

        <p className="claim-demo__status">
          <Link to="/#underneath">{CLAIM_DEMO.statusLink}</Link>
        </p>
      </Receipt>
    </div>
  );
}
