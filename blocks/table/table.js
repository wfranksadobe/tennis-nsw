/*
 * Table Block
 * Recreate a table
 * https://www.hlx.live/developer/block-collection/table
 */

import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Detect which columns are AEM defaults ("Column2", "Column3", etc.)
 * and return the indices to REMOVE. A column is default-only if EVERY
 * row in that column has text matching /^Column\d+$/ exactly.
 * Empty cells and cells with any other content are kept.
 */
function getColumnsToRemove(rows) {
  if (!rows.length) return new Set();
  const colCount = rows[0].children.length;
  const defaultPattern = /^Column\d+$/;

  const remove = new Set();
  for (let col = 0; col < colCount; col++) {
    let allDefault = true;
    for (const row of rows) {
      const cell = row.children[col];
      if (!cell) continue;
      const text = cell.textContent.trim();
      // Only mark as default if text is literally "ColumnN" — empty or real content keeps it
      if (!defaultPattern.test(text)) {
        allDefault = false;
        break;
      }
    }
    if (allDefault) remove.add(col);
  }
  return remove;
}

/**
 * @param {Element} block
 */
export default async function decorate(block) {
  const rows = [...block.children];

  // Model fields: first 2 rows may be classes and filter config.
  let dataStartIndex = 0;
  const firstRowHasFieldHint = rows[0]?.innerHTML?.includes('field:column');

  // Check if first 2 rows are config (classes + filter)
  const row0FirstCell = rows[0]?.children?.[0]?.textContent?.trim() || '';
  const row1FirstCell = rows[1]?.children?.[0]?.textContent?.trim() || '';
  const filterPattern = /^table(-[\w-]+)?$/;
  const hasFilterRow = rows.length > 2
    && (filterPattern.test(row0FirstCell) || filterPattern.test(row1FirstCell)
      || row0FirstCell === '');

  if (!firstRowHasFieldHint && hasFilterRow && rows.length > 2) {
    const classesValue = rows[0]?.children?.[0]?.textContent?.trim() || '';
    if (classesValue && !classesValue.startsWith('table')) {
      classesValue.split(',').forEach((c) => {
        const cls = c.trim();
        if (cls) block.classList.add(cls);
      });
    }
    dataStartIndex = 2;
  }

  const dataRows = rows.slice(dataStartIndex);
  const header = !block.classList.contains('no-header');

  // Strip AEM default "ColumnN" padding columns
  const removeCols = getColumnsToRemove(dataRows);

  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const tbody = document.createElement('tbody');

  dataRows.forEach((row, i) => {
    const tr = document.createElement('tr');
    moveInstrumentation(row, tr);

    [...row.children].forEach((cell, colIdx) => {
      if (removeCols.has(colIdx)) return; // skip default columns
      const td = document.createElement(i === 0 && header ? 'th' : 'td');
      if (i === 0 && header) td.setAttribute('scope', 'column');
      td.innerHTML = cell.innerHTML;
      tr.append(td);
    });

    if (i === 0 && header) thead.append(tr);
    else tbody.append(tr);
  });

  table.append(thead, tbody);
  block.replaceChildren(table);
}
