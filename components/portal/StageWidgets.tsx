import type { ReactNode } from 'react';
import Link from 'next/link';

import { PixelIcon, type PixelIconName } from './PixelIcon';

const featureTones = {
  forest: 'border-pine/30 bg-pine text-cream',
  rice: 'border-rice/60 bg-straw text-forest',
  sky: 'border-river/40 bg-sky text-forest',
} as const;

export function StagePanel({
  title,
  icon,
  children,
  className = '',
}: {
  title: string;
  icon: PixelIconName;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-[22px] border-2 border-line bg-white p-4 shadow-subtle sm:p-5 ${className}`}
    >
      <h2 className="flex items-center gap-2 font-display text-base font-bold text-forest">
        <PixelIcon name={icon} size={22} className="text-pine" />
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

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
    <div className="flex flex-col gap-3 border-b border-line py-3 first:pt-0 last:border-b-0 last:pb-0 sm:flex-row sm:items-start">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-mint text-pine">
        <PixelIcon name={icon} size={20} />
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-extrabold text-forest">{title}</h3>
        <p className="mt-1 text-xs leading-relaxed text-muted">{description}</p>
        {action && <div className="mt-2.5">{action}</div>}
      </div>
    </div>
  );
}

export function FeatureCard({
  icon,
  title,
  description,
  action,
  tone = 'sky',
}: {
  icon: PixelIconName;
  title: string;
  description: string;
  action: ReactNode;
  tone?: keyof typeof featureTones;
}) {
  return (
    <section
      className={`flex min-h-[190px] flex-col rounded-[22px] border-2 p-5 shadow-subtle sm:p-6 ${featureTones[tone]}`}
    >
      <PixelIcon name={icon} size={32} />
      <h2 className="mt-4 font-display text-xl font-bold leading-snug">{title}</h2>
      <p className="mt-2 flex-1 text-sm leading-relaxed opacity-85">{description}</p>
      <div className="mt-5">{action}</div>
    </section>
  );
}

type ShortcutAction =
  | { href: string; onClick?: never }
  | { href?: never; onClick: () => void };

export function ShortcutButton({
  icon,
  title,
  description,
  href,
  onClick,
}: {
  icon: PixelIconName;
  title: string;
  description: string;
} & ShortcutAction) {
  const content = (
    <>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-mint text-pine">
        <PixelIcon name={icon} size={22} />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-extrabold text-forest">{title}</span>
        <span className="mt-1 block text-xs leading-relaxed text-muted">{description}</span>
      </span>
    </>
  );

  const className =
    'interactive-card flex min-h-[76px] items-start gap-3 rounded-2xl border-2 border-line bg-white p-3.5 text-left shadow-subtle';

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

export function AnnouncementBar({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action: ReactNode;
}) {
  return (
    <section className="sticky bottom-20 z-20 flex flex-col gap-3 rounded-2xl border-2 border-rice/60 bg-straw p-4 shadow-card sm:bottom-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-pine">
          <PixelIcon name="news" size={22} />
        </span>
        <div className="min-w-0">
          <p className="text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-muted">
            Community announcements
          </p>
          <h2 className="mt-1 truncate text-sm font-extrabold text-forest">{title}</h2>
          <p className="mt-0.5 text-xs leading-relaxed text-muted">{description}</p>
        </div>
      </div>
      <div className="shrink-0">{action}</div>
    </section>
  );
}
