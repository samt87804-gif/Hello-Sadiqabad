# 04 — UI/UX Design Brief
Project: Hello Sadiqabad v2. Design must feel like a trusted local phone book: fast, warm, uncluttered, and easy for non-technical and Urdu-reading users.

## 1. Design Direction
- **Mobile-first** (360×640 first, then tablet and desktop). Thumb-friendly, one-handed use, big Call/WhatsApp buttons.
- **Clean and local:** calm emerald/teal identity with a warm amber accent. Avoid generic "AI template" look: no gradient overload, no stacked candy-pill badges, no meaningless stock decorations.
- **Zero-pill discipline:** show metadata inline with a `·` separator (e.g. `Hospital · Model Town · 4.5 ★`). Use real badges only for status (Verified, Open/Closed, Featured, Sponsored, Offer).
- Content-first: the phone number and action buttons are always the most visible thing on a business card/profile.

## 2. Colors (design tokens as CSS variables / Tailwind theme)
| Token | Light | Dark |
|---|---|---|
| `--brand-900` | `#064e3b` | `#d1fae5` |
| `--brand-600` | `#059669` | `#34d399` |
| `--brand-500` (primary) | `#10b981` | `#10b981` |
| `--accent` (amber) | `#d97706` | `#f59e0b` |
| `--bg` | `#f8fafc` | `#0b1210` |
| `--surface` | `#ffffff` | `#131c19` |
| `--border` | `#e2e8f0` | `#24312c` |
| `--text` | `#0f172a` | `#e7efe9` |
| `--muted` | `#64748b` | `#94a3a0` |
| `--danger` | `#dc2626` | `#f87171` |
| `--success` | `#16a34a` | `#4ade80` |
| `--whatsapp` | `#25D366` | `#25D366` |
Primary action buttons: emerald. Call button: emerald. WhatsApp button: WhatsApp green. Emergency: red. Amber only for highlights (offers, featured, sponsored). Contrast must meet WCAG AA in both themes.

## 3. Typography
- English: **Plus Jakarta Sans** (400/500/600/700). Urdu: **Noto Nastaliq Urdu** with `line-height: 2.1` and slightly larger size (+2px) so Nastaliq does not clip.
- Scale: 12 / 14 / 16 (body) / 18 / 20 / 24 / 30. Numbers (phones) use tabular numerals and are always LTR (`dir="ltr"`) even inside Urdu text.
- Fallback stacks required: `system-ui, -apple-system, Segoe UI, Roboto, sans-serif` and `'Noto Naskh Arabic', serif` for Urdu.

## 4. Language & RTL Design (key requirement)
- Language switch button in the header shows `EN | اردو`; the active one is highlighted.
- Urdu mode: `dir="rtl"`, icons that imply direction (arrows, chevrons) mirror; paddings/margins use logical properties (`ps-`, `pe-`, `ms-`, `me-`, `start`, `end`).
- **Urdu hints in English mode:** use the `Bi` component: `Call` + small muted Urdu `کال کریں` beside/below it (Urdu text size ≈ 0.8× and muted color, never replacing English). Apply to: bottom navigation labels, hero heading/search placeholder, Call/WhatsApp/Directions/Share/Save buttons, section titles, filter names, plan names, "Add your business", Emergency. Do not apply to long paragraphs. Hints can be switched off in the language menu.
- Business names/addresses: show the active language first; secondary language as a muted line when both exist.

## 5. Layout
- Container max width 1152px (`lg`), padding 16px mobile / 24px desktop. 8-pt spacing scale.
- **Mobile:** sticky top header (logo, search icon, language, theme, account) + **bottom navigation** (Home, Search, Categories, Emergency, Favorites) with safe-area padding (`pb-safe`).
- **Desktop:** top navigation bar with links, wider grid (cards 3–4 per row), footer with links.
- Home order: Announcement bar → Hero (title, search box, quick links) → Emergency strip → Popular categories (grid with icon + name) → Sponsored ad banner (if any) → Current offers (horizontal scroll) → Recently added listings → Recently viewed → Add-your-business CTA.

## 6. Components
- **Button:** variants primary / secondary / outline / ghost / danger / whatsapp; sizes sm / md / lg; min height 44px; loading state; icon slot. 
- **Input / Select / Textarea:** label above, helper + error text, 44px height, clear focus ring (emerald 2px).
- **Card:** white surface, 1px border, radius 16px, subtle shadow on hover only (desktop).
- **BusinessCard:** logo/cover thumb (ImageWithFallback), name (+ verified tick), category · area, rating, Open/Closed state, phone number visible, buttons Call and WhatsApp (if allowed) and Save heart. Premium cards get a thin amber top border; "Sponsored" label on ads.
- **Modal:** bottom-sheet on mobile, centered dialog on desktop; trap focus; close on Esc/back.
- **Toast:** bottom center, 4s, success/error icons.
- **Skeleton, EmptyState, ErrorState, ConfirmDialog, Tabs, Table (responsive → cards on mobile), Pagination/Load more, Lightbox (gallery), Charts (simple SVG line/bar).**
- **OpenNowBadge**, **OpeningHoursTable** (today highlighted), **StarRating**, **ShareSheet**, **QrCodeModal**.
- **Admin tables:** sticky header, filters row, bulk-select checkbox column, row actions menu; on mobile collapse to stacked cards.

## 7. Key Screens (guidance)
- **Business profile:** cover image, logo overlapping, name + badges, sticky action bar at bottom on mobile (Call · WhatsApp · Directions · Share). Sections: About, Services, Opening hours, Offers, Gallery, Videos, Location (map), Reviews (+ write), Contact details, Report/Suggest, Related.
- **Search:** sticky search field, horizontally scrollable quick filter chips (Open now, Verified, Offers, Delivery), "Filters" bottom sheet for category/area/rating, sort dropdown, results count, Load more.
- **Emergency:** very large red call buttons, grouped by type, works offline.
- **Owner portal:** simple left nav on desktop / top scroll tabs on mobile; dashboard with big stat tiles and a "What to do next" checklist (add photos, add hours, add offer).
- **Admin:** dense but readable; left sidebar on desktop, drawer on mobile; permission-based tabs; counters (badges with numbers) on Moderation/Leads.

## 8. Motion
Subtle only (150–250ms): fade/slide for modals, toasts, route transitions; skeleton shimmer. Respect `prefers-reduced-motion`.

## 9. Accessibility
Semantic HTML, landmarks, `aria-label` on icon buttons, `aria-live` for toasts, visible focus ring, tap targets ≥ 44×44px, color is never the only signal, correct `lang` and `dir`, alt text on all images (business name), form labels linked to inputs, keyboard-operable modals/menus.

## 10. Images & Icons
- All images are HTTPS URLs (PhotoToURL). Use `ImageWithFallback` (neutral placeholder with category icon) and `loading="lazy"`, fixed aspect ratios (logo 1:1, cover 16:9, gallery 4:3, ad banners per placement).
- Icons: `lucide-react` for UI icons. Category icons are stored as an icon name string in `categories.icon` (lucide name) with `categories.color`.
- Final project images list (logo, hero/illustrations, favicons/PWA icons 192/512, OG image 1200×630, empty-state illustrations, category icon set if custom) will be produced later in the **Images workflow** after the site is built; until then use lucide icons and neutral placeholders — never random stock URLs.
- PWA icons: 192×192 and 512×512 PNG, maskable.
