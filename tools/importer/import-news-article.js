#!/usr/bin/env node
/**
 * News Article Page Importer
 * Scrapes Tennis NSW news articles and generates .plain.html files.
 *
 * News article structure:
 *   - h1 title (uppercase, thin, blue — via global styles)
 *   - Byline: date | author
 *   - Inline hero image
 *   - Article body (paragraphs, headings, lists, images, embeds)
 *   - Metadata
 *
 * No banner, no Also In, no card tiles.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const OUTPUT_DIR = '/workspace/content';

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        fetchUrl(res.headers.location).then(resolve).catch(reject);
        return;
      }
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function stripTags(html) {
  return html.replace(/<[^>]+>/g, '').trim();
}

function cleanArticleHtml(html) {
  if (!html) return '';
  return html
    .replace(/<p>\s*<\/p>/g, '')
    .replace(/<p>&nbsp;<\/p>/g, '')
    .replace(/<p>\s*&nbsp;\s*<\/p>/g, '')
    // Remove social share buttons
    .replace(/<a class="st_[^"]*"[^>]*><\/a>/g, '')
    // Remove Outlook copy-paste wrappers
    .replace(/<div class="x_elementToProof"[^>]*>/g, '')
    .replace(/<\/div>/g, (match, offset, str) => {
      // Only remove closing divs that were elementToProof wrappers
      return match;
    })
    // Remove WordPress spacers
    .replace(/<div class="wp-block-spacer[^"]*"[^>]*><\/div>/g, '')
    // Clean attributes
    .replace(/\s+srcset="[^"]*"/gi, '')
    .replace(/\s+sizes="[^"]*"/gi, '')
    .replace(/\s+loading="[^"]*"/gi, '')
    .replace(/\s+decoding="[^"]*"/gi, '')
    .replace(/\s+fetchpriority="[^"]*"/gi, '')
    .replace(/\s+data-[a-z-]+="[^"]*"/gi, '')
    .replace(/(<(?!img|table|t[dhr]|iframe)[a-z][^>]*)\s+class="[^"]*"/gi, '$1')
    .replace(/(<(?!table|t[dhr]|iframe)[a-z][^>]*)\s+style="[^"]*"/gi, '$1')
    .replace(/\s+role="[^"]*"/gi, '')
    .replace(/(<(?!t[dh])[a-z][^>]*)\s+width="[^"]*"/gi, '$1')
    .replace(/(<(?!t[dh])[a-z][^>]*)\s+height="[^"]*"/gi, '$1')
    // Remove empty spans
    .replace(/<span>\s*([^<]*)\s*<\/span>/g, '$1')
    // Remove Cloudflare email protection
    .replace(/<a href="\/cdn-cgi\/l\/email-protection[^"]*">[^<]*<\/a>/g, '')
    // Clean whitespace
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .trim();
}

function parsePage(html) {
  const result = {
    title: '',
    metaTitle: '',
    metaDescription: '',
    byline: '',
    articleHtml: '',
  };

  // Meta title
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  if (titleMatch) result.metaTitle = titleMatch[1].trim();

  // Meta description
  const descMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"/i);
  if (descMatch) result.metaDescription = descMatch[1].trim();

  // Page title from h1
  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (h1Match) result.title = stripTags(h1Match[1]);

  // Article body from .wysiwyg
  const wysiwygStart = html.indexOf('class="wysiwyg"');
  if (wysiwygStart !== -1) {
    const contentStart = html.indexOf('>', wysiwygStart) + 1;
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
          result.articleHtml = cleanArticleHtml(articleContent);
        }
        i = nextClose + 6;
      }
    }
  }

  // Extract byline (first paragraph — typically "date | author")
  const bylineMatch = result.articleHtml.match(/^<p>\s*(\d{1,2}\s+\w+\s+\d{4}\s*\|[^<]*)/i);
  if (bylineMatch) {
    result.byline = bylineMatch[1].trim();
    // Remove byline from article body
    result.articleHtml = result.articleHtml.replace(/^<p>\s*\d{1,2}\s+\w+\s+\d{4}\s*\|[^<]*<\/p>\s*/i, '');
  }

  return result;
}

function getUrlPath(url) {
  return new URL(url).pathname.replace(/^\/nsw\//, '').replace(/\/$/, '');
}

function buildPageHtml(data, urlPath) {
  const sections = [];

  // Article section with title, byline, and body
  let article = '<div>';
  article += `<h1>${data.title}</h1>\n`;
  if (data.byline) {
    article += `<p><em>${data.byline}</em></p>\n`;
  }
  article += data.articleHtml;
  article += '<div class="section-metadata"><div><div>style</div><div>white</div></div></div></div>';
  sections.push(article);

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
    const data = parsePage(html);
    const pageHtml = buildPageHtml(data, urlPath);
    fs.writeFileSync(outputPath, pageHtml, 'utf-8');
    console.log(`  ✅ ${urlPath} (title: ${(data.title || 'none').substring(0, 50)})`);
    return { url, path: outputPath, status: 'ok' };
  } catch (err) {
    console.error(`  ❌ ${urlPath}: ${err.message}`);
    return { url, path: outputPath, status: 'error', error: err.message };
  }
}

async function main() {
  const input = process.argv[2];
  if (!input) {
    console.error('Usage: node import-news-article.js <url|urls-file>');
    process.exit(1);
  }

  let urls;
  if (input.startsWith('http')) {
    urls = [input];
  } else {
    urls = fs.readFileSync(input, 'utf-8').split('\n').map(l => l.trim()).filter(l => l.startsWith('http'));
  }

  console.log(`Importing ${urls.length} news articles...\n`);
  const results = [];
  for (const url of urls) {
    const result = await importUrl(url);
    results.push(result);
    await new Promise(r => setTimeout(r, 300));
  }

  const ok = results.filter(r => r.status === 'ok').length;
  const failed = results.filter(r => r.status === 'error').length;
  console.log(`\n${'='.repeat(50)}`);
  console.log(`Done: ${ok} imported, ${failed} failed out of ${urls.length} total`);
  if (failed > 0) {
    console.log('\nFailed:');
    results.filter(r => r.status === 'error').forEach(r => console.log(`  ${r.url}: ${r.error}`));
  }
}

main().catch(console.error);
