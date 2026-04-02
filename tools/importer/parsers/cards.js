/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards block.
 * 4-field model: title, image, text, link
 *
 * Variants detected from source DOM:
 *   Standard: .autoAdjust-3 + .tile--contrast → class="cards"
 *   Compact: .autoAdjust-2 + .tile--monotone + img in text → class="cards compact blue"
 *   Feature: .autoAdjust-2 + .tile--monotone + direct img → class="cards feature blue"
 */
export default function parse(element, { document }) {
  const section = element.closest('.promo--row') || element.parentElement;
  const isMonotone = section?.classList?.contains('tile--monotone');
  const is2Col = element.classList.contains('autoAdjust-2');

  const firstTile = element.querySelector('.promo--row__container__tile');
  const textContainer = firstTile?.querySelector('.promo--row__container__tile__text');
  const imgInsideText = textContainer?.querySelector('img');
  const isCompact = is2Col && isMonotone && imgInsideText;
  const isFeature = is2Col && isMonotone && !imgInsideText;

  let blockName = 'Cards';
  if (isCompact) blockName = 'Cards (compact, blue)';
  else if (isFeature) blockName = 'Cards (feature, blue)';

  const tiles = element.querySelectorAll('.promo--row__container__tile');
  const cells = [];

  tiles.forEach((tile) => {
    // Field 1: Title (plain text)
    const heading = tile.querySelector('.promo--row__container__tile__heading');
    const titleCell = document.createDocumentFragment();
    titleCell.appendChild(document.createComment(' field:title '));
    if (heading) {
      const p = document.createElement('p');
      p.textContent = heading.textContent.trim();
      titleCell.appendChild(p);
    }

    // Field 2: Image
    const img = tile.querySelector('img');
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

    // Field 3: Text (description only, no heading, no CTA)
    const text = tile.querySelector('.promo--row__container__tile__text');
    const textCell = document.createDocumentFragment();
    textCell.appendChild(document.createComment(' field:text '));
    if (text) {
      const textContent = Array.from(text.childNodes)
        .filter((n) => n.nodeType === 3 || (n.nodeType === 1 && n.tagName !== 'IMG'))
        .map((n) => n.textContent?.trim())
        .filter(Boolean)
        .join(' ');
      if (textContent) {
        const p = document.createElement('p');
        p.textContent = textContent;
        textCell.appendChild(p);
      }
    }

    // Field 4: Link (CTA URL as plain text)
    const ctaLink = tile.querySelector('a.promo--row__container__tile__button, a[class*="button"]');
    const linkCell = document.createDocumentFragment();
    linkCell.appendChild(document.createComment(' field:link '));
    if (ctaLink) {
      const p = document.createElement('p');
      const a = document.createElement('a');
      a.href = ctaLink.href;
      a.textContent = ctaLink.textContent.trim();
      p.appendChild(a);
      linkCell.appendChild(p);
    }

    cells.push([titleCell, imageCell, textCell, linkCell]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: blockName, cells });
  element.replaceWith(block);
}
