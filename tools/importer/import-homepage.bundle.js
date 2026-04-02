var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-homepage.js
  var import_homepage_exports = {};
  __export(import_homepage_exports, {
    default: () => import_homepage_default
  });

  // tools/importer/parsers/carousel.js
  function parse(element, { document }) {
    const slideElements = element.querySelectorAll(":scope > ul.slides > li, :scope ul.slides > li");
    const cells = [];
    slideElements.forEach((slide) => {
      const img = slide.querySelector("img");
      const link = slide.querySelector("a.banner-text, a[href]");
      const imageCell = document.createDocumentFragment();
      imageCell.appendChild(document.createComment(" field:media_image "));
      if (img) {
        const picture = document.createElement("picture");
        const newImg = document.createElement("img");
        newImg.src = img.src;
        newImg.alt = img.alt || "";
        picture.appendChild(newImg);
        imageCell.appendChild(picture);
      }
      const contentCell = document.createDocumentFragment();
      contentCell.appendChild(document.createComment(" field:content_text "));
      if (link) {
        const linkTitle = link.getAttribute("title") || "";
        if (linkTitle) {
          const p = document.createElement("p");
          const a = document.createElement("a");
          a.href = link.href;
          a.textContent = linkTitle;
          p.appendChild(a);
          contentCell.appendChild(p);
        }
      }
      cells.push([imageCell, contentCell]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "carousel", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards.js
  function parse2(element, { document }) {
    const section = element.closest(".promo--row") || element.parentElement;
    const isMonotone = section?.classList?.contains("tile--monotone");
    const is2Col = element.classList.contains("autoAdjust-2");
    const firstTile = element.querySelector(".promo--row__container__tile");
    const textContainer = firstTile?.querySelector(".promo--row__container__tile__text");
    const imgInsideText = textContainer?.querySelector("img");
    const isCompact = is2Col && isMonotone && imgInsideText;
    const isFeature = is2Col && isMonotone && !imgInsideText;
    let blockName = "Cards";
    if (isCompact) blockName = "Cards (compact, blue)";
    else if (isFeature) blockName = "Cards (feature, blue)";
    const tiles = element.querySelectorAll(".promo--row__container__tile");
    const cells = [];
    tiles.forEach((tile) => {
      const heading = tile.querySelector(".promo--row__container__tile__heading");
      const titleCell = document.createDocumentFragment();
      titleCell.appendChild(document.createComment(" field:title "));
      if (heading) {
        const p = document.createElement("p");
        p.textContent = heading.textContent.trim();
        titleCell.appendChild(p);
      }
      const img = tile.querySelector("img");
      const imageCell = document.createDocumentFragment();
      imageCell.appendChild(document.createComment(" field:image "));
      if (img) {
        const picture = document.createElement("picture");
        const newImg = document.createElement("img");
        newImg.src = img.src;
        newImg.alt = img.alt || img.title || "";
        picture.appendChild(newImg);
        imageCell.appendChild(picture);
      }
      const text = tile.querySelector(".promo--row__container__tile__text");
      const textCell = document.createDocumentFragment();
      textCell.appendChild(document.createComment(" field:text "));
      if (text) {
        const textContent = Array.from(text.childNodes).filter((n) => n.nodeType === 3 || n.nodeType === 1 && n.tagName !== "IMG").map((n) => n.textContent?.trim()).filter(Boolean).join(" ");
        if (textContent) {
          const p = document.createElement("p");
          p.textContent = textContent;
          textCell.appendChild(p);
        }
      }
      const ctaLink = tile.querySelector('a.promo--row__container__tile__button, a[class*="button"]');
      const linkCell = document.createDocumentFragment();
      linkCell.appendChild(document.createComment(" field:link "));
      if (ctaLink) {
        const p = document.createElement("p");
        const a = document.createElement("a");
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

  // tools/importer/parsers/table.js
  function parse3(element, { document }) {
    const headerRow = element.querySelector("tr");
    const headers = headerRow ? Array.from(headerRow.querySelectorAll("th")) : [];
    const visibleHeaderIndices = [];
    const headerCells = [];
    headers.forEach((th, index) => {
      if (!th.classList.contains("hidden") && !th.classList.contains("description")) {
        visibleHeaderIndices.push(index);
        const frag = document.createDocumentFragment();
        frag.appendChild(document.createComment(" field:column" + (headerCells.length + 1) + "text "));
        const p = document.createElement("p");
        const strong = document.createElement("strong");
        strong.textContent = th.textContent.trim();
        p.appendChild(strong);
        frag.appendChild(p);
        headerCells.push(frag);
      }
    });
    const cells = [];
    while (headerCells.length < 6) {
      const frag = document.createDocumentFragment();
      frag.appendChild(document.createComment(" field:column" + (headerCells.length + 1) + "text "));
      const p = document.createElement("p");
      frag.appendChild(p);
      headerCells.push(frag);
    }
    if (headerCells.length > 0) {
      cells.push(headerCells);
    }
    const dataRows = element.querySelectorAll("tr.vevent");
    dataRows.forEach((tr) => {
      const tds = Array.from(tr.querySelectorAll("td"));
      const rowCells = [];
      visibleHeaderIndices.forEach((colIndex, cellIdx) => {
        const frag = document.createDocumentFragment();
        frag.appendChild(document.createComment(" field:column" + (cellIdx + 1) + "text "));
        if (colIndex < tds.length) {
          const td = tds[colIndex];
          if (td.classList.contains("hidden") || td.classList.contains("description")) {
            const p = document.createElement("p");
            frag.appendChild(p);
            rowCells.push(frag);
            return;
          }
          if (colIndex === 2) {
            const link = td.querySelector("a.url.summary, a");
            const venue = td.querySelector("span.location");
            if (link) {
              const ul = document.createElement("ul");
              const li = document.createElement("li");
              const a = document.createElement("a");
              a.href = link.href;
              a.textContent = link.textContent.trim();
              li.appendChild(a);
              ul.appendChild(li);
              frag.appendChild(ul);
            }
            if (venue) {
              const p = document.createElement("p");
              p.textContent = "Venue: " + venue.textContent.trim();
              frag.appendChild(p);
            }
            if (!link && !venue) {
              const p = document.createElement("p");
              p.textContent = td.textContent.trim();
              frag.appendChild(p);
            }
          } else {
            const p = document.createElement("p");
            p.textContent = td.textContent.trim();
            frag.appendChild(p);
          }
        } else {
          const p = document.createElement("p");
          frag.appendChild(p);
        }
        rowCells.push(frag);
      });
      while (rowCells.length < 6) {
        const frag = document.createDocumentFragment();
        frag.appendChild(document.createComment(" field:column" + (rowCells.length + 1) + "text "));
        const p = document.createElement("p");
        frag.appendChild(p);
        rowCells.push(frag);
      }
      if (rowCells.length > 0) {
        cells.push(rowCells);
      }
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "Table (6 Columns)", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/tennis-nsw-cleanup.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      element.querySelectorAll("noscript").forEach((ns) => {
        const temp = element.ownerDocument.createElement("div");
        temp.innerHTML = ns.textContent || ns.innerHTML;
        while (temp.firstChild) {
          ns.parentNode.insertBefore(temp.firstChild, ns);
        }
        ns.remove();
      });
      WebImporter.DOMUtils.remove(element, [
        'iframe[src*="criteo"]',
        'iframe[src*="openx"]',
        'iframe[src*="doubleclick"]',
        ".modal",
        ".gallery--modal",
        ".gallery--modal__overlay"
      ]);
      const trackingImgs = element.querySelectorAll('img[src*="doubleclick"], img[src*="openx"], img[src*="analytics.yahoo"], img[src*="facebook.com/tr"]');
      trackingImgs.forEach((img) => img.remove());
      if (element.style && element.style.overflow === "hidden") {
        element.style.overflow = "scroll";
      }
    }
    if (hookName === TransformHook.afterTransform) {
      WebImporter.DOMUtils.remove(element, [
        ".nav",
        ".nav__nav-external",
        ".nav__nav-main",
        ".nav__mobile-head",
        ".header-mobile",
        ".footer",
        ".footer__expanded",
        ".footer__basic",
        "link",
        "script"
      ]);
      WebImporter.DOMUtils.remove(element, [
        ".flex-direction-nav",
        ".flex-control-nav"
      ]);
      const mainBgImg = element.querySelector(':scope > img[src*="background"]');
      if (mainBgImg) mainBgImg.remove();
      const wpMeta = element.querySelector("em");
      if (wpMeta && wpMeta.textContent.includes("queries in")) {
        wpMeta.remove();
      }
      const emptyDivs = element.querySelectorAll(".row-break");
      emptyDivs.forEach((div) => div.remove());
      element.querySelectorAll("*").forEach((el) => {
        el.removeAttribute("data-track");
        el.removeAttribute("onclick");
        el.removeAttribute("data-src");
      });
    }
  }

  // tools/importer/transformers/tennis-nsw-sections.js
  var TransformHook2 = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function transform2(hookName, element, payload) {
    if (hookName === TransformHook2.afterTransform) {
      const { document } = payload;
      const template = payload.template;
      if (!template || !template.sections || template.sections.length < 2) return;
      const sections = template.sections;
      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        const selectorList = Array.isArray(section.selector) ? section.selector : [section.selector];
        let sectionEl = null;
        for (const sel of selectorList) {
          sectionEl = element.querySelector(sel);
          if (sectionEl) break;
        }
        if (!sectionEl) continue;
        if (section.style) {
          const metaBlock = WebImporter.Blocks.createBlock(document, {
            name: "Section Metadata",
            cells: { style: section.style }
          });
          sectionEl.after(metaBlock);
        }
        if (i > 0) {
          const hr = document.createElement("hr");
          sectionEl.before(hr);
        }
      }
    }
  }

  // tools/importer/import-homepage.js
  var parsers = {
    "carousel": parse,
    "cards": parse2,
    "table": parse3
  };
  var PAGE_TEMPLATE = {
    name: "homepage",
    description: "Tennis NSW homepage with hero, latest news, upcoming tournaments, partner logos, and acknowledgement section",
    urls: [
      "https://www.tennis.com.au/nsw/"
    ],
    blocks: [
      {
        name: "carousel",
        instances: [".banner-article.banner-slider"]
      },
      {
        name: "cards",
        instances: [".promo--row__container .flex-wrapper"]
      },
      {
        name: "table",
        instances: [".table--blue.tournament"]
      }
    ],
    sections: [
      {
        id: "section-1-hero",
        name: "Hero Banner Slider",
        selector: ".banner-article.banner-slider",
        style: null,
        blocks: ["carousel"],
        defaultContent: []
      },
      {
        id: "section-2-latest-news",
        name: "Latest News",
        selector: ".promo--row.bg--blue",
        style: "blue",
        blocks: ["cards"],
        defaultContent: [".promo--row__container__section--heading", ".promo--row__link"]
      },
      {
        id: "section-3-tournaments",
        name: "Upcoming Tournaments",
        selector: ".banner-ranking",
        style: null,
        blocks: ["table"],
        defaultContent: [".banner-ranking__container__section-heading", ".banner-ranking__container__more"]
      },
      {
        id: "section-4-partners",
        name: "Partners",
        selector: ".two-column",
        style: null,
        blocks: [],
        defaultContent: [".two-column .wysiwyg h2", ".two-column .wysiwyg img", ".two-column .wysiwyg a"]
      },
      {
        id: "section-5-acknowledgement",
        name: "Acknowledgement",
        selector: ".has-text-align-center",
        style: null,
        blocks: [],
        defaultContent: [".has-text-align-center em"]
      }
    ]
  };
  var transformers = [
    transform,
    ...PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [transform2] : []
  ];
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = {
      ...payload,
      template: PAGE_TEMPLATE
    };
    transformers.forEach((transformerFn) => {
      try {
        transformerFn.call(null, hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
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
            section: blockDef.section || null
          });
        });
      });
    });
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }
  var import_homepage_default = {
    transform: (payload) => {
      const { document, url, html, params } = payload;
      const main = document.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
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
      executeTransformers("afterTransform", main, payload);
      const hr = document.createElement("hr");
      main.appendChild(hr);
      WebImporter.rules.createMetadata(main, document);
      WebImporter.rules.transformBackgroundImages(main, document);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      let pathname = new URL(params.originalURL).pathname;
      pathname = pathname.replace(/\/$/, "").replace(/\.html$/, "");
      const path = WebImporter.FileUtils.sanitizePath(pathname || "/nsw");
      return [{
        element: main,
        path,
        report: {
          title: document.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_homepage_exports);
})();
