import Link from 'next/link';

import { PostCard } from '@/components/PostCard';
import { ArrowRightIcon } from '@/components/ui/icons';

export type FeedItem = {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  dateLabel: string;
  iso: string;
  imageUrl?: string | null;
};

/** The latest updates as feed posts, side by side on one row (stacked on small screens). */
export function NewsFeed({ items }: { items: FeedItem[] }) {
  return (
    <div className="grid items-stretch gap-6 md:grid-cols-3 lg:gap-9">
      {items.map((item) => (
        <PostCard
          key={item.id}
          title={item.title}
          body={item.excerpt}
          category={item.category}
          dateLabel={item.dateLabel}
          iso={item.iso}
          imageUrl={item.imageUrl}
          clamp
          footerAction={
            <Link
              href="/dashboard/announcements"
              className="inline-flex items-center gap-1.5 rounded-full bg-ink-solid px-4 py-2 text-xs font-bold text-white shadow-subtle transition hover:gap-2.5 hover:bg-pine-deep"
            >
              Read update
              <ArrowRightIcon className="h-3.5 w-3.5" />
            </Link>
          }
        />
      ))}
    </div>
  );
}
