import React, { useState, useEffect, useCallback, useRef } from "react";
import gsap from "gsap";
import { useAudioSettings } from "../hooks/useAudioSettings";
import { useSlideAnimation } from "../hooks/useSlideAnimation";
import JourneyProgress from "./visual/JourneyProgress";
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

// Icons for the journey progress — mapped by slide index
const JOURNEY_ICONS = ["🪂", "🏔️", "🤝", "🔄", "⚔️", "🏆", "💨", "🔒"];

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
    const xOffset = dir === "forward" ? 60 : -60;

    el.scrollIntoView({ block: "start", behavior: "auto" });

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
            duration: 0.5,
            ease: "power3.out",
          },
        );

        // Parallax on data-animate children — they stagger in
        const animatables = gsap.utils.toArray("[data-animate]", el);
        if (animatables.length > 0) {
          gsap.from(animatables, {
            opacity: 0,
            x: xOffset * 0.5,
            duration: 0.6,
            ease: "power3.out",
            stagger: 0.06,
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
  const slideRef = useSlideAnimation<HTMLDivElement>();

  // Build journey steps for the progress indicator
  const journeySteps = slides.map((slide, index) => ({
    id: slide.id,
    label: slide.title || slide.id,
    icon: JOURNEY_ICONS[index] || "•",
  }));

  return (
    <div className="slide-container learning-journey" ref={slideRef}>
      {/* Audio controls */}
      <div className="audio-controls">
        <button
          type="button"
          className={`learning-button audio-button ${!audioManager.isMusicEnabled ? "disabled" : ""}`}
          onClick={() => audioManager.toggleMusic()}
          aria-label="Toggle journey music"
          aria-pressed={audioManager.isMusicEnabled}
          title="Toggle Music"
        >
          {audioManager.isMusicEnabled ? "🎵" : "🔇"}
        </button>
        <button
          type="button"
          className={`learning-button audio-button ${!audioManager.isSFXEnabled ? "disabled" : ""}`}
          onClick={() => audioManager.toggleSFX()}
          aria-label="Toggle journey sound effects"
          aria-pressed={audioManager.isSFXEnabled}
          title="Toggle Sound Effects"
        >
          {audioManager.isSFXEnabled ? "🔊" : "🔈"}
        </button>
      </div>

      {/* Journey progress — replaces the old dots */}
      {slides.length > 1 && (
        <div className="learning-progress">
          <div className="learning-progress-desktop">
            <JourneyProgress
              steps={journeySteps}
              currentStep={currentSlide}
              onStepClick={handleSlideJump}
            />
          </div>
          <label className="learning-mobile-progress">
            Chapter
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
        </div>
      )}

      {/* Slide content */}
      <div ref={slideContentRef} className="learning-slide-content">
        <SlideComponent
          key={currentSlide}
          onNext={handleNext}
          onPrev={handlePrev}
          slideData={slideData}
        />
      </div>

      {/* Navigation */}
      <div className="learning-nav">
        <button
          type="button"
          className="learning-button"
          onClick={handlePrev}
          disabled={currentSlide === 0}
        >
          Previous
        </button>

        <button
          type="button"
          className="learning-button learning-button-primary"
          onClick={handleNext}
        >
          {currentSlide === slides.length - 1 ? "Complete" : "Next"}
        </button>
      </div>
    </div>
  );
};
