import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import AppShell from "./components/AppShell.tsx";
import Home from "./pages/Home";
import { MascotProvider } from "./components/MascotContext";
import { ReactiveMascot } from "./components/ReactiveMascot";

// Route-based code splitting:
// - Home (landing hub) loads immediately — no ZK WASM needed
// - LearnJourney (slide deck) loads lazily — GSAP + slide content
// - TutorialSandbox (vs AI) loads lazily — strategy engine + AI tutor
// - TournamentPage loads lazily — tournament simulation engine
// - ZKGamePage (multiplayer) loads lazily — pulls in bb.js/noir_js only when
//   the user navigates to /play, keeping the initial bundle ~200KB
// - Debugger loads lazily — rarely used, keeps it out of the main bundle
//
// prefetchRoute warms the light routes (sandbox, tournament) on link hover
// so they feel instant. /play is deliberately NOT prefetched: that pulls in
// the ~7MB ZK prover chunk, which stays cold until the user commits to it.
export function prefetchRoute(to: string) {
  if (to === "/learn/play") void import("./pages/TutorialSandbox.tsx");
  else if (to === "/tournament") void import("./pages/TournamentPage.tsx");
  else if (to === "/learn") void import("./pages/LearnJourney.tsx");
  else if (to === "/record") void import("./pages/RecordPage.tsx");
}
const LearnJourney = lazy(() => import("./pages/LearnJourney.tsx"));
const TutorialSandbox = lazy(() =>
  import("./pages/TutorialSandbox.tsx").then((m) => ({
    default: m.TutorialSandbox,
  })),
);
const TournamentPage = lazy(() => import("./pages/TournamentPage.tsx"));
const ZKGamePage = lazy(() =>
  import("./pages/ZKGamePage.tsx").then((m) => ({ default: m.ZKGamePage })),
);
const Debugger = lazy(() => import("./pages/Debugger.tsx"));
const RealLifePage = lazy(() =>
  import("./pages/RealLifePage.tsx").then((m) => ({
    default: m.RealLifePage,
  })),
);
const RecordPage = lazy(() => import("./pages/RecordPage.tsx"));

function App() {
  return (
    <MascotProvider>
      <Suspense
        fallback={
          <div className="app-suspense">
            <span className="tf-waiting-pulse">Loading…</span>
          </div>
        }
      >
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<Home />} />
            <Route path="/learn" element={<LearnJourney />} />
            <Route path="/learn/play" element={<TutorialSandbox />} />
            <Route path="/tournament" element={<TournamentPage />} />
            <Route path="/play" element={<ZKGamePage />} />
            <Route path="/play/:gameId" element={<ZKGamePage />} />
            <Route path="/real-life" element={<RealLifePage />} />
            <Route path="/record" element={<RecordPage />} />
            <Route path="/debug" element={<Debugger />} />
            <Route path="/debug/:contractName" element={<Debugger />} />
          </Route>
        </Routes>
        <ReactiveMascot />
      </Suspense>
    </MascotProvider>
  );
}

export default App;
