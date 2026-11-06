import Image from 'next/image';
import Link from 'next/link';
import { BARANGAY, NAV_LINKS } from '@/lib/constants';
import { MapPinIcon, MailIcon, PhoneIcon, ArrowUpRightIcon } from '@/components/ui/icons';
import imapMark from '@/assets/illustrations/imap.svg';

const PORTAL_SERVICES = [
  { label: 'Announcements', href: '/#announcements' },
  { label: 'Request a document', href: '/dashboard/request' },
  { label: 'Calendar of activities', href: '/#announcements' },
  { label: 'Community map', href: '/#community' },
];

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden bg-earth text-cream">
      {/* golden rice-stitch divider */}
      <div aria-hidden="true" className="flex h-2 w-full">
        {Array.from({ length: 120 }, (_, index) => (
          <span
            key={index}
            className={`h-full flex-1 ${index % 3 === 0 ? 'bg-rice' : index % 3 === 1 ? 'bg-crop' : 'bg-earth'}`}
          />
        ))}
      </div>

      <div className="page-shell grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-[1.3fr_0.8fr_1fr_1.1fr]">
        <div>
          <Link href="/" className="flex items-center gap-3" aria-label="iMaporong home">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cream/25 bg-cream p-1.5">
              <Image
                src={imapMark}
                alt="iMaporong"
                className="h-full w-full object-contain"
              />
            </span>
            <span>
              <span className="block font-display text-xl font-extrabold tracking-tight text-cream">
                iMaporong
              </span>
              <span className="block text-[0.625rem] font-bold uppercase tracking-[0.18em] text-cream/60">
                Barangay community portal
              </span>
            </span>
          </Link>

          <p className="mt-5 max-w-xs font-display text-lg leading-snug text-cream">
            Rooted in community. Growing together.
          </p>
          <p className="mt-2 max-w-xs text-sm font-semibold leading-relaxed text-cream/65">
            Barangay services, updates, and shared life in one place.
          </p>

          <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-cream/20 bg-cream/5 px-3 py-1.5 text-xs font-semibold text-cream/75">
            <MapPinIcon className="h-4 w-4 text-rice" />
            {BARANGAY.municipality}, {BARANGAY.province}
          </p>
        </div>

        <div>
          <h2 className="text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-rice">
            Explore
          </h2>
          <ul className="mt-4 space-y-2.5">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm font-semibold text-cream/75 transition hover:text-rice"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-rice">
            Services
          </h2>
          <ul className="mt-4 space-y-2.5">
            {PORTAL_SERVICES.map((service) => (
              <li key={service.label}>
                <Link
                  href={service.href}
                  className="text-sm font-semibold text-cream/75 transition hover:text-rice"
                >
                  {service.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-rice">
            Barangay desk
          </h2>
          <ul className="mt-4 space-y-3 text-sm font-semibold text-cream/75">
            <li className="flex items-start gap-2.5">
              <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-rice" />
              <span>{BARANGAY.address}</span>
            </li>
            <li className="flex items-start gap-2.5">
              <MailIcon className="mt-0.5 h-4 w-4 shrink-0 text-rice" />
              <span>{BARANGAY.contactPlaceholder}</span>
            </li>
            <li className="flex items-start gap-2.5">
              <PhoneIcon className="mt-0.5 h-4 w-4 shrink-0 text-rice" />
              <span>Office hours to be confirmed by the barangay.</span>
            </li>
          </ul>

          <a
            href={BARANGAY.mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-cream underline decoration-rice/50 decoration-2 underline-offset-4 transition hover:text-rice"
          >
            Open in Maps
            <ArrowUpRightIcon className="h-4 w-4" />
          </a>
        </div>
      </div>

      <div className="border-t border-cream/15">
        <div className="page-shell flex flex-col gap-2 py-5 text-xs font-semibold text-cream/55 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Barangay Maporong. Community portal.</p>
          <p className="text-cream/70">Every seed has a beginning. Every harvest has a community.</p>
        </div>
      </div>
    </footer>
  );
}
