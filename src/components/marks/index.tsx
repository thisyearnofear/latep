import type { SVGProps } from "react";

/**
 * The primitive marks — design.md §6.
 *
 * All of them share one register: `currentColor`, 2px stroke, round caps and
 * joins, drawn on a 24px grid so they scale to 48px without redrawing. The
 * caller supplies the colour (a thread colour, receipt ink, counter text), so
 * a mark is never a decoration and never picks its own colour.
 *
 * Each mark is decorative by default (`aria-hidden`). Pass `title` when the
 * mark is the only thing labelling something.
 */

type MarkProps = Omit<SVGProps<SVGSVGElement>, "children"> & {
  size?: number;
  /** Accessible name. Omit for decorative marks next to visible text. */
  title?: string;
};

function Mark({
  size = 24,
  title,
  children,
  ...rest
}: MarkProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      {...rest}
    >
      {title && <title>{title}</title>}
      {children}
    </svg>
  );
}

/**
 * The Seal — a torn stub with a stamp on it.
 * Decide before you see theirs.
 */
export function SealMark(props: MarkProps) {
  return (
    <Mark {...props}>
      {/* the stub: torn along the bottom, so it reads as "detachable" */}
      <path d="M4 2.5h11l4 4v6" />
      <path d="M15 2.5v4h4" />
      <path d="M4 2.5v12.5l2.5-2 2.5 2 2.5-2 2.5 2 2.5-2 2.5 2 1.5-1.2v-3" />
      {/* the stamp, sitting squarely on the stub */}
      <circle cx="12" cy="15" r="4.5" />
      <path d="M9.9 15.1 11.5 16.7 14.2 13.4" />
    </Mark>
  );
}

/**
 * The Handshake — two torn halves whose edges fit.
 * No take-backs.
 */
export function HandshakeMark(props: MarkProps) {
  return (
    <Mark {...props}>
      {/* left half, torn down the middle */}
      <path d="M10.5 3.5 8 6.5l2.5 2.5L8 11.5l2.5 2.5L8 16.5l2.5 2.5" />
      <path d="M10.5 3.5h-7v17h7" />
      {/* right half, the matching edge */}
      <path d="M13.5 3.5 16 6.5l-2.5 2.5 2.5 2.5-2.5 2.5 2.5 2.5-2.5 2.5" />
      <path d="M13.5 3.5h7v17h-7" />
    </Mark>
  );
}

/**
 * The Net — woven thread.
 * Nobody has to be the hero.
 *
 * Drawn as a diamond lattice rather than a square grid: a square grid reads
 * as a window pane at 24px, a diamond mesh reads as netting immediately.
 */
export function NetMark(props: MarkProps) {
  return (
    <Mark {...props}>
      <path d="M12 2.5 21.5 12 12 21.5 2.5 12Z" />
      <path d="M12 7 17 12l-5 5-5-5Z" />
      {/* the four strands running out to the corners, tying the mesh off */}
      <path d="M12 2.5v4.5M21.5 12H17M12 21.5V17M2.5 12H7" />
    </Mark>
  );
}

/**
 * The Pass — a ticket with a punched hole.
 * Prove you belong without saying who you are.
 */
export function PassMark(props: MarkProps) {
  return (
    <Mark {...props}>
      {/* the ticket, notched at both ends of the tear line */}
      <path d="M2.5 8V4.5h19V8a2.5 2.5 0 0 0 0 8v3.5h-19V16a2.5 2.5 0 0 0 0-8Z" />
      {/* the punch: a hole inside the ticket, the one piece of it that's visible */}
      <circle cx="17.25" cy="15.5" r="2.25" />
      {/* what it says */}
      <path d="M5.5 9h5.5M5.5 12h3" />
    </Mark>
  );
}

/**
 * The Record — one leaf of a tree, with the path that reaches the root.
 * Prove your track record without publishing it.
 *
 * Drawn as a leaf rather than a book: the credential is not a document you
 * hand over, it is one entry in a tree whose root anyone can read. The vein is
 * the path to that root — the part the proof carries and the part the counter
 * party never sees.
 */
export function RecordMark(props: MarkProps) {
  return (
    <Mark {...props}>
      {/* the leaf */}
      <path d="M12 2.5c5 4.5 5 14.5 0 19-5-4.5-5-14.5 0-19Z" />
      {/* the midrib: the path up to the root */}
      <path d="M12 2.5v19" />
      {/* two veins off it */}
      <path d="M12 9.5l3.5 2.5M12 14l-3.5 2.5" />
    </Mark>
  );
}

export const MARKS = {
  seal: SealMark,
  handshake: HandshakeMark,
  net: NetMark,
  pass: PassMark,
  record: RecordMark,
} as const;
