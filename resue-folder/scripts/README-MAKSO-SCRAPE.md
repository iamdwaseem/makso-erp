# MAKSO Trading product scraper

Scrape product names and categories from [MAKSO General Trading L.L.C](https://maksotrading.com/) (UAE) to feed your ERP inventory.

## Quick start

1. **Run the scraper** (Node 18+):

   ```bash
   node scripts/scrape-maksotrading.mjs
   ```

   This fetches category pages and product pages from maksotrading.com, then writes **`scripts/makso-products.csv`** with columns:

   - `product_name`
   - `category`
   - `description`
   - `source_url`

   A 2-second delay between requests is used to be respectful to the site.

2. **Use the sample CSV** (no scraping):

   `scripts/makso-products-sample.csv` contains a small set of products (featured + cleaning tools) you can use to test import.

## Feeding inventory (ERP)

The backend has a **bulk import** endpoint and a **CLI script** that use the scraped CSV.

### Option A: Backend import script (recommended)

From the **backend** folder:

```bash
cd backend
npm run import:makso
```

This reads `backend/scripts/makso-products.csv` and creates one **Product** + one **Variant** (color = category) per row for the org in `IMPORT_ORGANIZATION_SLUG` (default: `acme-erp`). Ensure DB is migrated and seeded.

To use the full scrape CSV at project root:

```bash
npm run import:makso:full
```

### Option B: Import via API

- **POST /api/inventory/import/products** with body:  
  `{ "products": [ { "name": "Mop-Ringers", "category": "Cleaning Tools", "description": "" } ] }`

The frontend has `api.importProducts(products)`. Requires auth and org (e.g. `x-organization-slug`).

### Option C: Manual / Stock Entry

Use **Stock Entry (GRN)** in the app: “+ New product” mode to add one product at a time.

## Categories scraped

The script hits these category URLs on maksotrading.com:

- Cleaning Tools, Cleaning Chemicals, Towels & Sponge, Trolley and Buckets
- Dispensers, Air Freshner, Garbage Bins, Paper Products
- Cleaning Machines, Disposable Packing, 3M Products
- Offer Products, Branded Products, Hotel Supplies

## Legal / ethics

- Use scraped data for your own inventory/operations only.
- Respect the site’s robots.txt and terms of use.
- The script uses a polite delay; do not reduce it heavily or run it at high frequency.
