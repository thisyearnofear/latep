/**
 * ShareableResult — generates a shareable text/image result for social media.
 *
 * After completing a tournament or ZK game, users can share their result.
 * Generates a compact text summary and provides copy/share buttons.
 */

import React, { useState } from "react";
import { Check, Copy, Share2 } from "lucide-react";
import { Receipt } from "../receipt";
import "../../styles/ui.css";

interface ShareableResultProps {
  title: string;
  score?: number;
  opponentScore?: number;
  outcome?: "win" | "lose" | "tie";
  strategy?: string;
  rounds?: number;
  cooperationRate?: number;
}

export const ShareableResult: React.FC<ShareableResultProps> = ({
  title,
  score,
  opponentScore,
  outcome,
  strategy,
  rounds,
  cooperationRate,
}) => {
  const [copied, setCopied] = useState(false);

  const buildShareText = () => {
    let text = `Latep — ${title}\n`;
    if (score !== undefined && opponentScore !== undefined) {
      text += `Score: ${score > 0 ? "+" : ""}${score} vs ${opponentScore > 0 ? "+" : ""}${opponentScore}`;
      if (outcome === "win") text += " — Won!";
      else if (outcome === "tie") text += " — Tie.";
      else if (outcome === "lose") text += " — Lost.";
      text += "\n";
    }
    if (strategy) text += `Strategy: ${strategy}\n`;
    if (rounds) text += `Rounds: ${rounds}\n`;
    if (cooperationRate !== undefined)
      text += `Leaned in: ${cooperationRate}%\n`;
    text += "Play: https://latep.trustfall.xyz";
    return text;
  };

  const shareText = buildShareText();

  const copyToClipboard = () => {
    void navigator.clipboard.writeText(shareText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const shareNative = () => {
    if (navigator.share) {
      navigator
        .share({ text: shareText, url: "https://latep.trustfall.xyz" })
        .catch(() => {});
    } else {
      copyToClipboard();
    }
  };

  return (
    <Receipt title="Share your result">
      <pre className="ui-share__text">{shareText}</pre>

      <div className="ui-share__actions">
        <button
          onClick={copyToClipboard}
          type="button"
          className="ui-button ui-button--on-receipt"
        >
          {copied ? (
            <>
              <Check size={16} aria-hidden /> Copied
            </>
          ) : (
            <>
              <Copy size={16} aria-hidden /> Copy
            </>
          )}
        </button>
        <button
          onClick={shareNative}
          type="button"
          className="ui-button ui-button--on-receipt"
        >
          <Share2 size={16} aria-hidden /> Share
        </button>
      </div>
    </Receipt>
  );
};
