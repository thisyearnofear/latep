/**
 * Everyday — the collection of everything you've already met.
 *
 * Four receipts, one per primitive, feeding out of the till one after
 * another: mark, situation, the problem as it happens in life, and what the
 * mathematics adds. Rebuilt from `content/primitives.ts` (ticket B5): the
 * primitive list is the single source of truth, so this page can never drift
 * from the marks or the wording used on Home and in the epilogue.
 */
import React from "react";
import { Link } from "react-router-dom";
import { Receipt } from "../components/receipt";
import { Thread } from "../components/receipt/Thread";
import { TrustFallCharacter } from "../components/TrustFallCharacter";
import { MARKS } from "../components/marks";
import { PRIMITIVES, type PrimitiveId } from "../content/primitives";
import "../styles/everyday.css";

/**
 * The everyday story attached to each primitive. The copy here is the
 * page's own; the names, marks and one-liners come from `primitives.ts`.
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

export const RealLifePage: React.FC = () => (
  <div className="everyday">
    <header className="everyday-opening">
      <h1 className="everyday-title">That wasn&rsquo;t just a game</h1>
      <p className="everyday-situation">
        Lean in, hold back, held, toppled — each is a trust problem you already
        have. Here are the four, as you meet them in life.
      </p>
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
                  <h3 className="everyday-situation-title">{item.situation}</h3>
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

    {/* The honest scope, as a small receipt footer. */}
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

    <div className="everyday-actions">
      <Link to="/play" className="everyday-primary">
        Play it with a friend
      </Link>
      <Link to="/learn" className="everyday-secondary">
        Learn the mechanics
      </Link>
    </div>
  </div>
);

export default RealLifePage;
