/**
 * Where it goes — /real-life (design.md §13.7).
 *
 * The game is the first place a record is earned; this page is where it gets
 * spent. Three illustrated scenarios — credit, escrow, agent payments — each
 * stamped ILLUSTRATIVE, each naming the primitives it uses, the Record among
 * them, and each ending at the claim demo. Below them the four primitive
 * receipts that exist today stay, under "Live today".
 *
 * A story page, so it sits on the desk. The four receipts are the same ones
 * this page has always printed — content and links unchanged, only the
 * surface under them is new.
 */
import React from "react";
import { Link } from "react-router-dom";
import { Receipt, Stamp } from "../components/receipt";
import { TrustFallCharacter } from "../components/TrustFallCharacter";
import { Thread } from "../components/receipt/Thread";
import { MARKS } from "../components/marks";
import { PRIMITIVES, type PrimitiveId } from "../content/primitives";
import { STAMPS } from "../content/vocabulary";
import { SCENARIOS, WHERE_IT_GOES } from "../content/story";
import "../styles/everyday.css";

/**
 * The four primitives as they turn up in everyday life — the "Live today"
 * strip. Each entry names where you have already felt the primitive and
 * where to meet it in the app.
 */
interface Everyday {
  id: PrimitiveId;
  /** The situation someone has actually been in. */
  situation: string;
  /** What goes wrong without it. */
  problem: string;
  /** What the mathematics adds — one line, honestly. */
  adds: string;
  /** Where you already felt this. */
  tryHref: string;
  tryLabel: string;
}

const EVERYDAY: Everyday[] = [
  {
    id: "seal",
    situation: "Class votes and community polls",
    problem:
      "See who voted what first, and the popular option snowballs — people vote to please, not to choose.",
    adds: "Commit a hash first, reveal after the count. Nothing changes, and nothing leaks early.",
    tryHref: "/",
    tryLabel: "Play the round again",
  },
  {
    id: "handshake",
    situation: "Deals with strangers online",
    problem:
      "They deliver, you ghost — or the price quietly “shifts” after you\u2019ve committed.",
    adds: "Both sides bind to a proof before revealing. Once you let go, the arithmetic holds you to it.",
    tryHref: "/learn/play",
    tryLabel: "Practise the handshake",
  },
  {
    id: "net",
    situation: "Group buys and shared deposits",
    problem:
      "Twenty people send money to one organiser. The order goes wrong — who refunds?",
    adds: "The contract holds the pot and settles on agreed conditions. Nobody has to be the trustworthy hero.",
    tryHref: "/play",
    tryLabel: "See it settle on-chain",
  },
  {
    id: "pass",
    situation: "Members-only drops and doors",
    problem:
      "Proving you belong usually means handing your identity to a stranger.",
    adds: "A membership proof says “I\u2019m on the list” without naming which entry is yours.",
    tryHref: "/play",
    tryLabel: "See it live on the play screen",
  },
];

/* Story-page tilt, within the ±0.8° rule. */
const TILTS = [-0.6, 0.5, -0.4, 0.7];

/** The wash each scenario lies on: desk, clay, desk (§13.7). */
const SCENARIO_GROUND = ["desk", "clay", "desk"] as const;

export const RealLifePage: React.FC = () => (
  <div className="everyday">
    <header className="everyday-opening">
      <h1 className="everyday-title">
        {WHERE_IT_GOES.title}{" "}
        <span className="everyday-tint">{WHERE_IT_GOES.tint}</span>
      </h1>
      <p className="everyday-situation">{WHERE_IT_GOES.lede}</p>
      <div className="everyday-scene" aria-hidden="true">
        <TrustFallCharacter color="you" state="leaning" size="xl" />
        <Thread state="twisted" twists={4} width={160} height={40} />
        <TrustFallCharacter
          color="opponent"
          state="leaning"
          size="xl"
          facing="left"
        />
      </div>
    </header>

    {/* The three scenarios, numbered like the chapters on Home. */}
    {SCENARIOS.map((scenario, i) => (
      <section
        key={scenario.id}
        className={`scenario scenario--${SCENARIO_GROUND[i]}`}
        aria-labelledby={`scenario-${scenario.id}-h`}
      >
        <div className="scenario-inner">
          <p className="chapter-label">
            <span className="chapter-number">0{i + 1}</span>
            <span className="chapter-name">{scenario.kicker}</span>
          </p>
          <h2 className="chapter-h" id={`scenario-${scenario.id}-h`}>
            {scenario.title}
          </h2>
          <div className="scenario-body">
            <div className="scenario-text">
              <p className="scenario-line">
                <strong>{WHERE_IT_GOES.todayLabel}.</strong> {scenario.today}
              </p>
              <p className="scenario-line">
                <strong>{WHERE_IT_GOES.withLabel}.</strong> {scenario.withLatep}
              </p>
              <p className="scenario-line">
                <Link to="/#fourth" className="everyday-link">
                  {WHERE_IT_GOES.demoLink}
                </Link>
              </p>
            </div>
            <Receipt title={WHERE_IT_GOES.usesLabel} className="scenario-uses">
              {scenario.uses.map((id) => {
                const primitive = PRIMITIVES.find((p) => p.id === id);
                if (!primitive) return null;
                const Mark = MARKS[primitive.mark];
                return (
                  <div key={id} className="scenario-use">
                    <Mark size={24} />
                    <span>{primitive.name}</span>
                  </div>
                );
              })}
              <div className="scenario-uses__stamp">
                <Stamp text={STAMPS.illustrative} />
              </div>
            </Receipt>
          </div>
        </div>
      </section>
    ))}

    {/* Live today — the four receipts that already exist. */}
    <section className="everyday-live" aria-labelledby="everyday-live-h">
      <div className="scenario-inner">
        <h2 className="chapter-h" id="everyday-live-h">
          {WHERE_IT_GOES.liveToday}
        </h2>
        <p className="everyday-live-line">{WHERE_IT_GOES.liveTodayLine}</p>

        <ul className="everyday-list">
          {EVERYDAY.map((item, i) => {
            const primitive = PRIMITIVES.find((p) => p.id === item.id);
            if (!primitive) return null;
            const Mark = MARKS[primitive.mark];
            return (
              <li key={item.id}>
                <Receipt
                  wide
                  tilt={TILTS[i]}
                  feeding
                  className="everyday-receipt"
                  title={primitive.name}
                  footer={
                    <p className="everyday-try">
                      {primitive.everyday}.{" "}
                      <Link to={item.tryHref}>{item.tryLabel} &rarr;</Link>
                    </p>
                  }
                >
                  <div className="everyday-head">
                    <span className="everyday-mark">
                      <Mark size={40} />
                    </span>
                    <div>
                      <h3 className="everyday-situation-title">
                        {item.situation}
                      </h3>
                      <p className="everyday-oneline">{primitive.oneLine}</p>
                    </div>
                  </div>
                  <p className="everyday-problem">{item.problem}</p>
                  <p className="everyday-adds">{item.adds}</p>
                </Receipt>
              </li>
            );
          })}
        </ul>
      </div>
    </section>

    {/* The honest scope stays at the bottom — it says what the page's claims
        do NOT cover, which SCOPE on Home does not duplicate. */}
    <div className="everyday-scope">
      <Receipt
        full
        title="Honest scope"
        footer={
          <p className="everyday-scope-text">
            Stellar is a transparent ledger: this proves <em>moves</em> and{" "}
            <em>membership</em> — not balances, not identity privacy. Stakes are
            testnet play money.
          </p>
        }
      >
        <p className="everyday-scope-text">
          Every claim on this page is one the app can show you.
        </p>
      </Receipt>
    </div>
  </div>
);

export default RealLifePage;
