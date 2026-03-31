/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards block.
 * Base: cards. Source: https://www.tennis.com.au/nsw/
 * Selector: .promo--row__container .flex-wrapper
 * xwalk model: card (fields: image, text)
 *
 * Block library structure: 2 columns per row.
 *   Col 1: Image
 *   Col 2: Text content (heading, description, CTA link)
 *
 * Source DOM structure:
 *   .flex-wrapper.autoAdjust-3 > .promo--row__container__tile (×3)
 *     Each tile contains:
 *       .promo--row__container__tile__heading (title text)
 *       img (card image)
 *       .promo--row__container__tile__text (excerpt)
 *       a.promo--row__container__tile__button (Read more CTA)
 */
export default function parse(element, { document }) {
  // Extract card tiles from source DOM
  // Selector from captured DOM: .promo--row__container__tile
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
      p.textContent = text.textContent.trim();
      textCell.appendChild(p);
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

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards', cells });
  element.replaceWith(block);
}
