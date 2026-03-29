"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import useEmblaCarousel from "embla-carousel-react";
import AutoHeight from "embla-carousel-auto-height";

interface Slide {
  label: string;
  icon: string;
  content: ReactNode;
}

interface Props {
  slides: Slide[];
}

export default function SlideCarousel({ slides }: Props) {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: false,
      align: "start",
      watchDrag: (_api, evt) => {
        const target = evt.target as HTMLElement;
        return !target.closest(".daeun-scroll");
      },
    },
    [AutoHeight()],
  );

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setCanPrev(emblaApi.canScrollPrev());
    setCanNext(emblaApi.canScrollNext());
    setTimeout(() => window.dispatchEvent(new Event("resize")), 100);
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const progress = ((selectedIndex + 1) / slides.length) * 100;

  return (
    <div className="embla">
      {/* ── Top: progress bar + arrows ── */}
      <div className="flex items-center gap-3 mb-5">
        <button
          type="button"
          onClick={scrollPrev}
          disabled={!canPrev}
          className="flex items-center justify-center w-8 h-8 rounded-full border border-[var(--color-border)] text-[var(--color-ink-faint)] hover:text-[var(--color-ink)] hover:border-[var(--color-ink-faint)] transition-colors disabled:opacity-20 disabled:cursor-not-allowed flex-shrink-0"
          aria-label="이전 슬라이드"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between mb-1.5">
            <span className="font-heading text-base font-semibold text-[var(--color-ink)] truncate">
              {slides[selectedIndex]?.label}
            </span>
            <span className="text-xs text-[var(--color-ink-faint)] flex-shrink-0 ml-2">
              {selectedIndex + 1} / {slides.length}
            </span>
          </div>
          <div className="embla__progress">
            <div
              className="embla__progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={scrollNext}
          disabled={!canNext}
          className="flex items-center justify-center w-8 h-8 rounded-full border border-[var(--color-border)] text-[var(--color-ink-faint)] hover:text-[var(--color-ink)] hover:border-[var(--color-ink-faint)] transition-colors disabled:opacity-20 disabled:cursor-not-allowed flex-shrink-0"
          aria-label="다음 슬라이드"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* ── Viewport ── */}
      <div className="embla__viewport" ref={emblaRef}>
        <div className="embla__container">
          {slides.map((slide, i) => (
            <div className="embla__slide" key={i}>
              {slide.content}
            </div>
          ))}
        </div>
      </div>

      {/* ── Bottom tab bar ── */}
      <nav className="embla__tabbar">
        {slides.map((slide, i) => (
          <button
            key={i}
            type="button"
            onClick={() => emblaApi?.scrollTo(i)}
            className={`embla__tab ${i === selectedIndex ? "embla__tab--active" : ""}`}
            aria-label={slide.label}
          >
            <span className="embla__tab-icon">{slide.icon}</span>
            <span className="embla__tab-label">{slide.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
