export default async function decorate(block) {
  const rows = [...block.children];

  // Row 0: config row (classes) — skip if present
  // Rows 1-3: article references (aem-content links)
  // Last row: "View more" link

  const articleRefs = [];
  let viewMoreHref = '';
  const viewMoreText = 'View more';

  rows.forEach((row, idx) => {
    const link = row.querySelector('a');
    if (!link) return;
    const href = link.getAttribute('href') || '';
    if (idx === rows.length - 1) {
      viewMoreHref = href;
    } else {
      articleRefs.push(href);
    }
  });

  // Fetch each article's plain.html to extract title and image
  const articles = await Promise.all(articleRefs.slice(0, 3).map(async (href) => {
    try {
      const cleanHref = href.replace(/\.html$/, '');
      const resp = await fetch(`${cleanHref}.plain.html`);
      if (!resp.ok) return null;
      const html = await resp.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      const h1 = doc.querySelector('h1');
      const title = h1 ? h1.textContent.trim() : '';

      const img = doc.querySelector('img[src]:not([src=""])');
      const imgSrc = img ? img.getAttribute('src') : '';
      const imgAlt = img ? img.getAttribute('alt') || title : title;

      return { href: cleanHref, title, imgSrc, imgAlt };
    } catch {
      return null;
    }
  }));

  // Build the sidebar HTML
  const wrapper = document.createElement('div');
  wrapper.className = 'latest-news-wrapper';

  const heading = document.createElement('h3');
  heading.textContent = 'Latest';
  wrapper.append(heading);

  const list = document.createElement('ul');
  articles.filter(Boolean).forEach((article) => {
    const li = document.createElement('li');

    if (article.imgSrc) {
      const imgLink = document.createElement('a');
      imgLink.href = article.href;
      const img = document.createElement('img');
      img.src = article.imgSrc;
      img.alt = article.imgAlt;
      img.loading = 'lazy';
      img.width = 300;
      img.height = 193;
      imgLink.append(img);
      li.append(imgLink);
    }

    const titleLink = document.createElement('a');
    titleLink.href = article.href;
    titleLink.className = 'latest-news-title';
    titleLink.textContent = article.title;
    li.append(titleLink);

    list.append(li);
  });
  wrapper.append(list);

  if (viewMoreHref) {
    const more = document.createElement('a');
    more.href = viewMoreHref;
    more.className = 'latest-news-more';
    more.textContent = viewMoreText;
    wrapper.append(more);
  }

  block.textContent = '';
  block.append(wrapper);
}
