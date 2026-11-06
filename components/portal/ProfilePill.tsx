import type { ReactNode } from 'react';

import { Badge } from '@/components/ui/Badge';
import { PixelIcon } from './PixelIcon';

/**
 * Avatar + name + real status, used at the top-left of every signed-in stage.
 * Status must come from data the page already loaded — never a decorative
 * claim. `roleLabel` is the plain-language role ("Resident", "Administrator").
 */
export function ProfilePill({
  name,
  roleLabel,
  statusLabel,
  statusTone = 'green',
}: {
  name: string;
  roleLabel: string;
  statusLabel?: string;
  statusTone?: 'green' | 'gold' | 'sky' | 'neutral';
}) {
  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'R';

  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border-2 border-earth/15 bg-pine font-display text-sm font-extrabold text-cream shadow-subtle">
        {initials}
      </span>
      <span className="min-w-0 leading-tight">
        <span className="block truncate font-display text-sm font-extrabold tracking-tight text-forest sm:text-base">
          {name}
        </span>
        <span className="mt-0.5 flex flex-wrap items-center gap-1.5">
          <span className="text-[0.625rem] font-bold uppercase tracking-[0.14em] text-pine">
            {roleLabel}
          </span>
          {statusLabel && (
            <Badge tone={statusTone}>
              <PixelIcon name="shield" size={11} />
              {statusLabel}
            </Badge>
          )}
        </span>
      </span>
    </div>
  );
}

export type StatusChip = {
  label: string;
  tone?: 'green' | 'gold' | 'sky' | 'neutral';
  icon?: ReactNode;
};

/** Small independent status chip used beside the profile pill. */
export function StatusChip({ label, tone = 'green', icon }: StatusChip) {
  return (
    <Badge tone={tone}>
      {icon ?? <PixelIcon name="sprout" size={11} />}
      {label}
    </Badge>
  );
}
