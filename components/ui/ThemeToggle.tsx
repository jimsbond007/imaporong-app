'use client';

import { useSyncExternalStore } from 'react';
import { MoonIcon, SunIcon } from '@/components/ui/icons';

export const THEME_STORAGE_KEY = 'imaporong-theme';
const THEME_EVENT = 'imaporong-theme-change';

type Theme = 'light' | 'dark';

function subscribe(onChange: () => void) {
  window.addEventListener(THEME_EVENT, onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener(THEME_EVENT, onChange);
    window.removeEventListener('storage', onChange);
  };
}

// The inline script in app/layout.tsx sets data-theme before first paint,
// so the DOM attribute is the single source of truth.
function getSnapshot(): Theme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

function getServerSnapshot(): Theme {
  return 'light';
}

function applyTheme(next: Theme) {
  const root = document.documentElement;
  root.classList.add('theme-fade');
  root.dataset.theme = next;
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, next);
  } catch {
    // Private mode / blocked storage: the theme still changes for this visit.
  }
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', next === 'dark' ? '#0F1613' : '#386B48');
  window.dispatchEvent(new Event(THEME_EVENT));
  window.setTimeout(() => root.classList.remove('theme-fade'), 300);
}

/**
 * Sun / moon button that switches between the light and dark theme.
 * Both icons are always rendered and swapped with CSS, so there is no icon
 * flash on load even when the saved theme differs from the server render.
 */
export function ThemeToggle({ className = '' }: { className?: string }) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return (
    <button
      type="button"
      onClick={() => applyTheme(getSnapshot() === 'dark' ? 'light' : 'dark')}
      aria-pressed={theme === 'dark'}
      aria-label="Dark mode"
      title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      className={`relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-line bg-surface/80 text-forest shadow-subtle transition hover:border-leaf hover:bg-mist active:translate-x-[2px] active:translate-y-[2px] ${className}`}
    >
      <SunIcon className="h-5 w-5 dark:hidden" />
      <MoonIcon className="hidden h-5 w-5 dark:block" />
    </button>
  );
}
