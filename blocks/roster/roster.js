import tableDecorate from '../table/table.js';

export default function decorate(block) {
  tableDecorate(block);

  // Reversed variant: swap column order (text first, image second)
  if (block.classList.contains('reversed')) {
    block.querySelectorAll('table tbody tr').forEach((tr) => {
      if (tr.cells.length >= 2) {
        const first = tr.cells[0];
        const second = tr.cells[1];
        tr.append(first); // move first cell to end
      }
    });
  }
}
