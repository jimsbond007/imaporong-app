'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { SERVICES } from '@/lib/constants';
import { ServiceIcon } from '@/components/ui/ServiceIcon';
import { ArrowRightIcon, ChevronLeftIcon, ChevronRightIcon } from '@/components/ui/icons';

export function ServiceCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: -1 | 1) => {
    const track = trackRef.current;
    if (!track) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    track.scrollBy({
      left: direction * Math.min(track.clientWidth * 0.8, 420),
      behavior: reduceMotion ? 'auto' : 'smooth',
    });
  };

  return (
    <div className="mt-8">
      <div className="mb-4 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => scroll(-1)}
          aria-label="Scroll services left"
          className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-line bg-white text-forest transition hover:border-leaf hover:bg-mist"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => scroll(1)}
          aria-label="Scroll services right"
          className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-line bg-white text-forest transition hover:border-leaf hover:bg-mist"
        >
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      </div>

      <div
        ref={trackRef}
        className="no-scrollbar -mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-3"
        role="region"
        aria-label="Barangay document services"
        tabIndex={0}
      >
        {SERVICES.map((service, index) => (
          <article
            key={service.slug}
            id={`service-${service.slug}`}
            className="interactive-card group flex w-[264px] shrink-0 snap-start scroll-mt-28 flex-col rounded-[20px] border-2 border-line bg-white p-5 shadow-subtle sm:w-[300px]"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-mint text-pine">
                <ServiceIcon icon={service.icon} className="h-5.5 w-5.5" />
              </span>
              <span className="text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-muted">
                0{index + 1}
              </span>
            </div>

            <h3 className="heading-3 mt-4">{service.name}</h3>
            <p className="body-sm mt-2 flex-1">{service.description}</p>

            <Link
              href="/auth"
              className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-pine transition group-hover:gap-2.5"
            >
              Request this document
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
