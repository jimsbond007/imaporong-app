import type { Metadata } from 'next';
import Link from 'next/link';

import { getCurrentProfile } from '@/lib/auth';
import { getAnnouncementFeed } from '@/lib/data/announcements';
import { AnnouncementCard } from '@/components/AnnouncementCard';
import { PageHeader } from '@/components/portal/PageHeader';
import { PortalHeader } from '@/components/portal/PortalHeader';
import { StageLayout } from '@/components/portal/StageLayout';
import { buttonClasses } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  ArrowRightIcon,
  BellIcon,
  InfoIcon,
} from '@/components/ui/icons';
import { PixelIcon } from '@/components/portal/PixelIcon';

export const metadata: Metadata = {
  title: 'Announcements',
  description:
    'Barangay announcements, advisories, and community updates for residents of Barangay Maporong, Oas, Albay.',
};

export default async function ResidentAnnouncementsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const [params, { profile }] = await Promise.all([
    searchParams,
    getCurrentProfile(),
  ]);

  const requestedCategory = params.category?.trim() || null;
  let feed = await getAnnouncementFeed({ category: requestedCategory });
  let activeCategory =
    requestedCategory && feed.categories.includes(requestedCategory)
      ? requestedCategory
      : null;

  // An unknown category should not look like an empty noticeboard.
  // Fall back to the full feed instead.
  if (requestedCategory && !activeCategory) {
    feed = await getAnnouncementFeed();
    activeCategory = null;
  }

  return (
    <div className="min-h-screen bg-mist/60 pb-24 md:pb-16">
      <PortalHeader
        name={profile?.full_name || 'Resident'}
        role={profile?.role || 'resident'}
        isVerified={Boolean(profile?.is_verified)}
        active="announcements"
      />

      <StageLayout className="pb-24 md:pb-16" contentClassName="p-3 sm:p-5">
      <main className="page-shell py-5">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-pine transition hover:gap-2.5"
        >
          <ArrowRightIcon className="h-4 w-4 rotate-180" />
          Back to overview
        </Link>

        <PageHeader
          className="mt-5"
          eyebrow="Community noticeboard"
          title="Announcements"
          description={
            <>
              Advisories, schedules, and community updates from Barangay Maporong.
              Everything here is posted by barangay staff.
              {feed.available && (
                <span className="mt-3 block text-sm font-semibold text-muted">
                  {feed.items.length === 0
                    ? 'No posts in this view.'
                    : `${feed.items.length} ${feed.items.length === 1 ? 'post' : 'posts'}${
                        activeCategory ? ` in ${activeCategory}` : ''
                      }`}
                </span>
              )}
            </>
          }
        />

        {feed.available && feed.categories.length > 0 && (
          <nav aria-label="Filter announcements by category" className="mt-6">
            <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
              <FilterChip href="/dashboard/announcements" active={!activeCategory}>
                All
              </FilterChip>
              {feed.categories.map((category) => (
                <FilterChip
                  key={category}
                  href={`/dashboard/announcements?category=${encodeURIComponent(category)}`}
                  active={activeCategory === category}
                >
                  {category}
                </FilterChip>
              ))}
            </div>
          </nav>
        )}

        <section className="mt-6" aria-label="Announcement feed">
          {!feed.available ? (
            <div className="rounded-[24px] border-2 border-line bg-white p-6 shadow-card sm:p-8">
              <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky text-[#3a6478]">
                  <InfoIcon className="h-6 w-6" />
                </span>
                <div>
                  <h2 className="heading-3">The online noticeboard is being set up</h2>
                  <p className="body-sm mt-1.5 max-w-xl">
                    Barangay staff have not opened the online noticeboard yet. Please
                    check back soon, or visit the barangay hall for current advisories.
                  </p>
                </div>
              </div>
            </div>
          ) : feed.items.length === 0 ? (
            <EmptyState
              icon={<BellIcon className="h-5 w-5" />}
              illustration={<PixelIcon name="news" size={80} className="text-pine" />}
              title={activeCategory ? `No ${activeCategory} announcements yet` : 'No announcements yet'}
              description={
                activeCategory
                  ? 'Try another category, or view all announcements from the barangay.'
                  : 'When barangay staff publish an advisory or community update, it will appear here.'
              }
              action={
                activeCategory ? (
                  <Link
                    href="/dashboard/announcements"
                    className={buttonClasses('secondary', 'md')}
                  >
                    View all announcements
                  </Link>
                ) : undefined
              }
            />
          ) : (
            <ul className="grid gap-4 lg:grid-cols-2">
              {feed.items.map((announcement, index) => (
                <li
                  key={announcement.id}
                  className="animate-fade-up"
                  style={{ animationDelay: `${Math.min(index, 6) * 60}ms` }}
                >
                  <AnnouncementCard announcement={announcement} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
      </StageLayout>
    </div>
  );
}

function FilterChip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={`inline-flex min-h-10 shrink-0 items-center rounded-xl border px-4 py-2 text-sm font-bold transition ${
        active
          ? 'border-pine bg-pine text-white'
          : 'border-line bg-white text-muted hover:border-leaf hover:text-pine'
      }`}
    >
      {children}
    </Link>
  );
}
