import tableDecorate from '../table/table.js';

export default function decorate(block) {
  tableDecorate(block);

  // Reversed variant: swap column order (text first, image second)
  if (block.classList.contains('reversed')) {
    block.querySelectorAll('table tbody tr').forEach((tr) => {
      if (tr.cells.length >= 2) {
        tr.append(tr.cells[0]); // move first cell to end
      }
    });
  }
}
