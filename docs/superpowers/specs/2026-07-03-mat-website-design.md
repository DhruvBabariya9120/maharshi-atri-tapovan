# Maharshi Atri Tapovan — Website Design Spec

**Date:** 2026-07-03
**Status:** Approved
**Source content:** `MAT_Website_Content_Updated.pdf` (authoritative), generic UI/UX brief (template — overridden where it conflicts).

## 1. Project

Marketing website for **Maharshi Atri Tapovan (MAT)** — a Gujarati-medium, GSEB, fully-residential school for boys (Primary Section + Std 4–10) in Piplaj, Gandhinagar. Established 2003. Gurukul/tapovan identity blending modern education with sanskar, sports, yoga, culture and moral values.

Goal: premium, modern, conversion-focused (admission enquiry), trustworthy multi-route site. Must prominently state **"Gujarat Board (GSEB) | Gujarati Medium"** to correct public confusion (some directories wrongly list it CBSE).

## 2. Decisions (locked)

- **Architecture:** Multi-route pages (React Router), NOT single-page anchor scroll. Overrides the PDF's "single-page" note per user choice.
- **Routes:** 9 content routes only. No empty template pages (`/courses`, `/faculty`, `/blog`, etc. omitted — no content exists for them).
- **UI stack:** Lean custom components + Tailwind v4 tokens + Framer Motion. No shadcn/ui.
- **Language:** English only now. Content stored as structured JSON shaped so a `gu` (Gujarati) translation can be added later without rework.
- **Dark mode:** Light-first design; tokens kept dark-ready so dark mode works without a redesign.

## 3. Design System

### Colors (Tailwind v4 `@theme` tokens in `index.css`, replacing current purple scaffold)
- Primary: Blue-700 `#1d4ed8` — navbar, primary buttons, links, icons, active nav states, highlights.
- Accent: Pink-400 `#f472b6` — CTA buttons, hover states, badges, decorative shapes, callouts.
- Section backgrounds: white / Blue-100 `#dbeafe` tint / Pink-100 `#fce7f3` tint, alternated for hierarchy.
- Neutral ink for text (heading + body), semantic border/muted tokens.

### Typography
- Headings: **Poppins**. Body: **Inter**. Self-hosted via `@fontsource/poppins` + `@fontsource/inter` (no external CDN → performance + reliability).
- Strong hierarchy: large bold display headings, clear section titles, comfortable line-height, accessible sizes.

### Surface
- Radius: `rounded-xl` / `rounded-2xl`. Shadows: subtle `shadow-sm/md/lg`. Glassmorphism on sticky navbar (blur on scroll) and select floating cards. Generous 8px-system whitespace.

## 4. Tech & Dependencies

Add:
- `react-router-dom` (v7) — routing
- `framer-motion` — animations
- `lucide-react` — icons (no emoji as UI icons)
- `@fontsource/inter`, `@fontsource/poppins` — fonts
- `react-hook-form` + `zod` (+ `@hookform/resolvers`) — admission + contact forms
- `sonner` — toast notifications

Deliberately skipped (YAGNI — no such surface on this site): TanStack Query (no data fetching), TanStack Table (no tables), Recharts (no charts).

Existing stack retained: React 19, Vite, Tailwind CSS v4, TypeScript.

## 5. File Structure

```
src/
  main.tsx              # BrowserRouter + route tree
  App.tsx               # layout shell: PageLoader, Navbar, <Outlet>, Footer, ScrollToTop, PageTransition
  index.css             # MAT design tokens + font imports
  data/
    site.ts             # ALL content from PDF + TODO placeholders; typed, gu-ready shape
  lib/
    motion.ts           # shared Framer Motion variants (fadeUp, fadeLeft, stagger, zoomIn)
  components/
    layout/             # Navbar, Footer, PageLoader, PageTransition, ScrollToTop, MobileMenu
    ui/                 # Button, Card, Badge, SectionHeading, Container, StatCounter,
                        # Accordion, Tabs, Timeline, GalleryGrid, TestimonialCarousel,
                        # ImagePlaceholder, Input, Select, Textarea, FormField, EmptyState, Skeleton
  pages/
    Home.tsx  About.tsx  Academics.tsx  CampusLife.tsx  Hostel.tsx
    Achievements.tsx  Gallery.tsx  Admissions.tsx  Contact.tsx  NotFound.tsx
  assets/
    logo.svg            # copied from School_Logo.svg
```

## 6. Routes → Content Mapping (all sourced from PDF)

| Route | Hero + sections |
|---|---|
| `/` (Home) | Hero: headline "Where a Boy Becomes a Balanced Man", sub-headline, CTAs (Admission Enquiry → /admissions, Explore Campus Life → /campus-life). Stats strip (2003 serving since / Primary+Std 4–10 / 100% SSC last 3yr / Top 3 in Gujarat SSC 2026 / 50+ activities). About teaser. Why-MAT feature grid. Academics + Campus Life + Hostel previews. Achievements strip. Gallery preview. Testimonials carousel. Admission CTA banner. GSEB-medium correction badge. |
| `/about` | Hero. About the School intro. "The Meaning Behind Our Name". Vision. Mission (6-point list). Message. "From the Chairman's Desk" quote card (Shri Bharatbhai B. Thummar, chairman.jpg placeholder). |
| `/academics` | Hero. Board / Medium / Classes / Study model / Assessment info cards. Weekly Test System. Board Results (100% SSC 3yr, top 3 in 2026). Facilities grid (8: Smart Digital Classrooms, Playground, Prayer Hall, Library, Computer Lab, Science Lab, Skill Development, Environment). |
| `/campus-life` | Hero (50+ activities intro). Tabbed/sectioned: Spirituality & Discipline; Sports & Physical Training (20+ item icon grid); Culture, Arts & Expression; Life Skills & Personal Growth. |
| `/hostel` | Hero ("A Second Home"). Intro. Facilities grid (8: airy rooms, bed & locker, organic food, clean water, washing areas, full CCTV, daily sanitation, peaceful campus). "A Day at the Tapovan" timeline (timetable; sample rows marked TODO). |
| `/achievements` | Hero. Award cards: Best School for Cultural Values & Moral Education (Govt of Gujarat, TODO details), 100% SSC 3yr running, National & International Sports Players (TODO names), Champions of Culture & Historical Drama. |
| `/gallery` | Hero. Filterable masonry grid, 6 categories (Annual Function, Sports, Festivals, Yoga/Prayer, Art/Craft/Music, Campus/Hostel). Placeholder tiles until photos supplied. |
| `/admissions` | Hero. Eligibility list. 4-step process timeline (Enquiry → Campus Visit → Interaction/Assessment → Confirmation). Documents Required list. Admission Enquiry form (fields: Student Name*, Standard* select, Parent Name*, Mobile* tel, Village/City, Question textarea; RHF + Zod validation; success toast "Thank you! Our office will call you within 1–2 working days."). Form submit is a stub (TODO: wire to email/WhatsApp/Sheet/ERP). |
| `/contact` | Hero. Address / Office hours (8AM–12PM) / Phone (TODO) / Email (TODO) info cards. Google Maps embed placeholder. Contact form. Social icons (TODO/remove). |
| `*` | NotFound (404) with route back home. |

Footer (all routes): logo, about blurb, quick links (About, Academics, Hostel, Admissions, Gallery, Contact), contact info, newsletter input (stub), social icons, copyright "© 2026 Maharshi Atri Tapovan, Piplaj. All rights reserved.", legal links.

## 7. Images

No real photos available. Reusable `<ImagePlaceholder>`: soft blue/pink gradient, centered lucide icon + label, fixed aspect ratios per usage (hero, card, gallery tile, avatar). Real assets (`hero-1..4.jpg`, `chairman.jpg`, gallery images) drop in later by swapping the placeholder. Logo SVG copied into `src/assets/logo.svg`.

## 8. Motion (Framer Motion)

- **Page loader:** logo fade-in + scale + gradient-pulse ring, then smooth fade-out on app ready.
- **Route transitions:** AnimatePresence fade/slide between pages.
- **Scroll reveals:** fadeUp / fadeLeft / fadeRight / zoomIn / staggered children via `whileInView` (once).
- **Stat counters:** count-up animation when scrolled into view.
- **Hover:** card lift + shadow expansion + optional border glow; button lift/scale + gradient transition; icon micro-interactions (scale/rotate); image zoom on gallery tiles.
- **Nav:** animated underline, active-route indicator; full-screen mobile menu with open/close animation.
- Durations 150–300ms; respect `prefers-reduced-motion`.

## 9. UX States & Accessibility

- Forms: inline validation errors, loading/disabled submit, success via sonner toast + inline confirmation.
- Empty states (gallery/placeholders) with icon + helpful text.
- Skeleton loaders where relevant.
- Semantic HTML, visible focus rings, ARIA where needed, sufficient contrast (WCAG), ≥44px tap targets, keyboard navigable.
- Mobile-first responsive across sm / md / lg / xl / 2xl. No horizontal overflow at any width.

## 10. Content Integrity

All `TODO` items in the PDF (phone numbers, email, Google Maps link, social links, campus/hero/chairman/gallery photos, exact award title & year, national/international player names, remaining timetable rows, fee structure, real testimonials) are rendered as clearly-marked placeholders — never fabricated as real data. Sample testimonials from the PDF are labelled as samples.

## 11. Out of Scope

- Backend / form submission wiring (stub only; TODO markers left).
- Real Gujarati translations (structure prepared, content not written).
- Real media assets (placeholders in place).
- CMS / admin.
