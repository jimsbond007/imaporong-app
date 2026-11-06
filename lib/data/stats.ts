import { createClient } from '@/lib/supabase/server';
import type { PublicStats } from '@/lib/types';

export type StatsResult = {
  stats: PublicStats | null;
  available: boolean;
};

/**
 * Reads aggregate counts from the `get_public_stats()` RPC.
 *
 * The RPC returns counts only — no names, addresses, or request details. If the
 * RPC has not been created yet, the landing page shows a dash and an honest
 * note instead of inventing numbers.
 */
export async function getPublicStats(): Promise<StatsResult> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('get_public_stats');

    if (error || !data) {
      return { stats: null, available: false };
    }

    const raw = data as Partial<PublicStats>;
    return {
      available: true,
      stats: {
        verified_residents: Number(raw.verified_residents ?? 0),
        requests_served: Number(raw.requests_served ?? 0),
        announcements: Number(raw.announcements ?? 0),
      },
    };
  } catch {
    return { stats: null, available: false };
  }
}
