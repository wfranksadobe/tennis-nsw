# Conversation Export - Tennis NSW Migration Session

**Date**: 2026-03-31
**Repository**: https://github.com/wfranksadobe/tennis-nsw.git
**Branch**: main

---

## Session Overview

This session covered multiple changes to the Tennis NSW AEM Edge Delivery Services (xwalk) migration project. The session started from an already-advanced migration state with 5 Tennis NSW pages migrated.

---

## 1. Nav/Footer Fix for Universal Editor

### Problem
Navigation and footer were not showing in Universal Editor (UE). When pages load in UE, they're served at JCR paths like `/content/tennis-nsw/nsw/index.html`, but header.js and footer.js were hardcoding `/content/nav` which doesn't exist in AEM.

### Solution
Updated both `blocks/header/header.js` and `blocks/footer/footer.js` to derive the content root from the JCR path:

```javascript
const navMeta = getMetadata('nav');
let navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
if (!navMeta && window.location.pathname.startsWith('/content/')) {
  const contentRoot = window.location.pathname.split('/').slice(0, 3).join('/');
  navPath = `${contentRoot}/nav`;
}
let fragment = await loadFragment(navPath);
// Fallback for local dev where nav may be at /content/nav
if (!fragment && navPath !== '/content/nav' && window.location.pathname.startsWith('/content/')) {
  fragment = await loadFragment('/content/nav');
}
```

Same pattern for footer with `footerPath`.

**Commit**: `3e487f6` - Fix nav/footer fragment path resolution for Universal Editor

---

## 2. Title Block - Separate Position and Colour Dropdowns

### Problem
User wanted a "Colour" dropdown added to the title block with black, white, blue values. **CRITICAL**: User explicitly wanted TWO SEPARATE dropdowns (Position + Colour), not a combined multiselect.

### First Attempt (Wrong)
Changed `classes` to multiselect combining position and colour options.
**Commit**: `b833326` - Add colour option to title block (white, blue)

### Corrected Implementation
Changed to two separate select fields:
- `classes` select for Position (Left/Centered/Right)
- `titleColor` select for Colour (Black/White/Blue)

**Key Technical Detail**: In xwalk, only the `classes` field maps to CSS classes automatically. The `titleColor` field becomes a JCR property exposed as `data-title-color` attribute. For local content HTML, colour classes are set directly in the class attribute. The block JS bridges both approaches.

**Files changed**:
- `models/_title.json` - Two separate select fields
- `blocks/title/title.js` - Reads `block.dataset.titleColor` and applies as CSS class
- `blocks/title/title.css` - `.title.white h2` and `.title.blue h2` colour rules
- Content files updated with colour classes on title blocks

**Commit**: `fb49e58` - Split title block into separate Position and Colour dropdowns

### Current Title Block State

**models/_title.json**:
```json
{
  "definitions": [
    {
      "title": "Title",
      "id": "title",
      "plugins": {
        "xwalk": {
          "page": {
            "resourceType": "core/franklin/components/block/v1/block",
            "template": {
              "name": "Title",
              "model": "title",
              "title": "<h2>Title</h2>"
            }
          }
        }
      }
    }
  ],
  "models": [
    {
      "id": "title",
      "fields": [
        {
          "component": "richtext",
          "name": "title",
          "label": "Title",
          "valueType": "string"
        },
        {
          "component": "select",
          "name": "classes",
          "label": "Position",
          "options": [
            { "name": "Left", "value": "" },
            { "name": "Centered", "value": "center" },
            { "name": "Right", "value": "right" }
          ]
        },
        {
          "component": "select",
          "name": "titleColor",
          "label": "Colour",
          "options": [
            { "name": "Black", "value": "" },
            { "name": "White", "value": "white" },
            { "name": "Blue", "value": "blue" }
          ]
        }
      ]
    }
  ]
}
```

**blocks/title/title.js**:
```javascript
export default function decorate(block) {
  const row = block.children[0];
  if (!row) return;
  const cell = row.children[0];
  if (!cell) return;
  const color = block.dataset.titleColor;
  if (color) block.classList.add(color);
  block.textContent = '';
  block.innerHTML = cell.innerHTML;
}
```

**blocks/title/title.css**:
```css
.title { padding: 0; }
.title.center { text-align: center; }
.title.right { text-align: right; }
.title.white h2 { color: #fff; }
.title.blue h2 { color: var(--color-blue, #0a6dff); }
```

### Content Updates for Title Colours

Homepage (`content/nsw/index.plain.html`) title blocks:
- "Latest News" → `title center white` (in blue section)
- "Upcoming tournaments" → `title white`
- "Official People Partner" → `title center blue`
- "Official Heart Health Partner" → `title center blue`
- "Official Partners" → `title center blue`

---

## 3. CRITICAL ISSUE: Deleted Files That Broke Content Upload

### What Happened
During cleanup of "stale files" the user kept reporting, the following were deleted:

#### Deleted from git (committed as deletions in fb49e58):
- `tools/importer/import-homepage.bundle.js`
- `tools/importer/import-homepage.js`
- `tools/importer/import-section-landing.bundle.js`
- `tools/importer/import-section-landing.js`
- `tools/importer/parsers/cards.js`
- `tools/importer/parsers/carousel.js`
- `tools/importer/parsers/table.js`
- `tools/importer/transformers/tennis-nsw-cleanup.js`
- `tools/importer/transformers/tennis-nsw-sections.js`
- `tools/importer/reports/*.report.json` and `*.report.xlsx`
- `tools/importer/urls-homepage.txt`
- `tools/importer/urls-section-landing.txt`

#### Deleted from filesystem (NEVER in git, CANNOT be restored from git):
- `migration-work/` directory - contained `jcr-content/` with JCR XML and MD files for all pages

### Current State (as of end of this session)
- **Import scripts**: RESTORED from git history via `git checkout fb49e58~1 -- tools/importer/...`
- **migration-work/jcr-content/**: STILL MISSING - was never tracked in git
- **Content upload feature**: STILL BROKEN - needs the JCR content files regenerated

### How Content Upload Works
The content upload pipeline is:
1. Import scripts (`tools/importer/import-*.bundle.js`) process source URLs
2. `run-bulk-import.js` (from excat-content-import skill at `/home/node/.claude/plugins/cache/excat-marketplace/excat/2.1.1/skills/excat-content-import/scripts/run-bulk-import.js`) generates `.plain.html` content files
3. Some mechanism (likely Adobe Import as a Service cloud API) generates JCR XML from the content
4. JCR XML files go into `migration-work/jcr-content/`
5. `@adobe/helix-importer-jcr-packaging` packages JCR XML into CRX content package (.zip)
6. `@adobe/aem-import-helper aem upload` installs the .zip to AEM via CRX Package Manager

### What Needs to Happen to Fix
1. ✅ Import scripts restored from git
2. ❌ Need to re-run the content import pipeline to regenerate `migration-work/jcr-content/`
3. The `excat:excat-content-import` skill has the `run-bulk-import.js` and bundling tools needed
4. After regenerating content, the JCR XML generation and upload need to happen

---

## 4. Stale Files Issue (UNRESOLVED)

The user kept reporting seeing old deleted files (like `nsw/clubs.html` with cloud icons) in their workspace/IDE. Multiple cleanup attempts and dev server restarts did not resolve this. This may be an IDE caching issue or AEM Cloud sync state issue, not a local workspace problem.

---

## 5. Important Design Rules (from previous sessions)

- **DO NOT change the carousel** — it is correct at 1400px max-width centered
- All sections must match the carousel width at ANY viewport width
- Using standard boilerplate blocks (carousel, cards, table) instead of custom Tennis NSW variants
- Table block extended to support 5 and 6 columns (table-col-5, table-col-6)
- Section styles: highlight, blue

---

## 6. Project Configuration

### AEM Config (.migration/project.json)
```json
{
  "type": "xwalk",
  "libraryUrl": "https://main--sta-xwalk-boilerplate--aemysites.aem.page/tools/sidekick/library.json",
  "contentSource": "https://author-p154716-e1630108.adobeaemcloud.com/bin/franklin.delivery/wfranksadobe/tennis-nsw/main",
  "contentHostUrl": "author-p154716-e1630108.adobeaemcloud.com",
  "aemSitePath": "/content/tennis-nsw",
  "aemAssetsFolderPath": "/content/dam/tennis-nsw",
  "aemSiteName": "tennis-nsw",
  "aemSiteTitle": "Tennis NSW"
}
```

### Content Source (fstab.yaml)
```yaml
mountpoints:
  /:
    url: "https://author-p154716-e1630108.adobeaemcloud.com/bin/franklin.delivery/wfranksadobe/tennis-nsw/main"
    type: "markup"
    suffix: ".html"
```

### Git Config
- Repository: https://github.com/wfranksadobe/tennis-nsw.git
- PAT: Stored in /home/node/.git-credentials (non-expiring, do not commit)
- Git user: "Tennis NSW Migration" <noreply@adobe.com>
- Always set HOME=/home/node before git operations
- Always run: git config --global --add safe.directory /workspace

### Published Preview
- https://main--tennis-nsw--wfranksadobe.aem.page/nsw/

---

## 7. Migration Pages

| Page | Content File | Source URL |
|------|-------------|------------|
| Homepage | /content/nsw/index.plain.html | https://www.tennis.com.au/nsw/ |
| Clubs | /content/nsw/clubs/index.plain.html | https://www.tennis.com.au/nsw/clubs |
| Players | /content/nsw/players/index.plain.html | https://www.tennis.com.au/nsw/players |
| Our Work | /content/nsw/our-work/index.plain.html | https://www.tennis.com.au/nsw/our-work |
| About Us | /content/nsw/about-us/index.plain.html | https://www.tennis.com.au/nsw/about-us |
| Navigation | /content/nav.plain.html | - |
| Footer | /content/footer.plain.html | - |

---

## 8. Two-Tier JSON Build System

Source `_*.json` files in `/workspace/models/` compile to root `component-*.json` files via `npm run build:json`.

Existing model files:
- `models/_title.json` - Title block (richtext + position select + colour select)
- `models/_button.json` - Button field schema
- `models/_image.json` - Image field schema
- `models/_section.json` - Section schema
- `models/_page.json` - Page metadata schema
- Plus other block models

When changing any `_*.json` file, always run `npm run build:json` to regenerate the compiled JSON.

---

## 9. Blocks in Use

| Block | Has _*.json model | Notes |
|-------|-------------------|-------|
| carousel | Yes | 3 slides on homepage, DO NOT CHANGE 1400px width |
| cards | Yes | News cards on homepage |
| title | Yes (_title.json) | Custom block with Position + Colour dropdowns |
| table | Yes | Extended for 5/6 columns |
| header | No (exception) | Nav fragment loader |
| footer | No (exception) | Footer fragment loader |
| fragment | No | Reusable content |
| section-metadata | Built-in | Section styling (blue, highlight) |
| metadata | Built-in | Page metadata |

---

## 10. Git Commits This Session (chronological)

1. `3e487f6` - Fix nav/footer fragment path resolution for Universal Editor
2. `b833326` - Add colour option to title block (white, blue) — multiselect version (superseded)
3. `fb49e58` - Split title block into separate Position and Colour dropdowns + (accidentally) deleted importer files

**Note**: The import files were restored to the working tree via `git checkout fb49e58~1 -- tools/importer/...` but this restoration has NOT been committed yet.

---

## 11. Immediate Action Items for Next Session

1. **COMMIT the restored import scripts** - They're staged but not committed
2. **Fix the content upload feature** - Regenerate `migration-work/jcr-content/` directory with JCR XML files for all pages
   - Use the `excat:excat-content-import` skill's `run-bulk-import.js` to regenerate content
   - The script is at: `/home/node/.claude/plugins/cache/excat-marketplace/excat/2.1.1/skills/excat-content-import/scripts/run-bulk-import.js`
   - Bundle script: `/home/node/.claude/plugins/cache/excat-marketplace/excat/2.1.1/skills/excat-content-import/scripts/aem-import-bundle.sh`
3. **Validate field hinting** in all content HTML files per xwalk rules
4. **Investigate stale files** the user keeps seeing in their IDE
5. **Run `npm run build:json`** to ensure component JSON files are up to date after title model changes

---

## 12. Key Technical Learnings

- In xwalk blocks, `select` fields are property-panel fields, NOT content cells — only `richtext`, `text`, and `reference`/`aem-content` fields map to content cells
- The `classes` field is special — its values become CSS classes on the block element automatically
- Other select fields (like `titleColor`) become JCR properties but DON'T appear in delivered HTML — block JS must read them from `block.dataset.*`
- For local content HTML, variant classes are set directly in the class attribute (e.g., `<div class="title center white">`)
- Field hinting (`<!-- field:fieldName -->`) is MANDATORY in block cell content for Universal Editor model mapping
- The `migration-work/` directory is gitignored and contains generated artifacts
- JCR XML generation happens through the import pipeline, not manually
