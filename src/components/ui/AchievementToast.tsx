/**
 * AchievementToast — shows a brief toast notification when an achievement unlocks.
 *
 * Slides in from the bottom-right, auto-dismisses after 4 seconds.
 * Uses the existing AchievementBadge styling.
 */

import React, { useEffect, useState, useCallback } from "react";
import { Receipt } from "../receipt";
import { type Achievement } from "./AchievementBadge";
import "../../styles/ui.css";

interface AchievementToastProps {
  achievement: Achievement | null;
  onDismiss: () => void;
}

export const AchievementToast: React.FC<AchievementToastProps> = ({
  achievement,
  onDismiss,
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (achievement) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onDismiss, 300);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [achievement, onDismiss]);

  const handleClick = useCallback(() => {
    setVisible(false);
    setTimeout(onDismiss, 300);
  }, [onDismiss]);

  if (!achievement) return null;

  const Icon = achievement.icon;

  return (
    <div
      onClick={handleClick}
      className={`ui-toast${visible ? "" : " ui-toast--hidden"}`}
    >
      <Receipt title="Achievement unlocked">
        <div className="ui-achievement">
          <Icon size={32} className="ui-achievement__icon" aria-hidden />
          <p className="ui-achievement__title">{achievement.title}</p>
          <p className="ui-achievement__description">
            {achievement.description}
          </p>
        </div>
      </Receipt>
    </div>
  );
};

/**
 * useAchievementToast — hook that watches for newly unlocked achievements
 * and shows them as toasts.
 */
export function useAchievementToast() {
  const [currentToast, setCurrentToast] = useState<Achievement | null>(null);
  const [queue, setQueue] = useState<Achievement[]>([]);

  const showAchievement = useCallback((achievement: Achievement) => {
    setQueue((q) => [...q, achievement]);
  }, []);

  useEffect(() => {
    if (!currentToast && queue.length > 0) {
      setCurrentToast(queue[0]);
      setQueue((q) => q.slice(1));
    }
  }, [currentToast, queue]);

  const dismissToast = useCallback(() => {
    setCurrentToast(null);
  }, []);

  return {
    toastElement: (
      <AchievementToast achievement={currentToast} onDismiss={dismissToast} />
    ),
    showAchievement,
  };
}
