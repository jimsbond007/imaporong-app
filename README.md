# iMaporong — Barangay Maporong Community Portal

A Next.js app for Barangay Maporong (Municipality of Oas, Province of Albay). It has three surfaces:

- a public landing page with an illustrated pixel-art countryside, barangay services, announcements, and a community map;
- a resident portal for document requests, request slips, and request history;
- a staff workspace for the request queue, resident registry, announcements, and calendar.

Design tokens, component styles, and illustration rules are documented in [`docs/design-system.md`](docs/design-system.md).

## Run locally

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

Other scripts:

```bash
npm run build   # production build
npm start       # serve the production build
npm run lint    # eslint .
```

## Environment variables

Create `.env.local` with the Supabase project URL and **anon** key:

```
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

Only the anon key belongs in the client. Never add a service-role key to this project or expose it to the browser. All access is enforced by Row Level Security.

## Database setup

Apply every file in `supabase/migrations/` in filename order. For a linked project run `supabase db push`; otherwise paste each file into the Supabase SQL Editor.

**Required before the current UI is fully functional:**

| Migration | What it does |
| --- | --- |
| `20261105120000_security_hardening_and_announcements.sql` | Adds `announcements`, `get_public_stats()`, role helper functions, hardened RLS on `profiles` / `residents` / `service_requests`, and the new-user trigger. **Not yet applied.** |

Until that migration runs:

- the landing noticeboard shows its empty state;
- the staff **Announcements** tab shows a “not set up yet” notice;
- admin-only writes remain blocked by the older policies.

Earlier migrations create the resident registry, request slip numbers, rejection feedback, and request-history rules. Apply all of them on a fresh database.

### Roles

Roles live in `profiles.role` and are either `resident` or `admin`. There is no `is_admin` column. Promote an account with the SQL Editor:

```sql
update public.profiles set role = 'admin' where id = '<auth-user-uuid>';
```

New sign-ups are always created as `resident` with `is_verified = false`.

## Routes

| Route | Access | Notes |
| --- | --- | --- |
| `/` | Public | Landing page and illustrated community map. Reads published announcements only. |
| `/auth` | Public | Sign in and register. `?mode=register` opens registration directly. |
| `/dashboard` | Resident or admin | Resident overview, ID card, latest announcements, request history. |
| `/dashboard/announcements` | Resident or admin | Full noticeboard feed with category filters. |
| `/dashboard/request` | Resident or admin | Five-service request form with slip confirmation. |
| `/admin` | Admin only | Requests, residents, announcements, calendar. |

Protection is layered: `proxy.ts` refreshes the Supabase session and redirects anonymous visitors, `app/dashboard/layout.tsx` and `app/admin/layout.tsx` call `requireResident` / `requireAdmin`, and SQL policies are the real security boundary.

The resident portal uses one navigation pattern instead of scattered buttons: a two-row sticky header on tablet/desktop (brand, account, then section tabs) and a fixed bottom bar on mobile (Overview, Request, News, My ID, plus Staff for admins). Contextual actions stay inside the card they belong to.

## Project layout

```
app/                  routes and page shells
components/           shared UI, landing sections, portal chrome
components/ui/        buttons, badges, modals, icons, empty states
lib/                  Supabase clients, auth guards, types, constants, data access
assets/illustrations/ original SVGs used across the app
docs/design-system.md tokens, components, illustration guide
supabase/migrations/  database schema and RLS
proxy.ts              Next.js 16 session refresh + route redirects
```

## Supabase clients

- `lib/supabase.ts` — browser client (`@supabase/supabase-js`) with placeholder fallbacks so the UI still renders when env vars are missing.
- `lib/supabase/client.ts` — browser client built with `@supabase/ssr`.
- `lib/supabase/server.ts` — server client using async `cookies()`.

## Known placeholders

These are intentionally unfinished and must be confirmed by the barangay:

- contact details and office hours;
- announcement copy (no sample announcements ship);
- the functional error/rejection colour `#9C3F3F`, which is an exception to the approved palette.

## Legacy routes

`/register` and `/my-id` are old prototype URLs. They now redirect to the current flows so old bookmarks keep working:

- `/register` → `/auth?mode=register`
- `/my-id` → `/dashboard`

Both are server-side redirects; no legacy screen code remains.
