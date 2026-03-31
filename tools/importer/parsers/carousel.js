/* eslint-disable */
/* global WebImporter */

/**
 * Parser for carousel block.
 * Base: carousel. Source: https://www.tennis.com.au/nsw/
 * Selector: .banner-article.banner-slider
 * xwalk model: carousel-item (fields: media_image, media_imageAlt [collapsed], content_text)
 *
 * Block library structure: 2 columns per row.
 *   Col 1: Image (mandatory)
 *   Col 2: Text content (optional - heading, description, CTA)
 *
 * Source DOM structure:
 *   .banner-article.banner-slider > ul.slides > li
 *     Each li contains: a.banner-text > div.banner-text__background > span > span > img
 *     Link href = destination URL, img alt = slide description
 */
export default function parse(element, { document }) {
  // Extract slides from the source carousel
  // Selector from captured DOM: ul.slides > li
  const slideElements = element.querySelectorAll(':scope > ul.slides > li, :scope ul.slides > li');
  const cells = [];

  slideElements.forEach((slide) => {
    // Extract image from slide
    // Captured DOM: li > a.banner-text > div.banner-text__background > span > span > img
    const img = slide.querySelector('img');
    const link = slide.querySelector('a.banner-text, a[href]');

    // Build image cell with field hint
    const imageCell = document.createDocumentFragment();
    imageCell.appendChild(document.createComment(' field:media_image '));
    if (img) {
      const picture = document.createElement('picture');
      const newImg = document.createElement('img');
      newImg.src = img.src;
      newImg.alt = img.alt || '';
      picture.appendChild(newImg);
      imageCell.appendChild(picture);
    }

    // Build content cell with field hint (link text or title as content)
    const contentCell = document.createDocumentFragment();
    contentCell.appendChild(document.createComment(' field:content_text '));
    if (link) {
      const linkTitle = link.getAttribute('title') || '';
      if (linkTitle) {
        const p = document.createElement('p');
        const a = document.createElement('a');
        a.href = link.href;
        a.textContent = linkTitle;
        p.appendChild(a);
        contentCell.appendChild(p);
      }
    }

    cells.push([imageCell, contentCell]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'carousel', cells });
  element.replaceWith(block);
}
