import { getMetadata } from '../../scripts/aem.js';
import { fetchPlaceholders } from '../../scripts/placeholders.js';
import { loadFragment } from '../fragment/fragment.js';

// media query match that indicates mobile/tablet width
const isDesktop = window.matchMedia('(min-width: 900px)');

function closeOnEscape(e) {
  if (e.code === 'Escape') {
    const nav = document.getElementById('nav');
    const navSections = nav.querySelector('.nav-sections');
    const navSectionExpanded = navSections.querySelector('[aria-expanded="true"]');
    if (navSectionExpanded && isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleAllNavSections(navSections);
      navSectionExpanded.focus();
    } else if (!isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav, navSections);
      nav.querySelector('button').focus();
    }
  }
}

function closeOnFocusLost(e) {
  const nav = e.currentTarget;
  if (!nav.contains(e.relatedTarget)) {
    const navSections = nav.querySelector('.nav-sections');
    const navSectionExpanded = navSections.querySelector('[aria-expanded="true"]');
    if (navSectionExpanded && isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleAllNavSections(navSections, false);
    } else if (!isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav, navSections, false);
    }
  }
}

function openOnKeydown(e) {
  const focused = document.activeElement;
  const isNavDrop = focused.className === 'nav-drop';
  if (isNavDrop && (e.code === 'Enter' || e.code === 'Space')) {
    const dropExpanded = focused.getAttribute('aria-expanded') === 'true';
    // eslint-disable-next-line no-use-before-define
    toggleAllNavSections(focused.closest('.nav-sections'));
    focused.setAttribute('aria-expanded', dropExpanded ? 'false' : 'true');
  }
}

function focusNavSection() {
  document.activeElement.addEventListener('keydown', openOnKeydown);
}

/**
 * Toggles all nav sections
 * @param {Element} sections The container element
 * @param {Boolean} expanded Whether the element should be expanded or collapsed
 */
function toggleAllNavSections(sections, expanded = false) {
  sections.querySelectorAll('.nav-sections .default-content-wrapper > ul > li').forEach((section) => {
    section.setAttribute('aria-expanded', expanded);
  });
}

/**
 * Toggles the entire nav
 * @param {Element} nav The container element
 * @param {Element} navSections The nav sections within the container element
 * @param {*} forceExpanded Optional param to force nav expand behavior when not null
 */
function toggleMenu(nav, navSections, forceExpanded = null) {
  const expanded = forceExpanded !== null ? !forceExpanded : nav.getAttribute('aria-expanded') === 'true';
  const button = nav.querySelector('.nav-hamburger button');
  document.body.style.overflowY = (expanded || isDesktop.matches) ? '' : 'hidden';
  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  toggleAllNavSections(navSections, expanded || isDesktop.matches ? 'false' : 'true');
  button.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
  // enable nav dropdown keyboard accessibility
  const navDrops = navSections.querySelectorAll('.nav-drop');
  if (isDesktop.matches) {
    navDrops.forEach((drop) => {
      if (!drop.hasAttribute('tabindex')) {
        drop.setAttribute('tabindex', 0);
        drop.addEventListener('focus', focusNavSection);
      }
    });
  } else {
    navDrops.forEach((drop) => {
      drop.removeAttribute('tabindex');
      drop.removeEventListener('focus', focusNavSection);
    });
  }

  // enable menu collapse on escape keypress
  if (!expanded || isDesktop.matches) {
    // collapse menu on escape press
    window.addEventListener('keydown', closeOnEscape);
    // collapse menu on focus lost
    nav.addEventListener('focusout', closeOnFocusLost);
  } else {
    window.removeEventListener('keydown', closeOnEscape);
    nav.removeEventListener('focusout', closeOnFocusLost);
  }
}

function getDirectTextContent(menuItem) {
  const menuLink = menuItem.querySelector(':scope > :where(a,p)');
  if (menuLink) {
    return menuLink.textContent.trim();
  }
  return Array.from(menuItem.childNodes)
    .filter((n) => n.nodeType === Node.TEXT_NODE)
    .map((n) => n.textContent)
    .join(' ');
}

async function buildBreadcrumbsFromNavTree(nav, currentUrl) {
  const crumbs = [];

  const homeUrl = document.querySelector('.nav-brand a[href]').href;

  let menuItem = Array.from(nav.querySelectorAll('a')).find((a) => a.href === currentUrl);
  if (menuItem) {
    do {
      const link = menuItem.querySelector(':scope > a');
      crumbs.unshift({ title: getDirectTextContent(menuItem), url: link ? link.href : null });
      menuItem = menuItem.closest('ul')?.closest('li');
    } while (menuItem);
  } else if (currentUrl !== homeUrl) {
    crumbs.unshift({ title: getMetadata('og:title'), url: currentUrl });
  }

  const placeholders = await fetchPlaceholders();
  const homePlaceholder = placeholders.breadcrumbsHomeLabel || 'Home';

  crumbs.unshift({ title: homePlaceholder, url: homeUrl });

  // last link is current page and should not be linked
  if (crumbs.length > 1) {
    crumbs[crumbs.length - 1].url = null;
  }
  crumbs[crumbs.length - 1]['aria-current'] = 'page';
  return crumbs;
}

async function buildBreadcrumbs() {
  const breadcrumbs = document.createElement('nav');
  breadcrumbs.className = 'breadcrumbs';

  const crumbs = await buildBreadcrumbsFromNavTree(document.querySelector('.nav-sections'), document.location.href);

  const ol = document.createElement('ol');
  ol.append(...crumbs.map((item) => {
    const li = document.createElement('li');
    if (item['aria-current']) li.setAttribute('aria-current', item['aria-current']);
    if (item.url) {
      const a = document.createElement('a');
      a.href = item.url;
      a.textContent = item.title;
      li.append(a);
    } else {
      li.textContent = item.title;
    }
    return li;
  }));

  breadcrumbs.append(ol);
  return breadcrumbs;
}

/**
 * Decorates a dropdown: adds landing item with house icon,
 * marks items with children for slide-out, hides 3rd-level lists.
 * @param {Element} navSection The top-level <li> with a dropdown
 */
function decorateDropdown(navSection) {
  const topLink = navSection.querySelector(':scope > a');
  const dropdownUl = navSection.querySelector(':scope > ul');
  if (!topLink || !dropdownUl) return;

  const parentText = topLink.textContent.trim();
  const parentHref = topLink.getAttribute('href');

  // 1. Insert landing item (parent name) as first dropdown item — CSS adds house icon via ::before
  const landingLi = document.createElement('li');
  landingLi.className = 'dropdown-landing';
  const landingA = document.createElement('a');
  landingA.href = parentHref;
  landingA.textContent = parentText;
  landingLi.append(landingA);
  dropdownUl.prepend(landingLi);

  // 2. Make top-level link non-navigable (it only toggles the dropdown)
  topLink.setAttribute('href', '#');
  topLink.addEventListener('click', (e) => e.preventDefault());

  // 3. For each 2nd-level item that has a sub-ul, add slide-out class
  //    Also add a landing item to each slide-out panel (with house icon)
  dropdownUl.querySelectorAll(':scope > li').forEach((li) => {
    if (li === landingLi) return;
    const subUl = li.querySelector(':scope > ul');
    if (subUl) {
      li.classList.add('has-slide-out');
      subUl.classList.add('slide-out');

      // Add landing item to slide-out (e.g. house icon + "Membership")
      const subLink = li.querySelector(':scope > a');
      if (subLink) {
        const subLanding = document.createElement('li');
        subLanding.className = 'dropdown-landing';
        const subLandingA = document.createElement('a');
        subLandingA.href = subLink.getAttribute('href');
        subLandingA.textContent = subLink.textContent.trim();
        subLanding.append(subLandingA);
        subUl.prepend(subLanding);
      }
    }
  });
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  // load nav as fragment
  const navMeta = getMetadata('nav');
  let navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  if (!navMeta && window.location.pathname.startsWith('/content/')) {
    // In AEM (Universal Editor), derive content root from JCR path
    // e.g. /content/tennis-nsw/nsw/page → content root is /content/tennis-nsw
    const contentRoot = window.location.pathname.split('/').slice(0, 3).join('/');
    navPath = `${contentRoot}/nav`;
  }
  let fragment = await loadFragment(navPath);
  // Fallback for local dev where nav may be at /content/nav
  if (!fragment && navPath !== '/content/nav' && window.location.pathname.startsWith('/content/')) {
    fragment = await loadFragment('/content/nav');
  }

  // decorate nav DOM
  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';
  while (fragment.firstElementChild) nav.append(fragment.firstElementChild);

  // Strip button decoration from nav links — AEM content wraps links in
  // <p class="button-container"><a class="button"> which breaks nav styling.
  // Unwrap them so the DOM matches the expected li > a structure.
  nav.querySelectorAll('.button-container').forEach((p) => {
    const a = p.querySelector('a');
    if (a) {
      a.classList.remove('button');
      p.replaceWith(a);
    }
  });

  // assign classes to the three fragment sections
  const classes = ['brand', 'sections', 'tools'];
  classes.forEach((c, i) => {
    const section = nav.children[i];
    if (section) section.classList.add(`nav-${c}`);
  });

  // --- Brand decoration ---
  const navBrand = nav.querySelector('.nav-brand');
  if (navBrand) {
    // Ensure brand link has the logo image (AEM content may not include it)
    const brandLink = navBrand.querySelector('a[href]');
    if (brandLink && !brandLink.querySelector('img')) {
      const logo = document.createElement('img');
      logo.src = '/icons/ta-logo.svg';
      logo.alt = 'Tennis Australia';
      logo.loading = 'eager';
      brandLink.append(logo);
    }

    // Create NSW badge — find the <p> that has just text (no img/link inside)
    const wrapper = navBrand.querySelector('.default-content-wrapper');
    if (wrapper) {
      const badgeParagraph = [...wrapper.querySelectorAll(':scope > p')].find(
        (p) => !p.querySelector('img') && !p.querySelector('a') && p.textContent.trim(),
      );
      if (badgeParagraph) {
        const badgeText = badgeParagraph.textContent.trim();
        badgeParagraph.remove();
        const badge = document.createElement('span');
        badge.className = 'nav-brand-badge';
        badge.textContent = badgeText;
        wrapper.append(badge);
      }
    }
  }

  // --- Sections decoration (main nav items) ---
  const navSections = nav.querySelector('.nav-sections');
  if (navSections) {
    navSections.querySelectorAll(':scope .default-content-wrapper > ul > li').forEach((navSection) => {
      if (navSection.querySelector('ul')) {
        navSection.classList.add('nav-drop');
        // Decorate dropdown: landing item, slide-outs, hide 3rd level
        decorateDropdown(navSection);
      }
      navSection.addEventListener('click', (e) => {
        if (isDesktop.matches) {
          // Only toggle dropdown when clicking the top-level nav link, not dropdown items
          const topLink = navSection.querySelector(':scope > a');
          if (e.target === topLink || e.target === navSection) {
            const expanded = navSection.getAttribute('aria-expanded') === 'true';
            toggleAllNavSections(navSections);
            navSection.setAttribute('aria-expanded', expanded ? 'false' : 'true');
            e.preventDefault();
          }
        }
      });

      // Desktop: open dropdown on hover
      navSection.addEventListener('mouseenter', () => {
        if (isDesktop.matches) {
          toggleAllNavSections(navSections);
          navSection.setAttribute('aria-expanded', 'true');
        }
      });
    });

    // Desktop: close all dropdowns when mouse leaves the nav sections area
    navSections.addEventListener('mouseleave', () => {
      if (isDesktop.matches) {
        toggleAllNavSections(navSections);
      }
    });
  }

  // --- Tools decoration (split into utility bar + actions) ---
  const navTools = nav.querySelector('.nav-tools');
  let utilityBar = null;
  let navActions = null;

  if (navTools) {
    const toolsWrapper = navTools.querySelector('.default-content-wrapper');
    const lists = toolsWrapper ? toolsWrapper.querySelectorAll(':scope > ul') : [];

    // First list = utility/portal links -> top bar
    if (lists[0]) {
      utilityBar = document.createElement('div');
      utilityBar.className = 'nav-utility-bar';
      const utilityContainer = document.createElement('div');
      utilityContainer.className = 'nav-utility-container';

      // Portal links wrapper
      const portalLinks = document.createElement('div');
      portalLinks.className = 'nav-portal-links';
      portalLinks.append(lists[0]);
      utilityContainer.append(portalLinks);

      // Social links wrapper (email, facebook, twitter)
      const socialLinks = document.createElement('div');
      socialLinks.className = 'nav-social-links';
      socialLinks.innerHTML = `<ul>
        <li><a class="social-email" href="/nsw/contacts" aria-label="Contact us"></a></li>
        <li><a class="social-facebook" href="https://www.facebook.com/TennisNSW" target="_blank" rel="noopener noreferrer" aria-label="Facebook"></a></li>
        <li><a class="social-twitter" href="https://www.twitter.com/tennis_nsw" target="_blank" rel="noopener noreferrer" aria-label="Twitter"></a></li>
      </ul>`;
      utilityContainer.append(socialLinks);

      utilityBar.append(utilityContainer);
    }

    // Second list = action links (search + start playing)
    if (lists[1]) {
      navActions = document.createElement('div');
      navActions.className = 'nav-actions';

      // Decorate search link — icon rendered via CSS ::before with tennis icon font
      const searchLink = lists[1].querySelector('a[href*="search"]');
      if (searchLink) {
        searchLink.className = 'nav-search-toggle';
        searchLink.setAttribute('aria-label', 'Search');
        searchLink.textContent = '';
      }

      // Decorate Start Playing link — two-line layout like live site
      const startLink = lists[1].querySelector('a[href*="play"]');
      if (startLink) {
        startLink.className = 'nav-start-playing';
        const smaller = document.createElement('span');
        smaller.className = 'smaller';
        smaller.textContent = 'Playing';
        startLink.textContent = 'Start ';
        startLink.append(smaller);
      }

      navActions.append(lists[1]);
    }

    // Remove the original tools section from nav
    navTools.remove();
  }

  // --- Build two-tier structure ---
  // Utility bar at top
  if (utilityBar) nav.prepend(utilityBar);

  // Main bar wrapper
  const mainBar = document.createElement('div');
  mainBar.className = 'nav-main-bar';

  // Hamburger for mobile
  const hamburger = document.createElement('div');
  hamburger.classList.add('nav-hamburger');
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
      <span class="nav-hamburger-icon"></span>
    </button>`;
  hamburger.addEventListener('click', () => toggleMenu(nav, navSections));
  mainBar.append(hamburger);

  if (navBrand) mainBar.append(navBrand);
  if (navSections) mainBar.append(navSections);
  if (navActions) mainBar.append(navActions);

  nav.append(mainBar);
  nav.setAttribute('aria-expanded', 'false');

  // prevent mobile nav behavior on window resize
  toggleMenu(nav, navSections, isDesktop.matches);
  isDesktop.addEventListener('change', () => toggleMenu(nav, navSections, isDesktop.matches));

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);

  if (getMetadata('breadcrumbs').toLowerCase() === 'true') {
    navWrapper.append(await buildBreadcrumbs());
  }
}
