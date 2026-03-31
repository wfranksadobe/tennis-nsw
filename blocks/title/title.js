export default function decorate(block) {
  const row = block.children[0];
  if (!row) return;

  const cell = row.children[0];
  if (!cell) return;

  block.textContent = '';
  block.innerHTML = cell.innerHTML;
}
