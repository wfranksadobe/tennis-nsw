import { createOptimizedPicture } from '../../scripts/aem.js';

export default async function decorate(block) {
  const rows = [...block.children];

  // First row: GraphQL endpoint URL
  const endpointRow = rows[0];
  const endpointLink = endpointRow?.querySelector('a');
  const endpoint = endpointLink?.href || endpointRow?.textContent?.trim() || '';

  if (!endpoint) {
    block.textContent = 'No GraphQL endpoint configured.';
    return;
  }

  block.textContent = '';

  const loading = document.createElement('p');
  loading.textContent = 'Loading articles...';
  block.append(loading);

  try {
    const resp = await fetch(endpoint);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const json = await resp.json();

    // AEM GraphQL response: { data: { <listName>: { items: [...] } } }
    const dataKey = Object.keys(json.data || {})[0];
    const items = json.data?.[dataKey]?.items || [];

    if (!items.length) {
      block.textContent = 'No articles found.';
      return;
    }

    block.textContent = '';

    // Build cards using the standard cards block structure
    const cardsDiv = document.createElement('div');
    cardsDiv.className = 'cards';

    const ul = document.createElement('ul');

    items.forEach((item) => {
      const li = document.createElement('li');

      // Title
      const title = item.title || item.headline || '';
      if (title) {
        const heading = document.createElement('div');
        heading.className = 'cards-card-heading';
        const h3 = document.createElement('h3');
        h3.textContent = title;
        heading.append(h3);
        li.append(heading);
      }

      // Image
      const imagePath = item.image?._path
        || item.image?._publishUrl
        || item.heroImage?._path
        || item.heroImage?._publishUrl
        || '';
      if (imagePath) {
        const imgDiv = document.createElement('div');
        imgDiv.className = 'cards-card-image';
        const pic = createOptimizedPicture(imagePath, item.imageAlt || title, false, [{ width: '750' }]);
        imgDiv.append(pic);
        li.append(imgDiv);
      }

      // Excerpt / body
      const excerpt = item.excerpt
        || item.description
        || (item.body?.plaintext ? item.body.plaintext.substring(0, 200) : '')
        || '';
      if (excerpt) {
        const bodyDiv = document.createElement('div');
        bodyDiv.className = 'cards-card-body';
        const p = document.createElement('p');
        p.textContent = excerpt.length > 200 ? `${excerpt.substring(0, 200)}...` : excerpt;
        bodyDiv.append(p);
        li.append(bodyDiv);
      }

      // Link
      const articlePath = item.path || item._path || '';
      if (articlePath) {
        const cta = document.createElement('a');
        cta.className = 'cards-card-cta';
        cta.href = articlePath;
        cta.textContent = 'Read more';
        li.append(cta);
      }

      ul.append(li);
    });

    cardsDiv.append(ul);
    block.append(cardsDiv);

    // Load cards CSS
    const cssLink = document.createElement('link');
    cssLink.rel = 'stylesheet';
    cssLink.href = '/blocks/cards/cards.css';
    document.head.append(cssLink);
  } catch (err) {
    block.textContent = `Error loading articles: ${err.message}`;
  }
}
