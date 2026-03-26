# Tennis NSW Migration Architecture

Holistic architecture reference for the Tennis NSW (tennis.com.au/nsw) migration from the current website to AEM Cloud Service with Edge Delivery Services (EDS) and Universal Editor.

---

## Migration Overview

|                     | Before (Legacy)                            | After (Target)                                                      |
| ------------------- | ------------------------------------------ | ------------------------------------------------------------------- |
| **CMS**             | Existing Tennis NSW site / content systems | AEM Cloud Service                                                   |
| **Delivery**        | Existing web hosting / CDN                 | Edge Delivery Services (Fastly/CDN)                                 |
| **Authoring**       | Existing authoring workflows               | Universal Editor (UE)                                               |
| **Content Storage** | Existing web/CMS content                   | SharePoint / Google Drive (document-based) OR AEM as Content Source |
| **Frontend**        | Existing templates and markup              | Vanilla JS/CSS EDS blocks                                           |
| **Personalisation** | Campaign-based content variations          | EDS Experimentation Plugin                                          |
| **Analytics**       | Existing tracking implementation           | Adobe Data Layer + EDS analytics block                              |
| **Images**          | Existing media assets                      | EDS image pipeline + AEM DAM (via UE)                               |
| **Navigation**      | Existing site navigation                   | EDS nav document (SharePoint/GDrive)                                |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     AUTHORING LAYER                          │
│                                                              │
│  ┌──────────────────┐    ┌───────────────────────────────┐  │
│  │  Universal Editor │    │  SharePoint / Google Drive    │  │
│  │  (UE)            │◄──►│  (Content Source)             │  │
│  │                  │    │  - Page documents              │  │
│  │  Registers blocks │    │  - Navigation document        │  │
│  │  via component-  │    │  - Metadata spreadsheet       │  │
│  │  definition.json  │    │  - Redirects spreadsheet      │  │
│  └────────┬─────────┘    └───────────────┬───────────────┘  │
│           │                              │                   │
└───────────┼──────────────────────────────┼───────────────────┘
            │                              │
            ▼                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      CODE LAYER                              │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  GitHub Repository (aem-xwalk-demo / ta-eds)         │   │
│  │                                                      │   │
│  │  blocks/        ← EDS block JS + CSS                 │   │
│  │  scripts/       ← aem.js, scripts.js, delayed.js     │   │
│  │  styles/        ← global CSS                         │   │
│  │  models/        ← UE component model JSON            │   │
│  │  component-definition.json  ← UE block registry      │   │
│  │  component-models.json      ← UE field schemas       │   │
│  │  component-filters.json     ← UE placement rules     │   │
│  └────────────────────┬─────────────────────────────────┘   │
│                       │ AEM Code Sync                        │
└───────────────────────┼─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    DELIVERY LAYER                            │
│                                                              │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Edge Delivery Services (Fastly CDN)               │     │
│  │                                                    │     │
│  │  Preview: {branch}--{repo}--{owner}.aem.page       │     │
│  │  Live:    main--{repo}--{owner}.aem.live           │     │
│  │  Prod:    www.tennis.com.au/nsw/                   │     │
│  │                                                    │     │
│  │  Serves HTML from content source + code from       │     │
│  │  GitHub. Block JS/CSS loaded on demand.            │     │
│  └────────────────────────────────────────────────────┘     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Universal Editor Integration

The Universal Editor is the visual authoring interface. It communicates with EDS pages via the **UE Service** and reads component definitions from the repository.

### How UE Registers Tennis NSW Blocks

Three files control how blocks appear in the Universal Editor's component palette:

**`component-definition.json`** — Registers each block as a UE component. Authors see this in the "Add Component" panel. For Tennis NSW:

```json
{
  "groups": [
    {
      "title": "TA Blocks",
      "id": "ta",
      "components": [
        {
          "title": "Hero",
          "id": "hero",
          "plugins": {
            "xwalk": {
              "page": { "resourceType": "core/franklin/components/block/v1/block", "template": { "name": "Hero", "model": "hero" } }
            }
          }
        },
        {
          "title": "Event Card",
          "id": "event-card",
          "plugins": {
            "xwalk": {
              "page": { "resourceType": "core/franklin/components/block/v1/block", "template": { "name": "Event Card", "model": "event-card" } }
            }
          }
        }
        // ... all Tennis NSW blocks registered here
      ]
    }
  ]
}
```

**`component-models.json`** — Defines the field schema for each block's UE editing panel:

```json
[
  {
    "id": "hero",
    "fields": [
      { "component": "richtext", "name": "text", "label": "Content" },
      { "component": "aem-content", "name": "image", "label": "Hero Image" },
      { "component": "select", "name": "variant", "label": "Variant",
        "options": [
          { "name": "Standard", "value": "" },
          { "name": "Image Right", "value": "image-right" },
          { "name": "Full Bleed", "value": "full-bleed" },
          { "name": "Editorial", "value": "editorial" }
        ]
      }
    ]
  }
]
```

**`component-filters.json`** — Controls where blocks can be placed:

```json
[
  { "id": "section", "components": ["hero", "event-card", "anchor-tile-nav", "tabs", "accordion", "footnotes"] },
  { "id": "hero-only", "components": ["hero"] }
]
```

**`models/`** directory — reusable field schemas.

---

## Three-Phase Page Loading Architecture

```
Phase 1: EAGER (< 100ms to LCP)
├── Decorate sections and blocks metadata
├── Load first section (hero block)
├── Load global styles (styles.css)
└── LCP image loaded

Phase 2: LAZY (after LCP)
├── Load header and footer blocks
├── Load remaining sections
├── Load lazy-styles.css

Phase 3: DELAYED
├── Load analytics
├── Load personalisation
├── Load third-party scripts
```

**Tennis NSW-specific loading decisions:**

* `announcement-banner` — EAGER
* `hero` — EAGER
* `anchor-tile-nav` — LAZY
* `event-listing`, `region-cards` — LAZY
* `modal` — DELAYED

---

## Tennis NSW Block Architecture

### Block Categories

**Category 1: Layout & Navigation Blocks**

* `header`
* `footer`
* `anchor-tile-nav`
* `in-page-nav`

**Category 2: Hero & Promotional Blocks**

* `hero`
* `announcement-banner`
* `promo-banner`
* `featured-content`

**Category 3: Program & Content Blocks**

* `event-card`
* `event-listing`
* `article-cards`
* `region-cards`
* `feature-grid`
* `resource-list`
* `support-cards`
* `partner-strip`

**Category 4: Content & Education Blocks**

* `tabs`
* `accordion`
* `step-process`
* `quote-carousel`
* `stats-band`

**Category 5: Support & Utility Blocks**

* `contact-form`
* `search`
* `search-results`
* `map-embed`
* `venue-highlights`

### Block Build Priority

```
Sprint 1
  ✅ header
  ✅ hero
  ✅ footer
  🔲 announcement-banner
  🔲 anchor-tile-nav

Sprint 2
  🔲 event-card
  🔲 event-listing
  🔲 feature-grid
  🔲 region-cards

Sprint 3
  🔲 in-page-nav
  🔲 step-process

Sprint 4
  🔲 article-cards
  🔲 promo-banner

Sprint 5
  🔲 search-results
  🔲 contact-form
```

---

## Navigation Architecture

### Legacy

* Current Tennis NSW navigation structure
* Section-based navigation (Clubs, Play, Regions, etc.)

### Target (EDS)

Navigation becomes authored content document.

---

## Personalisation Architecture

### Legacy

* Campaign-based variations

### Target

* Metadata-driven experiments
* Content variations

---

## Analytics Architecture

### Legacy

* Query string tracking

### Target

* Data attributes

---

## Image Architecture

### Legacy

* Existing media hosting

### Target

* EDS media pipeline

---

## Content Model Architecture (Universal Editor)

```
Page
└── Section (metadata)
    ├── Hero
    ├── Navigation
    └── Content blocks
└── Section
    └── Footer / support blocks
```

---

## Publishing Flow

(same structure preserved)

---

## Security Architecture

(same table structure preserved)

---

## Tennis NSW Project Conventions

### CSS Tokens

```css
:root {
  --tennis-green: #00853e;
  --tennis-yellow: #c4d600;
}
```

---

## Footer

Footer should include:

* Clubs
* Play
* Regions
* News
* Events
* Contact
* Privacy
* Terms

Plus Tennis NSW acknowledgement.
