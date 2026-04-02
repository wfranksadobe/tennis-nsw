/* eslint-disable */
/* global WebImporter */

/**
 * Parser for table block.
 * Base: table. Source: https://www.tennis.com.au/nsw/
 * Selector: .table--blue.tournament
 * xwalk model: table (6 columns — Start, End, Events, Category, Surface, Region)
 *
 * Block library structure: multiple columns and rows.
 *   Row 1: Block name "table"
 *   Row 2: Header row (column headings)
 *   Rows 3+: Data rows
 *
 * Source DOM structure:
 *   table.table--blue.tournament > tbody > tr
 *     First tr contains th elements (header row)
 *     Subsequent tr.vevent contain td elements (data rows)
 *     Hidden td.description cells should be skipped
 *
 * xwalk model: table-col-6 requires exactly 6 richtext fields per row
 *   (column1text through column6text). Every row MUST have all 6 cells,
 *   even if some are empty.
 */
export default function parse(element, { document }) {
  // Extract header row
  const headerRow = element.querySelector('tr');
  const headers = headerRow ? Array.from(headerRow.querySelectorAll('th')) : [];

  // Filter out hidden columns (description column has class "hidden")
  const visibleHeaderIndices = [];
  const headerCells = [];

  headers.forEach((th, index) => {
    if (!th.classList.contains('hidden') && !th.classList.contains('description')) {
      visibleHeaderIndices.push(index);
      const frag = document.createDocumentFragment();
      frag.appendChild(document.createComment(' field:column' + (headerCells.length + 1) + 'text '));
      const p = document.createElement('p');
      const strong = document.createElement('strong');
      strong.textContent = th.textContent.trim();
      p.appendChild(strong);
      frag.appendChild(p);
      headerCells.push(frag);
    }
  });

  const cells = [];

  // Pad header row to exactly 6 cells
  while (headerCells.length < 6) {
    const frag = document.createDocumentFragment();
    frag.appendChild(document.createComment(' field:column' + (headerCells.length + 1) + 'text '));
    const p = document.createElement('p');
    frag.appendChild(p);
    headerCells.push(frag);
  }

  // Add header row
  if (headerCells.length > 0) {
    cells.push(headerCells);
  }

  // Extract data rows
  const dataRows = element.querySelectorAll('tr.vevent');
  dataRows.forEach((tr) => {
    const tds = Array.from(tr.querySelectorAll('td'));
    const rowCells = [];

    visibleHeaderIndices.forEach((colIndex, cellIdx) => {
      const frag = document.createDocumentFragment();
      frag.appendChild(document.createComment(' field:column' + (cellIdx + 1) + 'text '));

      if (colIndex < tds.length) {
        const td = tds[colIndex];

        // Skip hidden/description cells but still emit an empty cell
        if (td.classList.contains('hidden') || td.classList.contains('description')) {
          const p = document.createElement('p');
          frag.appendChild(p);
          rowCells.push(frag);
          return;
        }

        // For the Events column (index 2), use <ul><li> for green triangle marker
        if (colIndex === 2) {
          const link = td.querySelector('a.url.summary, a');
          const venue = td.querySelector('span.location');
          if (link) {
            const ul = document.createElement('ul');
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = link.href;
            a.textContent = link.textContent.trim();
            li.appendChild(a);
            ul.appendChild(li);
            frag.appendChild(ul);
          }
          if (venue) {
            const p = document.createElement('p');
            p.textContent = 'Venue: ' + venue.textContent.trim();
            frag.appendChild(p);
          }
          if (!link && !venue) {
            const p = document.createElement('p');
            p.textContent = td.textContent.trim();
            frag.appendChild(p);
          }
        } else {
          // For other columns, wrap in <p> for richtext compatibility
          const p = document.createElement('p');
          p.textContent = td.textContent.trim();
          frag.appendChild(p);
        }
      } else {
        // Row has fewer cells than headers — emit empty cell
        const p = document.createElement('p');
        frag.appendChild(p);
      }

      rowCells.push(frag);
    });

    // Pad row to exactly 6 cells if needed
    while (rowCells.length < 6) {
      const frag = document.createDocumentFragment();
      frag.appendChild(document.createComment(' field:column' + (rowCells.length + 1) + 'text '));
      const p = document.createElement('p');
      frag.appendChild(p);
      rowCells.push(frag);
    }

    if (rowCells.length > 0) {
      cells.push(rowCells);
    }
  });

  // Use variant name to signal 6-column filter to md2jcr converter
  const block = WebImporter.Blocks.createBlock(document, { name: 'Table (6 Columns)', cells });
  element.replaceWith(block);
}
