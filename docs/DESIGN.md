# DESIGN.md: Will Hammond, Photography

**Status:** v1 spec, ready to build. The engineer implements it exactly as written. If code and this document disagree, this document wins. If this document is silent on something, ask; don't improvise. Tokens live in `src/styles/tokens.css` and must match section 2–5 values byte for byte.

**Direction:** dark gallery. The background is a warm near-black, and the photographs are the only saturated thing on screen. There is one grotesk typeface and motion only where photos move.

**Site:** `https://willhammondhimself.github.io/photography/`. Astro 7.4.x, static output, GitHub Pages, base `/photography`.

---

## 1. Design principles

1. **The photograph is the loudest thing on every screen.** UI type is small, neutral and solid. Nothing sits on top of a photo except one solid label chip (Archive hover title) and the Index counter. There are no gradient scrims, glass or hero headlines. The name is small in the top-left, and the first photo is the hero.
2. **Never crop what Will framed.** Every image shows at its native aspect ratio in every view: Index, Series, Archive, Viewer and the morph between them. Exactly one crop exists on the site: the Index opener on phones (4:5, focal point from data). It is flagged and excluded from the morph.
3. **Edit like a book, index like a contact sheet.** The Index and Series pages are hand-sequenced plates with deliberate pacing: full-bleed, pairs, a single small image with rest space. The Archive is the opposite. It is dense, orderly and uncurated, with hairline gutters. Never mix the two modes.
4. **One voice in type.** One family (Schibsted Grotesk) and one text weight. The 500 weight is only for the wordmark. There are four sizes, sentence case everywhere, and numbers that mean something: series number, plate position, counts, dates.
5. **Motion follows the photo.** Animation happens where a picture moves between places: thumbnail-to-viewer morph, viewer slide, filter reflow, image settling in after decode, and the opener receding. Text, chrome and counters never perform.
6. **Color has jobs.** Structure is warm neutral with three clear text steps, never gray-on-gray. One accent, "AF green", means *current / selected* and nothing else. Keyboard focus is white and never looks like selection. Photos are never desaturated, tinted or dimmed by default.
7. **Documents first.** Every page is static HTML that fully works with JavaScript off. JS adds the morphs, keyboard and swipe, in-place filtering and preloading. It never gates content.

---

## 2. Color

### 2.1 Tokens

```css
:root {
  /* Surfaces */
  --ink-0: #121110;  /* canvas. Warm near-black. Not #000, not Tailwind gray/neutral/zinc/stone-900 */
  --ink-1: #1B1A18;  /* chips, list-view row hover, placeholder fallback */
  --line:  #2E2C29;  /* hairlines: sticky filter bar edge, list/table rules. Decorative only */

  /* Text */
  --fg:    #ECE9E3;  /* primary: titles, active items, values */
  --fg-2:  #A39E96;  /* secondary: nav items, place/date, labels */
  --fg-3:  #8A857E;  /* tertiary: counts, plate numbers, inactive facets, footer */

  /* The one accent: "AF green", the viewfinder focus-confirm signal */
  --accent: #9ED36A;

  color-scheme: dark;
}
```

### 2.2 Contrast (WCAG 2.2, computed)

| Foreground | on `--ink-0` #121110 | on `--ink-1` #1B1A18 | Use | AA |
|---|---|---|---|---|
| `--fg` #ECE9E3 | **15.57:1** | 14.35:1 | primary text, focus ring | pass (AAA) |
| `--fg-2` #A39E96 | **7.09:1** | 6.53:1 | secondary text | pass (AAA) |
| `--fg-3` #8A857E | **5.15:1** | 4.75:1 | tertiary text, any size | pass |
| `--accent` #9ED36A | **10.76:1** | 9.92:1 | state marker (non-text, ≥3:1 needed) | pass |
| `--line` #2E2C29 | ~1.3:1 | — | decorative rules only, never the sole indicator of anything | n/a |

All text, including 13px captions, meets 4.5:1 on both surfaces. No text token is dimmer than `--fg-3`. Text never sits directly on a photo. When text must appear over a photo, it sits on a solid `--ink-0` chip (15.57:1).

### 2.3 Color rules

- **Accent has one job: "this is the current state."** It appears in exactly two components:
  1. the 6×6px square marker before the active nav item
  2. the 6×6px square marker before each active filter facet

  It is never used for links, hover, focus, buttons, text, underlines, selection highlight, favicon backgrounds or decoration. On any screen at most about four accent squares are visible. The favicon is the one allowed reuse: an accent square on `--ink-0`.
- **Focus is white** (`--fg`) and never the accent. See 6.3.
- **Photos at full fidelity.** No `filter`, `mix-blend-mode`, opacity reduction or overlay on photos, except the Archive hover sibling-dim (opacity 0.5, only while the pointer is over the sheet).
- **Placeholders use the photo's own color.** The tile background is `color-mix(in oklab, var(--dom) 40%, var(--ink-0))`, never gray boxes or shimmer.
- **No gradients, glows, shadows, glass, grain or noise anywhere.** The single exception is the horizontal-scroll edge mask on the mobile filter row (`mask-image`, 24px fade). It is a functional affordance, not decoration.
- `::selection { background: var(--fg); color: var(--ink-0); }`
- No light theme and no theme toggle.

---

## 3. Typography

### 3.1 Family

**Schibsted Grotesk** (Bakken & Bæck for Schibsted), OFL-1.1, variable.
- Source: Fontsource, loaded via the Astro Fonts API provider `fontProviders.fontsource()`. Equivalent packages: `@fontsource-variable/schibsted-grotesk`, `@fontsource/schibsted-grotesk`.
- Weights: **400** (all text) and **500** (the wordmark only). Normal style only, no italics.
- Subsets: `latin` and `latin-ext`. The `latin` subset was verified to include `ʻ` (U+02BB, the ʻokina), `–`, `·` and `×`, so "Hawaiʻi" and "Kauaʻi" set correctly. Always write the ʻokina.
- Verified OpenType features: `tnum` and `pnum` (default figures are proportional), plus `frac`.
- It does **not** contain arrow glyphs (←, →, ↗), so the UI uses **words, not arrows**: "Previous", "Next", "Close", "All series". Don't add icon fonts or arrow SVGs.
- Fallback stack: `"Schibsted Grotesk", ui-sans-serif, system-ui, sans-serif`. The Fonts API generates a metric-matched fallback, so text shouldn't shift when the font loads.

**Why this face:** it's a newspaper grotesk with a slightly condensed, sturdy build and real tabular figures. It reads as edited, not as a startup. It is not one of the AI-default faces (Inter, Geist, Satoshi, General Sans, Space Grotesk, Manrope, DM Sans, Poppins). **There is no second family.** Monospace captions were considered and rejected because uppercase mono labels are a current AI-site tell. Italic serif series titles were also rejected because they belong to the cream, serif and terracotta default cluster.

### 3.2 Scale (four sizes, rem, fluid)

```css
:root {
  --step--1: clamp(0.75rem, 0.72rem + 0.12vw, 0.8125rem);  /* 12→13px  captions, metadata, counts, footer */
  --step-0:  clamp(0.875rem, 0.85rem + 0.12vw, 0.9375rem); /* 14→15px  UI: header, nav, filters, viewer band */
  --step-1:  clamp(1.0625rem, 1rem + 0.3vw, 1.25rem);       /* 17→20px  reading: series blurb, Info text */
  --step-3:  clamp(2.5rem, 1.6rem + 4vw, 5.5rem);           /* 40→88px  display: series titles, 404 */
}
```

| Token | Line height | Tracking | Used for |
|---|---|---|---|
| `--step--1` | 1.35 | +0.01em | plate captions, EXIF, counts, footer, Archive chip |
| `--step-0` | 1.35 | 0 | header, nav, filter bar, viewer band, list-view table |
| `--step-1` | 1.5 | −0.005em | Series blurb (max 38ch), Info text (max 42ch) |
| `--step-3` | 0.98 | −0.03em | Series list rows, Series page title, 404 |

The step is named `--step-3` rather than `--step-2` on purpose: the gap is deliberately large. There is no in-between heading size. If something seems to need one, it is a design problem. Ask first.

### 3.3 Weights, case, numerals

- 400 everywhere. 500 only for "Will Hammond" in the header. Active and current states are shown with color (`--fg`) plus the accent marker, never with bold.
- **Sentence case everywhere.** There are no uppercase labels, no letter-spaced eyebrows and no small caps. The only capitals are proper nouns and "ISO".
- `font-variant-numeric: tabular-nums lining-nums` on counters, counts, plate numbers, dates, EXIF and list-view columns. Proportional figures in running text.
- **Leading zeros** on series numbers (`02`), plate positions (`02.07`, `07`) and counters (`07 / 22`). Plain digits for counts (`148`).
- `font-kerning: normal; text-rendering: optimizeLegibility; -webkit-font-smoothing: antialiased;`. Antialiasing is set on purpose: light-on-dark text renders too heavy without it on macOS.

### 3.4 How captions and metadata are set

| Context | Format | Tones |
|---|---|---|
| Index plate caption | `07`  `Half Dome from Sentinel Bridge`  `Yosemite Valley, Jan 2026` | number `--fg-3`, title `--fg`, place and date `--fg-2`. One line on desktop (CSS grid, `column-gap: 1.5ch`); wraps to two lines on mobile (number + title / place, date) |
| Series plate caption | `02.07`  `Mauna Kea at blue hour`  `Hawaiʻi, Aug 2025` | same tones. `02` is the series number, `07` the position |
| Archive tile (hover/focus only) | solid `--ink-1` chip at bottom-left, inset 0.5rem: title only | `--fg` on `--ink-1` |
| Viewer band | title / place, date / EXIF label–value pairs / counter | labels `--fg-2`, values `--fg`. See 4.5 |
| Dates | captions: `Jan 2026`. EXIF: `14 Jan 2026` | `Intl.DateTimeFormat('en-US', …)`, reordered to day month year |
| EXIF values | `Sony A7C II` · `FE 24–70mm F2.8 GM II` · `35 mm` · `f/8` · `1/250 s` · `ISO 100` | en dash in lens ranges |

- Captions align to the **image's** left edge, not the column edge. The figure is `width: fit-content`.
- A caption has at most 3 fields. Copy must never contain em dashes.

---

## 4. Layout

### 4.1 Grid and spacing

```css
:root {
  --margin: clamp(1rem, 3vw, 3rem);       /* page side margin: 16px → 48px */
  --gutter: clamp(0.75rem, 1.5vw, 1.5rem);/* plate grid column gap */
  --sheet-gap: 0.25rem;                   /* Archive hairline gutter (4px) */
  --rest: clamp(4rem, 12vh, 10rem);       /* vertical rest between plates */
  --header-h: 3.5rem;                     /* 56px, desktop header row */
  --max: 110rem;                          /* 1760px max content width; Archive ignores it */
  /* spacing scale, 4px base */
  --s-1: .25rem; --s-2: .5rem; --s-3: .75rem; --s-4: 1rem; --s-6: 1.5rem;
  --s-8: 2rem; --s-12: 3rem; --s-16: 4rem; --s-24: 6rem;
  --radius: 0;                            /* everywhere. Photos, chips, inputs, focus rings */
}
```

| Breakpoint | Range | Columns |
|---|---|---|
| `sm` | < 640px | 4 |
| `md` | 640–1023px | 8 |
| `lg` | ≥ 1024px | 12 |
| `xl` | ≥ 1600px | 12 (content capped at `--max`, centered) |

- **Banned everywhere:** cards, borders around photos, `border-radius` greater than 0, shadows, uniform square thumbnails and `object-fit: cover` (except the mobile opener).
- **Photo sizing rule:** an image fills its column span's width unless that would exceed **88svh** in height. Then height is capped at 88svh, width follows the aspect ratio, and the figure is aligned within its span per plate type.

### 4.2 Global chrome

**Header** (all pages, in normal flow, *not* fixed, scrolls away)
- Desktop and tablet: one 56px row, solid `--ink-0`, padding-inline `--margin`.
  - Left: **Will Hammond** (500, `--step-0`, `--fg`), linking to Index.
  - Right: `Index   Series 6   Archive 148   Info` at `--step-0`, items `--fg-2` with gap 1.5rem. Counts are `--fg-3` with a 0.35em gap and tabular figures. Hover sets the item to `--fg` (120ms).
  - The active item is `--fg` with the 6px accent square 0.5rem to its left, vertically centered on the x-height.
- Mobile (`sm`): two rows. Row 1 (44px) holds the wordmark. Row 2 (40px) holds the four nav items at `justify-content: space-between`, without counts. **No hamburger and no menu button.**
- There is no hide-on-scroll and no shrink-on-scroll.

**Footer** (all pages except Viewer)
- One line, `--step--1`, `--fg-3`, links `--fg-2`, padding `--s-12` top / `--s-8` bottom: `Will Hammond   @willhammondhimself   {email}   2026`.
- Items are separated by 2ch gaps. There are no glyphs, icons or newsletter.

**Skip link:** "Skip to photographs" is the first focusable element. It is visible only on focus, as a solid `--ink-1` chip at top-left.

### 4.3 Index (`/photography/`)

The curated edit: 12 to 18 photos, sequenced by hand in `src/data/index.json`.

**Opener (plate 01)**
- Desktop and tablet: full-bleed (100vw, ignores `--margin`) at **native aspect ratio, uncropped**, directly under the header. A 3:2 landscape at 1440px wide is 960px tall and runs past the fold on purpose: the bottom edge invites scrolling. The opener must be landscape with aspect ratio ≥ 1.4 (validated at build).
- Mobile: full-bleed, `aspect-ratio: 4/5`, `object-fit: cover`, `object-position` from `photo.focus` (default `50% 50%`). This is the only crop on the site. The element has `data-cropped` and gets **no** morph name.
- Caption below it, inside `--margin`, as in 3.4.

**Sequence plates** (each `index.json` entry sets `plate`)

| `plate` | lg (12 col) | md (8 col) | sm (4 col) | Notes |
|---|---|---|---|---|
| `full` | 100vw bleed | 100vw bleed | 100vw bleed | landscape, AR ≥ 1.4 only. Rest above and below = `--rest × 1.5` |
| `wide` | cols 2–11, centered | cols 1–8 | cols 1–4 | |
| `left` | cols 1–7, figure left-aligned | cols 1–6 | cols 1–4 | |
| `right` | cols 6–12, figure right-aligned | cols 3–8 | cols 1–4 | caption still aligns to the image's left edge |
| `center` | cols 4–9, centered | cols 2–7 | cols 1–4 | for portraits. The rest space around it is the point |
| `pair` | cols 1–12, two figures, **equal height, no crop** (flex, `flex-grow` = each AR, gap `--gutter`) | same | same, but if the sum of ARs > 2.4, stack the two | one caption per image |

- Vertical rest between plates: `--rest`. Never stack two `full` plates back to back (build check).
- **Counter:** fixed at bottom-left, inset `--margin`, on lg and md only. It is a solid `--ink-0` chip, padding `0.25rem 0.5rem`, `--step--1`, tabular figures: `07 / 18` (`--fg` current, `--fg-3` " / 18"). It updates when a plate crosses the viewport's vertical center (IntersectionObserver with `rootMargin: -50% 0 -50% 0`). It is hidden on `sm` and when JS is off.
- **End of the edit:** after the last plate, `--rest × 1.5` of space, then one `--step-1` line in `--fg-2`, cols 1–6: "That's the edit. Six series are in Series, and all 148 photographs are in the Archive." "Series" and "Archive" are links. Counts are computed, never hard-coded.
- Every plate is an `<a data-photo href="photo/<id>/">` linking to the Viewer.

### 4.4 Series

**Series list (`/series/`)**

- lg: a two-zone layout.
  - **List** in cols 1–7, one row per series in `series.json` order. Each row is a single `<a>`: number `02` (`--step-0`, `--fg-3`, aligned to the title's cap height), title `Hawaiʻi` (`--step-3`, `--fg`), and on the same baseline right-aligned within col 7, the meta `Big Island and Kauaʻi  2025  22` (`--step-0`, `--fg-2`; the count in `--fg-3`). Row padding is `--s-3` vertical, with no rules between rows.
  - **Preview** in cols 8–12, `position: sticky; top: var(--s-8)`. It shows the hovered or focused series' cover at native aspect, max-height 80svh, aligned top-right. All covers are stacked in the DOM, and the active one has opacity 1.
  - Default (and no-JS) state: the first series' cover.
  - When any row is hovered or focused, the other rows' titles change to `--fg-3` (color, 200ms), as in Kai Blamey's list falloff.
- md and sm: no sticky preview. Each series is a block: cover image (full content width, native aspect, max-height 75svh), then the number and title (`--step-3`), then the meta line (`--step--1`, `--fg-2`). `--s-16` between blocks.

**Series page (`/series/<slug>/`)**

- Header block, cols 1–7 (sm: full):
  - `02` (`--step-0`, `--fg-3`)
  - `Hawaiʻi` (`--step-3`)
  - meta line `Big Island and Kauaʻi  Jun–Aug 2025  22 photographs` (`--step-0`, `--fg-2`)
  - blurb, 1–3 sentences in first person, `--step-1`, `--fg`, max-width 38ch, cols 1–6
  - `--s-24` below the header block.
- Plates: the same plate system as the Index (4.3), set per photo in `series.json`. Captions are numbered `02.07`. The first plate is never `full`.
- End block: `--rest × 1.5`, then a cols 1–4 cover thumbnail of the **next** series (native aspect) with its caption "Next  03  Climbing" (`--step-0`; "Next" in `--fg-2`). Next to it is "All series" (`--step-0`, `--fg-2`). The last series links to the first.

### 4.5 Archive (`/archive/`, `/archive/<category>/`)

Every photo, newest first: the contact sheet.

**Filter bar.** `position: sticky; top: 0`, solid `--ink-0`, 1px `--line` bottom border, z-index above tiles. Padding-inline `--margin`, `--step-0`.

- Row 1 (44px), categories:
  `All 148   Yosemite 42   Hawaiʻi 31   Climbing 24   Travel 22   Portraits 17   Events 12`
  - Labels `--fg-2` and counts `--fg-3`, with a 2ch gap between facets.
  - The active facet is `--fg` with the 6px accent square before it.
  - On the right of row 1: the live count `24 of 148` (`--fg-2`, tabular), or `148 photographs` when unfiltered.
- Row 2 (36px), refinements, JS only: `Camera  All  A7C II  S5        Year  All  2026  2025  2024        View  Sheet  List`
  - Group labels `--fg-3`, options `--fg-2`, active option `--fg` with the accent square.
  - Hidden with `@media (scripting: none)`.
- sm: both rows scroll horizontally (`overflow-x: auto; scroll-snap-type: x proximity; scrollbar-width: none`) with a 24px `mask-image` fade at the right edge. The count moves to the start of row 2.
- Categories with zero matches under the current camera/year filters stay visible in `--fg-3` with count `0`. They are never removed, so the layout doesn't jump.

**Sheet view (default): justified rows, native aspect ratios, CSS only**

```css
.sheet { display: flex; flex-wrap: wrap; gap: var(--sheet-gap); padding-inline: var(--margin);
         --row-h: clamp(8.5rem, 20vw, 20rem); }            /* 136px mobile → 320px wide desktop */
.sheet::after { content: ""; flex-grow: 1e6; }              /* last row keeps natural size */
.tile { position: relative; display: block;
        flex-grow: calc(var(--w) / var(--h));
        flex-basis: calc(var(--row-h) * var(--w) / var(--h));
        aspect-ratio: var(--w) / var(--h);
        background: color-mix(in oklab, var(--dom) 40%, var(--ink-0));
        overflow: clip; content-visibility: auto; contain-intrinsic-size: auto 20rem; }
.tile img { width: 100%; height: 100%; display: block; }    /* AR matches box: no cover, no crop */
```

Each tile carries `style="--w:6000;--h:4000;--dom:rgb(…)"` from data. Rows come out equal height and flush on both sides, with nothing cropped. Panoramas just take a wider share.

- **Hover/focus** (`@media (hover: hover) and (pointer: fine)`):
  - the hovered tile shows its title chip (3.4)
  - siblings go to opacity 0.5: `.sheet:has(.tile:hover) .tile:not(:hover)`
  - the hovered tile never scales or changes.
- **No captions** under tiles and no numbering.

**List view** (`?view=list`, JS only)
- lg: a table in cols 1–8 with columns **Title / Place / Series / Camera / Date** (`--step-0`). Headers are `--fg-3` sentence case, values `--fg-2`, title `--fg`. Rows are 1px `--line` rules, row height 2.5rem. The hovered or focused row gets an `--ink-1` background.
- lg: a sticky preview in cols 9–12 (`top: 6.5rem`) shows the hovered row's image at native aspect, max-height 70svh.
- sm: two lines per row (title / place, date) and no preview.
- Every row is a link to the Viewer.

**Empty state:** one line at `--step-0`, `--fg-2`: "No photographs match Climbing, S5, 2024." followed by the link "Clear filters". No illustration.

**URLs:**
- The category is the path, `/archive/climbing/`, pre-rendered for all six so it works without JS.
- Camera, year and view are query params: `?camera=s5&year=2025&view=list`.
- Every Archive page renders **all** tiles. Non-matching tiles get `hidden`, so JS can refilter without fetching, and lazy images inside hidden tiles never load.

### 4.6 Photo view (`/photo/<id>/`)

One static page per photo with a shareable URL.

**Sequence:** prev/next follow the photo's series order. Photos without a series follow Archive order (date descending). The counter shows that sequence: `07 / 22`, and the context link shows the series title.

**lg and md layout** (the page does not scroll on lg)
```
┌ header (56px) ──────────────────────────────────────────────┐
│ stage: height calc(100svh - 56px - band)                    │
│   image centered, contained: max-width calc(100vw - 2*--margin),
│   max-height 100% of stage minus --s-6 top/bottom padding   │
├ band (min 5.5rem, padding --s-4 --margin) ──────────────────┤
│ [cols 1–4] Title (--fg)              [cols 5–9] EXIF pairs  │ [cols 10–12, right-aligned]
│            Place, Jan 2026 (--fg-2)   Camera  Sony A7C II   │ 07 / 22  Hawaiʻi
│                                       Lens    FE 24–70mm…   │ Previous   Next   Close
│                                       … in 3 columns × 2 rows│
└─────────────────────────────────────────────────────────────┘
```
- **EXIF** is a two-column `<dl>` per pair (label `--fg-2`, value `--fg`, `--step--1`, tabular figures), in a 3×2 grid: Camera, Lens, Focal length / Aperture, Shutter, ISO. There are no icons. Missing fields are omitted, never shown as "—".
- **Stage click zones:** the left 33% and right 33% of the stage are the `rel="prev"` / `rel="next"` links (transparent, full stage height) with native `cursor: w-resize` / `e-resize`. The center third has the default cursor.
- **Text links in the band:**
  - "Previous" and "Next" are `--fg-2`, hover `--fg`, `aria-label="Previous photo"` / `"Next photo"`.
  - "Close" goes to the series page, or the Archive for unseried photos. With JS it behaves as Esc.
- The context link ("Hawaiʻi") goes to the series page. At the ends of the sequence, "Previous" or "Next" becomes `--fg-3` non-link text. It does **not** wrap around.

**sm layout** (page scrolls)
- Header.
- Image full content width at native aspect, max-height `calc(100svh - 10rem)`.
- Title and place, date, with the counter `07 / 22` right-aligned on the title line.
- `<details>` "Details" holding the EXIF `<dl>` as a single two-column table (native, works without JS).
- A row with "Previous", "Next" and "Close", spaced between.
- No click zones; swipe instead (5.6).

**Head:** `<link rel="prev">`/`<link rel="next">` are omitted (obsolete). The `<title>` is "Half Dome from Sentinel Bridge · Will Hammond". `og:image` is the 1280w JPEG.

### 4.7 Info (`/info/`)

- lg: two zones.
  - Cols 1–6: a 3–5 sentence first-person paragraph at `--step-1`, max 42ch. Placeholder for Will to finish (no adjectives about himself, no em dashes): "I'm Will Hammond, a student at {school}. I photograph climbing, the places I go to climb, and the people I go with, plus portraits and events around campus. Most of this was shot on a Sony A7C II, the rest on a Panasonic S5. For portraits or events, email me."
  - Cols 8–12: a label–value `<dl>` (`--step-0`, labels `--fg-2`, values `--fg`, 1px `--line` rules between rows): **Email** `{email}`, **Instagram** `@willhammondhimself`, **Based in** `{city}`, **Cameras** `Sony A7C II, Panasonic S5`, **Available for** `Portraits, events`.
- Optional: one photo of Will at native aspect in cols 8–12 above the `<dl>`, if he supplies one. Otherwise none.
- sm: stacked, paragraph first.
- No contact form, no logos, no "services".

### 4.8 404 (`/photography/404.html`)

- Cols 1–8: `404` (`--step-3`, `--fg-3`), then "This page doesn't exist." (`--step-1`, `--fg`), then links "Index", "Archive" (`--step-0`, `--fg-2`).
- No photo and no humor. Every link goes through `url()`.

---

## 5. Motion system

### 5.1 Tokens

```css
:root {
  --ease-out:    cubic-bezier(0.16, 1, 0.3, 1);   /* expo-out: arrivals, settles, reflow */
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);  /* symmetric: rubber-band return */
  --ease-exit:   cubic-bezier(0.4, 0, 1, 1);      /* departures */
  /* damped spring, ζ≈0.88, ~0.3% overshoot (imperceptible), settles ~590ms. Morph only. */
  --ease-spring: linear(0, 0.0533, 0.1726, 0.3156, 0.4571, 0.5844, 0.6918, 0.7784, 0.8455,
    0.896, 0.9327, 0.9586, 0.9764, 0.988, 0.9953, 0.9997, 1.002, 1.003, 1.0033, 1.0031,
    1.0027, 1.0022, 1.0018, 1.0014, 1);

  --dur-hover: 120ms;   /* color/opacity of text, chips */
  --dur-ui:    200ms;   /* list falloff, tile enter in filter */
  --dur-dim:   280ms;   /* sibling dim in, preview crossfade */
  --dur-exit:  200ms;   /* page out */
  --dur-page:  320ms;   /* page in */
  --dur-filter:420ms;   /* tile reflow on filter */
  --dur-marker:420ms;   /* accent marker glide */
  --dur-img:   500ms;   /* image settle after decode */
  --dur-morph: 560ms;   /* thumbnail ↔ viewer */
  --dur-slide-out: 240ms;
  --dur-slide-in:  420ms;
}
```

Rules:
- Animate only `transform` and `opacity` (and `color` for text).
- Exits run at about 60% of entrances.
- No overshoot is visible anywhere.
- No two easing families on one element.

### 5.2 Page load (first visit)

- **No loader, no splash, no intro sequence, no stagger.** Header, text and layout paint immediately.
- **Images settle in.** Each image sits on its dominant-color placeholder (tiles) or its 24px LQIP (plates, opener, viewer: `background-image` on the figure, `filter: blur(20px); transform: scale(1.1)` on a `::before` inside `overflow: clip`). Once the image loads it fades from opacity 0 to 1 over `--dur-img` `--ease-out`.
  - Images already `complete` when the script first runs get `is-loaded no-fade` and appear with no transition (no fade on cache hits).
  - The opacity-0 state applies only under `@media (scripting: enabled) and (prefers-reduced-motion: no-preference)`, so no-JS users never see invisible images.

### 5.3 Scroll

| Where | What | Spec |
|---|---|---|
| Index opener | **Recede**: as you scroll the first 70vh, the opener image scales 1 → 0.94, `transform-origin: 50% 0`, and pulls in from the screen edges toward the margins | scroll-driven CSS, `animation-timeline: scroll(root block)`, `animation-range: 0 70vh`, linear. Inside `@supports (animation-timeline: scroll())`. Applied to the opener's `<picture>` wrapper, not the `<img>` (which owns the load fade) |
| Series plates (2nd onward) | **Plate entry**: opacity 0.2 → 1, scale 1.025 → 1 | `animation-timeline: view()`, `animation-range: entry 0% cover 20%`, linear. Applied to the `<figure>`. Inside `@supports`. The default state is fully visible |
| Index counter | text swap | instant, no tween |
| Archive | **nothing** | tiles never animate on scroll |
| Header | nothing | scrolls away naturally. The Archive filter bar is sticky with no shrink |

Native scrolling only. No Lenis or any smooth-scroll library, no scroll hijacking, no parallax.
`html { scroll-behavior: smooth; }` applies only under `prefers-reduced-motion: no-preference`, and only affects the skip link.

### 5.4 Hover and focus (pointer: fine only)

| Element | Effect | Timing |
|---|---|---|
| Text links, nav, filter options | `--fg-2` → `--fg` | `--dur-hover` `--ease-out` in, 100ms out |
| Index/Series plate | the caption title gets a 1px underline (`text-underline-offset: 0.25em`, color `--fg-3`). The image does not change | `--dur-hover` |
| Archive tile | title chip opacity 0 → 1 (no movement). Siblings go to 0.5 | chip `--dur-hover`; dim `--dur-dim` in, `--dur-ui` out, `--ease-out` |
| Series list row | others → `--fg-3`; preview crossfades | `--dur-ui` color; `--dur-dim` opacity crossfade |
| List view row | `--ink-1` background | instant |

Nothing scales on hover, there are no shadows, and hover never hides the hovered item. Focus triggers the same effects as hover.

### 5.5 Navigation (Astro `<ClientRouter fallback="swap" />`)

| Transition | Old | New |
|---|---|---|
| Page (root) | opacity 1→0, `--dur-exit`, `--ease-exit` | opacity 0→1, `--dur-page`, `--ease-out`. No translate |
| Header (`view-transition-name: site-header`) | `animation: none` | `animation: none` (identical, so it simply holds still) |
| Nav accent marker (`view-transition-name: nav-marker`, on the active item's marker only) | — | the group glides from the old item to the new one, `--dur-marker`, `--ease-out`. On the Viewer (no active item) it fades out with root |
| **Thumbnail/plate → Viewer** (`photo` group) | — | morph: group `--dur-morph`, `--ease-spring`. `::view-transition-old/new(photo) { height: 100%; object-fit: contain; }` |
| **Viewer → back** | — | reverse morph onto the matching tile/plate. If it's off-screen, scroll it to center (`behavior: instant`) before the snapshot. If no match exists on the page, root crossfade only |

Rules (implementation detail in 8.6):
- Only **one** element per page carries `view-transition-name: photo` at a time. It is set on click and cleared after `finished`.
- Never give every tile a static name.
- The Viewer's full image is decoded before the new snapshot (wrap `e.loader`, race against 450ms).
- `data-cropped` elements (the mobile opener) are never named.
- Without View Transitions support, navigation simply swaps.

### 5.6 Viewer

| Input | Behavior |
|---|---|
| `→` / `←` | `navigate(next/prev, { info: { nav }, history: 'replace' })`. Ignored with modifier keys or when focus is in a form field |
| `Esc` | if `document.referrer` is same-origin under `/photography/`, `history.back()` (reverse morph to where you came from); else navigate to the Close href |
| Click left/right stage zone | same as arrows |
| Swipe (touch/pen on `[data-stage]`) | horizontal intent: \|dx\| > 1.5·\|dy\| |

- **Drag-follow:** the image translates with the finger at 0.35× resistance, capped at ±48px. This is the only physics on the site.
- Release with \|dx\| > 60px or velocity > 0.5 px/ms: navigate. The slide-out continues from the current offset.
- Release below the threshold: return to 0 over 300ms `--ease-in-out`.
- `touch-action: pan-y pinch-zoom` keeps vertical scroll and pinch-zoom native.

**Next/prev slide (no morph between different photos):**
```css
html[data-nav] ::view-transition-group(photo) { animation: none; }
html[data-nav="next"]::view-transition-old(photo) { animation: var(--dur-slide-out) var(--ease-exit) both out-left; }
html[data-nav="next"]::view-transition-new(photo) { animation: var(--dur-slide-in) var(--ease-out) both in-right; }
html[data-nav="prev"]::view-transition-old(photo) { animation: var(--dur-slide-out) var(--ease-exit) both out-right; }
html[data-nav="prev"]::view-transition-new(photo) { animation: var(--dur-slide-in) var(--ease-out) both in-left; }
@keyframes out-left  { to   { transform: translateX(-3rem); opacity: 0; } }
@keyframes in-right  { from { transform: translateX(3rem);  opacity: 0; } }
@keyframes out-right { to   { transform: translateX(3rem);  opacity: 0; } }
@keyframes in-left   { from { transform: translateX(-3rem); opacity: 0; } }
```
- The band text changes with the root crossfade.
- `data-nav` is set on `e.newDocument.documentElement` in `astro:before-swap` (it survives `swapRootAttributes`) and deleted after `finished`.
- **Preloading:** on `astro:page-load` in the Viewer, `requestIdleCallback` decodes the next and previous heroes' AVIF `srcset` into `new Image()`. The prev/next links carry `data-astro-prefetch="load"`.

### 5.7 Archive filter reflow

- Filter links carry `data-astro-reload`, so ClientRouter ignores them. `archive.ts` intercepts the click (`preventDefault`), and the update runs inside `document.startViewTransition({ update, types: ['filter'] })`:
  1. Before the update: tiles intersecting the viewport ±1 viewport height get `view-transition-name: match-element; view-transition-class: tile`. Fallback when `CSS.supports('view-transition-name: match-element')` is false: `vt-<id>`.
  2. Update: toggle `hidden`, update counts, the active markers and the live count, then `history.replaceState` to the canonical URL (`/archive/<category>/?camera=…`).
  3. After `finished`: clear the names.
- CSS:
  ```css
  html:active-view-transition-type(filter)::view-transition-old(root),
  html:active-view-transition-type(filter)::view-transition-new(root) { animation: none; }
  ::view-transition-group(.tile) { animation-duration: var(--dur-filter); animation-timing-function: var(--ease-out); }
  ::view-transition-new(.tile):only-child { animation: var(--dur-ui) var(--ease-out) both fade-in; }
  ::view-transition-old(.tile):only-child { animation: 160ms var(--ease-exit) both fade-out; }
  ```
- Filter-bar accent markers are named `filter-marker-cat`, `filter-marker-cam` and `filter-marker-year` and glide like the nav marker.
- Counts swap instantly. **No counting-up animation.**
- Sheet ↔ List toggle: plain root crossfade (`--dur-ui`), no morph.

### 5.8 What must NOT animate

- Text: no letter, word or line reveals, no scramble or typewriter, no counting numbers.
- Photos: no hover zoom, no Ken Burns, no grayscale-to-color, no blur-to-sharp on hover, no tilt.
- Layout: no width, height, top or left animation, and no `interpolate-size`.
- Chrome: no hide or shrink header, no magnetic buttons, no custom cursor or cursor follower, no marquee.
- Archive tiles on scroll; any stagger or cascade; any fade-up-on-scroll for text blocks.
- Loaders: no percentage loader, spinners or shimmer skeletons.
- Scroll: no Lenis, scroll-jacking, scroll-snap paging on vertical pages, or parallax.

### 5.9 `prefers-reduced-motion: reduce`

- All View Transition animations are off (Astro's built-in rule), so navigation, morph, slide and filter become instant swaps. The marker jumps.
- Scroll-driven recede and plate entry are off (rules sit inside `no-preference`).
- Image settle is opacity only, 150ms. This is applied with a separate rule outside the `no-preference` block: images still get the dominant-color placeholder and a short fade, because opacity is not vestibular.
- Drag-follow is off. Swipe still navigates on release.
- Hover sibling-dim and color changes stay (opacity/color only).
- `scroll-behavior: auto`.

---

## 6. Navigation and interaction details

### 6.1 Header and wayfinding
- Each of the five sections (Index, Series, Archive, Info, plus the Viewer via any image) is one click from every page except the 404, which links to two of them.
- The active nav item is determined by comparing `Astro.url.pathname` against `url('series/')` and the like as prefixes, pathname to pathname, never to bare slugs. The Viewer has no active item.
- Nav counts (`Series 6`, `Archive 148`) are computed at build.

### 6.2 Counters
- Format: `NN / NN`, zero-padded to the width of the total (`07 / 22`, `007 / 148` is never used: Archive-only photos count within the Archive's own sequence as `07 / 148`, padded to two digits minimum). Separator ` / ` with normal spaces. Tabular figures. Current in `--fg`, ` / total` in `--fg-3`.
- Index: fixed chip (4.3). Viewer: in the band (4.6). Series pages have no counter, because the plate numbers `02.07` do that job.

### 6.3 Focus
- **Text links and controls:** `outline: 2px solid var(--fg); outline-offset: 3px; border-radius: 0`.
- **Images (tiles, plates):** a double ring that reads on any photo:
  ```css
  a[data-photo]:focus-visible { outline: none; }
  a[data-photo]:focus-visible::after { content: ""; position: absolute; inset: 0; pointer-events: none;
    outline: 2px solid var(--fg); outline-offset: -2px; box-shadow: inset 0 0 0 4px var(--ink-0); }
  ```
- Focus never uses `--accent`. Focus never looks like the active state: the active state is a filled green square, focus is a white rectangle.
- Only `:focus-visible`, never a bare `:focus` ring on mouse click.
- Tab order follows DOM order, which is reading order (rows left to right in the Archive).

### 6.4 Cursor
- Native cursors only: `pointer` on links, `w-resize`/`e-resize` on the Viewer's stage zones, `default` elsewhere. No custom cursors.

### 6.5 Photo metadata policy
- **Index and Series:** number, title, place, month and year. No gear.
- **Archive:** title on hover only. In list view: Title, Place, Series, Camera, Date.
- **Viewer:** full: title, place, full date, Camera, Lens, Focal length, Aperture, Shutter, ISO.
- Gear appears only as metadata values or one sentence on Info. Never as badges or "Shot on" pills.
- GPS is never read, stored or published.

### 6.6 Touch
- Hit targets are at least 44×44px on `sm`. The nav row is 40px tall plus 4px padding; filter options get `padding-block: 0.625rem`.
- No hover-dependent information on touch. Archive titles are reachable via the Viewer and List view.

---

## 7. Anti-slop checklist and review rubric

### 7.1 Tells banned on this site (each confirmed instance caps Authorship at 7)

**Surface and color**
- [ ] Pure `#000` or `#fff`. Any Tailwind gray/neutral/zinc-900 background.
- [ ] Gradients, glows, aurora blobs, colored shadows, any `box-shadow` used for elevation, `backdrop-filter`, grain or noise.
- [ ] Accent used for anything except the current/selected marker. Accent focus rings. A second accent.
- [ ] Gray-dead UI: any text dimmer than `--fg-3`, or photos dimmed or desaturated at rest.

**Type and copy**
- [ ] Inter, Geist, Satoshi, General Sans, Space Grotesk, Manrope, Poppins, DM Sans, or a mono caption face.
- [ ] Uppercase letter-spaced labels or eyebrows ("01 / FEATURED WORK", "SELECTED WORKS").
- [ ] A big centered name or headline over a hero. "Capturing moments", "visual storyteller", "passionate", "breathtaking", "timeless", "journey".
- [ ] Em dashes in copy, rule-of-three taglines, "Available for bookings" pill badges.
- [ ] Bold used for state. More than four type sizes.
- [ ] "Hawaii" without the ʻokina.

**Layout**
- [ ] Rounded corners on anything. Cards. Borders around photos.
- [ ] Uniform 1:1 or 16:9 thumbnails, or `object-fit: cover` outside the mobile opener.
- [ ] Bento grid. Three category cards with icons. Masonry on the Index or Series pages.
- [ ] CTA buttons ("View my work", "Get in touch"). Stats counters. Testimonials. A 4-column footer. Newsletter.
- [ ] A hamburger menu on any breakpoint. A theme toggle.
- [ ] Icons: Lucide, emoji, arrow glyphs, icon-per-row metadata, social icons (Instagram is a text link).

**Motion**
- [ ] Fade-up-on-scroll on text blocks or Archive tiles. Staggered cascades.
- [ ] `hover:scale`, Ken Burns, tilt, a custom cursor, magnetic buttons, a marquee, text scramble.
- [ ] Lenis or any smooth scroll, a loader or percentage splash, skeleton shimmer, spinners.
- [ ] A library lightbox (overlay + X + chevrons) instead of the `/photo/<id>/` route.
- [ ] Visible overshoot or bounce. The `ease`/`ease-in-out` keywords.
- [ ] A morph between a cropped thumbnail and an uncropped photo.

**Craft**
- [ ] Hard-coded `/` links (base-path breakage), layout shift on image load, missing `width`/`height`, a 301 hop on internal links.
- [ ] Generic alt text ("Image of…", "photo"), an empty-filter dead end, wrapping or clipping bugs on long titles.

### 7.2 Review rubric (council)

Score each category 1–10. Anchors: **3** = template or AI default, **6** = competent but generic, **8** = professional portfolio, **10** = as defined below. Reviewers cite the screenshot and region as evidence, list the top 5 fixes ranked by impact and the strengths to keep, and return JSON.

| # | Category | 10/10 means, for this site |
|---|---|---|
| 1 | **Image presentation and fidelity** | Every photo looks better here than on Instagram: large, native aspect in every view, uncropped (except the flagged mobile opener), sharp, no color shift (sRGB), correct `sizes` (no soft upscales). Dominant-color or LQIP placeholders, never gray. Nothing overlays a photo except the hover chip and the Index counter. |
| 2 | **Curation, sequencing and rhythm** | The Index reads like an edited book: the opener, then pacing across full / pair / center / rest, and a clear ending line. Each Series has a beginning (header, blurb) and an end (next series). The Archive is dense, flush and orderly. No plate feels like filler or framework output. |
| 3 | **Typography and restraint** | Schibsted Grotesk only, 400 plus the 500 wordmark, exactly four sizes, sentence case, tabular numbers where numbers align, captions aligned to image edges, the ʻokina present. Copy is specific, first person and free of dashes and slogans. Every label earns its place. |
| 4 | **Color, surface and contrast** | The warm near-black makes color pop without crushing shadows. Three distinct text steps, all AA. The accent appears only as current-state squares. No gradients, glass, grain or shadows. The UI is not gray-dead and photos are at full vibrance. |
| 5 | **Motion and interaction feel** | Judged from frame strips or video, not stills. The morph lands on a decoded image with no pop. The viewer slide is directional and quick. Filter reflow glides with no jump cut. The opener recede is smooth and tied to scroll. Hover responds in ≤120ms. Easing and durations match section 5. Nothing decorative, late or bouncy. Reduced motion verified. |
| 6 | **Navigation, IA and craft** | Five sections, one click each. Filters reflected in the URL and working without JS (categories). The Viewer supports keyboard, swipe, Esc and deep links. Mobile is designed (two-row header, swipe, details disclosure), not just stacked. CLS 0. No broken edges (long titles, portrait-heavy series, empty filters, first/last photo). Lighthouse performance ≥ 95 and accessibility 100. |
| 7 | **Authorship and distinctiveness** | A designer could not tell an AI was involved. Zero tells from 7.1. Signature details are present and consistent (AF-green state squares, numbered plates `02.07`, the receding opener, the label–value viewer band). It reads as Will's point of view, not Squarespace, Framer or Tailwind. Each confirmed tell caps this category at 7. |

**Council protocol:**
- Reference set: Mormal, Kai Blamey, Nero (Grid), Clennon, plus one stock Squarespace photography template as a low anchor. Label the sites A–E, shuffle the order each round, and never tell reviewers which one is Will's, the target score or previous scores.
- Fixed captures each round: Index at 1440×900 and 390×844, one Series page, Archive unfiltered and filtered, the Viewer on a landscape and a portrait photo, and Info. Plus ~16-frame strips for the morph, next-photo slide and filter reflow.
- Images in review packs ≤ 1568px.
- Use the median across reviewers.
- Stop when every reviewer scores ≥ 9 on every category for two consecutive rounds **and** Will signs off by eye.
- Guardrail: if Color (4) or Image (1) stalls while Restraint rises, the loop is graying the site out. Restore contrast and photo vibrance. Never dim photos to "fix" anything.

---

## 8. Implementation notes (Astro 7.4.x, static, base `/photography`)

### 8.1 Config

```js
// astro.config.mjs
import { defineConfig, fontProviders } from 'astro/config';
export default defineConfig({
  site: 'https://willhammondhimself.github.io',
  base: '/photography',
  trailingSlash: 'always',
  compressHTML: true,                         // avoid Astro 7 'jsx' whitespace stripping between inline links
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  image: { breakpoints: [320, 480, 640, 960, 1280, 1920, 2560, 3200] },
  fonts: [{
    provider: fontProviders.fontsource(), name: 'Schibsted Grotesk', cssVariable: '--font-sans',
    weights: [400, 500], styles: ['normal'], subsets: ['latin', 'latin-ext'],
    fallbacks: ['ui-sans-serif', 'system-ui', 'sans-serif'],
  }],
});
```
- Node ≥ 22.23. No UI framework (no React/Svelte), no Tailwind, no GSAP, no Lenis.
- Plain CSS in `src/styles/{tokens,base,motion}.css`.
- **JS budget: ≤ 20 KB gzipped total**, including ClientRouter.

### 8.2 Routes

| Route | File | Source |
|---|---|---|
| `/photography/` | `src/pages/index.astro` | `index.json` |
| `/photography/series/` | `src/pages/series/index.astro` | `series.json` |
| `/photography/series/<slug>/` | `src/pages/series/[slug].astro` | `getStaticPaths` over series |
| `/photography/archive/` | `src/pages/archive/index.astro` | all photos, date desc |
| `/photography/archive/<category>/` | `src/pages/archive/[category].astro` | 6 categories, all tiles rendered, non-matching `hidden` |
| `/photography/photo/<id>/` | `src/pages/photo/[id].astro` | every photo |
| `/photography/info/` | `src/pages/info.astro` | `site.json` |
| `/photography/404.html` | `src/pages/404.astro` | |

Every internal href goes through `url()`:
```ts
// src/lib/url.ts
const base = import.meta.env.BASE_URL.replace(/\/$/, '');          // '/photography'
export const url = (p = '') => `${base}/${p.replace(/^\//, '')}`;  // url('photo/half-dome-sentinel/')
```
This also applies to `public/` assets (favicon, OG) and the absolute URLs: `new URL(url('…'), Astro.site)`.

### 8.3 Data model

**`src/data/photos.json`** (hand-authored, editorial):
```json
[{
  "id": "half-dome-sentinel-bridge",
  "file": "yosemite/half-dome-sentinel-bridge.jpg",
  "title": "Half Dome from Sentinel Bridge",
  "place": "Yosemite Valley",
  "category": "yosemite",
  "series": "yosemite-winter",
  "alt": "Half Dome lit pink at dusk above the Merced River, snow on the banks.",
  "focus": [50, 40]
}]
```
- `category` is an enum: `yosemite | hawaii | climbing | travel | portraits | events`. Display labels: Yosemite, Hawaiʻi, Climbing, Travel, Portraits, Events.
- `series` is a slug or `null`.
- `focus` is optional and used only for the mobile opener crop.

**`src/data/photos.meta.json`** (generated by `scripts/photo-meta.mjs`, committed, keyed by id): `width`, `height`, `color` (`rgb(r g b)` from `sharp().stats().dominant`), `lqip` (24px-wide WebP, q40, base64 data URL), `date` (ISO from `DateTimeOriginal`), `exif: { camera, lens, focal, aperture, shutter, iso }`.
- Camera normalization: `ILCE-7CM2` → `Sony A7C II`, `DC-S5` → `Panasonic S5`.
- Lens ranges are normalized to an en dash.
- GPS tags are not read.

**`src/data/series.json`:**
`[{ "slug": "hawaii", "number": 2, "title": "Hawaiʻi", "place": "Big Island and Kauaʻi", "dates": "Jun–Aug 2025", "blurb": "…", "cover": "<photo id>", "plates": [{ "photo": "<id>", "plate": "wide" }, { "photo": ["<id>", "<id>"], "plate": "pair" }] }]`

**`src/data/index.json`:** `[{ "photo": "<id>", "plate": "full" }, …]`. The first entry is the opener.

**`src/data/site.json`:** `email`, `instagram: "willhammondhimself"`, `city`, `school`.

**`src/lib/photos.ts`:**
- Merges the two files and validates them with `astro/zod`. Type: `Photo = { id, file, title, place, category, series, alt, width, height, color, lqip, date, exif, focus?, image: ImageMetadata }`.
- Resolves `image` from `import.meta.glob('/src/assets/photos/**/*.jpg', { eager: true, import: 'default' })`.
- Exports `byId`, `seriesSequence(photo)` and `archiveOrder`.

**The build fails if:**
- an id is missing or duplicated, a file is missing, or the meta is stale (width/height ≠ ImageMetadata)
- alt is empty, over 160 characters, or starts with "Image of" / "Photo of"
- a `full` plate has AR < 1.4, there are two consecutive `full` plates, or the first Series plate is `full`
- a series references a missing photo, or a photo with a `series` value isn't in that series' plates.

### 8.4 Image pipeline

- **Source exports:** from Lightroom at **3200px long edge, JPEG q90, sRGB, metadata kept** (exifr needs it; sharp strips it from outputs). About 2–3 MB each, so about 150 photos stays well under the 1 GB repo guideline.
- **Location:** `src/assets/photos/<category>/<id>.jpg`. Nothing goes in `public/`.
- **Component:** `<Picture formats={['avif','webp']} fallbackFormat="jpg" quality={80}>` with explicit `width`/`height`, so CLS is 0. Widths and `sizes` per context:

| Context | `widths` | `sizes` | Loading |
|---|---|---|---|
| Archive tile | 320, 480, 640, 960, 1280 | `(max-width: 680px) {136·ar}px, (min-width: 1600px) {320·ar}px, {20·ar}vw`, computed per tile from `ar = w/h` | `lazy`, `decoding="async"` |
| Plate `full` | 960, 1280, 1920, 2560, 3200 | `100vw` | opener: `priority`; others: lazy |
| Plate `wide` / `left` / `right` / `center` / `pair` | 640, 960, 1280, 1920, 2560 | `(min-width: 1024px) 84vw / 58vw / 58vw / 50vw / 50vw, 100vw` | first two plates on Index: eager; rest lazy |
| Viewer hero | 960, 1280, 1920, 2560, 3200 | `(min-aspect-ratio: {w}/{h}) calc((100svh - 12rem) * {ar}), calc(100vw - 6rem)` | `priority` |
| Series preview, list preview | 640, 960, 1280 | `(min-width: 1024px) 40vw, 100vw` | lazy (first cover eager) |

- Attributes: `data-fade` on every `<img>`, `data-hero` on the Viewer image. `--dom` and `--w`/`--h` go on the wrapper as inline custom properties.
- **Placeholders:**
  - The dominant color sits on every wrapper.
  - LQIP (`background-image: var(--lqip)` via a blurred `::before`) only on plates, the opener, the Series/List previews and the Viewer.
  - No blurhash or thumbhash.
- **CI:** `withastro/action@v6` (cache on, which keeps the AVIF output between builds), `actions/deploy-pages@v5`, `actions/checkout@v7`.
  - Pages source: GitHub Actions.
  - `package.json`: `"prebuild": "node scripts/photo-meta.mjs"`, chained so `npm run build` runs it.
  - Expect the first build to be slow (AVIF). After that it's cached.

### 8.5 File map

```
src/components/  Header.astro  Footer.astro  Plate.astro  PlatePair.astro  Tile.astro
                 Sheet.astro  ListView.astro  FilterBar.astro  Viewer.astro  Counter.astro
src/layouts/     Base.astro   (<ClientRouter fallback="swap" />, <Font cssVariable="--font-sans" preload />)
src/scripts/     motion.ts    (VT naming, hero pre-decode, markLoaded, nav-marker)
                 viewer.ts    (keys, swipe + drag-follow, neighbor preload)
                 archive.ts   (in-place filter VT, URL sync, list toggle, preview)
                 index.ts     (counter IO)   series.ts (list preview)
src/styles/      tokens.css  base.css  motion.css
scripts/         photo-meta.mjs
```
All scripts are bundled modules imported once in `Base.astro`. Per-page setup runs on `astro:page-load` (ClientRouter makes scripts run once per session). All listeners are delegated on `document`.

### 8.6 View Transition wiring (must-dos)

- `astro:before-preparation`:
  - record `e.from.pathname` and `e.info?.nav`
  - if not `nav`, name the clicked `a[data-photo]:not([data-cropped]) img` as `photo`
  - wrap `e.loader` to `await` the decode of the new document's `img[data-hero]` (best AVIF `srcset`), raced against 450ms.
- `astro:before-swap`:
  - set `e.newDocument.documentElement.dataset.nav`
  - on `e.viewTransition.finished`, clear all names and `data-nav`.
- `astro:after-swap`:
  - if not `nav`, find `a[data-photo]` whose `pathname === fromPath`, scroll it into view if off-screen (`instant`), and name its img `photo`
  - call `markLoaded()` so the hero is never captured at opacity 0.
- In `Viewer.astro`, the hero has `view-transition-name: photo` statically (one per page).
- `history: 'replace'` for arrow and swipe navigation. Back from the Viewer always returns to the originating grid, with a morph onto the last photo viewed.
- Use string event names only. The Astro 7 `TRANSITION_*` constants and helpers are removed.

### 8.7 Progressive enhancement (JS off)

| Feature | No JS | With JS |
|---|---|---|
| All pages, all links, Viewer prev/next/close | works (static `<a>`) | + morph, slide, prefetch |
| Images | visible immediately (fade rules are scoped to `scripting: enabled`) | + settle fade |
| Archive category filter | separate static pages | + in-place filter with reflow |
| Archive camera/year filters, List view | hidden (`@media (scripting: none)`) | available, in the URL |
| Viewer EXIF on mobile | native `<details>` | same |
| Series list preview | first cover shown | follows hover/focus |
| Index counter | hidden | live |
| Keyboard ←/→/Esc, swipe | not available (Tab plus links work) | available |

### 8.8 Acceptance checks before the first review round

- Lighthouse (mobile, Index and Viewer): Performance ≥ 95, Accessibility 100, CLS 0, LCP < 2.0s on simulated 4G.
- axe: 0 violations. Keyboard-only walkthrough of every page passes (visible focus, logical order).
- Firefox 159, Safari 27, Chrome 156: morph, slide and filter reflow all run. Reduced motion verified in each.
- JS disabled: every route renders and navigates. No invisible images.
- No `href` starts with `/` without `/photography/`. No internal 301s (`trailingSlash: 'always'`).
- `grep` the build for `border-radius`, `box-shadow`, `gradient`, `backdrop-filter`, `ease-in-out` (the keyword), `text-transform: uppercase` and `letter-spacing`. Only the values allowed by this spec may appear.

### 8.9 Decisions log (rule / why / rejected)

| Rule | Why | Rejected |
|---|---|---|
| ClientRouter, not cross-document `@view-transition` | Firefox lacks cross-document VT. Same-document works in all three engines | Native `@view-transition` (revisit when Firefox ships it) |
| No `transition:persist` on the header | a persisted header keeps a stale active state. Use a static VT name instead | persist |
| Native scroll | Lenis feels floaty, which is a template tell, and conflicts with scroll restoration | Lenis, GSAP ScrollTrigger |
| Opener recedes on scroll (CSS only) | gives Mormal's "pull back" without scroll-jacking | Mormal's wheel-driven filmstrip |
| Justified rows in the Archive | native aspect, row order kept, clean morphs, CSS only | masonry, square crops, Clennon's staggered columns |
| One family, no mono | restraint, and mono labels read as AI-made | Fragment Mono for EXIF, an italic serif for series titles |
| AF-green accent for state only | keeps color doing a job (Theo's lesson) without competing with photos | no accent (gray-dead); terracotta/cream (default cluster); blue |
| Words, not arrows | Schibsted lacks arrow glyphs, and words are clearer | icon sets, Unicode arrows from a fallback font |
| Viewer is a route | shareable, works without JS, enables the morph | lightbox libraries |
---

## 9. v1 deviations (data reality, 2026-11-05)

These override the sections above where they conflict.

1. **Sources are Lightroom CC cached previews**, 2048px long edge, already converted to sRGB by `.local-tools/import_previews.py`. They carry **no EXIF and no capture date**. All EXIF/date fields are optional everywhere: captions show title and place only when the date is missing, the Viewer omits the EXIF grid entirely when empty, the Archive camera/year refinement groups render only when at least two distinct values exist, and Archive order falls back to the data order of `photos.json` when dates are missing. When Will later drops in a Lightroom export (3200px, metadata kept), `scripts/photo-meta.mjs` picks up EXIF/dates automatically with no code change.
2. **Never request widths larger than the source** (filter the `widths` arrays by the image's intrinsic width so no upscaled variants are generated).
3. **Categories** are data-driven from `photos.json`. Current enum and labels: `yosemite` Yosemite, `hawaii` Hawaiʻi, `greece` Greece, `climbing` Climbing, `landscape` Landscape, `portraits` Portraits, `events` Events, `travel` Travel. Only categories with at least one photo get a facet and a pre-rendered `/archive/<category>/` page.
4. **Series** come from `src/data/series.json` (generated; `dates` may be empty, in which case omit it from the meta line). Series count is data-driven.
5. **`src/data/*.json` is generated by `.local-tools/build_data.py`** for this first version; treat it as the source of truth and do not hand-edit it in code.
6. `site.json` `email`, `city`, `school` are empty for now: omit those rows/fields when empty (no placeholders rendered).

## 10. Council changelog

Deviations from sections 1–9, each with the council finding that required it. These override the sections above where they conflict.

**Round 1** (median: image 8, curation 7, type 8, color 8, motion 6, navigation 7, authorship 7)

- **Viewer slide (5.1, 5.6):** `--dur-slide-out` 120ms, `--dur-slide-in` 260ms with a 120ms delay, translate 12px (was 240/420ms overlapping, 3rem). Reason: the overlapping fades double-exposed two differently sized photos (strip-slide frames 2–3).
- **Viewer placeholder:** the hero frame drops its dominant-color/LQIP background once the image is `is-loaded`. Reason: the frame background showed as a brown edge in the root snapshot during the slide.
- **Page transitions (5.5):** root crossfade is sequential: old out over `--dur-swap-out` (120ms), new in after it. Reason: index and viewer captions doubled during the morph (strip-morph frames 2–3).
- **Filter reflow (5.7):** three beats with no overlap: removed tiles fade out (120ms), survivors move (250ms, after the fade), new tiles fade in from halfway through the move. Surviving tiles show only the new snapshot (no old/new crossfade). `html[data-vt]` mirrors the VT type so the root never crossfades where types are unsupported. Reason: the whole grid cross-dissolved (strip-filter frame 2).
- **Index opener (4.3, principle 2):** no longer full-bleed, and no longer cropped to 4:5 on phones. It is contained at native aspect within the first screen (`100svh − header − 5rem`), centered, caption below, like every other plate. The site now has zero crops, and the opener can morph on phones. Reason: the opener was cut by the fold and treated differently from frame 02.
- **Index counter (4.3, 6.2):** the fixed chip is removed. Index captions carry the total instead: `07 / 18`. Reason: the chip sat on top of photos; nothing now overlays a photo except the Archive hover chip.
- **Phones, Index rhythm:** `--rest` is 3rem below 640px, and `full` plates keep the 16px side margins on phones. Reason: ~150px dead bands after captions and the orchestra plate breaking the margins (index-mobile).
- **Phones, header (4.2):** nav counts stay visible (`Series 4`, `Archive 32`). Reason: council asked to keep the counts on mobile.
- **Phones, Archive filter bar (4.5):** categories wrap instead of scrolling, the count and View toggle sit on their own row, and the bar is not sticky below 640px (wrapped, it would cover a fifth of the screen). Reason: the row was clipped after "Greece 9" with no visible cue.
- **Phones, Viewer (4.6):** the viewer is a `min-height: 100svh − header` grid. The photo is centered in all the space above the band, the band (caption, counter, Previous/Next/Close) is pinned to the bottom, and the links are ≥44×44px. Reason: the photo sat at the top with ~450px of empty screen below.
- **ʻOkina at display size (3.1):** in `--step-3` titles the ʻokina gets `margin-inline: −0.05em` and is raised 0.07em (small text keeps −0.13em). Reason: the tight setting fused the two i-dots and the ʻokina into a "“" shape on the Series list.
- **Series list preview (4.4):** the preview now carries the cover's caption (title, place) and the series blurb (`--step-0`, `--fg-2`, 38ch), and rows get `--s-4` vertical padding. Reason: the preview had no caption and the lower half of the page was empty.

Not taken this round: changing the typeface or replacing the AF-green square (both are core identity, and two of three reviewers listed them under Keep); justifying the Archive's last row (the spec's natural-size last row is deliberate).

**Round 2** (median: image 8, curation 7, type 8, color 8, motion 6, navigation 7, authorship 7)

- **Morph (5.5, 8.6):** while a photo is named for the morph, its frame (and Archive tile) drops its placeholder (`.is-lifted`: no dominant color, no blurred LQIP). Reason: the frame's blurred LQIP stayed behind in the page snapshot as a dark ghost panel beside the moving photo (strip-morph frames 2–4).
- **Viewer slide (5.1, 5.6):** a direct crossfade with a 24px push: outgoing 160ms `--ease-exit`, incoming 220ms `--ease-out`, both from t=0. The outgoing photo is renamed `photo-out` so each photo fades at its own size and place, and the root does not animate (caption text swaps instantly). Replaces Round 1's sequential 120ms + 260ms. Reason: the sequential version dipped to near black between photos (strip-slide frame 5), read as a loading flash.
- **Filter reflow (5.7):** one beat instead of three. Survivors glide (280ms) from t=0, removed tiles fade out in place (120ms), new tiles fade in together (200ms from 60ms). Tiles are named only when on screen (±10% of the viewport), so a tile from far off fades in place instead of flying alone. The filter bar has its own transition layer (`filterbar`) above the tiles and holds still; if the page was scrolled into the sheet, the new results start right under the bar, and `.archive` is at least `100svh` tall so a short result never clamps the scroll. Reason: the sheet went black, then one Santorini tile drifted across an empty sheet before the rest appeared (strip-filter frames 3–7).
- **Phones, Viewer (4.6):** the photo runs edge to edge (no side margin) directly under the header, up to 70svh tall, with the caption and Previous / Next / Close directly beneath. The four-link nav is hidden on the Viewer (Close and the context link remain). The left and right halves of the photo are Previous / Next tap zones (swipe still works). Supersedes Round 1's bottom-pinned band. Reason: the landscape photo filled a quarter of the screen with ~200px empty bands above and below (viewer-mobile).
- **Phones, Archive filter bar (4.5):** back to one horizontally scrolling category row with the 24px right-edge mask (as in the original spec), plus one row holding the live count and the View toggle. Not sticky. Supersedes Round 1's wrapping rows. Reason: three wrapped rows plus a view row pushed the first photo to ~260px (archive-mobile).
- **Series list (4.4):** the place and count sit on the title's baseline directly after it (`--s-6` gap) instead of right-aligned at col 7. The list takes cols 1–6 and the preview cols 7–12 (cover capped at 62svh); the block is centered in the first screen above the footer, rows at `--s-6` padding. Reason: the meta column floated ~250px from the titles and the bottom 40% was empty (series-list-desktop).
- **ʻOkina at display size (3.1):** `--step-3` titles draw Schibsted's U+2018 (same turned-comma shape at letter scale) with `margin-inline: 0.05em 0.03em`; the U+02BB stays in the DOM, visually hidden, for screen readers, search and copy (`typesetDisplay`). Small text is unchanged. Reason: the U+02BB glyph still read as "Hawai ʻ i" at 88px; every kerning value either floated it or fused it with the i-dots.
- **Offset plates (4.3):** on lg, `left` and `right` plates set their caption beside the photo, in the open columns, on the photo's bottom edge (number, title, place stacked; flush against the photo, right-aligned for `right` plates). Reason: the half-width frame left the other half of the spread dead and the widths read as accidental (index-desktop-scrolled).
- **Caption numerals (3.3):** plate caption numbers (`01.01`, `03 / 18`) use proportional lining figures. Counters, counts and table columns keep tabular figures. Reason: Schibsted's tabular "1" has a slab foot that read as a monospace face (series-page-mobile).
- **Info (4.7):** a selected photograph (Facing a snowy peak, native aspect, max 70svh, linking to its Viewer page) sits under the details in cols 8–12, and links in the details are underlined. No email row is shown while `site.json` has no email. Reason: ~70% of the page was empty and the Instagram handle did not read as a link (info-desktop).

Not taken this round: a one-row phone header (the four nav items, counts and wordmark do not fit 390px with 44px targets); pairing more portraits on the Index (the side captions answer the dead half without resequencing).

**Round 3** (median: image 8, curation 7.5, type 8, color 8, motion 6, navigation 7, authorship 7.5)

- **Viewer slide (5.1, 5.6):** sequential again, but shorter than Round 1 and with no overlap: outgoing photo fades out over 120ms `--ease-out` with a 16px push, incoming fades in over 180ms `--ease-out` from t=100ms (`--dur-slide-delay`). Each photo group is `overflow: clip`. Supersedes Round 2's simultaneous crossfade. Reason: the crossfade double-exposed two landscapes, and the wider old photo showed as a sliver beside the new one (strip-slide frames 2–6).
- **Viewer band, lg/md (4.6):** when a photo has no EXIF the band is one line (title and place left; counter, series, Previous / Next / Close right) and the stage padding is `--s-4` top, 0 bottom. The photo gains about 70px. Reason: the viewer showed the portrait smaller than the Index did, so opening a photo shrank it (strip-morph frames 1–5).
- **Plate height cap (4.1):** on md and up, plates cap at `--plate-h: calc(100svh - var(--header-h) - 6rem)` instead of 88svh, which stays under the Viewer's photo height, so the morph only ever grows a photo. Phones keep 88svh. Reason: same as above.
- **Phones, Viewer (4.6):** the photo runs edge to edge, centered in all the space between the one-row header and the band; the band (caption, counter, Previous / Next / Close at 44px) is pinned to the bottom with safe-area padding. A portrait fills the height. Supersedes Round 2's photo-at-top layout. Reason: about 55–60% of the screen was empty black below the controls (viewer-mobile); all three reviewers asked for this.
- **Index opener (4.3):** the opener takes the `wide` span (cols 2–11; still capped to the first screen), so plates 01 and 02 share both edges. Placements are named and tied to orientation: full bleed and wide for landscapes (wide starts on the col-2 line), left / right on the margins and center / pair on the page axis for portraits. Reason: 01, 02 and 03 had three unrelated left edges (139 / 157 / 43px) that read as accidental.
- **Phones, header (4.2):** the four nav items are left-aligned with a 1.25rem gap instead of `space-between`, and every label is indented by the marker's width, so the active square sits at the 16px margin rather than at x≈4. Phones hide the root scrollbar (`scrollbar-width: none`, below 640px only), as phones draw overlay scrollbars anyway. Reason: "Info" floated and the green square touched the screen edge (index-mobile, archive-mobile).
- **Archive filter bar (4.5):** categories are split into two labeled groups, "Series" (categories that are also a series) and "Subject" (the rest), after "All". The live count and the View toggle share the right end of row 1; row 2 renders only when Camera/Year refinements exist. On tablets the groups wrap whole onto a second line. On phones the category row scrolls with `scroll-padding-inline: var(--margin)`, the mask fade is 40px (was 24px), and the "All" marker sits inside the margin (no hanging indent). Reason: the row mixed series and genres in one list, View sat on its own row away from the count, and on phones "Cl" was clipped with no clear cue and the marker sat at the screen edge.
- **Series page header (4.4):** on lg the blurb sits in cols 8–12 beside the title block (bottom-aligned), the header's top padding is `--s-8` and the space below it `--s-12` (was `--s-12` / `--s-24`). The first photo now starts at y≈282 at 1440×900. Reason: the first photo started below the fold with an empty right half beside the intro (series-page-desktop).
- **Series list (4.4):** list, preview and the shown cover are all centered vertically in the first screen, so a landscape cover no longer leaves the lower part empty. Reason: the lower 40% of series-list-desktop was empty.

Not taken this round: a location for "Poppy and lupine hillside" (no location is on record, and captions never invent facts; Will needs to supply it); dropping the AF-green square or changing the display face (core identity, listed under Keep by two reviewers); removing Sheet / List on phones; FLIP-animating the filter reflow (one reviewer found it clean).

**Round 4** (median: image 8, curation 8, type 8, color 8, motion 6, navigation 7, authorship 7)

- **Viewer next / prev (5.1, 5.6):** a direct crossfade that never passes through the ground. The incoming photo is laid over the outgoing one and comes up from t=0 (`--dur-xfade` 200ms, `--ease-out`, 24px push from the direction of travel); the outgoing photo holds underneath and lets go late (`--ease-exit`), so where the two overlap the screen goes photo to photo. The caption and counter swap in one cut at `--dur-xfade-mid` (100ms). Supersedes Round 3's sequential fade. Reason: the sequential version dipped to near black at frame 3, and the root swapped the caption to the next title while the old photo was still on screen (strip-slide frames 1–3; two reviewers).
- **Morph (5.5):** while a photo morphs (`html[data-morph]`), the page around it fades out within `--dur-morph-clear` (80ms, ease-out), and on the way into the Viewer the caption band fades in only after `--dur-morph-land` (400ms), once the photo has landed. Reason: the index caption stayed visible under the growing photo and the viewer band slid in during the move (strip-morph frames 1–3; two reviewers).
- **Archive filter reflow (5.7):** no longer a view transition. `archive.ts` animates the live tiles (FLIP, Web Animations API) in two beats: removed tiles, and survivors that the reflow will push off screen, fade out in place (`--dur-tile-out` 120ms); then survivors move and scale into their new justified slots (`--dur-tile-move` 250ms, `--ease-out`) while new tiles fade in (`--dur-tile-in` 250ms, after 60ms when something is moving, at once when nothing is). The filter bar, counts and markers answer on the click; the markers glide with WAAPI. New tiles' images start loading during beat 1. Sheet / List keeps its root crossfade. Reason: the view transition's snapshot left about three frames of no response after the tap, then cross-dissolved the old and new grids (strip-filter frames 1–5; all three reviewers). FLIP was declined in Round 3; it is taken now because the snapshot latency cannot be removed any other way.
- **Phones, Viewer (4.6):** the photo (edge to edge) and its band are one unit: caption, counter and Previous / Next / Close sit `--s-4` under the photo, and the unit sits at the optical center of the screen below the header (spare space split 2:3 above and below). Previous / Next / Close are `--fg` with 44px targets. Supersedes Round 3's bottom-pinned band. Reason: the controls sat about 270px below a landscape (viewer-mobile; all three reviewers), and Round 2's top-anchored layout left the lower half empty, so the unit is centered rather than pinned to either edge.
- **Phones, Archive category row (2.3, 4.5):** the right-edge mask is 4.5rem (was 40px) so the facet running off the edge visibly dissolves, it drops away once the row is scrolled to its end, and a 3rem left fade appears once the row is scrolled from its start. Reason: the 40px fade only touched the last letters, so "Greec" read as clipped with no cue (archive-mobile; two reviewers). Wrapping was measured and rejected: the eight facets need three uneven lines at 390px.
- **Index sequence (4.3):** re-edited by visual bridges, same 18 photographs: star trails (night, headlamps) → light trail on a night boulder → orchestra in low light → Hawaiʻi dusk pair → El Capitan in evening light → side light → climber on granite → climbing pair → friends below snowy peaks → Tunnel View in mist → storm clouds → Delphi columns → Delphi pair → Oia blue domes → closing full plate, the poppy hillside with its one seated figure, then the end line with the Series and Archive links. Scale now alternates full / wide / pair / offset / center throughout. Reason: the old order ran from a Yosemite storm straight into the orchestra and a sunset with no pairing logic (index-mobile, index-desktop-scrolled).
- **Series list (4.4, 5.4):** the hovered or focused title gets an underline (0.03em, `--fg-3`, `--dur-hover`), the same signal as plate captions. Reason: the big titles did not read as links (series-list-desktop).

Not taken this round: dimming or hiding the desktop header on the Viewer (dimming UI is against the guardrail, and the header holds still through every transition); dropping the nav counts (one reviewer asked, another listed them under Keep); justifying the Archive's last row (deliberate, as in Rounds 1–3); a swipe hint (the tap halves and swipe already work, and a hint would be chrome over the photo).

**Round 5** (median: image 8, curation 7, type 7, color 7, motion 5, navigation 7, authorship 7)

- **Viewer next / prev (5.1, 5.6):** a horizontal slide. Both photos stay fully opaque and travel together by one screen width (`--slide-d` 100vw) over `--dur-slide` 280ms, `--ease-slide` (quint-out); the outgoing photo leaves toward the side it is pushed, the incoming one arrives from the other. The caption and counter cut at `--dur-slide-mid` (120ms). Supersedes Round 4's crossfade. Reason: every crossfade so far showed two photos at partial opacity together, plus a sliver of the wider photo at the edges (strip-slide frames 1–8; all three reviewers). Sliding a screen apart, the two never overlap.
- **Morph (5.1, 5.5):** `--dur-morph` 420ms (was 560ms); the Viewer band starts at `--dur-morph-land` 240ms and fades over `--dur-morph-band` 140ms, so it is fully up by 380ms, before the photo finishes settling. Reason: the band appeared well after the photo had landed and the viewer sat without controls (strip-morph frames 2–8; all three reviewers).
- **Archive filter (5.7):** one beat, all on the click. The new justified rows are committed and measured before the first paint; tiles that leave the screen (removed, or pushed below the fold) leave a pinned ghost beneath the sheet that fades out over `--dur-tile-out` 150ms; survivors glide and scale to their new slots (`--dur-tile-move` 250ms), and a survivor that was off screen slides in from the nearest screen edge, opaque; new tiles cut in on top of the ghosts (fade up only on empty ground). Every tile image is warmed once the Archive is idle, so a filter never reveals placeholders. `--dur-tile-in-delay` is gone. Also fixed: `archive.ts` read the duration tokens with a bare `parseFloat`, and Chrome serializes them in seconds ("0.15s"), so every Round 4 reflow animation lasted under a millisecond. Reason: the sheet dipped to near black, then rows reflowed as unloaded tiles faded in (strip-filter frames 3–5; all three reviewers).
- **Index opener (4.3):** the opener may take the whole content width (cols 1–12) and is capped at `100svh − header − 3.25rem`, so it fills the first screen (1189px wide at 1440×900, was 1111px). Supersedes Round 3's col-2 opener span. Reason: the opener filled about 77% of the width with a dead band under its caption (index-desktop).
- **Rest (4.1):** `--rest` is `clamp(3rem, 8vh, 6rem)` (was `clamp(4rem, 12vh, 10rem)`); phones keep 3rem. Reason: about 180px of black between a caption and the next photo (index-desktop-scrolled; two reviewers).
- **Index sequence (4.3):** star trails over El Capitan → El Capitan in evening light (the same wall, night then evening) → side light → climber on granite → climbing pair → light trail at the night boulder → Hawaiʻi dusk pair → orchestra → friends below snowy peaks → Tunnel View → storm clouds → Delphi columns → Delphi pair → Oia blue domes → poppy hillside. Same 18 photographs. Reason: the edit opened on three night or dark-interior frames in a row (index-desktop-scrolled, index-mobile).
- **Text tones (2.1, 2.2):** `--fg-2` #B4AEA5 (8.57:1 on `--ink-0`, was #A39E96, 7.09:1) and `--fg-3` #968F87 (5.91:1, was #8A857E, 5.15:1). Reason: captions, nav and filter labels read as gray-on-gray, and color scored lower than last round; contrast goes up, never down.
- **Archive filter bar (4.5):** group labels ("Series", "Subject", "View") are set a size down (`--step--1`) and the gap between groups is 7ch. On phones the category row is a disclosure: one 44px row reading "Filter  Greece  9 of 32" (an underlined text button) with the View toggle on the right; it opens the categories as wrapped rows, one group per line, and choosing one closes it. Without JS there is no button and the rows show wrapped. Supersedes Round 4's masked scrolling row. Reason: the scrolling row still read as clipped ("Gree") after four rounds of masks and wrapping (archive-mobile; two reviewers), and the desktop labels read as filter options (archive-desktop).
- **Phones, Viewer (4.6):** the photo sits directly under the one-row header with the caption and Previous / Next / Close beneath it, and below them the rest of the sequence as a small justified contact sheet (the series, or nine Archive neighbours for unseried photos), native aspect, with the current frame marked by the 6px accent square under it (a third accent placement, same meaning: current). Tapping a frame slides to it. Supersedes Round 4's centred unit. Reason: every arrangement of one landscape on a tall screen left 400px of empty black (viewer-mobile; all three reviewers); the space now holds the sequence instead of nothing.

Not taken this round: replacing the AF-green square with an underline or an alpenglow tone, and a second typeface (both core identity: the task brief keeps Schibsted Grotesk and the green state squares, and two reviewers listed the single sans and the restrained marker under Keep); balancing the Info page's left column (lower impact than the motion and phone fixes); pinch/rotate to fill on phones (native pinch-zoom already works on the stage).

**Round 6** (median: image 8, curation 7, type 8, color 8, motion 6, navigation 7, authorship 7)

- **Archive filter (5.7):** three beats in order instead of one: tiles leaving the screen fade out in place while survivors hold their old slots (`--dur-tile-out` 150ms); then on-screen survivors move and scale to their new slots (`--dur-tile-move` 250ms, `--ease-out`); then tiles that were not on screen fade in at their new slots (`--dur-tile-in` 200ms, from 60% of the move, or straight after beat 1 when nothing moves). Off-screen survivors no longer slide in from the screen edge; they arrive like new tiles. Supersedes Round 5's one-beat reflow. Reason: new tiles slid up through the fading ghosts, so two layouts were on screen together (strip-filter frames 2–3; all three reviewers).
- **Phones, Viewer (4.6):** the Viewer is exactly one screen (`100svh` minus the one-row header; it grows only when Details is open). The photo is contained and centered, edge to edge, in all the space above the band; the band sits at the bottom in the thumb zone: caption and counter, the sequence as a one-row filmstrip (3.25rem frames at native aspect, current frame marked by the accent square, scrolled to center), then Previous / Next / Close at 44px. Filmstrip frames load eagerly. Supersedes Round 5's photo-at-top layout with a contact sheet below. Reason: the photo sat at the top with the lower screen black, since the lazy contact-sheet frames had not loaded in the capture (viewer-mobile; all three reviewers asked for this grid).
- **ʻOkina at display size (3.1):** the drawn U+2018 is set at 0.64 of the title size, raised so its top sits on the i-dots' line. Reason: at full size it still read as an oversized open quote in "Hawaiʻi" (series-list-desktop).
- **Series list (4.4, data):** series carry a `kind` (`place` or `subject`, in `series_meta.json`). Places come first (Yosemite, Greece, Hawaiʻi), then Climbing, and each group is labeled where it starts ("Places", "Subject", `--step--1`, `--fg-3`, on the title's left edge) with `--s-8` extra rest before the second group. Series numbers follow the new order. Reason: "Climbing", a subject, sat among place names with no explanation (series-list-desktop).

Not taken this round: the viewer slide and the morph (the current build already slides both photos fully opaque and clears the index caption within 80ms; the doubled frames described match earlier rounds' builds, re-checked with paused-frame and real-time captures); the Index opener and its counter (no chip and no crop since Round 1; the opener is contained like frame 02); replacing the AF-green square or the typeface (core identity, listed under Keep); justifying the Archive's last row (deliberate).

**Round 7** (workflow round 2; median: image 8, curation 8, type 8, color 8, motion 7, navigation 8, authorship 7)

- **Archive filter (5.7):** one crossfade from t=0 instead of three beats. Tiles leaving the screen leave a ghost beneath the sheet that lets go late (`--dur-tile-out` 240ms, `--ease-exit`); on-screen survivors move and scale to their new slots at once (`--dur-tile-move` 280ms); tiles that were not on screen fade up at their new slots over the ghosts from t=0 (`--dur-tile-in` 180ms). Measured coverage never drops below the ghosts' opacity, and row widths are final from the first frame. Supersedes Round 6's beats. Reason: beat 1 emptied the sheet before beat 3 filled it, so the sheet dipped to near black (strip-filter frames 2-4; all three reviewers).
- **Phones, Viewer (4.6):** the photo sits directly under the one-row header at its own height (edge to edge; a portrait is capped so the band still fits), with the caption directly under it. The space between the caption and Previous / Next / Close holds the sequence as a justified contact sheet that `viewer.ts` sizes to fill it (largest row height that fits, 52-168px); when only a sliver is left (portraits) it stays one filmstrip row, as tall as the space allows. Supersedes Round 6's centered photo. Reason: a landscape floated in about 200px of black above and below (viewer-mobile; all three reviewers).
- **Viewer ends (4.6):** at the first or last photo the dead "Previous" / "Next" keeps its place but is not drawn (`visibility: hidden`), instead of `--fg-3` text. Reason: the gray "Previous" read as a broken control (viewer-mobile, viewer-landscape-desktop; two reviewers).
- **Info (4.7):** on lg the page is a spread: the photograph takes cols 7-12 from the first line of the text and fills the first screen; the paragraph hangs from its top edge and the details sit on its bottom edge (cols 1-6). Supersedes Round 2's photo under the details. No email row yet: `site.json` has no email, and the site never invents contact details. Reason: the left column was empty below the paragraph and the photo started at y≈277 and ran below the fold (info-desktop; two reviewers).
- **Index sequence (4.3):** "El Capitan in side light" and "El Capitan in storm clouds" become one pair (plate 03-04) after the evening-light frame, and Tunnel View takes a `full` plate. The Index no longer uses `left` / `right` offset plates. Same 18 photographs. Reason: the half-width portrait left about 60% of the spread empty and read as a gap (index-desktop-scrolled; two reviewers asked to pair or center it).
- **Archive filter groups (4.5):** the second group is labeled "Singles" (photographs outside any series, by subject) instead of "Subject"; with "Series" it partitions the Archive, so the counts add up to All. Reason: "Subject 2 / 4 / 2" read as a taxonomy covering 8 of 32 photographs (archive-desktop; two reviewers).
- **Labels (2.3):** Archive group labels ("Series", "Singles", "View") and Series list group labels ("Places", "Subject") are `--fg-2` (was `--fg-3`). Reason: they read as low-contrast gray (series-list-desktop, archive-desktop). Contrast goes up, never down.
- **Series list (4.4):** the place is dropped from the meta line when it equals the title ("Hawaiʻi  4", not "Hawaiʻi  Hawaiʻi  4"). Reason: redundant repetition (series-list-desktop).

Not taken this round: a one-row phone header without counts (counts are listed under Keep by two reviewers); a 20ms stagger on arriving Archive tiles (5.8 bans staggered cascades); retuning the morph curve (already shortened in Round 5; no reviewer agreement on a specific defect beyond timing); varying phone Index scale beyond the new portrait pair.

**Round 8** (workflow round 3; median: image 8, curation 7, type 8, color 8, motion 7, navigation 7, authorship 8)

- **Archive filter (5.7):** out, then in; the two sets are never both above 0 opacity. Beat 1: tiles leaving the screen fade out in place (`--dur-tile-out` 110ms, `--ease-exit`) while on-screen survivors hold their old slots, opaque. Beat 2, from the end of beat 1 (at once when nothing leaves): survivors move and scale to their new slots (`--dur-tile-move` 180ms) and tiles that were not on screen fade in (`--dur-tile-in` 180ms). About 290ms in all. Supersedes Round 7's crossfade. Reason: the crossfade double-exposed the old and new sets (strip-filter frames 2-4; all three reviewers).
- **Phones, Viewer (4.6):** no contact sheet or filmstrip. The Viewer is one screen under the one-row header: the photo (edge to edge, native aspect, up to `100dvh − header − 8.5rem`, so a portrait fills the height) with its caption directly beneath, as one unit centered above a bottom bar that reads `Previous  01 / 06  Next  Close` (44px targets, safe-area padding). Swipe works anywhere on the viewer outside the controls. Supersedes Round 7's sized contact sheet. Reason: the photo got about 250px while a thumbnail sheet and a lone accent square sat under it, and the controls lacked Previous and the counter (viewer-mobile; all three reviewers).
- **Viewer ends (4.6):** at the first or last photo the dead "Previous" / "Next" is drawn again in `--fg-3` (the original spec), beside the counter that explains it. Supersedes Round 7's hidden link. Reason: with it hidden the row read as only Next and Close (viewer-mobile, viewer-landscape-desktop).
- **Viewer slide (5.6):** the two photos still travel together fully opaque, but each group clips to its own photo's box and they are spaced by both boxes' span plus 24px (`--slide-d`, set per slide by `motion.ts`), not one screen width. The outgoing photo leaves its frame exactly as the incoming one lands, so nothing lingers at the screen edge, and only a gutter of ground passes between them. Reason: a sliver of the old photo stayed at the edge after the new one had landed, with a wide black gap between them (strip-slide frames 1-3; two reviewers).
- **Morph (5.5):** the Viewer band starts at `--dur-morph-land` 180ms and fades over 160ms (was 240 + 140ms), so it lands with the photo. Reason: the caption and controls appeared frames after the photo had settled (strip-morph frames 4-7).
- **Index measure (4.3):** on tablets and up the opener, every `wide` plate and every pair share one measure, the cols 2-11 span capped at `--plate-h × 1.5` (157-1268px at 1440×900). Only `full` (bleed) and `center` plates leave it, on purpose. Supersedes Round 5's cols 1-12 opener. Reason: 01, 02 and the first pair had three different edges (118 / 157 / 153px).
- **Index sequence (4.3):** star trails over El Capitan → climber on granite → bouldering with a spotter / friends hugging (pair) → facing a snowy peak (center) → El Capitan in evening light → Hawaiʻi dusk pair → light trail at the night boulder → seated under a hazy moon (center) → orchestra → El Capitan in storm clouds / Tunnel View in mist (pair, a portrait with a landscape) → Delphi columns → Delphi pair → Oia blue domes → poppy hillside. "El Capitan in side light" leaves the Index for "Seated under a hazy moon" (it stays in the Yosemite series and the Archive; no photo added to or removed from the site). Reason: frames 01-04 were all El Capitan (index-desktop-scrolled; all three reviewers).
- **End of the edit (4.3):** the end line carries "End" in the plate number's slot and tone and starts on the measure's left edge (col 2). Reason: the sequence needed a clear last frame (index-desktop-scrolled).
- **Phones, pairs (4.3):** below 640px every pair stacks, each photo at full width with its own caption (was: only when the AR sum exceeded 2.4). Reason: two portraits side by side were about 170px wide each (index-mobile).
- **Archive filter bar (4.5):** group labels ("Series", "Singles", "View") are set at the options' size, told apart by tone (`--fg-3`) and the gap between groups. On tablets and up the separate live readout ("32 photographs", "9 of 32") is visually hidden (it remains the aria-live region), since "All 32" and "Greece 9" already carry the counts. On phones "Filter" is plain `--fg-2` text like the other controls, no underline. Supersedes Round 5's smaller labels and underlined button. Reason: three type sizes and twelve-plus controls in one bar, and the underline was the only one on the page (archive-desktop, archive-mobile; two reviewers).
- **Archive sheet (4.1, 4.5):** `--sheet-gap` 8px on tablets and up (4px on phones), and on phones the row height is 11.5rem, so a row holds at most two photographs. Reason: the 4px gutters read tighter than the Index, and phone rows shrank a portrait to a quarter-width thumb (archive-desktop, archive-mobile).
- **Info (4.7):** on lg the details follow the paragraph after `--s-12` instead of sitting on the photo's bottom edge. Reason: about 460px of empty column between the text and the table (info-desktop).

Not taken this round: hiding the desktop nav on the Viewer (one reviewer; 6.1 keeps every section one click away, and the phone Viewer already shows the name only); raising `--fg-3`/`--fg-2` again (already raised in Round 5 to 5.91:1 and 8.57:1); re-indenting the phone nav so "Index" sits on the 16px line (the active square would then touch the screen edge, the Round 3 defect); a horizontal filmstrip of 56px frames on the phone Viewer (two of three reviewers asked for the photo alone).

**Round 9** (workflow round 4; median: image 8, curation 7, type 8, color 8, motion 6, navigation 7.5, authorship 7.5)

- **Morph (5.1, 5.5):** `--dur-morph` 340ms on `--ease-out` (expo-out) instead of 420ms on `--ease-spring`; the band starts at `--dur-morph-land` 60ms and fades over 200ms, so caption and controls come up with the move and are fully up as the photo lands. Hovering, pressing or focusing a plate or tile fetches the Viewer page and decodes its hero ahead of the click (`motion.ts`), so the loader's decode wait no longer leaves a dead beat before the move. Reason: the photo kept drifting into place for most of the strip, and the caption arrived about a second after it (strip-morph frames 1-6; all three reviewers).
- **Viewer next / prev (5.6):** the two photos still travel together as one strip spaced by both frames' span plus 24px, but the groups no longer clip, and the outgoing photo fades out over `--dur-slide-fade` 150ms while it leaves, so it never parks at the screen edge. `--dur-slide` 240ms (was 280ms); the caption cut is at 90ms. Supersedes Round 8's clipped slide. Reason: the outgoing El Capitan frame sat cropped at the left edge with a dark slot between the photos (strip-slide frames 2-4; two reviewers).
- **Archive filter (5.7):** one beat from t=0 with nothing fading through the ground: survivors glide to their new slots, and each arriving tile starts on a slot a leaving tile vacates (reading order, uniform scale, centered) and glides to its own, fully opaque (`--dur-tile-move` 220ms); the leavers' ghosts fade out beneath (`--dur-tile-out` 140ms). Only arrivals beyond the vacated slots fade up, on empty ground. Supersedes Round 8's out-then-in. Reason: the sheet dipped to near black before the Greece set came up (strip-filter frame 3; all three reviewers).
- **Phones, Viewer (4.2, 4.6):** Close moves to the top right of the header row, opposite the name (its own transition layer, `viewer-close`), and the Previous / counter / Next row sits directly under the caption; photo, caption and controls are one block, with the spare height split 2:3 above and below. Supersedes Round 8's bottom bar. Reason: the controls sat about 250px below the caption, and there was no way out at the top (viewer-mobile; all three reviewers).
- **Index sequence (4.3):** the edit opens on El Capitan in evening light; Climber on granite is second and the star trails are third. Same 18 photographs. Reason: the opener was the darkest, lowest-contrast frame (index-desktop; two reviewers).
- **End of the edit (4.3):** the end line is followed by an end card: the series covers in one equal-height row (native aspect; two per row on phones), each numbered and captioned with its title and count, linking to its series. Reason: the edit needed a clear end that points on to Series (index-desktop; all three reviewers).
- **Archive filter bar (4.5):** group labels ("Series", "Singles", "View") are `--step--1` again, and on tablets and up each labeled group starts after a 1px `--line` hairline. Supersedes Round 8's same-size labels. Reason: the labels read as two more filters (archive-desktop; two reviewers).
- **Root scrollbar (2.1):** `scrollbar-color` is set in the ground's tones (`--fg-3` at 45% on `--ink-0`). Reason: a light scrollbar track cut into the right edge of the page (index-desktop).
- **Info (4.7):** on lg the paragraph and details are one block, centered on the photograph's height (a little above its middle). Reason: the lower-left quadrant was empty (info-desktop). Still no email row: `site.json` has no email, and the site never invents contact details.

Not taken this round: an email address on Info (none on record; Will needs to supply it); a second display face (core identity, listed under Keep); raising `--fg-2`/`--fg-3` again (already 8.57:1 and 5.91:1; the "#777" readings do not match the tokens); a chevron on the phone "Filter" control (no arrow glyphs, 3.1); rotating landscapes to fit on phones (it would turn the photograph, not the screen).

**Round 10** (workflow round 5; median: image 8, curation 8, type 8, color 8, motion 8, navigation 8, authorship 7)

- **Viewer next / prev (5.1, 5.6):** a straight push with both photos fully opaque the whole way: the outgoing photo no longer fades (`--dur-slide-fade` is gone). The incoming photo starts one gutter beside the outgoing one (`--slide-in`, both frames' span plus 24px) and the outgoing one travels farther (`--slide-out`, enough to clear the screen by 80% of the eased move), so their gap only widens, they never overlap and nothing parks at the edge. `--dur-slide` 200ms (was 240ms), caption cut at 80ms. Reason: the outgoing photo dimmed to about 30% while it slid, which read as a fade and muddied its colour (strip-slide frames 2-3; two reviewers).
- **Archive filter (5.7):** three short beats that never share space: leavers fade out in place (`--dur-tile-out` 80ms) while survivors hold; survivors then move to their new slots (`--dur-tile-move` 200ms), but only when the new slot is within about one row height, otherwise they cut like a new tile; arrivals fade up and settle from 96% scale in their own slots (`--dur-tile-in` 180ms) once the movers have all but landed (or in the last quarter of beat 1 when nothing moves). No tile is ever raised above another. Supersedes Round 9's arrivals gliding in from vacated slots. Reason: tiles flew across the sheet and overlapped mid-flight (strip-filter frames 2-3; all three reviewers).
- **Phones, Viewer (4.6):** the photo, caption and Previous / counter / Next stand on the bottom edge of the screen (thumb zone, safe-area padding); a portrait still fills the height, and the spare height of a landscape sits above it, under the header. Supersedes Round 9's 2:3 optical centering. Reason: the controls floated mid-screen with dead black above and below (viewer-mobile; all three reviewers asked for the controls at the bottom).
- **Index opener (4.3):** on tablets and up the opener leaves the shared measure: it takes cols 1-12, capped at `100svh − header − 3.25rem` (1257px wide at 1440×900, was 1111px), and its plate is one screen tall, so the site opens on one complete photograph with its caption and nothing of plate 02 peeking in. Plate 02 and on keep the measure (they are never on screen with the opener). Supersedes Round 8's opener on the measure. Reason: the opener did not fill the screen and the next photo peeked in at y≈858 (index-desktop).
- **Phones, full plates (4.3):** `full` plates bleed edge to edge on phones as on desktop (caption inside the margin). Supersedes Round 1's 16px margins. Reason: phone Index had one scale throughout; the bleed restores the change of scale (index-mobile).
- **Phones, Archive sheet (4.5):** `--row-h` 7.25rem (was 11.5rem), so two landscapes share a row at native aspect with the 4px hairline. Supersedes Round 8. Reason: the phone sheet was a gapless single column that read as a feed, not a contact sheet (archive-mobile).
- **Root scrollbar (2.1, 4.2):** `scrollbar-gutter: stable` on `html`, so the right-aligned nav sits at the same x on pages that scroll and pages that do not (Info at 1382px on every page at 1440 wide). Reason: the nav shifted about 15px between the Index and the Viewer / Series list (index-desktop vs viewer-*).
- **Nav on the Viewer (4.2, 2.3):** the Viewer keeps the accent marker on the section its sequence belongs to: Series for a series photograph, Archive for a single (`Base` / `Header` take a `section` prop). Reason: no section was marked inside the Viewer (viewer-landscape-desktop).
- **Archive filter bar (4.5):** on tablets and up the "Series" / "Singles" labels are visually hidden (they stay the groups' accessible names, and show on phones where the groups stack); the hairline and the gap do the grouping, with the space each side of the hairline made equal. Facet counts are set at `--step--1` (tone unchanged, `--fg-3`), so the bar reads as names first. Supersedes Round 9's visible small labels. Reason: 14 equal-weight items on one line did not scan as two groups (archive-desktop).
- **Info (4.7):** on lg the paragraph and details hang from the photograph's top edge (the first line on the photo's top, y≈88) instead of being centered on it. Supersedes Round 9. Reason: the bio floated at y≈300 with empty space above it (info-desktop; two reviewers).

Not taken this round: an email address on Info (none on record in `site.json`; the site never invents contact details, Will needs to supply one); replacing Schibsted Grotesk, adding a text serif, or replacing the AF-green square (core identity per the brief; two reviewers listed the green marker and the single sans under Keep); a third Index scale (center plates and pairs already carry portraits) and a new closing frame (the end line and the series end card from Round 9 already close the edit); balancing the Archive's ragged last row (deliberate, as in every round); captions under Archive tiles on phones (the Archive is the uncaptioned contact sheet, principle 3); raising `--fg-2` / `--fg-3` again (already 8.57:1 and 5.91:1).

**Round 11** (workflow Round 6: median image 8, curation 7, type 8, color 8, motion 5, navigation 7, authorship 7)

- **Index sequence (4.3):** opens on the star trails over El Capitan (p0112) again, and no two neighbouring frames, including the two halves of a pair, share a series (or, for singles, a category); `photos.ts` fails the build if they do. El Capitan in evening light leaves the Index (it stays Yosemite's cover only), and Young surfers heading out joins, so the edit is still 18. Scales rotate on a fixed rule: `full` on plates 1, 5, 9 and 13 (every fourth plate, never two in a row), then `wide`, `pair`, `center` between them. Supersedes Round 9's El Capitan opener and Round 8's sequence. Reason: El Capitan followed itself (pairs of Yosemite, Hawaiʻi and Greece frames) and the evening frame was reused as Index opener, Series preview, Series hero and Viewer first frame (index-desktop, series-list-desktop; all three reviewers, owner).
- **Archive filter (5.7):** two layouts are never on screen together. Beat 1: every tile that will not be on screen in the new layout (non-matching tiles, and survivors whose new slot falls below the fold) fades out in place in the old layout (`--dur-tile-out` 120ms, `--ease-exit`). Then the new layout is committed and every surviving tile glides to its new slot whatever the distance (`--dur-tile-move` 300ms, `--ease-out`); survivors that were below the fold start just past the screen edge as one group, so the set slides up into place. Beat 3: tiles that were not on screen fade up in their own slots from 45% of the glide (`--dur-tile-in` 180ms). The sheet clips (`overflow: clip`) while it runs, and the stand-in ghosts appended to the body are gone. The bar, counts and marker still answer on the click. Supersedes Round 10's capped travel. Reason: the filter read as a dim-out / dim-in with no continuity between tiles (strip-filter; all three reviewers, owner).
- **Viewer next / prev (5.6):** the outgoing and incoming photos move in lockstep: same direction, same distance (`--slide-d`, one screen width plus 24px, set by `motion.ts`), same curve and clock (`--dur-slide` 320ms, `--ease-slide`), both fully opaque. The gap between them never changes and the outgoing photo is off screen exactly as the incoming one lands. Replaces Round 10's separate `--slide-in` / `--slide-out` distances. Reason: the two photos travelled different distances and the outgoing edge lingered at the screen edge (strip-slide; owner).
- **Viewer hit areas (4.6, 6.6):** on tablets and up Previous, Next, Close and the series link get an invisible 44px-tall hit area around the word (a pseudo-element, so the band's line does not change). Reason: 14px words were small targets (viewer-landscape-desktop; one reviewer). Tones unchanged: they are `--fg-2`, the nav's tone.
- **Phones, Viewer (4.6):** the Previous / counter / Next row stays on the bottom edge, and the photo with its caption is centered in all the height between the header and that row, so a landscape's spare height is split evenly above and below instead of one band above it. A portrait still fills the height; targets stay 44px. Supersedes Round 10's photo standing on the bottom. Reason: about 450px of empty ground above a bottom-pinned landscape (viewer-mobile; all three reviewers, owner).
- **Archive facets (4.5):** one facet row, `All 32  Yosemite 6  Hawaiʻi 4  Greece 9  Climbing 5  Landscape 2  Portraits 4  Events 2`, in the category enum's order. Each photograph has exactly one category, so the row covers all 32 and the counts add up to All. The "Series" / "Singles" groups and their hairline are gone (the hairline before View stays). Supersedes Rounds 7-10's grouping. On phones the disclosure's current value copies the facet's markup, so the ʻokina keeps its tightening there too. Reason: series mixed with genres read as two taxonomies (archive-desktop; opus, owner).
- **Series meta (4.4):** the place is dropped whenever it only repeats the title, either way round ("Yosemite  6", not "Yosemite  Yosemite Valley  6"; "Hawaiʻi  4"), on the Series list and the series page (`seriesPlace` in `photos.ts`). Extends Round 7. No island name was added to Hawaiʻi: none is on record. Reason: owner.
- **Info (4.7):** on lg the photograph is a landscape, Cathedral Spires in monochrome (the places he climbs), in cols 6-12; the text block in cols 1-5 spans exactly its height, the paragraph's first line on the photo's top edge and the details' last rule on its bottom edge. Supersedes Round 10's portrait with the text hanging from its top. Reason: the portrait was twice the text's height and left the lower half of the left column empty (info-desktop; two reviewers, owner).

Not taken this round: a different typeface or replacing the AF-green marker (single-reviewer tells; core identity, owner); a place subtitle such as "Big Island" for Hawaiʻi (not on record; the site never invents facts); captions under Archive tiles (principle 3); retuning the thumbnail-to-viewer morph (already a 340ms shared-element move; the reviewers' frame timings are about four times the measured durations, consistent with a slowed capture).

**Round 12** (workflow Round 7: median image 8, curation 7, type 8, color 8, motion 7, navigation 8, authorship 7)

- **Archive filter (5.7):** a survivor glides only when both its old and new slots are on screen; a survivor that was off screen no longer slides in from the screen edge as a group, it fades up in its own slot like a new tile. Arrivals start at 40% of the glide (was 45%) over `--dur-tile-in` 160ms (was 180ms), or straight after beat 1 when nothing moves. Beats 1 and 2 are unchanged (120ms out, 300ms glide); the two layouts are still never on screen together (measured: one frame of ground between them when nothing moves). Reason: after the fade-out, tiles flew in from the bottom-left and crossed each other (strip-filter frames 3-6; all three reviewers, owner).
- **Viewer next / prev (5.1, 5.6):** still lockstep (same direction, distance and clock, both opaque), but `--dur-slide` 220ms (was 320ms) on `--ease-slide` `cubic-bezier(0.2, 0.7, 0.2, 1)` (was quint-out); the caption cut is at 70ms. Reason: the quint-out tail read as a long, slow drift after the slide (strip-slide frames 4-8; opus, owner).
- **Morph (5.5):** opening a photo, the old page is gone on the first frame (`::view-transition-old(root)` has no animation and opacity 0) instead of fading over 80ms, so no neighbouring photo ghosts under the growing one. The Viewer band starts at `--dur-morph-land` 120ms and fades over 120ms (was 60 + 200ms), so it is up as the photo lands, not during the move. Closing keeps the 80ms fade. Reason: the next portrait showed at partial opacity under the morphing photo (strip-morph frame 2; all three reviewers).
- **Phones, Viewer (4.6):** the caption moves into the bottom bar, above Previous / counter / Next (44px targets), and the photo is alone, centered in all the height between the header and that bar, as in a phone's own photo viewer. A tap on the photo hides or shows the chrome (header, Close and bar fade over `--dur-ui`; the state holds from photo to photo and resets on leaving the Viewer); the left / right tap halves are off on phones, Previous / Next are the swipe and the bar. Supersedes Round 11's caption under the photo. Reason: the caption floated mid-screen between two bands (viewer-mobile; opus, owner). A 3:2 landscape on a 390px-wide portrait screen cannot be taller than 260px without cropping, so the spare height cannot be removed in portrait; see the next item.
- **Phones turned sideways, Viewer (4.6):** below 540px tall in landscape orientation the header steps aside on the Viewer and the band becomes a 13rem column on the right (caption at the top; counter, series and Previous / Next / Close at the bottom), so the photo takes the full screen height (a 3:2 frame is 561 x 374 at 844 x 390). Reason: rotate-to-landscape should let a landscape fill the screen (viewer-mobile; opus).
- **ʻOkina at display size (3.1):** `--step-3` titles set the real U+02BB again (no drawn U+2018), with `margin-inline: -0.12em -0.07em`, measured against the i-dots at 82px. Supersedes Rounds 2 and 6. Reason: the drawn quote read as a straight or open quote with a gap on both sides ("Hawai ‘ i", series-list-desktop; fable, owner: every Hawaiʻi uses U+02BB). Text sizes keep `.ok` (-0.13em), which already renders tightly in the filter bar and the phone disclosure.
- **Index sequence (4.3):** the edit now closes on a deliberate last frame: Light trail, night boulder as a `full` plate (18 / 18), a night frame answering the star-trails opener, then the End line and the series end card. Tail: Temple of Apollo columns (full) → hula / surfers (pair) → Blue domes in Oia (wide) → Facing a snowy peak (center) → Tunnel View in mist (full) → Temple terrace under cliffs (center) → Light trail (full). Same 18 photographs, p0112 still opens, and no neighbours share a series or category (build-checked). Two `full` plates sit one plate apart at the end (never back to back), a deviation from Round 11's every-fourth-plate rule for the bookend. Reason: the sequence needed a clear ending (index; opus).
- **Info (4.7):** on lg the details follow the paragraph directly (`--s-8`) instead of standing on the photograph's bottom edge, and a fourth row, "Series", links each series by name. Supersedes Round 11's text block spanning the photo's height. Reason: about 250px of empty column between the paragraph and the table (info-desktop; sonnet, owner).

Not taken this round: replacing the AF-green marker or the typeface (single-reviewer tells; core identity, owner); labeled Places / Subject groups in the Archive filter row (the owner asked for one facet row over the category enum, as in Round 11); a one-row phone header (the wordmark, four items and counts do not fit 390px with 44px targets, Round 2); an email row on Info (none on record in `site.json`).
