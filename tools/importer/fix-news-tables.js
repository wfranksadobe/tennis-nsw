#!/usr/bin/env node
/**
 * Fix bare HTML <table> elements and WordPress artifacts in news articles.
 * Converts tables to EDS table block format and removes bare <div> wrappers.
 */

const fs = require('fs');
const path = require('path');

const CONTENT_DIR = '/workspace/content/nsw/news';

function findFiles(dir, ext) {
  const results = [];
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) results.push(...findFiles(full, ext));
    else if (item.name.endsWith(ext)) results.push(full);
  }
  return results;
}

function getFilterValue(colCount) {
  if (colCount <= 1) return 'table';
  if (colCount >= 6) return 'table-6-columns';
  return `table-${colCount}-columns`;
}

function convertTable(tableHtml) {
  const rows = [];
  const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let trMatch;
  while ((trMatch = trRegex.exec(tableHtml)) !== null) {
    const cells = [];
    const cellRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
    let cellMatch;
    while ((cellMatch = cellRegex.exec(trMatch[1])) !== null) {
      // Clean cell content
      let cell = cellMatch[1].trim()
        .replace(/<br\s*\/?>/gi, ' ')
        .replace(/\n/g, ' ')
        .replace(/\s+/g, ' ');
      cells.push(cell);
    }
    if (cells.length > 0) rows.push(cells);
  }
  if (rows.length === 0) return tableHtml;

  const colCount = rows[0].length;
  const filterVal = getFilterValue(colCount);

  let eds = `<div class="table"><div><div></div></div><div><div>${filterVal}</div></div>`;
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
  const relPath = path.relative('/workspace/content', filePath);
  let changed = false;

  // Fix 1: Convert bare <table> to EDS table block (stays inside same section)
  if (content.includes('<table')) {
    content = content.replace(/<table[^>]*>[\s\S]*?<\/table>/gi, (tableHtml) => {
      changed = true;
      return convertTable(tableHtml);
    });
  }

  // Fix 2: Remove bare <div> and </div> lines (WordPress wrappers)
  const beforeDiv = content;
  content = content.replace(/\n<div>\n/g, '\n');
  content = content.replace(/\n<\/div>\n/g, '\n');
  // Also single-line bare divs
  content = content.replace(/^<div>$/gm, '');
  content = content.replace(/^<\/div>$/gm, '');
  if (content !== beforeDiv) changed = true;

  // Fix 3: Remove empty lines
  content = content.replace(/\n\n\n+/g, '\n');

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`  ✅ Fixed: ${relPath}`);
    return true;
  }
  return false;
}

const files = findFiles(CONTENT_DIR, '.plain.html');
console.log(`Scanning ${files.length} news article files...\n`);

let fixedCount = 0;
for (const file of files) {
  if (fixFile(file)) fixedCount++;
}

console.log(`\nDone: ${fixedCount} files fixed.`);
