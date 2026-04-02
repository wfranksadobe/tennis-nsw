/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards block.
 * Base: cards. Source: https://www.tennis.com.au/nsw/
 * Selector: .promo--row__container .flex-wrapper
 * xwalk model: card (fields: image, text)
 *
 * Variants detected from source DOM:
 *   Standard (3-col): .autoAdjust-3 + .tile--contrast → class="cards"
 *   Compact (2-col, floated image): .autoAdjust-2 + .tile--monotone → class="cards compact blue"
 *   Feature (2-col, large image): .autoAdjust-2 + .tile--monotone → class="cards feature blue"
 *
 * Compact vs Feature detection: if the source has images floated inside
 * the text container it's Compact; if images are direct children of the tile it's Feature.
 * Heuristic: if tile has .promo--row__container__tile__text containing an img, it's Compact.
 */
export default function parse(element, { document }) {
  // Detect variant from source DOM classes
  const section = element.closest('.promo--row') || element.parentElement;
  const isMonotone = section?.classList?.contains('tile--monotone');
  const is2Col = element.classList.contains('autoAdjust-2');

  // Check if images are floated inside text (Compact) vs block-level (Feature)
  const firstTile = element.querySelector('.promo--row__container__tile');
  const textContainer = firstTile?.querySelector('.promo--row__container__tile__text');
  const imgInsideText = textContainer?.querySelector('img');
  const isCompact = is2Col && isMonotone && imgInsideText;
  const isFeature = is2Col && isMonotone && !imgInsideText;

  // Build block name with variant
  let blockName = 'Cards';
  if (isCompact) blockName = 'Cards (compact, blue)';
  else if (isFeature) blockName = 'Cards (feature, blue)';

  // Extract card tiles from source DOM
  const tiles = element.querySelectorAll('.promo--row__container__tile');
  const cells = [];

  tiles.forEach((tile) => {
    // Extract image
    const img = tile.querySelector('img');

    // Build image cell with field hint
    const imageCell = document.createDocumentFragment();
    imageCell.appendChild(document.createComment(' field:image '));
    if (img) {
      const picture = document.createElement('picture');
      const newImg = document.createElement('img');
      newImg.src = img.src;
      newImg.alt = img.alt || img.title || '';
      picture.appendChild(newImg);
      imageCell.appendChild(picture);
    }

    // Extract text content
    const heading = tile.querySelector('.promo--row__container__tile__heading');
    const text = tile.querySelector('.promo--row__container__tile__text');
    const ctaLink = tile.querySelector('a.promo--row__container__tile__button, a[class*="button"]');

    // Build text cell with field hint
    const textCell = document.createDocumentFragment();
    textCell.appendChild(document.createComment(' field:text '));

    if (heading) {
      const h3 = document.createElement('h3');
      h3.textContent = heading.textContent.trim();
      textCell.appendChild(h3);
    }

    if (text) {
      const p = document.createElement('p');
      // For compact variant, text may contain the image — get only the text nodes
      const textContent = Array.from(text.childNodes)
        .filter((n) => n.nodeType === 3 || (n.nodeType === 1 && n.tagName !== 'IMG'))
        .map((n) => n.textContent?.trim())
        .filter(Boolean)
        .join(' ');
      if (textContent) {
        p.textContent = textContent;
        textCell.appendChild(p);
      }
    }

    if (ctaLink) {
      const p = document.createElement('p');
      const a = document.createElement('a');
      a.href = ctaLink.href;
      a.textContent = ctaLink.textContent.trim();
      p.appendChild(a);
      textCell.appendChild(p);
    }

    cells.push([imageCell, textCell]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: blockName, cells });
  element.replaceWith(block);
}
