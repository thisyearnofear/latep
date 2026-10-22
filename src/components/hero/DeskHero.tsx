/**
 * DeskHero — the story hero (design.md §13.5).
 *
 * One drawn scene, live for exactly one draw-in: the sketch arrives in
 * watery blotches, inks over, and is then snapshotted into an <img> and the
 * renderer disposed — the page holds zero live GL contexts afterwards, so
 * the room keeps the whole context budget for the round (§13.4: at most one
 * live shader per view, and only while it earns it).
 *
 * Gate: the reveal room's capability probe (WebGL, cores/memory, reduced
 * motion) but not its opt-in flag — the hero is the page's drawing, and the
 * fallback is the bare Desk plate on the same wash when the probe or the
 * `?hero=off` override says no. `?hero=on` forces it for shots and
 * comparison. A chunk-load or render error also lands on the plate.
 *
 * The headline never waits for it: this component mounts the plate first
 * and upgrades in place.
 */

import { useEffect, useRef, useState } from "react";
import { Plate } from "../figures/Plate";
import { STORY_PLATE } from "../figures/figures";
import {
  revealRoomSupport,
  type RevealRoomReason,
} from "../reveal-room/capability";

type HeroState = "plate" | "loading" | "live" | "frozen";

function heroMode(): "on" | "off" | "auto" {
  try {
    const value = new URLSearchParams(window.location.search).get("hero");
    if (value === "on" || value === "off") return value;
  } catch {
    /* a malformed URL must not take the page down */
  }
  return "auto";
}

export function DeskHero() {
  const [state, setState] = useState<HeroState>("plate");
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mode = heroMode();
    // The reveal room and the hero never share a view: §13.4 budgets one
    // live shader, and `?room=on` means the round's reveal takes it.
    const roomOn = new URLSearchParams(window.location.search).get("room");
    const support: RevealRoomReason =
      mode === "off" || roomOn === "on"
        ? "disabled"
        : mode === "on"
          ? "ok"
          : revealRoomSupport();
    if (support !== "ok") return;

    let cancelled = false;
    let scene: import("./heroScene").HeroScene | null = null;
    let observer: IntersectionObserver | null = null;

    // Three.js + the scene arrive in one lazy chunk after first paint — the
    // h1 and lede are already on screen before this even starts.
    const boot = async () => {
      setState("loading");
      try {
        const { createHeroScene } = await import("./heroScene");
        if (cancelled || !hostRef.current) return;
        const host = hostRef.current;
        const w = host.clientWidth || 720;
        const h = host.clientHeight || 420;
        scene = createHeroScene(w, h);
        scene.canvas.className = "desk-hero__canvas";
        scene.canvas.setAttribute("aria-hidden", "true");
        // Marker for the stage-parity watcher: this canvas is the hero's
        // scene, not the room's renderer rebuilding mid-reveal.
        scene.canvas.dataset.hero = "true";
        host.appendChild(scene.canvas);
        // Exposed for the pixel checks in e2e: anchors project to screen space.
        (host as HTMLElement & { __heroScene?: unknown }).__heroScene = scene;
        setState("live");

        observer = new IntersectionObserver(
          (entries) => {
            if (!entries[0]?.isIntersecting || cancelled || !scene) return;
            observer?.disconnect();
            void scene.play().then(() => {
              if (cancelled || !scene) return;
              // The one orchestrated moment ends here: bake the frame, drop
              // the renderer, keep the image.
              try {
                scene.renderOnce();
                const url = scene.canvas.toDataURL("image/png");
                if (!cancelled) {
                  setSnapshot(url);
                  setState("frozen");
                }
              } catch {
                /* the frozen image is a nicety; the plate path still works */
              }
              scene?.dispose();
              scene?.canvas.remove();
              scene = null;
            });
          },
          { threshold: 0.15 },
        );
        observer.observe(host);
      } catch {
        if (!cancelled) setState("plate");
      }
    };

    // As soon after first paint as the main thread allows: the frozen image
    // is the band's largest paint, so the LCP settles earliest when the one
    // draw-in runs as early as it can (design.md §13.10).
    const id = window.setTimeout(() => void boot(), 0);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
      observer?.disconnect();
      scene?.dispose();
      scene?.canvas.remove();
    };
  }, []);

  return (
    <div className="desk-hero" ref={hostRef} data-state={state}>
      {/* The plate is the hero's honest fallback and its first paint: it is
          what non-WebGL, reduced-motion, ?hero=off and any failure gets, and
          it is what the live scene replaces when it freezes into an image. */}
      {snapshot ? (
        <img
          className="desk-hero__frozen"
          src={snapshot}
          alt=""
          aria-hidden="true"
        />
      ) : (
        state === "plate" && (
          <Plate definition={STORY_PLATE} bare step="" size="wide" />
        )
      )}
    </div>
  );
}
