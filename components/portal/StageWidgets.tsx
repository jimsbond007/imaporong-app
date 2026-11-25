import type { ReactNode } from 'react';
import Link from 'next/link';

import { PixelIcon, type PixelIconName } from './PixelIcon';

/** Soft white card with the theme's chunky border + hard offset shadow. */
export function StagePanel({
  title,
  icon,
  count,
  action,
  children,
  className = '',
}: {
  title: string;
  icon: PixelIconName;
  /** Optional small number chip beside the title. */
  count?: number;
  /** Optional control on the right of the title, e.g. a cancel button. */
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-[22px] border-2 border-line bg-surface p-4 shadow-subtle sm:p-5 ${className}`}
    >
      <h2 className="flex items-center gap-2 font-display text-base font-bold text-forest">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-mint text-pine-ink">
          <PixelIcon name={icon} size={18} />
        </span>
        {title}
        {typeof count === 'number' && count > 0 && (
          <span className="ml-auto rounded-full border border-pending-line bg-pending-bg px-2.5 py-0.5 font-sans text-[0.6875rem] font-bold text-pending-ink">
            {count}
          </span>
        )}
        {action && <span className="ml-auto font-sans">{action}</span>}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** Big green summary banner: one headline, one primary action. */
export function SummaryHero({
  eyebrow,
  title,
  description,
  action,
  chips,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
  chips?: { label: string; value: number }[];
}) {
  return (
    <section className="relative overflow-hidden rounded-[24px] border-2 border-pine-deep/40 bg-pine p-5 text-paper shadow-card sm:p-7">
      {/* Decorative pixel blocks, echoing the village backdrop */}
      <div aria-hidden="true" className="pointer-events-none absolute -right-4 -top-4 grid grid-cols-4 gap-1.5 opacity-20">
        {Array.from({ length: 16 }).map((_, i) => (
          <span
            key={i}
            className={`h-7 w-7 rounded-[6px] ${i % 3 === 0 ? 'bg-rice' : i % 2 === 0 ? 'bg-leaf' : 'bg-paper'}`}
          />
        ))}
      </div>

      <div className="relative">
        <p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-paper/70">
          {eyebrow}
        </p>
        <h2 className="mt-2 max-w-md font-display text-2xl font-bold leading-snug !text-paper sm:text-[1.75rem]">
          {title}
        </h2>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-paper/80">{description}</p>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          {action}
          {chips?.map((chip) => (
            <span
              key={chip.label}
              className="inline-flex items-center gap-2 rounded-full border border-paper/25 bg-paper/10 px-3 py-1.5 text-xs font-bold text-paper"
            >
              <span className="font-display text-sm">{chip.value}</span>
              {chip.label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/** A single compact line: icon, title, meta, and a quiet action on the right. */
export function TaskRow({
  icon,
  title,
  description,
  action,
}: {
  icon: PixelIconName;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-line py-3 first:pt-0 last:border-b-0 last:pb-0">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-mint text-pine-ink">
        <PixelIcon name={icon} size={20} />
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="truncate font-sans text-sm font-extrabold text-forest">{title}</h3>
        <p className="mt-0.5 truncate text-xs text-muted">{description}</p>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

type TileAction =
  | { href: string; onClick?: never }
  | { href?: never; onClick: () => void };

/** Small square-ish shortcut: icon, title, and one short hint line. */
export function ActionTile({
  icon,
  title,
  hint,
  href,
  onClick,
}: {
  icon: PixelIconName;
  title: string;
  hint?: string;
} & TileAction) {
  const content = (
    <>
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-mint text-pine-ink">
        <PixelIcon name={icon} size={22} />
      </span>
      <span className="mt-3 block text-sm font-extrabold text-forest">{title}</span>
      {hint && <span className="mt-0.5 block text-xs text-muted">{hint}</span>}
    </>
  );

  const className =
    'interactive-card flex flex-col items-start rounded-2xl border-2 border-line bg-surface p-3.5 text-left shadow-subtle';

  return href ? (
    <Link href={href} className={className}>
      {content}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  );
}

/** Warm straw-coloured card that replaces the old sticky announcement bar. */
export function NoticeCard({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action: ReactNode;
}) {
  return (
    <section className="rounded-[22px] border-2 border-rice/60 bg-straw p-4 shadow-subtle sm:p-5">
      <p className="flex items-center gap-2 text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-muted">
        <PixelIcon name="news" size={16} className="text-pine-ink" />
        Latest notice
      </p>
      <h2 className="mt-2 line-clamp-2 font-display text-base font-bold leading-snug text-forest">
        {title}
      </h2>
      <p className="mt-1 text-xs leading-relaxed text-muted">{description}</p>
      <div className="mt-4">{action}</div>
    </section>
  );
}
