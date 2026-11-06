import { createClient } from '@/lib/supabase/server';
import type { Announcement } from '@/lib/types';

const ANNOUNCEMENT_FIELDS =
  'id, title, body, category, published, published_at, created_at, updated_at';

export type AnnouncementsResult = {
  items: Announcement[];
  available: boolean;
  message?: string;
};

export type AnnouncementFeedResult = AnnouncementsResult & {
  categories: string[];
};

/**
 * Reads the latest published announcements.
 *
 * The table is created by 20261105120000_security_hardening_and_announcements.sql.
 * Until that migration runs, the landing page shows a calm placeholder instead
 * of an error, so the site is still usable while the database is being set up.
 */
export async function getLatestAnnouncements(limit = 3): Promise<AnnouncementsResult> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('announcements')
      .select(ANNOUNCEMENT_FIELDS)
      .eq('published', true)
      .order('published_at', { ascending: false })
      .limit(limit);

    if (error) {
      return {
        items: [],
        available: false,
        message: error.message,
      };
    }

    return { items: (data ?? []) as Announcement[], available: true };
  } catch (error) {
    return {
      items: [],
      available: false,
      message: error instanceof Error ? error.message : 'Announcements are unavailable.',
    };
  }
}

/**
 * Full noticeboard feed for the resident portal.
 *
 * Returns the published announcements plus the list of categories that are in
 * use, so the page can render filter chips without a second round trip from
 * the client. A missing table degrades to `available: false` instead of an
 * error page.
 */
export async function getAnnouncementFeed({
  limit = 50,
  category,
}: {
  limit?: number;
  category?: string | null;
} = {}): Promise<AnnouncementFeedResult> {
  try {
    const supabase = await createClient();

    let query = supabase
      .from('announcements')
      .select(ANNOUNCEMENT_FIELDS)
      .eq('published', true)
      .order('published_at', { ascending: false })
      .limit(limit);

    if (category) {
      query = query.eq('category', category);
    }

    const [feedResult, categoryResult] = await Promise.all([
      query,
      supabase.from('announcements').select('category').eq('published', true),
    ]);

    if (feedResult.error) {
      return {
        items: [],
        categories: [],
        available: false,
        message: feedResult.error.message,
      };
    }

    const categories = Array.from(
      new Set(
        ((categoryResult.data ?? []) as Array<{ category: string | null }>)
          .map((row) => row.category?.trim())
          .filter((value): value is string => Boolean(value)),
      ),
    ).sort((a, b) => a.localeCompare(b));

    return {
      items: (feedResult.data ?? []) as Announcement[],
      categories,
      available: true,
    };
  } catch (error) {
    return {
      items: [],
      categories: [],
      available: false,
      message: error instanceof Error ? error.message : 'Announcements are unavailable.',
    };
  }
}
