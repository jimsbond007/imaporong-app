import Link from 'next/link';
import type { ReactNode } from 'react';

import {
  ArrowRightIcon,
  BellIcon,
  CalendarIcon,
  HandHeartIcon,
  SparkleIcon,
} from '@/components/ui/icons';

export type FeedItem = {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  dateLabel: string;
  iso: string;
};

type Tone = {
  banner: string;
  chip: string;
  icon: ReactNode;
};

const TONES: Record<string, Tone> = {
  program: {
    banner: 'from-[#d3e8c4] via-[#a9d19c] to-[#6aa57a]',
    chip: 'bg-mint text-pine',
    icon: <HandHeartIcon className="h-9 w-9" />,
  },
  schedule: {
    banner: 'from-[#eaf6fb] via-[#b4dcee] to-[#7dbcd9]',
    chip: 'bg-sky text-[#3a6478]',
    icon: <CalendarIcon className="h-9 w-9" />,
  },
  advisory: {
    banner: 'from-[#fdf3da] via-[#f1d88f] to-[#e5b84d]',
    chip: 'bg-[#fbefd2] text-[#8a6116]',
    icon: <BellIcon className="h-9 w-9" />,
  },
};

const FALLBACK: Tone = {
  banner: 'from-[#e4efd6] via-[#bcd7a6] to-[#8daf72]',
  chip: 'bg-mint text-pine',
  icon: <SparkleIcon className="h-9 w-9" />,
};

function toneFor(category: string) {
  return TONES[category.trim().toLowerCase()] ?? FALLBACK;
}

/**
 * Where each window sits on the curved wall (desktop). Order on screen is
 * left, centre, right; the newest update takes the centre.
 */
const POSITIONS = {
  left: 'lg:[transform:translateX(18px)_rotateY(17deg)_scale(0.93)] lg:origin-right lg:opacity-95',
  center: 'lg:z-10 lg:[transform:scale(1.05)]',
  right: 'lg:[transform:translateX(-18px)_rotateY(-17deg)_scale(0.93)] lg:origin-left lg:opacity-95',
  flat: '',
} as const;

function FeedWindow({
  item,
  position,
  featured,
}: {
  item: FeedItem;
  position: keyof typeof POSITIONS;
  featured: boolean;
}) {
  const tone = toneFor(item.category);

  return (
    <article
      className={`group relative flex h-full flex-col rounded-[28px] border-2 border-white/80 bg-white/45 p-2.5 shadow-[7px_7px_0_0_rgba(53,70,56,0.13)] backdrop-blur-md transition-transform duration-500 ${POSITIONS[position]}`}
    >
      <div className="flex h-full flex-col overflow-hidden rounded-[20px] border border-earth/10 bg-cream">
        {/* Window chrome */}
        <div className="flex items-center gap-1.5 border-b border-earth/10 bg-white/70 px-3.5 py-2.5">
          <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-rice" />
          <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-leaf" />
          <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-river" />
          <span className="ml-2 truncate text-[0.625rem] font-bold uppercase tracking-[0.16em] text-forest/45">
            iMaporong · Updates
          </span>
        </div>

        {/* Glassy banner */}
        <div
          aria-hidden="true"
          className={`relative flex ${featured ? 'h-40' : 'h-32'} items-center justify-center overflow-hidden bg-gradient-to-br ${tone.banner}`}
        >
          <span className="absolute -left-6 top-4 h-28 w-28 rounded-full bg-white/35 blur-sm" />
          <span className="absolute -right-4 -bottom-8 h-32 w-32 rounded-[36px] bg-white/25 [transform:rotate(18deg)]" />
          <span className="absolute left-1/3 top-3 h-3 w-3 rounded-sm bg-white/70" />
          <span className="absolute bottom-5 right-1/3 h-2 w-2 rounded-sm bg-white/60" />
          <span className="relative flex h-[72px] w-[72px] items-center justify-center rounded-[26px] border-2 border-white/70 bg-white/45 text-forest shadow-subtle backdrop-blur-sm">
            {tone.icon}
          </span>
        </div>

        {/* Story */}
        <div className="flex flex-1 flex-col p-5">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-1 text-[0.6875rem] font-bold uppercase tracking-[0.1em] ${tone.chip}`}
            >
              {item.category || 'General'}
            </span>
            <time
              dateTime={item.iso}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted"
            >
              <CalendarIcon className="h-3.5 w-3.5" />
              {item.dateLabel}
            </time>
          </div>

          <h3
            className={`mt-3 line-clamp-2 font-display font-extrabold leading-snug text-forest ${
              featured ? 'text-xl' : 'text-lg'
            }`}
          >
            {item.title}
          </h3>
          <p className="body-sm mt-2 line-clamp-3 flex-1">{item.excerpt}</p>

          <Link
            href="/dashboard/announcements"
            className="mt-5 inline-flex w-fit items-center gap-1.5 rounded-full bg-pine px-4 py-2 text-xs font-bold text-white shadow-subtle transition hover:bg-pine-deep hover:gap-2.5"
          >
            Read update
            <ArrowRightIcon className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}

export function NewsFeed({ items }: { items: FeedItem[] }) {
  const [latest, second, third] = items;

  // Three updates form the curved wall; fewer sit flat side by side.
  const windows =
    items.length >= 3
      ? [
          { item: second, position: 'left' as const, featured: false },
          { item: latest, position: 'center' as const, featured: true },
          { item: third, position: 'right' as const, featured: false },
        ]
      : items.map((item, i) => ({ item, position: 'flat' as const, featured: i === 0 }));

  return (
    <div className="relative mt-10">
      {/* Curved glass band behind the windows */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-[-4%] bottom-[-6%] top-[8%] hidden rounded-[50%/22%] border-2 border-white/45 bg-gradient-to-b from-white/40 via-white/15 to-transparent lg:block"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -left-2 top-1/2 hidden h-6 w-6 rotate-12 rounded-md bg-rice/70 lg:block"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-2 top-1/3 hidden h-5 w-5 rotate-45 rounded-sm bg-white/80 lg:block"
      />

      <div
        className={`relative grid items-stretch gap-6 lg:gap-8 lg:[perspective:1800px] ${
          windows.length >= 3
            ? 'md:grid-cols-2 lg:grid-cols-[1fr_1.08fr_1fr]'
            : windows.length === 2
              ? 'md:grid-cols-2'
              : 'mx-auto max-w-md'
        }`}
      >
        {windows.map(({ item, position, featured }) => (
          <div
            key={item.id}
            className={
              position === 'center' ? 'md:order-first md:col-span-2 lg:order-none lg:col-span-1' : ''
            }
          >
            <FeedWindow item={item} position={position} featured={featured} />
          </div>
        ))}
      </div>
    </div>
  );
}
