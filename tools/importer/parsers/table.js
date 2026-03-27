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
 */
export default function parse(element, { document }) {
  // Extract header row
  // Selector from captured DOM: tr > th
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
      const strong = document.createElement('strong');
      strong.textContent = th.textContent.trim();
      frag.appendChild(strong);
      headerCells.push(frag);
    }
  });

  const cells = [];

  // Add header row
  if (headerCells.length > 0) {
    cells.push(headerCells);
  }

  // Extract data rows
  // Selector from captured DOM: tr.vevent
  const dataRows = element.querySelectorAll('tr.vevent');
  dataRows.forEach((tr) => {
    const tds = Array.from(tr.querySelectorAll('td'));
    const rowCells = [];

    visibleHeaderIndices.forEach((colIndex, cellIdx) => {
      if (colIndex < tds.length) {
        const td = tds[colIndex];
        // Skip hidden description cells
        if (td.classList.contains('hidden') || td.classList.contains('description')) {
          return;
        }

        const frag = document.createDocumentFragment();
        frag.appendChild(document.createComment(' field:column' + (cellIdx + 1) + 'text '));

        // For the Events column (index 2), preserve links and venue info
        if (colIndex === 2) {
          const link = td.querySelector('a.url.summary, a');
          const venue = td.querySelector('span.location');
          if (link) {
            const a = document.createElement('a');
            a.href = link.href;
            a.textContent = link.textContent.trim();
            frag.appendChild(a);
          }
          if (venue) {
            const br = document.createElement('br');
            frag.appendChild(br);
            const span = document.createElement('span');
            span.textContent = 'Venue: ' + venue.textContent.trim();
            frag.appendChild(span);
          }
        } else {
          // For other columns, just use text content
          const span = document.createElement('span');
          span.textContent = td.textContent.trim();
          frag.appendChild(span);
        }

        rowCells.push(frag);
      }
    });

    if (rowCells.length > 0) {
      cells.push(rowCells);
    }
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'table', cells });
  element.replaceWith(block);
}
