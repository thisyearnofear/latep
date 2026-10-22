/**
 * Chapter-edge dissolves (design.md §13.6): each `[data-edge]` band's top
 * edge scrubs its dither mask from mostly dissolved to settled as the band
 * top crosses 90%→60% of the viewport. Native scroll, no pinning.
 *
 * Reduced motion: the CSS settles the edge statically and this hook does
 * nothing. Triggers are killed on unmount so none leak across routes.
 */
import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function useEdgeDissolve<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const bands = root.querySelectorAll<HTMLElement>(".band[data-edge]");
    const triggers: ScrollTrigger[] = [];
    for (const band of bands) {
      const tween = gsap.fromTo(
        band,
        { "--edge-shift": "48px" },
        {
          "--edge-shift": "0px",
          ease: "none",
          scrollTrigger: {
            trigger: band,
            start: "top 90%",
            end: "top 60%",
            scrub: true,
          },
        },
      );
      if (tween.scrollTrigger) triggers.push(tween.scrollTrigger);
    }
    ScrollTrigger.refresh();
    return () => {
      for (const t of triggers) t.kill();
    };
  }, []);

  return ref;
}
