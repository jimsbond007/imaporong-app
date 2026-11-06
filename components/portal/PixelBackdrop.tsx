import { RiceFieldScene } from '@/components/landing/RiceFieldScene';

/**
 * A muted slice of the landing-page countryside used behind every signed-in
 * screen. Keeping the same scene ties the portal to the public site, while the
 * cream wash keeps forms and tables readable.
 */
export function PixelBackdrop({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden bg-cream ${className}`}
    >
      <RiceFieldScene className="absolute inset-0 h-full w-full scale-105 opacity-60" />
      <div className="absolute inset-0 bg-cream/55" />
    </div>
  );
}
