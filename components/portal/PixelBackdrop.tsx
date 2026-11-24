import { RiceFieldScene } from '@/components/landing/RiceFieldScene';

/**
 * The countryside behind every signed-in screen.
 *
 * It is pinned to the viewport (not stretched over the whole page), so the
 * pixel art keeps the same crisp size however long the page is, and it stays
 * put while the content scrolls. The scene sits along the bottom edge and
 * fades into a soft sky gradient above it; both follow the light/dark theme.
 */
export function PixelBackdrop({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`portal-sky pointer-events-none fixed inset-0 z-0 overflow-hidden ${className}`}
    >
      <RiceFieldScene className="scene-art portal-scene absolute inset-x-0 bottom-0 h-[58vh] min-h-[320px] w-full" />
    </div>
  );
}
