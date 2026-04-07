#!/usr/bin/env node
/**
 * Fix table blocks: strip all config rows, then add exactly one correct pair.
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

function getFilterValue(colCount) {
  if (colCount <= 1) return 'table';
  if (colCount >= 6) return 'table-6-columns';
  return `table-${colCount}-columns`;
}

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  const relPath = path.relative('/workspace/content', filePath);

  if (!content.includes('class="table"')) return false;

  // Step 1: Strip ALL config row pairs from every table block
  // Config rows are: <div><div></div></div><div><div>table*</div></div>
  const configRowPattern = /<div><div><\/div><\/div><div><div>(?:table(?:-\d+-columns)?)<\/div><\/div>/g;
  let stripped = content.replace(configRowPattern, '');

  // Step 2: For each table block, count columns in first data row and insert config rows
  let result = stripped;
  const tableStarts = [];
  let searchPos = 0;
  while (true) {
    const idx = result.indexOf('<div class="table">', searchPos);
    if (idx === -1) break;
    tableStarts.push(idx);
    searchPos = idx + 19;
  }

  // Process from end to start so indices don't shift
  for (let t = tableStarts.length - 1; t >= 0; t--) {
    const tStart = tableStarts[t];
    const afterTag = tStart + 19; // length of '<div class="table">'

    // First data row starts immediately: <div><div>...cell...</div><div>...cell...</div></div>
    // Find the first row's content
    const firstRowStart = result.indexOf('<div>', afterTag);
    if (firstRowStart !== afterTag) continue; // unexpected structure

    // Find end of first row by tracking depth
    let depth = 1;
    let i = firstRowStart + 5;
    while (i < result.length && depth > 0) {
      const nextOpen = result.indexOf('<div>', i);
      const nextClose = result.indexOf('</div>', i);
      if (nextClose === -1) break;
      if (nextOpen !== -1 && nextOpen < nextClose) {
        depth++;
        i = nextOpen + 5;
      } else {
        depth--;
        i = nextClose + 6;
      }
    }
    const firstRowEnd = i;
    const firstRowContent = result.substring(firstRowStart + 5, firstRowEnd - 6); // strip outer <div>...</div>

    // Count cells (each <div> in the row content)
    const cellCount = (firstRowContent.match(/<div>/g) || []).length;
    if (cellCount === 0) continue;

    const filterVal = getFilterValue(cellCount);
    const configRows = `<div><div></div></div><div><div>${filterVal}</div></div>`;

    // Insert config rows right after <div class="table">
    result = result.substring(0, afterTag) + configRows + result.substring(afterTag);
  }

  if (result !== content) {
    fs.writeFileSync(filePath, result, 'utf-8');
    console.log(`  ✅ Fixed: ${relPath} (${tableStarts.length} tables)`);
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

console.log(`\nDone: ${fixedCount} files fixed.`);

// Verify: run idempotency check
let issues = 0;
for (const file of files) {
  const content = fs.readFileSync(file, 'utf-8');
  const matches = content.match(/<div><div><\/div><\/div><div><div>table/g);
  if (matches && matches.length > (content.match(/class="table"/g) || []).length) {
    console.log(`  ⚠️  Extra config rows in: ${path.relative('/workspace/content', file)}`);
    issues++;
  }
}
if (issues === 0) console.log('\n✅ Idempotency check passed — no duplicates.');
