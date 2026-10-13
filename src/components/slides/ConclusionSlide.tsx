/**
 * ConclusionSlide — the close of the Learn journey.
 *
 * The page is the counter; everything read closely is printed on receipts
 * (design.md §2): the four rules, the real-world applications, the closing
 * line, and the completion stub. Icons are lucide utility glyphs; there is
 * no emoji.
 */

import React, { useState } from "react";
import { Globe, Landmark, Leaf, ShoppingCart, Vote } from "lucide-react";
import { useWallet } from "../../hooks/useWallet";
import { SlideProps } from "../SlideSystem";
import { Receipt, ReceiptLine, ReceiptStub } from "../receipt";
import "../../styles/ui.css";
import "../../styles/slide-conclusion.css";

export const ConclusionSlide: React.FC<SlideProps> = () => {
  const [showApplications, setShowApplications] = useState(false);
  const { address } = useWallet();

  const realWorldApplications = [
    {
      title: "DeFi protocols",
      Icon: Landmark,
      description:
        "Reputation systems for lending, staking rewards for good behavior",
    },
    {
      title: "Social networks",
      Icon: Globe,
      description: "Trust scores, content moderation, community governance",
    },
    {
      title: "Marketplaces",
      Icon: ShoppingCart,
      description: "Seller ratings, buyer protection, dispute resolution",
    },
    {
      title: "Governance",
      Icon: Vote,
      description: "Voting systems, coalition building, policy cooperation",
    },
    {
      title: "Climate action",
      Icon: Leaf,
      description:
        "Carbon credits, international cooperation, tragedy of commons",
    },
  ];

  // The four rules of a successful strategy, in the locked move vocabulary
  // (design.md §7): the reader sees "lean in" / "hold back", never the game-
  // theory terms.
  const rules = [
    {
      num: "1",
      title: "Be nice",
      text: "Never hold back first. Start by leaning in.",
    },
    {
      num: "2",
      title: "Be provocable",
      text: "Answer a hold-back with a hold-back. Don’t be a pushover.",
    },
    {
      num: "3",
      title: "Be forgiving",
      text: "Return to leaning in once they do.",
    },
    {
      num: "4",
      title: "Be clear",
      text: "Make your strategy easy to understand.",
    },
  ];

  return (
    <div className="conclusion">
      <p data-animate className="conclusion-lead">
        So, what have we learned about trust?
      </p>

      <div data-animate>
        <Receipt className="conclusion-rules" title="The rules of trust">
          <ol className="conclusion-rule-list">
            {rules.map((rule) => (
              <li key={rule.num} className="conclusion-rule">
                <p className="conclusion-rule__title">
                  <span className="conclusion-rule__num">{rule.num}.</span>
                  {rule.title}
                </p>
                <p className="conclusion-rule__text">{rule.text}</p>
              </li>
            ))}
          </ol>
        </Receipt>
      </div>

      <div data-animate className="conclusion-toggle">
        <button
          type="button"
          className="ui-button"
          onClick={() => setShowApplications(!showApplications)}
        >
          {showApplications ? "Hide" : "Show"} real-world applications
        </button>
      </div>

      {showApplications && (
        <div data-animate>
          <Receipt className="conclusion-apps" title="Trust in the real world">
            <ul className="conclusion-app-list">
              {realWorldApplications.map(({ title, Icon, description }) => (
                <li key={title} className="conclusion-app">
                  <p className="conclusion-app__title">
                    <Icon size={18} strokeWidth={2} aria-hidden="true" />
                    {title}
                  </p>
                  <p className="conclusion-app__text">{description}</p>
                </li>
              ))}
            </ul>
          </Receipt>
        </div>
      )}

      <div data-animate>
        <Receipt className="conclusion-quote">
          <p className="conclusion-quote__text">
            “In the end, we’re all in this together. The question isn’t whether
            you <em>can</em> trust someone.
            <br />
            The question is whether you can trust someone{" "}
            <strong>enough</strong>.”
          </p>
        </Receipt>
      </div>

      {address && (
        <div data-animate>
          <Receipt className="conclusion-done">
            <p className="conclusion-done__text">
              Congratulations! You’ve completed the journey.
            </p>
            <ReceiptLine
              label="Your wallet"
              value={
                <ReceiptStub>
                  <span className="conclusion-done__wallet">
                    {address.slice(0, 8)}…{address.slice(-8)}
                  </span>
                </ReceiptStub>
              }
            />
          </Receipt>
        </div>
      )}

      <p data-animate className="conclusion-credits">
        Based on “The Evolution of Trust” by Nicky Case
        <br />
        Enhanced with blockchain technology on Stellar
      </p>
    </div>
  );
};
