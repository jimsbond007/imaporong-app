import type { Metadata } from 'next';
import DashboardClient from './DashboardClient';
import { getLatestAnnouncements } from '@/lib/data/announcements';

export const metadata: Metadata = {
  title: 'Resident overview',
  description:
    'Your iMaporong resident record, document requests, and request history with Barangay Maporong.',
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const [params, announcementFeed] = await Promise.all([
    searchParams,
    getLatestAnnouncements(3),
  ]);

  return (
    <DashboardClient
      showAdminOnlyNotice={params.notice === 'admin-only'}
      latestAnnouncements={announcementFeed.items}
      announcementsAvailable={announcementFeed.available}
    />
  );
}
