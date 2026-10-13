/**
 * AchievementBadge — displays an unlocked achievement.
 *
 * Achievements are earned for milestones throughout the Latep experience:
 * - First cooperation
 * - First betrayal
 * - 5-round streak of mutual cooperation
 * - Tournament winner
 * - First ZK game played
 * - etc.
 */

import React from "react";
import {
  Footprints,
  Gem,
  Handshake,
  HeartCrack,
  Lock,
  Stamp,
  Trophy,
  Wind,
  type LucideIcon,
} from "lucide-react";
import { Receipt, ReceiptStub } from "../receipt";
import "../../styles/ui.css";

export interface Achievement {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
}

export const ACHIEVEMENTS: Record<string, Achievement> = {
  first_catch: {
    id: "first_catch",
    icon: Handshake,
    title: "First Catch",
    description: "You leaned in and they held you up. Trust begins.",
  },
  first_betrayal: {
    id: "first_betrayal",
    icon: HeartCrack,
    title: "The Fall",
    description: "You leaned in and they stepped aside. Now you know.",
  },
  first_exploit: {
    id: "first_exploit",
    icon: Footprints,
    title: "The Exploit",
    description: "You stepped aside while they fell. Was it worth it?",
  },
  trust_streak_5: {
    id: "trust_streak_5",
    icon: Stamp,
    title: "Trust Streak",
    description: "Five rounds of leaning in together, in a row.",
  },
  tournament_winner: {
    id: "tournament_winner",
    icon: Trophy,
    title: "Tournament Champion",
    description: "Your strategy dominated the evolutionary tournament.",
  },
  noise_master: {
    id: "noise_master",
    icon: Wind,
    title: "Noise Master",
    description: "You explored how noise destroys trust.",
  },
  zk_player: {
    id: "zk_player",
    icon: Lock,
    title: "ZK Player",
    description: "You played your first game with real stakes.",
  },
  zk_winner: {
    id: "zk_winner",
    icon: Gem,
    title: "ZK Winner",
    description: "You won a game with real XLM at stake.",
  },
};

interface AchievementBadgeProps {
  achievement: Achievement;
  compact?: boolean;
}

export const AchievementBadge: React.FC<AchievementBadgeProps> = ({
  achievement,
  compact,
}) => {
  const Icon = achievement.icon;

  if (compact) {
    return (
      <ReceiptStub>
        <span className="ui-achievement ui-achievement--compact">
          <Icon size={16} aria-hidden />
          <span>{achievement.title}</span>
        </span>
      </ReceiptStub>
    );
  }

  return (
    <Receipt>
      <div className="ui-achievement">
        <Icon size={32} className="ui-achievement__icon" aria-hidden />
        <p className="ui-achievement__title">{achievement.title}</p>
        <p className="ui-achievement__description">{achievement.description}</p>
      </div>
    </Receipt>
  );
};

/** Track unlocked achievements in localStorage */
export function unlockAchievement(id: string): boolean {
  try {
    const key = "latep_achievements";
    const raw = localStorage.getItem(key);
    const existing: string[] = raw ? (JSON.parse(raw) as string[]) : [];
    if (existing.includes(id)) return false; // Already unlocked
    existing.push(id);
    localStorage.setItem(key, JSON.stringify(existing));
    return true; // Newly unlocked
  } catch {
    return false;
  }
}

export function getUnlockedAchievements(): string[] {
  try {
    const raw = localStorage.getItem("latep_achievements");
    if (!raw) return [];
    const data = JSON.parse(raw) as string[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}
