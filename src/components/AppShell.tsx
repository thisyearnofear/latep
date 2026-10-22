/**
 * AppShell — the persistent top strip.
 *
 * A counter strip: wordmark left, four links, wallet right. Never two rows
 * (design.md §10). Under 768px it collapses to the wordmark plus a Menu
 * button, because four links and a wallet cannot share one row at 320px
 * without the labels wrapping.
 */

import React, { useState } from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
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

const AppShell: React.FC = () => {
  const pathname = useLocation().pathname;
  const isLesson = pathname === "/learn";
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

  return (
    <>
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
        className={`shell-content${isLesson ? " shell-content-lesson" : ""}`}
      >
        <Outlet />
      </main>
    </>
  );
};

export default AppShell;
