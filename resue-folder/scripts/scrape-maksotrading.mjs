/**
 * Scrape product names and categories from MAKSO General Trading (maksotrading.com)
 * for use as inventory seed data. Outputs CSV: product_name, category, description, source_url
 *
 * Usage (Node 18+):
 *   node scripts/scrape-maksotrading.mjs
 *
 * Respects rate limiting with delays. Output: scripts/makso-products.csv
 */

import { createWriteStream } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const DELAY_MS = 2000;
const OUT_PATH = join(__dirname, "makso-products.csv");

const CATEGORY_URLS = [
  "https://maksotrading.com/product-category/cleaning-tools/",
  "https://maksotrading.com/product-category/cleaning-chemicals/",
  "https://maksotrading.com/product-category/towels-sponge/",
  "https://maksotrading.com/product-category/trolley-and-buckets/",
  "https://maksotrading.com/product-category/dispensers/",
  "https://maksotrading.com/product-category/air-freshner/",
  "https://maksotrading.com/product-category/garbage-bins/",
  "https://maksotrading.com/product-category/paper-products/",
  "https://maksotrading.com/product-category/cleaning-machines/",
  "https://maksotrading.com/product-category/disposable-packing/",
  "https://maksotrading.com/product-category/3m-products/",
  "https://maksotrading.com/product-category/offer-products/",
  "https://maksotrading.com/product-category/branded-products/",
  "https://maksotrading.com/product-category/hotel-supplies/",
];

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function escapeCsv(val) {
  if (val == null) return "";
  const s = String(val).replace(/"/g, '""');
  return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s}"` : s;
}

/** Extract product links from a category listing page HTML */
function getProductLinksFromCategoryHtml(html, categorySlug) {
  const links = [];
  const regex = /href="(https?:\/\/[^"]*\/product\/[^/]+\/?)"/gi;
  let m;
  while ((m = regex.exec(html)) !== null) {
    const url = m[1].replace(/&#038;/g, "&").split("?")[0];
    if (!links.includes(url)) links.push(url);
  }
  const nameRegex = /<a[^>]*href="https?:\/\/[^"]*\/product\/[^/]+\/?"[^>]*>([^<]+)<\/a>/gi;
  const namesByUrl = {};
  while ((m = nameRegex.exec(html)) !== null) {
    const name = m[1].replace(/&amp;/g, "&").trim();
    const urlMatch = html.indexOf(m[0]);
    const hrefMatch = html.substring(0, urlMatch).lastIndexOf('href="');
    const url = html.slice(hrefMatch + 6, html.indexOf('"', hrefMatch + 6)).replace(/&#038;/g, "&").split("?")[0];
    if (name && !name.toLowerCase().includes("add to wishlist")) namesByUrl[url] = name;
  }
  return { links, namesByUrl };
}

/** Extract product name and description from a product page HTML */
function getProductDetailsFromHtml(html) {
  let name = "";
  let description = "";
  const titleMatch = html.match(/<h1[^>]*class="[^"]*product_title[^"]*"[^>]*>([\s\S]*?)<\/h1>/i) || html.match(/<title>([^<]+)<\/title>/);
  if (titleMatch) name = titleMatch[1].replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim().split(" - ")[0];
  const shortDesc = html.match(/<div[^>]*class="[^"]*short-description[^"]*"[\s\S]*?<\/div>/i) || html.match(/<div[^>]*class="[^"]*woocommerce-product-details__short-description[^"]*"[\s\S]*?<\/div>/i);
  if (shortDesc) description = shortDesc[0].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 500);
  return { name, description };
}

async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; ERP scraper; +https://github.com)" },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`${url} ${res.status}`);
  return res.text();
}

async function main() {
  const seen = new Set();
  const rows = [];
  const stream = createWriteStream(OUT_PATH, { encoding: "utf8" });
  stream.write("product_name,category,description,source_url\n");

  for (const categoryUrl of CATEGORY_URLS) {
    const categorySlug = categoryUrl.split("/").filter(Boolean).pop() || "uncategorized";
    const categoryName = categorySlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    console.log(`Fetching category: ${categoryName}...`);
    try {
      const html = await fetchHtml(categoryUrl);
      await sleep(DELAY_MS);
      const { links, namesByUrl } = getProductLinksFromCategoryHtml(html, categorySlug);
      for (const productUrl of links) {
        if (seen.has(productUrl)) continue;
        seen.add(productUrl);
        const listName = namesByUrl[productUrl] || "";
        try {
          const productHtml = await fetchHtml(productUrl);
          await sleep(DELAY_MS);
          const { name, description } = getProductDetailsFromHtml(productHtml);
          const productName = name || listName || productUrl.split("/").filter(Boolean).pop()?.replace(/-/g, " ") || "Unknown";
          const desc = description ? escapeCsv(description) : "";
          const line = `${escapeCsv(productName)},${escapeCsv(categoryName)},${desc},${escapeCsv(productUrl)}\n`;
          stream.write(line);
          rows.push({ productName, categoryName });
          console.log(`  + ${productName}`);
        } catch (e) {
          if (listName) {
            const line = `${escapeCsv(listName)},${escapeCsv(categoryName)},,${escapeCsv(productUrl)}\n`;
            stream.write(line);
            rows.push({ productName: listName, categoryName });
            console.log(`  + ${listName} (from list)`);
          }
        }
      }
    } catch (e) {
      console.warn(`  Skip category ${categoryUrl}: ${e.message}`);
    }
  }

  stream.end();
  await new Promise((r) => stream.on("finish", r));
  console.log(`\nWrote ${rows.length} products to ${OUT_PATH}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
