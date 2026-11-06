import type { Announcement } from '@/lib/types';
import { Badge, type BadgeTone } from '@/components/ui/Badge';
import { CalendarIcon } from '@/components/ui/icons';

const CATEGORY_TONES: Record<string, BadgeTone> = {
  general: 'neutral',
  health: 'green',
  advisory: 'gold',
  safety: 'gold',
  event: 'sky',
  events: 'sky',
  activity: 'sky',
  activities: 'sky',
  program: 'green',
};

function categoryTone(category: string): BadgeTone {
  return CATEGORY_TONES[category.trim().toLowerCase()] ?? 'neutral';
}

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

export function AnnouncementCard({
  announcement,
  compact = false,
  className = '',
}: {
  announcement: Announcement;
  compact?: boolean;
  className?: string;
}) {
  const category = announcement.category?.trim() || 'General';

  return (
    <article
      className={`interactive-card flex h-full flex-col rounded-[20px] border-2 border-line bg-white p-5 shadow-subtle sm:p-6 ${className}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={categoryTone(category)}>{category}</Badge>
        <time
          dateTime={announcement.published_at || announcement.created_at}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted"
        >
          <CalendarIcon className="h-3.5 w-3.5" />
          {formatAnnouncementDate(announcement.published_at || announcement.created_at)}
        </time>
      </div>

      <h3 className={`mt-3 text-balance font-display font-extrabold text-forest ${compact ? 'text-lg leading-snug' : 'heading-3'}`}>
        {announcement.title}
      </h3>

      <p
        className={`mt-2 whitespace-pre-wrap break-words text-forest/85 ${
          compact ? 'line-clamp-3 body-sm' : 'body-md'
        }`}
      >
        {announcement.body}
      </p>
    </article>
  );
}
