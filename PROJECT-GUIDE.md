# Tennis NSW Migration - Comprehensive Project Guide

## Project Overview

This is the Tennis NSW website migration from WordPress to AEM Cloud Service with Edge Delivery Services (EDS) and Universal Editor (UE). The source site is `https://www.tennis.com.au/nsw/`.

**Repository:** `https://github.com/wfranksadobe/tennis-nsw`
**AEM Author:** `https://author-p154716-e1630108.adobeaemcloud.com`
**Preview:** `https://main--tennis-nsw--wfranksadobe.aem.page/nsw/`
**Live:** `https://main--tennis-nsw--wfranksadobe.aem.live/nsw/`

---

## Migration Status

| Layout Type | Count | Status |
|------------|-------|--------|
| Homepage | 1 | Migrated |
| Section Landing | 5 (4 migrated, 1 pending: Regions) | Mostly migrated |
| Content Cards | 32 | Migrated |
| Content Article | 71 | Migrated |
| News Article | 100 | Migrated |
| Content Contact | 1 | Pending (Contacts page) |
| Content Mixed | 1 | Pending (Rally as One redemption) |
| External | 7 | Ignored |
| **Total** | **218** | **207 migrated, 3 pending, 8 ignored** |

The CSV tracker is at `migration-work/site-inventory.csv`.

---

## Architecture: How Content Flows

### Local Preview (localhost:3000)
- Content served from `/workspace/content/*.plain.html`
- JS/CSS from `/workspace/blocks/`, `/workspace/styles/`, `/workspace/scripts/`
- EDS decorates blocks client-side

### AEM (aem.page / aem.live)
- Content uploaded via content packages to AEM author
- AEM's **md2jcr** converts `.plain.html` → JCR → markdown → HTML
- Code synced from GitHub to delivery (aem.page/aem.live)
- Component definitions read from `component-definition.json`, `component-models.json`, `component-filters.json`

### Critical md2jcr Behaviours

These are hard-won lessons from extensive debugging:

1. **Images in blocks require `reference` field type** — `richtext` fields strip `<img>` tags during import. Only `reference` type fields import images to DAM correctly. This is why the `roster` block exists separately from `table`.

2. **Table block always uses 6-column default** — The table definition template defaults to `filter: "table-6-columns"`. md2jcr ignores the filter value in content rows and always creates 6-column child nodes. The `table.js` strips unused "ColumnN" default columns.

3. **Definition title MUST match template.name** — md2jcr matches components by `title`, not `id`. If `title: "My Block"` but `template.name: "Something Else"`, md2jcr throws "component does not exist".

4. **Child items need definition entries** — Filter components (like `table-image-col`) need their own definition entry with `resourceType: "core/franklin/components/block/v1/block/item"`, not just a model and filter entry.

5. **Block names must be single words or hyphenated** — Class `"table-image"` maps to block directory `blocks/table-image/`. Class `"table image"` is a variant of `table` (uses same definition, NOT a separate block).

6. **Section filter must include block** — Blocks must be listed in the section filter (`component-filters.json`) for md2jcr to recognise them.

7. **`<p>` wrapping for images** — Images in reference fields need `<p><img src="..."></p>` wrapping. Bare `<img>` without `<p>` may not be imported correctly.

8. **Field hints** — `<!-- field:fieldname -->` comments in content help local preview map rows to model fields. On AEM, md2jcr uses the model definition instead.

9. **Buttons** — EDS auto-converts standalone `<a>` in `<p>` to `.button` class. We restyle `a.button` as regular text links (not navy buttons) to match the original site.

10. **Section overflow** — `overflow: hidden` on `main > .section` prevents child margin collapse creating gaps between sections.

---

## Component JSON Build System

Source files (`_*.json`) in `blocks/` and `models/` compile to root files:

```bash
npm run build:json
```

**Source → Compiled:**
- `blocks/*/_*.json` + `models/_*.json` → `component-definition.json`, `component-models.json`, `component-filters.json`

**NEVER edit the root JSON files directly — always edit the source `_*.json` files.**

---

## Blocks Reference

### Title Block (`blocks/title/`)

**Purpose:** Page headings with configurable type, position, and colour.

**Model Fields (5 rows):**
| Row | Field | Type | Values |
|-----|-------|------|--------|
| 0 | title | text | The heading text |
| 1 | type | select | h1, h2, h3, h4, h5, h6 |
| 2 | link | aem-content | Optional URL |
| 3 | position | select | left, center, right |
| 4 | colour | select | black, white, blue |

**Content example:**
```html
<div class="title">
  <div><div>Our Team</div></div>
  <div><div>h1</div></div>
  <div><div></div></div>
  <div><div>center</div></div>
  <div><div>blue</div></div>
</div>
```

**CSS:** Uppercase, font-weight 100 (thin), matching original Tennis NSW site.

---

### Banner Block (`blocks/banner/`)

**Purpose:** Hero banner with responsive desktop/mobile images.

**Model Fields (2 rows):**
| Row | Field | Type |
|-----|-------|------|
| 0 | desktop | reference |
| 1 | mobile | reference |

**Content example:**
```html
<div class="banner">
  <div><div><!-- field:desktop --><p><img src="URL" alt="Banner"></p></div></div>
  <div><div><!-- field:mobile --><p><img src="URL" alt="Banner"></p></div></div>
</div>
```

**Breakpoint:** Switches at 768px.

---

### Breadcrumb Block (`blocks/breadcrumb/`)

**Purpose:** Auto-generates breadcrumb navigation from URL path.

**Model Fields (1 row):**
| Row | Field | Type | Values |
|-----|-------|------|--------|
| 0 | levels | select | 1-5 (max segments to show) |

**JS Behaviour:**
- Strips `.html` extension from URL
- Strips `/content/` prefix (AEM paths)
- First crumb always "Tennis NSW" (for `/nsw`)
- Last crumb uses page `<title>` text (before `|`)
- Current page shown in blue, bold

---

### Roster Block (`blocks/roster/`)

**Purpose:** Staff/team directory with images and contact details. Created specifically because the `table` block's `richtext` fields strip images on AEM. The roster uses `reference` type for images which AEM imports to DAM correctly.

**IMPORTANT:** This block exists because md2jcr strips `<img>` from richtext fields. The roster's column 1 uses `reference` type (like carousel) so images survive the AEM pipeline.

**Model Fields (1 row):**
| Row | Field | Type | Values |
|-----|-------|------|--------|
| 0 | classes | multiselect | no-header, reversed |

**Child Row Model (`table-image-col`):**
| Column | Field | Type |
|--------|-------|------|
| 1 | column1image | reference |
| 2 | column2text | richtext |

**Variants:**

| Variant | Class | Description |
|---------|-------|-------------|
| Standard | `roster` | Image left (100x150px), text right |
| Reversed | `roster reversed` | Text left, image right (140x190px) |

**Content example (standard):**
```html
<div class="roster">
  <div><div>no-header</div></div>
  <div>
    <div><!-- field:column1image --><p><img src="URL" alt="Name"></p></div>
    <div><!-- field:column2text --><strong>Name</strong><br>Title<br><br>M: 0400 000 000<br><a href="mailto:email">E: email</a></div>
  </div>
</div>
```

**Content example (reversed - for board page):**
```html
<div class="roster reversed">
  <div><div>no-header</div></div>
  <div>
    <div><!-- field:column1image --><p><img src="URL" alt="Name"></p></div>
    <div><!-- field:column2text --><strong>Name</strong><br>Title</div>
  </div>
</div>
```

**Text formatting in column 2:**
- `<strong>Name</strong>` — bold name
- `<br>Job Title` — next line
- `<br><br>M: phone` — blank line then mobile (the double `<br>` creates visual gap)
- `<br><a href="mailto:x">E: x</a>` — email on same line as `E:` (critical: put `E:` INSIDE the `<a>` tag so md2jcr doesn't split them)

**CSS placeholder:** Empty image cells show a grey silhouette via CSS `background-image` on `td:first-child`. When a real image is present, `:has(picture)` hides the placeholder. Row height is set to `174px` (standard) or `210px` (reversed) to ensure placeholders aren't cut off.

**AEM DAM import:** SVG data URIs do NOT survive AEM's reference field import. Only real image URLs (https://...) get imported to DAM. Use CSS placeholders for missing photos, not data URIs.

---

### Cards Block (`blocks/cards/`)

**Purpose:** Content cards with title, image, text, and CTA link.

**Child Row Model (`card`):**
| Field | Type | Notes |
|-------|------|-------|
| title | text | Card heading |
| image | reference | Card image (imported to DAM) |
| text | richtext | Description |
| link | text | CTA URL |

**Variants:**
| Variant | Class | Description |
|---------|-------|-------------|
| Standard | `cards` | 3-col, 300px width, navy, box shadow |
| Compact | `cards compact` | 2-col, 460px, floated image, blue |
| Feature | `cards feature` | 2-col, 460px, large image above text |
| Contact | `cards contact` | 2-col grid, horizontal card layout (deprecated — use roster instead) |

**AEM link text issue:** md2jcr replaces card link display text with the URL. The `cards.js` detects when link text starts with `http` or `/` and replaces it with "Find out more".

**Auto-detection:** When a cards block is in a `.section.blue` with 4+ cards and no explicit variant, JS auto-adds `compact blue` classes.

---

### Table Block (`blocks/table/`)

**Purpose:** Data tables for schedules, lists, event info.

**Model Fields (2 rows):**
| Row | Field | Type | Values |
|-----|-------|------|--------|
| 0 | classes | multiselect | striped, bordered, no-header |
| 1 | filter | select | table, table-2-columns through table-6-columns |

**CRITICAL: AEM always uses `table-6-columns` default regardless of content filter value.** The `table.js` has `getColumnsToRemove()` which strips columns where every row has literal "ColumnN" default text. This handles all column counts automatically.

**Content example:**
```html
<div class="table">
  <div><div>no-header</div></div>
  <div><div>table-2-columns</div></div>
  <div><div><!-- field:column -->Header 1</div><div>Header 2</div></div>
  <div><div>Data 1</div><div>Data 2</div></div>
</div>
```

**DO NOT put images in table cells** — use the `roster` block instead. Table cells use `richtext` which strips images on AEM.

---

### Carousel Block (`blocks/carousel/`)

**Child model (`carousel-item`):**
| Field | Type |
|-------|------|
| media_image | reference |
| media_imageAlt | text |
| content_text | richtext |

Auto-rotates every 5 seconds. Pause on hover.

---

## Section Styles

Controlled via `section-metadata` at the end of each section `<div>`:

```html
<div class="section-metadata">
  <div><div>style</div><div>blue</div></div>
</div>
```

| Style | Background | Text | Usage |
|-------|-----------|------|-------|
| `white` | White, no criss-cross | Grey text, blue headings | Article content |
| `blue` | Blue (#0a6dff) | White | News cards, tournaments |
| `grey` | Light grey (rgb 248 248 248) | Grey text, blue links | Also In navigation |
| `center` | Inherit | Centered text | Can combine: `white, center` |
| `dark` | Navy | White | Dark sections |
| `highlight` | Light grey | Default | Highlighted sections |

**Key CSS rules:**
- `main > .section { overflow: hidden; }` — prevents margin collapse gaps
- `main > .section { padding-top: 0; padding-bottom: 0; }` — zero spacing between sections
- `main .section.white { background-image: none; }` — hides criss-cross pattern
- Global body text: `--text-color: #6c6f6f` (grey, not black)
- h1: `50px, uppercase, font-weight: 100, blue`
- h2: `30px, uppercase, font-weight: 100`

---

## Content Page Templates

### Content-Cards Page
```
breadcrumb → banner → Also In (grey) → title block → cards
```

### Content-Article Page
```
breadcrumb → banner (optional) → Also In (grey) → article body (white) → cards (optional, blue)
```

### News Article Page
```
h1 title → byline (italic) → inline image → article body → metadata
```
No breadcrumb, no banner, no Also In.

### Staff Page (roster)
```
breadcrumb → banner → Also In (grey) → title + intro (white) → [h2 title (center) + roster block (white)] per department → list sections for TA teams
```

### Board Page (roster reversed)
```
breadcrumb → banner → Also In (grey) → title + intro (white) → roster reversed block (white)
```

---

## Common Fixes

### JCR Error: "Component X does not exist"
1. Check `component-definition.json` — is the component there?
2. Check that `title` matches `template.name` EXACTLY
3. Check `component-filters.json` — is it in the section filter?
4. Run `npm run build:json` and push
5. Wait for code sync to AEM author

### JCR Error: "Table has errors"
The table block has both `model` and `filter`. Content rows must match:
- Row 0 → classes (can be empty)
- Row 1 → filter value (e.g., "table-2-columns")
- Row 2+ → data rows

### JCR Error: "Element X not supported"
Unsupported HTML elements in content. Common culprits:
- `<blockquote>` → convert to `<p><em>`
- `<img>` in richtext table cells → use roster block instead
- `<br />` self-closing tags → use `<br>`
- Bare WordPress `<div>` wrappers → remove
- Cloudflare email protection → decode hex and replace with mailto links

### Images missing on AEM
- `richtext` fields strip images → use `reference` field type
- SVG data URIs don't import to DAM → use CSS placeholders
- Images need `<p>` wrapping: `<p><img src="..."></p>`

### Card link text shows URL
md2jcr replaces link display text with URL. Fixed in `cards.js` — detects `/` or `http` prefix and replaces with "Find out more".

### Sections have gaps between them
`overflow: hidden` on `main > .section` prevents child margin collapse. Also ensure zero padding on all section variants.

### Blue background on white content sections
The `.table-container` auto-class was forcing blue on all sections with tables. Changed to `.section.blue.table-container` so only explicitly blue sections get blue styling.

---

## GitHub & Deployment

**Credentials:**
- Git user: "Tennis NSW Migration" <noreply@adobe.com>
- GitHub PAT: `[STORED IN .git-credentials]`
- Push: `git remote set-url origin https://TOKEN@github.com/wfranksadobe/tennis-nsw.git`
- Always run: `export HOME=/home/node && git config --global --add safe.directory /workspace`

**Content source:** `/workspace/content/` (excluded from git via `.git/info/exclude`)
- Use `git add -f` to force-add content files

**Build:** `npm run build:json` to compile `_*.json` → root component JSON files

**Deploy:** Push to main → code sync to aem.page/aem.live → content upload via AEM packages

---

## Navigation (`content/nav.plain.html`)

The nav file has 3 top-level `<div>` sections that the `blocks/header/header.js` parses:

### Section 1: Brand Logo
```html
<div>
  <p><a href="/nsw"></a></p>
  <p>NSW</p>
</div>
```
- Empty link text = logo image (handled by header JS)
- Second `<p>` = "NSW" badge text

### Section 2: Main Navigation Menu
```html
<div>
  <ul>
    <li>
      <p><a href="/nsw/clubs">Clubs</a></p>
      <ul>
        <li><p><a href="...">Child</a></p>
          <ul>
            <li><a href="...">Grandchild</a></li>
          </ul>
        </li>
      </ul>
    </li>
    <!-- Play, Our Work, About Us -->
  </ul>
</div>
```
- 4 main sections: Clubs, Play, Our Work, About Us
- Up to 3 levels deep (section → child → grandchild)
- Links wrapped in `<p>` tags for items that have children
- Leaf items are plain `<li><a>` without `<p>`

### Section 3: Utility Bar + Actions
```html
<div>
  <ul>
    <li><a href="/nsw/coaches">Coaches</a></li>
    <li><a href="...">Regions</a></li>
    <!-- more portal links -->
  </ul>
  <ul>
    <li><a href="#search">Search</a></li>
    <li><a href="https://www.tennis.com.au/play">Start Playing</a></li>
  </ul>
</div>
```

**CRITICAL: Exactly 2 `<ul>` lists required.** The header JS expects:
- `lists[0]` = portal/utility links (top bar: Coaches, Regions, Competitive Play, Officials, Visit Tennis Australia)
- `lists[1]` = action links (Search icon + Start Playing button)

Adding a third `<ul>` breaks Search and Start Playing icons — the JS only reads `lists[1]` for actions.

Social links (Contact, Facebook, Twitter) are **hardcoded in header.js** (not from nav content).

### Header JS Processing
1. Section 1 → brand logo + NSW badge
2. Section 2 → desktop mega-menu + mobile accordion
3. Section 3 → utility bar at top + search/start playing on right
4. Mobile: hamburger menu, accordion sub-menus, blue background

### Link Types in Nav
- **Relative** (`/nsw/...`) — migrated pages
- **Absolute** (`https://www.tennis.com.au/nsw/...`) — unmigrated pages only (regions, contacts)
- **External** (`https://hotshots.tennis.com.au/`) — Hot Shots, Social Play, Find A Coach, external partners

---

## Footer (`content/footer.plain.html`)

Uses a columns-based layout with 4 columns (Clubs, Play, Our Work, About Us) + copyright row. Headings use `<h2>` (not linked — `<h2><a>` breaks on AEM round-trip). Footer logo is a standalone `<img>` (not wrapped in `<a>` — images inside links get stripped by AEM).

---

## Import Tools

| Tool | Purpose | Location |
|------|---------|----------|
| `import-content-article.js` | Content-article pages (70) | `tools/importer/` |
| `import-news-article.js` | News articles (100) | `tools/importer/` |
| `fix-broken-images.js` | Scan and fix 404 image URLs | `tools/importer/` |
| `fix-article-sections.js` | Merge split sections, add white style | `tools/importer/` |
| `fix-table-model-rows.js` | Add model config rows to tables | `tools/importer/` |
| `fix-news-tables.js` | Convert bare `<table>` in news | `tools/importer/` |

---

## DAM Images

444 images downloaded and packaged in 3 zip files:
- `dam-images-part1.zip` (47MB) — 2015-2023
- `dam-images-part2.zip` (22MB) — 2024
- `dam-images-part3.zip` (47MB) — 2025-2026

Upload to AEM Assets at `/content/dam/tennis-nsw/` — folder structure: `nsw/files/YYYY/MM/filename`

---

## Files Changed Summary

### New Blocks Created
- `blocks/title/` — title, title.js, title.css
- `blocks/banner/` — banner.js, banner.css, _banner.json
- `blocks/breadcrumb/` — breadcrumb.js, breadcrumb.css, _breadcrumb.json
- `blocks/roster/` — roster.js, roster.css, _roster.json (re-exports table.js)
- `blocks/contact/` — contact.js, contact.css, _contact.json (deprecated, replaced by roster)

### Modified Blocks
- `blocks/cards/` — cards.js (auto-detect variant, fix link text), cards.css (contact variant)
- `blocks/table/` — table.js (config row detection, ColumnN stripping), table.css (image sizing, no-header), _table.json (image-text model/filter)
- `blocks/carousel/` — 5-second auto-rotate, pause on hover
- `blocks/header/` — mobile accordion, desktop alignment
- `blocks/footer/` — columns-based layout for AEM compatibility
- `blocks/columns/` — columns.css (reverted to width: 100%)

### Global Styles
- `styles/styles.css` — section styles, body text grey, h1/h2 uppercase thin, zero section gaps, overflow hidden, button restyled as links, criss-cross background pattern

### Models
- `models/_section.json` — section styles (blue, white, grey, center, highlight, dark) + component filter
- `models/_title.json` — title block fields

### Content
- 206 `.plain.html` files in `content/nsw/`
- `content/nav.plain.html` — full navigation matching source site
- `content/footer.plain.html` — footer with columns layout
