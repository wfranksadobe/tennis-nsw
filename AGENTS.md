# AGENTS.md

This project is the Tennis Australia / Tennis NSW migration of the Tennis NSW website to AEM Cloud Service with Edge Delivery Services (EDS) and Universal Editor (UE). As an agent, follow these instructions to deliver code aligned with Adobe's EDS standards and Tennis NSW's specific requirements.

For the complete migration architecture, see the skills resource at `.skills/aem/edge-delivery-services/skills/page-import/resources/ta-architecture.md`.

For comprehensive details on the current status of the migration see: https://github.com/wfranksadobe/tennis-nsw/blob/main/PROJECT-GUIDE.md
---

## Project Overview

This project is based on Adobe's EDS boilerplate patterns and implements the Tennis NSW website in Edge Delivery Services. The target site is `https://www.tennis.com.au/nsw/`.

Migration goal: move Tennis NSW content into AEM Cloud Service with EDS for delivery and Universal Editor for visual authoring.

### Key Technologies

* Edge Delivery Services for AEM Sites
* Universal Editor (UE) — visual authoring surface. Components are registered via `component-definition.json`, `component-models.json`, and `component-filters.json`
* Vanilla JavaScript (ES6+), no build steps, no frameworks
* CSS3 with mobile-first responsive design
* HTML5 semantic markup decorated by block JS

---

## Setup Commands

* Install dependencies: `npm install`
* Start local dev server: `npx -y @adobe/aem-cli up --no-open --forward-browser-logs`

  * Dev server runs at `http://localhost:3000` with auto-reload
  * Serves local code + previewed content from the content source
* Run linting: `npm run lint`
* Auto-fix linting: `npm run lint:fix`

---

## Project Structure

```
├── blocks/                    # EDS block JS + CSS (one directory per block)
│   └── {blockname}/
│       ├── {blockname}.js     # Block decoration function
│       └── {blockname}.css    # Block styles (scoped to block)
├── models/                    # Universal Editor per-field JSON schemas
│   ├── _button.json           # Reusable button field schema
│   ├── _image.json            # Reusable image field schema
│   ├── _section.json          # Section schema
│   └── _*.json                # Other reusable field types
├── styles/
│   ├── styles.css             # Global styles + Tennis NSW brand tokens
│   ├── lazy-styles.css        # Below-fold global styles
│   └── fonts.css              # Font definitions
├── scripts/
│   ├── aem.js                 # Core AEM library — NEVER MODIFY
│   ├── scripts.js             # Page decoration entry point
│   └── delayed.js             # Analytics, GTM, chat widget, personalisation
├── icons/                     # SVG icons
├── fonts/                     # Web font files
├── component-definition.json  # Registers blocks as UE components (authors see these)
├── component-models.json      # Field schemas for each block's UE edit panel
├── component-filters.json     # Controls where blocks can be placed on pages
├── head.html                  # Global HTML <head> content
├── fstab.yaml                 # Content source mount
└── 404.html                   # Custom 404 page
```

---

## Universal Editor (UE) Block Registration

Every new Tennis NSW block must be registered in all three component files before it can be authored in UE. Failing to do this means the block exists in code but authors cannot add it to pages.

### When adding a new block, update:

1. `component-definition.json` — Add to the TA Blocks group:

```json
{
  "title": "Block Name",
  "id": "block-name",
  "plugins": {
    "xwalk": {
      "page": {
        "resourceType": "core/franklin/components/block/v1/block",
        "template": {
          "name": "Block Name",
          "model": "block-name"
        }
      }
    }
  }
}
```

2. `component-models.json` — Add field schema for the block's UE edit panel:

```json
{
  "id": "block-name",
  "fields": [
    {
      "component": "richtext",
      "name": "text",
      "label": "Content"
    },
    {
      "component": "aem-content",
      "name": "image",
      "label": "Image"
    },
    {
      "component": "select",
      "name": "variant",
      "label": "Variant",
      "options": [
        {
          "name": "Standard",
          "value": ""
        }
      ]
    }
  ]
}
```

3. `component-filters.json` — Add `"block-name"` to the `section` components array so it can be placed on pages.
4. `models/_*.json` — If introducing a new reusable field type, add its schema here.

---

## Tennis NSW Block Inventory

### Blocks Already in This Repository

Block Status Tennis NSW Usage

`hero` ✅ Exists — add Tennis NSW variants Every page (standard, image-right, full-bleed, editorial)
`accordion` ✅ Exists — verify FAQ / policy variant FAQ sections, policy pages, program details
`cards` ✅ Exists — basis for program-card Generic cards for clubs, regions, events, and programs
`carousel` ✅ Exists Content sliders, featured stories, partner highlights
`columns` ✅ Exists Side-by-side layouts
`embed` ✅ Exists Video, map, and third-party embeds
`footer` ✅ Exists — update for Tennis NSW structure Global footer with NSW acknowledgement and key links
`form` ✅ Exists Generic forms
`fragment` ✅ Exists Reusable content sections
`header` ✅ Exists — update for Tennis NSW nav Global nav with NSW section links and audience pathways
`modal` ✅ Exists — basis for announcements and journeys Generic modals
`quote` ✅ Exists Testimonials and player/club stories
`search` ✅ Exists — extend for Tennis NSW discovery Global search overlay
`table` ✅ Exists — basis for competition and resource tables Structured data tables
`tabs` ✅ Exists — verify Tennis NSW variants Region tabs, program tabs, content switching
`video` ✅ Exists Video playback

### Tennis NSW-Custom Blocks To Build

These blocks do not exist yet and must be built. In priority order:

Sprint 1 — Required for any Tennis NSW page:

Block Priority Tennis NSW Usage

`announcement-banner` High Dismissible top-of-page alerts (closures, updates, registrations, emergencies)
`anchor-tile-nav` High Horizontal icon + label tiles — in-page navigation

Sprint 2 — Core public content pages:

Block Priority Tennis NSW Usage

`article-cards` High Editorial news and stories grid
`event-card` High Event teaser card for listings
`event-listing` High Event grid with filter/load-more
`region-cards` High Regional entry cards for NSW regions
`feature-grid` High Key program and initiative highlights
`support-cards` High 3-col help links (Support / Contact / Resources)
`partner-strip` High Partner logo strip
`resource-list` High Downloadable resources and policy links

Sprint 3 — Detail pages and journeys:

Block Priority Tennis NSW Usage

`in-page-nav` Medium Sticky anchor links (overview / dates / FAQs / resources)
`step-process` Medium Numbered program steps and process journeys
`schedule-table` Medium Structured event / competition tables
`promo-banner` Medium Time-limited campaign or registration banner

Sprint 4 — Content & discovery:

Block Priority Tennis NSW Usage

`article-grid` Medium 3-up editorial content grid
`search-results` Medium Search result listings and filtering
`quote-carousel` Medium Player, coach, and club stories
`stats-band` Medium Participation and program metrics

Sprint 5 — Section-specific:

Block Priority Tennis NSW Usage

`venue-highlights` Lower Venue / arena feature cards
`map-embed` Lower Venue map and region map embeds
`faq-accordion` Lower Expanded FAQ and policy answers
`contact-form` Lower Enquiry routing and contact flows

---

## Tennis NSW-Specific Code Patterns

### CSS Brand Tokens

Define Tennis Australia / Tennis NSW brand values in `styles/styles.css`:

```css
:root {
  --tennis-green: #00853e;
  --tennis-yellow: #c4d600;
  --tennis-black: #000000;
  --tennis-dark: #1a1a1a;
  --tennis-grey: #f5f5f5;
  --tennis-link: #00853e;
  --tennis-font-sans: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
```

### Analytics Data Attributes (replaces legacy tracking params)

Legacy query-string tracking should not be used in EDS. Prefer data attributes for analytics and campaign tracking:

```
<!-- ❌ Legacy (DO NOT USE) -->
<a href="/programs.html?ei=cta-hero-getstarted">Get started</a>

<!-- ✅ EDS pattern -->
<a href="/programs.html" data-analytics-event="cta-hero-getstarted">Get started</a>
```

### Content Data — Never Hardcode

Never hardcode event dates, region lists, program details, or venue data in block JS. Fetch from the content source or authored content model.

```
const { data } = await fetch('/content/tennis-nsw/events.json').then(r => r.json());
const event = data.find(r => r.slug === 'nsw-open');
```

### Footnote Superscripts

Use superscript elements for notes or references that resolve to a supporting block or structured content:

```
<p>Registration closes on 30 June<sup><a href="#fn-1">*</a></sup></p>
```

### Block Loading Phase

Place block loading in the correct phase in `scripts.js`:

* `loadEager` — Only `announcement-banner` and `hero` (LCP-critical)
* `loadLazy` — All other content blocks
* `loadDelayed` — Analytics, GTM, chat widget, personalisation, `modal`

---

## Tennis NSW Migration Rules

When importing content from the existing Tennis NSW site or source CMS, always apply:

1. Preserve NSW navigation structure and audience pathways where possible.
2. Strip legacy CMS wrappers or embed wrappers while keeping the inner content.
3. Remove tracking wrappers that are not compatible with EDS.
4. Never hardcode event, program, club, or region data — source it from authored content or structured data.
5. Always include the required NSW acknowledgement text in the footer or approved global location.
6. Normalise image URLs and media assets so EDS handles sizing and delivery.
7. Skip header + footer from page imports — these are separate EDS fragments.

---

## Code Style Guidelines

### JavaScript

* ES6+ features (arrow functions, destructuring, async/await)
* Airbnb ESLint rules (configured in `.eslintrc.js`)
* Always include `.js` file extensions in imports
* Unix line endings (LF)
* Block function signature: `export default async function decorate(block) {}`

### CSS

* Stylelint standard configuration
* Mobile-first: `min-width` media queries at `600px` / `900px` / `1200px`
* All selectors scoped to block: `.event-card .date` not `.date`
* Avoid `.{blockname}-container` and `.{blockname}-wrapper` (reserved by EDS)
* Use Tennis NSW CSS custom properties from `styles/styles.css`

### HTML

* Semantic HTML5 elements (`<article>`, `<section>`, `<nav>`, `<aside>`)
* WCAG 2.1 AA accessibility (ARIA labels, heading hierarchy, alt text)
* Correct heading levels in blocks (do not skip h1→h3)

---

## Key Concepts

### Three-Phase Page Loading

```
Eager  (< 100ms) → hero, announcement-banner, first section, styles.css  
Lazy   (after LCP) → all other blocks, header, footer, lazy-styles.css  
Delayed (3s+)    → GTM, Adobe Analytics, chat widget, experimentation, modal forms  
```

### Blocks

Each block exports a default `decorate` function:

```
export default async function decorate(block) {
  // 1. Extract config from block DOM
  // 2. Transform DOM
  // 3. Add event listeners
}
```

Handle missing/optional fields gracefully — authors may omit cells. Use `block.querySelector` not positional `children[n]` where possible.

### Auto-Blocking

`buildAutoBlocks` in `scripts.js` handles patterns like the `announcement-banner` (injected above hero if content source has a banner configured) and external link decoration.

### Testing Without CMS Content

Create static HTML test files in `drafts/` folder:

```
npx -y @adobe/aem-cli up --no-open --forward-browser-logs --html-folder drafts
```

Files must follow EDS markup structure — use the page-import skill to generate test HTML from the source Tennis NSW pages.

---

## Testing & Quality

### Performance Targets

* Lighthouse score: 100 on all pages — non-negotiable for EDS
* Check at: `https://developers.google.com/speed/pagespeed/insights/?url={preview-url}`
* LCP < 2.5s, CLS < 0.1, FID < 100ms
* Images committed to git must be optimised (use EDS `/media_` pipeline for authored images)

### Accessibility

* WCAG 2.1 AA minimum
* Test with axe DevTools or Lighthouse accessibility audit
* Heading hierarchy: never skip levels
* All images: meaningful alt text (not empty strings on content images)
* Interactive elements: keyboard navigable, focus visible

---

## Deployment

### Environments

Environment URL Pattern Content

Local dev `http://localhost:3000` Local code + previewed content
Feature preview `https://{branch}--{repo}--{owner}.aem.page/` Branch code + previewed content
Production preview `https://main--{repo}--{owner}.aem.page/` Main branch code + previewed content
Production live `https://main--{repo}--{owner}.aem.live/` Published content
Tennis NSW production `https://www.tennis.com.au/nsw/` Custom domain → EDS live

Get the repo info: `gh repo view --json nameWithOwner` and `git branch --show-current`

### Publishing Process

1. Push changes to a feature branch
2. AEM Code Sync makes changes live on feature preview URL automatically
3. Test at `https://{branch}--{repo}--{owner}.aem.page/{path}`
4. Run PageSpeed Insights — fix any issues below 100
5. Open PR with preview URL in description
6. Run `gh pr checks` to verify linting and code sync status
7. Human reviewer approves → merge to `main`
8. Changes go live at `aem.live` → then to `www.tennis.com.au/nsw/`

---

## Security

* Never commit API keys, credentials, or tokens to git
* Use `.hlxignore` to prevent internal files from being served
* All code is client-side and public — do not embed secrets
* HTTPS enforced by Fastly/EDS (no HTTP allowed in production)
* External URLs should only be modified if they are part of the Tennis NSW public site or approved integrations

---

## Getting Help

* AEM EDS docs: `https://www.aem.live/docs/`
* David's Model (content authoring principles): `https://www.aem.live/docs/davidsmodel`
* Tennis NSW site knowledge: `.skills/aem/edge-delivery-services/skills/page-import/resources/tennis-nsw-site-knowledge.md`
* Tennis NSW block inventory + content models: `.skills/aem/edge-delivery-services/skills/block-inventory/resources/ta-blocks.md`
