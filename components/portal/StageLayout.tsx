import type { ReactNode } from 'react';

import { PixelBackdrop } from './PixelBackdrop';

/**
 * The floating "stage" that holds every signed-in screen. It borrows the
 * friendliness of a learning-app dashboard — a big rounded panel lifted off a
 * soft illustrated background — without leaving the pixel-art village.
 */
export function StageLayout({
  children,
  className = '',
  contentClassName = '',
}: {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <div className={`relative min-h-[calc(100svh-72px)] overflow-hidden ${className}`}>
      <PixelBackdrop />
      <div className="relative z-10 mx-auto w-full max-w-[1220px] px-3 py-4 sm:px-5 sm:py-6">
        <div
          className={`rounded-[30px] border-2 border-earth/15 bg-cream/95 p-3 shadow-raised backdrop-blur-[2px] sm:p-5 ${contentClassName}`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
