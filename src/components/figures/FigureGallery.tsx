import { useState } from "react";
import { Plate } from "./Plate";
import type { PlateDefinition } from "./types";
import { PRIMITIVES } from "../../content/primitives";

/**
 * The plates — a gallery of figures you can operate.
 *
 * The nav is a list of plates, the stage shows one. It is a tablist without
 * the tab semantics: the buttons carry `aria-current`, because a plate is a
 * drawing rather than a panel of a form, and the reading order (list, then
 * drawing) is the order it is read in.
 *
 * The one-line under each name is the primitive's own line, imported from
 * `content/primitives.ts` — the same string the marks carry everywhere else.
 */
export function FigureGallery({
  plates,
  className,
}: {
  plates: readonly PlateDefinition[];
  className?: string;
}) {
  const [activeId, setActiveId] = useState(plates[0]?.id ?? "");
  const active = plates.find((p) => p.id === activeId) ?? plates[0];

  if (!active) return null;

  return (
    <div className={["gallery", className].filter(Boolean).join(" ")}>
      <nav className="gallery__nav" aria-label="Plates">
        <ul className="gallery__list">
          {plates.map((plate) => {
            const primitive = PRIMITIVES.find((p) => p.mark === plate.mark);
            const isActive = plate.id === active.id;
            return (
              <li key={plate.id}>
                <button
                  type="button"
                  className={[
                    "gallery__tab",
                    isActive && "gallery__tab--active",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  aria-current={isActive ? "true" : undefined}
                  onClick={() => setActiveId(plate.id)}
                >
                  <span className="gallery__tab-number">
                    Fig {plate.number}
                  </span>
                  <span className="gallery__tab-name">{plate.name}</span>
                  {primitive && (
                    <span className="gallery__tab-line">
                      {primitive.oneLine}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="gallery__stage">
        <Plate key={active.id} definition={active} />
      </div>
    </div>
  );
}
