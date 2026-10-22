/**
 * Home's chapter motion (the prototype). Three pieces:
 *
 *  - useSheetStack: every `.sheet` is position:sticky with
 *    `top: min(0px, calc(100vh - var(--sheet-h)))` — the sticky-bottom trick,
 *    so a tall chapter still scrolls fully before the next sheet slides over
 *    it. --sheet-h comes from a ResizeObserver (recomputed on resize, on
 *    font load, and once after the route settles). While the next sheet
 *    covers one, ScrollTrigger scrubs it scale 1→0.97 + a scrim overlay
 *    (--sheet-dim 0→0.25).
 *  - useLineReveals: SplitText line reveals on chapter h2 + lede, once,
 *    after fonts.ready, reverted on unmount. Not the hero h1 (LCP), never
 *    inside the stage/receipts.
 *  - useFocusAboveSheets: WCAG 2.4.11 — if a focus lands under a covering
 *    sheet, scroll the focused element's centre into view.
 */

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { easeFromToken, prefersReducedMotion } from "./motion";

gsap.registerPlugin(ScrollTrigger, SplitText);

/* --------------------------------------------------------------------------
 * Sheets
 * ------------------------------------------------------------------------ */

export function useSheetStack(rootRef: React.RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    // Rule: a sheet holding operable content is never covered — only
    // data-sheet="stack" sheets pin; "flow" sheets stay in normal flow and
    // slide over the pinned sheet before them (opaque ground + torn edge).
    const sheets = [...root.querySelectorAll<HTMLElement>(".sheet")];
    if (!sheets.length) return;
    const stacks = sheets.filter((s) => s.dataset.sheet === "stack");
    if (prefersReducedMotion()) return;
    // Sheets stay in normal flow (position:relative fallback) until the
    // deferred setup runs — first paint never waits on this.
    let disposed = false;
    const cleanups: Array<() => void> = [];
    const raf = requestIdleCallback
      ? requestIdleCallback(setup, { timeout: 1500 })
      : window.setTimeout(setup, 200);
    return () => {
      disposed = true;
      if (typeof cancelIdleCallback === "function" && typeof raf === "number")
        cancelIdleCallback(raf);
      for (const c of cleanups) c();
    };

    function setup() {
      if (disposed) return;
      const measure = () => {
        for (const s of stacks) {
          // offsetHeight ignores the cover-scale transform — getBoundingClientRect
          // would shrink --sheet-h by 3% mid-scroll and misplace the pin point.
          s.style.setProperty("--sheet-h", `${s.offsetHeight}px`);
        }
      };
      measure();
      // Re-measure only on real size changes (debounced) — RO doesn't fire
      // on scroll, so nothing reads layout per-frame.
      let rt = 0;
      const ro = new ResizeObserver(() => {
        window.clearTimeout(rt);
        rt = window.setTimeout(() => {
          measure();
          ScrollTrigger.refresh();
        }, 250);
      });
      for (const s of stacks) ro.observe(s);
      void document.fonts.ready.then(measure);
      cleanups.push(() => {
        window.clearTimeout(rt);
        ro.disconnect();
      });

      const triggers: ScrollTrigger[] = [];
      for (let i = 0; i < sheets.length - 1; i++) {
        const sheet = sheets[i];
        if (sheet.dataset.sheet !== "stack") continue;
        const next = sheets[i + 1];
        // Coverage begins when the NEXT sheet's top crosses THIS sheet's
        // pinned bottom edge: pinBottom = min(vh, sheetH) — recomputed on
        // refresh because sheets grow (a round's receipt prints).
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: next,
            start: () =>
              `top ${((Math.min(window.innerHeight, sheet.offsetHeight) / window.innerHeight) * 100).toFixed(1)}%`,
            end: "top top+=48",
            scrub: true,
            invalidateOnRefresh: true,
          },
        });
        tl.to(
          sheet,
          {
            scale: 0.97,
            transformOrigin: "top center",
            ease: "none",
            duration: 1,
          },
          0,
        );
        // The peek strip reads as shadowed paper: dim to 0.45 by 60% cover.
        tl.to(sheet, { "--sheet-dim": 0.45, ease: "none", duration: 0.6 }, 0);
        tl.to(sheet, { "--sheet-dim": 0.45, duration: 0.4 }, 0.6);
        const tween = tl;
        if (tween.scrollTrigger) triggers.push(tween.scrollTrigger);
      }
      ScrollTrigger.refresh();
      cleanups.push(() => {
        for (const t of triggers) t.kill();
      });
    }
  }, [rootRef]);
}

/* --------------------------------------------------------------------------
 * Line reveals — SplitText on chapter h2 + lede only.
 * ------------------------------------------------------------------------ */

export function useLineReveals(rootRef: React.RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (prefersReducedMotion()) return;
    const ease = easeFromToken("--ease-out");
    let splits: SplitText[] = [];
    let triggers: ScrollTrigger[] = [];
    let cancelled = false;

    const idle = (fn: () => void) => {
      const w = window as Window &
        Partial<{
          requestIdleCallback: (
            cb: () => void,
            o?: { timeout: number },
          ) => number;
        }>;
      if (w.requestIdleCallback) w.requestIdleCallback(fn, { timeout: 1500 });
      else window.setTimeout(fn, 200);
    };
    void document.fonts.ready.then(() =>
      idle(() => {
        if (cancelled) return;
        const targets = root.querySelectorAll<HTMLElement>(
          ".chapter .chapter-h, .chapter .chapter-lede",
        );
        for (const el of targets) {
          const split = new SplitText(el, {
            type: "lines",
            mask: "lines",
            autoSplit: true,
            aria: "auto",
            onSplit: (self) => {
              const tween = gsap.from(self.lines, {
                yPercent: 100,
                stagger: 0.08,
                duration: 0.7,
                ease,
                paused: true,
              });
              const trg = ScrollTrigger.create({
                trigger: el,
                start: "top 90%",
                once: true,
                onEnter: () => tween.play(),
              });
              triggers.push(trg);
              // Already on screen at setup — reveal now, never leave a hole.
              if (el.getBoundingClientRect().top < window.innerHeight * 0.9)
                tween.progress(1);
              // SplitText reuses the returned animation on resplits.
              return tween as unknown as void;
            },
          });
          splits.push(split);
        }
        ScrollTrigger.refresh();
      }),
    );

    return () => {
      cancelled = true;
      for (const t of triggers) t.kill();
      for (const s of splits) s.revert();
      splits = [];
      triggers = [];
    };
  }, [rootRef]);
}

/* --------------------------------------------------------------------------
 * Focus guard — never let a covering sheet hide the focused element.
 * ------------------------------------------------------------------------ */

export function useFocusAboveSheets() {
  useLayoutEffect(() => {
    if (prefersReducedMotion()) return;
    const onFocusIn = (e: FocusEvent) => {
      const t = e.target as HTMLElement | null;
      if (!t || !t.closest?.(".sheet")) return;
      const el: HTMLElement = t;
      const centre = () => {
        const r = el.getBoundingClientRect();
        if (!r.width && !r.height) return null;
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      };
      const covered = () => {
        const c = centre();
        if (!c) return false;
        const a = document.elementFromPoint(c.x, c.y);
        return !(a === el || el.contains(a) || a?.contains(el));
      };
      // Chrome scrolls the focused element into view AFTER focusin — defer
      // the reveal until that scroll has landed, then re-check.
      window.setTimeout(reveal, 50);
      return;

      function reveal() {
        if (!covered()) return;
        // offsetTop on a sticky element reports the STUCK offset, not the flow
        // position — so read flow positions by unpinning momentarily.
        const flowTop = (n: HTMLElement) => {
          const sheet = n.closest<HTMLElement>(".sheet") ?? n;
          const prev = sheet.style.position;
          sheet.style.position = "relative";
          const t = n.getBoundingClientRect().top + window.scrollY;
          sheet.style.position = prev;
          return t;
        };
        const sheet = el.closest<HTMLElement>(".sheet")!;
        const sheetTop = flowTop(sheet);
        const elTop = flowTop(el);
        const elH = el.offsetHeight;
        const vh = window.innerHeight;
        const root = document.documentElement;
        const prevBehavior = root.style.scrollBehavior;
        root.style.scrollBehavior = "auto";
        // Candidate A: element's flow position (its sheet is unstuck there for
        // short sheets). Candidate B: the deepest scroll where the NEXT sheet
        // hasn't yet slid over the element while its sheet is pinned —
        // nextSheet.flowTop - (pinTop + elOffset + elH).
        const next = sheet.nextElementSibling;
        const candidates = [elTop - vh * 0.4];
        if (next instanceof HTMLElement && next.classList.contains("sheet")) {
          const pinTop = Math.min(0, vh - sheet.offsetHeight);
          candidates.push(
            flowTop(next) - pinTop - (elTop - sheetTop) - elH - 8,
          );
        }
        for (const y of candidates) {
          window.scrollTo(0, Math.max(0, y));
          if (!covered()) break;
        }
        // Convergent fallback: park the element at 40% viewport.
        for (let i = 0; i < 20 && covered(); i++) {
          const r = el.getBoundingClientRect();
          window.scrollTo(0, Math.max(0, window.scrollY + r.top - vh * 0.4));
        }
        root.style.scrollBehavior = prevBehavior;
      }
    };
    document.addEventListener("focusin", onFocusIn);
    return () => document.removeEventListener("focusin", onFocusIn);
  }, []);
}

/* --------------------------------------------------------------------------
 * Chapter rail — topmost sheet covering ≥50% of the viewport is current.
 * ------------------------------------------------------------------------ */

export function useCurrentChapter(
  rootRef: React.RefObject<HTMLElement | null>,
  ids: readonly string[],
) {
  const current = useRef<string | null>(null);
  const callbacks = useRef(new Set<(id: string | null) => void>());
  const subscribe = (fn: (id: string | null) => void) => {
    callbacks.current.add(fn);
    return () => void callbacks.current.delete(fn);
  };

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const update = () => {
      // The current chapter = the sheet on TOP at the 40% band. Later sheets
      // paint over earlier ones, so take the LAST sheet whose rect covers
      // the point.
      const y = window.innerHeight * 0.4;
      let found: string | null = null;
      for (const id of ids) {
        const sec = document.getElementById(id);
        if (!sec) continue;
        const r = sec.getBoundingClientRect();
        if (r.top <= y && r.bottom >= y) found = id;
      }
      if (found !== current.current) {
        current.current = found;
        for (const fn of callbacks.current) fn(found);
      }
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [rootRef, ids]);

  return { current, subscribe };
}
