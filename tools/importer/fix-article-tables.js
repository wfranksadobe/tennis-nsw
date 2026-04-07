#!/usr/bin/env node
/**
 * Fix bare HTML <table> elements in content-article .plain.html files.
 * Converts them to EDS table block format: <div class="table"><div><div>...</div></div></div>
 * Also fixes alt=" Banner" to alt="Banner".
 */

const fs = require('fs');
const path = require('path');

const CONTENT_DIR = '/workspace/content/nsw';

function findFiles(dir, ext) {
  const results = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      results.push(...findFiles(fullPath, ext));
    } else if (item.name.endsWith(ext)) {
      results.push(fullPath);
    }
  }
  return results;
}

function htmlTableToEdsBlock(tableHtml) {
  // Extract rows from HTML table
  const rows = [];
  const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let trMatch;
  while ((trMatch = trRegex.exec(tableHtml)) !== null) {
    const cells = [];
    const cellRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
    let cellMatch;
    while ((cellMatch = cellRegex.exec(trMatch[1])) !== null) {
      cells.push(cellMatch[1].trim());
    }
    if (cells.length > 0) {
      rows.push(cells);
    }
  }

  if (rows.length === 0) return tableHtml; // Can't parse, leave as is

  // Build EDS table block
  // Add <!-- field:column --> to first row cells so table.js treats all rows as data
  let eds = '<div class="table">';
  rows.forEach((row, rowIdx) => {
    eds += '<div>';
    for (const cell of row) {
      if (rowIdx === 0) {
        eds += `<div><!-- field:column -->${cell}</div>`;
      } else {
        eds += `<div>${cell}</div>`;
      }
    }
    eds += '</div>';
  });
  eds += '</div>';
  return eds;
}

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let changed = false;
  const relPath = path.relative('/workspace/content', filePath);

  // Fix 1: Convert bare <table> to EDS table block
  // Match <table...>...</table> including nested tbody/thead
  const tableRegex = /<table[^>]*>[\s\S]*?<\/table>/gi;
  const tables = content.match(tableRegex);
  if (tables) {
    for (const table of tables) {
      const edsBlock = htmlTableToEdsBlock(table);
      if (edsBlock !== table) {
        // The table block needs to be a sibling div in the section, not inline.
        // Split the article section: content before table + table block + content after table
        content = content.replace(table, `</div>\n<div>${edsBlock}</div>\n<div>`);
        changed = true;
      }
    }
    // Clean up empty divs created by splitting
    content = content.replace(/<div>\s*<\/div>/g, '');
    // Clean up double newlines
    content = content.replace(/\n\n\n+/g, '\n');
  }

  // Fix 2: Fix alt=" Banner" -> alt="Banner"
  if (content.includes('alt=" Banner"')) {
    content = content.replace(/alt=" Banner"/g, 'alt="Banner"');
    changed = true;
  }

  // Fix 3: Fix alt=" " or other space-only alt text
  content = content.replace(/alt="\s+"/g, 'alt=""');

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`  ✅ Fixed: ${relPath}`);
    return true;
  }
  return false;
}

const files = findFiles(CONTENT_DIR, '.plain.html');
console.log(`Scanning ${files.length} content files...\n`);

let fixedCount = 0;
for (const file of files) {
  if (fixFile(file)) fixedCount++;
}

console.log(`\nDone: ${fixedCount} files fixed out of ${files.length} scanned.`);
