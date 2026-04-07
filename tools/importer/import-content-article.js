#!/usr/bin/env node
/**
 * Content-Article Page Importer
 * Scrapes Tennis NSW content-article pages and generates .plain.html files
 * for AEM Edge Delivery Services.
 *
 * Usage: node import-content-article.js <url|urls-file> [--output /workspace/content]
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const OUTPUT_DIR = process.argv.includes('--output')
  ? process.argv[process.argv.indexOf('--output') + 1]
  : '/workspace/content';

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        fetchUrl(res.headers.location).then(resolve).catch(reject);
        return;
      }
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

function extractBetween(html, startMarker, endMarker) {
  const startIdx = html.indexOf(startMarker);
  if (startIdx === -1) return '';
  const afterStart = startIdx + startMarker.length;
  const endIdx = html.indexOf(endMarker, afterStart);
  if (endIdx === -1) return html.substring(afterStart);
  return html.substring(afterStart, endIdx);
}

function extractAttr(tag, attr) {
  const re = new RegExp(`${attr}="([^"]*)"`, 'i');
  const m = tag.match(re);
  return m ? m[1] : null;
}

function stripTags(html) {
  return html.replace(/<[^>]+>/g, '').trim();
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function getUrlPath(url) {
  const u = new URL(url);
  return u.pathname.replace(/^\/nsw\//, '').replace(/\/$/, '');
}

function getBreadcrumbLevels(urlPath) {
  return urlPath.split('/').length + 1;
}

function getParentSection(urlPath) {
  return urlPath.split('/')[0];
}

function parsePage(html, url) {
  const result = {
    title: '',
    metaTitle: '',
    metaDescription: '',
    bannerDesktop: null,
    bannerMobile: null,
    alsoInHeading: '',
    alsoInItems: [],
    articleHtml: '',
    cards: [],
  };

  // Meta title
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  if (titleMatch) result.metaTitle = titleMatch[1].trim();

  // Meta description
  const descMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"/i);
  if (descMatch) result.metaDescription = descMatch[1].trim();

  // Page title - from basic-page-title or first h1 in wysiwyg
  const bptMatch = html.match(/<div class="basic-page-title">\s*<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (bptMatch) {
    result.title = stripTags(bptMatch[1]);
  }

  // Banner images
  const bannerSpan = extractBetween(html, 'class="banner-text__background__span"', '</span></span></span>');
  if (bannerSpan) {
    // Desktop: span with data-media containing 768
    const desktopMatch = bannerSpan.match(/data-media="[^"]*768[^"]*"[^>]*data-src="([^"]*)"/);
    if (!desktopMatch) {
      const desktopMatch2 = bannerSpan.match(/data-src="([^"]*)"[^>]*data-media="[^"]*768[^"]*"/);
      if (desktopMatch2) result.bannerDesktop = desktopMatch2[1];
    } else {
      result.bannerDesktop = desktopMatch[1];
    }
    // Mobile: first data-src without data-media
    const spans = bannerSpan.match(/<span[^>]*data-src="([^"]*)"[^>]*>/g);
    if (spans) {
      for (const s of spans) {
        if (!s.includes('data-media')) {
          const m = s.match(/data-src="([^"]*)"/);
          if (m) { result.bannerMobile = m[1]; break; }
        }
      }
    }
  }

  // Also In sidebar
  const navInternal = extractBetween(html, 'class="nav--internal"', '</div><!--/.nav--internal-->');
  if (navInternal || html.includes('internal__heading')) {
    const headingMatch = html.match(/class="internal__heading"[^>]*>([^<]*)</i);
    if (headingMatch) result.alsoInHeading = headingMatch[1].trim();

    const listMatch = html.match(/class="internal__links">([\s\S]*?)<\/ul>/i);
    if (listMatch) {
      const lis = listMatch[1].match(/<li[^>]*>[\s\S]*?<\/li>/gi) || [];
      lis.forEach((li) => {
        const isCurrent = li.includes('class="current"');
        const aMatch = li.match(/<a[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/i);
        const textOnly = stripTags(li);
        if (aMatch && !isCurrent) {
          result.alsoInItems.push({ text: aMatch[2].trim() || textOnly, url: aMatch[1], current: false });
        } else {
          result.alsoInItems.push({ text: textOnly, url: null, current: isCurrent });
        }
      });
    }
  }

  // Article body - extract from .wysiwyg using div depth tracking
  const wysiwygStart = html.indexOf('class="wysiwyg"');
  if (wysiwygStart !== -1) {
    const contentStart = html.indexOf('>', wysiwygStart) + 1;
    // Track div depth to find the matching closing </div>
    let depth = 1;
    let i = contentStart;
    while (i < html.length && depth > 0) {
      const nextOpen = html.indexOf('<div', i);
      const nextClose = html.indexOf('</div>', i);
      if (nextClose === -1) break;
      if (nextOpen !== -1 && nextOpen < nextClose) {
        depth++;
        i = nextOpen + 4;
      } else {
        depth--;
        if (depth === 0) {
          let articleContent = html.substring(contentStart, nextClose).trim();

          // Remove the h1 if we already got it from basic-page-title
          if (result.title) {
            articleContent = articleContent.replace(/<h1[^>]*>[\s\S]*?<\/h1>\s*/i, '');
          } else {
            const h1Match = articleContent.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
            if (h1Match) {
              result.title = stripTags(h1Match[1]);
            }
          }

          result.articleHtml = cleanArticleHtml(articleContent);
        }
        i = nextClose + 6;
      }
    }
  }

  // Card tiles (.promo--row)
  const promoMatches = html.match(/class="promo--row[^"]*"/g);
  if (promoMatches) {
    const promoStart = html.indexOf(promoMatches[0]);
    // Find end by searching for known markers after promo
    let promoEnd = html.indexOf('</div><!--/.promo', promoStart);
    if (promoEnd === -1) promoEnd = html.indexOf('class="footer"', promoStart);
    if (promoEnd === -1) promoEnd = html.length;
    const promoSection = html.substring(promoStart, promoEnd);

    // Extract heading
    const promoHeading = promoSection.match(/section--heading[^>]*>([^<]*)</);
    if (promoHeading) result.cardsHeading = promoHeading[1].trim();

    // Extract tiles by splitting on tile class
    const tileRegex = /tile__heading[^>]*>([\s\S]*?)(?=tile__heading|$)/g;
    let tileMatch;
    while ((tileMatch = tileRegex.exec(promoSection)) !== null) {
      const block = tileMatch[1];
      const card = { title: '', image: null, imageAlt: '', text: '', link: null, linkText: '' };

      // Title is right after the heading class
      const titleClose = tileMatch[1].indexOf('<');
      if (titleClose > 0) card.title = tileMatch[1].substring(0, titleClose).trim();

      const imgMatch = block.match(/<img[^>]*src="([^"]*)"[^>]*(?:alt="([^"]*)")?/i);
      if (imgMatch) { card.image = imgMatch[1]; card.imageAlt = imgMatch[2] || card.title; }

      const textMatch = block.match(/tile__text[^>]*>([\s\S]*?)<\/div>/);
      if (textMatch) card.text = stripTags(textMatch[1]).trim();

      const ctaMatch = block.match(/tile__button[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/i);
      if (ctaMatch) { card.link = ctaMatch[1]; card.linkText = ctaMatch[2].trim(); }
      // Also try generic link inside tile
      if (!ctaMatch) {
        const linkMatch = block.match(/<a[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/i);
        if (linkMatch) { card.link = linkMatch[1]; card.linkText = linkMatch[2].trim(); }
      }

      if (card.title) result.cards.push(card);
    }
  }

  return result;
}

function convertTablesToEdsBlocks(html) {
  // Convert HTML <table> elements to EDS table block format
  // Table block stays INSIDE the article section as a sibling element
  return html.replace(/<table[^>]*>[\s\S]*?<\/table>/gi, (tableHtml) => {
    const rows = [];
    const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    let trMatch;
    while ((trMatch = trRegex.exec(tableHtml)) !== null) {
      const cells = [];
      const cellRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
      let cellMatch;
      while ((cellMatch = cellRegex.exec(trMatch[1])) !== null) {
        cells.push(cellMatch[1].trim());
      }
      if (cells.length > 0) rows.push(cells);
    }
    if (rows.length === 0) return tableHtml;

    const colCount = rows[0].length;
    const filterVal = colCount <= 1 ? 'table' : (colCount >= 6 ? 'table-6-columns' : `table-${colCount}-columns`);

    // Model config rows + data rows, all inside the same section
    let eds = `<div class="table"><div><div></div></div><div><div>${filterVal}</div></div>`;
    rows.forEach((row, rowIdx) => {
      eds += '<div>';
      for (const cell of row) {
        if (rowIdx === 0) {
          eds += `<div><!-- field:column -->${cell}</div>`;
        } else {
          eds += `<div>${cell}</div>`;
        }
      }
      eds += '</div>';
    });
    eds += '</div>';
    return eds;
  });
}

function cleanArticleHtml(html) {
  if (!html) return '';
  // Convert tables first, then clean
  html = convertTablesToEdsBlocks(html);
  return html
    .replace(/<p>\s*<\/p>/g, '')
    .replace(/<p>&nbsp;<\/p>/g, '')
    .replace(/<p>\s*&nbsp;\s*<\/p>/g, '')
    .replace(/<div class="wp-block-spacer[^"]*"[^>]*><\/div>/g, '')
    .replace(/\s+srcset="[^"]*"/gi, '')
    .replace(/\s+sizes="[^"]*"/gi, '')
    .replace(/\s+loading="[^"]*"/gi, '')
    .replace(/\s+decoding="[^"]*"/gi, '')
    .replace(/\s+fetchpriority="[^"]*"/gi, '')
    .replace(/\s+data-[a-z-]+="[^"]*"/gi, '')
    // Keep class on img and table elements, remove from others
    .replace(/(<(?!img|table|t[dhr])[a-z][^>]*)\s+class="[^"]*"/gi, '$1')
    .replace(/(<(?!table|t[dhr])[a-z][^>]*)\s+style="[^"]*"/gi, '$1')
    // Remove role attributes
    .replace(/\s+role="[^"]*"/gi, '')
    // Remove width/height on non-table elements
    .replace(/(<(?!t[dh])[a-z][^>]*)\s+width="[^"]*"/gi, '$1')
    .replace(/(<(?!t[dh])[a-z][^>]*)\s+height="[^"]*"/gi, '$1')
    // Clean whitespace
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .trim();
}

function buildAlsoInHtml(heading, items, currentPageTitle) {
  let html = `<h3>${heading}</h3>\n<ul>\n`;
  items.forEach((item) => {
    const isCurrent = item.current || (!item.url && item.text === currentPageTitle);
    if (isCurrent || !item.url) {
      html += `<li>${item.text}</li>\n`;
    } else {
      html += `<li><a href="${item.url}">${item.text}</a></li>\n`;
    }
  });
  html += '</ul>';
  return html;
}

function buildCardsHtml(cards) {
  if (!cards || cards.length === 0) return null;
  let cardClass = 'cards';
  if (cards.length <= 3 && cards.some((c) => c.image)) {
    cardClass = 'cards feature blue';
  } else if (cards.length > 3) {
    cardClass = 'cards compact blue';
  } else {
    cardClass = 'cards blue';
  }

  let html = `<div class="${cardClass}">`;
  cards.forEach((card) => {
    html += '<div>';
    html += `<div><!-- field:title --><p>${card.title}</p></div>`;
    html += `<div><!-- field:image --><p>${card.image ? `<img src="${card.image}" alt="${card.imageAlt || card.title}">` : ''}</p></div>`;
    html += `<div><!-- field:text --><p>${card.text}</p></div>`;
    html += `<div><!-- field:link --><p>${card.link ? `<a href="${card.link}">${card.linkText}</a>` : ''}</p></div>`;
    html += '</div>';
  });
  html += '</div>';
  return html;
}

function buildPageHtml(data, urlPath) {
  const sections = [];
  const levels = getBreadcrumbLevels(urlPath);

  // Breadcrumb
  sections.push(`<div><div class="breadcrumb"><div><div>${levels}</div></div></div></div>`);

  // Banner
  if (data.bannerDesktop || data.bannerMobile) {
    const d = data.bannerDesktop || data.bannerMobile;
    const m = data.bannerMobile || data.bannerDesktop;
    sections.push(`<div><div class="banner"><div><div><!-- field:desktop --><p><img src="${d}" alt="${data.title} Banner"></p></div></div><div><div><!-- field:mobile --><p><img src="${m}" alt="${data.title} Banner"></p></div></div></div></div>`);
  }

  // Also In
  if (data.alsoInItems.length > 0) {
    const alsoHtml = buildAlsoInHtml(data.alsoInHeading, data.alsoInItems, data.title);
    sections.push(`<div>${alsoHtml}<div class="section-metadata"><div><div>style</div><div>grey</div></div></div></div>`);
  }

  // Article body
  if (data.articleHtml) {
    let article = '<div>';
    if (data.title && !data.articleHtml.includes(`<h1`)) {
      article += `<h1>${data.title}</h1>\n`;
    }
    article += data.articleHtml;
    article += '</div>';
    sections.push(article);
  }

  // Cards
  if (data.cards.length > 0) {
    const cardsHtml = buildCardsHtml(data.cards);
    sections.push(`<div>${cardsHtml}<div class="section-metadata"><div><div>style</div><div>blue</div></div></div></div>`);
  }

  // Metadata
  const metaTitle = data.metaTitle || `${data.title} | Tennis NSW`;
  const metaDesc = data.metaDescription || data.title;
  sections.push(`<div><div class="metadata"><div><div>Title</div><div>${metaTitle}</div></div><div><div>Description</div><div>${metaDesc}</div></div></div></div>`);

  return sections.join('\n') + '\n';
}

async function importUrl(url) {
  const urlPath = getUrlPath(url);
  const outputPath = path.join(OUTPUT_DIR, 'nsw', `${urlPath}.plain.html`);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  try {
    console.log(`  Fetching: ${url}`);
    const html = await fetchUrl(url);
    const data = parsePage(html, url);
    const pageHtml = buildPageHtml(data, urlPath);
    fs.writeFileSync(outputPath, pageHtml, 'utf-8');
    console.log(`  ✅ ${urlPath} (title: ${data.title || 'none'}, also-in: ${data.alsoInItems.length}, banner: ${data.bannerDesktop ? 'yes' : 'no'}, cards: ${data.cards.length})`);
    return { url, path: outputPath, status: 'ok', title: data.title };
  } catch (err) {
    console.error(`  ❌ ${urlPath}: ${err.message}`);
    return { url, path: outputPath, status: 'error', error: err.message };
  }
}

async function main() {
  const input = process.argv[2];
  if (!input) {
    console.error('Usage: node import-content-article.js <url|urls-file>');
    process.exit(1);
  }

  let urls;
  if (input.startsWith('http')) {
    urls = [input];
  } else {
    urls = fs.readFileSync(input, 'utf-8').split('\n').map((l) => l.trim()).filter((l) => l.startsWith('http'));
  }

  console.log(`Importing ${urls.length} content-article pages...\n`);

  const results = [];
  for (const url of urls) {
    const result = await importUrl(url);
    results.push(result);
    // Small delay to be polite
    await new Promise((r) => { setTimeout(r, 500); });
  }

  const ok = results.filter((r) => r.status === 'ok').length;
  const failed = results.filter((r) => r.status === 'error').length;
  console.log(`\n${'='.repeat(50)}`);
  console.log(`Done: ${ok} imported, ${failed} failed out of ${urls.length} total`);

  if (failed > 0) {
    console.log('\nFailed URLs:');
    results.filter((r) => r.status === 'error').forEach((r) => {
      console.log(`  ${r.url}: ${r.error}`);
    });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
