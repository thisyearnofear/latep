/**
 * The stage, with a choice of two renderers — design.md §12.
 *
 * `RevealStage` is what the round screens render. It draws `TrustStage`, the 2D
 * stage, in every case except the one it was built for: a device that can run
 * WebGL, a player who has not asked for reduced motion, and a reveal in
 * progress. Then the reveal room takes over.
 *
 * The 2D stage is not a degraded version of the room — it is the same stage
 * that has always carried the scene, and every state, word, stamp and thread
 * state is legible in it. That is what makes it safe to make the room
 * conditional on the device.
 *
 * Two things keep the room from being a risk:
 *
 * - **The code is a separate chunk.** It is prefetched while the player is
 *   still choosing, so the download is not paid at the moment of the reveal.
 * - **It is fenced.** A render error, a missing WebGL context, or a chunk that
 *   never arrives falls back to the 2D stage mid-round without losing state.
 *
 * `?room=on` and `?room=off` force one path or the other on one device, which
 * is how the room is reviewed and how the two are compared in a screenshot
 * pass.
 */

import {
  Component,
  Suspense,
  lazy,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { TrustStage, type TrustStageProps } from "./TrustStage";
import { shouldUseRevealRoom } from "../reveal-room/capability";
import { loadRevealRoom, prefetchRevealRoom } from "../reveal-room/load";

const RevealRoom = lazy(loadRevealRoom);

interface RoomBoundaryProps {
  fallback: ReactNode;
  children: ReactNode;
}

/**
 * If the room cannot render, the round must not break. The boundary only ever
 * swaps it for the 2D stage, which is already the answer for every other
 * device.
 */
class RoomBoundary extends Component<RoomBoundaryProps, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    // Worth a line in the console: without it, a device that silently never
    // shows the room looks like a design decision rather than a failure.
    console.warn("Reveal room failed; falling back to the 2D stage.", error);
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export function RevealStage(props: TrustStageProps) {
  const [roomEnabled] = useState(shouldUseRevealRoom);
  const phase = props.state.phase;
  const revealed = phase === "revealing" || phase === "outcome";

  // Warm the room before the reveal needs it. Once the choices are sealed the
  // next tap is "Reveal", so the download starts then; on the choose step it
  // waits a breath, so an idle visitor is not made to pay for a render they
  // have not asked for.
  useEffect(() => {
    if (!roomEnabled) return;
    if (phase !== "choose") {
      prefetchRevealRoom();
      return;
    }
    const timer = window.setTimeout(prefetchRevealRoom, 1200);
    return () => window.clearTimeout(timer);
  }, [roomEnabled, phase]);

  if (!roomEnabled || !revealed) return <TrustStage {...props} />;

  return (
    <RoomBoundary fallback={<TrustStage {...props} />}>
      <Suspense
        // A provisional stage for the moment the chunk is still arriving. It
        // does not take the reveal-complete callback: the room will play the
        // reveal and fire it, and whoever is waiting on that must be told once.
        fallback={<TrustStage {...props} onRevealComplete={undefined} />}
      >
        <RevealRoom {...props} />
      </Suspense>
    </RoomBoundary>
  );
}
