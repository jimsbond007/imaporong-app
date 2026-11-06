# iMaporong Design System

Working design system for the iMaporong barangay community portal. It covers the public landing page, the resident portal, the staff/admin portal, and the mobile companion screens.

This document mirrors the Figma file **iMaporong: Barangay Community Portal** and the implemented tokens in `app/globals.css`.

- Figma file: <https://www.figma.com/design/BNQeLHl5EkoV5vtuKI7ija>
- File key: `BNQeLHl5EkoV5vtuKI7ija`
- Status: implemented in the repository (landing, resident portal, staff workspace). Copy, contact details, official photos, and announcement content are still pending barangay approval.

> Nothing in this document is official barangay information. Sample names, BID numbers, counts, dates, and announcement text used in design mockups must not be published as real records. The live app reads real data or shows an explicit placeholder.

---

## 1. Page map

| Page | Figma page | Status | Purpose |
| --- | --- | --- | --- |
| Brand Identity | `0:1` | Seeded with logo, palette board, illustration uploads | Logo lockups, palette, type, illustration direction, voice |
| Design System | `2:2` | Tokens and text/effect styles created | Tokens, contrast, components, principles |
| Landing Page | `2:3` | Frame built | Public landing page |
| Resident Portal | `2:4` | Frame built | Resident dashboard and request flow |
| Admin Portal | `2:5` | Frame built | Staff workspace |
| Mobile | `2:6` | Frames built | Home, request form, my requests, success slip |
| Components and States | `2:7` | Component sets built | Reusable components and variants |

The live implementation in `app/` is the source of truth for spacing and responsive behaviour. The Figma frames are the visual reference; both follow the same tokens.

---

## 2. Brand foundations

### 2.1 Brand idea

A calm, trustworthy barangay desk rooted in the Golden Harvest countryside: rice fields, river light, nipa homes, and people helping people. The public landing carries a pixel-art landscape; the portals keep a soft, flat, human surface — closer to a well-kept community noticeboard than a corporate service portal.

The working tagline and all hero/supporting copy in Figma are drafts **awaiting barangay approval**. Do not treat them as official messaging.

### 2.2 Logo

The implementation uses the pixel `imap.svg` mark in the site header, footer, auth screen, resident header, staff header, printed ID card, and application icon. It is displayed inside a rounded tile with a clear border.

- Keep clear space equal to at least half the logo height on all sides.
- Minimum size in the UI: 40 px.
- Use the logo on Harvest Cream, Rice Mist, or Soft Crop. Do not place it on busy photography.
- Do not recolour, crop, stretch, or add effects to the mark.
- The official barangay seal is not the application logo; do not substitute it for `imap.svg`.

### 2.3 Brand personality

| We are | We are not |
| --- | --- |
| Calm, orderly, welcoming | Bureaucratic, cold, punitive |
| Plain-spoken and specific | Vague, promotional, overstated |
| People-first | Institutional or corporate |
| Honest about what is still pending | Inventing official facts |

---

## 3. Colour

### 3.1 Core palette (exact tokens)

These values are the approved Golden Harvest palette. They cover roughly 90% of every screen.

| Token | Hex | CSS variable | Use |
| --- | --- | --- | --- |
| Harvest Cream | `#FAF6EB` | `--color-canvas`, `--color-cream` | Page and card surfaces |
| Rice Mist | `#F3EDDD` | `--color-mist` | App background, subtle rows |
| Soft Crop | `#DDEBD3` | `--color-mint` | Tinted cards, badges, selected states |
| Forest Green | `#386B48` | `--color-pine` | Primary actions, links, brand marks |
| Young Crop Green | `#8DAF72` | `--color-leaf`, `--color-crop` | Illustration, borders, soft accents |
| Sky Wash | `#DCEEF7` | `--color-sky` | Quiet informational surfaces, hero sky |
| Harvest Sky Blue | `#83C5E2` | `--color-river` | River and water accents |
| Rice Straw Beige | `#EEDCB5` | `--color-straw` | Field illustration, warm fills |
| Deep Earth | `#354638` | `--color-forest`, `--color-earth` | Primary text, footer surface |
| Soft Border | `#E3D9C1` | `--color-line` | Dividers and card borders |
| Golden Rice | `#E5B84D` | `--color-rice`, `--color-gold` | Tiny pending/accent marker only |

Derived working tones (never brand colours):

| Token | Value | CSS variable | Use |
| --- | --- | --- | --- |
| Pine Deep | `#2B5437` | `--color-pine-deep` | Primary button hover |
| Muted text | `#5F6A58` | `--color-muted` | Secondary copy at AA (5.7:1 on white) |
| Faint surface | `#FDFAF1` | `--color-subtle` | Nested panels inside cards |
| Pending wash | `#FDF3DE` | `--color-pending-bg` | Pending badge background |
| Pending ink | `#8A6116` | `--color-pending-ink` | Pending badge text |
| Ready wash | `#DDEBD3` | `--color-ready-bg` | Ready badge background |
| Ready ink | `#386B48` | `--color-ready-ink` | Ready badge text |
| Received wash | `#F3EDDD` | `--color-received-bg` | Received badge background |
| Received ink | `#55624B` | `--color-received-ink` | Received badge text |
| Rejected wash | `#FBECEC` | `--color-rejected-bg` | Rejected badge and error panel |
| Rejected ink | `#9C3F3F` | `--color-rejected-ink` | Rejected text, destructive actions |

### 3.2 Semantic tokens

| Semantic token | Resolves to |
| --- | --- |
| `surface/default` | Harvest Cream `#FAF6EB` |
| `surface/subtle` | Rice Mist `#F3EDDD` |
| `surface/faint` | Faint surface `#FDFAF1` |
| `surface/mint` | Soft Crop `#DDEBD3` |
| `surface/sky` | Sky Wash `#DCEEF7` |
| `brand/primary` | Forest Green `#386B48` |
| `brand/primary-hover` | Pine Deep `#2B5437` |
| `brand/soft` | Young Crop Green `#8DAF72` |
| `brand/accent` | Golden Rice `#E5B84D` |
| `text/primary` | Deep Earth `#354638` |
| `text/secondary` | Muted text `#5F6A58` |
| `text/inverse` | White |
| `text/brand` | Forest Green |
| `border/soft` | Soft Border `#E3D9C1` |
| `border/strong` | Young Crop Green |
| `border/focus` | Forest Green |

Status tokens:

| Status | Background | Foreground |
| --- | --- | --- |
| `pending` | `#FDF3DE` | `#8A6116` |
| `ready` | `#DDEBD3` | `#386B48` |
| `received` | `#F3EDDD` | `#55624B` |
| `rejected` | `#FBECEC` | `#9C3F3F` |
| Error | `#FBECEC` panel, `#9C3F3F` text and border tint | — |

### 3.3 Contrast (measured)

| Pair | Ratio | Result |
| --- | --- | --- |
| `text/primary` on Harvest Cream | 9.33:1 | AAA |
| `text/primary` on Rice Mist | 8.62:1 | AAA |
| `text/primary` on Soft Crop | 8.11:1 | AAA |
| `text/secondary` on white | 5.69:1 | AA |
| `text/secondary` on Soft Crop | 4.58:1 | AA |
| White on Forest Green | 6.24:1 | AA |
| Forest Green on Harvest Cream | 5.78:1 | AA |
| Forest Green on Soft Crop | 5.02:1 | AA |
| Rejected `#9C3F3F` on white | 6.57:1 | AA |
| Rejected `#9C3F3F` on `#FBECEC` | 5.73:1 | AA |
| Deep Earth on Golden Rice | 5.42:1 | AA |

**Rules that follow from the measurements**

- Body copy on cream or tinted surfaces uses `text/primary` or the AA-safe `text/secondary` (`#5F6A58`). There is no tertiary text token in the implementation.
- Status is always communicated with a word as well as colour. Never rely on the badge colour alone.
- The implementation uses solid equivalents rather than alpha values: `--color-muted: #5F6A58` for secondary copy.
- Placeholder text is lighter than body copy and is always paired with a persistent visible label.
- Error and rejection text is `#9C3F3F` on `#FBECEC`, never colour alone: every error and rejection includes a written message.

### 3.4 Functional error colour

`#9C3F3F` was added because the approved palette has no error or rejection colour. It is used only for:

- rejected badges and rejection text (on `#FBECEC`);
- form error states, inline validation, and destructive confirmations.

It is never used for decoration, emphasis, or general UI. It is not part of the brand palette. **Confirm this exception before launch.**

### 3.5 Colour usage

- Harvest Cream is the default surface. Rice Mist is the page background, not a section colour.
- Soft Crop marks selection, readiness, and quiet emphasis.
- Forest Green carries actions and links. One primary action per view.
- Deep Earth is a text colour first; inverse cream text sits on Forest Green in the resident ID card and buttons.
- Golden Rice appears in small amounts: the pending badge accent, the ID card stripe, and at most one accent per screen. The landing illustration is the one deliberate exception, where fields and sunlight are built from the same palette.
- No orange, purple, pink, peach, neon, dark mode, or heavy gradients.

---

## 4. Typography

### 4.1 Families

- **Pixelify Sans** — headings and display. Weight 700 (loaded 400–700). The pixel face carries the countryside illustration language through the public surface while staying legible at portal sizes.
- **Lato** — body, navigation, buttons, forms, labels. Weights 400, 700, 900.

Both are already configured in `app/layout.tsx` and `app/globals.css`.

### 4.2 Type scale

| Style | Family / weight | Size / line | Use |
| --- | --- | --- | --- |
| `display-hero` | Pixelify Sans Bold | 38–70 / 1.03 | Landing hero only |
| `display-xl` | Pixelify Sans Bold | 40–60 / 1.08 | Public page opener |
| `display-lg` | Pixelify Sans Bold | 32–44 / 1.12 | Auth panel, confirmation |
| `heading-1` | Pixelify Sans Bold | 28–36 / 1.2 | Portal page title |
| `heading-2` | Pixelify Sans Bold | 22–28 / 1.25 | Section title |
| `heading-3` | Pixelify Sans Bold | 20 / 1.35 | Card and subsection title |
| `heading-4` | Pixelify Sans Bold | 17 / 1.4 | Small card title |
| `eyebrow` | Lato Bold | 11 / 16, 18% tracking, uppercase | Section kicker |
| `body-lg` | Lato Regular | 17 / 28 | Landing lead paragraph |
| `body-md` | Lato Regular | 15 / 24.75 | Default body copy |
| `body-sm` | Lato Regular | 13 / 20 | Supporting copy, metadata |
| `label-md` | Lato Bold | 14 / 20 | Buttons, links, field labels |
| `label-sm` | Lato Bold | 12 / 16 | Table headers and fine labels |

### 4.3 Typesetting rules

- Headings use sentence case. Labels and kickers may use uppercase with tracking.
- Keep body line length to 60–75 characters on desktop and 45–60 on mobile.
- Never centre long paragraphs; centre only short hero or confirmation copy.
- Do not use more than three type sizes in a single card.
- Numerals in counters use Pixelify Sans Bold at 30–36 px; supporting text stays `body-sm`.
- Sentence punctuation stays outside quotation marks unless it belongs to the quote.

---

## 5. Spacing, radius, elevation

### 5.1 Spacing scale

`4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128` px.

Common patterns:

| Context | Spacing |
| --- | --- |
| Inside a small badge or chip | 4–8 |
| Icon to label | 8–10 |
| Field label to input | 4–8 |
| Card padding | 16 (mobile) / 24–28 (desktop) |
| Stacked content in a card | 12–18 |
| Between cards | 16–20 |
| Between page sections | 28–64 |
| Desktop page gutter | 32 |

### 5.2 Radius

| Token | Value | Use |
| --- | --- | --- |
| `--radius-sm` | 8px | Tiny chips |
| `--radius-md` | 12px | Inputs, icon tiles, **all buttons, tabs, and filter chips** |
| `--radius-lg` | 16px | Compact cards |
| `--radius-xl` | 20px | Standard cards and panels |
| `--radius-2xl` | 24px | Feature panels, modals |
| `--radius-3xl` | 32px | Hero and highlight panels |
| `rounded-full` | 999px | Badges, avatars, the mobile nav active indicator only |

### 5.3 Elevation

| Token | Value | Use |
| --- | --- | --- |
| `--shadow-subtle` | `0 2px 6px rgba(23,41,33,.04)` | Resting cards |
| `--shadow-card` | `5px 5px 0 rgba(53,70,56,.13)` | Cards that need separation from Rice Mist |
| `--shadow-raised` | `0 12px 36px rgba(23,41,33,.08)` | Floating hero slip, carousel cards on hover |
| `--shadow-modal` | `0 24px 64px rgba(23,41,33,.14)` | Modals and sheets |

Prefer borders over shadows. Never stack more than one shadow on a surface.

---

## 6. Iconography

- 24 × 24 viewBox, 1.8 px stroke, rounded caps and joins, no fills except deliberate dots.
- Rendered sizes: 13–15 px inline, 17–19 px in controls, 21–23 px in navigation, 30–32 px in confirmation.
- Icons are line art. Do not mix filled and outline icons in the same row.
- Icons never replace a text label for a primary action.
- Decorative icons are hidden from assistive technology; meaningful icons receive an accessible name.

---

## 7. Illustration system

### 7.1 Files

| File | Used on |
| --- | --- |
| `components/landing/RiceFieldScene.tsx` | Landing hero: full-width pixel-art countryside, inline SVG with CSS-animated clouds, rice, river, birds, smoke, and villagers |
| `components/landing/CommunityMap.tsx` | Landing community section: illustrated top-down barangay map, inline SVG |
| `assets/illustrations/imap.svg` | Application logo and browser icon |
| `assets/illustrations/hero-community.svg` | Retained illustration asset; not used in the auth or resident portal |
| `assets/illustrations/service-desk.svg` | Retained illustration asset; not used in the request flow |
| `assets/illustrations/announcements-board.svg` | Retained illustration asset; not used in the announcements empty state |
| `assets/illustrations/admin-records.svg` | Retained illustration asset |
| `assets/illustrations/hero-barangay-wide.svg` | Retained wide scene from the earlier landing, available for future public pages |

The landing scene and map are original inline SVGs because their groups are animated with CSS. The other illustrations are original reusable SVGs imported through `next/image`.

### 7.2 Rules

- The public landing and signed-in portal use pixel art: flat colour blocks on a `480 × 270` unit grid, `shapeRendering="crispEdges"`, no anti-aliased curves, no gradients, no 3D. Neither style uses photorealism, emoji, or corporate stock art.
- People-focused: residents, families, staff, and everyday barangay moments. Show a range of ages and genders.
- Use the Golden Harvest palette: Soft Crop, Young Crop Green, Forest Green, Sky Wash, Harvest Sky Blue, Rice Straw Beige, Golden Rice, Deep Earth, and Harvest Cream.
- Always draw the full scene; do not crop people at awkward joints.
- Never bake text, numbers, logos, or official seals into an illustration.
- Keep a clear focal point and enough quiet space for nearby copy.
- SVG must have a `viewBox`, no external references, and no inline scripts.
- Provide meaningful `alt` text when the illustration carries information; use empty `alt` when it is decorative.

### 7.3 What to avoid

- Government seals, flags, or portraits presented as official.
- Money, gifts, or favours changing hands.
- Crowds or queues that imply real service volumes.
- Anything that suggests a request is approved automatically.

---

## 8. Components

Component sets live on **Components and States** in Figma. In code they live in `components/ui/` and `components/` and share the classes in `app/globals.css`.

| Code component | File | Notes |
| --- | --- | --- |
| `Button`, `ButtonLink`, `buttonClasses` | `components/ui/Button.tsx` | One 12 px corner for every button; variants: primary, secondary, quiet, ghost, dangerQuiet, danger, dangerSoft, gold; sizes sm/md/lg |
| `StatusBadge`, `Badge` | `components/ui/Badge.tsx` | Real status vocabulary plus neutral/green/sky/gold/danger tones |
| `Modal` | `components/ui/Modal.tsx` | Escape/backdrop close, scroll lock, busy state, tone, sizes |
| `EmptyState` | `components/ui/EmptyState.tsx` | Icon or illustration, title, explanation, optional action |
| `PageHeader` | `components/portal/PageHeader.tsx` | Shared pixel-landscape header: eyebrow, title, description, optional action |
| `AnnouncementCard` | `components/AnnouncementCard.tsx` | Category badge, date, title, body; compact variant for the overview |
| `FeedbackModal` | `components/FeedbackModal.tsx` | Success/error/info dialog built on `Modal` |
| `ServiceIcon` | `components/ui/ServiceIcon.tsx` | Maps the five real document types to line icons |
| Icon set | `components/ui/icons.tsx` | 24 × 24 line icons, 1.7 px stroke |
| `SiteHeader`, `SiteFooter` | `components/` | Public navigation and illustrated footer |
| `RiceFieldScene` | `components/landing/RiceFieldScene.tsx` | Animated pixel-art countryside hero |
| `CommunityMap` | `components/landing/CommunityMap.tsx` | Illustrated top-down barangay map with map link |
| `PortalHeader` | `components/portal/PortalHeader.tsx` | Resident header: desktop tabs plus a mobile bottom bar |
| `RequestSlip` | `components/RequestSlip.tsx` | Print/download slip, real `RQS-XXXXXXXX` number |

### 8.1 Button

Variants: `primary | secondary | quiet | ghost | dangerQuiet | danger | dangerSoft | gold` × sizes `sm | md | lg`.

| Type | Look | Use |
| --- | --- | --- |
| Primary | Forest Green fill, cream label | One main action per view |
| Secondary | White fill, soft border, forest label | Alternate action |
| Quiet | White fill, muted label | Header links such as Resident view or Sign out |
| Ghost | Transparent, brand label | Tertiary or in-row action |
| Danger | Solid error red, white label | Destructive confirmation only |
| Danger soft | Pale error wash, error text | Low-emphasis destructive action |
| Danger quiet | White fill, muted label, red on hover | Sign out |
| Gold | Golden Rice fill, deep-earth label | Rare highlight, never a primary action |

- **One corner radius for every button: 12 px (`rounded-xl`).** Tabs, filter chips, segmented controls, and header actions use the same geometry. Pill shapes belong to badges, avatars, and the mobile nav indicator, never to buttons.
- Height scale: `sm` 40 px, `md` 44 px, `lg` 48 px. Mobile primary actions use `md` or `lg`.
- Label is a verb phrase: “Request a document”, “Mark received”.
- Hover darkens to Pine Deep. Disabled stays visible but muted and is not interactable.
- Do not place two primary buttons side by side.
- Modal headers already carry a close control, so modal footers hold actions only — never a redundant “Close” button.
- One destination appears once as a button. Move secondary row actions into the detail modal instead of repeating them on every row.

### 8.2 Badge

Variants: `Status=Pending | Ready | Received | Rejected`.

- Shape: full pill, `label-sm`, 10 × 4 padding.
- Text always names the status; colour is secondary.
- Mapping to the real data: `pending`, `ready`, `received`, `rejected` only.
- Do not invent `claimed`, `approved`, `completed`, or `cancelled`; the application never writes them.

### 8.3 Input

Variants: `State=Default | Focus | Error | Disabled`.

- Visible label above the field. Required fields use `*`; optional fields say “Optional”.
- Helper text sits below the field and explains what to enter, not what went wrong.
- Error state pairs a `#9C3F3F` border, error helper text, and a plain-language message.
- Focus uses a 2 px Forest Green ring with a 2 px offset.
- Disabled fields remain readable and explain why they are locked (for example, “Locked from your verified profile”).
- Touch target at least 44 px. Never use placeholder text as the only label.

### 8.4 Nav Item

Variants: `State=Default | Active`.

- Default: muted text and icon on transparent.
- Active: Forest Green text and icon on `surface/mint`, full pill.
- The public header uses the same 12 px corner as buttons, not pills. The resident portal uses one navigation pattern instead of scattering buttons across the page:
  - tablet/desktop: a two-row sticky header — brand and account on top, section tabs below (Overview, Request a document, Announcements, My ID, plus Staff workspace for admins);
  - mobile: a fixed bottom bar with the same destinations, icons, and short labels.
- Top navigation bars stay clean: logo, account, and section links only. Illustrations live in the page header or hero, never behind nav controls.
- All resident-facing page headers use the same `PageHeader` component and pixel countryside scene, so the portal feels like one place.
- Contextual actions stay inside the card they belong to. There is one primary action per screen, and the same destination never appears twice as a button.
- Each row is at least 44 px tall; bottom-bar items are at least 58 px tall.
- `aria-current="page"` marks the active destination.

### 8.5 Tab

Variants: `State=Default | Active`.

- Used for request filters and queue filters.
- Active tab uses a cream pill inside a Soft Crop track.
- Tabs must fit the available width at 390 px; shorten labels rather than truncating.
- Counts may appear in the label (“All 4”, “Pending 8”) but must come from live data at implementation.

### 8.6 Notice

Variants: `Tone=Info | Success | Attention`.

- Includes a line icon, a short title, and one or two sentences.
- Attention is for pickup reminders and time-sensitive but non-error information.
- Success confirms a completed action.
- Error and rejection use the `#9C3F3F` / `#FBECEC` tokens and a dedicated error treatment, not the Attention tone.
- Notices never contain a primary action; put the action beside or below the notice.

### 8.7 Document Card

- Icon tile, document name, one-line description, and a text action.
- Whole card is clickable at implementation; the visible action is the affordance.
- Cards in a row share equal width and height.
- Use only the five real document types: Barangay Clearance, Certificate of Indigency, Residency Certificate, Barangay ID Card, Business Clearance.

### 8.8 Stat Card

- Label, large number, and one-line explanation.
- Numbers are sample values in Figma and must come from live data at implementation.
- Cards in a row share the same height, even when the explanation wraps.
- Never show a statistic that the system cannot compute from real records.

### 8.9 Empty State

- One line illustration or icon, a short heading, one sentence, and one action.
- Explain what will appear here and how to make it appear.
- Do not blame the resident or imply a failure.

### 8.10 Logo

- Mark-only and full lockup variants.
- Keep proportions; never stretch, recolour outside the approved lockups, or add effects.
- Use the inverse lockup on Deep Earth.

---

## 9. Layout and responsiveness

### 9.1 Reference sizes

| Context | Reference |
| --- | --- |
| Landing desktop | 1440 wide, 1200 px content shell, 32 px gutters |
| Portal desktop | 1440 wide, 1200 px shell, top app bar with tabs, 32 px gutters |
| Mobile | 390 × 844, 20 px gutters, single column |

### 9.2 Breakpoints for implementation

| Range | Behaviour |
| --- | --- |
| ≥ 1280 px | Desktop: multi-column card grids, full tables, side summary rail |
| 768–1279 px | Tablet: two-column card grids, request summary moves above the form, tables stay inside a scroll container |
| < 768 px | Mobile: single column, fixed bottom navigation bar, cards instead of tables, stacked modal footers |

### 9.3 Reflow rules

- No horizontal scrolling at any width. Tables scroll inside their own wrapper below 1024 px.
- Do not shrink text below `body-sm`. Reduce columns and padding instead.
- The site and portal headers stay sticky. On mobile the portal swaps its tab row for a fixed bottom bar with the same destinations, and pages add bottom padding so the bar never covers content.
- Keep bottom-bar labels short (`Overview`, `Request`, `News`, `My ID`, `Staff`) and never rely on icons alone.
- Sticky footers must not cover the last field; add scroll padding equal to the footer height.
- Charts and calendars scroll or simplify; they never overflow the viewport.
- Test at 320, 390, 768, 1024, 1280, and 1440 px.

---

## 10. Motion

| Motion | Duration | Easing |
| --- | --- | --- |
| Colour and opacity change | 120 ms | ease-out |
| Card hover lift (2 px) | 180 ms | ease-out |
| Panel or sheet enter | 240 ms | cubic-bezier(0.2, 0.8, 0.2, 1) |
| Page section reveal | 320 ms | cubic-bezier(0.2, 0.8, 0.2, 1) |
| Announcement card stagger | 60 ms per card, 6 cards max | ease-out |
| Cloud drift | 48–120 s linear loop | linear |
| Rice sway | 4–6 s loop, 2 px travel | ease-in-out |
| River flow | 2.5–4 s loop | linear |
| Bird glide | 18–26 s loop | linear |
| Smoke rise | 6 s loop | ease-out |
| Villager idle | 4–5 s loop | ease-in-out |

- Motion clarifies change; it never delays a task.
- Animate opacity and transform only. Do not animate width, height, or layout properties.
- The landing landscape is the single approved looping decoration. Loops stay slow and ambient; there are no autoplaying carousels, parallax, or bouncing interfaces.
- Every scene loop is paused or reduced under `prefers-reduced-motion: reduce`, along with staged reveals and shared transitions.
- Respect `prefers-reduced-motion: reduce`: remove transforms, parallax, and looping scene motion; keep instant state changes.
- Focus and status changes are never animated in a way that hides the new state.

---

## 11. Content and voice

### 11.1 Principles

- Write like a helpful staff member at the hall: short sentences, plain words, no jargon.
- Address the resident as “you”. Refer to staff as “barangay staff”.
- Say what happens next and who does it.
- Be honest about time and status. Never promise automatic approval.
- Use Filipino greetings sparingly and naturally (“Magandang umaga”). Do not mix languages mid-sentence without reason.
- Dates use `DD Mon YYYY` (for example, `04 Nov 2026`).
- Slip numbers use the real `RQS-XXXXXXXX` format.

### 11.2 Status language

| Status | Resident-facing copy | Staff action |
| --- | --- | --- |
| `pending` | “With staff” / “Pending” | Mark ready or reject with a reason |
| `ready` | “Ready for pickup” | Mark received |
| `received` | “Received” / “Picked up” | Archived automatically |
| `rejected` | “Needs attention” plus the reason | Show the recorded reason |

### 11.3 Required placeholder rules

- Missing official facts are written as bracketed placeholders, never guessed: `[Purok and street — to be confirmed]`, `[To be confirmed]`.
- Announcement content in the design is labelled `PLACEHOLDER`.
- Sample people, BID numbers, queue counts, and dates are labelled “sample data for layout”.
- Any tagline or hero sentence that is not approved stays marked in the handoff notes.
- Contact details, office hours, and address must come from the barangay before publication.

### 11.4 Error and rejection copy

- Say what happened, why, and what to do next.
- Never blame the resident.
- Example shape: “We could not accept this request because the address on your record does not match your proof of residency. Visit the hall with an updated document.”
- Always show the staff-recorded rejection reason verbatim when it is safe to display.

---

## 12. Accessibility

- Target WCAG 2.2 AA.
- Minimum touch target 44 × 44 px, with at least 8 px between adjacent targets.
- Visible focus ring: 2 px `border/focus`, 2 px offset, on every interactive element.
- Never remove focus outlines without a replacement.
- Use real `<button>`, `<a>`, `<label>`, `<input>`, `<table>`, and heading elements in implementation.
- Every input has a persistent visible label and programmatic association.
- Errors are announced and described in text, not colour alone.
- Status badges include the status word. Add a screen-reader prefix if the colour is the only visual differentiator.
- Images and illustrations have appropriate `alt` text; decorative art is hidden.
- Respect text zoom to 200% without loss of content or function.
- Support keyboard-only use for menus, tabs, dialogs, tables, and the mobile sheet.
- Respect `prefers-reduced-motion`.
- Do not use colour as the only way to identify the active tab or navigation item; pair it with weight, a pill, or an indicator.
- Secondary text uses `#5F6A58`, which passes AA on Harvest Cream and Soft Crop at all body sizes used in the app.

---

## 13. Implementation notes

### 13.1 Tokens and type

- All tokens live in `app/globals.css` inside `@theme` (`--color-*`, `--radius-*`, `--shadow-*`, `--container-page`).
- Use Tailwind utilities (`bg-mist`, `text-pine`, `border-line`, `shadow-card`) or `var(--color-*)` for edge cases.
- Reusable typography classes: `display-hero`, `display-xl`, `display-lg`, `heading-1`–`heading-4`, `eyebrow`, `body-lg`, `body-md`, `body-sm`, `label-md`, `label-sm`.
- Layout helpers: `page-shell` (max 1200 px, responsive gutters), `input-base`, `surface-card`, `interactive-card`, `skeleton`, `no-scrollbar`, `print-slip-area`.
- Fonts: Pixelify Sans for display and headings, Lato for body and forms, loaded in `app/layout.tsx`.
- Shadows are hard pixel offsets (`3px 3px 0`, `5px 5px 0`) rather than soft blurs, matching the pixel-art surface.
- Use `focus-visible` for focus rings so pointer users do not see them on click.
- Minimum interactive height is 44 px (`min-h-11` or button sizes).

### 13.2 Routes and data

| Route | Access | Data source |
| --- | --- | --- |
| `/` | Public | `announcements` (published) and the static service list; the map links out to Google Maps |
| `/auth` | Public | Supabase Auth; profile role check after sign-in |
| `/dashboard` | Resident or admin | `profiles`, `service_requests` for the signed-in user, latest 3 published announcements |
| `/dashboard/announcements` | Resident or admin | Published `announcements` with category filters |
| `/dashboard/request` | Resident or admin | `profiles`, inserts into `service_requests` |
| `/admin` | Admin only | `residents`, `service_requests`, `announcements` |

- Route protection is layered: `proxy.ts` refreshes the session and redirects anonymous visitors, `app/dashboard/layout.tsx` and `app/admin/layout.tsx` call `requireResident` / `requireAdmin` from `lib/auth.ts`, and RLS policies in Supabase are the real boundary. Client-side checks are only for clean UX.
- Never trust a hidden tab or client-side role check. Admin-only writes are enforced by `public.is_admin()` in the database.
- The public landing page must never query `profiles`, `residents`, or individual `service_requests`. It reads published announcements only.
- When a table or RPC is missing, show a calm placeholder and the setup note; never invent sample numbers in production.
- `announcements` is created by `supabase/migrations/20261105120000_security_hardening_and_announcements.sql`. Apply it before publishing announcements.

### 13.3 Accessibility and responsiveness

- Mobile request form is a single scrolling column with a summary rail that becomes a card above the form.
- Tables become stacked cards or scroll within their own container; the page itself must never scroll horizontally.
- Status badges always include the status word. Errors and rejections always include written text.
- Respect `prefers-reduced-motion`; the stylesheet reduces all animation and transition durations to near zero.
- Test at 320, 390, 768, 1024, 1280, and 1440 px.
- The Figma mobile screens are layout references, not a complete field inventory. The live request form has more fields than the four shown; preserve all required fields.

### 13.4 Illustration usage

- Illustrations are decorative or explanatory only. Never present them as photographs of the barangay.
- The landing hero uses the animated `RiceFieldScene`; the community section uses `CommunityMap`. Neither is presented as a photograph or a survey-accurate map.
- The auth page uses a single-column card over the pixel countryside backdrop. The register card scrolls from the top when it is taller than the viewport.
- Resident page headers reuse the pixel countryside through `PageHeader`; portal empty and success states use pixel icons rather than standalone vector illustrations.
- Do not bake text, seals, numbers, or logos into the SVGs.

---

## 14. Open items for approval

1. **Functional error colour `#9C3F3F`** — implemented for errors and rejections only. Confirm or supply an alternative.
2. **Official photos and contact details** — the footer uses “Contact details to be provided by the barangay.” and office hours are marked unconfirmed. Replace before launch.
3. **Taglines and hero copy** — drafts await barangay approval.
4. **Announcement content** — the noticeboard is empty until staff publish the first post; no sample announcements are shipped.
5. **Landing illustration and map** — the pixel-art scene is decorative, and the community map is an illustration rather than a survey-accurate plan. The “Open in Maps” link points to the barangay’s published Google Maps location. Confirm the pin before launch.
6. **Legacy routes** — resolved. `/register` redirects to `/auth?mode=register` and `/my-id` redirects to `/dashboard`; the old screens were removed.
7. **Tablet layout** — desktop and mobile artboards exist in Figma; tablet behaviour is specified in section 9 and should be reviewed during implementation.
