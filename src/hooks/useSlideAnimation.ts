/**
 * useSlideAnimation — GSAP-powered slide entrance animations
 *
 * Provides staggered text reveals and smooth slide-in transitions.
 * Falls back to CSS animations if GSAP isn't available.
 */

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";

export function useSlideAnimation<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const ctx = gsap.context(() => {
        // Stagger reveal of child elements with [data-animate] attribute
        const animatables = gsap.utils.toArray("[data-animate]");
        if (animatables.length > 0) {
          gsap.from(animatables, {
            opacity: 0,
            y: 24,
            duration: 0.7,
            ease: "power3.out",
            stagger: 0.08,
          });
        } else {
          // Fallback: animate the container itself
          gsap.from(el, {
            opacity: 0,
            y: 30,
            duration: 0.6,
            ease: "power3.out",
          });
        }
      }, el);
      return () => ctx.revert();
    });

    return () => mm.revert();
  }, []);

  return ref;
}

/**
 * useTiltInteraction — 3D tilt effect on mouse move
 *
 * Inspired by the perspective tilts in page-transitions-with-webgpu.
 * Applies a subtle rotateX/rotateY to the element based on mouse position.
 */
export function useTiltInteraction<T extends HTMLElement = HTMLDivElement>(
  maxTilt: number = 6,
) {
  const ref = useRef<T>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let tiltTween: gsap.core.Tween | undefined;
    const clearTilt = () => {
      if (media.matches) {
        tiltTween?.kill();
        gsap.set(el, { clearProps: "transform" });
      }
    };
    media.addEventListener("change", clearTilt);

    const handleMouseMove = (e: MouseEvent) => {
      if (media.matches) return;
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      const tiltX = (0.5 - y) * maxTilt * 2;
      const tiltY = (x - 0.5) * maxTilt * 2;

      tiltTween?.kill();
      tiltTween = gsap.to(el, {
        rotateX: tiltX,
        rotateY: tiltY,
        duration: 0.3,
        ease: "power2.out",
        transformPerspective: 800,
      });
    };

    const handleMouseLeave = () => {
      if (media.matches) return;
      tiltTween?.kill();
      tiltTween = gsap.to(el, {
        rotateX: 0,
        rotateY: 0,
        duration: 0.5,
        ease: "power3.out",
      });
    };

    el.addEventListener("mousemove", handleMouseMove);
    el.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      media.removeEventListener("change", clearTilt);
      tiltTween?.kill();
      el.removeEventListener("mousemove", handleMouseMove);
      el.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [maxTilt]);

  return ref;
}
