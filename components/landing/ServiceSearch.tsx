'use client';

import { useMemo, useState } from 'react';
import { SERVICES } from '@/lib/constants';
import { ServiceIcon } from '@/components/ui/ServiceIcon';
import { ArrowRightIcon, SearchIcon } from '@/components/ui/icons';

function scrollToService(slug: string) {
  const target = document.getElementById(`service-${slug}`);
  if (!target) return;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
  target.classList.add('ring-2', 'ring-pine', 'ring-offset-2');
  window.setTimeout(() => {
    target.classList.remove('ring-2', 'ring-pine', 'ring-offset-2');
  }, 1600);
}

export function ServiceSearch() {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return [];
    return SERVICES.filter((service) =>
      `${service.name} ${service.short} ${service.description}`
        .toLowerCase()
        .includes(term),
    ).slice(0, 5);
  }, [query]);

  return (
    <div className="relative mt-7 max-w-xl">
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          if (results[0]) scrollToService(results[0].slug);
        }}
        className="flex items-center gap-2 rounded-xl border-2 border-line bg-white p-1.5 pl-4 shadow-card"
      >
        <SearchIcon className="h-5 w-5 shrink-0 text-muted" />
        <label htmlFor="service-search" className="sr-only">
          Search barangay services
        </label>
        <input
          id="service-search"
          type="search"
          autoComplete="off"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 120)}
          placeholder="What document do you need?"
          className="min-w-0 flex-1 bg-transparent py-2 text-sm font-semibold text-forest outline-none placeholder:font-normal placeholder:text-muted/80"
        />
        <button
          type="submit"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-pine px-4 py-2.5 text-sm font-bold text-white transition hover:bg-pine-deep sm:px-5"
        >
          <span className="hidden sm:inline">Find service</span>
          <ArrowRightIcon className="h-4 w-4" />
        </button>
      </form>

      {open && query.trim() && (
        <div className="absolute inset-x-0 top-[calc(100%+8px)] z-30 overflow-hidden rounded-2xl border-2 border-line bg-white shadow-raised">
          {results.length === 0 ? (
            <p className="px-4 py-4 text-sm font-semibold text-muted">
              No matching service. Try “clearance”, “indigency”, or “business”.
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {results.map((service) => (
                <li key={service.slug}>
                  <button
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      scrollToService(service.slug);
                      setOpen(false);
                      setQuery('');
                    }}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-mist"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-mint text-pine">
                      <ServiceIcon icon={service.icon} className="h-4.5 w-4.5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-bold text-forest">{service.name}</span>
                      <span className="block truncate text-xs text-muted">{service.short}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
