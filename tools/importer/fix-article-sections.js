#!/usr/bin/env node
/**
 * Fix article content sections:
 * 1. Merge split sections (article text + table + more text) back into ONE section
 * 2. Keep table blocks inside the article section as siblings
 * 3. Add section-metadata style: white to article content sections
 */

const fs = require('fs');
const path = require('path');

const CONTENT_DIR = '/workspace/content/nsw';

function findFiles(dir, ext) {
  const results = [];
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) results.push(...findFiles(full, ext));
    else if (item.name.endsWith(ext)) results.push(full);
  }
  return results;
}

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  const relPath = path.relative('/workspace/content', filePath);
  let changed = false;

  // Parse into top-level sections (direct children divs of the document)
  // Each section is a <div>...</div> at the root level
  const sections = [];
  let pos = 0;
  while (pos < content.length) {
    const start = content.indexOf('<div>', pos);
    if (start === -1) break;

    // Find the matching closing </div> by tracking depth
    let depth = 1;
    let i = start + 5;
    while (i < content.length && depth > 0) {
      const nextOpen = content.indexOf('<div', i);
      const nextClose = content.indexOf('</div>', i);
      if (nextClose === -1) break;
      if (nextOpen !== -1 && nextOpen < nextClose) {
        depth++;
        i = nextOpen + 4;
      } else {
        depth--;
        if (depth === 0) {
          sections.push(content.substring(start, nextClose + 6));
          pos = nextClose + 6;
        }
        i = nextClose + 6;
      }
    }
    if (depth > 0) break; // malformed, stop
  }

  if (sections.length === 0) return false;

  // Identify section types
  const classified = sections.map((s) => {
    if (s.includes('class="breadcrumb"')) return { type: 'breadcrumb', html: s };
    if (s.includes('class="banner"')) return { type: 'banner', html: s };
    if (s.includes('class="metadata"')) return { type: 'metadata', html: s };
    if (s.includes('section-metadata')) {
      if (s.includes('grey')) return { type: 'also-in', html: s };
      if (s.includes('blue') && s.includes('class="cards')) return { type: 'cards', html: s };
      if (s.includes('white')) {
        // Article section with white style — check if it needs merging with adjacent content
        return { type: 'article-content', html: s };
      }
      return { type: 'styled-section', html: s };
    }
    // Sections without section-metadata that contain article content or table blocks
    if (s.includes('<p>') || s.includes('<h1') || s.includes('<h2') || s.includes('<h3')
        || s.includes('<h4') || s.includes('class="table"') || s.includes('<ul>') || s.includes('<ol>')) {
      return { type: 'article-content', html: s };
    }
    // Empty or near-empty sections (just whitespace or empty divs) — treat as article content
    const stripped = s.replace(/<\/?div>/g, '').trim();
    if (stripped === '' || stripped.length < 10) {
      return { type: 'article-content', html: s };
    }
    return { type: 'unknown', html: s };
  });

  // Find consecutive article-content sections and merge them into one
  const merged = [];
  let articleBuffer = [];

  function stripSectionMeta(html) {
    // Remove section-metadata div from inner content before merging
    return html.replace(/<div class="section-metadata">.*?<\/div><\/div><\/div>/g, '');
  }

  for (const section of classified) {
    if (section.type === 'article-content') {
      // Extract inner content (strip outer <div>...</div> and any section-metadata)
      let inner = section.html.replace(/^<div>/, '').replace(/<\/div>$/, '');
      inner = stripSectionMeta(inner);
      articleBuffer.push(inner);
    } else {
      // Flush article buffer if we have one
      if (articleBuffer.length > 0) {
        const mergedContent = articleBuffer.join('\n');
        const mergedSection = `<div>${mergedContent}<div class="section-metadata"><div><div>style</div><div>white</div></div></div></div>`;
        merged.push(mergedSection);
        if (articleBuffer.length > 1) changed = true;
        articleBuffer = [];
      }
      merged.push(section.html);
    }
  }

  // Flush remaining article buffer
  if (articleBuffer.length > 0) {
    const mergedContent = articleBuffer.join('\n');
    const mergedSection = `<div>${mergedContent}<div class="section-metadata"><div><div>style</div><div>white</div></div></div></div>`;
    merged.push(mergedSection);
    if (articleBuffer.length > 1) changed = true;
  }

  // Also fix: single article sections that lack section-metadata style: white
  const finalSections = merged.map((s) => {
    if (!s.includes('section-metadata') && !s.includes('class="breadcrumb"')
        && !s.includes('class="banner"') && !s.includes('class="metadata"')
        && (s.includes('<p>') || s.includes('<h1') || s.includes('<h2') || s.includes('class="table"'))) {
      changed = true;
      return s.replace(/<\/div>$/, '<div class="section-metadata"><div><div>style</div><div>white</div></div></div></div>');
    }
    return s;
  });

  if (changed) {
    const newContent = finalSections.join('\n') + '\n';
    fs.writeFileSync(filePath, newContent, 'utf-8');
    console.log(`  ✅ Fixed: ${relPath}`);
    return true;
  }
  return false;
}

const files = findFiles(CONTENT_DIR, '.plain.html');
console.log(`Scanning ${files.length} content files for section fixes...\n`);

let fixedCount = 0;
for (const file of files) {
  if (fixFile(file)) fixedCount++;
}

console.log(`\nDone: ${fixedCount} files fixed.`);
