import type { ReactNode } from 'react';
import { RiceFieldScene } from '@/components/landing/RiceFieldScene';

/**
 * Shared pixel-landscape page header.
 *
 * Every resident-facing page uses the same countryside treatment so the
 * portal feels like one place.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  action,
  className = '',
}: {
  eyebrow: string;
  title: ReactNode;
  description: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`relative overflow-hidden rounded-[26px] border-2 border-line bg-white p-6 shadow-card sm:p-8 ${className}`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 bg-sky/80"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-16 -left-12 h-36 w-36 bg-mint/70"
      />

      <div className="relative grid items-center gap-6 sm:grid-cols-[1.35fr_1fr]">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="heading-1 mt-2 text-balance">{title}</h1>
          <div className="body-md mt-2 max-w-xl">{description}</div>
          {action && <div className="mt-6 flex flex-wrap gap-2.5">{action}</div>}
        </div>

        <div className="relative h-36 overflow-hidden rounded-[20px] border-2 border-line bg-sky sm:h-40">
          <RiceFieldScene className="absolute inset-0 h-full w-full" />
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-cream/15 to-transparent" />
        </div>
      </div>
    </section>
  );
}
