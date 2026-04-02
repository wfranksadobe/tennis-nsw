export default function decorate(block) {
  const row = block.children[0];
  if (!row) return;

  const titleCell = row.children[0];
  if (!titleCell) return;

  // Position and colour are CSS classes via the 'classes' multiselect field
  // Default to left if no position set
  const hasPosition = block.classList.contains('left')
    || block.classList.contains('center')
    || block.classList.contains('right');
  if (!hasPosition) block.classList.add('left');

  // Default to black if no colour set
  const hasColour = block.classList.contains('black')
    || block.classList.contains('white')
    || block.classList.contains('blue');
  if (!hasColour) block.classList.add('black');

  block.textContent = '';
  block.innerHTML = titleCell.innerHTML;
}
