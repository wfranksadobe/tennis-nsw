#!/usr/bin/env node
/**
 * Fix broken image URLs in content files by scraping current images
 * from the live Tennis NSW site and replacing 404 URLs.
 */

const fs = require('fs');
const https = require('https');

const CONTENT_DIR = '/workspace/content';

// Load broken URLs
const brokenUrls = fs.readFileSync('/tmp/broken-urls.txt', 'utf-8')
  .split('\n')
  .filter(Boolean)
  .map(line => {
    const parts = line.trim().split(/\s+/);
    return parts.length >= 2 ? parts[1] : parts[0];
  })
  .filter(u => u && u.startsWith('http'));

console.log(`Loaded ${brokenUrls.length} broken URLs\n`);

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
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

function extractImages(html) {
  const images = {};
  // Extract all image URLs from the page
  const imgRegex = /(?:src|data-src)="(https:\/\/www\.tennis\.com\.au\/nsw\/files\/[^"]+)"/gi;
  let match;
  while ((match = imgRegex.exec(html)) !== null) {
    const url = match[1];
    // Key by filename (without size suffix)
    const filename = url.split('/').pop().replace(/-\d+x\d+(\.\w+)$/, '$1');
    if (!images[filename]) images[filename] = [];
    images[filename].push(url);
  }
  return images;
}

async function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  const relPath = filePath.replace(CONTENT_DIR + '/', '');

  // Find broken URLs in this file
  const fileBroken = brokenUrls.filter(url => content.includes(url));
  if (fileBroken.length === 0) return 0;

  // Determine the source page URL
  const pagePath = relPath.replace('.plain.html', '').replace('nsw/', '');
  const sourceUrl = `https://www.tennis.com.au/nsw/${pagePath}`;

  console.log(`\n${relPath}: ${fileBroken.length} broken URLs`);
  console.log(`  Fetching: ${sourceUrl}`);

  let html;
  try {
    html = await fetchUrl(sourceUrl);
  } catch (e) {
    console.log(`  ❌ Failed to fetch: ${e.message}`);
    return 0;
  }

  const currentImages = extractImages(html);
  let fixed = 0;

  for (const brokenUrl of fileBroken) {
    // Try to find a matching image on the current page
    const brokenFilename = brokenUrl.split('/').pop();
    const brokenBase = brokenFilename.replace(/-\d+x\d+(\.\w+)$/, '$1');

    // Look for a match by base filename
    let replacement = null;

    // First try exact base match
    if (currentImages[brokenBase]) {
      // Pick the best size - prefer 700x450, then any sized, then unsized
      const candidates = currentImages[brokenBase];
      replacement = candidates.find(u => u.includes('700x450'))
        || candidates.find(u => /-\d+x\d+/.test(u))
        || candidates[0];
    }

    // If no match, try partial filename match
    if (!replacement) {
      const brokenWords = brokenBase.toLowerCase().replace(/\.\w+$/, '').split(/[-_]/);
      for (const [key, urls] of Object.entries(currentImages)) {
        const keyWords = key.toLowerCase().replace(/\.\w+$/, '').split(/[-_]/);
        const overlap = brokenWords.filter(w => keyWords.includes(w) && w.length > 3);
        if (overlap.length >= 2) {
          replacement = urls[0];
          break;
        }
      }
    }

    if (replacement && replacement !== brokenUrl) {
      content = content.split(brokenUrl).join(replacement);
      console.log(`  ✅ ${brokenFilename} → ${replacement.split('/').pop()}`);
      fixed++;
    } else {
      // Remove the broken image reference entirely
      // If it's in a card image field, leave empty
      // If it's a banner, leave empty
      // If it's an inline <img>, remove the <p><img></p>
      const imgTag = `<img src="${brokenUrl}"`;
      if (content.includes(`<p>${imgTag}`)) {
        // Inline image paragraph - remove entire <p>
        content = content.replace(new RegExp(`<p><img[^>]*src="${brokenUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*/?></p>`, 'g'), '');
        console.log(`  🗑️  Removed inline: ${brokenFilename}`);
        fixed++;
      } else if (content.includes(`<!-- field:image --><p>${imgTag}`)) {
        // Card image field - clear to empty
        content = content.replace(new RegExp(`<!-- field:image --><p><img[^>]*src="${brokenUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*/?>`, 'g'), '<!-- field:image --><p>');
        console.log(`  🗑️  Cleared card image: ${brokenFilename}`);
        fixed++;
      } else if (content.includes(`<!-- field:desktop --><p>${imgTag}`) || content.includes(`<!-- field:mobile --><p>${imgTag}`)) {
        // Banner image - clear to empty
        content = content.replace(new RegExp(`(<!-- field:(?:desktop|mobile) --><p>)<img[^>]*src="${brokenUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*/?>`, 'g'), '$1');
        console.log(`  🗑️  Cleared banner: ${brokenFilename}`);
        fixed++;
      } else {
        console.log(`  ⚠️  No replacement found, kept: ${brokenFilename}`);
      }
    }
  }

  if (fixed > 0) {
    fs.writeFileSync(filePath, content, 'utf-8');
  }
  return fixed;
}

async function main() {
  // Find all affected files
  const affectedFiles = fs.readFileSync('/tmp/affected-files.txt', 'utf-8')
    .split('\n')
    .filter(Boolean)
    .map(f => `${CONTENT_DIR}/${f}`);

  let totalFixed = 0;
  for (const file of affectedFiles) {
    const fixed = await processFile(file);
    totalFixed += fixed;
    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`Done: ${totalFixed} broken URLs fixed across ${affectedFiles.length} files`);

  // Verify no broken URLs remain
  let remaining = 0;
  for (const file of affectedFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    for (const url of brokenUrls) {
      if (content.includes(url)) remaining++;
    }
  }
  console.log(`Remaining broken URLs: ${remaining}`);
}

main().catch(console.error);
