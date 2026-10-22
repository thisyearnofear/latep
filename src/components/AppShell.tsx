/**
 * AppShell — the persistent top strip.
 *
 * A counter strip: wordmark left, four links, wallet right. Never two rows
 * (design.md §10). Under 768px it collapses to the wordmark plus a Menu
 * button, because four links and a wallet cannot share one row at 320px
 * without the labels wrapping.
 */

import React, { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import gsap from "gsap";
import { markFlightVT, peekFlipId } from "./transitions/flipHandoff";
import {
  cssToken,
  tokenMs,
  cubicBezier,
  prefersReducedMotion,
} from "./transitions/motion";
import "../styles/transitions.css";
import { Volume2, VolumeX } from "lucide-react";
import ConnectAccount from "./ConnectAccount.tsx";
import { useAudioSettings } from "../hooks/useAudioSettings";
import { useGameStats } from "../hooks/useGameStats";
import { usePracticeRecord } from "../hooks/usePracticeRecord";
import { TrustFallCharacter } from "./TrustFallCharacter";
import "../styles/shell.css";

/**
 * Nav labels are Decision 2 in REDESIGN_PLAN §9, amended by design.md §10:
 * plain language over jargon, and the third link now reads "Where it goes".
 * `/play` is _Play with a friend_ — still the only label that can hint at
 * the stake without promising it.
 */
const NAV_ITEMS = [
  { to: "/learn", label: "Learn" },
  { to: "/tournament", label: "Tournament" },
  { to: "/real-life", label: "Where it goes" },
  { to: "/play", label: "Play with a friend" },
] as const;

/**
 * The surface a page sits on (design.md §13.2): story pages lie on the desk —
 * light warm paper, ink text — while lesson and workbench pages keep the
 * dark counter. The shell strip takes the surface of the page it sits on, so
 * the nav, the chip and the wallet are restyled with it.
 */
const DESK_ROUTES = new Set(["/", "/record", "/real-life"]);

const samePage = (a: string, b: string) => {
  if (a === b) return true;
  // /play and /play/:gameId are one screen — no transition between them.
  return a.startsWith("/play") && b.startsWith("/play");
};

const AppShell: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;
  const isLesson = pathname === "/learn";
  const surface = DESK_ROUTES.has(pathname) ? "desk" : "counter";
  const mainRef = useRef<HTMLElement>(null);
  const layerRef = useRef<HTMLDivElement | null>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const scrollMap = useRef(new Map<string, number>());
  const prevRef = useRef(location);
  const vtPending = useRef(false);
  const runningVt = useRef<ViewTransition | null>(null);
  const audioManager = useAudioSettings();
  const [audioOpen, setAudioOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const audioButtonRef = React.useRef<HTMLButtonElement>(null);
  const menuButtonRef = React.useRef<HTMLButtonElement>(null);
  const { getStats } = useGameStats();
  const { getEntries } = usePracticeRecord();
  // Every receipt on the record: on-chain games plus practice rounds. The
  // count is hidden when there is nothing yet — a zero is not an achievement
  // (design.md §13.7).
  const recordCount = getStats().history.length + getEntries().length;

  const closeMenus = () => {
    setAudioOpen(false);
    setMenuOpen(false);
  };

  // --- view-transition navigation -------------------------------------------
  //
  // The app uses declarative <Routes>, so the VT is driven manually: a
  // delegated document listener intercepts internal link clicks (bubble
  // phase — React's synthetic onClick runs first, so the Flip stash and the
  // receipt's view-transition-name are set before the snapshot). Back/forward
  // keeps the GSAP clone fallback below (POP can't be intercepted here).
  const navigateWithTransition = (to: string, linkEl?: HTMLElement | null) => {
    runningVt.current?.skipTransition();
    const toPath = to.split(/[?#]/)[0];
    const mode =
      DESK_ROUTES.has(pathname) !== DESK_ROUTES.has(toPath) ? "feed" : "swap";
    document.documentElement.dataset.vt = mode;
    if (mode === "swap" && linkEl) {
      // The nav label morphs into the new h1 — only one element may hold the
      // name, so strip it from the old h1 first.
      for (const el of document.querySelectorAll("[data-vt-title]"))
        el.removeAttribute("data-vt-title");
      linkEl.style.viewTransitionName = "page-title";
    }
    vtPending.current = true;
    const vt = document.startViewTransition(() => {
      // The Flip stash is created by the link's React onClick — which runs
      // after this capture-phase intercept — so mark the flight here, inside
      // the VT callback, where the stash already exists.
      if (toPath === "/record") markFlightVT();
      // eslint-disable-next-line react-dom/no-flush-sync -- view transitions need a synchronous DOM swap
      flushSync(() => {
        void navigate(to);
      });
      window.scrollTo(0, 0);
    });
    (document as Document & { __vtUsed?: boolean }).__vtUsed = true;
    runningVt.current = vt;
    void vt.finished.finally(() => {
      delete document.documentElement.dataset.vt;
      if (linkEl) linkEl.style.viewTransitionName = "";
      const hash = to.split("#")[1];
      if (!hash) {
        const h1 = document.querySelector<HTMLElement>("main h1");
        if (h1) {
          if (!h1.hasAttribute("tabindex")) h1.setAttribute("tabindex", "-1");
          h1.focus({ preventScroll: true });
        }
      }
    });
  };

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      )
        return;
      const a = (e.target as HTMLElement).closest?.("a[href]");
      if (!a || !(a instanceof HTMLAnchorElement)) return;
      if (a.target || a.hasAttribute("download")) return;
      const url = new URL(a.href);
      if (url.origin !== window.location.origin) return;
      // Hash-only or same-path links (incl. /play <-> /play/:gameId) stay with
      // the router — no transition.
      if (samePage(url.pathname, pathname)) return;
      if (!("startViewTransition" in document)) return;
      e.preventDefault();
      navigateWithTransition(url.pathname + url.search + url.hash, a);
    };
    // Capture phase: intercept BEFORE React Router's link handler sees the
    // click, so our preventDefault keeps ownership of the navigation.
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // --- route transition (design.md §13.6) -----------------------------------
  //
  // The outgoing route is a static DOM CLONE of the old main, not the live
  // element: a live mount would keep timers, audio and the record effect
  // running under the reader — a clone can't record a round twice or start a
  // sound, and it paints identically.
  useEffect(() => {
    const prev = prevRef.current;
    prevRef.current = location;
    const main = mainRef.current;
    if (!main) return;

    // Save the outgoing scroll position under its location key.
    scrollMap.current.set(prev.key, window.scrollY);

    // Skip: same pathname (hash/search change), /play <-> /play/:gameId.
    if (samePage(prev.pathname, location.pathname)) return;

    // A View Transition already animated this navigation — the browser
    // ran it; nothing to clone. (POP never sets this flag.)
    if (vtPending.current) {
      vtPending.current = false;
      return;
    }

    // Interrupting: kill any running transition and drop its layer.
    tlRef.current?.kill();
    layerRef.current?.remove();
    layerRef.current = null;

    const reduced = prefersReducedMotion();
    const dur = tokenMs("--dur-long") / 1000;
    const easeIn = cubicBezier(cssToken("--ease-in"));
    const easeOut = cubicBezier(cssToken("--ease-out"));

    // Snapshot the OLD content: clone the previous main's DOM into a fixed,
    // inert layer pinned at the current scroll offset.
    const layer = document.createElement("div");
    layer.className = "route-layer route-layer--out";
    layer.dataset.surface = DESK_ROUTES.has(prev.pathname) ? "desk" : "counter";
    layer.setAttribute("aria-hidden", "true");
    layer.setAttribute("inert", "");
    const scrollY = window.scrollY;
    const clone = main.cloneNode(true) as HTMLElement;
    clone.removeAttribute("id");
    // The flying receipt must not ALSO appear in the outgoing snapshot.
    const flipId = peekFlipId();
    if (flipId) {
      clone
        .querySelector(`[data-flip-id="${flipId}"]`)
        ?.setAttribute("data-clone-hidden", "");
    }
    clone.style.transform = `translateY(${-scrollY}px)`;
    clone.style.margin = "0";
    layer.appendChild(clone);
    document.body.appendChild(layer);
    layerRef.current = layer;

    const incomingH1 = () => main.querySelector<HTMLElement>("h1");

    if (reduced) {
      // 150ms opacity crossfade only.
      const tl = gsap.timeline({
        onComplete: () => {
          layer.remove();
          if (layerRef.current === layer) layerRef.current = null;
          finishFocus();
        },
      });
      tl.fromTo(layer, { opacity: 1 }, { opacity: 0, duration: 0.15 });
      return finishRestore();
    }

    window.scrollTo(0, 0);
    const tl = gsap.timeline({
      onComplete: () => {
        layer.remove();
        if (layerRef.current === layer) layerRef.current = null;
        finishFocus();
      },
    });
    tl.fromTo(
      layer,
      { y: 0, opacity: 1 },
      { y: 16, opacity: 0, duration: dur, ease: easeIn },
      0,
    );
    tl.fromTo(
      main,
      { clipPath: "inset(0 0 100% 0)" },
      { clipPath: "inset(0 0 0% 0)", duration: dur, ease: easeOut },
      0,
    );

    function finishRestore() {
      // Back/forward: restore the incoming key's scroll position.
      const saved = scrollMap.current.get(location.key);
      if (saved !== undefined) window.scrollTo(0, saved);
    }

    function finishFocus() {
      finishRestore();
      // Hash navigation keeps Home's own focus logic.
      if (location.hash) return;
      const h1 = incomingH1();
      if (h1) {
        if (!h1.hasAttribute("tabindex")) h1.setAttribute("tabindex", "-1");
        h1.focus({ preventScroll: true });
      }
    }
    return () => {};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

  return (
    <div className="shell" data-surface={surface}>
      {/*
        CustomCursor and TopographicBackground are deliberately NOT rendered.
        design.md §6 rules out custom cursors and §1 builds the look from SVG
        and CSS rather than WebGL. The files stay on disk until the B9
        deletion list is signed off.
      */}

      <header className="shell-header">
        {/* Wordmark */}
        <NavLink to="/" className="shell-wordmark" onClick={closeMenus}>
          <TrustFallCharacter state="standing" color="you" size="sm" />
          <span>Latep</span>
        </NavLink>

        {/* Desktop nav */}
        <nav className="shell-nav" aria-label="Main">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                isActive ? "shell-nav-link is-active" : "shell-nav-link"
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="shell-actions">
          {/* The record chip sits before the wallet (design.md §10, §13.7). */}
          <NavLink
            to="/record"
            className="shell-record-chip"
            onClick={closeMenus}
          >
            Your record
            {recordCount > 0 && (
              <span className="shell-record-count"> · {recordCount}</span>
            )}
          </NavLink>

          {/* Under 768px the links move into this sheet. */}
          <button
            type="button"
            ref={menuButtonRef}
            className="shell-menu-button"
            onClick={() => {
              setMenuOpen((o) => !o);
              setAudioOpen(false);
            }}
            aria-expanded={menuOpen}
            aria-controls="shell-menu"
          >
            Menu
          </button>

          {/* Audio toggle */}
          <div className="shell-audio">
            <button
              type="button"
              ref={audioButtonRef}
              className="shell-icon-button"
              onClick={() => {
                setAudioOpen((o) => !o);
                setMenuOpen(false);
              }}
              aria-label="Audio settings"
              aria-expanded={audioOpen}
              aria-controls="shell-audio-settings"
              title="Audio settings"
            >
              {audioManager.isMusicEnabled ? (
                <Volume2 size={18} strokeWidth={2} aria-hidden="true" />
              ) : (
                <VolumeX size={18} strokeWidth={2} aria-hidden="true" />
              )}
            </button>

            {audioOpen && (
              <div
                className="shell-menu-panel"
                id="shell-audio-settings"
                role="group"
                aria-label="Sound settings"
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setAudioOpen(false);
                    audioButtonRef.current?.focus();
                  }
                }}
              >
                <button
                  type="button"
                  className="shell-menu-item"
                  onClick={() => audioManager.toggleMusic()}
                  aria-pressed={audioManager.isMusicEnabled}
                >
                  {audioManager.isMusicEnabled ? (
                    <Volume2 size={18} strokeWidth={2} aria-hidden="true" />
                  ) : (
                    <VolumeX size={18} strokeWidth={2} aria-hidden="true" />
                  )}
                  Music
                </button>
                <button
                  type="button"
                  className="shell-menu-item"
                  onClick={() => audioManager.toggleSFX()}
                  aria-pressed={audioManager.isSFXEnabled}
                >
                  Sound Effects
                </button>
              </div>
            )}
          </div>

          <ConnectAccount />
        </div>
      </header>

      {/* The sheet. One nav, so a keyboard user tabs the links once. */}
      {menuOpen && (
        <div
          className="shell-sheet"
          id="shell-menu"
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setMenuOpen(false);
              menuButtonRef.current?.focus();
            }
          }}
        >
          <nav aria-label="Main, condensed">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  isActive ? "shell-sheet-link is-active" : "shell-sheet-link"
                }
                onClick={closeMenus}
              >
                {item.label}
              </NavLink>
            ))}
            <NavLink
              to="/record"
              className={({ isActive }) =>
                isActive ? "shell-sheet-link is-active" : "shell-sheet-link"
              }
              onClick={closeMenus}
            >
              Your record
              {recordCount > 0 && ` · ${recordCount}`}
            </NavLink>
          </nav>
        </div>
      )}

      <main
        ref={mainRef}
        className={`shell-content${isLesson ? " shell-content-lesson" : ""}`}
      >
        <Outlet />
      </main>
    </div>
  );
};

export default AppShell;
