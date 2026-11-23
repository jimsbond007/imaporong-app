import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';

import {
  ArrowRightIcon,
  BellIcon,
  CalendarIcon,
  HandHeartIcon,
  SparkleIcon,
} from '@/components/ui/icons';

type FeedImage = {
  src: string;
  alt: string;
  /** 'cover' fills the tile (photos); 'contain' shows the whole picture (the ID card). */
  fit: 'cover' | 'contain';
  position?: string;
};

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
    icon: <HandHeartIcon className="h-8 w-8" />,
  },
  schedule: {
    banner: 'from-[#eaf6fb] via-[#b4dcee] to-[#7dbcd9]',
    chip: 'bg-sky text-[#3a6478]',
    icon: <CalendarIcon className="h-8 w-8" />,
  },
  advisory: {
    banner: 'from-[#fdf3da] via-[#f1d88f] to-[#e5b84d]',
    chip: 'bg-[#fbefd2] text-[#8a6116]',
    icon: <BellIcon className="h-8 w-8" />,
  },
};

const FALLBACK: Tone = {
  banner: 'from-[#e4efd6] via-[#bcd7a6] to-[#8daf72]',
  chip: 'bg-mint text-pine',
  icon: <SparkleIcon className="h-8 w-8" />,
};

/**
 * Pictures for specific updates, matched on words in the title. An update with
 * no match keeps the soft gradient tile with its category icon.
 */
const IMAGES: { match: RegExp; image: FeedImage }[] = [
  {
    match: /youth livelihood|skills training/i,
    image: {
      src: '/updates/youth-training.jpg',
      alt: 'A facilitator speaking to students at a skills training workshop',
      fit: 'cover',
      position: '50% 45%',
    },
  },
  {
    match: /mobile barangay|id issuance/i,
    image: {
      src: '/updates/id-issuance.png',
      alt: 'A Barangay Maporong resident identification card',
      fit: 'contain',
    },
  },
  {
    match: /water/i,
    image: {
      src: '/updates/water-interruption.jpg',
      alt: 'Water interruption notice over a dripping faucet',
      fit: 'cover',
    },
  },
];

function imageFor(title: string) {
  return IMAGES.find(({ match }) => match.test(title))?.image;
}

function toneFor(category: string) {
  return TONES[category.trim().toLowerCase()] ?? FALLBACK;
}

/**
 * One update, laid out like a post in a social/news feed: who posted it and
 * when, the story, a glassy media tile, and a pill call-to-action. The frame
 * borrows the frosted-glass container look (soft translucent shell around a
 * solid inner card, big radii, pill buttons).
 */
function FeedPost({ item }: { item: FeedItem }) {
  const tone = toneFor(item.category);
  const image = imageFor(item.title);

  return (
    <article className="group relative flex h-full flex-col rounded-[26px] border-2 border-white/80 bg-white/45 p-2 shadow-[7px_7px_0_0_rgba(53,70,56,0.13)] backdrop-blur-md transition duration-300 hover:-translate-y-0.5 hover:shadow-[9px_9px_0_0_rgba(53,70,56,0.15)]">
      <div className="flex flex-1 flex-col overflow-hidden rounded-[19px] border border-earth/10 bg-white">
        {/* Post header: avatar, poster, time, category */}
        <header className="flex items-center gap-3 px-4 pb-2.5 pt-3.5">
          <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-rice via-leaf to-river p-[2.5px]">
            <span className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-white">
              <Image
                src="/maporong-logo.png"
                alt=""
                width={40}
                height={40}
                className="h-full w-full object-contain"
              />
            </span>
          </span>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-extrabold text-forest">Barangay Maporong</p>
            <p className="truncate text-xs font-semibold text-muted">Barangay Desk</p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-1 text-[0.6875rem] font-bold uppercase tracking-[0.1em] ${tone.chip}`}
            >
              {item.category || 'General'}
            </span>
          </div>
        </header>

        {/* Post copy */}
        <div className="px-4">
          <h3 className="line-clamp-2 text-balance font-display text-base font-extrabold leading-snug text-forest sm:text-lg">
            {item.title}
          </h3>
          <p className="body-sm mt-1.5 line-clamp-3">{item.excerpt}</p>
        </div>

        {/* Media tile: the update's picture, or a gradient + icon when it has none */}
        <div className="px-3 pb-0.5 pt-3">
          {image ? (
            <div
              className={`relative h-32 overflow-hidden rounded-[20px] border border-earth/10 ${
                image.fit === 'contain' ? 'bg-white' : 'bg-mist'
              }`}
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                sizes="(min-width: 768px) 33vw, 100vw"
                className={image.fit === 'contain' ? 'object-contain p-2' : 'object-cover'}
                style={image.position ? { objectPosition: image.position } : undefined}
              />
            </div>
          ) : (
            <div
              aria-hidden="true"
              className={`relative flex h-32 items-center justify-center overflow-hidden rounded-[20px] bg-gradient-to-br ${tone.banner}`}
            >
              <span className="absolute -left-6 top-4 h-28 w-28 rounded-full bg-white/35 blur-sm" />
              <span className="absolute -bottom-8 -right-4 h-32 w-32 rounded-[36px] bg-white/25 [transform:rotate(18deg)]" />
              <span className="absolute left-1/3 top-3 h-3 w-3 rounded-sm bg-white/70" />
              <span className="absolute bottom-5 right-1/3 h-2 w-2 rounded-sm bg-white/60" />
              <span className="relative flex h-16 w-16 items-center justify-center rounded-[22px] border-2 border-white/70 bg-white/45 text-forest shadow-subtle backdrop-blur-sm">
                {tone.icon}
              </span>
            </div>
          )}
        </div>

        {/* Post footer */}
        <footer className="mt-auto flex items-center justify-between gap-3 px-4 pb-3.5 pt-3">
          <time
            dateTime={item.iso}
            className="inline-flex items-center gap-1.5 rounded-full border border-earth/10 bg-subtle px-3 py-1.5 text-xs font-semibold text-muted"
          >
            <CalendarIcon className="h-3.5 w-3.5" />
            {item.dateLabel}
          </time>

          <Link
            href="/dashboard/announcements"
            className="inline-flex items-center gap-1.5 rounded-full bg-forest px-4 py-2 text-xs font-bold text-white shadow-subtle transition hover:gap-2.5 hover:bg-pine-deep"
          >
            Read update
            <ArrowRightIcon className="h-3.5 w-3.5" />
          </Link>
        </footer>
      </div>
    </article>
  );
}

/** The latest updates as feed posts, side by side on one row (stacked on small screens). */
export function NewsFeed({ items }: { items: FeedItem[] }) {
  return (
    <div className="grid items-stretch gap-6 md:grid-cols-3 lg:gap-9">
      {items.map((item) => (
        <FeedPost key={item.id} item={item} />
      ))}
    </div>
  );
}
