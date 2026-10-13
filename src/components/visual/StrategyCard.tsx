/**
 * StrategyCard — A counter card representing a strategy personality.
 *
 * Shows the strategy's thread pattern, its name, and a muted
 * description. A tinted left border backs up the pattern. Hover lifts the
 * card; selection adds a 2px rule. Exposes a `data-animate`
 * attribute for GSAP staggered reveals.
 */

import "../../styles/tournament.css";
import type { ThreadPattern } from "../../util/strategies";
import { CSSProperties, useCallback } from "react";
import { useTiltInteraction } from "../../hooks/useSlideAnimation";

interface StrategyCardProps {
  id: string;
  name: string;
  description: string;
  pattern: ThreadPattern;
  barColor: string;
  selected?: boolean;
  onClick?: () => void;
  compact?: boolean;
}

const StrategyCard: React.FC<StrategyCardProps> = ({
  id,
  name,
  description,
  pattern,
  barColor,
  selected = false,
  onClick,
  compact = false,
}) => {
  const isInteractive = typeof onClick === "function";

  const tiltRef = useTiltInteraction<HTMLDivElement>(8);

  const handleSpotlightMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const el = e.currentTarget;
      const rect = el.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      el.style.setProperty("--mouse-x", `${x}%`);
      el.style.setProperty("--mouse-y", `${y}%`);
    },
    [],
  );

  const cardStyle: CSSProperties = {
    position: "relative",
    background: "var(--color-counter-2)",
    border: `1px solid ${selected ? barColor : "var(--color-counter-rule)"}`,
    borderLeft: `4px solid ${barColor}`,
    borderRadius: "var(--radius-sm)",
    padding: compact ? "16px 18px" : "24px 26px",
    cursor: isInteractive ? "pointer" : "default",
    transition:
      "transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease",
    /* No glow: a selected card gets a 2px rule, not a halo. */
    boxShadow: selected ? `0 0 0 2px ${barColor}` : "none",
    overflow: "hidden",
  };

  /* `color` feeds the pattern class's currentColor — an inline `background`
     here would flatten every pattern back to a solid bar. */
  const swatchStyle: CSSProperties = {
    width: compact ? 40 : 56,
    marginBottom: compact ? 8 : 12,
    color: barColor,
  };

  const nameStyle: CSSProperties = {
    fontFamily: "var(--font-display)",
    fontSize: compact ? "1.25rem" : "1.5rem",
    color: "var(--text-primary)",
    margin: 0,
    marginBottom: 6,
    fontWeight: 400,
  };

  const descriptionStyle: CSSProperties = {
    fontFamily: "var(--font-body)",
    fontSize: compact ? "0.8rem" : "0.875rem",
    color: "var(--text-secondary)",
    margin: 0,
    lineHeight: 1.5,
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isInteractive) {
      e.currentTarget.style.transform = "translateY(-4px)";
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.transform = "translateY(0)";
  };

  const spotlightStyle: CSSProperties = {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    background:
      "radial-gradient(circle at var(--mouse-x) var(--mouse-y), rgba(102,126,234,0.15), transparent 40%)",
    zIndex: 1,
  };

  return (
    <div style={{ perspective: "800px" }}>
      <div
        ref={tiltRef}
        className="strategy-card"
        data-animate="strategy-card"
        data-strategy-id={id}
        style={cardStyle}
        onClick={onClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleSpotlightMove}
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
          className={`thread-key thread-key--${pattern}`}
          style={swatchStyle}
          aria-hidden="true"
        />
        <h3 style={nameStyle}>{name}</h3>
        {!compact && <p style={descriptionStyle}>{description}</p>}
        <div style={spotlightStyle} aria-hidden="true" />
      </div>
    </div>
  );
};

export default StrategyCard;
