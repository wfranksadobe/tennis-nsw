# Fix Table JCR Errors — NSW Homepage

## Problem Analysis

All 36 table errors share the same root cause: the `.plain.html` content uploaded to AEM contains **JCR-internal markers and placeholder padding** that should not exist in the delivered content.

**What's wrong** (example from `nsw.plain.html` — 6-column tournament table):
```html
<div class="table">
  <!-- ROW 1: Config row with filter value + placeholders — SHOULD NOT EXIST -->
  <div>
    <div>table-6-columns</div>
    <div>Column2</div>
    <div>Column3</div>
    <div>Column4</div>
    <div>Column5</div>
    <div>Column6</div>
  </div>
  <!-- ROW 2: Header row — correct content but has <strong> tags -->
  <div>
    <div><strong>Start</strong></div>
    <div><strong>End</strong></div>
    <div><strong>Events</strong></div>
    <div><strong>Category</strong></div>
    <div><strong>Surface</strong></div>
    <div><strong>Region</strong></div>
  </div>
  <!-- Data rows — correct 6 columns -->
  <div>...</div>
</div>
```

**What's wrong** (example from `central-west.plain.html` — 2-column table padded to 6):
```html
<div class="table">
  <!-- Config row — SHOULD NOT EXIST -->
  <div>
    <div>table-2-columns</div>
    <div>Column2</div>
    <div>Column3</div>
    <div>Column4</div>
    <div>Column5</div>
    <div>Column6</div>
  </div>
  <!-- Header row — only 2 real values, padded with placeholders -->
  <div>
    <div>Name:</div>
    <div>Position:</div>
    <div>Column3</div>   ← PLACEHOLDER, REMOVE
    <div>Column4</div>   ← PLACEHOLDER, REMOVE
    <div>Column5</div>   ← PLACEHOLDER, REMOVE
    <div>Column6</div>   ← PLACEHOLDER, REMOVE
  </div>
  <!-- Data rows — same padding problem -->
  <div>
    <div>Carey Sinden</div>
    <div>Chair</div>
    <div>Column3</div>   ← PLACEHOLDER, REMOVE
    <div>Column4</div>   ← PLACEHOLDER, REMOVE
    <div>Column5</div>   ← PLACEHOLDER, REMOVE
    <div>Column6</div>   ← PLACEHOLDER, REMOVE
  </div>
</div>
```

**What it SHOULD look like** (based on working xwalk boilerplate reference):
```html
<div class="table">
  <!-- Header row — just the actual data, correct column count -->
  <div>
    <div>Name:</div>
    <div>Position:</div>
  </div>
  <!-- Data rows — only actual content columns -->
  <div>
    <div>Carey Sinden</div>
    <div>Chair</div>
  </div>
</div>
```

## Root Cause

The original import scripts (specifically the table parser and fix scripts like `fix-table-model-rows.js`) injected JCR/model metadata directly into the HTML content as visible rows/cells. These `table-n-columns` config rows and `Column#` placeholder cells are meant to be **JCR node properties** set at the authoring layer — not HTML content in the delivery output.

When AEM's xwalk serializer reads this content back, it tries to map the first row as the first item's fields, but finds `table-6-columns` text where it expects actual content for `column1text`. This mismatch causes the validation error: "content isn't mapping to the model correctly."

## Fix Strategy (NSW Homepage Only)

We will fix **only** the `nsw.plain.html` file as a proof of concept. The fix:

1. **Remove the config/filter row** (first row containing `table-n-columns`)
2. **Remove placeholder columns** from all remaining rows — keep only the real data columns (determined by the declared column count in the config row before removing it)
3. **Verify** the resulting structure matches the boilerplate reference (just data rows with correct column count, no metadata)

## Checklist

- [ ] Read `content/nsw.plain.html` and identify the table block (lines 116-198)
- [ ] Determine actual column count from config row (`table-6-columns` → 6 columns)
- [ ] Remove the config row (line 117-124: the `<div>` containing `table-6-columns`, `Column2`...`Column6`)
- [ ] Verify remaining data rows already have exactly 6 real columns (no placeholder padding needed for 6-col tables)
- [ ] Validate the fixed structure matches the xwalk boilerplate reference format
- [ ] Preview the page locally to confirm the table renders correctly
- [ ] Once confirmed working, document the pattern for batch-fixing all 36 affected pages

## Expected Result (NSW homepage table after fix)

```html
<div class="table">
  <div>
    <div><strong>Start</strong></div>
    <div><strong>End</strong></div>
    <div><strong>Events</strong></div>
    <div><strong>Category</strong></div>
    <div><strong>Surface</strong></div>
    <div><strong>Region</strong></div>
  </div>
  <div>
    <div>2 Apr 2026</div>
    <div>6 Apr 2026</div>
    <div>
      <ul><li><a href="...">2026 O3k/OC J125/JC Nepean...</a></li></ul>
      <p>Venue: Nepean District Tennis Association, NSW</p>
    </div>
    <div>Open</div>
    <div>Various Surfaces</div>
    <div>R</div>
  </div>
  <!-- ... more data rows ... -->
</div>
```

## Notes

- The NSW homepage table is a 6-column table, so no placeholder trimming is needed on data rows — only the config row removal is required
- For other affected pages (like `central-west` with 2-column and 3-column tables), both config row removal AND placeholder column trimming from all rows will be needed
- We are NOT changing the table block JS/CSS — only fixing the content structure
- After the fix, AEM's xwalk serializer will correctly map: first row → header item fields, subsequent rows → data item fields
- Execution requires switching to Execute mode
