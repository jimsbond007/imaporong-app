'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { NAV_LINKS } from '@/lib/constants';
import { buttonClasses } from '@/components/ui/Button';
import { CloseIcon, MenuIcon } from '@/components/ui/icons';
import imapMark from '@/assets/illustrations/imap.svg';

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) setOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-colors duration-300 ${
        scrolled || open
          ? 'border-b-2 border-line/80 bg-cream/90 backdrop-blur-md'
          : 'border-b-2 border-transparent bg-[#c3e9f5]'
      }`}
    >
      <div className="page-shell relative z-10 flex h-[72px] items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3" aria-label="iMaporong home">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl border-2 border-earth/15 bg-cream p-1 shadow-subtle">
            <Image
              src={imapMark}
              alt="iMaporong"
              preload
              className="h-full w-full object-contain"
            />
          </span>
          <span className="leading-tight">
            <span className="block font-display text-lg font-extrabold tracking-tight text-forest">
              iMaporong
            </span>
            <span className="block text-[0.625rem] font-bold uppercase tracking-[0.18em] text-forest/65">
              Barangay Maporong
            </span>
          </span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-xl px-4 py-2 text-sm font-bold text-forest/75 transition hover:bg-white/60 hover:text-pine"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <Link
            href="/auth"
            className={`${buttonClasses('ghost', 'md')} text-forest hover:bg-white/60`}
          >
            Sign In
          </Link>
          <Link href="/auth?mode=register" className={buttonClasses('primary', 'md')}>
            Join the Community
          </Link>
        </div>

        <button
          type="button"
          className="rounded-xl border-2 border-earth/15 bg-cream/80 p-2.5 text-forest transition hover:bg-cream lg:hidden"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <CloseIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div id="mobile-menu" className="animate-fade-in border-t-2 border-line/80 bg-cream lg:hidden">
          <nav aria-label="Mobile" className="page-shell flex flex-col gap-1 py-4">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-4 py-3 text-sm font-bold text-forest transition hover:bg-mist"
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-2 grid grid-cols-2 gap-2 border-t-2 border-line/80 pt-4">
              <Link
                href="/auth"
                onClick={() => setOpen(false)}
                className={buttonClasses('secondary', 'md')}
              >
                Sign In
              </Link>
              <Link
                href="/auth?mode=register"
                onClick={() => setOpen(false)}
                className={buttonClasses('primary', 'md')}
              >
                Join
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
