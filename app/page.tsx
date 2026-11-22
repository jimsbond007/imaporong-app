import type { Metadata } from 'next';

import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { RiceFieldScene } from '@/components/landing/RiceFieldScene';
import { CommunityMap } from '@/components/landing/CommunityMap';
import { ServiceShowcase } from '@/components/landing/ServiceShowcase';
import { ButtonLink } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import {
  BellIcon,
  CalendarIcon,
  HandHeartIcon,
  HomeIcon,
  MapPinIcon,
} from '@/components/ui/icons';
import { BARANGAY } from '@/lib/constants';
import { getLatestAnnouncements } from '@/lib/data/announcements';

export const metadata: Metadata = {
  title: 'iMaporong · Rooted in community. Growing together.',
  description:
    'The online front desk of Barangay Maporong, Oas, Albay. Request documents, follow announcements, and find the barangay hall — all in one place.',
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date to be confirmed';
  return new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function excerpt(text: string, max = 120) {
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length > max ? `${clean.slice(0, max).trimEnd()}…` : clean;
}

export default async function HomePage() {
  const announcements = await getLatestAnnouncements(3);

  return (
    <div id="top">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-full focus:bg-pine focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-white"
      >
        Skip to content
      </a>

      <SiteHeader />

      <main id="main" className="flow-page relative isolate">
        {/* Blurred, flowing green backdrop shared by every section */}
        <div aria-hidden="true" className="flow-bg">
          <span className="flow-blob flow-blob-1" />
          <span className="flow-blob flow-blob-2" />
          <span className="flow-blob flow-blob-3" />
          <span className="flow-blob flow-blob-4" />
          <span className="flow-blob flow-blob-5" />
          <span className="flow-blob flow-blob-6" />
          <span className="flow-blob flow-blob-7" />

          {/* Cream silhouettes: soft, flowing ribbons layered over the green */}
          <svg
            className="flow-silhouette flow-silhouette-1"
            viewBox="0 0 1440 320"
            preserveAspectRatio="none"
          >
            <path d="M0 150C180 60 330 40 520 110C700 176 830 250 1030 200C1200 158 1320 70 1440 100V320H0Z" />
          </svg>
          <svg
            className="flow-silhouette flow-silhouette-2"
            viewBox="0 0 1440 320"
            preserveAspectRatio="none"
          >
            <path d="M0 90C140 150 300 230 500 190C700 150 800 40 1010 60C1190 78 1320 170 1440 130V320H0Z" />
          </svg>
          <svg
            className="flow-silhouette flow-silhouette-3"
            viewBox="0 0 1440 320"
            preserveAspectRatio="none"
          >
            <path d="M0 120C200 40 360 70 560 140C760 210 900 230 1080 160C1230 102 1350 90 1440 140V320H0Z" />
          </svg>
        </div>

        {/* ------------------------------------------------------------- Hero */}
        <section className="hero-sky relative isolate min-h-[min(calc(100svh-72px),700px)] overflow-hidden">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <RiceFieldScene className="absolute inset-0 h-full w-full" />
            <div className="absolute inset-0 bg-gradient-to-b from-[#eaf4e0]/95 via-[#e3f0d9]/70 to-transparent" />
          </div>

          <div className="relative z-10 mx-auto max-w-4xl px-5 pb-6 pt-8 text-center sm:pb-8 sm:pt-10">
            <p className="inline-flex items-center gap-2 rounded-full border-2 border-earth/10 bg-cream/80 px-3.5 py-1.5 text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-pine shadow-subtle backdrop-blur-sm">
              <MapPinIcon className="h-3.5 w-3.5" />
              {BARANGAY.name} · {BARANGAY.municipality}, {BARANGAY.province}
            </p>

            <h1 className="display-hero mx-auto mt-4 max-w-3xl text-forest">
              Rooted in community.
              <span className="block text-pine">Growing together.</span>
            </h1>

            <p className="mx-auto mt-3 max-w-xl text-base font-semibold leading-relaxed text-forest/75 sm:text-lg">
              iMaporong is your barangay desk online — services, updates, and bayanihan in
              one place.
            </p>

            <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <ButtonLink
                href="/auth?mode=register"
                size="lg"
                className="w-full min-w-[180px] sm:w-auto"
              >
                Get Started
              </ButtonLink>
              <ButtonLink
                href="/#services"
                variant="secondary"
                size="lg"
                className="w-full sm:w-auto"
              >
                Explore services
              </ButtonLink>
            </div>

            <p className="mt-3 text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-forest/50">
              Free to use · Private by design · Made for Maporong
            </p>
          </div>

          <p className="sr-only">
            A pixel-art view of Barangay Maporong at golden hour: rice fields, a river with a
            wooden bridge, nipa houses, coconut trees, and neighbours at work and at rest.
          </p>
        </section>

        {/* --------------------------------------------------------- Services */}
        <section id="services" className="scroll-mt-24 py-16 sm:py-20">
          <div className="page-shell">
            <div className="mx-auto max-w-2xl text-center">
              <p className="eyebrow">Barangay services</p>
              <h2 className="heading-1 mt-2">Four ways to start.</h2>
              <p className="body-md mt-2">
                Everything you need from the barangay desk, without the back-and-forth.
              </p>
            </div>

            <ServiceShowcase />
          </div>
        </section>

        {/* ---------------------------------------------------- Announcements */}
        <section
          id="announcements"
          className="scroll-mt-24 border-y-2 border-pine/10 bg-white/35 py-16 backdrop-blur-sm sm:py-20"
        >
          <div className="page-shell">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="eyebrow">Updates</p>
                <h2 className="heading-1 mt-2">Latest from the barangay</h2>
                <p className="body-md mt-2 max-w-xl">
                  Short updates from the desk. Published here the moment staff post them.
                </p>
              </div>
              <Badge tone="green">
                <BellIcon className="h-3.5 w-3.5" />
                {announcements.available
                  ? `${announcements.items.length} recent`
                  : 'Awaiting first post'}
              </Badge>
            </div>

            {announcements.items.length > 0 ? (
              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {announcements.items.map((announcement) => (
                  <article
                    key={announcement.id}
                    className="interactive-card flex h-full flex-col rounded-[24px] border-2 border-earth/10 bg-white p-5 shadow-subtle sm:p-6"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="sky">{announcement.category || 'General'}</Badge>
                      <time
                        dateTime={announcement.published_at}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted"
                      >
                        <CalendarIcon className="h-3.5 w-3.5" />
                        {formatDate(announcement.published_at)}
                      </time>
                    </div>
                    <h3 className="mt-3 line-clamp-2 font-display text-lg font-extrabold leading-snug text-forest">
                      {announcement.title}
                    </h3>
                    <p className="body-sm mt-2 line-clamp-3 flex-1">
                      {excerpt(announcement.body)}
                    </p>
                  </article>
                ))}
              </div>
            ) : (
              <div className="mt-8">
                <EmptyState
                  icon={<BellIcon className="h-5 w-5" />}
                  title="No updates yet"
                  description={
                    announcements.available
                      ? 'The desk has not published an update yet. New posts appear here right away.'
                      : 'The noticeboard is being prepared. Published announcements will appear here once the barangay sets it up.'
                  }
                />
              </div>
            )}
          </div>
        </section>

        {/* -------------------------------------------------------- Community */}
        <section id="community" className="scroll-mt-24 py-16 sm:py-20">
          <div className="page-shell grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
            <div className="order-2 lg:order-1">
              <div className="overflow-hidden rounded-[28px] border-2 border-earth/10 bg-white p-2.5 shadow-card">
                <a
                  href={BARANGAY.mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="block overflow-hidden rounded-[20px] border border-line"
                  aria-label="Open Barangay Maporong in Google Maps"
                >
                  <CommunityMap className="h-auto w-full" />
                </a>
                <div className="flex flex-col gap-2 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs font-bold text-forest">
                    Barangay Maporong, {BARANGAY.municipality}, {BARANGAY.province}
                  </p>
                  <a
                    href={BARANGAY.mapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-fit border-b-2 border-pine/40 pb-0.5 text-xs font-bold text-pine transition hover:border-pine"
                  >
                    Open in Maps
                  </a>
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <p className="eyebrow">Our community</p>
              <h2 className="heading-1 mt-2">Find home on the map — then skip the trip.</h2>
              <p className="body-md mt-3 max-w-lg">
                Maporong is rice fields, river light, and neighbours who show up for each
                other. iMaporong keeps the barangay desk close, wherever you are.
              </p>

              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {[
                  {
                    icon: <MapPinIcon className="h-4.5 w-4.5" />,
                    title: 'Oas, Albay',
                    text: 'In the heart of the Bicol Region.',
                  },
                  {
                    icon: <HomeIcon className="h-4.5 w-4.5" />,
                    title: 'Rice and river',
                    text: 'A farming community by the water.',
                  },
                  {
                    icon: <HandHeartIcon className="h-4.5 w-4.5" />,
                    title: 'Bayanihan',
                    text: 'Neighbours helping neighbours.',
                  },
                  {
                    icon: <BellIcon className="h-4.5 w-4.5" />,
                    title: 'One desk',
                    text: 'Services and updates in one place.',
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="rounded-2xl border-2 border-earth/10 bg-white p-4 shadow-subtle"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-mint text-pine">
                      {item.icon}
                    </span>
                    <p className="mt-3 text-sm font-extrabold text-forest">{item.title}</p>
                    <p className="body-sm mt-1">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* --------------------------------------------------------------- CTA */}
        <section id="about" className="scroll-mt-24 pb-16 sm:pb-20">
          <div className="page-shell">
            <div className="relative overflow-hidden rounded-[32px] border-2 border-earth/10 bg-mint px-6 py-11 sm:px-10 lg:flex lg:items-center lg:justify-between lg:gap-10 lg:px-12">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full bg-rice/30"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-6 left-6 hidden gap-1 sm:flex"
              >
                <span className="h-10 w-1.5 rounded-full bg-pine/25" />
                <span className="mt-3 h-7 w-1.5 rounded-full bg-pine/20" />
                <span className="mt-1 h-9 w-1.5 rounded-full bg-pine/15" />
              </div>

              <div className="relative z-10 max-w-2xl">
                <p className="eyebrow">Growing together</p>
                <h2 className="heading-1 mt-2">
                  Every seed has a beginning. Every harvest has a community.
                </h2>
                <p className="body-md mt-3">
                  Join your neighbours on iMaporong — the barangay desk that grows with the
                  community.
                </p>
              </div>

              <div className="relative z-10 mt-7 flex flex-col gap-3 sm:flex-row lg:mt-0 lg:shrink-0">
                <ButtonLink href="/auth?mode=register" size="lg">
                  Get Started
                </ButtonLink>
                <ButtonLink href="/auth" variant="secondary" size="lg">
                  Sign In
                </ButtonLink>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
