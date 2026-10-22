import { useState } from "react";
import { Link } from "react-router-dom";
import { MARKS } from "../marks";
import { Stamp } from "../receipt";
import type { PlateDefinition, PlatePart, PlateScene } from "./types";
import { boxCorners, boxFaces, bounds, project, sortBoxes } from "./iso";

/**
 * Plate — a hairline isometric drawing on receipt stock, with parts you press.
 *
 * The figure is drawn in SVG from the geometry in `types.ts`; the semantics
 * live in the buttons underneath it, so the drawing itself stays decorative
 * and the page remains keyboard-navigable. Press a button and the drawing
 * inks that part and the receipt below prints what happened.
 *
 * Colour means decided (design.md §3): a part that has been pressed is
 * inked, a part that has not is pencil. The two thread colours mean you and
 * your partner, exactly as everywhere else in the app.
 */

/** How much room to leave around the drawing, in world units. */
const PAD = 1.4;

export interface PlateProps {
  definition: PlateDefinition;
  /** The story plate is bigger than a gallery plate. */
  size?: "wide" | "gallery";
  /**
   * Controlled step: a step id from `definition.steps`. When given, the plate
   * shows that step and its part buttons report the press instead of
   * switching — the caller owns the state. Omit it and the plate keeps its
   * own step, exactly as before.
   */
  step?: string;
  /** Fires when a part is pressed under a controlled `step`. */
  onStepPress?: (part: PlatePart) => void;
  className?: string;
}

export function Plate({
  definition,
  size = "gallery",
  step: controlledStep,
  onStepPress,
  className,
}: PlateProps) {
  const [ownStepIndex, setOwnStepIndex] = useState(0);
  const [pressedId, setPressedId] = useState<string | null>(null);

  const controlled = controlledStep !== undefined;
  const stepIndex = controlled
    ? Math.max(
        0,
        definition.steps.findIndex((s) => s.id === controlledStep),
      )
    : ownStepIndex;

  const step = definition.steps[stepIndex] ?? definition.steps[0];
  const scene = step.scene;

  const press = (part: PlatePart) => {
    if (controlled) {
      setPressedId(part.id);
      onStepPress?.(part);
      return;
    }
    const next = definition.steps.findIndex((s) => s.id === part.id);
    if (next === -1 || next === stepIndex) return;
    setOwnStepIndex(next);
    setPressedId(part.id);
  };

  const Mark = definition.mark ? MARKS[definition.mark] : null;

  return (
    <figure
      className={["plate", `plate--${size}`, className]
        .filter(Boolean)
        .join(" ")}
    >
      <header className="plate__head">
        <span className="plate__number">Fig {definition.number}</span>
        {Mark && <Mark size={24} className="plate__mark" />}
        <figcaption className="plate__name">{definition.name}</figcaption>
        {definition.stamps?.map((text) => (
          <Stamp key={text} text={text} />
        ))}
      </header>

      <p className="plate__caption">{definition.caption}</p>

      <Drawing scene={scene} parts={step.parts} pressedId={pressedId} />

      {step.parts.length > 0 && (
        <ul className="plate__controls">
          {step.parts.map((part) => (
            <li key={part.id}>
              <button
                type="button"
                className="plate__control"
                onClick={() => press(part)}
              >
                <span className="plate__control-label">{part.label}</span>
                {part.hint && (
                  <span className="plate__control-hint">{part.hint}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      <dl className="plate__lines">
        {step.lines.map((line) => (
          <div
            key={line.label}
            className={["plate__line", line.total && "plate__line--total"]
              .filter(Boolean)
              .join(" ")}
          >
            <dt>{line.label}</dt>
            <dd>{line.value}</dd>
          </div>
        ))}
      </dl>

      {definition.href && (
        <p className="plate__link">
          <Link to={definition.href}>
            {definition.hrefLabel ?? "Meet it for real"}
          </Link>
        </p>
      )}
    </figure>
  );
}

/**
 * The drawing. Decorative: the buttons below carry the meaning, and the
 * rings mark where a part is — they light up when that part is pressed.
 */
function Drawing({
  scene,
  parts,
  pressedId,
}: {
  scene: PlateScene;
  parts: PlatePart[];
  pressedId: string | null;
}) {
  const points = [...scene.boxes.flatMap(boxCorners), ...(scene.extent ?? [])];

  const b = bounds(points.length ? points : [{ x: 0, y: 0, z: 0 }]);
  const viewBox = `${b.min.x - PAD} ${b.min.y - PAD} ${
    b.max.x - b.min.x + PAD * 2
  } ${b.max.y - b.min.y + PAD * 2}`;

  return (
    <div className="plate__stage">
      <svg
        className="plate__figure"
        viewBox={viewBox}
        aria-hidden="true"
        focusable="false"
      >
        {sortBoxes(scene.boxes).map((box) =>
          boxFaces(box).map((face) => (
            <polygon
              key={face.points.map((pt) => `${pt.x},${pt.y}`).join(" ")}
              className={[
                "plate__face",
                `plate__face--${face.tone}`,
                face.solid && "plate__face--solid",
                face.hidden && "plate__face--hidden",
              ]
                .filter(Boolean)
                .join(" ")}
              points={face.points.map((p) => `${p.x},${p.y}`).join(" ")}
            />
          )),
        )}

        {(scene.lines ?? []).map((line) => (
          <path
            key={line.d}
            className={`plate__line-art plate__line-art--${line.tone}`}
            d={line.d}
            strokeWidth={line.width ?? 1}
          />
        ))}

        {(scene.threads ?? []).map((t) => (
          <g key={t.a} className="plate__thread">
            <path className="plate__thread-a" d={t.a} />
            <path className="plate__thread-b" d={t.b} />
          </g>
        ))}

        {parts.map((part) => {
          const p = project(part.at);
          const spent = pressedId === part.id;
          return (
            <circle
              key={part.id}
              className={["plate__marker", spent && "plate__marker--spent"]
                .filter(Boolean)
                .join(" ")}
              cx={p.x}
              cy={p.y}
              r={0.62}
            />
          );
        })}
      </svg>
    </div>
  );
}
