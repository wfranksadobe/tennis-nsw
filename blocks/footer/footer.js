import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  // load footer as fragment
  const footerMeta = getMetadata('footer');
  let footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  if (!footerMeta && window.location.pathname.startsWith('/content/')) {
    const contentRoot = window.location.pathname.split('/').slice(0, 3).join('/');
    footerPath = `${contentRoot}/footer`;
  }
  let fragment = await loadFragment(footerPath);
  // Fallback for local dev where footer may be at /content/footer
  if (!fragment && footerPath !== '/content/footer' && window.location.pathname.startsWith('/content/')) {
    fragment = await loadFragment('/content/footer');
  }

  // decorate footer DOM
  block.textContent = '';
  const footer = document.createElement('div');
  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);

  block.append(footer);
}
