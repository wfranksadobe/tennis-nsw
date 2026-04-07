#!/usr/bin/env node
/**
 * Add <!-- field:column --> hints to first row cells of EDS table blocks.
 */

const fs = require('fs');
const path = require('path');

const CONTENT_DIR = '/workspace/content/nsw';

function findFiles(dir, ext) {
  const results = [];
  for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) results.push(...findFiles(fullPath, ext));
    else if (item.name.endsWith(ext)) results.push(fullPath);
  }
  return results;
}

function addFieldHintsToFirstRow(tableBlockHtml) {
  // Pattern: <div class="table"><div><div>CELL</div>...<div>CELL</div></div>...
  // The first <div> after <div class="table"> is the first row
  // Each <div>CONTENT</div> inside the first row is a cell

  // Find the first row: everything between the first <div> after class="table" and its closing </div>
  const match = tableBlockHtml.match(/^(<div class="table"><div>)([\s\S]*?)(<\/div>)/);
  if (!match) return tableBlockHtml;

  const prefix = match[1]; // <div class="table"><div>
  const firstRowContent = match[2]; // <div>CELL1</div><div>CELL2</div>...
  const closingDiv = match[3];
  const rest = tableBlockHtml.substring(match[0].length);

  // Add <!-- field:column --> to each cell in the first row
  const fixedRow = firstRowContent.replace(/<div>/g, '<div><!-- field:column -->');

  return prefix + fixedRow + closingDiv + rest;
}

const files = findFiles(CONTENT_DIR, '.plain.html');
console.log(`Scanning ${files.length} content files...\n`);

let fixedCount = 0;
for (const filePath of files) {
  let content = fs.readFileSync(filePath, 'utf-8');
  const relPath = path.relative('/workspace/content', filePath);

  if (!content.includes('class="table"') || content.includes('field:column')) continue;

  // Find all table blocks and fix each one
  let changed = false;
  content = content.replace(/<div class="table">[\s\S]*?<\/div><\/div>/g, (tableBlock) => {
    // Extract just the table block (careful with nested divs)
    // The table block is: <div class="table"><div>row1</div><div>row2</div>...</div>
    // We need the first row only
    const firstRowEnd = tableBlock.indexOf('</div>', tableBlock.indexOf('<div class="table"><div>') + 24);
    if (firstRowEnd === -1) return tableBlock;

    const before = tableBlock.substring(0, 24); // <div class="table"><div>
    const match2 = tableBlock.match(/<div class="table"><div>(.*?)<\/div>/);
    if (!match2) return tableBlock;

    const firstRowInner = match2[1];
    const fixedInner = firstRowInner.replace(/<div>/g, '<div><!-- field:column -->');
    if (fixedInner === firstRowInner) return tableBlock;

    changed = true;
    return tableBlock.replace(
      `<div class="table"><div>${firstRowInner}</div>`,
      `<div class="table"><div>${fixedInner}</div>`
    );
  });

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`  ✅ Fixed: ${relPath}`);
    fixedCount++;
  }
}

console.log(`\nDone: ${fixedCount} files fixed.`);
