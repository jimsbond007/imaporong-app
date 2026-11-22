'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import {
  BellIcon,
  CalendarIcon,
  ClipboardIcon,
  MapPinIcon,
} from '@/components/ui/icons';

const SHOWCASE = [
  {
    title: 'Announcements',
    outline: 'border-[#8fbf86]',
    shadowFocus: 'shadow-[7px_7px_0_0_rgba(143,191,134,0.8)]',
    shadowSide: 'shadow-[5px_5px_0_0_rgba(143,191,134,0.7)]',
    photo: '/services/announcements.jpg',
    alt: 'Community noticeboard with pinned announcements',
    description: 'News, advisories, and reminders from the barangay desk.',
    action: 'View updates',
    href: '/#announcements',
    Icon: BellIcon,
    surface: 'from-[#d3e8c4] via-[#bcd9a6] to-[#8fbf86]',
    badge: 'bg-white/70 text-pine',
  },
  {
    title: 'Request a Document',
    outline: 'border-[#e8c97a]',
    shadowFocus: 'shadow-[7px_7px_0_0_rgba(232,201,122,0.85)]',
    shadowSide: 'shadow-[5px_5px_0_0_rgba(232,201,122,0.75)]',
    photo: '/services/request-document.jpg',
    alt: 'Hands passing a document across a desk',
    description: 'Clearances, certificates, and resident ID — online.',
    action: 'Start a request',
    href: '/dashboard/request',
    Icon: ClipboardIcon,
    surface: 'from-[#fdf3da] via-[#f6e3b4] to-[#e8c97a]',
    badge: 'bg-white/70 text-[#8a6116]',
  },
  {
    title: 'Calendar of Activities',
    outline: 'border-[#9fd1e8]',
    shadowFocus: 'shadow-[7px_7px_0_0_rgba(159,209,232,0.9)]',
    shadowSide: 'shadow-[5px_5px_0_0_rgba(159,209,232,0.8)]',
    photo: '/services/calendar.jpg',
    alt: 'Coloured pins marking dates on a wall calendar',
    description: 'Assemblies, clean-ups, and events worth showing up for.',
    action: 'See schedule',
    href: '/#announcements',
    Icon: CalendarIcon,
    surface: 'from-[#eaf6fb] via-sky to-[#9fd1e8]',
    badge: 'bg-white/70 text-[#3a6478]',
  },
  {
    title: 'Community Map',
    outline: 'border-[#8daf72]',
    shadowFocus: 'shadow-[7px_7px_0_0_rgba(141,175,114,0.85)]',
    shadowSide: 'shadow-[5px_5px_0_0_rgba(141,175,114,0.75)]',
    photo: '/services/community-map.jpg',
    alt: 'Satellite map of Barangay Maporong with the barangay hall',
    description: 'Find the barangay hall and the places around it.',
    action: 'Open the map',
    href: '/#community',
    Icon: MapPinIcon,
    surface: 'from-[#e4efd6] via-[#bcd7a6] to-[#8daf72]',
    badge: 'bg-white/70 text-pine',
  },
];

// Layout of the cards around the focused one, measured at full size.
// Index = distance from the focused card (0, 1, 2, 3...). Between two
// distances every value is blended, so cards glide smoothly from one spot
// to the next, both while dragging and when they settle.
const CARD_W = 290;
const CARD_H = 410;
const X = [0, 273, 491, 640];
const SCALE = [1, 0.8, 0.62, 0.5];
const TILT = [0, 14, 22, 28];
const BASE_OPACITY = [1, 0.95, 0.85, 0.7];

function blend(table: number[], distance: number) {
  const d = Math.min(Math.abs(distance), table.length - 1);
  const low = Math.floor(d);
  const high = Math.min(low + 1, table.length - 1);
  return table[low] + (table[high] - table[low]) * (d - low);
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const wrap = (value: number, size: number) => ((value % size) + size) % size;

export function ServiceShowcase() {
  const total = SHOWCASE.length;
  // Unbounded position of the focused card. Card number = index mod total.
  const [index, setIndex] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [width, setWidth] = useState(1280);
  const [ready, setReady] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const startX = useRef<number | null>(null);
  const didDrag = useRef(false);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const measure = () => setWidth(stage.clientWidth);
    measure();
    setReady(true);
    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  // How many cards fit on each side at this width: 2 on desktop, 1 on tablet,
  // none on phones (the focused card is shown on its own).
  const reach = width >= 1170 ? 2 : width >= 800 ? 1 : 0;
  const fit = width < 800 ? Math.min(1, (width * 0.74) / CARD_W) : 1;
  const step = X[1] * fit;

  const move = (delta: number) => setIndex((value) => value + delta);
  const position = index - dragX / step;
  const current = SHOWCASE[wrap(index, total)];

  const cards = [];
  for (let v = index - 3; v <= index + 3; v += 1) {
    const offset = v - position;
    const distance = Math.abs(offset);
    const direction = offset < 0 ? -1 : 1;
    const item = SHOWCASE[wrap(v, total)];
    const Icon = item.Icon;
    const isFocused = v === index;

    const x = direction * blend(X, offset) * fit;
    const scale = blend(SCALE, offset) * fit;
    const tilt = -direction * blend(TILT, offset);
    const opacity = clamp(reach + 1 - distance, 0, 1) * blend(BASE_OPACITY, offset);
    const textOpacity = clamp(2 - distance, 0, 1);
    const visible = opacity > 0.01;

    const frame = `relative flex h-full w-full flex-col overflow-hidden rounded-[26px] border-[3px] ${item.outline} bg-gradient-to-b p-4 text-left ${item.shadowFocus} ${item.surface}`;

    const face = (
      <>
        <Image
          src={item.photo}
          alt=""
          fill
          sizes="290px"
          className="object-cover"
          draggable={false}
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-forest/85 via-forest/15 to-transparent"
        />
        <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-white/70 bg-white/85 text-pine shadow-subtle">
          <Icon className="h-6 w-6" />
        </span>
        <span className="relative mt-auto text-left">
          <span className="block text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-white/75">
            0{wrap(v, total) + 1} / 0{total}
          </span>
          <span className="mt-1 block font-display text-xl font-bold leading-tight text-white">
            {item.title}
          </span>
          <span
            className="mt-1.5 block text-sm font-semibold leading-snug text-white/85"
            style={{ opacity: textOpacity }}
          >
            {item.description}
          </span>
        </span>
      </>
    );

    cards.push(
      <div
        key={v}
        className="absolute left-1/2 top-1/2"
        style={{
          width: CARD_W,
          height: CARD_H,
          marginLeft: -CARD_W / 2,
          marginTop: -CARD_H / 2,
          transform: `translateX(${x}px) rotateY(${tilt}deg) scale(${scale})`,
          opacity,
          zIndex: 10 - Math.round(distance),
          pointerEvents: visible ? 'auto' : 'none',
          transition:
            dragging || !ready
              ? 'none'
              : 'transform 500ms cubic-bezier(0.22, 1, 0.36, 1), opacity 500ms ease',
        }}
        aria-hidden={isFocused ? undefined : true}
      >
        {isFocused ? (
          <Link
            href={item.href}
            draggable={false}
            className={`${frame} transition-[translate] hover:-translate-y-1`}
            aria-label={`${item.title} — ${item.action}`}
          >
            {face}
          </Link>
        ) : (
          <button
            type="button"
            draggable={false}
            tabIndex={-1}
            onClick={() => setIndex(v)}
            className={`${frame} saturate-[0.9] transition hover:saturate-100`}
          >
            {face}
          </button>
        )}
      </div>,
    );
  }

  return (
    <div
      className="mt-10"
      role="region"
      aria-roledescription="carousel"
      aria-label="Barangay services"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'ArrowLeft') move(-1);
        if (event.key === 'ArrowRight') move(1);
      }}
    >
      <p className="sr-only" aria-live="polite">
        {current.title}. {current.description}
      </p>

      {/* Stage: drag or swipe, and the cards slide into each other's place */}
      <div
        ref={stageRef}
        className={`relative mx-auto h-[440px] w-full touch-pan-y select-none [perspective:1400px] ${
          dragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        onPointerDown={(event) => {
          startX.current = event.clientX;
          didDrag.current = false;
        }}
        onPointerMove={(event) => {
          if (startX.current === null) return;
          const delta = event.clientX - startX.current;
          if (!didDrag.current && Math.abs(delta) > 8) {
            didDrag.current = true;
            setDragging(true);
            event.currentTarget.setPointerCapture(event.pointerId);
          }
          if (didDrag.current) setDragX(delta);
        }}
        onPointerUp={(event) => {
          if (startX.current === null) return;
          const delta = event.clientX - startX.current;
          startX.current = null;
          if (didDrag.current) event.currentTarget.releasePointerCapture(event.pointerId);
          setDragging(false);
          setDragX(0);
          // Drag far enough (or flick) and the next card takes the centre.
          const steps = Math.round(-delta / step);
          if (steps !== 0) move(steps);
          else if (Math.abs(delta) > 60) move(delta < 0 ? 1 : -1);
        }}
        onPointerCancel={() => {
          startX.current = null;
          setDragging(false);
          setDragX(0);
        }}
        onClickCapture={(event) => {
          // A drag should not also open a link or re-centre a card.
          if (didDrag.current) {
            event.preventDefault();
            event.stopPropagation();
            didDrag.current = false;
          }
        }}
        onDragStart={(event) => event.preventDefault()}
      >
        {cards}
      </div>
    </div>
  );
}
