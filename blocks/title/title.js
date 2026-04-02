export default function decorate(block) {
  const rows = [...block.children];

  // 5-field model as rows: title, type, link, position, colour
  const titleText = rows[0]?.textContent?.trim() || '';
  const headingType = rows[1]?.textContent?.trim() || 'h2';
  const linkHref = rows[2]?.querySelector('a')?.href || rows[2]?.textContent?.trim() || '';
  const position = rows[3]?.textContent?.trim() || 'left';
  const colour = rows[4]?.textContent?.trim() || 'black';

  // Apply position and colour as CSS classes
  if (position) block.classList.add(position);
  if (colour) block.classList.add(colour);

  // Build the heading element
  const validTypes = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
  const tag = validTypes.includes(headingType) ? headingType : 'h2';
  const heading = document.createElement(tag);

  if (linkHref) {
    const a = document.createElement('a');
    a.href = linkHref;
    a.textContent = titleText;
    heading.append(a);
  } else {
    heading.textContent = titleText;
  }

  block.textContent = '';
  block.append(heading);
}
