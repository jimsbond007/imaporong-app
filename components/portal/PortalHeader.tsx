'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { buttonClasses } from '@/components/ui/Button';
import imapMark from '@/assets/illustrations/imap.svg';
import {
  BellIcon,
  ClipboardIcon,
  HomeIcon,
  IdCardIcon,
  LogOutIcon,
  ShieldCheckIcon,
} from '@/components/ui/icons';

export type PortalSection = 'overview' | 'request' | 'announcements' | 'id' | 'admin';

export function PortalHeader({
  name,
  role,
  isVerified,
  active,
  onOpenId,
}: {
  name: string;
  role: string;
  isVerified: boolean;
  active: PortalSection;
  onOpenId?: () => void;
}) {
  const router = useRouter();
  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'R';

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace('/auth');
    router.refresh();
  };

  const linkClass = (key: PortalSection) =>
    `flex min-w-[92px] flex-col items-center justify-center gap-1 whitespace-nowrap rounded-xl px-3 py-2 text-xs font-bold transition ${
      active === key
        ? 'bg-mint text-pine'
        : 'text-muted hover:bg-mist hover:text-forest'
    }`;

  const mainLinks = [
    { key: 'overview' as const, href: '/dashboard', label: 'Overview', icon: HomeIcon },
    {
      key: 'request' as const,
      href: '/dashboard/request',
      label: 'Request a document',
      shortLabel: 'Request',
      icon: ClipboardIcon,
    },
    {
      key: 'announcements' as const,
      href: '/dashboard/announcements',
      label: 'Announcements',
      shortLabel: 'News',
      icon: BellIcon,
    },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 border-b-2 border-line bg-white">
        <div className="page-shell relative z-10 flex h-[68px] items-center justify-between gap-3">
          <Link href="/dashboard" className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line bg-mist p-1">
              <Image
                src={imapMark}
                alt="iMaporong"
                priority
                className="h-full w-full object-contain"
              />
            </span>
            <span className="min-w-0 leading-tight">
              <span className="block truncate font-display text-base font-extrabold tracking-tight text-forest">
                iMaporong
              </span>
              <span className="block text-[0.625rem] font-bold uppercase tracking-[0.14em] text-muted">
                Resident portal
              </span>
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <span
              className="hidden items-center gap-1.5 rounded-full border border-line bg-subtle px-2.5 py-1.5 text-[0.6875rem] font-bold text-muted sm:inline-flex"
              title={isVerified ? 'Verified resident' : 'Verification pending'}
            >
              <ShieldCheckIcon
                className={`h-3.5 w-3.5 ${isVerified ? 'text-pine' : 'text-[#8a6116]'}`}
              />
              {isVerified ? 'Verified' : 'Pending verification'}
            </span>

            <div className="flex items-center gap-2 rounded-full border border-line bg-white py-1 pl-1 pr-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-pine text-xs font-extrabold text-white">
                {initials}
              </span>
              <span className="hidden max-w-[130px] truncate text-xs font-bold text-forest md:block">
                {name}
              </span>
            </div>

            <button
              type="button"
              onClick={handleSignOut}
              aria-label="Sign out"
              className={buttonClasses('dangerQuiet', 'sm')}
            >
              <LogOutIcon className="h-4 w-4" />
              <span>Sign out</span>
            </button>
          </div>
        </div>

        {/* Desktop / tablet navigation */}
        <nav
          aria-label="Resident portal"
          className="page-shell no-scrollbar relative z-10 hidden gap-1 overflow-x-auto pb-2.5 md:flex"
        >
          {mainLinks.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.key}
                href={item.href}
                aria-current={active === item.key ? 'page' : undefined}
                className={linkClass(item.key)}
              >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
              </Link>
            );
          })}

          {onOpenId ? (
            <button
              type="button"
              onClick={onOpenId}
              aria-current={active === 'id' ? 'page' : undefined}
              className={linkClass('id')}
            >
              <IdCardIcon className="h-5 w-5" />
              <span>My ID</span>
            </button>
          ) : (
            <Link
              href="/dashboard#my-id"
              aria-current={active === 'id' ? 'page' : undefined}
              className={linkClass('id')}
            >
              <IdCardIcon className="h-5 w-5" />
              <span>My ID</span>
            </Link>
          )}

          {role === 'admin' && (
            <Link
              href="/admin"
              aria-current={active === 'admin' ? 'page' : undefined}
              className={`${linkClass('admin')} ml-auto`}
            >
              <ShieldCheckIcon className="h-5 w-5" />
              <span>Staff workspace</span>
            </Link>
          )}
        </nav>
      </header>

      {/* Mobile navigation: one compact bar instead of a row of buttons */}
      <nav
        aria-label="Resident portal quick navigation"
        className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-line bg-white pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        <div
          className={`mx-auto grid max-w-lg ${
            role === 'admin' ? 'grid-cols-5' : 'grid-cols-4'
          }`}
        >
          {mainLinks.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.key;
            return (
              <Link
                key={item.key}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={`flex min-h-[58px] flex-col items-center justify-center gap-0.5 px-1 pb-1.5 pt-2 text-[0.625rem] font-bold transition ${
                  isActive ? 'text-pine' : 'text-muted hover:text-forest'
                }`}
              >
                <span
                  className={`flex h-7 w-11 items-center justify-center rounded-full transition ${
                    isActive ? 'bg-mint' : 'bg-transparent'
                  }`}
                >
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                {item.shortLabel ?? item.label}
              </Link>
            );
          })}

          {onOpenId ? (
            <button
              type="button"
              onClick={onOpenId}
              aria-current={active === 'id' ? 'page' : undefined}
              className={`flex min-h-[58px] flex-col items-center justify-center gap-0.5 px-1 pb-1.5 pt-2 text-[0.625rem] font-bold transition ${
                active === 'id' ? 'text-pine' : 'text-muted hover:text-forest'
              }`}
            >
              <span
                className={`flex h-7 w-11 items-center justify-center rounded-full transition ${
                  active === 'id' ? 'bg-mint' : 'bg-transparent'
                }`}
              >
                <IdCardIcon className="h-[18px] w-[18px]" />
              </span>
              My ID
            </button>
          ) : (
            <Link
              href="/dashboard#my-id"
              aria-current={active === 'id' ? 'page' : undefined}
              className={`flex min-h-[58px] flex-col items-center justify-center gap-0.5 px-1 pb-1.5 pt-2 text-[0.625rem] font-bold transition ${
                active === 'id' ? 'text-pine' : 'text-muted hover:text-forest'
              }`}
            >
              <span
                className={`flex h-7 w-11 items-center justify-center rounded-full transition ${
                  active === 'id' ? 'bg-mint' : 'bg-transparent'
                }`}
              >
                <IdCardIcon className="h-[18px] w-[18px]" />
              </span>
              My ID
            </Link>
          )}

          {role === 'admin' && (
            <Link
              href="/admin"
              aria-current={active === 'admin' ? 'page' : undefined}
              className={`flex min-h-[58px] flex-col items-center justify-center gap-0.5 px-1 pb-1.5 pt-2 text-[0.625rem] font-bold transition ${
                active === 'admin' ? 'text-pine' : 'text-muted hover:text-forest'
              }`}
            >
              <span
                className={`flex h-7 w-11 items-center justify-center rounded-full transition ${
                  active === 'admin' ? 'bg-mint' : 'bg-transparent'
                }`}
              >
                <ShieldCheckIcon className="h-[18px] w-[18px]" />
              </span>
              Staff
            </Link>
          )}
        </div>
      </nav>
    </>
  );
}
