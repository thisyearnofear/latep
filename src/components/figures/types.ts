/**
 * The plate types.
 *
 * A plate is a small isometric drawing with parts you can press, printed on
 * receipt stock. Everything about it is data: a list of steps, and for each
 * step the geometry to draw and the lines to print.
 *
 * The steps are the point. Pressing a part moves the plate to the next step,
 * and the next step prints different lines — a mechanism you can watch rather
 * than a picture of one.
 *
 * There is no text on the drawing. SVG type scales with the drawing, and the
 * page has to work from 320px to 1440px; the words live in the HTML around
 * the plate, where they stay the size the reader expects.
 */

import type { PrimitiveId } from "../../content/primitives";
import type { StampText } from "../../content/vocabulary";
import type { Box, Tone, Vec3 } from "./iso";

/** A pressable thing on the plate. */
export interface PlatePart {
  /** Stable id. The step with this id is the one pressing it moves to. */
  id: string;
  /** What the reader is told they are about to do. */
  label: string;
  /** Where it is in the drawing, in plain words. */
  hint?: string;
  /** Where it sits, in world units. */
  at: Vec3;
  /** The tone it takes when pressed. Defaults to `you`. */
  tone?: Tone;
}

/** A printed line, label left and value right — the receipt's own shape. */
export interface PlateLine {
  label: string;
  value: string;
  /** The totals row: the rule above it, the value in bold. */
  total?: boolean;
}

/** The geometry of one step. */
export interface PlateScene {
  boxes: Box[];
  /** Straight lines, already in plate space. */
  lines?: { d: string; tone: Tone; width?: number }[];
  /** Braided threads, in plate space. */
  threads?: { a: string; b: string; toneA: Tone; toneB: Tone }[];
  /** Extra points that widen the viewBox. */
  extent?: Vec3[];
}

/** One state of the plate. */
export interface PlateStep {
  /** The part that arrives here. The first step uses "". */
  id: string;
  /** The parts that can be pressed in this step. */
  parts: PlatePart[];
  scene: PlateScene;
  /** What the plate prints in this step. */
  lines: PlateLine[];
}

/** A whole plate. */
export interface PlateDefinition {
  id: string;
  /** The figure number, printed on the plate: Fig 1, Fig 2 … */
  number: number;
  name: string;
  /** The primitive mark. The story plate carries one; a figure that isn't a
   *  primitive carries none. */
  mark?: PrimitiveId;
  /** One line under the name. */
  caption: string;
  /** The stamps, in order. */
  stamps?: StampText[];
  /** The steps, in order. The first is the resting state. */
  steps: PlateStep[];
  /** Where the reader can go to meet this for real. */
  href?: string;
  hrefLabel?: string;
}
