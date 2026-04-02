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

  // Model fields: first 2 rows are classes and filter (if model is present)
  // Detect by checking if the first row has a single cell with no field:column hint
  let dataStartIndex = 0;
  const firstRowHasFieldHint = rows[0]?.innerHTML?.includes('field:column');

  if (!firstRowHasFieldHint && rows.length > 2) {
    // First 2 rows are model fields: classes (row 0) and filter (row 1)
    const classesValue = rows[0]?.textContent?.trim();
    const filterValue = rows[1]?.textContent?.trim();

    if (classesValue) {
      classesValue.split(',').forEach((c) => {
        const cls = c.trim();
        if (cls) block.classList.add(cls);
      });
    }

    if (filterValue && filterValue.startsWith('table-')) {
      block.classList.add(filterValue.replace('table-', '').replace('-columns', '-columns'));
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
