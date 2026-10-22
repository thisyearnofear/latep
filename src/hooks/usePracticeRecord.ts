/**
 * usePracticeRecord — the practice half of "your record" (design.md §13.7).
 *
 * Every practice round — the home stage and the sandbox — prints a receipt
 * here, kept in localStorage newest-first and capped at 100. On-chain games
 * are recorded separately by useGameStats; /record reads both.
 *
 * All localStorage access is wrapped in try/catch, same as useGameStats, so
 * a corrupted or unavailable store never crashes the round.
 */

import { useCallback } from "react";

export interface PracticeEntry {
  id: string;
  source: "home" | "sandbox";
  yourMove: "C" | "D";
  partnerMove: "C" | "D";
  /** Trust height this round earned: the streak after it settled. */
  height: number;
  timestamp: number;
}

const STORAGE_KEY = "latep:practice-record";
const MAX_ENTRIES = 100;

function loadEntries(): PracticeEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as PracticeEntry[]) : [];
  } catch {
    return [];
  }
}

function saveEntries(entries: PracticeEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    /* ignore quota / serialization errors */
  }
}

export function usePracticeRecord(): {
  recordRound: (
    round: Omit<PracticeEntry, "id" | "timestamp" | "height">,
  ) => string | null;
  getEntries: () => PracticeEntry[];
} {
  const getEntries = useCallback((): PracticeEntry[] => loadEntries(), []);

  const recordRound = useCallback(
    (
      round: Omit<PracticeEntry, "id" | "timestamp" | "height">,
    ): string | null => {
      try {
        const current = loadEntries();
        // Height is the trust height this round leaves behind: one more turn
        // on a held round, zero on anything else.
        const last = current[0];
        const height =
          round.yourMove === "C" && round.partnerMove === "C"
            ? (last?.height ?? 0) + 1
            : 0;
        const entry: PracticeEntry = {
          ...round,
          id: `${round.source}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          height,
          timestamp: Date.now(),
        };
        saveEntries([entry, ...current].slice(0, MAX_ENTRIES));
        return entry.id;
      } catch {
        /* never let the record crash the game flow */
        return null;
      }
    },
    [],
  );

  return { recordRound, getEntries };
}
