/**
 * StrategyCard — A counter card representing a strategy personality.
 *
 * Shows the strategy's thread pattern, its name, and a muted
 * description. A tinted left rule backs up the pattern — the tint comes
 * from the `chart-tint-N` class, so it matches the charts. Exposes a
 * `data-animate` attribute for GSAP staggered reveals.
 */

import "../../styles/tournament.css";
import type { ThreadPattern } from "../../util/strategies";

interface StrategyCardProps {
  id: string;
  name: string;
  description: string;
  pattern: ThreadPattern;
  /** Index into the chart tints — becomes the `chart-tint-N` class. */
  tint: number;
  selected?: boolean;
  onClick?: () => void;
  compact?: boolean;
}

const StrategyCard: React.FC<StrategyCardProps> = ({
  id,
  name,
  description,
  pattern,
  tint,
  selected = false,
  onClick,
  compact = false,
}) => {
  const isInteractive = typeof onClick === "function";

  const className = [
    "strategy-card",
    `chart-tint-${tint}`,
    compact ? "strategy-card--compact" : "",
    isInteractive ? "strategy-card--interactive" : "",
    selected ? "strategy-card--selected" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={className}
      data-animate="strategy-card"
      data-strategy-id={id}
      onClick={onClick}
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onKeyDown={(e) => {
        if (isInteractive && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      <span
        className={`strategy-card__swatch thread-key thread-key--${pattern}`}
        aria-hidden="true"
      />
      <h3 className="strategy-card__name">{name}</h3>
      {!compact && <p className="strategy-card__desc">{description}</p>}
    </div>
  );
};

export default StrategyCard;
