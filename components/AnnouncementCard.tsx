import type { ReactNode } from 'react';

import type { Announcement } from '@/lib/types';
import { PostCard } from '@/components/PostCard';

export function formatAnnouncementDate(value: string | null | undefined) {
  if (!value) return 'Date to be confirmed';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date to be confirmed';

  return date.toLocaleDateString('en-PH', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'Asia/Manila',
  });
}

const shortDate = (value: string | null | undefined) => {
  if (!value) return 'Date to be confirmed';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date to be confirmed';
  return date.toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'Asia/Manila',
  });
};

/**
 * An announcement rendered as a feed post. The resident noticeboard shows the
 * full text; the staff workspace passes `clamp`, `status` and `toolbar`.
 */
export function AnnouncementCard({
  announcement,
  clamp = false,
  large = false,
  status,
  footerAction,
  toolbar,
  className = '',
}: {
  announcement: Announcement;
  clamp?: boolean;
  large?: boolean;
  status?: ReactNode;
  footerAction?: ReactNode;
  toolbar?: ReactNode;
  className?: string;
}) {
  const when = announcement.published_at || announcement.created_at;

  return (
    <PostCard
      title={announcement.title}
      body={announcement.body}
      category={announcement.category?.trim() || 'General'}
      dateLabel={shortDate(when)}
      iso={when}
      imageUrl={announcement.image_url}
      clamp={clamp}
      large={large}
      status={status}
      footerAction={footerAction}
      toolbar={toolbar}
      className={className}
    />
  );
}
