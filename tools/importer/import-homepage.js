/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import carouselParser from './parsers/carousel.js';
import cardsParser from './parsers/cards.js';
import tableParser from './parsers/table.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/tennis-nsw-cleanup.js';
import sectionsTransformer from './transformers/tennis-nsw-sections.js';

// PARSER REGISTRY
const parsers = {
  'carousel': carouselParser,
  'cards': cardsParser,
  'table': tableParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'homepage',
  description: 'Tennis NSW homepage with hero, latest news, upcoming tournaments, partner logos, and acknowledgement section',
  urls: [
    'https://www.tennis.com.au/nsw/',
  ],
  blocks: [
    {
      name: 'carousel',
      instances: ['.banner-article.banner-slider'],
    },
    {
      name: 'cards',
      instances: ['.promo--row__container .flex-wrapper'],
    },
    {
      name: 'table',
      instances: ['.table--blue.tournament'],
    },
  ],
  sections: [
    {
      id: 'section-1-hero',
      name: 'Hero Banner Slider',
      selector: '.banner-article.banner-slider',
      style: null,
      blocks: ['carousel'],
      defaultContent: [],
    },
    {
      id: 'section-2-latest-news',
      name: 'Latest News',
      selector: '.promo--row.bg--blue',
      style: 'blue',
      blocks: ['cards'],
      defaultContent: ['.promo--row__container__section--heading', '.promo--row__link'],
    },
    {
      id: 'section-3-tournaments',
      name: 'Upcoming Tournaments',
      selector: '.banner-ranking',
      style: null,
      blocks: ['table'],
      defaultContent: ['.banner-ranking__container__section-heading', '.banner-ranking__container__more'],
    },
    {
      id: 'section-4-partners',
      name: 'Partners',
      selector: '.two-column',
      style: null,
      blocks: [],
      defaultContent: ['.two-column .wysiwyg h2', '.two-column .wysiwyg img', '.two-column .wysiwyg a'],
    },
    {
      id: 'section-5-acknowledgement',
      name: 'Acknowledgement',
      selector: '.has-text-align-center',
      style: null,
      blocks: [],
      defaultContent: ['.has-text-align-center em'],
    },
  ],
};

// TRANSFORMER REGISTRY
const transformers = [
  cleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [sectionsTransformer] : []),
];

/**
 * Execute all page transformers for a specific hook
 */
function executeTransformers(hookName, element, payload) {
  const enhancedPayload = {
    ...payload,
    template: PAGE_TEMPLATE,
  };
  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

/**
 * Find all blocks on the page based on the embedded template configuration
 */
function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      if (elements.length === 0) {
        console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
      }
      elements.forEach((element) => {
        pageBlocks.push({
          name: blockDef.name,
          selector,
          element,
          section: blockDef.section || null,
        });
      });
    });
  });
  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

// EXPORT DEFAULT CONFIGURATION
export default {
  transform: (payload) => {
    const { document, url, html, params } = payload;
    const main = document.body;

    // 1. Execute beforeTransform (initial cleanup)
    executeTransformers('beforeTransform', main, payload);

    // 2. Find blocks on page using embedded template
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. Parse each block using registered parsers
    pageBlocks.forEach((block) => {
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      } else {
        console.warn(`No parser found for block: ${block.name}`);
      }
    });

    // 4. Execute afterTransform (final cleanup + section breaks/metadata)
    executeTransformers('afterTransform', main, payload);

    // 5. Apply WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. Generate sanitized path
    let pathname = new URL(params.originalURL).pathname;
    if (pathname.endsWith('/')) {
      pathname = pathname + 'index';
    }
    pathname = pathname.replace(/\.html$/, '');
    const path = WebImporter.FileUtils.sanitizePath(pathname || '/nsw/index');

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
