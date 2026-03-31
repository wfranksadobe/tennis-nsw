export default function decorate(block) {
  const row = block.children[0];
  if (!row) return;

  const cells = [...row.children];
  const titleContent = cells[0]?.innerHTML || '';
  const titleType = cells[1]?.textContent?.trim()?.toLowerCase() || 'h2';

  const validTypes = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
  const tag = validTypes.includes(titleType) ? titleType : 'h2';

  const heading = document.createElement(tag);
  heading.innerHTML = titleContent;

  block.textContent = '';
  block.appendChild(heading);
}
