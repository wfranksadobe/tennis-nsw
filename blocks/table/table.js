/*
 * Table Block
 * Recreate a table
 * https://www.hlx.live/developer/block-collection/table
 */

import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * @param {Element} block
 */
export default async function decorate(block) {
  const rows = [...block.children];

  // Model fields: first 2 rows may be classes and filter config.
  // Detect config rows by checking for field:column hints OR table-* filter pattern.
  let dataStartIndex = 0;
  const firstRowHasFieldHint = rows[0]?.innerHTML?.includes('field:column');

  // Check if any of the first 2 rows contain a table filter value (e.g. "table-6-columns")
  // On AEM, config rows may have filter value in first cell with defaults in other cells
  const row0Text = rows[0]?.textContent?.trim() || '';
  const row1Text = rows[1]?.textContent?.trim() || '';
  const row0FirstCell = rows[0]?.children?.[0]?.textContent?.trim() || '';
  const row1FirstCell = rows[1]?.children?.[0]?.textContent?.trim() || '';
  const filterPattern = /^table(-[\w-]+)?$/;
  const hasFilterRow = rows.length > 2
    && (filterPattern.test(row0Text) || filterPattern.test(row0FirstCell)
      || filterPattern.test(row1Text) || filterPattern.test(row1FirstCell)
      || row0Text === '' || row0FirstCell === '');

  if (!firstRowHasFieldHint && hasFilterRow && rows.length > 2) {
    // First 2 rows are model fields: classes (row 0) and filter (row 1)
    const classesValue = rows[0]?.textContent?.trim();
    const filterValue = rows[1]?.textContent?.trim();

    if (classesValue && !classesValue.startsWith('table')) {
      classesValue.split(',').forEach((c) => {
        const cls = c.trim();
        if (cls) block.classList.add(cls);
      });
    }

    if (filterValue && filterValue.startsWith('table')) {
      // Config rows detected — skip them
    }

    dataStartIndex = 2;
  }

  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const tbody = document.createElement('tbody');
  const header = !block.classList.contains('no-header');

  rows.slice(dataStartIndex).forEach((row, i) => {
    const tr = document.createElement('tr');
    moveInstrumentation(row, tr);

    [...row.children].forEach((cell) => {
      const td = document.createElement(i === 0 && header ? 'th' : 'td');

      if (i === 0) td.setAttribute('scope', 'column');
      td.innerHTML = cell.innerHTML;
      tr.append(td);
    });
    if (i === 0 && header) thead.append(tr);
    else tbody.append(tr);
  });
  table.append(thead, tbody);
  block.replaceChildren(table);
}
