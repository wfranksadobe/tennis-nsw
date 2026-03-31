export default function decorate(block) {
  const row = block.children[0];
  if (!row) return;

  const cell = row.children[0];
  if (!cell) return;

  // Apply colour from UE property (data-title-color attribute)
  const color = block.dataset.titleColor;
  if (color) block.classList.add(color);

  block.textContent = '';
  block.innerHTML = cell.innerHTML;
}
