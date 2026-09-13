import { createContext, use, type ReactNode } from "react";
import { createPortal } from "react-dom";

const ActionTargetContext = createContext<HTMLElement | null>(null);

export function LessonActionProvider({
  target,
  children,
}: {
  target: HTMLElement | null;
  children: ReactNode;
}) {
  return <ActionTargetContext value={target}>{children}</ActionTargetContext>;
}

export function LessonActions({ children }: { children: ReactNode }) {
  const target = use(ActionTargetContext);
  return target
    ? createPortal(<div className="lesson-actions">{children}</div>, target)
    : null;
}
