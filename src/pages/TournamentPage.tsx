/**
 * TournamentPage — Evolutionary tournament simulation
 *
 * Standalone page for the tournament mode, previously embedded as a tab
 * inside GameSlide. Now a first-class route at /tournament.
 */

import React from "react";
import { TournamentMode } from "../components/slides/TournamentMode";
import "../styles/tournament.css";

const TournamentPage: React.FC = () => {
  return (
    <div className="till-page">
      <header className="till-page__head">
        <h1 className="till-page__title" data-vt-title>
          The Tournament
        </h1>
        <p className="till-page__lede">
          Watch trust evolve. All 9 strategies compete in a round-robin
          tournament — the weak are eliminated, the strong reproduce.
        </p>
      </header>
      <TournamentMode />
    </div>
  );
};

export default TournamentPage;
