export default function decorate(block) {
  const rows = [...block.children];

  // Model field: levels (how many breadcrumb segments to show)
  const maxLevels = parseInt(rows[0]?.textContent?.trim(), 10) || 5;

  // Build breadcrumb from URL path
  const path = window.location.pathname;
  const segments = path.split('/').filter(Boolean);

  // Build crumb items from path segments
  const crumbs = [];
  let href = '';
  segments.forEach((segment) => {
    href += `/${segment}`;
    const label = segment
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
    crumbs.push({ label, href });
  });

  // First crumb should be "Tennis NSW" pointing to /nsw
  if (crumbs.length > 0 && crumbs[0].href === '/nsw') {
    crumbs[0].label = 'Tennis NSW';
  }

  // Trim to max levels (from the end)
  const visibleCrumbs = crumbs.slice(Math.max(0, crumbs.length - maxLevels));

  // Build the breadcrumb HTML
  const nav = document.createElement('nav');
  nav.setAttribute('aria-label', 'Breadcrumb');
  const ol = document.createElement('ol');

  visibleCrumbs.forEach((crumb, idx) => {
    const li = document.createElement('li');
    if (idx === visibleCrumbs.length - 1) {
      // Last item: plain text (current page)
      li.textContent = crumb.label;
      li.setAttribute('aria-current', 'page');
    } else {
      const a = document.createElement('a');
      a.href = crumb.href;
      a.textContent = crumb.label;
      li.append(a);
    }
    ol.append(li);
  });

  nav.append(ol);
  block.textContent = '';
  block.append(nav);
}
