import type { SVGProps } from 'react';

export type PixelIconName =
  | 'home'
  | 'request'
  | 'news'
  | 'id'
  | 'users'
  | 'calendar'
  | 'sprout'
  | 'rice'
  | 'house'
  | 'sun'
  | 'check'
  | 'alert'
  | 'heart'
  | 'map'
  | 'shield'
  | 'clock'
  | 'search'
  | 'edit'
  | 'trash'
  | 'plus'
  | 'upload'
  | 'print'
  | 'arrow'
  | 'close'
  | 'logout'
  | 'staff';

/**
 * Small hand-built pixel icons.
 *
 * Every icon is drawn on a 16 × 16 grid with `crispEdges`, so it stays sharp
 * at any size and inherits the surrounding text colour. Use `PixelIcon` for
 * section marks, task rows, shortcut cards, and empty states.
 */
export function PixelIcon({
  name,
  className = '',
  size = 24,
  ...props
}: { name: PixelIconName; size?: number } & Omit<SVGProps<SVGSVGElement>, 'name'>) {
  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      shapeRendering="crispEdges"
      aria-hidden="true"
      focusable="false"
      className={className}
      {...props}
    >
      {icons[name]}
    </svg>
  );
}

const icons: Record<PixelIconName, React.ReactNode> = {
  home: (
    <>
      <path d="M2 8h12v6H2z" fill="currentColor" opacity="0.22" />
      <path d="M8 2 1 8h3v6h8V8h3L8 2Z" fill="currentColor" />
      <path d="M6 9h4v5H6z" fill="var(--color-cream, #FAF6EB)" opacity="0.85" />
    </>
  ),
  request: (
    <>
      <path d="M3 1h7l3 3v11H3V1Z" fill="currentColor" opacity="0.25" />
      <path d="M3 1h7l3 3v11H3V1Z" fill="currentColor" />
      <path d="M10 1v3h3" fill="var(--color-cream, #FAF6EB)" opacity="0.8" />
      <path d="M5 6h6v1H5zm0 3h6v1H5zm0 3h4v1H5z" fill="var(--color-cream, #FAF6EB)" />
    </>
  ),
  news: (
    <>
      <path d="M4 3h8v8H4z" fill="currentColor" opacity="0.25" />
      <path d="M7 2h2v1h2v1h1v3h-1v1h-1v1H8v4H6v-4H5V8H4V5h1V4h2V2Z" fill="currentColor" />
      <path d="M7 12h2v2H7z" fill="currentColor" />
    </>
  ),
  id: (
    <>
      <path d="M1 3h14v10H1z" fill="currentColor" opacity="0.25" />
      <path d="M1 3h14v10H1V3Z" fill="currentColor" />
      <path d="M3 5h4v4H3z" fill="var(--color-cream, #FAF6EB)" opacity="0.9" />
      <path d="M8 6h5v1H8zm0 2h4v1H8z" fill="var(--color-cream, #FAF6EB)" />
      <path d="M4 11h8v1H4z" fill="var(--color-cream, #FAF6EB)" opacity="0.7" />
    </>
  ),
  users: (
    <>
      <path d="M2 6h3v3H2zM11 6h3v3h-3z" fill="currentColor" opacity="0.5" />
      <path d="M3 5h4v4H3zm6 0h4v4H9z" fill="currentColor" />
      <path d="M1 10h7v4H1zm7 0h7v4H8z" fill="currentColor" opacity="0.75" />
      <path d="M2 13h5v1H2zm7 0h5v1H9z" fill="currentColor" />
    </>
  ),
  calendar: (
    <>
      <path d="M2 4h12v10H2z" fill="currentColor" opacity="0.25" />
      <path d="M2 4h12v10H2V4Z" fill="currentColor" />
      <path d="M2 2h2v3H2zm10 0h2v3h-2z" fill="currentColor" />
      <path d="M4 7h2v2H4zm3 0h2v2H7zm3 0h2v2h-2zM4 10h2v2H4zm3 0h2v2H7z" fill="var(--color-cream, #FAF6EB)" />
    </>
  ),
  sprout: (
    <>
      <path d="M7 9h2v6H7z" fill="currentColor" />
      <path d="M8 9C8 6 5 5 2 5c0 3 3 5 6 4Zm0 0c0-2 2-4 6-4 0 3-3 5-6 4Z" fill="currentColor" opacity="0.8" />
      <path d="M4 13h8v1H4z" fill="currentColor" opacity="0.4" />
    </>
  ),
  rice: (
    <>
      <path d="M8 15V7" stroke="currentColor" strokeWidth="1.4" />
      <path d="M5 5h2v2H5zm4 0h2v2H9zM4 8h2v2H4zm6 0h2v2h-2zM5 11h2v2H5zm4 0h2v2H9z" fill="currentColor" />
      <path d="M8 2h2v2H8z" fill="currentColor" opacity="0.65" />
    </>
  ),
  house: (
    <>
      <path d="M2 7h12v8H2z" fill="currentColor" opacity="0.25" />
      <path d="M8 2 2 7l2 1v7h8V8l2-1L8 2Z" fill="currentColor" />
      <path d="M6 9h2v5H6z" fill="var(--color-cream, #FAF6EB)" opacity="0.85" />
      <path d="M9 9h2v2H9z" fill="var(--color-cream, #FAF6EB)" opacity="0.7" />
    </>
  ),
  sun: (
    <>
      <path d="M6 6h4v4H6z" fill="currentColor" />
      <path d="M7 2h2v2H7zm0 10h2v2H7zM2 7h2v2H2zm10 0h2v2h-2zM3 3h2v2H3zm8 0h2v2h-2zM3 11h2v2H3zm8 0h2v2h-2z" fill="currentColor" opacity="0.55" />
    </>
  ),
  check: (
    <>
      <path d="M2 2h12v12H2z" fill="currentColor" opacity="0.2" />
      <path d="M13 4 6 11 3 8l1-1 2 2 6-6 1 1Z" fill="currentColor" />
    </>
  ),
  alert: (
    <>
      <path d="M8 2 15 14H1L8 2Z" fill="currentColor" opacity="0.25" />
      <path d="M7 6h2v4H7zm0 5h2v2H7z" fill="currentColor" />
      <path d="M8 2 15 14H1L8 2Z" stroke="currentColor" strokeWidth="1" fill="none" />
    </>
  ),
  heart: (
    <>
      <path d="M2 5h2V3h4v2h1V3h4v2h1v5h-2v2h-2v2H8v-2H6v-2H4V8H2V5Z" fill="currentColor" opacity="0.25" />
      <path d="M2 6h2V4h3v2h2V4h3v2h2v4h-2v2h-2v2H8v-2H6v-2H4V8H2V6Z" fill="currentColor" />
    </>
  ),
  map: (
    <>
      <path d="M2 3h4l4 2 4-2v11l-4 2-4-2-4 2V3Z" fill="currentColor" opacity="0.25" />
      <path d="M8 2c2 0 4 2 4 4 0 3-4 8-4 8S4 9 4 6c0-2 2-4 4-4Z" fill="currentColor" />
      <path d="M7 5h2v2H7z" fill="var(--color-cream, #FAF6EB)" />
    </>
  ),
  shield: (
    <>
      <path d="M8 1 14 3v5c0 3-3 6-6 7-3-1-6-4-6-7V3l6-2Z" fill="currentColor" opacity="0.25" />
      <path d="M8 1 14 3v5c0 3-3 6-6 7-3-1-6-4-6-7V3l6-2Z" stroke="currentColor" strokeWidth="1.4" fill="none" />
      <path d="m5 8 2 2 4-4 1 1-5 5-3-3 1-1Z" fill="currentColor" />
    </>
  ),
  clock: (
    <>
      <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1Z" fill="currentColor" opacity="0.2" />
      <path d="M8 2h1v6h4v1H8V2Z" fill="currentColor" />
      <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1Z" stroke="currentColor" strokeWidth="1.2" fill="none" />
    </>
  ),
  search: (
    <>
      <path d="M7 2a5 5 0 1 0 0 10A5 5 0 0 0 7 2Z" fill="currentColor" opacity="0.2" />
      <path d="M3 3h6v2H3zm0 2h2v4H3zm2 4h4v2H5z" fill="currentColor" />
      <path d="M9 9h2v2H9zm2 2h2v2h-2zm2 2h2v2h-2z" fill="currentColor" />
    </>
  ),
  edit: (
    <>
      <path d="M2 12h3l8-8-2-2-8 8-1 2Z" fill="currentColor" opacity="0.25" />
      <path d="M10 2h2v2h2v2l-2 2-4-4 2-2Zm-1 3 4 4-7 7H2v-4l7-7Z" fill="currentColor" />
    </>
  ),
  trash: (
    <>
      <path d="M3 4h10v11H3z" fill="currentColor" opacity="0.25" />
      <path d="M2 3h12v2H2zM6 1h4v2H6zM4 5h8v10H4V5Z" fill="currentColor" />
      <path d="M6 7h1v6H6zm3 0h1v6H9z" fill="var(--color-cream, #FAF6EB)" />
    </>
  ),
  plus: (
    <>
      <path d="M6 2h4v4h4v4h-4v4H6V10H2V6h4V2Z" fill="currentColor" />
    </>
  ),
  upload: (
    <>
      <path d="M2 11h12v3H2z" fill="currentColor" opacity="0.3" />
      <path d="M7 2h2v7h3l-4 4-4-4h3V2Z" fill="currentColor" />
      <path d="M2 12h12v2H2z" fill="currentColor" />
    </>
  ),
  print: (
    <>
      <path d="M4 2h8v4H4z" fill="currentColor" />
      <path d="M2 6h12v6h-3v3H5v-3H2V6Z" fill="currentColor" opacity="0.7" />
      <path d="M5 9h6v5H5z" fill="var(--color-cream, #FAF6EB)" />
      <path d="M4 7h2v2H4z" fill="var(--color-cream, #FAF6EB)" />
    </>
  ),
  arrow: (
    <>
      <path d="M2 7h8V4l4 4-4 4V9H2V7Z" fill="currentColor" />
    </>
  ),
  close: (
    <>
      <path d="m3 2 5 5 5-5 1 1-5 5 5 5-1 1-5-5-5 5-1-1 5-5-5-5 1-1Z" fill="currentColor" />
    </>
  ),
  logout: (
    <>
      <path d="M2 2h7v12H2V2Z" fill="currentColor" opacity="0.25" />
      <path d="M2 2h7v12H2V2Z" stroke="currentColor" strokeWidth="1.2" fill="none" />
      <path d="M9 7h5v2H9z" fill="currentColor" />
      <path d="M11 5h2v2h2v2h-2v2h-2V5Z" fill="currentColor" />
    </>
  ),
  staff: (
    <>
      <path d="M2 4h12v9H2z" fill="currentColor" opacity="0.25" />
      <path d="M2 4h12v9H2V4Z" stroke="currentColor" strokeWidth="1.2" fill="none" />
      <path d="M4 6h3v3H4zm5 0h3v1H9zm0 3h3v1H9z" fill="currentColor" />
      <path d="M6 12h4v1H6z" fill="currentColor" opacity="0.6" />
    </>
  ),
};

/** Larger decorative pixel vignettes used in empty states and card corners. */
export function PixelSproutVignette({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 48"
      shapeRendering="crispEdges"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <rect x="4" y="40" width="56" height="4" fill="#354638" opacity="0.2" />
      <rect x="14" y="30" width="36" height="10" fill="#8A5A36" />
      <rect x="18" y="26" width="28" height="4" fill="#6B4426" />
      <rect x="30" y="14" width="4" height="14" fill="#386B48" />
      <rect x="20" y="14" width="10" height="4" fill="#8DAF72" />
      <rect x="16" y="18" width="14" height="4" fill="#386B48" />
      <rect x="34" y="10" width="10" height="4" fill="#8DAF72" />
      <rect x="40" y="14" width="4" height="4" fill="#386B48" />
      <rect x="30" y="4" width="4" height="6" fill="#E5B84D" />
      <rect x="26" y="8" width="4" height="4" fill="#E5B84D" />
      <rect x="34" y="8" width="4" height="4" fill="#E5B84D" />
      <rect x="10" y="34" width="4" height="4" fill="#EEDCB5" />
      <rect x="50" y="34" width="4" height="4" fill="#EEDCB5" />
    </svg>
  );
}

export function PixelCottage({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 48"
      shapeRendering="crispEdges"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <rect x="4" y="40" width="56" height="4" fill="#8DAF72" />
      <rect x="18" y="34" width="30" height="10" fill="#EEDCB5" />
      <path d="M14 22h38v4H14zm4-4h30v4H18z" fill="#A9743F" />
      <rect x="16" y="26" width="34" height="4" fill="#8C5C33" />
      <rect x="28" y="34" width="8" height="10" fill="#6B4426" />
      <rect x="40" y="30" width="6" height="6" fill="#E5B84D" />
      <rect x="46" y="30" width="4" height="4" fill="#FAF6EB" opacity="0.7" />
      <rect x="10" y="18" width="4" height="20" fill="#6B4426" />
      <rect x="4" y="14" width="14" height="4" fill="#386B48" />
      <rect x="8" y="10" width="8" height="4" fill="#8DAF72" />
    </svg>
  );
}
