import React, { useState, useEffect, useCallback, useRef } from "react";
import gsap from "gsap";
import { useAudioSettings } from "../hooks/useAudioSettings";
import { LessonActionProvider } from "./learning/LessonActions";
import { LessonDetails } from "./learning/LessonDetails";
import "../styles/slides.css";
import "../styles/learning.css";

// SINGLE SOURCE OF TRUTH for slide configuration
export interface SlideConfig {
  id: string;
  title?: string;
  subtitle?: string;
  component: React.ComponentType<SlideProps>;
  music?: string;
  background?: string;
}

export interface SlideProps {
  onNext: () => void;
  onPrev: () => void;
  slideData?: Record<string, unknown>;
}

interface SlideSystemProps {
  slides: SlideConfig[];
  onComplete?: () => void;
}

export const SlideSystem: React.FC<SlideSystemProps> = ({
  slides,
  onComplete,
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slideData] = useState<Record<string, unknown>>({});
  const audioManager = useAudioSettings();
  const directionRef = useRef<"forward" | "backward">("forward");
  const slideContentRef = useRef<HTMLDivElement>(null);
  const prevSlideRef = useRef(0);
  const [actionTarget, setActionTarget] = useState<HTMLDivElement | null>(null);
  const footerRef = useRef<HTMLElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);

  // Initialize audio on first load
  useEffect(() => {
    audioManager.preloadSounds();
    return () => audioManager.stopBackgroundMusic();
  }, [audioManager]);

  // Handle slide changes with audio
  useEffect(() => {
    const music = slides
      .slice(0, currentSlide + 1)
      .reverse()
      .find((slide) => slide.music)?.music;
    if (music) {
      audioManager.playBackgroundMusic(music);
    }
  }, [currentSlide, slides, audioManager]);

  useEffect(() => {
    if (currentSlide > 0) {
      audioManager.playSound("click");
    }
  }, [currentSlide, audioManager]);

  // Reserve space for the fixed action bar on small/short layouts
  useEffect(() => {
    const footer = footerRef.current;
    const player = playerRef.current;
    if (!footer || !player) return;
    const measure = () => {
      player.style.setProperty(
        "--lesson-action-height",
        `${footer.getBoundingClientRect().height}px`,
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(footer);
    return () => observer.disconnect();
  }, []);

  const handleNext = useCallback(() => {
    directionRef.current = "forward";
    setCurrentSlide((prev) => {
      if (prev < slides.length - 1) return prev + 1;
      onComplete?.();
      return prev;
    });
  }, [slides.length, onComplete]);

  const handlePrev = useCallback(() => {
    directionRef.current = "backward";
    setCurrentSlide((prev) => Math.max(0, prev - 1));
  }, []);

  const handleSlideJump = useCallback(
    (index: number) => {
      directionRef.current =
        index > prevSlideRef.current ? "forward" : "backward";
      setCurrentSlide(index);
      audioManager.playSound("click");
    },
    [audioManager],
  );

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      // Don't interfere with typing in inputs
      if (
        e.defaultPrevented ||
        e.altKey ||
        e.ctrlKey ||
        e.metaKey ||
        e.shiftKey ||
        document.querySelector(".lesson-dialog[open]") ||
        (e.target instanceof HTMLElement &&
          e.target.closest(
            'input, textarea, select, button, a, summary, [role="button"], [tabindex], [contenteditable="true"]',
          ))
      )
        return;
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        handleNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrev();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleNext, handlePrev]);

  // Slide transition animation — directional slide + parallax
  useEffect(() => {
    const el = slideContentRef.current;
    if (!el) return;

    // Skip on first render
    if (prevSlideRef.current === currentSlide && currentSlide === 0) {
      prevSlideRef.current = currentSlide;
      return;
    }

    const dir = directionRef.current;
    const xOffset = dir === "forward" ? 16 : -16;

    el.scrollTop = 0;
    window.scrollTo({ top: 0, behavior: "auto" });

    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const ctx = gsap.context(() => {
        // Slide out old content (instant, since React already swapped)
        // Animate new content sliding in from the direction
        gsap.fromTo(
          el,
          {
            x: xOffset,
            opacity: 0,
          },
          {
            x: 0,
            opacity: 1,
            duration: 0.2,
            ease: "power2.out",
          },
        );

        // Parallax on visible data-animate children — they stagger in
        const animatables = gsap.utils
          .toArray<HTMLElement>("[data-animate]", el)
          .filter(
            (node) =>
              node.isConnected && node.offsetWidth > 0 && node.offsetHeight > 0,
          );
        if (animatables.length > 0) {
          gsap.from(animatables, {
            opacity: 0,
            x: xOffset * 0.25,
            duration: 0.2,
            ease: "power2.out",
            stagger: 0.02,
          });
        }
      }, el);
      return () => ctx.revert();
    });

    prevSlideRef.current = currentSlide;
    return () => mm.revert();
  }, [currentSlide]);

  const currentSlideConfig = slides[currentSlide];
  const SlideComponent = currentSlideConfig.component;

  return (
    <LessonActionProvider target={actionTarget}>
      <div className="learning-journey lesson-player" ref={playerRef}>
        {/* Audio controls live in the app header; the bar below is the
            single navigation surface */}
        <div className="lesson-toolbar">
          <span className="lesson-position">
            Chapter {currentSlide + 1} of {slides.length}
          </span>
          <label className="lesson-chapters">
            <span className="lesson-sr-only">Choose chapter</span>
            <select
              aria-label="Choose chapter"
              value={currentSlide}
              onChange={(e) => handleSlideJump(Number(e.target.value))}
            >
              {slides.map((slide, i) => (
                <option key={slide.id} value={i}>
                  {i + 1}. {slide.title || slide.id}
                </option>
              ))}
            </select>
          </label>
          <LessonDetails trigger="About" title="About this journey">
            <p>
              Based on Nicky Case’s “The Evolution of Trust”, adapted for Latep
              with zero-knowledge proofs on Stellar.
            </p>
            <p>
              Local lessons use practice points. On-chain play is a separate
              flow.
            </p>
          </LessonDetails>
        </div>

        {/* Slide content */}
        <div
          ref={slideContentRef}
          className="learning-slide-content lesson-content"
          data-chapter={currentSlideConfig.id}
        >
          <SlideComponent
            key={currentSlide}
            onNext={handleNext}
            onPrev={handlePrev}
            slideData={slideData}
          />
        </div>

        {/* Navigation */}
        <footer
          className="learning-nav lesson-footer"
          ref={footerRef}
          aria-label="Lesson navigation"
        >
          <button
            type="button"
            className="learning-button"
            onClick={handlePrev}
            disabled={currentSlide === 0}
          >
            Previous
          </button>

          <div className="lesson-action-host" ref={setActionTarget} />

          <button
            type="button"
            className="learning-button learning-button-primary lesson-default-next"
            onClick={handleNext}
          >
            {currentSlide === 0
              ? "Begin"
              : currentSlide === slides.length - 1
                ? "Complete"
                : "Next"}
          </button>
        </footer>
      </div>
    </LessonActionProvider>
  );
};
