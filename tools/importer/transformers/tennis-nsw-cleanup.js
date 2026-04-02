/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: Tennis NSW cleanup.
 * Selectors from captured DOM at https://www.tennis.com.au/nsw/
 */
const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Unwrap noscript tags — preserve fallback images (used by lazy-loaded slides)
    element.querySelectorAll('noscript').forEach((ns) => {
      // Parse noscript innerHTML and move children to parent
      const temp = element.ownerDocument.createElement('div');
      temp.innerHTML = ns.textContent || ns.innerHTML;
      while (temp.firstChild) {
        ns.parentNode.insertBefore(temp.firstChild, ns);
      }
      ns.remove();
    });

    // Remove cookie/tracking/ad elements found in captured DOM
    WebImporter.DOMUtils.remove(element, [
      'iframe[src*="criteo"]',
      'iframe[src*="openx"]',
      'iframe[src*="doubleclick"]',
      '.modal',
      '.gallery--modal',
      '.gallery--modal__overlay',
    ]);

    // Remove tracking pixels (1x1 images from ad networks found in captured DOM)
    const trackingImgs = element.querySelectorAll('img[src*="doubleclick"], img[src*="openx"], img[src*="analytics.yahoo"]');
    trackingImgs.forEach((img) => img.remove());

    // Fix overflow issues if present
    if (element.style && element.style.overflow === 'hidden') {
      element.style.overflow = 'scroll';
    }
  }

  if (hookName === TransformHook.afterTransform) {
    // Remove tournament table section — dynamic data, not suitable for static import
    // md2jcr does not support the 'table' element type
    WebImporter.DOMUtils.remove(element, [
      '.table--blue.tournament',
      '.banner-ranking',
    ]);

    // Remove non-authorable content (header, footer, nav, mobile elements)
    // Selectors from captured DOM: .nav, .footer, .header-mobile, breadcrumbs
    WebImporter.DOMUtils.remove(element, [
      '.nav',
      '.nav__nav-external',
      '.nav__nav-main',
      '.nav__mobile-head',
      '.header-mobile',
      '.footer',
      '.footer__expanded',
      '.footer__basic',
      'link',
      'script',
    ]);

    // Remove flex-direction-nav and flex-control-nav from carousel (slider controls)
    WebImporter.DOMUtils.remove(element, [
      '.flex-direction-nav',
      '.flex-control-nav',
    ]);

    // Remove the background image at top of .main (decorative, not authorable)
    // Found in captured DOM: .main > img (background.png)
    const mainBgImg = element.querySelector(':scope > img[src*="background"]');
    if (mainBgImg) mainBgImg.remove();

    // Remove WordPress metadata line from footer area
    const wpMeta = element.querySelector('em');
    if (wpMeta && wpMeta.textContent.includes('queries in')) {
      wpMeta.remove();
    }

    // Clean up empty divs
    const emptyDivs = element.querySelectorAll('.row-break');
    emptyDivs.forEach((div) => div.remove());

    // Remove data attributes from all elements
    element.querySelectorAll('*').forEach((el) => {
      el.removeAttribute('data-track');
      el.removeAttribute('onclick');
      el.removeAttribute('data-src');
    });
  }
}
