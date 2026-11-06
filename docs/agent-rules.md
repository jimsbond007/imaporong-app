# CLAUDE.md — iMaporong Engineering & Design Rules

**Canonical repository:** `C:\Users\PRINCESS GRACE\Documents\imaporong-redesign`
**Snapshot taken:** 2026-11-06
**Figma file:** [iMaporong — Barangay Community Portal](https://www.figma.com/design/BNQeLHl5EkoV5vtuKI7ija) · key `BNQeLHl5EkoV5vtuKI7ija`
**Figma MCP:** connected and authenticated at snapshot time (handle `James`)

> This file was produced in `C:\Users\PRINCESS GRACE\Downloads\figmaimap`, which is empty.
> All paths below are relative to the canonical repo unless written in full.

---

## 0. Read this first

### 0.1 Precedence when sources disagree

1. **Live Supabase schema, policies, and data** — the real security and data boundary.
2. **`app/globals.css` and the component source** — the real implemented design system.
3. **This file** — engineering and design rules.
4. **`docs/design-system.md`** — useful intent, but currently stale in several places (see §2.3).
5. **The redesign master prompt** — creative direction only; it describes a different palette and font from what is implemented.

Never silently “fix” a conflict. If code and documentation disagree, stop, state the conflict, and ask which one is authoritative before changing behaviour.

### 0.2 Repository state at snapshot time

The redesign is **uncommitted work in progress**:

```text
 M README.md
 M app/admin/page.tsx
 M app/auth/page.tsx
 M app/dashboard/page.tsx
 M app/dashboard/request/page.tsx
 M app/globals.css
 M app/layout.tsx
 M app/my-id/page.tsx
 M app/page.tsx
 M app/register/page.tsx
 M components/FeedbackModal.tsx
 M lib/supabase.ts
 M next.config.ts
 M package-lock.json
 M package.json
?? app/admin/layout.tsx
?? app/auth/AuthForm.tsx
?? app/dashboard/DashboardClient.tsx
?? app/dashboard/announcements/
?? app/dashboard/layout.tsx
?? architecture.pdf
?? assets/
?? components/AnnouncementCard.tsx
?? components/SiteFooter.tsx
?? components/SiteHeader.tsx
?? components/landing/
?? components/portal/
?? components/ui/
?? data-flow-diagram.pdf
?? docs/
?? lib/auth.ts
?? lib/constants.ts
?? lib/data/
?? lib/supabase/
?? lib/types.ts
?? proxy.ts
?? supabase/migrations/20261105120000_security_hardening_and_announcements.sql
```

Rules:

- **Do not reset, stash, clean, or checkout** any of these files. The working tree is the product.
- Do not delete “unused” files. Several are new design-system pieces not yet committed.
- Read a file immediately before editing it. The owner edits the project live.
- Do not run `git clean -fd`, `git checkout -- .`, or broad formatting rewrites.

### 0.3 Next.js version warning

`AGENTS.md` is authoritative:

> This is **not** the Next.js you know. Read the relevant guide in `node_modules/next/dist/docs/` before writing code.

The project uses **Next.js 16.4.3** with the App Router, async `params` / `searchParams`, async `cookies()`, and `proxy.ts` instead of `middleware.ts`. Do not apply older Next.js patterns from memory.

`next.config.ts` pins the Turbopack root to the repo because a parent folder has its own `package-lock.json`:

```ts
// next.config.ts
const nextConfig: NextConfig = {
  turbopack: { root: process.cwd() },
};
```

---

## 1. Product snapshot

iMaporong is the online front desk of **Barangay Maporong, Oas, Albay**. Three surfaces:

| Surface | routes | Audience |
| --- | --- | --- |
| Public landing | `/` | Anyone |
| Resident portal | `/dashboard`, `/dashboard/request`, `/dashboard/announcements` | `resident` and `admin` |
| Staff workspace | `/admin` | `admin` only |

The system supports exactly **five real document services**:

1. Barangay Clearance
2. Certificate of Indigency
3. Residency Certificate
4. Barangay ID Card
5. Business Clearance

Do not add a sixth service, and do not present “Document Requests” or “Community Assistance” as services — they are concepts, not rows the system can process.

---

## 2. Non-negotiable rules

### 2.1 Data and security

- **NEVER** expose a Supabase service-role key in client code, logs, screenshots, or docs. Only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` belong in `.env.local`.
- **NEVER** bypass RLS to make a feature work. If a policy blocks a legitimate action, explain the policy and request approval before changing it.
- **NEVER** introduce an `is_admin` column. Roles live in `profiles.role` with values `admin` and `resident`.
- **NEVER** fabricate residents, statistics, announcements, contact numbers, office hours, addresses, BID numbers, or official copy.
- **NEVER** ship a button that only changes local UI state while pretending to save. Every administrative action must write to Supabase and surface the real error.
- **ALWAYS** enforce authorisation server-side (`proxy.ts` + server layouts + RLS), not only by hiding UI.
- **ALWAYS** preserve existing accounts, profiles, requests, and relationships.

### 2.2 Design system

- Use the **current** token names and values in `app/globals.css` (§5). Do not invent new colour names.
- Use the shared components before writing new markup (§8).
- Prefer **tokens** (`bg-mist`, `text-pine`, `border-line`, `shadow-card`) over raw hex. Documented hex exceptions are listed in §5.5.
- One primary action per view. No two primary buttons side by side.
- Use **2px borders + hard offset shadows + 12px button corners** (the current pixel-language). Do not reintroduce soft blurred shadows or pill buttons.
- Do not add a dark mode. `color-scheme: light only` is intentional.

### 2.3 Documentation drift you must know about

`docs/design-system.md` still describes the **pre-pixel** visual language:

| Topic | `docs/design-system.md` | Current code (authoritative) |
| --- | --- | --- |
| Display font | Nunito Sans | **Pixelify Sans** (`--font-pixel-sans`) |
| Display weights | 600–800 | 400–700 |
| Shadows | soft blurred (`0 8px 24px …`) | **hard offset, no blur** (`5px 5px 0 0 …`) |
| Button geometry | 12px (`rounded-xl`) in text, but “pill” wording elsewhere | **12px every button**; pills only for badges/avatars/mobile indicator |
| Icon stroke | 1.8px | **1.7px** |
| Borders | 1px mostly | **2px** on cards, panels, inputs, header rules |
| Fonts section | “Nunito Sans / Lato” | **Pixelify Sans / Lato** |

If you update the design language, update **both** `app/globals.css` and `docs/design-system.md` in the same change. Until then, trust the code.

---

## 3. Stack and build system

### 3.1 Installed versions

| Package | Version |
| --- | --- |
| `next` | 16.4.3 |
| `react` / `react-dom` | 19.2.4 |
| `tailwindcss` | 4.2.4 |
| `@tailwindcss/postcss` | v4 |
| `@supabase/supabase-js` | 2.119.0 |
| `@supabase/ssr` | 0.12.7 |
| `html-to-image` | 1.11.13 |
| `typescript` | 5.x, `strict: true` |
| `eslint` + `eslint-config-next` | 9 / 16.2.4 |

### 3.2 What is deliberately **not** installed

Do **not** add these without an explicit request and a stated reason:

- Lucide / Heroicons / any icon pack — icons are hand-built in `components/ui/icons.tsx`.
- Framer Motion / Motion — animation is CSS keyframes.
- Storybook — component docs live in `docs/design-system.md`.
- Jest / Vitest / Playwright — no automated test runner is configured.
- `clsx`, `tailwind-merge`, `cva` — class composition is template strings.
- A component library (shadcn, Radix, MUI, Chakra).
- A remote image CDN — illustrations are local static assets.

### 3.3 Scripts

```bash
npm run dev     # next dev (Turbopack)
npm run build   # next build
npm start       # next start
npm run lint    # eslint .
```

Type-check directly:

```bash
npx tsc --noEmit
```

### 3.4 Configuration files

| File | Purpose | Notes |
| --- | --- | --- |
| `package.json` | deps + scripts | name is `maporong-app` |
| `tsconfig.json` | strict TS, `@/*` → repo root | `strict: true` |
| `next.config.ts` | Turbopack root pin | do not remove |
| `postcss.config.mjs` | `@tailwindcss/postcss` | no `tailwind.config.js` |
| `eslint.config.mjs` | `next/core-web-vitals` + `next/typescript` | flat config |
| `proxy.ts` | Next 16 proxy (former middleware) | session refresh + anon redirects |
| `app/globals.css` | tokens, base, components, motion, print | source of truth |

There is **no `tailwind.config.js`**. Tailwind v4 is configured entirely through `@theme` in `app/globals.css`.

---

## 4. Repository structure

```text
app/
  layout.tsx                  fonts, metadata, viewport, global shell
  globals.css                 design tokens + component classes + motion + print
  page.tsx                    public landing page (server component)
  auth/
    page.tsx                  auth route shell
    AuthForm.tsx              login/register client form
  dashboard/
    layout.tsx                requireResident guard
    page.tsx                  resident overview (server)
    DashboardClient.tsx       profile, ID card, history, download/print
    request/page.tsx          five-service request form
    announcements/page.tsx    resident noticeboard + category filters
  admin/
    layout.tsx                requireAdmin guard
    page.tsx                  staff workspace (residents/requests/calendar/announcements)
  register/page.tsx           permanent redirect → /auth?mode=register
  my-id/page.tsx              permanent redirect → /dashboard

components/
  SiteHeader.tsx              public sticky nav
  SiteFooter.tsx              public footer
  AnnouncementCard.tsx        reusable announcement card
  FeedbackModal.tsx           success/error/info dialog
  RequestSlip.tsx             printable/downloadable request slip
  landing/
    ServiceSearch.tsx         keyboard-accessible service search
    ServiceCarousel.tsx       snap-scroll service cards
  portal/
    PortalHeader.tsx          resident desktop tabs + mobile bottom bar
    PageHeader.tsx            shared illustrated page header
  ui/
    Button.tsx                Button / ButtonLink / buttonClasses
    Badge.tsx                 StatusBadge / Badge
    Modal.tsx                 accessible dialog shell
    EmptyState.tsx            empty-state pattern
    ServiceIcon.tsx           service-type → icon mapping
    icons.tsx                 hand-built line icon set

lib/
  auth.ts                     getCurrentProfile, requireUser/Resident/Admin
  constants.ts                BARANGAY, SERVICES, NAV_LINKS
  types.ts                    Announcement, PublicStats, ResidentRow, ServiceRequestRow
  supabase.ts                 legacy browser singleton (still used by client pages)
  supabase/client.ts          @supabase/ssr browser client
  supabase/server.ts          @supabase/ssr server client via cookies()
  data/announcements.ts       published-announcement reads + graceful fallback
  data/stats.ts               get_public_stats() RPC wrapper

assets/illustrations/         five original SVGs (static imports)
public/maporong-logo.png      official barangay seal
docs/design-system.md         design intent (partially stale)
supabase/migrations/          schema, RLS, triggers, RPCs
proxy.ts                      Next 16 proxy
```

### 4.1 Path aliases

```ts
import { Button } from '@/components/ui/Button';
import { SERVICES } from '@/lib/constants';
import heroCommunity from '@/assets/illustrations/hero-community.svg';
```

`@/*` maps to the repo root. Use aliases for cross-folder imports; use relative imports only within the same feature folder.

### 4.2 Server vs client components

- Default to **Server Components**. `app/page.tsx`, `app/dashboard/page.tsx`, and `app/dashboard/announcements/page.tsx` are server components.
- Add `'use client'` only when state, effects, refs, or browser APIs are required.
- Client components currently include `AuthForm`, `DashboardClient`, `admin/page.tsx`, `dashboard/request/page.tsx`, `SiteHeader`, `PortalHeader`, `ServiceSearch`, `ServiceCarousel`, `Modal`, and `FeedbackModal`.
- Never import a server-only module (`lib/supabase/server.ts`) into a client component.

---

## 5. Design tokens

All tokens are declared in `app/globals.css` inside `@theme`. Tailwind v4 turns them into utilities (`bg-pine`, `text-forest`, `shadow-card`, etc.).

### 5.1 Colour

```css
/* app/globals.css */
@theme {
  --color-canvas: #ffffff;
  --color-mist: #f1f7f3;
  --color-mint: #dcefe8;
  --color-pine: #267653;
  --color-pine-deep: #1e5c41;
  --color-leaf: #75b99b;
  --color-sky: #e6f3fa;
  --color-forest: #344a40;
  --color-line: #dde8e1;
  --color-gold: #f5c879;
  --color-muted: #5d6f66;
  --color-subtle: #f7fbf9;

  --color-pending-bg: #fdf3de;
  --color-pending-ink: #8a6116;
  --color-ready-bg: #dcefe8;
  --color-ready-ink: #267653;
  --color-received-bg: #f1f7f3;
  --color-received-ink: #4b6a5c;
  --color-rejected-bg: #fbecec;
  --color-rejected-ink: #9c3f3f;
}
```

| Token | Hex | Use |
| --- | --- | --- |
| `canvas` | `#FFFFFF` | Cards, input surfaces, header background |
| `mist` | `#F1F7F3` | Page wash, hover rows, footer, modal header |
| `mint` | `#DCEFE8` | Icon tiles, active nav, selected states |
| `pine` | `#267653` | Primary actions, active text, brand |
| `pine-deep` | `#1E5C41` | Primary hover |
| `leaf` | `#75B99B` | Hover borders, illustration accent |
| `sky` | `#E6F3FA` | Informational panels |
| `forest` | `#344A40` | Primary text, 2px strong borders |
| `line` | `#DDE8E1` | Default borders and dividers |
| `gold` | `#F5C879` | Rare accent, pending marker |
| `muted` | `#5D6F66` | Secondary copy (AA on white) |
| `subtle` | `#F7FBF9` | Nested panels, dashed empty states |

**Semantic intent**

| Role | Token |
| --- | --- |
| Page background | `mist` (portal/landing sections) or `canvas` |
| Card surface | `canvas` |
| Nested surface | `subtle` |
| Brand / primary action | `pine`, hover `pine-deep` |
| Selected / verified | `mint` + `pine` |
| Informational | `sky` |
| Secondary text | `muted` |
| Decorative accent | `leaf`, `gold` |
| Destructive / rejected | `rejected-ink` on `rejected-bg` |

### 5.2 Type

```css
@theme {
  --font-sans: var(--font-lato), ui-sans-serif, system-ui, sans-serif;
  --font-display: var(--font-pixel-sans), ui-monospace, "Courier New", monospace;
}
```

Fonts are loaded in `app/layout.tsx` with `next/font/google`:

```tsx
import { Lato, Pixelify_Sans } from 'next/font/google';

const pixelSans = Pixelify_Sans({
  variable: '--font-pixel-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

const lato = Lato({
  variable: '--font-lato',
  subsets: ['latin'],
  weight: ['400', '700', '900'],
  display: 'swap',
});
```

- **Display / headings / numerics:** Pixelify Sans (`font-display`, `heading-*`, `display-*`).
- **Body / forms / buttons / labels:** Lato (`font-sans`, `body-*`, `label-*`).
- Do not add another font family. Do not use Nunito Sans in new work.

> **Gotcha:** `--font-display` is declared twice — inside `@theme` and again in `:root`. The `:root` declaration wins for `var(--font-display)`. If you change the display font, change both declarations and the `next/font` import in `app/layout.tsx`.

### 5.3 Type scale (exact)

| Class | Family / weight | Size | Line-height | Use |
| --- | --- | --- | --- | --- |
| `display-xl` | Pixelify 700 | `clamp(2.5rem, 5.4vw, 3.75rem)` | 1.08 | Landing hero only |
| `display-lg` | Pixelify 700 | `clamp(2rem, 4vw, 2.75rem)` | 1.12 | Page opener / auth |
| `heading-1` | Pixelify 700 | `clamp(1.75rem, 3vw, 2.25rem)` | 1.2 | Page title |
| `heading-2` | Pixelify 700 | `clamp(1.375rem, 2.4vw, 1.75rem)` | 1.25 | Section title |
| `heading-3` | Pixelify 700 | `1.25rem` | 1.35 | Card title |
| `heading-4` | Pixelify 700 | `1.0625rem` | 1.4 | Small card title |
| `eyebrow` | Lato 700 | `0.6875rem` | 1rem | Kicker, 0.18em tracking, uppercase, pine |
| `body-lg` | Lato 400 | `1.0625rem` | 1.75 | Lead paragraph |
| `body-md` | Lato 400 | `0.9375rem` | 1.65 | Default body |
| `body-sm` | Lato 400 | `0.8125rem` | 1.55 | Metadata |
| `label-md` | Lato 700 | `0.875rem` | 1.25rem | Buttons, field labels |
| `label-sm` | Lato 700 | `0.75rem` | 1rem | Table headers, fine labels |

Rules:

- Headings use sentence case. Only `eyebrow` and small all-caps labels use uppercase.
- Keep body line length 60–75 characters on desktop, 45–60 on mobile.
- Do not centre long paragraphs.
- Maximum three type sizes inside one card.
- Statistics use `font-display` at `text-4xl` (see landing stat cards), not `heading-*`.
- All headings already inherit `text-wrap: balance` from `globals.css`.

### 5.4 Radius, elevation, container

```css
@theme {
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 20px;
  --radius-2xl: 24px;
  --radius-3xl: 32px;

  --shadow-subtle: 3px 3px 0 0 rgba(52, 74, 64, 0.12);
  --shadow-card: 5px 5px 0 0 rgba(52, 74, 64, 0.14);
  --shadow-raised: 7px 7px 0 0 rgba(52, 74, 64, 0.16);
  --shadow-modal: 8px 8px 0 0 rgba(52, 74, 64, 0.2);

  --container-page: 1200px;
}
```

| Token | Value | Use |
| --- | --- | --- |
| `rounded-sm` / 8px | tiny chips |
| `rounded-md` / 12px | inputs |
| `rounded-lg` / 16px | compact cards |
| `rounded-xl` / **12px** | **all buttons**, nav links, tabs, filter chips |
| `rounded-[20px]` | standard cards and panels |
| `rounded-[24px]` | modals, feature panels |
| `rounded-[26px]` / `rounded-[28px]` | page headers, hero frames |
| `rounded-[32px]` | hero / CTA / feature bands |
| `rounded-full` | badges, avatars, mobile-nav active indicator **only** |

Elevation rules:

- Every elevation in the current theme is a **hard offset with zero blur**.
- `shadow-subtle` = resting card; `shadow-card` = card that must separate from mist; `shadow-raised` = hero frame / hover / dropdown; `shadow-modal` = dialog.
- Never stack two shadow utilities on one element.
- Buttons use `shadow-subtle` and gain `shadow-card` on hover.
- Prefer a 2px border over a shadow when the surface is already separated.

### 5.5 Allowed raw-hex exceptions

Tokens are preferred, but these one-off values are already part of the system. Keep them consistent if reused:

| Value | Where | Meaning |
| --- | --- | --- |
| `#9C3F3F` / `#853333` | danger button, rejected ink | functional error (not brand) |
| `#F1CCCC` | rejected border | error border tint |
| `#C4E3D5` | green badge border | mint border |
| `#F2DFB6` | pending badge border | gold border |
| `#3A6478` | sky badge text, sky stat icon | sky ink |
| `#CFE7F1` | sky panel border | sky border |
| `#22414F` / `#3F5F6C` / `#5A7884` | sky panel headings/body | deep sky ink |
| `#4A3A12` / `#EFBB60` | gold button text/hover | gold ink |
| `#98AAA0` | input placeholder | placeholder |
| `#C4D6CB` | input hover border | input hover |
| `#1B2B24` | modal backdrop (`/50`) | scrim |

Do not introduce new arbitrary hex values for convenience. If a new colour is needed, add a named token in `@theme` and document it.

### 5.6 Body background

`body` has a 24px graph-paper grid, not a flat colour:

```css
body {
  background-color: var(--color-canvas);
  background-image:
    linear-gradient(to right, rgba(52, 74, 64, 0.035) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(52, 74, 64, 0.035) 1px, transparent 1px);
  background-size: 24px 24px;
  color: var(--color-forest);
  font-family: var(--font-body);
  overflow-x: hidden;
}
```

Keep section surfaces (`bg-mist`, `bg-subtle`, `bg-sky`) opaque enough to sit on the grid without visual noise.

---

## 6. Global component classes

Defined in `@layer components` in `app/globals.css`.

| Class | Contract |
| --- | --- |
| `page-shell` | `max-width: 1200px`, centred, `1.25rem` gutters, `2rem` at `sm` |
| `surface-card` | white, 1px `line`, `radius-xl`, `shadow-subtle` |
| `input-base` | full width, `radius-md`, **2px** `line`, focus ring pine, error `aria-invalid` state |
| `interactive-card` | hover `translate(-2px,-2px)` + `shadow-raised` + pine border; active resets |
| `pixel-panel` | white, **2px forest**, `radius-xl`, `shadow-card` |
| `pixel-rule` | 2px bottom line + 2px offset shadow |
| `skeleton` | shimmering mist→sky gradient |
| `no-scrollbar` | hides scrollbar while keeping scroll |
| `line-clamp-2` / `line-clamp-3` | truncation |
| `print-slip-area` | hidden on screen; the only visible block in print |
| `animate-fade-up` / `animate-fade-in` / `animate-float` | motion (§12) |
| `delay-1` … `delay-4` | 80/160/240/320ms stagger |

`input-base` is the single input styling contract. Do not hand-roll input borders:

```tsx
<input className="input-base" aria-invalid={invalid || undefined} />
```

---

## 7. Components

### 7.1 Component inventory

| Component | File | Kind | Notes |
| --- | --- | --- | --- |
| `Button` | `components/ui/Button.tsx` | client-safe | 8 variants × 3 sizes, `rounded-xl` |
| `ButtonLink` | same | client-safe | Next `Link` with button classes |
| `buttonClasses()` | same | helper | for links and custom elements |
| `StatusBadge` | `components/ui/Badge.tsx` | server-safe | maps real request statuses |
| `Badge` | same | server-safe | neutral/green/sky/gold/danger |
| `Modal` | `components/ui/Modal.tsx` | client | Escape, backdrop, scroll lock, busy |
| `EmptyState` | `components/ui/EmptyState.tsx` | server-safe | icon **or** illustration |
| `PageHeader` | `components/portal/PageHeader.tsx` | server-safe | shared illustrated header |
| `AnnouncementCard` | `components/AnnouncementCard.tsx` | server-safe | category + date + title + body |
| `FeedbackModal` | `components/FeedbackModal.tsx` | client | success/error/info dialog |
| `ServiceIcon` | `components/ui/ServiceIcon.tsx` | server-safe | 5 service icons |
| `icons` | `components/ui/icons.tsx` | server-safe | 37 hand-built line icons |
| `SiteHeader` | `components/SiteHeader.tsx` | client | public nav + mobile menu |
| `SiteFooter` | `components/SiteFooter.tsx` | server-safe | footer + illustration watermark |
| `PortalHeader` | `components/portal/PortalHeader.tsx` | client | tabs + mobile bottom bar |
| `ServiceSearch` | `components/landing/ServiceSearch.tsx` | client | filters local `SERVICES` |
| `ServiceCarousel` | `components/landing/ServiceCarousel.tsx` | client | snap scroll, arrow buttons |
| `RequestSlip` | `components/RequestSlip.tsx` | server-safe | A4 print slip |

### 7.2 Button

```tsx
type ButtonVariant =
  | 'primary' | 'secondary' | 'ghost' | 'quiet'
  | 'dangerQuiet' | 'danger' | 'dangerSoft' | 'gold';
type ButtonSize = 'sm' | 'md' | 'lg';
```

| Variant | Look | Use |
| --- | --- | --- |
| `primary` | pine fill, white text | one main action per view |
| `secondary` | white, line border | alternate action |
| `ghost` | transparent, forest text | tertiary |
| `quiet` | white, muted text | header utilities |
| `dangerQuiet` | white, muted → red on hover | sign out |
| `danger` | `#9C3F3F` fill | destructive confirm only |
| `dangerSoft` | rejected wash + ink | low-emphasis destructive |
| `gold` | gold fill, dark ink | rare highlight, never primary |

Sizes: `sm` 40px min-height, `md` 44px, `lg` 48px. All `rounded-xl` (12px).

```tsx
<Button variant="primary" size="md" onClick={save}>Save changes</Button>
<ButtonLink href="/dashboard/request" variant="secondary">Request a document</ButtonLink>
<Link href="/auth" className={buttonClasses('primary', 'md')}>Resident login</Link>
```

Rules:

- Label is a verb phrase: “Request a document”, “Mark received”.
- Disabled uses `disabled:opacity-55`; never hide a disabled control without explanation.
- Active press translates 2px (`active:translate-x-[2px] active:translate-y-[2px]`) — this is the pixel “press” effect.
- Do not put two primary buttons in one row.
- Modal headers already have a close button; do not add a redundant “Close” in the footer.

### 7.3 StatusBadge / Badge

`StatusBadge` accepts the real database vocabulary:

```tsx
<StatusBadge status="pending" />   // Pending review
<StatusBadge status="ready" />     // Ready for pickup
<StatusBadge status="received" />  // Received
<StatusBadge status="rejected" />  // Needs attention
```

Unknown values fall back to `pending` styling and display the raw value. Never introduce `approved`, `completed`, `claimed`, or `cancelled` — the application never writes them.

`Badge` tones: `neutral`, `green`, `sky`, `gold`, `danger`. Badges are always pills (`rounded-full`) with uppercase `0.6875rem` bold text.

Announcement category → tone mapping (in `AnnouncementCard.tsx`):

| Category | Tone |
| --- | --- |
| General | neutral |
| Health, Program | green |
| Advisory, Safety | gold |
| Event(s), Activity/Activities | sky |

### 7.4 Modal

```tsx
<Modal
  open={open}
  onClose={() => setOpen(false)}
  title="Mark this request received?"
  description="This will close the request in the resident's history."
  size="sm"              // sm | md | lg | xl
  tone="default"         // default | danger
  busy={saving}
  footer={<><Button variant="secondary" onClick={close}>Cancel</Button>
            <Button onClick={confirm} disabled={saving}>Mark received</Button></>}
>
  ...
</Modal>
```

- Closes on Escape and backdrop click unless `busy`.
- Locks body scroll while open.
- `tone="danger"` gives the header a rejected wash.
- Footer stacks column-reverse on mobile, row on `sm+`.
- Dialog is `rounded-[24px]`, `border-2 border-forest/20`, `shadow-modal`.

### 7.5 EmptyState

```tsx
<EmptyState
  icon={<BellIcon className="h-5 w-5" />}
  illustration={<Image src={announcementsBoard} alt="" className="h-auto w-full" />}
  title="No announcements yet"
  description="When staff publish an advisory, it will appear here."
  action={<ButtonLink href="/dashboard/announcements" variant="secondary">View all</ButtonLink>}
/>
```

`icon` is required by the type, but `illustration` takes visual priority when provided. Use illustrations for portal empty states and icons for compact/secondary ones. Explain what will appear and how to make it appear; never blame the resident.

### 7.6 PageHeader

```tsx
<PageHeader
  eyebrow="Community noticeboard"
  title="Announcements"
  description="Advisories, schedules, and updates from Barangay Maporong."
  illustration={heroCommunity}
  illustrationAlt="Neighbours gathered outside the Barangay Maporong hall"
  action={<ButtonLink href="/dashboard/request">Request a document</ButtonLink>}
  priority
/>
```

- Every resident-facing page uses this header so the portal feels like one place.
- Left: copy; right: illustration in a bordered mist tile.
- Decorative sky/mint squares sit behind content (`aria-hidden`).
- Illustration container has `animate-float`; reduced motion disables it.

### 7.7 AnnouncementCard

```tsx
<AnnouncementCard announcement={item} compact />
```

- Category pill + date, title, body.
- `compact` clamps to 3 lines and uses `text-lg`; default uses `heading-3` + `body-md`.
- Date uses `en-PH` and `Asia/Manila`; invalid/missing dates render “Date to be confirmed”.
- The card is not itself a link today. Do not add a fake “Read more” unless a detail view exists.

### 7.8 PortalHeader

```tsx
<PortalHeader
  name={profile?.full_name || 'Resident'}
  role={profile?.role || 'resident'}
  isVerified={Boolean(profile?.is_verified)}
  active="overview"        // overview | request | announcements | id | admin
  onOpenId={openIdCard}    // omit to link to /dashboard#my-id
/>
```

- Desktop/tablet: sticky 68px bar + horizontal tabs (`md+`).
- Mobile: fixed bottom bar, min 58px per item, safe-area padding.
- `role === 'admin'` adds a “Staff workspace” tab; residents never see a dead admin link.
- `aria-current="page"` on the active destination.
- Pages using the mobile bar must add bottom padding (`pb-24 md:pb-16`).

### 7.9 RequestSlip

```tsx
import RequestSlip, { getRequestSlipNumber } from '@/components/RequestSlip';

<RequestSlip request={request} />
```

- Number format: `RQS-XXXXXXXX` (eight hex characters).
- Uses real fields only: name, age, address, weight, height, capital, business, birth place, CP number, birth date, civil status, gender, service type, purpose, date requested.
- Print-only wrapper: `.print-slip-area`; A4 portrait, 12mm margins.
- Download uses `html-to-image` `toPng` on the slip node.
- The slip is a rendering of saved data; it must not invent values. Empty fields print as blank lines.

### 7.10 FeedbackModal

```tsx
<FeedbackModal
  title="Request submitted"
  message="Your request is with barangay staff. Keep your slip number."
  type="success"           // info | success | error | warning
  confirmLabel="View my requests"
  onConfirm={goToHistory}
  onClose={close}
/>
```

Built on `Modal`; `error`/`warning` switch to the danger tone and a danger confirm button. Use this instead of `alert()`.

---

## 8. Icons

All icons live in `components/ui/icons.tsx`.

```tsx
export type IconProps = SVGProps<SVGSVGElement>;

function Svg({ children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}
```

Rules:

- **24 × 24 viewBox, 1.7px stroke, round caps/joins, no fill** (deliberate dots excepted).
- Names are PascalCase and end in `Icon`: `SearchIcon`, `IdCardIcon`, `ShieldCheckIcon`.
- Always `stroke="currentColor"`; colour comes from the parent (`text-pine`).
- Do not add Lucide or an icon font.
- Rendered sizes: `h-3.5 w-3.5` (13–15px inline), `h-4 w-4`/`h-4.5 w-4.5` (controls), `h-5 w-5` (navigation), `h-6 w-6` (confirmation).
- Default is decorative (`aria-hidden="true"`). If an icon carries meaning on its own, pass an accessible name and remove the hidden attribute at the call site.
- Icons never replace a visible text label for a primary action.
- `ServiceIcon` maps the five service types:

```tsx
clearance → FileTextIcon
indigency → HandHeartIcon
residency → HomeIcon
id        → IdCardIcon
business  → StoreIcon
```

---

## 9. Assets and illustrations

### 9.1 Files

| Asset | Path | Used on |
| --- | --- | --- |
| Barangay seal | `public/maporong-logo.png` | header, footer, auth, portal header, printed ID |
| Community hero | `assets/illustrations/hero-community.svg` | landing hero, auth panel, page headers, footer watermark |
| Wide barangay scene | `assets/illustrations/hero-barangay-wide.svg` | landing gallery lead image |
| Service desk | `assets/illustrations/service-desk.svg` | landing “how it works”, request success |
| Admin records | `assets/illustrations/admin-records.svg` | landing about section |
| Announcements board | `assets/illustrations/announcements-board.svg` | announcements empty state |

### 9.2 How assets are stored and imported

- Illustrations live in `assets/illustrations/`, **not** `public/`, and are imported statically:

```tsx
import heroCommunity from '@/assets/illustrations/hero-community.svg';

<Image src={heroCommunity} alt="..." sizes="(max-width: 1024px) 90vw, 520px" priority />
```

- Static import gives content hashing, intrinsic dimensions, and `next/image` optimisation. Do not move these into `public/` and reference them by string.
- The logo is the exception: it is a runtime asset at `/maporong-logo.png` because it may be replaced by the barangay without a code change.
- No `images.remotePatterns` are configured. Do not hotlink remote images.
- No CDN integration. Deployment platform static optimisation is the CDN.
- Do not add raster illustrations unless supplied by the barangay as official photos.

### 9.3 Illustration rules

- Soft flat vector, palette-only. No gradients, 3D, photorealism, emoji, or stock art.
- People-focused: residents, families, staff, farmers, vendors, youth, seniors, health workers. Vary age, gender, and body type.
- Keep character proportions and facial style consistent across all five SVGs.
- Draw the full scene; do not crop people at joints.
- Never bake text, numbers, logos, seals, or official information into an SVG.
- Every SVG needs a `viewBox`, no external references, and no scripts.
- Decorative illustrations: `alt=""` + `aria-hidden`. Informational illustrations: meaningful `alt` describing the scene.
- The landing gallery must label every illustration “Illustration — official photo pending”.

### 9.4 Print and export

- Print styles are in `app/globals.css` (`@media print`): A4 portrait, 12mm margins, only `.print-slip-area` visible.
- PNG export uses `html-to-image` `toPng` in `DashboardClient` and `app/admin/page.tsx`.
- When changing slip markup, verify both print and PNG output. Do not rely on the screen preview alone.

---

## 10. Styling methodology

### 10.1 Rules

1. **Tailwind utilities first.** Compose with classes in JSX.
2. **Global classes for repeated patterns.** Add to `@layer components` only when a pattern is used in 3+ places (`page-shell`, `input-base`, `interactive-card`).
3. **No CSS Modules, styled-components, or inline `<style>`.** The only exception is a dynamic stagger delay (`style={{ animationDelay }}`) and one-off dynamic values.
4. **No class-merging library.** Use template strings and accept a `className` prop for overrides.
5. **Tokens over hex.** See §5.5 for the closed list of exceptions.
6. **Mobile-first.** Base styles target small screens; add `sm:`, `md:`, `lg:` as the layout grows.
7. **Never cause horizontal page scroll.** Wide tables/carousels scroll inside their own `overflow-x-auto` wrapper.
8. **2px borders on structural surfaces** (cards, panels, headers, inputs). Use 1px only for subtle inner dividers.
9. **Do not mix rounded and square geometry arbitrarily.** Buttons/nav = 12px; cards = 20px; feature panels = 24–32px; badges/avatars = full.
10. **No decorative blobs with large blur.** The pixel theme uses flat squares (`bg-mint/70`, `bg-sky/70`) and hard shadows.

### 10.2 Responsive contract

| Range | Behaviour |
| --- | --- |
| `< 640px` | single column, 1.25rem gutters, stacked modal footer, cards instead of tables |
| `640–767px` | 2-column small grids, `2rem` gutters |
| `768–1023px` | portal tabs appear (`md`), 2-column grids |
| `1024–1279px` | public nav appears (`lg`), multi-column layouts |
| `≥ 1280px` | full 1200px shell, widest grids |

- Portal mobile navigation is a fixed bottom bar; add `pb-24 md:pb-16` to page wrappers.
- Touch targets ≥ 44px; bottom-bar items ≥ 58px.
- Do not reduce text below `body-sm`; reduce columns/padding instead.
- Test at 320, 390, 768, 1024, 1280, 1440px.

### 10.3 Layout primitives in use

```tsx
<div className="page-shell py-8">…</div>

<section className="rounded-[20px] border-2 border-line bg-white p-5 shadow-card sm:p-6">
  …
</section>

<article className="interactive-card rounded-[20px] border-2 border-line bg-white p-5 shadow-subtle">
  …
</article>
```

---

## 11. Routes, auth, and data flow

### 11.1 Routes

| Route | Access | Data |
| --- | --- | --- |
| `/` | public | published `announcements`, `get_public_stats()` |
| `/auth` | public | Supabase Auth; `?mode=register`, `?next=`, `?error=role` |
| `/dashboard` | resident or admin | own `profiles`, own `service_requests`, 3 latest announcements |
| `/dashboard/announcements` | resident or admin | published announcements + category filter |
| `/dashboard/request` | resident or admin | own profile, inserts `service_requests` |
| `/admin` | admin only | `residents`, `service_requests`, `announcements` |
| `/register` | public | permanent redirect → `/auth?mode=register` |
| `/my-id` | public | permanent redirect → `/dashboard` |

### 11.2 Authorisation layers

```text
proxy.ts                     → refreshes session, redirects anonymous users from /dashboard, /admin
app/dashboard/layout.tsx     → requireResident()
app/admin/layout.tsx         → requireAdmin()
RLS policies in Supabase     → the real boundary
```

`lib/auth.ts`:

```ts
export type AppRole = 'resident' | 'admin';

export const getCurrentProfile = cache(async () => { … });

export async function requireUser(nextPath = '/dashboard') { … }
export async function requireResident(nextPath = '/dashboard') { … } // admin may preview
export async function requireAdmin(nextPath = '/admin') { … }        // redirects to /dashboard?notice=admin-only
```

Rules:

- `requireResident` allows `resident` **and** `admin`; `requireAdmin` allows only `admin`.
- Role is read from `profiles.role`. Never trust a client-provided role.
- Never add route protection only in a client component.
- `getCurrentProfile` is wrapped in React `cache()`; do not duplicate the query in the same request.

### 11.3 Supabase clients

| File | Use |
| --- | --- |
| `lib/supabase/server.ts` | Server Components, Server Actions, route handlers; uses `cookies()` |
| `lib/supabase/client.ts` | new browser code via `@supabase/ssr` |
| `lib/supabase.ts` | existing browser singleton used by client pages |

- Server client never uses the service-role key.
- Browser client is created only from `NEXT_PUBLIC_*` values.
- If env vars are missing, `lib/supabase.ts` falls back to placeholder values so the UI still renders; `client.ts`/`server.ts` throw a clear setup error.

### 11.4 Data access patterns

- Public landing reads **only**:
  - `announcements` where `published = true`;
  - `get_public_stats()` (counts only).
- Never query `profiles`, `residents`, or individual `service_requests` from `/`.
- Data helpers return an availability flag:

```ts
// lib/data/announcements.ts
export type AnnouncementsResult = {
  items: Announcement[];
  available: boolean;
  message?: string;
};

// lib/data/stats.ts
export type StatsResult = { stats: PublicStats | null; available: boolean };
```

- When a table/RPC is missing: show a calm placeholder and setup note. **Never** insert sample numbers or fake announcements.
- Do not silently swallow write errors. Every mutation must show `error.message` through `FeedbackModal` or an inline alert.
- Use `.select(...)` with explicit columns; avoid `select('*')` in new code (existing admin code uses `*`; do not copy it into public surfaces).

---

## 12. Motion

Motion is CSS-only in `app/globals.css`.

| Class | Effect | Duration |
| --- | --- | --- |
| `animate-fade-up` | opacity 0→1, translateY 12px→0 | 520ms `cubic-bezier(0.22,1,0.36,1)` |
| `animate-fade-in` | opacity 0→1 | 400ms ease |
| `animate-float` | translateY 0 → −6px → 0 | 6s ease-in-out infinite |
| `delay-1…4` | stagger | 80/160/240/320ms |
| `skeleton` | shimmer | 1.4s linear infinite |

Rules:

- Animate opacity and transform only. Never animate width, height, or layout properties.
- One floating decoration per view maximum.
- Stagger at most 6 cards (`Math.min(index, 6) * 60`).
- No autoplay carousels, parallax, bounce, or looping decoration beyond `animate-float`.
- `prefers-reduced-motion: reduce` globally reduces animation/transition to `0.01ms` and disables hover transforms. Do not work around it.
- Do not add Framer Motion for effects achievable with these classes.

---

## 13. Content and voice

### 13.1 Voice

- Write like a helpful staff member at the hall: short sentences, plain words.
- Address the resident as “you”; refer to staff as “barangay staff”.
- Say what happens next and who does it.
- Never promise automatic approval.
- Filipino greetings may be used sparingly and naturally.
- Dates: `DD Mon YYYY` (e.g. `04 Nov 2026`) in hand-written copy; `en-PH` locale formatting in code.
- Slip numbers: real `RQS-XXXXXXXX` only.

### 13.2 Status language

| Status | Resident-facing | Staff action |
| --- | --- | --- |
| `pending` | Pending review / With staff | mark ready or reject with reason |
| `ready` | Ready for pickup | mark received |
| `received` | Received / Picked up | archived automatically |
| `rejected` | Needs attention + reason | show recorded reason |

### 13.3 Placeholder rules

- Missing official facts are bracketed placeholders, never guesses: `[Purok and street — to be confirmed]`, `[To be confirmed]`.
- Announcement copy in design files is labelled `PLACEHOLDER`.
- Sample people, BID numbers, queue counts, and dates are labelled “sample data for layout”.
- Contact details, office hours, official photos, and hero copy require barangay approval before publication.

### 13.4 Errors and rejections

- Say what happened, why, and what to do next.
- Never blame the resident.
- Show the staff-recorded rejection reason verbatim when safe.
- Pair every error colour with written text.

---

## 14. Supabase schema and RLS

### 14.1 Tables (confirmed)

**`profiles`**

| Column | Notes |
| --- | --- |
| `id` | UUID, equals `auth.users.id` |
| `full_name` | text |
| `address` | text |
| `bid_number` | admin-assigned only |
| `is_verified` | admin-controlled only |
| `role` | `resident` or `admin` |
| `age` | integer |
| `gender` | text |
| `created_at` | timestamptz |

**`residents`** — registry rows linked by `profile_id`; includes `full_name`, `address`, `age`, `gender`, `is_verified`, `bid_number`.

**`service_requests`** — `resident_id` (auth UUID), `full_name`, `service_type`, `purpose`, `status`, `rejection_reason`, demographic and business fields (`age`, `address`, `sex`, `civil_status`, `birthday`, `birth_place`, `height`, `weight`, `business`, `capital`, `cp_no`), `slip_number`, `received_at`, `resident_hidden_at`, timestamps.

**`announcements`** — `title`, `body`, `category`, `published`, `published_at`, `created_by`, `created_at`, `updated_at`.

### 14.2 Functions / RPCs

| Function | Purpose |
| --- | --- |
| `current_app_role()` | returns caller's role; `security definer` |
| `is_admin()` | boolean admin check; `security definer` |
| `get_public_stats()` | counts only: verified residents, received requests, published announcements |
| `hide_completed_request_from_resident(uuid)` | hides a completed/rejected row from the resident's history |
| `admin_update_resident_record(...)` | admin edit of a resident record |
| `handle_new_user()` | creates a `profiles` row from auth metadata on signup |
| `guard_profile_privileges()` | blocks residents changing `role`, `is_verified`, `bid_number` |
| `guard_profile_insert()` | forces new self-created profiles to `resident`, unverified |
| `guard_service_request_resident_update()` | blocks residents changing status/processing fields |

### 14.3 RLS summary

| Table | Resident | Admin |
| --- | --- | --- |
| `profiles` | select/insert/update own row only | all rows |
| `residents` | select rows where `profile_id = auth.uid()` | full CRUD |
| `service_requests` | select/insert own; update only safe fields | full CRUD |
| `announcements` | select `published = true` | full CRUD + unpublished |

### 14.4 Migration rules

- Apply every file in `supabase/migrations/` in filename order.
- The latest migration `20261105120000_security_hardening_and_announcements.sql` **may not yet be applied**. Until it is:
  - landing noticeboard shows empty state;
  - statistics show an em dash + setup note;
  - staff announcements tab shows “not set up yet”;
  - admin writes remain blocked by older policies.
- All migrations should be re-runnable (`if not exists`, `drop policy if exists`, `create or replace`).
- Before changing schema or policies: explain the reason, the affected rows, and the rollback plan. **Request approval.**
- Never delete or rewrite historical requests/accounts as part of a UI task.

---

## 15. Figma MCP workflow

### 15.1 Connection status

The Figma MCP server is **connected** and authenticated. At snapshot time:

```text
handle: James
user_id: 1567786107242476496
plans: James Espinosa's team (admin), F-word enjoyer (admin)
code_layers_enabled: true
```

If a future session cannot authenticate, say so plainly and stop the Figma phase. Do not pretend to have created or inspected a file.

### 15.2 Target file

- **Name:** `iMaporong — Barangay Community Portal`
- **URL:** <https://www.figma.com/design/BNQeLHl5EkoV5vtuKI7ija>
- **File key:** `BNQeLHl5EkoV5vtuKI7ija`
- **Pages:** Brand Identity `0:1`, Design System `2:2`, Landing Page `2:3`, Resident Portal `2:4`, Admin Portal `2:5`, Mobile `2:6`, Components and States `2:7`

**Inspect before creating.** If the file or a page already exists, read it first. Never overwrite existing frames, components, or styles without permission. If a new file is truly required, name it exactly as above.

### 15.3 Required workflow

1. Verify auth with `whoami`.
2. Resolve the target `fileKey` from the URL.
3. Call `create_session` with the file key and a concise task description **before** any file tool (read-only tasks included).
4. Inspect: `get_metadata`, `get_screenshot`, `get_design_context` (for implementation handoff), or `get_figjam` for boards.
5. Call `search_design_system` and `get_libraries` before drawing. Reuse existing variables, text styles, and components.
6. If a new file is needed: `create_new_file`, then `create_session` with the returned key.
7. Build with `use_figma` (load `/figma-use` first) or capture a web page with `generate_figma_design`.
8. For code handoff, load `/figma-design-to-code` before `get_design_context`.

Use the returned session UUID on subsequent file tools in the same task.

### 15.4 Figma must mirror the current code, not the old doc

The Figma file was seeded before the pixel reskin. Before adding screens, reconcile:

| Element | Figma must use now |
| --- | --- |
| Display type | Pixelify Sans (400–700) |
| Body type | Lato (400/700/900) |
| Cards | 2px `line`/`forest` borders, 20px radius |
| Shadows | hard offset: 3/5/7/8px, zero blur |
| Buttons | 12px radius, 40/44/48px heights |
| Icons | 24px, 1.7px stroke |
| Background | white + 24px grid, mist/sky section washes |
| No dark mode | light only |

If the file still shows Nunito Sans, blurred shadows, or pill buttons, fix the design system page first, then the screens.

### 15.5 Component and variant naming

Use a stable, code-aligned naming scheme:

```text
Button                     Variant=Primary|Secondary|Ghost|Quiet|DangerQuiet|Danger|DangerSoft|Gold
                           Size=sm|md|lg
                           State=Default|Hover|Active|Focus|Disabled|Loading

Badge                      Tone=Neutral|Green|Sky|Gold|Danger
StatusBadge                Status=Pending|Ready|Received|Rejected

Modal                      Size=sm|md|lg|xl · Tone=Default|Danger
Input                      State=Default|Focus|Error|Disabled
NavItem                    State=Default|Active
Tab                        State=Default|Active
Notice                     Tone=Info|Success|Attention
DocumentCard               Service=Clearance|Indigency|Residency|ID|Business
```

Rules:

- Auto Layout on every component and every frame that contains a stack.
- Variants for every state listed above; do not fake states with detached layers.
- Bind colours/radii/shadows to variables named exactly like the CSS tokens (`color/pine`, `radius/md`, `shadow/card`).
- Name text styles with the CSS class names (`type/display-xl`, `type/body-md`, …).
- Keep desktop frames at 1440 with a 1200 content shell and 32px gutters; mobile at 390×844 with 20px gutters.
- Include empty, loading, error, and disabled states — not only the happy path.
- Use realistic Filipino names and scenarios, but label sample records as sample data.

### 15.6 What never goes into Figma

- Invented official statistics, contact numbers, addresses, office hours, or announcement copy.
- Government seals/flags presented as official unless supplied by the barangay.
- Photorealistic stock imagery presented as the barangay.
- A design that only exists in Figma while the code diverges. Figma is the visual reference; `app/` is the implementation truth.

---

## 16. Accessibility

Target **WCAG 2.2 AA**.

- Minimum touch target 44×44px, with ≥8px between adjacent targets.
- Visible focus ring: 2px pine, 2px offset (`:focus-visible` globally; `focus-visible:outline-*` on custom controls).
- Never remove focus outlines without a replacement.
- Use real semantic elements: `<button>`, `<a>`, `<label>`, `<input>`, `<table>`, `<nav>`, heading order.
- Every input has a persistent visible label; placeholder is never the only label.
- Errors are described in text, not colour alone; use `aria-invalid`.
- Status badges include the status word.
- Active navigation uses `aria-current="page"` and a visual indicator, not colour alone.
- Illustrations: meaningful `alt`; decorative `alt=""` + `aria-hidden`.
- Modal: `role="dialog"`, `aria-modal`, `aria-labelledby`, `aria-describedby`, Escape close, focusable close button.
- Support 200% text zoom without loss of content.
- Respect `prefers-reduced-motion`.
- Skip link exists on the landing page (`Skip to content` → `#main`).

---

## 17. Known placeholders and open items

These are intentionally unfinished. Do not “fill them in” with guesses.

1. **Contact details and office hours** — footer says “Contact details to be provided by the barangay.” and “Office hours to be confirmed by the barangay.”
2. **Official photos** — gallery uses illustrations labelled “Illustration — official photo pending”.
3. **Announcements** — no sample announcements ship. The board is empty until staff publish.
4. **Statistics** — real counts from `get_public_stats()` or an em dash + setup note.
5. **Tagline and hero copy** — the master prompt’s “A little seed. A growing community.” is a brand concept, **not approved copy**. The live hero is “Barangay services, without the back-and-forth.” Do not swap it without approval.
6. **Functional error colour `#9C3F3F`** — an exception to the approved palette; confirm before launch.
7. **Latest migration** — `20261105120000_security_hardening_and_announcements.sql` may be unapplied.
8. **Tablet layout** — desktop/mobile artboards exist; tablet behaviour is specified but not separately designed.

---

## 18. Conflicts between the master prompt and the implementation

When the master prompt and the code disagree, **follow the code**. Raise the conflict instead of silently changing the product.

| Topic | Master prompt | Implementation (use this) |
| --- | --- | --- |
| Display font | Nunito Sans | **Pixelify Sans** |
| Body font | Lato | Lato ✅ |
| Background | Warm Cream `#FFF8E9` | White canvas + mist/sky washes |
| Sky | `#A9D9F0` | `#E6F3FA` |
| Peach accent | `#F5D9CF` | **Not used** — do not add |
| Primary | `#267653` | `#267653` ✅ |
| Secondary | `#75B99B` | `#75B99B` ✅ |
| Deep forest | `#344A40` | `#344A40` ✅ |
| Gold | `#F5C879` | `#F5C879` ✅ |
| Mint | `#DCEFE8` | `#DCEFE8` ✅ |
| Icons | “Lucide React” suggested | **Custom icon set**; do not add Lucide |
| Animation | “Motion/Framer Motion if appropriate” | **CSS keyframes only** |
| Statuses | pending / processing / approved / rejected / completed | **pending / ready / received / rejected** only |
| Services | 6 example cards incl. “Document Requests”, “Community Assistance” | **5 real services only** |
| Dark mode | not requested | none; `light only` |
| Tagline | “A little seed. A growing community.” | concept only; current hero copy differs |
| Storybook | suggested “docs/storybook” aspect | none; `docs/design-system.md` is the reference |

---

## 19. Quality gates

Run all three before declaring a task complete:

```bash
npx tsc --noEmit
npm run lint
npm run build
```

There is no automated test suite. Manually verify:

### Design
- [ ] Tokens used; no stray hex outside §5.5.
- [ ] 2px borders + hard shadows; 12px buttons.
- [ ] No horizontal overflow at 320/390/768/1024/1280/1440.
- [ ] Illustrations correct and labelled.

### Auth
- [ ] Anonymous `/dashboard` and `/admin` → `/auth?next=…`.
- [ ] Resident `/admin` → `/dashboard?notice=admin-only`.
- [ ] Admin can preview resident portal.
- [ ] Sign out clears session and returns to `/auth`.
- [ ] No `service_role` key anywhere in the client bundle.

### Resident
- [ ] Overview loads own profile + requests.
- [ ] Request form validates required fields and inserts with `status: 'pending'`.
- [ ] Slip number renders `RQS-XXXXXXXX` and prints/downloads.
- [ ] Request history shows rejection reason.
- [ ] Hide-completed action calls the RPC.
- [ ] Announcement filters handle unknown category gracefully.

### Admin
- [ ] Resident verify writes `profiles.is_verified` + `bid_number` and `residents.is_verified`.
- [ ] Request status changes write `ready`/`received`/`rejected` + reason.
- [ ] Announcement create/update/delete writes Supabase.
- [ ] CSV import validates rows and reports failures.
- [ ] Every destructive action confirms through `Modal`/`FeedbackModal`.

### Data
- [ ] Missing migration degrades to empty state, not fake data.
- [ ] Public page never queries PII.
- [ ] Errors surface the real message.

---

## 20. Task playbooks

### 20.1 Adding or changing a page

1. Read the nearest existing page and `app/globals.css`.
2. Decide server vs client; default server.
3. Add the route under `app/`.
4. Use `PageHeader` + `PortalHeader` for resident pages.
5. Add `pb-24 md:pb-16` for the mobile bar.
6. Guard with `requireResident`/`requireAdmin` at the layout.
7. Add `metadata`.
8. Verify RLS covers every query.
9. Run the quality gates.

### 20.2 Adding a component

1. Check the inventory (§7) — reuse before adding.
2. Place in `components/ui/` (primitive) or `components/` (composed).
3. Accept `className` for overrides.
4. Use tokens and existing helpers.
5. Keep it server-safe unless state/effects are required.
6. Document it in `docs/design-system.md` §8 and add the Figma component set.

### 20.3 Changing a token

1. Change `app/globals.css` `@theme`.
2. Search for raw hex duplicates.
3. Update `docs/design-system.md` (§3/§4/§5) in the same commit.
4. Update Figma variables and text/effect styles.
5. Check contrast (§16) and all surfaces.
6. Run the quality gates.

### 20.4 Changing the database

1. Inspect actual schema/policies first (`supabase/migrations/`, live DB if available).
2. Write a new timestamped migration; never edit an applied one destructively.
3. Make it re-runnable.
4. Explain affected rows, security impact, and rollback.
5. **Request approval before applying.**
6. Update `README.md` and `docs/design-system.md` §13.

### 20.5 Updating Figma

1. `whoami` → `create_session` with `BNQeLHl5EkoV5vtuKI7ija`.
2. Inspect the page before editing.
3. `search_design_system` + `get_libraries`.
4. Reuse components/variables; do not detach.
5. Auto Layout for every new frame.
6. Include states and mobile.
7. Screenshot and compare to the implementation.
8. Never overwrite without permission.

---

## 21. Short do / don't list

**Do**

- Preserve uncommitted work.
- Read `node_modules/next/dist/docs/` when unsure about Next 16.
- Use `profiles.role` (`admin`/`resident`).
- Use `RQS-XXXXXXXX`, `pending/ready/received/rejected`.
- Use `page-shell`, `input-base`, `interactive-card`, `Button`, `StatusBadge`, `Modal`, `EmptyState`, `PageHeader`.
- Use `next/image` with static illustration imports.
- Use CSS keyframes and respect reduced motion.
- Show real data or an honest placeholder.
- Run `tsc`, `lint`, `build`.

**Don't**

- Don't run destructive git commands.
- Don't add Lucide, Framer Motion, Storybook, or a UI kit.
- Don't add `is_admin`.
- Don't expose secrets or bypass RLS.
- Don't invent stats, announcements, contacts, or services.
- Don't introduce peach, dark mode, gradients, or soft blurred shadows.
- Don't use pill buttons.
- Don't add `approved`/`completed`/`cancelled` statuses.
- Don't create a sixth service.
- Don't fake admin actions in local state.
- Don't overwrite Figma without permission.

---

## 22. Quick reference

```text
Repo            C:\Users\PRINCESS GRACE\Documents\imaporong-redesign
Package name    maporong-app
Next            16.4.3
React           19.2.4
Tailwind        4.2.4 (no config file; @theme in app/globals.css)
Display font    Pixelify Sans  → --font-pixel-sans
Body font       Lato           → --font-lato
Primary         #267653 pine
Text            #344A40 forest
Secondary text  #5D6F66 muted
Page wash       #F1F7F3 mist
Selected        #DCEFE8 mint
Info            #E6F3FA sky
Border          #DDE8E1 line
Accent          #F5C879 gold
Container       1200px
Button radius   12px
Card radius     20px
Shadow          hard offset, no blur
Figma key       BNQeLHl5EkoV5vtuKI7ija
Figma pages     0:1 · 2:2 · 2:3 · 2:4 · 2:5 · 2:6 · 2:7
Slip number     RQS-XXXXXXXX
Statuses        pending · ready · received · rejected
Roles           resident · admin
```
